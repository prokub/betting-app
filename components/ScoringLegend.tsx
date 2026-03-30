'use client'

import { useState } from 'react'
import { BET_TYPE_CONFIG } from '@/lib/types'

export function ScoringLegend() {
  const [isExpanded, setIsExpanded] = useState(false)

  const quarterfinalsTypes = Object.entries(BET_TYPE_CONFIG)
    .filter(([, config]) => config.round === 'quarterfinals')
    .sort((a, b) => a[1].points - b[1].points)

  const tournamentTypes = Object.entries(BET_TYPE_CONFIG)
    .filter(([, config]) => config.round === 'tournament')

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between hover:bg-blue-100 p-2 rounded transition"
      >
        <h3 className="font-bold text-blue-900">Scoring System</h3>
        <span className="text-blue-600">{isExpanded ? '−' : '+'}</span>
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-6">
          {/* Quarterfinals Section */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              Quarterfinal Bets (Available Until Tournament Start)
            </h4>
            <div className="space-y-2">
              {quarterfinalsTypes.map(([betType, config]) => (
                <div key={betType} className="border-l-4 border-blue-400 pl-3 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                    <span className="ml-4 px-3 py-1 bg-blue-200 text-blue-900 font-semibold rounded text-sm whitespace-nowrap">
                      {config.points} pts
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Difficulty: <span className="capitalize">{config.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-blue-100 rounded text-sm text-gray-700">
              <p className="font-semibold mb-1">Per Night Maximum:</p>
              <p>
                {quarterfinalsTypes.reduce((sum, [, config]) => sum + config.points, 0)} pts × 4
                matches = {quarterfinalsTypes.reduce((sum, [, config]) => sum + config.points, 0) * 4} pts
              </p>
            </div>
          </div>

          {/* Tournament Section */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">
              Tournament Bets (After Semifinals)
            </h4>
            <div className="space-y-2">
              {tournamentTypes.map(([betType, config]) => (
                <div key={betType} className="border-l-4 border-purple-400 pl-3 py-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{config.label}</p>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                    <span className="ml-4 px-3 py-1 bg-purple-200 text-purple-900 font-semibold rounded text-sm whitespace-nowrap">
                      {config.points} pts
                    </span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Difficulty: <span className="capitalize">{config.difficulty}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 bg-purple-100 rounded text-sm text-gray-700">
              <p className="font-semibold mb-1">Tournament Maximum:</p>
              <p>
                (2 finalist predictions × 5 pts) + 1 final winner = 20 pts total
              </p>
            </div>
          </div>

          {/* Point System Summary */}
          <div>
            <h4 className="font-semibold text-gray-800 mb-3">Point Scale</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="p-2 bg-green-100 rounded border border-green-200">
                <span className="font-semibold text-green-900">1 pt:</span> Easy (50/50)
              </div>
              <div className="p-2 bg-blue-100 rounded border border-blue-200">
                <span className="font-semibold text-blue-900">2 pts:</span> Medium (45%)
              </div>
              <div className="p-2 bg-orange-100 rounded border border-orange-200">
                <span className="font-semibold text-orange-900">3 pts:</span> Hard (25%)
              </div>
              <div className="p-2 bg-red-100 rounded border border-red-200">
                <span className="font-semibold text-red-900">5-10 pts:</span> Very Hard
              </div>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              Points are scaled by difficulty and rarity. Harder bets are worth more.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
