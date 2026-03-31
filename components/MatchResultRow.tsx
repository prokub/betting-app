import { MatchStatus } from '@/lib/types'

interface Props {
  playerHome: string
  playerAway: string
  scoreHome: number | null
  scoreAway: number | null
  winner: string | null
  status: MatchStatus
}

export default function MatchResultRow({ playerHome, playerAway, scoreHome, scoreAway, winner, status }: Props) {
  const playerColor = (player: string) => {
    if (status === 'cancelled') return 'text-zinc-500'
    return winner === player ? 'text-emerald-400' : 'text-zinc-500'
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`flex-1 min-w-0 truncate font-semibold text-sm ${playerColor(playerHome)}`}>
        {playerHome}
      </span>
      <span className="shrink-0 text-white font-bold text-lg tracking-wider">
        {status === 'cancelled' ? 'W/O' : `${scoreHome} – ${scoreAway}`}
      </span>
      <span className={`flex-1 min-w-0 truncate font-semibold text-sm text-right ${playerColor(playerAway)}`}>
        {playerAway}
      </span>
    </div>
  )
}
