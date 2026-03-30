import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { fetchEventStatistics, fetchFirstThrower } from '@/lib/sofascore'
import { scoreBet, scoreTournamentBet, getTournamentContext } from '@/lib/scoring'
import { BetType } from '@/lib/types'
import { isTournamentMatchId } from '@/lib/betting-rules'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // 1. Get all finished matches that still have unevaluated bets
    const { data: matches, error: matchError } = await supabaseAdmin
      .from('matches')
      .select('*')
      .eq('status', 'finished')
      .not('winner', 'is', null)

    if (matchError) throw matchError
    if (!matches?.length) {
      return NextResponse.json({ message: 'No finished matches to evaluate' })
    }

    // 2. Get all unevaluated bets for those matches
    const matchIds = matches.map(m => m.id)
    const { data: bets, error: betError } = await supabaseAdmin
      .from('bets')
      .select('*')
      .in('match_id', matchIds)
      .is('points_earned', null)

    if (betError) throw betError
    if (!bets?.length) {
      return NextResponse.json({ message: 'No unevaluated bets found' })
    }

    // 3. Fetch stats for each unique match (with concurrency limit)
    const matchMap = Object.fromEntries(matches.map(m => [m.id, m]))
    const uniqueExternalIds = [...new Set(bets.map(b => matchMap[b.match_id]?.external_id).filter(Boolean))]

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

    // 4. Score each bet
    const updates: { id: string; points_earned: number }[] = []

    // Get tournament context if final is finished
    const finalMatch = matches.find(m => m.round_name === 'Final')
    const tournamentContext = finalMatch ? getTournamentContext(finalMatch) : null

    for (const bet of bets) {
      const match = matchMap[bet.match_id]
      if (!match) continue

      const betType = bet.bet_type as BetType

      // Handle tournament-level bets
      if (isTournamentMatchId(match.id)) {
        if (!tournamentContext) continue // Can't score tournament bets without final result

        const points = scoreTournamentBet(betType, bet.prediction, tournamentContext)
        updates.push({ id: bet.id, points_earned: points })
        continue
      }

      // Handle match-level bets
      const { stats, firstThrower } = statsMap[match.external_id] ?? {}
      if (!stats) continue // stats not available yet, skip

      const points = scoreBet(betType, bet.prediction, {
        player_home: match.player_home,
        player_away: match.player_away,
        score_home: match.score_home,
        score_away: match.score_away,
        winner: match.winner,
        stats,
        firstThrower: firstThrower ?? null,
      })

      updates.push({ id: bet.id, points_earned: points })
    }

    // 5. Write points back to bets table
    for (const update of updates) {
      await supabaseAdmin
        .from('bets')
        .update({ points_earned: update.points_earned })
        .eq('id', update.id)
    }

    // 6. Aggregate weekly scores per user
    await recalculateWeeklyScores()

    return NextResponse.json({
      evaluated: updates.length,
      matches: uniqueExternalIds.length,
    })
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err))
    console.error('Evaluate error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    if (!week) continue
    if (!scores[bet.user_id]) scores[bet.user_id] = {}
    scores[bet.user_id][week] = (scores[bet.user_id][week] ?? 0) + (bet.points_earned ?? 0)
  }

  // Find winner per week
  const weekWinners: Record<number, string> = {}
  const allWeeks = [...new Set(Object.values(scores).flatMap(u => Object.keys(u).map(Number)))]

  for (const week of allWeeks) {
    let maxPoints = -1
    let winnerId = ''
    for (const [userId, weekMap] of Object.entries(scores)) {
      const pts = weekMap[week] ?? 0
      if (pts > maxPoints) { maxPoints = pts; winnerId = userId }
    }
    weekWinners[week] = winnerId
  }

  // Upsert weekly_scores
  const rows = []
  for (const [userId, weekMap] of Object.entries(scores)) {
    for (const [week, points] of Object.entries(weekMap)) {
      rows.push({
        user_id: userId,
        week: Number(week),
        points,
        week_winner: weekWinners[Number(week)] === userId,
      })
    }
  }

  await supabaseAdmin
    .from('weekly_scores')
    .upsert(rows, { onConflict: 'user_id,week' })
}