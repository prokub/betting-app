import { describe, it, expect } from 'vitest'
import { scoreBet, scoreTournamentBet, getTournamentContext } from './scoring'

const baseResult = {
  player_home: 'Luke Littler',
  player_away: 'Gerwyn Price',
  score_home: 6,
  score_away: 4,
  winner: 'Luke Littler',
  stats: {
    Thrown180: { homeValue: 5, awayValue: 3 },
    HighestCheckout: { homeValue: 120, awayValue: 98 },
    Average3Darts: { homeValue: 99.5, awayValue: 95.2 },
  },
  firstThrower: 'home' as const,
}

describe('scoreBet', () => {
  describe('match_winner (1pt)', () => {
    it('returns 1 for correct prediction', () => {
      expect(scoreBet('match_winner', 'Luke Littler', baseResult)).toBe(1)
    })
    it('returns 0 for incorrect prediction', () => {
      expect(scoreBet('match_winner', 'Gerwyn Price', baseResult)).toBe(0)
    })
  })

  describe('most_180s (2pts)', () => {
    it('returns 2 for correct prediction', () => {
      expect(scoreBet('most_180s', 'Luke Littler', baseResult)).toBe(2)
    })
    it('returns 0 for incorrect prediction', () => {
      expect(scoreBet('most_180s', 'Gerwyn Price', baseResult)).toBe(0)
    })
    it('returns 1 on tie (flat tie bonus)', () => {
      const tied = { ...baseResult, stats: { ...baseResult.stats, Thrown180: { homeValue: 4, awayValue: 4 } } }
      expect(scoreBet('most_180s', 'Gerwyn Price', tied)).toBe(1)
    })
  })

  describe('highest_checkout (2pts)', () => {
    it('returns 2 for correct prediction', () => {
      expect(scoreBet('highest_checkout', 'Luke Littler', baseResult)).toBe(2)
    })
    it('returns 0 for incorrect prediction', () => {
      expect(scoreBet('highest_checkout', 'Gerwyn Price', baseResult)).toBe(0)
    })
    it('returns 1 on tie', () => {
      const tied = { ...baseResult, stats: { ...baseResult.stats, HighestCheckout: { homeValue: 100, awayValue: 100 } } }
      expect(scoreBet('highest_checkout', 'Luke Littler', tied)).toBe(1)
    })
  })

  describe('higher_avg (2pts)', () => {
    it('returns 2 for correct prediction', () => {
      expect(scoreBet('higher_avg', 'Luke Littler', baseResult)).toBe(2)
    })
    it('returns 0 for incorrect prediction', () => {
      expect(scoreBet('higher_avg', 'Gerwyn Price', baseResult)).toBe(0)
    })
    it('returns 1 on tie', () => {
      const tied = { ...baseResult, stats: { ...baseResult.stats, Average3Darts: { homeValue: 97, awayValue: 97 } } }
      expect(scoreBet('higher_avg', 'Gerwyn Price', tied)).toBe(1)
    })
  })

  describe('checkout_over_105 (3pts)', () => {
    it('returns 3 for correct "yes" when checkout > 105.5', () => {
      expect(scoreBet('checkout_over_105', 'yes', baseResult)).toBe(3)
    })
    it('returns 0 for "no" when checkout > 105.5', () => {
      expect(scoreBet('checkout_over_105', 'no', baseResult)).toBe(0)
    })
    it('returns 3 for correct "no" when checkout <= 105.5', () => {
      const low = { ...baseResult, stats: { ...baseResult.stats, HighestCheckout: { homeValue: 100, awayValue: 90 } } }
      expect(scoreBet('checkout_over_105', 'no', low)).toBe(3)
    })
    it('returns 0 for "yes" when checkout is exactly 105', () => {
      const exact = { ...baseResult, stats: { ...baseResult.stats, HighestCheckout: { homeValue: 105, awayValue: 80 } } }
      expect(scoreBet('checkout_over_105', 'yes', exact)).toBe(0)
    })
  })

  describe('legs_over_9_5 (2pts)', () => {
    it('returns 2 for "over" when total legs > 9.5', () => {
      expect(scoreBet('legs_over_9_5', 'over', baseResult)).toBe(2) // 6+4=10
    })
    it('returns 2 for "under" when total legs <= 9.5', () => {
      const low = { ...baseResult, score_home: 6, score_away: 3 }
      expect(scoreBet('legs_over_9_5', 'under', low)).toBe(2) // 6+3=9
    })
    it('returns 0 for wrong prediction', () => {
      expect(scoreBet('legs_over_9_5', 'under', baseResult)).toBe(0) // 10 > 9.5
    })
  })

  describe('180s_over_6_5 (2pts)', () => {
    it('returns 2 for "over" when total 180s > 6.5', () => {
      expect(scoreBet('180s_over_6_5', 'over', baseResult)).toBe(2) // 5+3=8
    })
    it('returns 2 for "under" when total 180s <= 6.5', () => {
      const low = { ...baseResult, stats: { ...baseResult.stats, Thrown180: { homeValue: 2, awayValue: 3 } } }
      expect(scoreBet('180s_over_6_5', 'under', low)).toBe(2) // 5
    })
    it('returns 0 for wrong prediction', () => {
      expect(scoreBet('180s_over_6_5', 'under', baseResult)).toBe(0) // 8 > 6.5
    })
  })

  describe('first_thrower (1pt)', () => {
    it('returns 1 for correct prediction', () => {
      expect(scoreBet('first_thrower', 'Luke Littler', baseResult)).toBe(1)
    })
    it('returns 0 for incorrect prediction', () => {
      expect(scoreBet('first_thrower', 'Gerwyn Price', baseResult)).toBe(0)
    })
    it('returns 0 when firstThrower is null', () => {
      const noThrower = { ...baseResult, firstThrower: null }
      expect(scoreBet('first_thrower', 'Luke Littler', noThrower)).toBe(0)
    })
  })

  it('returns 1 (tie) for null stats since 0 === 0', () => {
    const noStats = { ...baseResult, stats: null }
    expect(scoreBet('most_180s', 'Luke Littler', noStats)).toBe(1)
  })
})

