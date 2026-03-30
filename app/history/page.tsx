import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { BET_TYPE_CONFIG, BetType, Match } from '@/lib/types'

export default async function HistoryPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('id', user.id).single()

  const { data: profiles } = await supabase
    .from('profiles').select('id, display_name')

  const { data: matches } = await supabase
    .from('matches')
    .select('*')
    .eq('status', 'finished')
    .order('match_date', { ascending: false })

  const matchIds = (matches ?? []).map(m => m.id)
  const { data: bets } = await supabase
    .from('bets')
    .select('*')
    .in('match_id', matchIds)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]))

  // Group matches by week
  const byWeek = (matches ?? []).reduce<Record<number, Match[]>>((acc, m) => {
    if (!acc[m.week]) acc[m.week] = []
    acc[m.week].push(m)
    return acc
  }, {})

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => b - a)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar displayName={profile?.display_name ?? ''} />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">
        <h1 className="text-2xl font-bold text-white">History</h1>

        {weeks.length === 0 && (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm">No finished matches yet.</p>
          </div>
        )}

        {weeks.map(week => {
          const nightMatches = byWeek[week]
          const nightBets = (bets ?? []).filter(b =>
            nightMatches.some(m => m.id === b.match_id)
          )
          // Points per user this night
          const nightPoints = Object.fromEntries(
            Object.keys(profileMap).map(uid => [
              uid,
              nightBets.filter(b => b.user_id === uid)
                .reduce((sum, b) => sum + (b.points_earned ?? 0), 0)
            ])
          )

          return (
            <section key={week}>
              <div className="flex items-baseline justify-between mb-3">
                <h2 className="text-lg font-bold text-white">Night {week}</h2>
                <div className="flex gap-4">
                  {Object.entries(nightPoints).map(([uid, pts]) => (
                    <span key={uid} className="text-sm text-zinc-400">
                      {profileMap[uid]}: <span className="text-emerald-400 font-semibold">{pts}pt</span>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex flex-col gap-4">
                {nightMatches.map(match => {
                  const matchBets = (bets ?? []).filter(b => b.match_id === match.id)

                  return (
                    <div key={match.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                      {/* Match result header */}
                      <div className="px-4 py-3 border-b border-zinc-800">
                        <div className="text-xs text-zinc-500 mb-1">{match.round_name}</div>
                        <div className="flex items-center justify-between">
                          <span className={`font-semibold text-sm ${match.winner === match.player_home ? 'text-white' : 'text-zinc-500'}`}>
                            {match.player_home}
                          </span>
                          <span className="text-white font-bold text-lg tracking-wider">
                            {match.score_home} – {match.score_away}
                          </span>
                          <span className={`font-semibold text-sm text-right ${match.winner === match.player_away ? 'text-white' : 'text-zinc-500'}`}>
                            {match.player_away}
                          </span>
                        </div>
                      </div>

                      {/* Bets comparison */}
                      <div className="divide-y divide-zinc-800/60">
                        {(Object.keys(BET_TYPE_CONFIG) as BetType[]).map(bt => {
                          const config = BET_TYPE_CONFIG[bt]
                          const betsByUser = Object.fromEntries(
                            Object.keys(profileMap).map(uid => [
                              uid,
                              matchBets.find(b => b.user_id === uid && b.bet_type === bt)
                            ])
                          )

                          return (
                            <div key={bt} className="px-4 py-3">
                              <p className="text-xs text-zinc-500 mb-2">{config.label}</p>
                              <div className="flex gap-3">
                                {Object.entries(betsByUser).map(([uid, bet]) => (
                                  <div key={uid} className={`flex-1 rounded-xl px-3 py-2 text-center border ${
                                    bet?.points_earned === 1
                                      ? 'bg-emerald-950/40 border-emerald-800'
                                      : bet?.points_earned === 0
                                      ? 'bg-red-950/30 border-red-900/50'
                                      : 'bg-zinc-800 border-zinc-700'
                                  }`}>
                                    <div className="text-xs text-zinc-500 mb-0.5">{profileMap[uid]}</div>
                                    <div className="text-xs font-medium text-white truncate">
                                      {bet?.prediction ?? <span className="text-zinc-600">no bet</span>}
                                    </div>
                                    {bet?.points_earned != null && (
                                      <div className={`text-xs font-bold mt-0.5 ${bet.points_earned === 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {bet.points_earned === 1 ? '+1pt' : '0pt'}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>
    </div>
  )
}