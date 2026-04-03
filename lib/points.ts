import { Bet } from './types'

/** Returns the max value and whether a single clear leader exists (no ties). */
export function findLeader(values: number[]): { max: number; hasClearLeader: boolean } {
  const valid = values.filter(v => v > 0)
  if (valid.length === 0) return { max: 0, hasClearLeader: false }
  const max = Math.max(...valid)
  return { max, hasClearLeader: values.filter(v => v === max).length === 1 }
}

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
