'use client'

import { useState } from 'react'

interface UseBetSaveReturn {
  saving: Record<string, boolean>
  saved: Record<string, boolean>
  error: string | null
  saveBet: (params: {
    match_id: string
    bet_type: string
    prediction: string
  }) => Promise<boolean>
}

export function useBetSave(): UseBetSaveReturn {
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [error, setError] = useState<string | null>(null)

  async function saveBet(params: {
    match_id: string
    bet_type: string
    prediction: string
  }): Promise<boolean> {
    const key = params.bet_type
    setSaving(prev => ({ ...prev, [key]: true }))
    setSaved(prev => ({ ...prev, [key]: false }))
    setError(null)

    try {
      const res = await fetch('/api/bets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      if (res.ok) {
        setSaved(prev => ({ ...prev, [key]: true }))
        setTimeout(() => setSaved(prev => ({ ...prev, [key]: false })), 2000)
        return true
      }
      const data = await res.json().catch(() => null)
      setError(data?.error ?? 'Failed to save bet')
      return false
    } catch {
      setError('Network error')
      return false
    } finally {
      setSaving(prev => ({ ...prev, [key]: false }))
    }
  }

  return { saving, saved, error, saveBet }
}
