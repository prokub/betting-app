const BASE = 'https://www.sofascore.com/api/v1'

// Hardcoded current season — update each January when new season starts
const CURRENT_SEASON_ID = 84759

// Note: HEADERS were used for direct API calls but now using ScraperAPI proxy instead

async function sfetch(url: string) {
    const proxyUrl = `http://api.scraperapi.com?api_key=${process.env.SCRAPER_API_KEY}&url=${encodeURIComponent(url)}`
    const res = await fetch(proxyUrl, { next: { revalidate: 0 } })
    if (!res.ok) throw new Error(`Sofascore ${res.status}: ${url}`)
    return res.json()
  }

export async function getCurrentSeasonId(): Promise<number> {
  // Use hardcoded ID to avoid Cloudflare blocking the seasons endpoint
  return CURRENT_SEASON_ID
}

interface SofascoreEvent {
  id: number
  homeTeam: { name: string }
  awayTeam: { name: string }
  startTimestamp: number
  tournament?: { id: number; name: string }
  status?: { code: number }
  homeScore?: { current: number | null }
  awayScore?: { current: number | null }
  roundInfo?: { name: string }
}

// Upcoming matches (not yet played)
export async function fetchUpcomingEvents(seasonId: number): Promise<SofascoreEvent[]> {
  const data = await sfetch(
    `${BASE}/unique-tournament/11565/season/${seasonId}/events/next/0`
  )
  return data.events ?? []
}

// Finished matches
export async function fetchFinishedEvents(seasonId: number): Promise<SofascoreEvent[]> {
  const data = await sfetch(
    `${BASE}/unique-tournament/11565/season/${seasonId}/events/last/0`
  )
  return data.events ?? []
}

// Per-match statistics — only available when status.code === 100
export async function fetchEventStatistics(eventId: number): Promise<Record<string, { [key: string]: unknown }> | null> {
  try {
    const data = await sfetch(`${BASE}/event/${eventId}/statistics`)
    const items = (data.statistics?.[0]?.groups?.[0]?.statisticsItems ?? []) as Array<{ key: string; [key: string]: unknown }>
    return Object.fromEntries(items.map(s => [s.key, s]))
  } catch {
    return null
  }
}

// Point-by-point — used to determine who threw first in leg 1
export async function fetchFirstThrower(eventId: number): Promise<'home' | 'away' | null> {
  try {
    const data = await sfetch(`${BASE}/event/${eventId}/point-by-point`)
    const firstPoint = data.pointByPoint?.[0]?.legs?.[0]?.points?.[0]
    if (!firstPoint) return null
    // isHome: false means away player threw first (their score was already reduced)
    return firstPoint.isHome === false ? 'away' : 'home'
  } catch {
    return null
  }
}

// Parse raw Sofascore events into DB rows
export function parseEvents(events: SofascoreEvent[]) {
  return events.map(e => {
    const nightMatch = e.tournament?.name?.match(/Night (\d+)/)
    const week = nightMatch ? parseInt(nightMatch[1]) : 0

    const homeScore = e.homeScore?.current ?? null
    const awayScore = e.awayScore?.current ?? null
    const status = e.status?.code === 100 ? 'finished' : 'upcoming'

    let winner: string | null = null
    if (status === 'finished' && homeScore !== null && awayScore !== null) {
      if (homeScore > awayScore) winner = e.homeTeam.name
      else if (awayScore > homeScore) winner = e.awayTeam.name
      // draw: winner stays null (shouldn't happen in darts)
    }

    return {
      external_id: String(e.id),
      week,
      night_id: e.tournament?.id ?? null,
      round_name: e.roundInfo?.name ?? null,   // "Quarterfinals" / "Semifinals" / "Final"
      player_home: e.homeTeam.name,
      player_away: e.awayTeam.name,
      match_date: new Date(e.startTimestamp * 1000).toISOString(),
      status,
      score_home: homeScore,
      score_away: awayScore,
      winner,
    }
  })
}