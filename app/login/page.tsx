'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    })
    setSubmitted(true)
    setLoading(false)
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
        <div className="text-center">
          <div className="text-4xl mb-4">🎯</div>
          <h1 className="text-xl font-semibold text-white mb-2">Check your email</h1>
          <p className="text-zinc-400 text-sm">We sent a magic link to <span className="text-white">{email}</span></p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎯</div>
          <h1 className="text-2xl font-bold text-white">Darts Bets</h1>
          <p className="text-zinc-400 text-sm mt-2">Premier League Darts · Season 2026</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold transition disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
        </form>
      </div>
    </div>
  )
}