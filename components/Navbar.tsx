'use client'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useRouter, usePathname } from 'next/navigation'

interface Props {
  displayName: string
  rank?: number
  totalPoints?: number
  nightsWon?: number
}

export default function Navbar({ displayName, rank, totalPoints, nightsWon }: Props) {
  const supabase = createClient()
  const router = useRouter()
  const pathname = usePathname()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const links = [
    { href: '/', label: 'Bets' },
    { href: '/leaderboard', label: 'Standings' },
    { href: '/history', label: 'History' },
  ]

  return (
    <nav className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center justify-between py-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span className="font-bold text-white text-sm">Darts Bets</span>
          </div>
          <div className="flex items-center gap-3">
            {totalPoints != null && (
              <div className="flex items-center gap-2 text-xs">
                {rank != null && <span className={`font-bold ${rank === 1 ? 'text-yellow-300' : 'text-zinc-400'}`}>#{rank}</span>}
                <span className="text-emerald-400 font-semibold">{totalPoints} pts</span>
                {nightsWon != null && nightsWon > 0 && (
                  <span className="text-yellow-300">🏆{nightsWon}</span>
                )}
              </div>
            )}
            <span className="text-zinc-400 text-xs">{displayName}</span>
            <button
              onClick={handleLogout}
              className="text-xs text-zinc-500 hover:text-white transition"
            >
              Sign out
            </button>
          </div>
        </div>
        <div className="flex gap-1 pb-2">
          {links.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`flex-1 text-center py-1.5 rounded-lg text-xs font-medium transition ${
                pathname === href
                  ? 'bg-zinc-800 text-white'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  )
}