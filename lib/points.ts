import { Bet } from './types'

export function calcPointsByUser(
  userIds: string[],
  bets: Bet[]
): Record<string, number> {
  return Object.fromEntries(
    userIds.map(uid => [
      uid,
      bets
        .filter(b => b.user_id === uid)
        .reduce((sum, b) => sum + (b.points_earned ?? 0), 0),
    ])
  )
}

export function mergePoints(
  a: Record<string, number>,
  b: Record<string, number>
): Record<string, number> {
  const keys = new Set([...Object.keys(a), ...Object.keys(b)])
  return Object.fromEntries(
    [...keys].map(k => [k, (a[k] ?? 0) + (b[k] ?? 0)])
  )
}
