import { fmtPts } from '@/lib/types'

interface Props {
  pointsByUser: Record<string, number>
  profileMap: Record<string, string>
  size?: 'sm' | 'xs'
}

export default function PointsWinnerDisplay({ pointsByUser, profileMap, size = 'xs' }: Props) {
  const maxPts = Math.max(...Object.values(pointsByUser))
  const entries = Object.entries(pointsByUser)
  const hasWinner = maxPts > 0 && entries.filter(([, pts]) => pts === maxPts).length === 1
  const textSize = size === 'sm' ? 'text-sm' : 'text-xs'

  return (
    <div className={`flex ${size === 'xs' ? 'justify-center' : ''} gap-4`}>
      {entries.map(([uid, pts]) => {
        const isWinner = hasWinner && pts === maxPts
        return (
          <span key={uid} className={`${textSize} ${size === 'sm' ? 'min-w-[5rem]' : ''} text-right whitespace-nowrap ${isWinner ? 'text-yellow-300 font-semibold' : 'text-zinc-400'}`}>
            {profileMap[uid]}: <span className={`font-semibold ${isWinner ? 'text-yellow-300' : 'text-zinc-500'}`}>{fmtPts(pts)}</span>
          </span>
        )
      })}
    </div>
  )
}
