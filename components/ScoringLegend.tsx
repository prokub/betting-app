"use client";

import { useState } from "react";
import { BET_TYPE_CONFIG, DIFFICULTY_COLORS, fmtPts } from "@/lib/types";

export function ScoringLegend() {
  const [isExpanded, setIsExpanded] = useState(false);

  const quarterfinalsTypes = Object.entries(BET_TYPE_CONFIG)
    .filter(([, config]) => config.round === "quarterfinals")
    .sort((a, b) => a[1].points - b[1].points);

  const tournamentTypes = Object.entries(BET_TYPE_CONFIG).filter(
    ([, config]) => config.round === "tournament",
  );

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-zinc-800/80 p-2 rounded-lg transition"
      >
        <h3 className="font-bold text-white">Scoring System</h3>
        <span className="text-zinc-400">{isExpanded ? "−" : "+"}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Quarterfinals Section */}
          <div>
            <h4 className="font-semibold text-zinc-300 mb-3">
              Quarterfinal Bets (Available Until Night Start)
            </h4>
            <div className="space-y-2">
              {quarterfinalsTypes.map(([betType, config]) => {
                const colors = DIFFICULTY_COLORS[config.difficulty] ?? DIFFICULTY_COLORS.medium;
                return (
                  <div
                    key={betType}
                    className={`border-l-4 ${colors.border} pl-3 py-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {config.label}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {config.description}
                        </p>
                      </div>
                      <span className={`ml-4 px-3 py-1 font-semibold rounded text-sm whitespace-nowrap ${colors.text} bg-zinc-800`}>
                        {fmtPts(config.points)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Difficulty:{" "}
                      <span className="capitalize">{config.difficulty.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-zinc-800/60 rounded-lg text-sm text-zinc-300">
              <p className="font-semibold mb-1">Per Night Maximum:</p>
              <p>
                {quarterfinalsTypes.reduce(
                  (sum, [, config]) => sum + config.points,
                  0,
                )}{" "}
                pts × 4 matches ={" "}
                {quarterfinalsTypes.reduce(
                  (sum, [, config]) => sum + config.points,
                  0,
                ) * 4}{" "}
                pts
              </p>
            </div>
          </div>

          {/* Tournament Section */}
          <div>
            <h4 className="font-semibold text-zinc-300 mb-3">
              Night Bets (Final Predictions)
            </h4>
            <div className="space-y-2">
              {tournamentTypes.map(([betType, config]) => {
                const colors = DIFFICULTY_COLORS[config.difficulty] ?? DIFFICULTY_COLORS.very_hard;
                return (
                  <div
                    key={betType}
                    className={`border-l-4 ${colors.border} pl-3 py-2`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-white">
                          {config.label}
                        </p>
                        <p className="text-sm text-zinc-400">
                          {config.description}
                        </p>
                      </div>
                      <span className={`ml-4 px-3 py-1 font-semibold rounded text-sm whitespace-nowrap ${colors.text} bg-zinc-800`}>
                        {fmtPts(config.points)}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Difficulty:{" "}
                      <span className="capitalize">{config.difficulty.replace("_", " ")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 p-3 bg-zinc-800/60 rounded-lg text-sm text-zinc-300">
              <p className="font-semibold mb-1">Night Bets Maximum:</p>
              <p>
                (2 finalist predictions × 5 pts) + 1 final winner = 20 pts total
              </p>
            </div>
          </div>

          {/* Point System Summary */}
          <div>
            <h4 className="font-semibold text-zinc-300 mb-3">Point Scale</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-emerald-950/40 rounded-lg border border-emerald-800 text-emerald-400">
                <span className="font-semibold">1 pt:</span> Easy (50/50)
              </div>
              <div className="p-2 bg-sky-950/40 rounded-lg border border-sky-800 text-sky-400">
                <span className="font-semibold">2 pts:</span> Medium (45%)
              </div>
              <div className="p-2 bg-amber-950/40 rounded-lg border border-amber-800 text-amber-400">
                <span className="font-semibold">3 pts:</span> Hard (25%)
              </div>
              <div className="p-2 bg-red-950/40 rounded-lg border border-red-800 text-red-400">
                <span className="font-semibold">5-10 pts:</span> Very Hard
              </div>
            </div>
            <div className="mt-3 p-3 bg-zinc-800/60 rounded-lg text-sm text-zinc-300">
              <p className="font-semibold mb-1">Tie Rules:</p>
              <p>
                If a multi-point bet (180s, checkout, average) ends in a tie,
                all players receive 1 point instead of the full points.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
