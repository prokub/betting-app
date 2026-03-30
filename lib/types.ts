export type MatchStatus = 'upcoming' | 'finished' | 'cancelled'

export type BetType =
  | 'match_winner'
  | 'most_180s'
  | 'highest_checkout'
  | 'checkout_over_105'
  | 'higher_avg'
  | 'legs_over_9_5'
  | '180s_over_6_5'
  | 'first_thrower'
  | 'finalist_prediction'
  | 'final_winner'

export type BetDifficulty = 'easy' | 'medium' | 'hard' | 'very_hard'
export type BetRound = 'quarterfinals' | 'tournament'

export interface Match {
  id: string
  external_id: string
  week: number
  night_id: number | null
  round_name: string | null   // "Quarterfinals" | "Semifinals" | "Final"
  player_home: string
  player_away: string
  match_date: string
  status: MatchStatus
  score_home: number | null
  score_away: number | null
  winner: string | null
}

export interface Bet {
  id: string
  user_id: string
  match_id: string
  bet_type: BetType
  prediction: string
  points_earned: number | null
  created_at: string
}

export interface Profile {
  id: string
  display_name: string
}

export interface WeeklyScore {
  user_id: string
  week: number
  points: number
  week_winner: boolean
}

// Bet type metadata — used to render the UI
export const BET_TYPE_CONFIG: Record<BetType, {
  label: string
  points: number
  difficulty: BetDifficulty
  round: BetRound
  description: string
  options: (home: string, away: string) => { value: string; label: string }[]
}> = {
  match_winner: {
    label: 'Who wins the match?',
    points: 1,
    difficulty: 'easy',
    round: 'quarterfinals',
    description: 'Basic prediction with 50/50 chance',
    options: (home, away) => [
      { value: home, label: home },
      { value: away, label: away },
    ],
  },
  most_180s: {
    label: 'Who throws more 180s?',
    points: 2,
    difficulty: 'medium',
    round: 'quarterfinals',
    description: 'Requires match knowledge, ~45% success rate',
    options: (home, away) => [
      { value: home, label: home },
      { value: away, label: away },
    ],
  },
  highest_checkout: {
    label: 'Who hits the highest checkout?',
    points: 2,
    difficulty: 'medium',
    round: 'quarterfinals',
    description: 'Requires match knowledge, ~45% success rate',
    options: (home, away) => [
      { value: home, label: home },
      { value: away, label: away },
    ],
  },
  checkout_over_105: {
    label: 'Will there be a 105.5+ checkout?',
    points: 3,
    difficulty: 'hard',
    round: 'quarterfinals',
    description: 'Rare event, only ~25% success rate',
    options: () => [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
    ],
  },
  higher_avg: {
    label: 'Who has the higher 3-dart average?',
    points: 2,
    difficulty: 'medium',
    round: 'quarterfinals',
    description: 'Requires match knowledge, ~45% success rate',
    options: (home, away) => [
      { value: home, label: home },
      { value: away, label: away },
    ],
  },
  legs_over_9_5: {
    label: 'Total legs — over or under 9.5?',
    points: 2,
    difficulty: 'medium',
    round: 'quarterfinals',
    description: 'Requires match knowledge, ~45% success rate',
    options: () => [
      { value: 'over', label: 'Over 9.5' },
      { value: 'under', label: 'Under 9.5' },
    ],
  },
  '180s_over_6_5': {
    label: 'Total 180s — over or under 6.5?',
    points: 2,
    difficulty: 'medium',
    round: 'quarterfinals',
    description: 'Requires match knowledge, ~45% success rate',
    options: () => [
      { value: 'over', label: 'Over 6.5' },
      { value: 'under', label: 'Under 6.5' },
    ],
  },
  first_thrower: {
    label: 'Who throws first in leg 1?',
    points: 1,
    difficulty: 'easy',
    round: 'quarterfinals',
    description: 'Random element, 50/50 chance',
    options: (home, away) => [
      { value: home, label: home },
      { value: away, label: away },
    ],
  },
  finalist_prediction: {
    label: 'Who reaches the final?',
    points: 5,
    difficulty: 'very_hard',
    round: 'tournament',
    description: 'Predict 2 of 4 semifinalists to reach the final. 5 pts per correct prediction.',
    options: () => [], // Handled specially in UI
  },
  final_winner: {
    label: 'Who wins the final?',
    points: 10,
    difficulty: 'very_hard',
    round: 'tournament',
    description: 'Predict the tournament winner. Only available after semifinals.',
    options: () => [], // Handled specially in UI
  },
}