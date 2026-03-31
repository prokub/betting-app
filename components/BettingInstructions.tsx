'use client'

export function BettingInstructions() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <h3 className="font-bold text-white mb-3">How Betting Works</h3>
      <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-2 text-sm text-zinc-300">
        <span className="font-semibold whitespace-nowrap">📋 Available Bets:</span>
        <span>
          During the night, you can bet on <strong className="text-white">quarterfinal matches only</strong>.
          Betting closes when the night starts.
        </span>
        <span className="font-semibold whitespace-nowrap">⏰ Deadline:</span>
        <span>
          Bets must be placed <strong className="text-white">before the first match starts</strong>. Check the countdown
          timer above.
        </span>
        <span className="font-semibold whitespace-nowrap">🎯 Point System:</span>
        <span>
          Each bet is worth 1-10 points based on difficulty. Harder bets (rarer events) are worth
          more.
        </span>
        <span className="font-semibold whitespace-nowrap">📊 Scoring:</span>
        <span>
          Points are awarded when your prediction matches the match outcome. Details are in the
          Scoring System guide below.
        </span>
        <span className="font-semibold whitespace-nowrap">🏆 Leaderboard:</span>
        <span>
          Weekly scores update after each match results are finalized. Check the leaderboard to
          see your rank.
        </span>
      </div>
    </div>
  )
}
