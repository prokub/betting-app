'use client'

export function BettingInstructions() {
  return (
    <div className="bg-green-50 border border-green-300 rounded-lg p-4 mb-6">
      <h3 className="font-bold text-green-900 mb-3">How Betting Works</h3>
      <div className="space-y-2 text-sm text-green-800">
        <div className="flex gap-2">
          <span className="font-semibold min-w-fit">📋 Available Bets:</span>
          <span>
            During the tournament, you can bet on <strong>quarterfinal matches only</strong>.
            Betting closes when the tournament starts.
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold min-w-fit">⏰ Deadline:</span>
          <span>
            Bets must be placed <strong>before the first match starts</strong>. Check the countdown
            timer above.
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold min-w-fit">🎯 Point System:</span>
          <span>
            Each bet is worth 1-10 points based on difficulty. Harder bets (rarer events) are worth
            more.
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold min-w-fit">📊 Scoring:</span>
          <span>
            Points are awarded when your prediction matches the match outcome. Details are in the
            Scoring System guide above.
          </span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold min-w-fit">🏆 Leaderboard:</span>
          <span>
            Weekly scores update after each match results are finalized. Check the leaderboard to
            see your rank.
          </span>
        </div>
      </div>
    </div>
  )
}
