import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/admin'
import {
  getCurrentSeasonId,
  fetchUpcomingEvents,
  fetchFinishedEvents,
  parseEvents,
} from '@/lib/sofascore'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    if (error) throw error

    return NextResponse.json({
      synced: parsed.length,
      upcoming: upcoming.length,
      finished: finished.length,
    })
  } catch (err: any) {
    console.error('Sync error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}