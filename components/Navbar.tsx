'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function Navbar({ displayName }: { displayName: string }) {
  const supabase = createClient()
  const router = useRouter()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <nav className="sticky top-0 z-10 bg-zinc-950/90 backdrop-blur border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-xl">🎯</span>
        <span className="font-bold text-white text-sm">Darts Bets</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-zinc-400 text-sm">{displayName}</span>
        <button
          onClick={handleLogout}
          className="text-xs text-zinc-500 hover:text-white transition"
        >
          Sign out
        </button>
      </div>
    </nav>
  )
}