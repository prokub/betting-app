import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { BetType } from '@/lib/types'
import { validateBetPlacement, validatePredictionFormat, validateTournamentBetPlacement, isTournamentMatchId } from '@/lib/betting-rules'

const VALID_BET_TYPES: BetType[] = [
  'match_winner', 'most_180s', 'highest_checkout', 'checkout_over_105',
  'higher_avg', 'legs_over_9_5', '180s_over_6_5', 'first_thrower',
  'finalist_prediction', 'final_winner',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { match_id, bet_type, prediction } = await request.json()

  if (!VALID_BET_TYPES.includes(bet_type)) {
    return NextResponse.json({ error: 'Invalid bet type' }, { status: 400 })
  }

  // Validate prediction format for the bet type
  const predictionValidation = validatePredictionFormat(bet_type, prediction)
  if (!predictionValidation.valid) {
    return NextResponse.json({ error: predictionValidation.error }, { status: 400 })
  }

  if (isTournamentMatchId(match_id)) {
    // Tournament bets: validate deadline using earliest upcoming match
    const { data: earliest } = await supabaseAdmin
      .from('matches')
      .select('match_date')
      .eq('status', 'upcoming')
      .eq('round_name', 'Quarterfinals')
      .order('match_date', { ascending: true })
      .limit(1)
      .single()

    if (!earliest) {
      return NextResponse.json({ error: 'No upcoming matches found' }, { status: 400 })
    }

    const validation = validateTournamentBetPlacement(earliest.match_date)
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 400 })
    }
  } else {
    // Regular bets: verify match exists and validate placement
    const { data: match } = await supabaseAdmin
      .from('matches')
      .select('status, match_date, round_name, week')
      .eq('id', match_id)
      .single()

    if (!match) {
      return NextResponse.json({ error: 'Match not found' }, { status: 404 })
    }

    if (match.status !== 'upcoming') {
      return NextResponse.json({ error: 'Match is no longer accepting bets' }, { status: 400 })
    }

    // Lock all matches in the week once the first match starts
    const { data: earliest } = await supabaseAdmin
      .from('matches')
      .select('match_date')
      .eq('week', match.week)
      .eq('round_name', 'Quarterfinals')
      .eq('status', 'upcoming')
      .order('match_date', { ascending: true })
      .limit(1)
      .single()

    const lockDate = earliest?.match_date ?? match.match_date
    const validation = validateBetPlacement(lockDate, match.round_name)
    if (!validation.allowed) {
      return NextResponse.json({ error: validation.reason }, { status: 400 })
    }
  }

  // Upsert — allows changing prediction before match starts
  const { error } = await supabaseAdmin
    .from('bets')
    .upsert(
      { user_id: user.id, match_id, bet_type, prediction },
      { onConflict: 'user_id,match_id,bet_type' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}