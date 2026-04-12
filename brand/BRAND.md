# Facet Brand Reference

## Marks

### Gem Mark (primary icon)
Shield-cut gem silhouette. Flat crown, long pavilion, clean facet geometry.
Two-tone blue split carries the brand identity. Used as the standalone app
icon: sidebar, favicon, og:image, app store, README.

Files: `brand/icons/facet-gem.svg` (default), `facet-gem-active.svg` (bright)
Component: `src/components/FacetWordmark.tsx → FacetGemMark`

### F Mark (wordmark letterform)
Split-tone F with 40° diagonal cut. The F doubles as the first letter in
the "Facet" wordmark lockup. Light upper face, dark lower face, thin
highlight edge along the cut.

Files: `brand/icons/facet-fmark.svg`, `facet-fmark-dark-bg.svg`
Component: `src/components/FacetWordmark.tsx → FacetFMark`

### Wordmark Lockup
Gem mark + "Facet" in Instrument Serif 400. The serif's thin/thick
stroke contrast mirrors the gem's two-tone split. Used on GitHub
banner, landing page, and hero contexts. Never use the wordmark at
small sizes — switch to the gem mark alone below 32px.

**Contextual weight adjustment.** Instrument Serif is a display face
and its strokes can read thin against bold UI elements at small sizes.
When the wordmark sits next to a heavy sans-serif heading (like an app
header), bump the weight slightly to keep optical balance. Rule of thumb:

| Context                          | Weight |
|----------------------------------|--------|
| Hero, banner, landing (≥48px)   | 400    |
| App header, nav (24–40px)        | 500    |
| Inline with bold UI text         | 500    |

The serif still reads as Instrument Serif at 500 — it just stops
looking spindly next to a 700-weight neighbor. This is an optical
correction, not a brand variant.

The F mark + "acet" lockup (Outfit 300) is deprecated. Keep the F mark
SVG for historical reference but use the gem + Instrument Serif lockup
going forward.

Component: `src/components/FacetWordmark.tsx → FacetWordmark` (needs update)

---

## Color System

### Brand Blues (the two-tone identity)

**Primary brand blue: `#2d6a96`** — the single canonical Facet color.
Used as light-mode accent, gem crown on light backgrounds, and the
dominant shadow face of the gem on dark. When in doubt, use this one.

| Token              | Hex       | Usage                                   |
|--------------------|-----------|-----------------------------------------|
| `gem-light`        | `#6cb8e8` | Light face, active accent, hover state  |
| `gem-dark`         | `#2d6a96` | Shadow face, dark-mode accent primary   |
| `gem-mid`          | `#4a94c8` | Pavilion right (active gem)             |
| `gem-highlight`    | `#7ac4f0` | Edge highlights, cut lines, glow        |
| `accent-primary`   | `#5ba4d9` | Default accent (dark theme)             |
| `accent-hover`     | `#6cb8e8` | Hover state (same as gem-light)         |

### Dark Theme

| Token              | Hex       | Usage                                   |
|--------------------|-----------|-----------------------------------------|
| `bg-primary`       | `#0a0c10` | Page background                         |
| `bg-surface`       | `#12151c` | Cards, panels                           |
| `bg-surface-hover` | `#171b24` | Hover state on surfaces                 |
| `bg-inset`         | `#0e1117` | Recessed areas                          |
| `border-subtle`    | `#252a36` | Dividers, card borders                  |
| `border-default`   | `#303745` | Input borders                           |
| `text-primary`     | `#e8ecf2` | Body text                               |
| `text-secondary`   | `#c0c8d4` | Supporting text                         |
| `text-tertiary`    | `#6b7a8d` | Muted/disabled text                     |

### Light Theme

| Token              | Hex       | Usage                                   |
|--------------------|-----------|-----------------------------------------|
| `bg-primary`       | `#f8fafc` | Page background                         |
| `bg-surface`       | `#ffffff` | Cards, panels                           |
| `accent-primary`   | `#2d6a96` | Links, active states (gem-dark)         |

