---
version: "superdesign-alpha"
name: "Ledger Serif"
description: "A near-black institutional dark-mode system with an oversized ink-black slab serif display face, a hairline-ruled 2-column directory grid, and a single sage-green accent rationed to banded transitions."
colors:
  background: "#F0F0F0"
  surface: "#172019"
  surface-light: "#F4F1E9"
  card-light: "#FBFAF6"
  text-primary: "#FBFAF6"
  text-primary-on-light: "#101713"
  text-secondary: "#68716B"
  accent: "#57734B"
  accent-tint: "#DBE7CF"
  border-dark: "#14221B"
  border-light: "#FFFFFF"
typography:
  display-lg:
    fontFamily: "Crimson Pro"
    fontSize: "136px"
    fontWeight: 400
    lineHeight: "0.84"
    letterSpacing: "-8.8px"
  headline-md:
    fontFamily: "Crimson Pro"
    fontSize: "104px"
    fontWeight: 400
    lineHeight: "0.9"
    letterSpacing: "-5.7px"
  body-md:
    fontFamily: "Public Sans"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "1.43"
  label-md:
    fontFamily: "Crimson Pro"
    fontSize: "24px"
    fontWeight: 400
    lineHeight: "1.33"
    letterSpacing: "-0.8px"
  label-caption:
    fontFamily: "Public Sans"
    fontSize: "14px"
    fontWeight: 600
    lineHeight: "1.43"
  ui-fallback:
    fontFamily: "ui-sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: "1.4"
spacing:
  base: "4px"
  gap: "24px"
  gap-tight: "8px"
  gap-loose: "20px"
  card-padding: "24px"
  section-padding: "112px"
rounded:
  control: "4px"
  card: "4px"
  pill: "4px"
components:
  button-primary-hero:
    background: "transparent"
    text-color: "#FBFAF6"
    radius: "0px"
    height: "auto"
    border: "1px solid #57734B (underline rule only)"
    note: "observed — text link with arrow icon and underline, not a filled button"
  button-utility:
    background: "#DBE7CF"
    text-color: "#172019"
    radius: "0px"
    height: "40px"
    padding: "8px 16px"
    border: "1px solid rgb(16, 23, 19)"
    hover-background: "#FFFFFF"
  card-directory:
    background: "#FBFAF6"
    radius: "0px"
    padding: "24px 28px"
    border: "1px solid #14221B"
  card-pillar-dark:
    background: "#101713"
    radius: "0px"
    padding: "24px"
    border: "1px solid #14221B"
  card-form-panel:
    background: "#172019"
    radius: "0px"
    padding: "24px"
    border: "1px solid #14221B"
  navbar:
    background: "transparent"
    height: "76px"
    width: "100% (edge-to-edge)"
    radius-tl: "0px"
    radius-tr: "0px"
    radius-br: "0px"
    radius-bl: "0px"
---
# Ledger Serif
Source: https://grupomaia.me

