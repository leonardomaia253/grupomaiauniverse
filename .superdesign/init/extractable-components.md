# Extractable components

## EditorialPageShell
- Source: `src/components/EditorialPageShell.tsx`
- Category: layout
- Description: Warm-black institutional shell with MAIA wordmark, primary navigation, broad editorial headline, and legal footer.
- Extractable props: `eyebrow`, `title`, `intro`, `wide`
- Hardcoded: wordmark composition, nav labels/routes, footer links, palette and typography.

## EditorialSection
- Source: `src/components/EditorialPageShell.tsx`
- Category: basic
- Description: Indexed three-column editorial information row.
- Extractable props: `index`, `title`, `children`
- Hardcoded: grid geometry, divider, typography and opacity hierarchy.

## MaiaStoryIntro
- Source: `src/components/MaiaStoryIntro.tsx`
- Category: layout
- Description: Fullscreen audiovisual brand story with timed cues and media controls.
- Extractable props: `onComplete`
- Hardcoded: story chapters, audio/video sources, cinematic visual language.

## UniverseCanvas
- Source: `src/components/UniverseCanvas.tsx`
- Category: layout
- Description: Full-viewport interactive directory/map of Grupo Maia companies.
- Extractable props: `companies`
- Hardcoded: company display logic, map atmosphere, interaction patterns.

## LoadingScreen
- Source: `src/components/LoadingScreen.tsx`
- Category: basic
- Description: Brand-aligned progress and error overlay used before the universe becomes interactive.
- Extractable props: `stage`, `progress`, `error`, `accentColor`, `onRetry`, `onFadeComplete`
- Hardcoded: transition choreography and loading copy.
