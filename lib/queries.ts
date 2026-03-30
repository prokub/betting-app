import { createClient } from '@/lib/supabase/server'
import { Match, Bet } from '@/lib/types'

export async function getUpcomingMatchesWithBets(userId: string) {
  const supabase = await createClient()

  // Get upcoming quarterfinal matches only, ordered by date
  const { data: matches, error: matchError } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'upcoming')
    .eq('round_name', 'Quarterfinals')
    .order('match_date', { ascending: true })

  if (matchError) throw matchError

  // Get this user's bets for those matches
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