## Overview
This is a dark-mode-default institutional system built on Swiss-inflected restraint: hairline rules, zero border-radius everywhere, and a single oversized serif display face doing all the emotional work. Crimson Pro at 136px with -8.8px tracking and a leading of 0.84 collapses ascenders into descenders, giving headlines a compressed, ledger-like density that reads as editorial gravity rather than marketing bravado. Public Sans carries every functional layer beneath it. Color is almost entirely absent — near-black surfaces (#101713, #172019) and warm off-whites (#F4F1E9, #FBFAF6) — with one sage-green (#57734B / #DBE7CF) rationed to bands, rules, and a single utility control. The effect is a corporate-holding aesthetic: unornamented, document-like, confident enough to leave most of the canvas monochrome.

## Composition
The first screen opens on the deep-charcoal navbar and a two-column hero: an oversized three-line serif statement occupies roughly 60% of the width on the left, paired with a short body paragraph and a stacked pair of text-link CTAs on the right (a 60/36 two-column split). Below the fold, a 3-across pillar strip (rows of [3], equal width, each a dark card with a numeral, heading, and one-line body) closes the hero band before a hard cut to a warm off-white surface. The second band is the density peak: a two-column, 23-item directory grid (rows of [2] repeated eleven times plus one trailing single) — every row a hairline-ruled pair of company cards. This is the deliberate choice: an unadorned ledger/table grid instead of a bento or masonry arrangement, favoring scanability and parity over visual variety. The page then resolves into a pale sage contact band (label + huge serif headline + link CTAs) immediately stacked over a return to near-black for a two-column contact form, before a dark footer. The rhythm is binary throughout: dark band / light band / dark band, never blended, each transition a hard color cut rather than a gradient fade.

## Colors
Background reads as near-black across roughly a third of the page (#101713 hero, pillar cards, footer) and warm off-white across the directory and hero-support sections (#F4F1E9 ~54% declared area, #FBFAF6 ~12% for card fills) — the two trade dominance section by section rather than one owning the whole page. Sage green (#57734B ink, #DBE7CF fill) is the only chromatic note, reserved for the pale contact band background, the underline rule beneath the hero's primary text-link, and the one filled utility button — everywhere else, color is deliberately withheld in favor of grayscale ink (#68716B secondary text, #172019/#14221B borders). Pure white (#FFFFFF) appears only as card borders and button hover-fill, never as a background field. This restraint means the accent reads as institutional (a seal-green, almost financial-ledger tone) rather than decorative.

## Typography
Crimson Pro, a slab-adjacent serif, is reserved exclusively for display and label roles — 136px hero headlines, 104px section headlines, 24px eyebrow-adjacent labels — always at extreme negative tracking (-5.7px to -8.8px) and sub-1 line-height, producing tightly kerned, almost typeset-for-print headline blocks. Public Sans, a grotesque sans, carries every body and UI role: 16px/400 paragraph copy, 14px/600 button and caption labels. The pairing logic is strict: serif announces, sans explains — no serif appears below headline/label scale, no sans appears at display scale.

## Layout
Max-width content sits near 1440px with 112px section padding marking every band transition. The directory section is a strict 2-column grid with normal (24px-class) gaps, hairline-bordered cells at 0px radius, holding 23 items in 12 rows (11 full pairs, one trailing single card at half-width). The hero's pillar strip is a 1-column-authored set of 3 equal-width dark cards in a single row. The closing contact section is a 2-column, 48px-gap layout at a 60/36 split (label+headline column wider than the CTA column). Nothing in this system rounds a corner — every card, button, and input is a hard rectangle, reinforcing the ledger/document metaphor over a soft app-UI metaphor.

## Components
- **Navbar** — edge-to-edge, 76px tall, transparent background, sticky, 0px radius on all four corners (square bar, not inset or capsule). Holds a boxed glyph mark + wordmark at left, a 2-item numbered nav cluster center-left, and at right a muted label beside a filled utility button (#DBE7CF fill, #172019 text, 0px radius, 40px height, 8px/16px padding, 1px solid #101713 border, hover→#FFFFFF) carrying an arrow glyph.
- **Hero primary CTA** — an observed near-black-background text link (not a filled button): bold sans label with a trailing arrow icon and a thin sage underline rule beneath it. This, not the navbar's filled button, is the page's primary action — it sits directly under the headline at full visual weight via its underline and position.
- **Hero secondary link** — a plain unstyled text label beneath the primary link, no rule, muted tone, indicating a lower-priority secondary path.
- **Pillar cards (×3, one row)** — dark surface #101713, 0px radius, 24px padding, 1px hairline border. Anatomy: two-digit numeral label, a serif subheading, one line of muted sans body copy. No icon, no CTA.
- **Directory cards (×23, 2-column ruled grid)** — surface #FBFAF6, 0px radius, 24px/28px padding, hairline borders forming a full ledger grid. Anatomy per card: numeral index top-left, a small square logo-mark tile (image swatch or monogram), a bold sans company name, a muted lowercase category label beneath, and a trailing arrow-icon affordance at the far right of the row.
- **Contact band CTA pair** — on the pale sage surface, a bold underlined text-link primary ("arrow" style matching hero) beside a muted disabled-looking secondary text label, same pattern as the hero.
- **Contact form panel** — surface #172019, 0px radius, 2-column top row (two labeled inputs), a full-width labeled textarea-style input below, all inputs solid white fill with 0px radius, and a full-width submit button filled in the sage tint (#DBE7CF, dark text, arrow icon).
- **Footer** — background #101713, flat single row of 5 text links, no card structure, no border above stated but implied by band transition.

## Graphics & Effects
The only gradient in the system is a small radial wash — `radial-gradient(circle at 80% 10%, rgba(183, 199, 169, 0.16), rgba(0, 0, 0, 0) 34%)` — covering roughly 14% of the page, positioned upper-right within the dark hero/pillar band as a faint sage glow bleeding from a corner; it is not a full-bleed hero treatment, just a soft light source hinted at one corner. Card and panel elevation uses a single soft shadow recipe (`rgba(0,0,0,0.1) 0px 10px 15px -3px, rgba(0,0,0,0.1) 0px 4px 6px -4px`) applied sparingly to floating elements like the toast notification, not to the flat ruled grid cards. Logo marks inside directory cards are small raster/vector swatches (color logos on white tiles) — the only saturated color accents on the page outside the sage system. No noise, no scan-lines, no photographic imagery anywhere; the whole system is vector/type only.

## Motion
Interactive color and border transitions run at `0.15s cubic-bezier(0.4, 0, 0.2, 1)`, matching transform changes at the same duration/easing for hover micro-feedback (arrow nudges, button fills). Broader state changes use `all 0.3s cubic-bezier(0.4, 0, 0.2, 1)`, and appearance/disappearance (toasts, panel reveals) fade via `opacity 0.4s ease`. Named keyframes present (`enter`, `exit`, `pulse`, `spin`, `marquee`, `grain`) indicate entrance/exit transitions on scroll-triggered elements, a pulsing or spinning loader state, a marquee-capable strip, and a subtle grain-animation utility available but not necessarily active across this page's static content — treat motion as quick, functional, and unshowy, never springy or overshooting.

## Guardrails
- Never round a corner: every card, button, input, and navbar stays at 0px radius — rounding anything breaks the ledger identity.
- Never fill the hero's primary CTA solid; it is a text-link-with-underline, not a filled button — reserve the filled #DBE7CF button for secondary/utility roles only.
- Never expand the sage accent beyond bands, rules, logo tiles, and the one utility button — the system's power is in withholding color elsewhere.
- Never merge the two dark bands and two light bands into a blended gradient page — transitions are hard color cuts, not fades.
- Never compress the display serif's negative tracking or open its line-height — the collapsed 0.84–0.9 leading is the signature, not a bug.
- Never turn the 23-item directory into a masonry or bento arrangement — it is a strict 2-column hairline ledger grid with one trailing half-row.