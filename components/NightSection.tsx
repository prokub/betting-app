'use client'

import { useState, useEffect } from 'react'
import { Match, Bet } from '@/lib/types'
import MatchBetCard from './MatchBetCard'

interface Props {
  week: number
  matches: Match[]
  bets: Bet[]
}

export default function NightSection({ week, matches, bets }: Props) {
  const [dateStr, setDateStr] = useState('')
  useEffect(() => {
    const d = new Date(matches[0].match_date)
    setDateStr(d.toLocaleDateString('en-GB', {
      weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Bratislava'
    }))
  }, [matches])

  return (
    <section>
      <div className="flex items-baseline gap-3 mb-3">
        <h2 className="text-white font-bold text-lg">Night {week}</h2>
        <span className="text-zinc-500 text-sm">{dateStr}</span>
      </div>
      <div className="flex flex-col gap-4">
        {matches.map(match => (
          <MatchBetCard
            key={match.id}
            match={match}
            existingBets={bets.filter(b => b.match_id === match.id)}
          />
        ))}
      </div>
    </section>
  )
}
