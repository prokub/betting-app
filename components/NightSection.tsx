'use client'

import { Match, Bet } from '@/lib/types'
import { useBratislavaDate } from '@/hooks/useBratislavaDate'
import MatchBetCard from './MatchBetCard'

interface Props {
  week: number
  matches: Match[]
  bets: Bet[]
  nightStartDate: string
}

export default function NightSection({ week, matches, bets, nightStartDate }: Props) {
  const dateStr = useBratislavaDate(matches[0].match_date, {
    weekday: 'long', day: 'numeric', month: 'long',
  })

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
            nightStartDate={nightStartDate}
          />
        ))}
      </div>
    </section>
  )
}