### Status Colors

| Token     | Dark        | Light       |
|-----------|-------------|-------------|
| `success` | `#3fbf8a`   | `#16a34a`   |
| `warning` | `#d8a34d`   | `#b45309`   |
| `error`   | `#f07178`   | `#dc2626`   |

---

## Typography

### App UI

| Context    | Family           | Weight  | Usage                              |
|------------|------------------|---------|------------------------------------|
| Body       | DM Sans          | 300-700 | All app text, labels, descriptions |
| Mono       | DM Mono          | 400-500 | Code, JSON, technical values       |
| Wordmark   | Instrument Serif | 400     | Wordmark lockup only               |
| Brand      | Outfit           | 200-700 | Hero text, landing page headings   |

### Resume Themes (output documents)

Separate from the app UI. Each resume theme defines its own font pair
from the theme font library. See `src/themes/theme.ts` for the full
list: Inter, DM Sans, Source Serif 4, PT Serif, IBM Plex Sans/Serif,
Newsreader, Nunito Sans, Libre Franklin, Lora, DM Mono.

---

## Tagline

**Same diamond · Different face**

Used in the GitHub banner. Captures the product thesis: one identity,
many presentations. The diamond metaphor connects to the gem mark.

---

## File Inventory

```
brand/
├── BRAND.md                          ← this file
├── brand-ref-card.html               ← visual reference card (open in browser)
├── wordmark-compare.html             ← font comparison sheet
├── facet-github-banner.html          ← 1280×320 GitHub social image (dark)
├── facet-github-banner.png           ← rendered banner
├── facet-twitter-banner.html         ← 1500×500 Twitter/X banner (dark)
├── facet-og-image.html               ← 1200×630 link preview image (dark)
├── facet-og-image-light.html         ← 1200×630 link preview image (light)
├── facet-hero-atmospheric.html       ← hero variant (atmospheric, uses old F mark)
├── facet-hero-atmospheric.png
├── facet-hero-bold.html              ← hero variant (bold, uses old F mark)
├── facet-hero-bold.png
└── icons/
    ├── facet-fmark.svg               ← F letterform, light bg (deprecated)
    ├── facet-fmark-dark-bg.svg       ← F letterform, dark bg (deprecated)
    ├── facet-gem.svg                 ← gem mark, dark bg (default)
    ├── facet-gem-active.svg          ← gem mark, dark bg (active/bright)
    └── facet-gem-light-bg.svg        ← gem mark, light bg (darker blues)
```

### Gem Mark Color Variants

The gem uses different blue values depending on the background:

**On dark backgrounds** (default): Crown `#5ba4d9`, pavilion left `#1e5a82`,
pavilion right `#3d88b8`. Active: crown `#6cb8e8`, right `#4a94c8`.

**On light backgrounds**: Crown `#2d6a96`, pavilion left `#1e5a82`,
pavilion right `#2d6a96`. Darker values maintain contrast against white.

In the React component (`FacetGemMark`), the `active` prop toggles
between states. The theme context should determine the base palette.

---

## Usage Rules

1. **Gem mark is the primary icon.** Use it for sidebar, favicon, app
   icons, og:image, and any context below 48px wide.
2. **F mark is deprecated.** The gem + Instrument Serif lockup has
   replaced it. Keep the SVGs for historical reference.
3. **Two-tone blue is non-negotiable.** The light/dark face split is
   the core visual identity. Don't flatten to a single blue.
4. **Light theme is the default.** The app ships light-first for the
   broadest audience. Dark theme available for preference. Marketing
   and landing pages may use dark for visual impact.
5. **Instrument Serif is wordmark-only.** Don't use it for body text,
   UI labels, or headings in the app. It's for the logo lockup.
6. **Outfit is for hero/marketing contexts.** Landing page headings,
   GitHub banner subtitle, promotional text. Not for body text.
7. **DM Sans is the workhorse.** All app UI text is DM Sans.
