# Grupo Maia Universe — Design System Direction

## Product and experience

Grupo Maia Universe is the institutional gateway and living map of a diverse company ecosystem. The main job is to let clients, partners, talent, and investors understand the portfolio quickly while preserving a sense of discovery. The home is not a conventional corporate landing page: it is an editorial directory fused with an immersive spatial map and a cinematic brand story.

Primary user tasks:
- Understand what Grupo Maia is within seconds.
- Browse companies by name or operating sector.
- Switch between an accessible index and the immersive map without losing context.
- Open a company and understand its role in the ecosystem.
- Watch the audiovisual group presentation as an optional layer, never as a gate.
- Reach contact, institutional, privacy, and terms pages predictably.

## Brand essence

Preserve: Brazilian entrepreneurial confidence, warm sophistication, ecosystem thinking, cinematic atmosphere, editorial restraint, digital experimentation, and the tension between human craft and technology.

Avoid: generic AI/SaaS dashboards, violet/neon gradients, glassmorphism everywhere, excessive pills, interchangeable icon-card grids, gamified visual noise on institutional pages, and decorative complexity without information value.

## Visual language

- Canvas: warm near-black `#12110F`, never cold blue-black.
- Primary text: bone `#F2EEE6`; body text `rgba(242,238,230,.58)`.
- Brand accent: mineral gold `#B79A6C`; bright accent only for a deliberate active state.
- Lines: `rgba(255,255,255,.10)`; favor rules and frames over rounded floating cards.
- Display typography: large, modern grotesk/sans with very tight tracking; use an elegant italic serif only as a rare editorial counterpoint in major statements, never for controls or dense content.
- Digital/pixel font: local Silkscreen only for coordinates, system labels, counters, or small map telemetry.
- Spacing: use a disciplined 8px base. Major sections breathe with 64–120px vertical rhythm; controls remain compact.
- Radius: 0–8px for most structural elements; pills reserved for segmented controls and compact status/actions.
- Depth: subtle image/video atmosphere, soft vignette, hairlines, translucency, and scale — not heavy drop shadows.
- Imagery: use the project's real company/map/story media. Do not introduce stock office photography.

## Home architecture

Desktop should feel composed, intentional, and legible at first glance:

1. A quiet global header with the authentic MAIA Grupo wordmark, clear navigation, optional sound/presentation status, and one contact action.
2. A strong editorial opening that explains the group in plain Portuguese without occupying half the usable viewport.
3. A visible mode switch for `Mapa` and `Índice`, treated as two lenses on the same portfolio.
4. The index is a high-quality editorial directory: fast search, useful sector filters, stable columns, deliberate hover/focus states, and company rows that reveal enough context to invite exploration.
5. The map is immersive but retains wayfinding: search, selected-company context, zoom/drag hints, and a clear path back to the index.
6. The audiovisual presentation is an optional cinematic layer with direct, accessible controls.
7. Contact and institutional navigation remain available without competing with the core browsing task.

Mobile must not merely stack desktop panels. Prioritize header, concise brand proposition, sticky mode switch/search, readable company rows, thumb-safe controls, and full-screen map/detail states with explicit back navigation.

## Interaction and motion

- Use 180–260ms transitions for controls and panels; 500–900ms cinematic transitions only when entering the story or switching major spatial modes.
- Animate opacity, transform, clip/reveal, and map focus with restraint.
- Preserve scroll position and query when switching between map and index.
- All interactive elements require visible keyboard focus, adequate contrast, and 44px mobile targets.
- Respect reduced motion; audiovisual content never autoplays with sound without user action.

## Reusable components

- GlobalHeader: wordmark, core navigation, compact presentation/sound control, contact CTA.
- ModeSwitcher: Mapa/Índice with clear selected state and keyboard semantics.
- PortfolioSearch: search input plus compact sector filters and result count.
- CompanyRow: index number, company name, sector/role, small ecosystem metadata, directional affordance.
- CompanyPreview: focused narrative, role in the group, relevant links/actions, close/back behavior.
- MapHUD: minimal map controls, legend, search/status, selected node context.
- EditorialPageShell: consistent institutional header/footer and restrained editorial sections.
- StoryPlayer: full-screen cinematic chapters with timeline, caption, volume, play/pause, close.

## Content principles

- Portuguese copy should be precise and mature, not inflated. Explain before inspiring.
- Use real company names and real sector labels from the source UI.
- Do not invent metrics, awards, locations, claims, or company descriptions.
- Keep the authentic labels `Mapa Vivo das Empresas`, `Mapa`, `Índice`, `Apresentação do grupo`, `Empresas`, and `Contato` where they serve the same function.

## Hard fidelity constraints

Use ONLY the fonts, colors, spacing, and component styles defined here and in `src/app/globals.css`. Do not introduce unrelated fonts, colors, gradients, logos, or visual styles. Keep the warm-black/mineral-gold identity and the real MAIA Grupo wordmark treatment. The redesign may substantially improve layout, hierarchy, navigation, responsive behavior, and component composition, but must remain unmistakably Grupo Maia Universe.
