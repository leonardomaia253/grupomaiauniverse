# Key page dependency trees

## `/` — Home / Mapa Vivo
Entry: `src/app/page.tsx`
- `src/components/UniverseCanvas.tsx`
- `src/components/LoadingScreen.tsx`
- `src/components/MaiaStoryIntro.tsx`
  - `src/lib/dna-maia-theme.ts`
- `src/app/globals.css`
- `src/app/layout.tsx`
  - `src/lib/brand.ts`

Actual rendered home branch is a full-viewport immersive canvas. Loading overlays first; the audiovisual story can overlay after load; a compact replay control remains when the story is closed.

## `/intro`
Entry: `src/app/intro/page.tsx`
- `src/components/MaiaStoryIntro.tsx`
  - `src/lib/dna-maia-theme.ts`
- `src/app/globals.css`

## `/roadmap`
Entry: `src/app/roadmap/page.tsx`
- `src/app/roadmap/RoadmapClient.tsx`
- `src/app/roadmap/actions.ts`
- `src/lib/roadmap-data.ts`
- `src/app/globals.css`

## `/support`
Entry: `src/app/support/page.tsx`
- `src/components/EditorialPageShell.tsx`
- `src/app/globals.css`

## `/privacy` and `/terms`
Entries: respective `src/app/*/page.tsx`
- `src/components/EditorialPageShell.tsx`
- `src/app/globals.css`

## `/dev/[username]`
Entry: `src/app/dev/[username]/page.tsx`
- `src/components/ProfileTracker.tsx`
- `src/components/ClaimButton.tsx`
- `src/components/DeleteAccountButton.tsx`
- `src/lib/supabase-server.ts`
- `src/app/globals.css`

## `/leaderboard`
Entry: `src/app/leaderboard/page.tsx`
- `src/components/LeaderboardTracker.tsx`
- `src/lib/supabase-server.ts`
- `src/app/globals.css`

## `/advertise`
Entry: `src/app/advertise/page.tsx`
- `src/app/advertise/tracking.tsx`
- `src/lib/skyAdPlans.ts`
- `src/app/globals.css`
