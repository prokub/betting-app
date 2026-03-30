import { BetType, BET_TYPE_CONFIG } from './types'

interface MatchResult {
  player_home: string
  player_away: string
  score_home: number
  score_away: number
  winner: string
  stats: Record<string, { [key: string]: unknown }> | null
  firstThrower: 'home' | 'away' | null
}

interface TournamentContext {
  finalists: string[] // Players who reached the final (should be exactly 2)
  finalWinner: string | null // The tournament winner
}

export function scoreBet(
  betType: BetType,
  prediction: string,
  result: MatchResult
): number {
  const { player_home, player_away, score_home, score_away, winner, stats, firstThrower } = result
  const pts = BET_TYPE_CONFIG[betType]?.points ?? 0

  const stat = (key: string, side: 'home' | 'away'): number =>
    (stats?.[key]?.[side === 'home' ? 'homeValue' : 'awayValue'] as number | undefined) ?? 0

  switch (betType) {
    case 'match_winner':
      return prediction === winner ? pts : 0

    case 'most_180s': {
      const home180s = stat('Thrown180', 'home')
      const away180s = stat('Thrown180', 'away')
      if (home180s === away180s) return 1 // tie — flat 1pt for everyone
      const most = home180s > away180s ? player_home : player_away
      return prediction === most ? pts : 0
    }

    case 'highest_checkout': {
      const homeCheckout = stat('HighestCheckout', 'home')
      const awayCheckout = stat('HighestCheckout', 'away')
      if (homeCheckout === awayCheckout) return 1 // tie — flat 1pt for everyone
      const highest = homeCheckout > awayCheckout ? player_home : player_away
      return prediction === highest ? pts : 0
    }

    case 'checkout_over_105': {
      const homeCheckout = stat('HighestCheckout', 'home')
      const awayCheckout = stat('HighestCheckout', 'away')
      const hasOver105 = Math.max(homeCheckout, awayCheckout) > 105.5
      return prediction === (hasOver105 ? 'yes' : 'no') ? pts : 0
    }

    case 'higher_avg': {
      const homeAvg = stat('Average3Darts', 'home')
      const awayAvg = stat('Average3Darts', 'away')
      if (homeAvg === awayAvg) return 1 // tie — flat 1pt for everyone
      const higher = homeAvg > awayAvg ? player_home : player_away
      return prediction === higher ? pts : 0
    }

    case 'legs_over_9_5': {
      const totalLegs = score_home + score_away
      const isOver = totalLegs > 9.5
      return prediction === (isOver ? 'over' : 'under') ? pts : 0
    }

    case '180s_over_6_5': {
      const total180s = stat('Thrown180', 'home') + stat('Thrown180', 'away')
      const isOver = total180s > 6.5
      return prediction === (isOver ? 'over' : 'under') ? pts : 0
    }

    case 'first_thrower': {
      if (!firstThrower) return 0
      const firstThrowerName = firstThrower === 'home' ? player_home : player_away
      return prediction === firstThrowerName ? pts : 0
    }

    default:
      return 0
  }
}

/**
 * Score tournament-level bets (finalist_prediction, final_winner)
 * These bets are tied to synthetic "tournament matches" not actual match results
 * @param betType bet type
 * @param prediction prediction value (JSON string for finalist_prediction, player name for final_winner)
 * @param context tournament context (finalists, finalWinner)
 * @returns points earned
 */
export function scoreTournamentBet(
  betType: BetType,
  prediction: string,
  context: TournamentContext
): number {
  switch (betType) {
    case 'finalist_prediction': {
      // prediction is JSON string: '["Player A", "Player B"]'
      try {
        const predictions = JSON.parse(prediction) as string[]
        if (!Array.isArray(predictions) || predictions.length !== 2) {
          return 0 // Invalid prediction format
        }

        const correctCount = predictions.filter(p => context.finalists.includes(p)).length

        // 0 pts if neither correct, 5 pts if one correct, 10 pts if both correct
        return correctCount * 5
      } catch {
        return 0 // JSON parse error
      }
    }

    case 'final_winner': {
      // prediction is the winner's name
      return prediction === context.finalWinner ? 10 : 0
    }

    default:
      return 0
  }
}

/**
 * Get tournament context from the final match
 * The final match tells us both finalists (home/away) and the winner
 * @param finalMatch the finished final match
 * @returns TournamentContext with finalists and finalWinner
 */
export function getTournamentContext(finalMatch: {
  player_home: string
  player_away: string
  winner: string | null
}): TournamentContext {
  return {
    finalists: [finalMatch.player_home, finalMatch.player_away],
    finalWinner: finalMatch.winner ?? null,
  }
}