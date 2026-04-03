interface StandingRow {
  position: number
  player: string
  played: number
  won: number
  points: number
}

interface Props {
  standings: StandingRow[]
}

export default function PlayerStandings({ standings }: Props) {
  if (standings.length === 0) return null

  return (
    <section>
      <h2 className="text-lg font-bold text-white mb-3">Tournament Table</h2>
      <div className="bg-zinc-900 rounded-2xl border border-zinc-800 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-3 py-2.5 text-zinc-500 font-medium text-xs">#</th>
              <th className="text-left px-3 py-2.5 text-zinc-500 font-medium text-xs">Player</th>
              <th className="text-center px-2 py-2.5 text-zinc-500 font-medium text-xs">P</th>
              <th className="text-center px-2 py-2.5 text-zinc-500 font-medium text-xs">W</th>
              <th className="text-center px-3 py-2.5 text-zinc-500 font-medium text-xs">Pts</th>
            </tr>
          </thead>
          <tbody>
            {standings.map((row, idx) => {
              const isLast = idx === standings.length - 1
              return (
                <tr key={row.player} className={!isLast ? 'border-b border-zinc-800/50' : ''}>
                  <td className="px-3 py-2.5 text-zinc-500 text-xs">{row.position}</td>
                  <td className="px-3 py-2.5 text-white text-xs font-medium truncate max-w-[140px]">{row.player}</td>
                  <td className="px-2 py-2.5 text-center text-zinc-400 text-xs">{row.played}</td>
                  <td className="px-2 py-2.5 text-center text-zinc-400 text-xs">{row.won}</td>
                  <td className="px-3 py-2.5 text-center text-white text-xs font-semibold">{row.points}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </section>
  )
}
