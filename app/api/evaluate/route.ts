import { NextResponse } from 'next/server'
import { env } from '@/lib/env'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchEventStatistics, fetchFirstThrower, fetchTournamentStandings, getCurrentSeasonId } from '@/lib/sofascore'
import { scoreBet, scoreTournamentBet, getTournamentContext } from '@/lib/scoring'
import { BetType } from '@/lib/types'
import { isTournamentMatchId, getTournamentFinalistsMatchId } from '@/lib/betting-rules'
import { SEASON } from '@/lib/config'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const seasonId = await getCurrentSeasonId()

    //  Sync tournament standings
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
    
    // 0. Zero out bets on cancelled matches
    const { data: cancelledMatches } = await supabaseAdmin
      .from('matches').select('id').eq('status', 'cancelled')

    if (cancelledMatches?.length) {
      await supabaseAdmin
        .from('bets')
        .update({ points_earned: 0 })
        .in('match_id', cancelledMatches.map(m => m.id))
        .is('points_earned', null)
    }

    // 1. Get all finished matches that still have unevaluated bets
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .not('winner', 'is', null)

    if (matchError) throw new Error(matchError.message ?? JSON.stringify(matchError))
    if (!matches?.length) {
      return NextResponse.json({ message: 'No finished matches to evaluate' })
    }

    // 2. If any finals are finished, mark per-week TOURNAMENT_FINALISTS rows as finished
    //    so tournament bets can be evaluated
    const finalMatches = matches.filter(m => m.round_name === 'Final')

    for (const finalMatch of finalMatches) {
      const tournamentMatchId = getTournamentFinalistsMatchId(finalMatch.week)
      await supabaseAdmin
        .from('matches')
        .upsert({
          id: tournamentMatchId,
          status: 'finished',
          week: finalMatch.week,
          player_home: finalMatch.player_home,
          player_away: finalMatch.player_away,
          winner: finalMatch.winner,
          score_home: finalMatch.score_home,
          score_away: finalMatch.score_away,
          match_date: finalMatch.match_date,
          external_id: tournamentMatchId,
          season: finalMatch.season,
          night_id: finalMatch.night_id,
          round_name: 'Tournament',
        }, { onConflict: 'id' })
    }

    // 3. Get all unevaluated bets for finished matches + tournament bets
    const matchIds = matches.map(m => m.id)
    const matchMap = Object.fromEntries(matches.map(m => [m.id, m]))

    for (const finalMatch of finalMatches) {
      const tournamentMatchId = getTournamentFinalistsMatchId(finalMatch.week)
      if (!matchIds.includes(tournamentMatchId)) {
        matchIds.push(tournamentMatchId)
      }
      matchMap[tournamentMatchId] = {
        ...finalMatch,
        id: tournamentMatchId,
        week: finalMatch.week,
        round_name: 'Tournament',
      }
    }

    const { data: bets, error: betError } = await supabaseAdmin
      .from('bets')
      .select('*')
      .in('match_id', matchIds)
      .is('points_earned', null)

    if (betError) throw new Error(betError.message ?? JSON.stringify(betError))
    if (!bets?.length) {
      return NextResponse.json({ message: 'No unevaluated bets found' })
    }

    // 4. Fetch stats for each unique match (with concurrency limit)
    const uniqueExternalIds = [...new Set(
      bets
        .filter(b => !isTournamentMatchId(b.match_id))
        .map(b => matchMap[b.match_id]?.external_id)
        .filter(Boolean)
    )]

    const statsMap: Record<string, { stats: Record<string, { [key: string]: unknown }> | null; firstThrower: 'home' | 'away' | null }> = {}

    for (const externalId of uniqueExternalIds) {
      const [stats, firstThrower] = await Promise.all([
        fetchEventStatistics(Number(externalId)),
        fetchFirstThrower(Number(externalId)),
      ])
      statsMap[externalId] = { stats, firstThrower }
      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 300))
    }

    // 5. Score each bet
    const updates: { id: string; points_earned: number }[] = []

    // Build tournament contexts per week from final matches
    const tournamentContextByWeek: Record<number, ReturnType<typeof getTournamentContext>> = {}
    for (const finalMatch of finalMatches) {
      tournamentContextByWeek[finalMatch.week] = getTournamentContext(finalMatch)
    }

    for (const bet of bets) {
      const match = matchMap[bet.match_id]
      if (!match) continue

      const betType = bet.bet_type as BetType

      // Handle tournament-level bets
      if (isTournamentMatchId(match.id)) {
        const tournamentContext = tournamentContextByWeek[match.week]
        if (!tournamentContext) continue // Can't score tournament bets without final result

        const points = scoreTournamentBet(betType, bet.prediction, tournamentContext)
        updates.push({ id: bet.id, points_earned: points })
        continue
      }

      // Handle match-level bets
      const { stats, firstThrower } = statsMap[match.external_id] ?? {}

      // Bet types that require SofaScore stats
      const needsStats: BetType[] = ['most_180s', 'highest_checkout', 'checkout_over_105', 'higher_avg', '180s_over_6_5', 'first_thrower']
      if (!stats && needsStats.includes(betType)) continue

      const points = scoreBet(betType, bet.prediction, {
        player_home: match.player_home,
        player_away: match.player_away,
        score_home: match.score_home,
        score_away: match.score_away,
        winner: match.winner,
        stats: stats ?? null,
        firstThrower: firstThrower ?? null,
      })

      updates.push({ id: bet.id, points_earned: points })
    }

    // 6. Write points back to bets table
    const grouped = Map.groupBy(updates, u => u.points_earned)
    for (const [points, batch] of grouped) {
      await supabaseAdmin
        .from('bets')
        .update({ points_earned: points })
        .in('id', batch.map(b => b.id))
    }

    // 7. Aggregate weekly scores per user
    await recalculateWeeklyScores()

    return NextResponse.json({
      evaluated: updates.length,
      matches: uniqueExternalIds.length,
      standings: standings.length,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('Evaluate error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function recalculateWeeklyScores() {
  // Get all evaluated bets with their match week
  const { data: bets } = await supabaseAdmin
    .from('bets')
    .select('user_id, points_earned, match_id, matches(week)')
    .not('points_earned', 'is', null)

  if (!bets?.length) return

  // Sum points per user per week
  const scores: Record<string, Record<number, number>> = {}
  for (const bet of bets) {
    const week = ((bet.matches as unknown) as { week: number } | null)?.week
    if (week == null) continue
    if (!scores[bet.user_id]) scores[bet.user_id] = {}
    scores[bet.user_id][week] = (scores[bet.user_id][week] ?? 0) + (bet.points_earned ?? 0)
  }

  // Find winner per week
  const weekWinners: Record<number, string[]> = {}
  const allWeeks = [...new Set(Object.values(scores).flatMap(u => Object.keys(u).map(Number)))]

  for (const week of allWeeks) {
    let maxPoints = -1
    for (const [, weekMap] of Object.entries(scores)) {
      const pts = weekMap[week] ?? 0
      if (pts > maxPoints) maxPoints = pts
    }
    for (const [userId, weekMap] of Object.entries(scores)) {
      if ((weekMap[week] ?? 0) === maxPoints) {
        weekWinners[week] = weekWinners[week] || []
        weekWinners[week].push(userId)
      }
    }
  }

  // Upsert weekly_scores
  const rows = []
  for (const [userId, weekMap] of Object.entries(scores)) {
    for (const [week, points] of Object.entries(weekMap)) {
      rows.push({
        user_id: userId,
        week: Number(week),
        points,
        week_winner: weekWinners[Number(week)]?.includes(userId) ?? false,
      })
    }
  }

  await supabaseAdmin
    .from('weekly_scores')
    .upsert(rows, { onConflict: 'user_id,week' })
}