"use client";

import { useEffect, useState } from "react";

interface BettingDeadlineProps {
  tournamentStartDate: string;
}

export function BettingDeadline({ tournamentStartDate }: BettingDeadlineProps) {
  const [timeRemaining, setTimeRemaining] = useState<string>("");
  const [isClosed, setIsClosed] = useState(false);

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const deadline = new Date(tournamentStartDate).getTime();
      const difference = deadline - now;
      if (difference <= 0) {
        setIsClosed(true);
        setTimeRemaining("CLOSED");
        return;
      }

      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / 1000 / 60) % 60);
      const seconds = Math.floor((difference / 1000) % 60);

      setTimeRemaining(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [tournamentStartDate]);

  if (isClosed) {
    return (
      <div className="bg-red-950/40 border border-red-800 rounded-xl p-4 mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🚫</span>
          <div>
            <h3 className="font-bold text-red-400">Betting Closed</h3>
            <p className="text-sm text-red-300/80">
              Tournament has started. No more bets accepted.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-white">Betting Window</h3>
          <p className="text-sm text-zinc-400">
            Place your bets before the night starts
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-emerald-400 font-mono">
            {timeRemaining}
          </div>
          <div className="text-xs text-zinc-500">Time remaining</div>
        </div>
      </div>
    </div>
  );
}
