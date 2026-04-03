'use client'

import { useState, useEffect } from 'react'

/**
 * Returns a locked state that flips to true when the deadline passes.
 * Uses a single setTimeout — no polling.
 */
export function useLockTimer(deadline: string | null, initialLocked = false): boolean {
  const [isLocked, setIsLocked] = useState(() =>
    initialLocked || (deadline ? new Date(deadline) <= new Date() : false)
  )

  useEffect(() => {
    if (isLocked || !deadline) return
    const ms = new Date(deadline).getTime() - Date.now()
    if (ms <= 0) return
    const id = setTimeout(() => setIsLocked(true), ms)
    return () => clearTimeout(id)
  }, [deadline, isLocked])

  return isLocked
}
