import Navbar from '@/components/Navbar'
import NightSection from '@/components/NightSection'
import { ScoringLegend } from '@/components/ScoringLegend'
import TournamentBetCard from '@/components/TournamentBetCard'
import { BettingDeadline } from '@/components/BettingDeadline'
import { BettingInstructions } from '@/components/BettingInstructions'
import { getAuthenticatedUser, getUpcomingMatchesWithBets } from '@/lib/queries'
import { Match } from '@/lib/types'
import { SEASON } from '@/lib/config'
import { isTournamentMatchId } from '@/lib/betting-rules'

export default async function Home() {
  const auth = await getAuthenticatedUser()
  const { matches, bets } = await getUpcomingMatchesWithBets(auth.user.id)

  // Get tournament start date (first quarterfinal match)
  const tournamentStartDate = matches.length > 0 ? matches[0].match_date : new Date().toISOString()
  const isTournamentLocked = new Date(tournamentStartDate) <= new Date()

  // Separate tournament bets from match bets
  const tournamentBets = bets.filter(b => isTournamentMatchId(b.match_id))
  const matchBets = bets.filter(b => !isTournamentMatchId(b.match_id))

  // Group matches by week (night number)
  const byWeek = matches.reduce<Record<number, Match[]>>((acc, match) => {
    if (!acc[match.week]) acc[match.week] = []
    acc[match.week].push(match)
    return acc
  }, {})

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar displayName={auth.displayName} rank={auth.rank} totalPoints={auth.totalPoints} nightsWon={auth.nightsWon} />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Place your bets</h1>
          <p className="text-zinc-400 text-sm mt-1">{SEASON.display}</p>
        </div>

        <BettingInstructions />
        <BettingDeadline tournamentStartDate={tournamentStartDate} />
        <ScoringLegend />

        {weeks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm">No upcoming matches. Check back soon.</p>
          </div>
        ) : (
          <>
            {weeks.map(week => (
              <NightSection
                key={week}
                week={week}
                matches={byWeek[week]}
                bets={matchBets}
                nightStartDate={tournamentStartDate}
              />
            ))}
            <TournamentBetCard
              week={weeks[0]}
              matches={matches}
              existingBets={tournamentBets}
              isLocked={isTournamentLocked}
            />
          </>
        )}
      </main>
    </div>
  )
}