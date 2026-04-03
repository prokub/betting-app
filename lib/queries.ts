import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { Match, Bet } from '@/lib/types'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'

/** Auth check + profile + standing in one call. Redirects to /login if not authenticated. */
export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: profile }, standing] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    getUserStanding(user.id),
  ])

  return {
    user,
    displayName: profile?.display_name ?? 'User',
    ...standing,
  }
}

export async function getUserStanding(userId: string) {
  const { data: scores } = await supabaseAdmin
    .from('weekly_scores')
    .select('user_id, points, week_winner')

  if (!scores?.length) return { rank: undefined, totalPoints: 0, nightsWon: 0 }

  // Sum per user
  const totals: Record<string, { points: number; wins: number }> = {}
  for (const s of scores) {
    if (!totals[s.user_id]) totals[s.user_id] = { points: 0, wins: 0 }
    totals[s.user_id].points += s.points
    if (s.week_winner) totals[s.user_id].wins++
  }

  const sorted = Object.entries(totals).sort((a, b) => b[1].points - a[1].points)
  const rank = sorted.findIndex(([uid]) => uid === userId) + 1
  const user = totals[userId] ?? { points: 0, wins: 0 }

  return {
    rank: rank > 0 ? rank : undefined,
    totalPoints: user.points,
    nightsWon: user.wins,
  }
}

export async function getUpcomingMatchesWithBets(userId: string) {
  const supabase = await createClient()

  // Get upcoming quarterfinal matches only, ordered by date
  const { data: allMatches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'upcoming')
    .eq('round_name', 'Quarterfinals')
    .order('match_date', { ascending: true })

  if (matchError) throw matchError

  // Only show matches from the next (earliest) week
  const nextWeek = allMatches?.[0]?.week
  const matches = nextWeek != null
    ? allMatches!.filter(m => m.week === nextWeek)
    : []

  // Get this user's bets for those matches + tournament bets
  const tournamentMatchId = nextWeek != null ? getTournamentFinalistsMatchId(nextWeek) : null
  const matchIds = [...matches.map(m => m.id), ...(tournamentMatchId ? [tournamentMatchId] : [])]
  const { data: bets, error: betError } = await supabase
    .from('bets')
    .select('*')
    .in('match_id', matchIds)
    .eq('user_id', userId)

  if (betError) throw betError

  return {
    matches: (matches ?? []) as Match[],
    bets: (bets ?? []) as Bet[],
  }
}

