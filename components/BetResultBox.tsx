import { fmtPts } from '@/lib/types'

interface Props {
  userName: string
  prediction: string | null
  pointsEarned: number | null
  multiline?: boolean
}

export default function BetResultBox({ userName, prediction, pointsEarned, multiline = false }: Props) {
  const bgColor = pointsEarned != null && pointsEarned > 0
    ? 'bg-emerald-950/40 border-emerald-800'
    : pointsEarned === 0
    ? 'bg-red-950/30 border-red-900/50'
    : 'bg-zinc-800 border-zinc-700'

  return (
    <div className={`flex-1 rounded-xl px-3 py-2 text-center border flex flex-col items-center justify-center ${bgColor}`}>
      <div className="text-xs text-zinc-400 mb-0.5">{userName}</div>
      <div className={`text-xs font-medium text-white ${multiline ? 'whitespace-pre-line' : 'truncate'}`}>
        {prediction ?? <span className="text-zinc-500">no bet</span>}
      </div>
      {pointsEarned != null && (
        <div className={`text-xs font-bold mt-0.5 ${pointsEarned > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {pointsEarned > 0 ? `+${fmtPts(pointsEarned)}` : fmtPts(0)}
        </div>
      )}
    </div>
  )
}
