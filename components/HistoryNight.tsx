'use client'

import { useState } from 'react'
import { BET_TYPE_CONFIG, BetType, Match, Bet, DIFFICULTY_COLORS, fmtPts } from '@/lib/types'
import { calcPointsByUser, mergePoints } from '@/lib/points'
import PointsWinnerDisplay from './PointsWinnerDisplay'
import MatchResultRow from './MatchResultRow'
import BetResultBox from './BetResultBox'

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

  const userIds = Object.keys(profileMap)
  const nightBets = bets.filter(b => matches.some(m => m.id === b.match_id))

  let nightPoints = calcPointsByUser(userIds, nightBets)
  if (finalMatch) {
    nightPoints = mergePoints(nightPoints, calcPointsByUser(userIds, tournamentBets))
  }

  const quarterfinalBetTypes = (Object.keys(BET_TYPE_CONFIG) as BetType[]).filter(
    bt => BET_TYPE_CONFIG[bt].round === 'quarterfinals'
  )

  return (
    <section>
      {/* Night header — clickable to expand/collapse */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex flex-wrap items-center gap-y-1 rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 mb-3 cursor-pointer hover:bg-zinc-800/80 transition-colors"
      >
        <div className="flex items-center gap-3 mr-auto">
          <svg
            className={`w-4 h-4 text-zinc-500 transition-transform ${open ? 'rotate-90' : ''}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
          <h2 className="text-lg font-bold text-white">Night {week}</h2>
          <span className="text-xs text-zinc-500">{matches.length} matches</span>
        </div>
        <PointsWinnerDisplay pointsByUser={nightPoints} profileMap={profileMap} size="sm" />
      </button>

      {/* Collapsible content */}
      {open && (
        <div className="flex flex-col gap-3 pl-2 border-l-2 border-zinc-800 ml-2 mb-2">
          {matches.map(match => {
            const matchBets = bets.filter(b => b.match_id === match.id)
            const matchPts = calcPointsByUser(userIds, matchBets)

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
                  <MatchResultRow
                    playerHome={match.player_home}
                    playerAway={match.player_away}
                    scoreHome={match.score_home}
                    scoreAway={match.score_away}
                    winner={match.winner}
                    status={match.status}
                  />
                  <div className="mt-2">
                    <PointsWinnerDisplay pointsByUser={matchPts} profileMap={profileMap} />
                  </div>
                </div>

                {/* Bets comparison */}
                <div className="divide-y divide-zinc-800/60">
                  {quarterfinalBetTypes.map(bt => {
                    const config = BET_TYPE_CONFIG[bt]

                    return (
                      <div key={bt} className="px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-2">
                          {config.label}
                          <span className={`ml-1 font-semibold ${DIFFICULTY_COLORS[config.difficulty]?.text ?? 'text-zinc-400'}`}>
                            {fmtPts(config.points)}
                          </span>
                        </p>
                        <div className="flex gap-3">
                          {userIds.map(uid => {
                            const bet = matchBets.find(b => b.user_id === uid && b.bet_type === bt)
                            return (
                              <BetResultBox
                                key={uid}
                                userName={profileMap[uid]}
                                prediction={bet?.prediction ?? null}
                                pointsEarned={bet?.points_earned ?? null}
                              />
                            )
                          })}
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
                <div className="mt-1">
                  <MatchResultRow
                    playerHome={finalMatch.player_home}
                    playerAway={finalMatch.player_away}
                    scoreHome={finalMatch.score_home}
                    scoreAway={finalMatch.score_away}
                    winner={finalMatch.winner}
                    status={finalMatch.status}
                  />
                </div>
                <div className="mt-2">
                  <PointsWinnerDisplay
                    pointsByUser={calcPointsByUser(userIds, tournamentBets)}
                    profileMap={profileMap}
                  />
                </div>
              </div>

              {/* Tournament bets */}
              <div className="divide-y divide-zinc-800/60">
                  {(['finalist_prediction', 'final_winner'] as BetType[]).map(bt => {
                    const config = BET_TYPE_CONFIG[bt]

                    return (
                      <div key={bt} className="px-4 py-3">
                        <p className="text-xs text-zinc-500 mb-2">
                          {config.label}
                          <span className={`ml-1 font-semibold ${DIFFICULTY_COLORS[config.difficulty]?.text ?? 'text-zinc-400'}`}>
                            {fmtPts(config.points)}{bt === 'finalist_prediction' ? ' each' : ''}
                          </span>
                        </p>
                        <div className="flex gap-3">
                          {userIds.map(uid => {
                            const bet = tournamentBets.find(b => b.user_id === uid && b.bet_type === bt)
                            let displayPrediction: string | null = bet?.prediction ?? null
                            if (bet && bt === 'finalist_prediction') {
                              try {
                                const parsed = JSON.parse(bet.prediction)
                                if (Array.isArray(parsed)) displayPrediction = parsed.join('\n')
                              } catch { /* keep raw */ }
                            }

                            return (
                              <BetResultBox
                                key={uid}
                                userName={profileMap[uid]}
                                prediction={displayPrediction}
                                pointsEarned={bet?.points_earned ?? null}
                                multiline={bt === 'finalist_prediction'}
                              />
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
            </div>
          )}
        </div>
      )}
    </section>
  )
}
