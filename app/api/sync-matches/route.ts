import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getCurrentSeasonId,
  fetchUpcomingEvents,
  fetchFinishedEvents,
  fetchTournamentStandings,
  parseEvents,
} from '@/lib/sofascore'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'
import { SEASON } from '@/lib/config'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const seasonId = await getCurrentSeasonId()

    // Fetch both upcoming and recently finished events
    const [upcoming, finished] = await Promise.all([
      fetchUpcomingEvents(seasonId),
      fetchFinishedEvents(seasonId),
    ])

    // Merge — finished events may have score updates for rows already in DB
    const all = [...upcoming, ...finished]
    const parsed = parseEvents(all)

    const { error } = await supabaseAdmin
      .from('matches')
      .upsert(parsed, { onConflict: 'external_id' })

    if (error) throw new Error(error.message ?? JSON.stringify(error))

    // Ensure per-week synthetic tournament match rows exist for tournament-level bets
    const weekNumbers = [...new Set(parsed.map(m => m.week).filter(w => w > 0))]
    for (const week of weekNumbers) {
      const tournamentMatchId = getTournamentFinalistsMatchId(week)
      const { data: existing } = await supabaseAdmin
        .from('matches')
        .select('id')
        .eq('id', tournamentMatchId)
        .single()

      if (!existing) {
        const weekMatches = parsed.filter(m => m.week === week)
        const firstMatch = weekMatches.length > 0
          ? weekMatches.reduce((earliest, m) => m.match_date < earliest.match_date ? m : earliest)
          : null

        const { error: tournamentError } = await supabaseAdmin
          .from('matches')
          .insert({
            id: tournamentMatchId,
            external_id: tournamentMatchId,
            season: SEASON.year,
            week,
            status: 'upcoming',
            player_home: 'TBD',
            player_away: 'TBD',
            match_date: firstMatch?.match_date ?? new Date().toISOString(),
            round_name: 'Tournament',
          })

        if (tournamentError) throw new Error(tournamentError.message ?? JSON.stringify(tournamentError))
      }
    }

    // Sync tournament standings
    const standings = await fetchTournamentStandings(seasonId)
    if (standings.length > 0) {
      const standingRows = standings.map(s => ({
        season: SEASON.year,
        position: s.position,
        player: s.player,
        played: s.played,
        won: s.won,
        points: s.points,
      }))
      await supabaseAdmin
        .from('tournament_standings')
        .upsert(standingRows, { onConflict: 'season,player' })
    }

    return NextResponse.json({
      synced: parsed.length,
      upcoming: upcoming.length,
      finished: finished.length,
      standings: standings.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('Sync error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}