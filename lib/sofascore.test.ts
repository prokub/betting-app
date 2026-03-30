import { describe, it, expect, vi } from 'vitest'

vi.mock('@/lib/env', () => ({ env: {} }))

import { parseEvents } from './sofascore'

const makeEvent = (overrides = {}) => ({
  id: 12345,
  homeTeam: { name: 'Luke Littler' },
  awayTeam: { name: 'Gerwyn Price' },
  startTimestamp: 1742414400, // 2025-03-19T20:00:00Z
  tournament: { id: 100, name: 'Premier League, Night 4' },
  status: { code: 100 },
  homeScore: { current: 6 },
  awayScore: { current: 4 },
  roundInfo: { name: 'Quarterfinals' },
  ...overrides,
})

describe('parseEvents', () => {
  it('parses a finished event correctly', () => {
    const [result] = parseEvents([makeEvent()])
    expect(result.external_id).toBe('12345')
    expect(result.status).toBe('finished')
    expect(result.winner).toBe('Luke Littler')
    expect(result.score_home).toBe(6)
    expect(result.score_away).toBe(4)
    expect(result.week).toBe(4)
    expect(result.round_name).toBe('Quarterfinals')
  })

  it('parses walkover as cancelled', () => {
    const [result] = parseEvents([makeEvent({ status: { code: 91 }, homeScore: { current: null }, awayScore: { current: null } })])
    expect(result.status).toBe('cancelled')
    expect(result.winner).toBeNull()
  })

  it('parses upcoming event', () => {
    const [result] = parseEvents([makeEvent({ status: { code: 0 }, homeScore: { current: null }, awayScore: { current: null } })])
    expect(result.status).toBe('upcoming')
    expect(result.winner).toBeNull()
    expect(result.score_home).toBeNull()
    expect(result.score_away).toBeNull()
  })

  it('extracts week number from tournament name', () => {
    const [result] = parseEvents([makeEvent({ tournament: { id: 100, name: 'Premier League, Night 12' } })])
    expect(result.week).toBe(12)
  })

  it('defaults week to 0 when no Night in name', () => {
    const [result] = parseEvents([makeEvent({ tournament: { id: 100, name: 'Premier League Finals' } })])
    expect(result.week).toBe(0)
  })

  it('sets winner to away player when away score is higher', () => {
    const [result] = parseEvents([makeEvent({ homeScore: { current: 3 }, awayScore: { current: 6 } })])
    expect(result.winner).toBe('Gerwyn Price')
  })

  it('sets winner to null on draw', () => {
    const [result] = parseEvents([makeEvent({ homeScore: { current: 5 }, awayScore: { current: 5 } })])
    expect(result.winner).toBeNull()
  })

  it('handles missing scores gracefully', () => {
    const [result] = parseEvents([makeEvent({ homeScore: undefined, awayScore: undefined, status: { code: 0 } })])
    expect(result.score_home).toBeNull()
    expect(result.score_away).toBeNull()
  })
})