describe('scoreTournamentBet', () => {
  const context = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }

  describe('finalist_prediction', () => {
    it('returns 10 for both correct', () => {
      expect(scoreTournamentBet('finalist_prediction', '["Player A", "Player B"]', context)).toBe(10)
    })
    it('returns 5 for one correct', () => {
      expect(scoreTournamentBet('finalist_prediction', '["Player A", "Player C"]', context)).toBe(5)
    })
    it('returns 0 for none correct', () => {
      expect(scoreTournamentBet('finalist_prediction', '["Player C", "Player D"]', context)).toBe(0)
    })
    it('returns 0 for invalid JSON', () => {
      expect(scoreTournamentBet('finalist_prediction', 'not-json', context)).toBe(0)
    })
    it('returns 0 for wrong array length', () => {
      expect(scoreTournamentBet('finalist_prediction', '["Player A"]', context)).toBe(0)
    })
  })

  describe('final_winner', () => {
    it('returns 10 for correct prediction', () => {
      expect(scoreTournamentBet('final_winner', 'Player A', context)).toBe(10)
    })
    it('returns 0 for incorrect prediction', () => {
      expect(scoreTournamentBet('final_winner', 'Player B', context)).toBe(0)
    })
  })
})

describe('getTournamentContext', () => {
  it('extracts finalists and winner', () => {
    const ctx = getTournamentContext({ player_home: 'A', player_away: 'B', winner: 'A' })
    expect(ctx.finalists).toEqual(['A', 'B'])
    expect(ctx.finalWinner).toBe('A')
  })
  it('handles null winner', () => {
    const ctx = getTournamentContext({ player_home: 'A', player_away: 'B', winner: null })
    expect(ctx.finalWinner).toBeNull()
  })
})
