import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import { BetType } from '@/lib/types'
import { validateBetPlacement } from '@/lib/betting-rules'

const VALID_BET_TYPES: BetType[] = [
  'match_winner', 'most_180s', 'highest_checkout', 'checkout_over_105',
  'higher_avg', 'legs_over_9_5', '180s_over_6_5', 'first_thrower',
]

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { match_id, bet_type, prediction } = await request.json()

  if (!VALID_BET_TYPES.includes(bet_type)) {
    return NextResponse.json({ error: 'Invalid bet type' }, { status: 400 })
  }

  // Verify match is still upcoming and hasn't started
  const { data: match } = await supabaseAdmin
    .from('matches')
    .select('status, match_date, round_name')
    .eq('id', match_id)
    .single()

  if (!match) {
    return NextResponse.json({ error: 'Match not found' }, { status: 404 })
  }

  // Validate betting placement (deadline + round restrictions)
  const validation = validateBetPlacement(match.match_date, match.round_name)
  if (!validation.allowed) {
    return NextResponse.json({ error: validation.reason }, { status: 400 })
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