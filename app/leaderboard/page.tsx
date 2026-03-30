import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import { BET_TYPE_CONFIG, BetType } from '@/lib/types'
import { SEASON } from '@/lib/config'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('display_name').eq('id', user.id).single()

  // All profiles
  const { data: profiles } = await supabase
    .from('profiles').select('id, display_name')

  // All weekly scores
  const { data: weeklyScores } = await supabase
    .from('weekly_scores').select('*').order('week', { ascending: true })

  // All evaluated bets with match info
  const { data: bets } = await supabase
    .from('bets')
    .select('user_id, bet_type, points_earned, match_id, matches(week, player_home, player_away, round_name)')
    .not('points_earned', 'is', null)

  const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p.display_name]))
  const userIds = Object.keys(profileMap)
  const allWeeks = [...new Set((weeklyScores ?? []).map(s => s.week))].sort((a, b) => a - b)

  // Season totals
  const seasonTotals = Object.fromEntries(
    userIds.map(uid => [
      uid,
      (weeklyScores ?? []).filter(s => s.user_id === uid).reduce((sum, s) => sum + s.points, 0)
    ])
  )

  // Weekly wins count
  const weeklyWins = Object.fromEntries(
    userIds.map(uid => [
      uid,
      (weeklyScores ?? []).filter(s => s.user_id === uid && s.week_winner).length
    ])
  )

  // Accuracy per bet type
  const betTypeStats = Object.fromEntries(
    userIds.map(uid => {
      const userBets = (bets ?? []).filter(b => b.user_id === uid)
      const byType = Object.fromEntries(
        (Object.keys(BET_TYPE_CONFIG) as BetType[]).map(bt => {
          const typeBets = userBets.filter(b => b.bet_type === bt)
          const correct = typeBets.filter(b => (b.points_earned ?? 0) > 0).length
          return [bt, { correct, total: typeBets.length }]
        })
      )
      return [uid, byType]
    })
  )

  const sortedUsers = [...userIds].sort((a, b) => seasonTotals[b] - seasonTotals[a])

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar displayName={profile?.display_name ?? 'User'} />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">

        {/* Season standings */}
        <section>
          <h1 className="text-2xl font-bold text-white mb-4">{SEASON.display}</h1>
          <div className="flex flex-col gap-3">
            {sortedUsers.map((uid, idx) => (
              <div key={uid} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center gap-3">
                  <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-400' : 'text-zinc-600'}`}>
                    #{idx + 1}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold">{profileMap[uid]}</span>
                      <span className="text-2xl font-bold text-emerald-400">{seasonTotals[uid]}pts</span>
                    </div>
                    <div className="flex gap-4 mt-1">
                      <span className="text-xs text-zinc-500">🏆 {weeklyWins[uid]} night{weeklyWins[uid] !== 1 ? 's' : ''} won</span>
                      <span className="text-xs text-zinc-500">
                        {(bets ?? []).filter(b => b.user_id === uid && (b.points_earned ?? 0) > 0).length}/
                        {(bets ?? []).filter(b => b.user_id === uid).length} bets correct
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Weekly breakdown */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">Week by week</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3 text-zinc-500 font-medium text-xs">Night</th>
                  {sortedUsers.map(uid => (
                    <th key={uid} className="text-center px-4 py-3 text-zinc-500 font-medium text-xs">
                      {profileMap[uid]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {allWeeks.map(week => {
                  const weekScores = Object.fromEntries(
                    (weeklyScores ?? [])
                      .filter(s => s.week === week)
                      .map(s => [s.user_id, s])
                  )
                  return (
                    <tr key={week} className="border-b border-zinc-800/50 last:border-0">
                      <td className="px-4 py-3 text-zinc-400 text-xs">Night {week}</td>
                      {sortedUsers.map(uid => {
                        const score = weekScores[uid]
                        const isWinner = score?.week_winner
                        return (
                          <td key={uid} className="px-4 py-3 text-center">
                            <span className={`font-semibold text-sm ${isWinner ? 'text-yellow-400' : 'text-white'}`}>
                              {score?.points ?? '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* Season total row */}
                <tr className="bg-zinc-800/40">
                  <td className="px-4 py-3 text-zinc-300 text-xs font-semibold">Total</td>
                  {sortedUsers.map(uid => (
                    <td key={uid} className="px-4 py-3 text-center">
                      <span className="font-bold text-emerald-400">{seasonTotals[uid]}</span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Bet type accuracy */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">Accuracy by bet type</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            {(Object.keys(BET_TYPE_CONFIG) as BetType[]).map((bt, idx) => {
              const isLast = idx === Object.keys(BET_TYPE_CONFIG).length - 1
              return (
                <div key={bt} className={`px-4 py-3 ${!isLast ? 'border-b border-zinc-800/50' : ''}`}>
                  <p className="text-xs text-zinc-500 mb-2">{BET_TYPE_CONFIG[bt].label}</p>
                  <div className="flex gap-6">
                    {sortedUsers.map(uid => {
                      const { correct, total } = betTypeStats[uid][bt]
                      const pct = total > 0 ? Math.round((correct / total) * 100) : null
                      return (
                        <div key={uid} className="flex items-center gap-2">
                          <span className="text-xs text-zinc-500">{profileMap[uid]}</span>
                          <span className="text-sm font-semibold text-white">
                            {pct !== null ? `${pct}%` : '—'}
                          </span>
                          <span className="text-xs text-zinc-600">
                            {total > 0 ? `(${correct}/${total})` : ''}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}