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

  // Only fetch quarterfinal matches (not semis/finals)
  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .in('status', ['finished', 'cancelled'])
    .eq('round_name', 'Quarterfinals')
    .order('match_date', { ascending: false })

  const matchIds = (matches ?? []).map(m => m.id)
  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .in('match_id', matchIds)

  // Fetch tournament bets separately
  const tournamentMatchId = getTournamentFinalistsMatchId()
  const { data: tournamentMatch } = await supabase
    .from('matches')
    .select('*')
    .eq('id', tournamentMatchId)
    .in('status', ['finished', 'cancelled'])
    .single()

  const { data: tournamentBets } = await supabase
    .from('bets')
    .select('*')
    .eq('match_id', tournamentMatchId)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]))

  // Group matches by week
  const byWeek = (matches ?? []).reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.week]) acc[m.week] = []
    acc[m.week].push(m)
    return acc
  }, {})

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => b - a)

  // Tournament bets belong to the week of the tournament match (if finished)
  const tournamentWeek = tournamentMatch?.week ?? null

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

        {weeks.map((week, i) => (
          <HistoryNight
            key={week}
            week={week}
            matches={byWeek[week]}
            bets={bets ?? []}
            tournamentBets={tournamentWeek === week ? (tournamentBets ?? []) : []}
            profileMap={profileMap}
            defaultOpen={i === 0}
            showTournamentBets={tournamentWeek === week}
          />
        ))}
      </main>
    </div>
  )
}
