'use client'

import { useState, useEffect } from 'react'
import { Match, Bet, BetType, BET_TYPE_CONFIG } from '@/lib/types'

interface Props {
  match: Match
  existingBets: Bet[]
}

export default function MatchBetCard({ match, existingBets }: Props) {
  const isLocked = new Date(match.match_date) <= new Date()
  const betMap = Object.fromEntries(existingBets.map(b => [b.bet_type, b.prediction]))

  const [predictions, setPredictions] = useState<Record<string, string>>(betMap)
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})


  const betTypes = (Object.keys(BET_TYPE_CONFIG) as BetType[]).filter(bt => BET_TYPE_CONFIG[bt].round === 'quarterfinals')
  const allPlaced = betTypes.every(bt => predictions[bt])
  const totalPlaced = betTypes.filter(bt => predictions[bt]).length

  async function handleSelect(betType: BetType, value: string) {
    if (isLocked) return
    setPredictions(prev => ({ ...prev, [betType]: value }))
    setSaving(prev => ({ ...prev, [betType]: true }))
    setSaved(prev => ({ ...prev, [betType]: false }))

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ match_id: match.id, bet_type: betType, prediction: value }),
      })

      if (res.ok) {
        setSaved(prev => ({ ...prev, [betType]: true }))
        setTimeout(() => setSaved(prev => ({ ...prev, [betType]: false })), 2000)
      }
    } catch {
      setPredictions(prev => ({ ...prev, [betType]: betMap[betType] ?? '' }))
    } finally {
      setSaving(prev => ({ ...prev, [betType]: false }))
    }
  }

  const [dateTimeStr, setDateTimeStr] = useState('')
  useEffect(() => {
    const d = new Date(match.match_date)
    const date = d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Bratislava' })
    const time = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Bratislava' })
    setDateTimeStr(`${date} · ${time}`)
  }, [match.match_date])

  return (
    <div className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800">
      {/* Match header */}
      <div className="px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-zinc-500 font-medium uppercase tracking-wide">
            {match.round_name ?? 'Match'}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
            isLocked
              ? 'bg-red-900/40 text-red-400'
              : 'bg-emerald-900/40 text-emerald-400'
          }`}>
            {isLocked ? 'Locked' : `${totalPlaced}/${betTypes.length} placed`}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-white font-semibold text-sm">{match.player_home}</span>
          <span className="text-zinc-500 text-xs font-bold">vs</span>
          <span className="text-white font-semibold text-sm text-right">{match.player_away}</span>
        </div>
        <div className="text-xs text-zinc-500 mt-1 text-center">
          {dateTimeStr}
        </div>
      </div>

      {/* Bet questions */}
      <div className="divide-y divide-zinc-800/60">
        {betTypes.map(betType => {
          const config = BET_TYPE_CONFIG[betType]
          const options = config.options(match.player_home, match.player_away)
          const selected = predictions[betType]
          const isSaving = saving[betType]
          const isSaved = saved[betType]

          return (
            <div key={betType} className="px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs text-zinc-400">{config.label}</p>
                <span className="text-xs text-zinc-600 w-12 text-right">
                  {isSaving ? 'Saving…' : isSaved ? '✓ Saved' : ''}
                </span>
              </div>
              <div className="flex gap-2">
                {options.map(opt => (
                  <button
                    key={opt.value}
                    disabled={isLocked}
                    onClick={() => handleSelect(betType, opt.value)}
                    className={`flex-1 py-2 px-2 rounded-xl text-xs font-medium transition text-center ${
                      selected === opt.value
                        ? 'bg-emerald-500 text-black'
                        : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:hover:bg-zinc-800'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Footer */}
      {!isLocked && allPlaced && (
        <div className="px-4 py-3 border-t border-zinc-800 bg-emerald-950/30">
          <p className="text-xs text-emerald-400 text-center font-medium">
            All bets placed ✓ — you can still change them before the match starts
          </p>
        </div>
      )}
    </div>
  )
}