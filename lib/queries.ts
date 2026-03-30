import { createClient } from '@/lib/supabase/server'
import { Match, Bet } from '@/lib/types'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'

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
  const tournamentMatchId = getTournamentFinalistsMatchId()
  const matchIds = [...matches.map(m => m.id), tournamentMatchId]
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

export async function getFinishedMatchesWithBets(userId: string) {
  const supabase = await createClient()

  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .order('match_date', { ascending: false })

  if (matchError) throw matchError

  const matchIds = matches?.map(m => m.id) ?? []
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