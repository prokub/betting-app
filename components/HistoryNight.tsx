'use client'

import { useState } from 'react'
import { BET_TYPE_CONFIG, BetType, Match, Bet } from '@/lib/types'

interface Props {
  week: number
  matches: Match[]
  bets: Bet[]
  finalMatch: Match | null
  tournamentBets: Bet[]
  profileMap: Record<string, string>
  defaultOpen: boolean
}

export default function HistoryNight({
  week, matches, bets, finalMatch, tournamentBets, profileMap, defaultOpen,
}: Props) {
  const [open, setOpen] = useState(defaultOpen)

  const nightBets = bets.filter(b => matches.some(m => m.id === b.match_id))

  // Points per user this night (quarterfinal bets)
  const nightPoints: Record<string, number> = {}
  for (const uid of Object.keys(profileMap)) {
    nightPoints[uid] = nightBets
      .filter(b => b.user_id === uid)
      .reduce((sum, b) => sum + (b.points_earned ?? 0), 0)
  }

  // Tournament bet points (if this night has a finished final)
  if (finalMatch) {
    for (const uid of Object.keys(profileMap)) {
      const userTournamentPts = tournamentBets
        .filter(b => b.user_id === uid)
        .reduce((sum, b) => sum + (b.points_earned ?? 0), 0)
      nightPoints[uid] = (nightPoints[uid] ?? 0) + userTournamentPts
    }
  }

  const quarterfinalBetTypes = (Object.keys(BET_TYPE_CONFIG) as BetType[]).filter(
    bt => BET_TYPE_CONFIG[bt].round === 'quarterfinals'
  )

  return (
    <section>
      {/* Night header — clickable to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 mb-3 cursor-pointer hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3">
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-lg font-bold text-white">Night {week}</h2>
          <span className="text-xs text-zinc-500">{matches.length} matches</span>
        </div>
        <div className="flex gap-4">
          {Object.entries(nightPoints).map(([uid, pts]) => (
            <span key={uid} className="text-sm text-zinc-400">
              {profileMap[uid]}: <span className="text-emerald-400 font-semibold">{pts}pt</span>
            </span>
          ))}
        </div>
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="flex flex-col gap-3 pl-2 border-l-2 border-zinc-800 ml-2 mb-2">
          {matches.map(match => {
            const matchBets = bets.filter(b => b.match_id === match.id)

            return (
              <div key={match.id} className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
                {/* Match result header */}
                <div className="px-4 py-3 border-b border-zinc-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-zinc-500">{match.round_name}</span>
                    {match.status === 'cancelled' && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 font-medium">Cancelled</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex-1 min-w-0 truncate font-semibold text-sm ${match.status === 'cancelled' ? 'text-zinc-500' : match.winner === match.player_home ? 'text-white' : 'text-zinc-500'}`}>
                      {match.player_home}
                    </span>
                    <span className="shrink-0 text-white font-bold text-lg tracking-wider">
                      {match.status === 'cancelled' ? 'W/O' : `${match.score_home} – ${match.score_away}`}
                    </span>
                    <span className={`flex-1 min-w-0 truncate font-semibold text-sm text-right ${match.status === 'cancelled' ? 'text-zinc-500' : match.winner === match.player_away ? 'text-white' : 'text-zinc-500'}`}>
                      {match.player_away}
                    </span>
                  </div>
                </div>

                {/* Bets comparison */}
                <div className="divide-y divide-zinc-800/60">
                  {quarterfinalBetTypes.map(bt => {
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
                              bet?.points_earned && bet.points_earned > 0
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
                                <div className={`text-xs font-bold mt-0.5 ${bet.points_earned > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                  {bet.points_earned > 0 ? `+${bet.points_earned}pt` : '0pt'}
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

          {/* Final result + tournament bets */}
          {finalMatch && (
            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
              {/* Final result header */}
              <div className="px-4 py-3 border-b border-zinc-800">
                <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">Final</span>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`flex-1 min-w-0 truncate font-semibold text-sm ${finalMatch.winner === finalMatch.player_home ? 'text-white' : 'text-zinc-500'}`}>
                    {finalMatch.player_home}
                  </span>
                  <span className="shrink-0 text-white font-bold text-lg tracking-wider">
                    {`${finalMatch.score_home} – ${finalMatch.score_away}`}
                  </span>
                  <span className={`flex-1 min-w-0 truncate font-semibold text-sm text-right ${finalMatch.winner === finalMatch.player_away ? 'text-white' : 'text-zinc-500'}`}>
                    {finalMatch.player_away}
                  </span>
                </div>
              </div>

              {/* Tournament bets */}
              {tournamentBets.length > 0 && (
                <div className="divide-y divide-zinc-800/60">
                  {(['finalist_prediction', 'final_winner'] as BetType[]).map(bt => {
                    const config = BET_TYPE_CONFIG[bt]
                    const betsByUser = Object.fromEntries(
                      Object.keys(profileMap).map(uid => [
                        uid,
                        tournamentBets.find(b => b.user_id === uid && b.bet_type === bt)
                      ])
                    )

                    return (
                      <div key={bt} className="px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-2">{config.label}</p>
                        <div className="flex gap-3">
                          {Object.entries(betsByUser).map(([uid, bet]) => {
                            let displayPrediction: string | null = bet?.prediction ?? null
                            if (bet && bt === 'finalist_prediction') {
                              try {
                                const parsed = JSON.parse(bet.prediction)
                                if (Array.isArray(parsed)) displayPrediction = parsed.join(', ')
                              } catch { /* keep raw */ }
                            }

                            return (
                              <div key={uid} className={`flex-1 rounded-xl px-3 py-2 text-center border ${
                                bet?.points_earned && bet.points_earned > 0
                                  ? 'bg-emerald-950/40 border-emerald-800'
                                  : bet?.points_earned === 0
                                  ? 'bg-red-950/30 border-red-900/50'
                                  : 'bg-zinc-800 border-zinc-700'
                              }`}>
                                <div className="text-xs text-zinc-500 mb-0.5">{profileMap[uid]}</div>
                                <div className="text-xs font-medium text-white truncate">
                                  {displayPrediction ?? <span className="text-zinc-600">no bet</span>}
                                </div>
                                {bet?.points_earned != null && (
                                  <div className={`text-xs font-bold mt-0.5 ${bet.points_earned > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                    {bet.points_earned > 0 ? `+${bet.points_earned}pt` : '0pt'}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  )
}
