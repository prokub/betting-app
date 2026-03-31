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
    <div className="flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <span className={`font-semibold text-sm ${playerColor(playerHome)}`}>{playerHome}</span>
        <span className={`font-bold text-sm tabular-nums ${status !== 'cancelled' ? (winner === playerHome ? 'text-white' : 'text-zinc-500') : 'text-zinc-500'}`}>
          {status === 'cancelled' ? '–' : scoreHome}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <span className={`font-semibold text-sm ${playerColor(playerAway)}`}>{playerAway}</span>
        <span className={`font-bold text-sm tabular-nums ${status !== 'cancelled' ? (winner === playerAway ? 'text-white' : 'text-zinc-500') : 'text-zinc-500'}`}>
          {status === 'cancelled' ? '–' : scoreAway}
        </span>
      </div>
    </div>
  )
}
