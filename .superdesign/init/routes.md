# Route map

Framework: Next.js 16 App Router.

| URL | File | Notes |
|---|---|---|
| `/` | `src/app/page.tsx` | Immersive Mapa Vivo canvas, loader, and optional audiovisual brand story. |
| `/intro` | `src/app/intro/page.tsx` | Brand presentation experience. |
| `/live` | `src/app/live/page.tsx` | Live activity view. |
| `/leaderboard` | `src/app/leaderboard/page.tsx` | Ranked ecosystem participants. |
| `/roadmap` | `src/app/roadmap/page.tsx` | Product roadmap and voting. |
| `/shop` | `src/app/shop/page.tsx` | Store landing. |
| `/shop/[username]` | `src/app/shop/[username]/page.tsx` | User storefront. |
| `/dev/[username]` | `src/app/dev/[username]/page.tsx` | Public developer profile. |
| `/compare/[userA]/[userB]` | `src/app/compare/[userA]/[userB]/page.tsx` | Profile comparison. |
| `/advertise` | `src/app/advertise/page.tsx` | Advertising product. |
| `/support` | `src/app/support/page.tsx` | Contact/support. |
| `/privacy`, `/terms` | respective `page.tsx` | Legal pages using the editorial language. |
| `/admin/ads`, `/admin/brand` | respective pages | Internal administration surfaces. |

All routes inherit `src/app/layout.tsx`. Institutional routes commonly use `src/components/EditorialPageShell.tsx`; the home owns its immersive full-viewport shell.
