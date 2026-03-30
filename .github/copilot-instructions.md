# Copilot Instructions for Betting App

## Getting Started

**New to this project?** Start here:
1. Read [DEV_SETUP.md](../DEV_SETUP.md) to set up local Supabase project and environment
2. Run `npm run dev` to start development server
3. Once testing is set up, read TESTING.md for test patterns

## Project Overview

This is a Premier League Darts betting application built with Next.js 16, React 19, TypeScript, and Supabase. Users can place bets on various match outcomes and track scores across multiple weeks.

## Build & Test Commands

- **Development server**: `npm run dev` (runs on localhost:3000)
- **Build**: `npm run build`
- **Start production server**: `npm start`
- **Lint**: `eslint` (runs ESLint on all files)
- **Test** (when set up): `npm test` / `npm test:watch` / `npm run e2e`

The project uses **Bun** as the package manager (see `bun.lock`). If you need to check dependencies or install packages, use Bun commands.

## Architecture

### Core Stack
- **Framework**: Next.js 16 (App Router, TypeScript, React 19)
- **Database & Auth**: Supabase (PostgreSQL + Auth)
- **Styling**: Tailwind CSS 4 with PostCSS
- **Type Safety**: TypeScript with strict mode enabled

### Key Features
- **Authentication**: Supabase Auth with middleware-enforced route protection
- **Betting System**: Multiple bet types on darts matches (match_winner, most_180s, highest_checkout, checkout_over_105, higher_avg, legs_over_9_5, 180s_over_6_5, first_thrower)
- **Match Syncing**: External match data integration from SofaScore API
- **Scoring**: Automatic point calculation and leaderboard tracking by week

### Directory Structure
```
app/
  layout.tsx          # Root layout with metadata
  page.tsx            # Home page (upcoming matches)
  api/
    bets/             # POST endpoint for creating/updating bets
    evaluate/         # Evaluate finished matches and award points
    sync-matches/     # Sync latest match data from external API
  auth/
    callback/         # Supabase auth callback handler
  login/              # Login page
  history/            # Match history page
  leaderboard/        # Leaderboard page
  globals.css         # Global styles with Tailwind imports

components/           # Reusable React components
  Navbar.tsx
  NightSection.tsx    # Groups matches by week
  MatchBetCard.tsx    # Individual match betting card

lib/
  supabase/
    server.ts         # Server-side Supabase client
    client.ts         # Client-side Supabase client
    admin.ts          # Admin/service role client
  queries.ts          # Data fetching functions
  types.ts            # TypeScript interfaces (Match, Bet, BetType config)
  scoring.ts          # Bet evaluation logic
  sofascore.ts        # External API integration

middleware.ts         # Auth middleware for route protection
```

## Key Conventions

### Database Types & Models
- **Match** interface defines betting data: id, external_id, week, player_home/away, match_date, status, score_home/away, winner
- **BetType** is a union of 8 specific bet types (see lib/types.ts)
- **Bet** tracks individual user predictions: bet_type, prediction, points_earned
- BET_TYPE_CONFIG in types.ts maps each bet type to UI labels and available options

### Supabase Client Usage
- **Server-side**: Use `createClient()` from `@/lib/supabase/server` for Server Components and API routes
- **Client-side**: Use `createClient()` from `@/lib/supabase/client` for Client Components
- **Admin operations**: Use `createAdminClient()` from `@/lib/supabase/admin` for service-role tasks

### Authentication & Middleware
- All routes except `/login` and `/auth/*` require authentication (enforced in middleware.ts)
- User session is checked via `supabase.auth.getUser()`
- Redirects unauthenticated users to `/login` and authenticated users accessing `/login` to `/`

### Data Fetching Patterns
- Use Supabase select/filter/order chains (e.g., `.eq()`, `.in()`, `.order()`)
- Queries in lib/queries.ts fetch both matches and associated bets for a user
- Match status is either 'upcoming' or 'finished'

### Styling
- Tailwind CSS with dark theme (bg-zinc-950, text-white)
- Use responsive padding/sizing: e.g., `max-w-lg mx-auto px-4`
- Component styling follows utility-first approach

### Environment Variables
- Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` for public Supabase config
- Additional secrets stored in .env.local (not committed)

## Important Notes

### Next.js Version
This project uses Next.js 16.2.1, which may have breaking changes from older versions. Refer to `node_modules/next/dist/docs/` when working with Next.js-specific features.

### Path Alias
TypeScript paths are configured to use `@/*` pointing to the root directory (e.g., `@/lib/types` resolves to `./lib/types`).

### ESLint Configuration
Uses ESLint 9 with Next.js core web vitals and TypeScript presets. Configuration is in eslint.config.mjs (flat config format).
