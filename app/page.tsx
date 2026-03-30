import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Navbar from '@/components/Navbar'
import NightSection from '@/components/NightSection'
import { getUpcomingMatchesWithBets } from '@/lib/queries'
import { Match } from '@/lib/types'

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name')
    .eq('id', user.id)
    .single()

  const { matches, bets } = await getUpcomingMatchesWithBets(user.id)

  // Group matches by week (night number)
  const byWeek = matches.reduce<Record<number, Match[]>>((acc, match) => {
    if (!acc[match.week]) acc[match.week] = []
    acc[match.week].push(match)
    return acc
  }, {})

  const weeks = Object.keys(byWeek).map(Number).sort((a, b) => a - b)

  return (
    <div className="min-h-screen bg-zinc-950">
      <Navbar displayName={profile?.display_name ?? user.email ?? ''} />
      <main className="max-w-lg mx-auto px-4 py-6 flex flex-col gap-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Place your bets</h1>
          <p className="text-zinc-400 text-sm mt-1">Premier League Darts 2026</p>
        </div>

        {weeks.length === 0 ? (
          <div className="text-center py-16 text-zinc-500">
            <div className="text-4xl mb-3">🎯</div>
            <p className="text-sm">No upcoming matches. Check back soon.</p>
          </div>
        ) : (
          weeks.map(week => (
            <NightSection
              key={week}
              week={week}
              matches={byWeek[week]}
              bets={bets}
            />
          ))
        )}
      </main>
    </div>
  )
}