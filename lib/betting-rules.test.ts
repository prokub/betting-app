import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  isBettingClosed,
  validatePredictionFormat,
  validateBetPlacement,
  isTournamentMatchId,
  getPointsForBet,
  getQuarterfinalBetTypes,
  getTournamentBetTypes,
} from './betting-rules'

describe('isBettingClosed', () => {
  afterEach(() => vi.useRealTimers())

  it('returns true when current time is past match date', () => {
    vi.useFakeTimers({ now: new Date('2026-03-20T22:00:00Z') })
    expect(isBettingClosed('2026-03-20T20:00:00Z')).toBe(true)
  })
  it('returns false when current time is before match date', () => {
    vi.useFakeTimers({ now: new Date('2026-03-20T18:00:00Z') })
    expect(isBettingClosed('2026-03-20T20:00:00Z')).toBe(false)
  })
})

describe('validatePredictionFormat', () => {
  it('accepts valid player name for match_winner', () => {
    expect(validatePredictionFormat('match_winner', 'Luke Littler')).toEqual({ valid: true })
  })
  it('rejects empty string for match_winner', () => {
    expect(validatePredictionFormat('match_winner', '').valid).toBe(false)
  })
  it('accepts yes/no/over/under for checkout_over_105', () => {
    expect(validatePredictionFormat('checkout_over_105', 'yes')).toEqual({ valid: true })
    expect(validatePredictionFormat('checkout_over_105', 'no')).toEqual({ valid: true })
  })
  it('rejects invalid value for legs_over_9_5', () => {
    expect(validatePredictionFormat('legs_over_9_5', 'maybe').valid).toBe(false)
  })
  it('accepts over/under for 180s_over_6_5', () => {
    expect(validatePredictionFormat('180s_over_6_5', 'over')).toEqual({ valid: true })
    expect(validatePredictionFormat('180s_over_6_5', 'under')).toEqual({ valid: true })
  })
  it('accepts valid finalist prediction JSON', () => {
    expect(validatePredictionFormat('finalist_prediction', '["Player A", "Player B"]')).toEqual({ valid: true })
  })
  it('rejects invalid JSON for finalist_prediction', () => {
    expect(validatePredictionFormat('finalist_prediction', 'not-json').valid).toBe(false)
  })
  it('rejects wrong array length for finalist_prediction', () => {
    expect(validatePredictionFormat('finalist_prediction', '["Player A"]').valid).toBe(false)
  })
  it('rejects non-string elements in finalist_prediction', () => {
    expect(validatePredictionFormat('finalist_prediction', '[1, 2]').valid).toBe(false)
  })
  it('rejects empty strings in finalist_prediction', () => {
    expect(validatePredictionFormat('finalist_prediction', '["", "Player B"]').valid).toBe(false)
  })
  it('accepts valid final_winner', () => {
    expect(validatePredictionFormat('final_winner', 'Player A')).toEqual({ valid: true })
  })
  it('rejects empty final_winner', () => {
    expect(validatePredictionFormat('final_winner', '').valid).toBe(false)
  })
})

describe('validateBetPlacement', () => {
  afterEach(() => vi.useRealTimers())

  it('allows bet on future Quarterfinals match', () => {
    vi.useFakeTimers({ now: new Date('2026-03-18T12:00:00Z') })
    expect(validateBetPlacement('2026-03-19T20:00:00Z', 'Quarterfinals')).toEqual({ allowed: true })
  })
  it('rejects bet on past match', () => {
    vi.useFakeTimers({ now: new Date('2026-03-20T22:00:00Z') })
    const result = validateBetPlacement('2026-03-20T20:00:00Z', 'Quarterfinals')
    expect(result.allowed).toBe(false)
  })
  it('rejects bet on non-Quarterfinals round', () => {
    vi.useFakeTimers({ now: new Date('2026-03-18T12:00:00Z') })
    const result = validateBetPlacement('2026-03-19T20:00:00Z', 'Semifinals')
    expect(result.allowed).toBe(false)
  })
  it('rejects bet with null round name', () => {
    vi.useFakeTimers({ now: new Date('2026-03-18T12:00:00Z') })
    const result = validateBetPlacement('2026-03-19T20:00:00Z', null)
    expect(result.allowed).toBe(false)
  })
})

describe('isTournamentMatchId', () => {
  it('returns true for TOURNAMENT_ prefix', () => {
    expect(isTournamentMatchId('TOURNAMENT_FINALISTS')).toBe(true)
  })
  it('returns false for regular match ID', () => {
    expect(isTournamentMatchId('abc-123')).toBe(false)
  })
  it('returns false for null', () => {
    expect(isTournamentMatchId(null)).toBe(false)
  })
})

describe('getPointsForBet', () => {
  it('returns correct points for each bet type', () => {
    expect(getPointsForBet('match_winner')).toBe(1)
    expect(getPointsForBet('checkout_over_105')).toBe(3)
    expect(getPointsForBet('final_winner')).toBe(10)
  })
})

describe('bet type filters', () => {
  it('returns 8 quarterfinal bet types', () => {
    expect(getQuarterfinalBetTypes()).toHaveLength(8)
  })
  it('returns 2 tournament bet types', () => {
    expect(getTournamentBetTypes()).toHaveLength(2)
  })
})
