# Theme and brand tokens

## Compact token summary

- Core atmosphere: near-black warm background `#12110f`; warm foreground `#eee9df` / `#f2eee6`.
- Brand metallic accent: muted gold/sand `#b79a6c` and `#bda57e`.
- Secondary text: white at 35–55% opacity; dividers at 10–13% opacity.
- Home utility classes: `bg-bg`, `text-warm`; immersive canvas is full viewport and overflow-hidden.
- Editorial display: very large, light-weight headlines, tight tracking around `-0.055em`, compact uppercase eyebrow with `0.17em` tracking.
- Body: restrained sans-serif, 14–18px, generous 24–28px line height.
- Legacy/digital accent font: local `Silkscreen-Regular.ttf` in `public/fonts` for pixel/digital moments only.
- Widths: editorial copy `max-w-4xl`; broad pages `max-w-7xl`; responsive gutters 20/32/48px.
- Motion: cinematic fades and measured transitions; do not use playful bounce or generic SaaS micro-animation.
- Corners/shadows: restrained; favor borders, layered translucency, depth, and image/video atmosphere over rounded-card grids.

## Raw source locations

The authoritative complete raw theme sources are:

- `src/app/globals.css` (630 lines; Tailwind v4 import, root tokens, map/canvas/editorial surfaces, story player, responsive rules)
- `src/lib/dna-maia-theme.ts` (brand-story cues, durations, company ordering, audio selection)
- `src/lib/brand.ts` (brand naming and metadata)
- `postcss.config.mjs` (Tailwind PostCSS integration)

```css
/* Core values extracted from src/app/globals.css and current shared shell */
:root { --maia-bg: #12110f; --maia-warm: #eee9df; --maia-paper: #f2eee6; --maia-gold: #b79a6c; --maia-gold-soft: #bda57e; }
```
