import { supabaseAdmin } from '@/lib/supabase/admin'
import Navbar from '@/components/Navbar'
import { BET_TYPE_CONFIG, BetType, fmtPts } from '@/lib/types'
import { SEASON } from '@/lib/config'
import { getAuthenticatedUser } from '@/lib/queries'
import { findLeader } from '@/lib/points'
import PlayerStandings from '@/components/PlayerStandings'

export default async function LeaderboardPage() {
  const auth = await getAuthenticatedUser()

  // Use admin client to bypass RLS — need all users' data
  const { data: profiles } = await supabaseAdmin
    .from('profiles').select('id, display_name')

  const { data: weeklyScores } = await supabaseAdmin
    .from('weekly_scores').select('*').order('week', { ascending: true })

  const { data: bets } = await supabaseAdmin
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
          let correct: number
          let total: number
          if (bt === 'finalist_prediction') {
            // Each bet has 2 finalist picks — count individual correct guesses (5 pts each)
            correct = typeBets.reduce((sum, b) => sum + Math.floor((b.points_earned ?? 0) / 5), 0)
            total = typeBets.length * 2
          } else {
            correct = typeBets.filter(b => (b.points_earned ?? 0) > 0).length
            total = typeBets.length
          }
          return [bt, { correct, total }]
        })
      )
      return [uid, byType]
    })
  )

  // Tournament player standings
  const { data: tournamentStandings } = await supabaseAdmin
    .from('tournament_standings')
    .select('*')
    .eq('season', SEASON.year)
    .order('position', { ascending: true })

  const sortedUsers = [...userIds].sort((a, b) => seasonTotals[b] - seasonTotals[a])

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar displayName={auth.displayName} rank={auth.rank} totalPoints={auth.totalPoints} nightsWon={auth.nightsWon} />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">

        {/* Season standings */}
        <section>
          <h1 className="text-2xl font-bold text-white mb-4">{SEASON.display}</h1>
          <div className="flex flex-col gap-3">
            {sortedUsers.map((uid, idx) => (
              <div key={uid} className="bg-zinc-900 rounded-2xl p-4 border border-zinc-800">
                <div className="flex items-center gap-3 mb-3">
                  <span className={`text-2xl font-bold ${idx === 0 ? 'text-yellow-300' : 'text-zinc-600'}`}>
                    #{idx + 1}
                  </span>
                  <span className="text-white font-semibold text-lg">{profileMap[uid]}</span>
                  <span className="text-2xl font-bold text-emerald-400 ml-auto">{fmtPts(seasonTotals[uid])}</span>
                </div>
                {(() => {
                  const userBets = (bets ?? []).filter(b => b.user_id === uid)
                  const correct = userBets.filter(b => (b.points_earned ?? 0) > 0).length
                  const total = userBets.length
                  const pct = total > 0 ? Math.round((correct / total) * 100) : null
                  return (
                    <div className="flex gap-4 pl-10">
                      <span className="text-xs text-zinc-500">🏆 {weeklyWins[uid]} night{weeklyWins[uid] !== 1 ? 's' : ''} won</span>
                      <span className="text-xs text-zinc-500">
                        {correct}/{total} bets correct{pct !== null ? ` · ${pct}%` : ''}
                      </span>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        </section>

        <PlayerStandings standings={tournamentStandings ?? []} />

        {/* Weekly breakdown */}
        <section>
          <h2 className="text-lg font-bold text-white mb-3">Week by week</h2>
          <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left px-4 py-3.5 text-zinc-500 font-medium text-xs">Night</th>
                  {sortedUsers.map(uid => (
                    <th key={uid} className="text-center px-4 py-3.5 text-zinc-500 font-medium text-xs">
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
                      <td className="px-4 py-3.5 text-xs">
                        <a href={`/history#night-${week}`} className="text-zinc-400 hover:text-white transition no-underline">
                          Night {week}
                        </a>
                      </td>
                      {sortedUsers.map(uid => {
                        const score = weekScores[uid]
                        const isWinner = score?.week_winner
                        return (
                          <td key={uid} className="px-4 py-3.5 text-center">
                            <span className={`font-semibold text-sm ${isWinner ? 'text-yellow-300' : 'text-white'}`}>
                              {score?.points ?? '—'}
                            </span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {/* Season total row */}
                {(() => {
                  const totals = sortedUsers.map(uid => seasonTotals[uid])
                  const { max, hasClearLeader } = findLeader(totals)
                  return (
                    <tr className="bg-zinc-800/40 border-t border-zinc-700">
                      <td className="px-4 py-4 text-zinc-300 text-xs font-semibold">Total</td>
                      {sortedUsers.map((uid, i) => {
                        const isLeader = hasClearLeader && totals[i] === max
                        return (
                          <td key={uid} className="px-4 py-4 text-center">
                            <span className={`font-bold text-base ${isLeader ? 'text-yellow-300' : 'text-emerald-400'}`}>{seasonTotals[uid]}</span>
                          </td>
                        )
                      })}
                    </tr>
                  )
                })()}
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
                <div key={bt} className={`px-4 py-4 ${!isLast ? 'border-b border-zinc-800/50' : ''}`}>
                  <p className="text-xs text-zinc-500 mb-3">{BET_TYPE_CONFIG[bt].label}</p>
                  {(() => {
                    const pcts = sortedUsers.map(uid => {
                      const { correct, total } = betTypeStats[uid][bt]
                      return total > 0 ? Math.round((correct / total) * 100) : -1
                    })
                    const { max, hasClearLeader } = findLeader(pcts)
                    return (
                  <div className="flex flex-col gap-2">
                    {sortedUsers.map((uid, i) => {
                      const { correct, total } = betTypeStats[uid][bt]
                      const pct = pcts[i]
                      const isLeader = hasClearLeader && pct === max
                      return (
                        <div key={uid} className="flex items-center justify-between">
                          <span className={`text-xs ${isLeader ? 'text-yellow-300' : 'text-zinc-400'}`}>{profileMap[uid]}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-semibold ${isLeader ? 'text-yellow-300' : 'text-white'}`}>
                              {pct >= 0 ? `${pct}%` : '—'}
                            </span>
                            <span className="text-xs text-zinc-600 w-12 text-right">
                              {total > 0 ? `${correct}/${total}` : ''}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                    )
                  })()}
                </div>
              )
            })}
          </div>
        </section>

      </main>
    </div>
  )
}