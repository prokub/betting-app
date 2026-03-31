'use client'

import { useSyncExternalStore } from 'react'

const TIMEZONE = 'Europe/Bratislava'
const LOCALE = 'en-GB'

function formatDate(isoDate: string, options: Intl.DateTimeFormatOptions): string {
  return new Date(isoDate).toLocaleDateString(LOCALE, { timeZone: TIMEZONE, ...options })
}

function formatDateTime(isoDate: string): string {
  const d = new Date(isoDate)
  const date = d.toLocaleDateString(LOCALE, {
    weekday: 'short', day: 'numeric', month: 'short', timeZone: TIMEZONE,
  })
  const time = d.toLocaleTimeString(LOCALE, {
    hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE,
  })
  return `${date} · ${time}`
}

const noop = (cb: () => void) => { cb(); return () => {} }

/** Returns '' on server, formatted date on client */
export function useBratislavaDate(
  isoDate: string,
  options: Intl.DateTimeFormatOptions
): string {
  return useSyncExternalStore(
    noop,
    () => formatDate(isoDate, options),
    () => '',
  )
}

/** Returns '' on server, formatted date+time on client */
export function useBratislavaDateTime(isoDate: string): string {
  return useSyncExternalStore(
    noop,
    () => formatDateTime(isoDate),
    () => '',
  )
}
