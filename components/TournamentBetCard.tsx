'use client'

import { useState } from 'react'
import { Match, Bet } from '@/lib/types'
import { getTournamentFinalistsMatchId } from '@/lib/betting-rules'

interface Props {
  matches: Match[]
  existingBets: Bet[]
  isLocked: boolean
}

const TOURNAMENT_MATCH_ID = getTournamentFinalistsMatchId()

export default function TournamentBetCard({ matches, existingBets, isLocked }: Props) {
  // Collect unique players from all matches
  const players = [...new Set(matches.flatMap(m => [m.player_home, m.player_away]))].sort()

  // Load existing bets
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
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})

  async function saveBet(betType: string, prediction: string) {
    setSaving(prev => ({ ...prev, [betType]: true }))
    setSaved(prev => ({ ...prev, [betType]: false }))

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: TOURNAMENT_MATCH_ID, bet_type: betType, prediction }),
      })

      if (res.ok) {
        setSaved(prev => ({ ...prev, [betType]: true }))
        setTimeout(() => setSaved(prev => ({ ...prev, [betType]: false })), 2000)
      }
    } catch {
      // Revert on network error
      setFinalists(initialFinalists)
      setWinner(existingWinner?.prediction ?? '')
    } finally {
      setSaving(prev => ({ ...prev, [betType]: false }))
    }
  }

  function handleFinalistToggle(player: string) {
    if (isLocked) return

    if (finalists.includes(player)) {
      // Deselect
      const updated = finalists.filter(p => p !== player)
      setFinalists(updated)
      // Reset winner if deselected finalist was the winner
      if (winner === player) setWinner('')
      if (updated.length === 2) {
        saveBet('finalist_prediction', JSON.stringify(updated))
      }
    } else if (finalists.length < 2) {
      // Select
      const updated = [...finalists, player]
      setFinalists(updated)
      if (updated.length === 2) {
        saveBet('finalist_prediction', JSON.stringify(updated))
      }
    }
  }

  function handleWinnerSelect(player: string) {
    if (isLocked) return
    setWinner(player)
    saveBet('final_winner', player)
  }

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      {/* Header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
            Tournament Bets
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
          <p className="text-xs text-zinc-400">Pick 2 finalists</p>
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
          <p className="text-xs text-zinc-400">Who wins the final?</p>
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
      {!isLocked && finalists.length === 2 && winner && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-emerald-950/30">
          <p className="text-xs text-emerald-400 text-center font-medium">
            Tournament bets placed ✓ — you can still change them before the tournament starts
          </p>
        </div>
      )}
    </div>
  )
}
