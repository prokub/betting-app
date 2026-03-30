# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Build & Dev Commands

- **Package manager**: Bun (`bun install`, `bun add <pkg>`)
- **Dev server**: `npm run dev` (localhost:3000)
- **Build**: `npm run build`
- **Lint**: `npx eslint` (ESLint 9 flat config with Next.js core web vitals + TypeScript)
- **No automated test suite yet** — `lib/scoring.test.ts` exists as a manual verification script using `console.assert()`. If setting up tests, use Vitest.

## Architecture

Premier League Darts betting app. Next.js 16 App Router + React 19 + Supabase + Tailwind CSS 4.

### Three Supabase clients — use the right one

| Context | Import | When |
|---------|--------|------|
| Server Components, API routes | `createClient()` from `@/lib/supabase/server` | Cookie-based session |
| Client Components | `createClient()` from `@/lib/supabase/client` | Browser-side, no cookies |
| Privileged operations | `createAdminClient()` from `@/lib/supabase/admin` | Service role key, bypasses RLS |

### API routes

All three live in `app/api/` and are POST-only:

- **`/api/bets`** — Create/update user bets. Requires user auth session. Upserts on `(user_id, match_id, bet_type)`.
- **`/api/sync-matches`** — Sync SofaScore match data into `matches` table. Auth: `Bearer $CRON_SECRET`.
- **`/api/evaluate`** — Score finished matches, update `bets.points_earned` and `weekly_scores`. Auth: `Bearer $CRON_SECRET`.

Cron routes are triggered by GitHub Actions workflows (`.github/workflows/sync.yml` Monday 9:00 UTC, `evaluate.yml` Thursday 23:00 UTC).

### Key business logic in `lib/`

- **`types.ts`** — All interfaces (`Match`, `Bet`, `Profile`, `WeeklyScore`) and `BET_TYPE_CONFIG` which defines labels, points, difficulty, and dynamic option generators per bet type.
- **`scoring.ts`** — `scoreBet()` for quarterfinal bets (0 or 1 point), `scoreTournamentBet()` for finalist/winner bets (0/5/10 points).
- **`betting-rules.ts`** — Validation: deadline checks (`isBettingClosed`), round restrictions, prediction format validation.
- **`sofascore.ts`** — SofaScore API integration via ScraperAPI proxy. Fetches events, statistics, first-thrower info. Season ID is hardcoded (`CURRENT_SEASON_ID`).
- **`queries.ts`** — Supabase query helpers for fetching matches with associated bets.

### Auth flow

Supabase Auth with cookie-based sessions. `middleware.ts` protects all routes except `/login`, `/register`, `/auth/*`. Registration creates both an auth user and a `profiles` row.

### Database tables (Supabase PostgreSQL)

- **matches** — External match data (players, scores, status, week, round_name)
- **bets** — User predictions per match per bet type, with `points_earned` (null until evaluated)
- **profiles** — User display names
- **weekly_scores** — Aggregated points per user per week

### Styling

Dark theme throughout: `bg-zinc-950`, `text-white`. Tailwind CSS 4 utility-first. Rounded corners (`rounded-2xl` cards, `rounded-xl` buttons). Accent colors: emerald (primary), red (error), zinc (backgrounds).

## Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Public Supabase config
- `SUPABASE_SERVICE_ROLE_KEY` — Admin client (bypasses RLS)
- `CRON_SECRET` — Auth for sync/evaluate API routes
- `SCRAPER_API_KEY` — SofaScore proxy via ScraperAPI

## Path Alias

`@/*` resolves to the project root (e.g., `@/lib/types`).
