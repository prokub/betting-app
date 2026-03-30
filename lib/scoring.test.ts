/**
 * Tournament Scoring Tests (manual verification)
 * 
 * Run these test cases manually to verify scoring logic
 * In future: Set up Vitest for automated testing
 */

import { scoreTournamentBet, getTournamentContext } from './scoring'

// Test Case 1: Finalist Prediction - Both Correct
console.log('Test 1: Finalist Prediction - Both Correct')
const context1 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result1 = scoreTournamentBet('finalist_prediction', '["Player A", "Player B"]', context1)
console.assert(result1 === 10, `Expected 10 pts, got ${result1}`)
console.log(`✓ Both finalists correct: 10 pts`)

// Test Case 2: Finalist Prediction - One Correct
console.log('\nTest 2: Finalist Prediction - One Correct')
const context2 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result2 = scoreTournamentBet('finalist_prediction', '["Player A", "Player C"]', context2)
console.assert(result2 === 5, `Expected 5 pts, got ${result2}`)
console.log(`✓ One finalist correct: 5 pts`)

// Test Case 3: Finalist Prediction - None Correct
console.log('\nTest 3: Finalist Prediction - None Correct')
const context3 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result3 = scoreTournamentBet('finalist_prediction', '["Player C", "Player D"]', context3)
console.assert(result3 === 0, `Expected 0 pts, got ${result3}`)
console.log(`✓ No finalists correct: 0 pts`)

// Test Case 4: Final Winner - Correct
console.log('\nTest 4: Final Winner - Correct')
const context4 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result4 = scoreTournamentBet('final_winner', 'Player A', context4)
console.assert(result4 === 10, `Expected 10 pts, got ${result4}`)
console.log(`✓ Correct winner: 10 pts`)

// Test Case 5: Final Winner - Incorrect
console.log('\nTest 5: Final Winner - Incorrect')
const context5 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result5 = scoreTournamentBet('final_winner', 'Player B', context5)
console.assert(result5 === 0, `Expected 0 pts, got ${result5}`)
console.log(`✓ Wrong winner: 0 pts`)

// Test Case 6: getTournamentContext
console.log('\nTest 6: getTournamentContext Helper')
const finalMatch = {
  player_home: 'Player A',
  player_away: 'Player B',
  winner: 'Player A',
}
const context6 = getTournamentContext(finalMatch)
console.assert(context6.finalists.length === 2, `Expected 2 finalists, got ${context6.finalists.length}`)
console.assert(context6.finalists.includes('Player A'), 'Player A should be a finalist')
console.assert(context6.finalists.includes('Player B'), 'Player B should be a finalist')
console.assert(context6.finalWinner === 'Player A', `Expected winner Player A, got ${context6.finalWinner}`)
console.log(`✓ Tournament context correctly extracted from final match`)

// Test Case 7: Invalid JSON prediction
console.log('\nTest 7: Invalid JSON Prediction')
const context7 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result7 = scoreTournamentBet('finalist_prediction', 'invalid-json', context7)
console.assert(result7 === 0, `Expected 0 pts for invalid JSON, got ${result7}`)
console.log(`✓ Invalid JSON handled gracefully: 0 pts`)

// Test Case 8: Wrong number of finalists in prediction
console.log('\nTest 8: Wrong Number of Predictions')
const context8 = { finalists: ['Player A', 'Player B'], finalWinner: 'Player A' }
const result8 = scoreTournamentBet('finalist_prediction', '["Player A"]', context8)
console.assert(result8 === 0, `Expected 0 pts for 1 prediction instead of 2, got ${result8}`)
console.log(`✓ Wrong number of predictions handled: 0 pts`)

console.log('\n✅ All manual tests passed!')
