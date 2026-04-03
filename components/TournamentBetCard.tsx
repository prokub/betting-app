'use client'

import { useState } from 'react'
import { Match, Bet, BET_TYPE_CONFIG, DIFFICULTY_COLORS, fmtPts } from '@/lib/types'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'
import { useBetSave } from '@/hooks/useBetSave'
import { useLockTimer } from '@/hooks/useLockTimer'

interface Props {
  week: number
  matches: Match[]
  existingBets: Bet[]
  isLocked: boolean
}

export default function TournamentBetCard({ week, matches, existingBets, isLocked: initialLocked }: Props) {
  // Find earliest match date for real-time lock check
  const earliestDate = matches.length > 0
    ? matches.reduce((earliest, m) => m.match_date < earliest ? m.match_date : earliest, matches[0].match_date)
    : null

  const isLocked = useLockTimer(earliestDate, initialLocked)

  const TOURNAMENT_MATCH_ID = getTournamentFinalistsMatchId(week)
  const players = [...new Set(matches.flatMap(m => [m.player_home, m.player_away]))].sort()

  const existingFinalists = existingBets.find(b => b.bet_type === 'finalist_prediction')
  const existingWinner = existingBets.find(b => b.bet_type === 'final_winner')

  const initialFinalists: string[] = (() => {
    if (!existingFinalists) return []
    try {
      const parsed = JSON.parse(existingFinalists.prediction)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  })()

  const [finalists, setFinalists] = useState<string[]>(initialFinalists)
  const [winner, setWinner] = useState<string>(existingWinner?.prediction ?? '')
  const { saving, saved, error: saveError, saveBet } = useBetSave()

  async function handleFinalistToggle(player: string) {
    if (isLocked) return

    if (finalists.includes(player)) {
      const updated = finalists.filter(p => p !== player)
      setFinalists(updated)
      if (winner === player) setWinner('')
      if (updated.length === 2) {
        const ok = await saveBet({ match_id: TOURNAMENT_MATCH_ID, bet_type: 'finalist_prediction', prediction: JSON.stringify(updated) })
        if (!ok) {
          setFinalists(initialFinalists)
          setWinner(existingWinner?.prediction ?? '')
        }
      }
    } else if (finalists.length < 2) {
      const updated = [...finalists, player]
      setFinalists(updated)
      if (updated.length === 2) {
        const ok = await saveBet({ match_id: TOURNAMENT_MATCH_ID, bet_type: 'finalist_prediction', prediction: JSON.stringify(updated) })
        if (!ok) {
          setFinalists(initialFinalists)
          setWinner(existingWinner?.prediction ?? '')
        }
      }
    }
  }

  async function handleWinnerSelect(player: string) {
    if (isLocked) return
    setWinner(player)
    const ok = await saveBet({ match_id: TOURNAMENT_MATCH_ID, bet_type: 'final_winner', prediction: player })
    if (!ok) {
      setWinner(existingWinner?.prediction ?? '')
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
            Night Bets
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isLocked
              ? 'bg-red-900/40 text-red-400'
              : finalists.length === 2 && winner
              ? 'bg-emerald-900/40 text-emerald-400'
              : 'bg-zinc-800 text-zinc-400'
          }`}>
            {isLocked ? 'Locked' : finalists.length === 2 && winner ? 'All placed' : 'Incomplete'}
          </span>
        </div>
        <p className="text-white font-semibold text-sm">Who wins the night?</p>
        <p className="text-xs text-zinc-500 mt-1">5 pts per correct finalist, 10 pts for the winner</p>
      </div>

      {/* Finalist Prediction */}
      <div className="px-4 py-3 border-b border-zinc-800/60">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-zinc-400">
            Pick 2 finalists
            <span className={`ml-1 font-semibold ${DIFFICULTY_COLORS[BET_TYPE_CONFIG.finalist_prediction.difficulty]?.text}`}>
              {fmtPts(BET_TYPE_CONFIG.finalist_prediction.points)} each
            </span>
          </p>
          <span className="text-xs text-zinc-600 w-12 text-right">
            {saving.finalist_prediction ? 'Saving...' : saved.finalist_prediction ? '✓ Saved' : `${finalists.length}/2`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {players.map(player => {
            const isSelected = finalists.includes(player)
            const isDisabled = isLocked || (!isSelected && finalists.length >= 2)

            return (
              <button
                key={player}
                disabled={isDisabled}
                onClick={() => handleFinalistToggle(player)}
                className={`py-2 px-2 rounded-xl text-xs font-medium transition text-center ${
                  isSelected
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:hover:bg-zinc-800'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {player}
              </button>
            )
          })}
        </div>
      </div>

      {/* Final Winner */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-zinc-400">
            Who wins the final?
            <span className={`ml-1 font-semibold ${DIFFICULTY_COLORS[BET_TYPE_CONFIG.final_winner.difficulty]?.text}`}>
              {fmtPts(BET_TYPE_CONFIG.final_winner.points)}
            </span>
          </p>
          <span className="text-xs text-zinc-600 w-12 text-right">
            {saving.final_winner ? 'Saving...' : saved.final_winner ? '✓ Saved' : ''}
          </span>
        </div>
        {finalists.length < 2 ? (
          <p className="text-xs text-zinc-600 italic">Pick 2 finalists first</p>
        ) : (
          <div className="flex gap-2">
            {finalists.map(player => (
              <button
                key={player}
                disabled={isLocked}
                onClick={() => handleWinnerSelect(player)}
                className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition text-center ${
                  winner === player
                    ? 'bg-emerald-500 text-black'
                    : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:hover:bg-zinc-800'
                } disabled:opacity-60 disabled:cursor-not-allowed`}
              >
                {player}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      {saveError && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-red-950/30">
          <p className="text-xs text-red-400 text-center font-medium">{saveError}</p>
        </div>
      )}
      {!isLocked && !saveError && finalists.length === 2 && winner && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-emerald-950/30">
          <p className="text-xs text-emerald-400 text-center font-medium">
            Night bets placed ✓ — you can still change them before the night starts
          </p>
        </div>
      )}
    </div>
  )
}
