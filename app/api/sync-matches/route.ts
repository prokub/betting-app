import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getCurrentSeasonId,
  fetchUpcomingEvents,
  fetchFinishedEvents,
  parseEvents,
} from '@/lib/sofascore'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'

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

    // Ensure the synthetic tournament match row exists for tournament-level bets
    // Only create it if it doesn't already exist — evaluate may have updated it to 'finished'
    const tournamentMatchId = getTournamentFinalistsMatchId()
    const { data: existingTournament } = await supabaseAdmin
      .from('matches')
      .select('id')
      .eq('id', tournamentMatchId)
      .single()

    if (!existingTournament) {
      const firstMatch = parsed.length > 0
        ? parsed.reduce((earliest, m) => m.match_date < earliest.match_date ? m : earliest)
        : null

      const { error: tournamentError } = await supabaseAdmin
        .from('matches')
        .insert({
          id: tournamentMatchId,
          external_id: tournamentMatchId,
          week: 0,
          status: 'upcoming',
          player_home: 'TBD',
          player_away: 'TBD',
          match_date: firstMatch?.match_date ?? new Date().toISOString(),
          round_name: 'Tournament',
        })

      if (tournamentError) throw new Error(tournamentError.message ?? JSON.stringify(tournamentError))
    }

    return NextResponse.json({
      synced: parsed.length,
      upcoming: upcoming.length,
      finished: finished.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('Sync error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}