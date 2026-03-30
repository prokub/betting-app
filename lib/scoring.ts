import { BetType } from './types'

interface MatchResult {
  player_home: string
  player_away: string
  score_home: number
  score_away: number
  winner: string
  stats: Record<string, any> | null
  firstThrower: 'home' | 'away' | null
}

export function scoreBet(
  betType: BetType,
  prediction: string,
  result: MatchResult
): number {
  const { player_home, player_away, score_home, score_away, winner, stats, firstThrower } = result

  const stat = (key: string, side: 'home' | 'away') =>
    stats?.[key]?.[side === 'home' ? 'homeValue' : 'awayValue'] ?? 0

  switch (betType) {
    case 'match_winner':
      return prediction === winner ? 1 : 0

    case 'most_180s': {
      const home180s = stat('Thrown180', 'home')
      const away180s = stat('Thrown180', 'away')
      if (home180s === away180s) return 1 // tie — both correct
      const most = home180s > away180s ? player_home : player_away
      return prediction === most ? 1 : 0
    }

    case 'highest_checkout': {
      const homeCheckout = stat('HighestCheckout', 'home')
      const awayCheckout = stat('HighestCheckout', 'away')
      if (homeCheckout === awayCheckout) return 1 // tie — both correct
      const highest = homeCheckout > awayCheckout ? player_home : player_away
      return prediction === highest ? 1 : 0
    }

    case 'checkout_over_105': {
      const homeCheckout = stat('HighestCheckout', 'home')
      const awayCheckout = stat('HighestCheckout', 'away')
      const hasOver105 = Math.max(homeCheckout, awayCheckout) > 105.5
      return prediction === (hasOver105 ? 'yes' : 'no') ? 1 : 0
    }

    case 'higher_avg': {
      const homeAvg = stat('Average3Darts', 'home')
      const awayAvg = stat('Average3Darts', 'away')
      if (homeAvg === awayAvg) return 1 // tie — both correct
      const higher = homeAvg > awayAvg ? player_home : player_away
      return prediction === higher ? 1 : 0
    }

    case 'legs_over_9_5': {
      const totalLegs = score_home + score_away
      const isOver = totalLegs > 9.5
      return prediction === (isOver ? 'over' : 'under') ? 1 : 0
    }

    case '180s_over_6_5': {
      const total180s = stat('Thrown180', 'home') + stat('Thrown180', 'away')
      const isOver = total180s > 6.5
      return prediction === (isOver ? 'over' : 'under') ? 1 : 0
    }

    case 'first_thrower': {
      if (!firstThrower) return 0
      const firstThrowerName = firstThrower === 'home' ? player_home : player_away
      return prediction === firstThrowerName ? 1 : 0
    }

    default:
      return 0
  }
}