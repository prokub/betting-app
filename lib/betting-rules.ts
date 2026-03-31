/**
 * Betting rules and validation logic
 * - Deadline checking (bets close at tournament start)
 * - Round filtering (only quarterfinals available for regular bets)
 * - Point calculation
 */

import { BET_TYPE_CONFIG, BetType } from './types'

/**
 * Check if betting window is closed for a match
 * @param matchDate ISO string of match start time
 * @returns true if current time >= match start time
 */
export function isBettingClosed(matchDate: string): boolean {
  return new Date() >= new Date(matchDate)
}

/**
 * Get points for a specific bet type
 */
export function getPointsForBet(betType: keyof typeof BET_TYPE_CONFIG): number {
  return BET_TYPE_CONFIG[betType]?.points ?? 0
}

/**
 * Get difficulty for a specific bet type
 */
export function getDifficultyForBet(betType: keyof typeof BET_TYPE_CONFIG): string {
  return BET_TYPE_CONFIG[betType]?.difficulty ?? 'unknown'
}

/**
 * Get description for a specific bet type
 */
export function getDescriptionForBet(betType: keyof typeof BET_TYPE_CONFIG): string {
  return BET_TYPE_CONFIG[betType]?.description ?? ''
}

/**
 * Calculate max possible points for a night (4 matches)
 * Assuming user gets all 4 matches correct
 */
export function getMaxPointsPerNight(): number {
  const quarterfinalsPoints = [
    BET_TYPE_CONFIG.match_winner.points,
    BET_TYPE_CONFIG.first_thrower.points,
    BET_TYPE_CONFIG.higher_avg.points,
    BET_TYPE_CONFIG.most_180s.points,
    BET_TYPE_CONFIG.highest_checkout.points,
    BET_TYPE_CONFIG.legs_over_9_5.points,
    BET_TYPE_CONFIG['180s_over_6_5'].points,
    BET_TYPE_CONFIG.checkout_over_105.points,
  ].reduce((sum, points) => sum + points, 0)

  // 4 matches × total points per match
  return quarterfinalsPoints * 4
}

/**
 * Get max possible points for tournament bets
 * (finalist prediction + final winner)
 */
export function getMaxPointsForTournament(): number {
  // 2 finalist predictions (5 pts each) + 1 final winner (10 pts)
  return (BET_TYPE_CONFIG.finalist_prediction.points * 2) + BET_TYPE_CONFIG.final_winner.points
}

/**
 * Get total max points per week
 */
export function getTotalMaxPointsPerWeek(): number {
  return getMaxPointsPerNight() + getMaxPointsForTournament()
}

/**
 * Get all quarterfinal bet types
 */
export function getQuarterfinalBetTypes() {
  return Object.entries(BET_TYPE_CONFIG)
    .filter(([, config]) => config.round === 'quarterfinals')
    .map(([type]) => type)
}

/**
 * Get all tournament bet types
 */
export function getTournamentBetTypes() {
  return Object.entries(BET_TYPE_CONFIG)
    .filter(([, config]) => config.round === 'tournament')
    .map(([type]) => type)
}

/**
 * Check if a match_id represents a tournament bet (synthetic/non-match)
 */
export function isTournamentMatchId(matchId: string | null): boolean {
  return matchId?.startsWith('TOURNAMENT_') ?? false
}

/**
 * Get synthetic match ID for finalist predictions
 * @param week Night/week number — each night has its own tournament bets
 */
export function getTournamentFinalistsMatchId(week: number): string {
  return `TOURNAMENT_FINALISTS_W${week}`
}

/**
 * Validate prediction format for a given bet type
 * Ensures prediction matches expected structure
 */
export function validatePredictionFormat(betType: BetType, prediction: string): {
  valid: boolean
  error?: string
} {
  switch (betType) {
    case 'finalist_prediction': {
      try {
        const predictions = JSON.parse(prediction) as unknown
        if (!Array.isArray(predictions) || predictions.length !== 2) {
          return { valid: false, error: 'Finalist prediction must be JSON array with exactly 2 player names' }
        }
        if (!predictions.every(p => typeof p === 'string' && p.length > 0)) {
          return { valid: false, error: 'All predictions must be non-empty strings' }
        }
        return { valid: true }
      } catch {
        return { valid: false, error: 'Finalist prediction must be valid JSON' }
      }
    }

    case 'final_winner': {
      if (typeof prediction !== 'string' || prediction.length === 0) {
        return { valid: false, error: 'Final winner must be a player name' }
      }
      return { valid: true }
    }

    case 'match_winner':
    case 'most_180s':
    case 'highest_checkout':
    case 'higher_avg':
    case 'first_thrower': {
      if (typeof prediction !== 'string' || prediction.length === 0) {
        return { valid: false, error: 'Prediction must be a non-empty string' }
      }
      return { valid: true }
    }

    case 'checkout_over_105': {
      if (!['yes', 'no'].includes(prediction)) {
        return { valid: false, error: 'Prediction must be one of: yes, no' }
      }
      return { valid: true }
    }

    case 'legs_over_9_5':
    case '180s_over_6_5': {
      if (!['over', 'under'].includes(prediction)) {
        return { valid: false, error: 'Prediction must be one of: over, under' }
      }
      return { valid: true }
    }

    default:
      return { valid: false, error: 'Unknown bet type' }
  }
}

/**
 * Validate if user can place a bet
 * @param matchDate ISO string of match start time
 * @param roundName Name of the round (e.g., "Quarterfinals")
 * @returns object with { allowed: boolean, reason?: string }
 */
export function validateBetPlacement(matchDate: string, roundName: string | null): {
  allowed: boolean
  reason?: string
} {
  // Check if betting window is closed
  if (isBettingClosed(matchDate)) {
    return {
      allowed: false,
      reason: 'Betting window closed for this match',
    }
  }

  // Check if round is quarterfinals (for regular bets)
  if (roundName !== 'Quarterfinals') {
    return {
      allowed: false,
      reason: `${roundName || 'Unknown round'} bets are not available yet`,
    }
  }

  return { allowed: true }
}

/**
 * Validate tournament bet placement (only checks deadline)
 */
export function validateTournamentBetPlacement(tournamentStartDate: string): {
  allowed: boolean
  reason?: string
} {
  if (isBettingClosed(tournamentStartDate)) {
    return {
      allowed: false,
      reason: 'Betting window closed — tournament has started',
    }
  }
  return { allowed: true }
}
