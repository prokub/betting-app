import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import HistoryNight from '@/components/HistoryNight'
import { Match } from '@/lib/types'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('id', user.id).single()

  const { data: profiles } = await supabase
    .from('profiles').select('id, display_name')

  // Fetch quarterfinal and final matches
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['finished', 'cancelled'])
    .in('round_name', ['Quarterfinals', 'Final'])
    .order('match_date', { ascending: false })

  const quarterMatches = (matches ?? []).filter(m => m.round_name === 'Quarterfinals')
  const finalMatches = (matches ?? []).filter(m => m.round_name === 'Final')

  const matchIds = quarterMatches.map(m => m.id)
  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .in('match_id', matchIds)

  // Fetch tournament bets for all weeks
  const allWeekNumbers = [...new Set((matches ?? []).map(m => m.week))]
  const tournamentMatchIds = allWeekNumbers.map(w => getTournamentFinalistsMatchId(w))
  const { data: tournamentBets } = tournamentMatchIds.length > 0
    ? await supabase
      .from('bets')
      .select('*')
      .in('match_id', tournamentMatchIds)
    : { data: [] }

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]))

  // Group quarterfinal matches by week
  const byWeek = quarterMatches.reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.week]) acc[m.week] = []
    acc[m.week].push(m)
    return acc
  }, {})

  // Index final matches by week
  const finalByWeek: Record<number, Match> = {}
  for (const m of finalMatches) {
    finalByWeek[m.week] = m
  }

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar displayName={profile?.display_name ?? 'User'} />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-6">
        <h1 className="text-2xl font-bold text-white">History</h1>

        {weeks.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm">No finished matches yet.</p>
          </div>
        )}

        {weeks.map((week, i) => {
          const weekTournamentMatchId = getTournamentFinalistsMatchId(week)
          return (
            <HistoryNight
              key={week}
              week={week}
              matches={byWeek[week]}
              bets={bets ?? []}
              finalMatch={finalByWeek[week] ?? null}
              tournamentBets={(tournamentBets ?? []).filter(b => b.match_id === weekTournamentMatchId)}
              profileMap={profileMap}
              defaultOpen={i === 0}
            />
          )
        })}
      </main>
    </div>
  )
}
