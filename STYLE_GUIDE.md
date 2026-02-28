# Vector Resume — Style Guide

## Design Philosophy

**Light, not bright. Professional, not corporate. Ultra-modern, not trendy.**

This is a precision tool for senior engineers. The aesthetic should feel like a high-end design tool (Linear, Raycast, Figma) — not a SaaS marketing page and not a terminal. Every pixel should communicate competence and intentionality. The interface should disappear and let the content be the focus.

### Guiding Principles

1. **Quiet confidence** — No gradients, no glowing borders, no pulsing animations. The UI earns trust through restraint, not flash.
2. **Content-first** — Resume text is the product. The UI is scaffolding. Component cards should feel like reading a document, not browsing a dashboard.
3. **Tool, not toy** — This is used during high-stakes job searches. No playful illustrations, no emoji, no casual copy. Precise, efficient, respectful of the user's time.
4. **Density without clutter** — Senior engineers want information density. Don't over-space things. But use whitespace structurally — to separate concerns, not to fill a page.

---

## Color System

### Base Palette

```css
:root {
  /* Backgrounds */
  --bg-primary: #FAFAFA;          /* Main page background — warm off-white */
  --bg-surface: #FFFFFF;           /* Cards, panels */
  --bg-surface-hover: #F5F5F5;    /* Card hover state */
  --bg-inset: #F0F0F0;            /* Inset areas, code blocks, secondary panels */
  --bg-preview: #FFFFFF;           /* Preview panel — pure white (simulates paper) */

  /* Borders */
  --border-subtle: #E8E8E8;       /* Default borders — barely visible */
  --border-default: #D4D4D4;      /* Active/hover borders */
  --border-strong: #A3A3A3;       /* Emphasis borders */

  /* Text */
  --text-primary: #171717;        /* Headings, primary content — near-black */
  --text-secondary: #525252;      /* Body text, descriptions */
  --text-tertiary: #A3A3A3;       /* Labels, metadata, placeholders */
  --text-inverse: #FFFFFF;        /* Text on dark backgrounds */

  /* Accents — Muted, professional, not playful */
  --accent-primary: #2563EB;      /* Primary actions, selected vector — confident blue */
  --accent-primary-subtle: #EFF6FF; /* Blue tint for selected states */
  --accent-primary-hover: #1D4ED8;

  /* Vector colors — Muted, distinguishable, not garish */
  --vector-1: #2563EB;            /* Blue */
  --vector-2: #0D9488;            /* Teal */
  --vector-3: #7C3AED;            /* Purple */
  --vector-4: #EA580C;            /* Burnt orange */
  --vector-5: #4F46E5;            /* Indigo */
  --vector-6: #0891B2;            /* Cyan */

  /* Priority badges */
  --priority-must: #171717;       /* Near-black — strong, definite */
  --priority-must-bg: #F5F5F5;
  --priority-strong: #525252;
  --priority-strong-bg: #FAFAFA;
  --priority-optional: #A3A3A3;
  --priority-optional-bg: transparent;

  /* Status */
  --success: #16A34A;
  --warning: #CA8A04;
  --error: #DC2626;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.04);
  --shadow-md: 0 2px 8px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 4px 16px rgba(0, 0, 0, 0.08);
  --shadow-focus: 0 0 0 2px var(--accent-primary-subtle), 0 0 0 4px var(--accent-primary);
}
```

### Dark Mode (v2, but design for it)
Design with CSS custom properties so dark mode is a variable swap, not a rewrite. Don't implement dark mode in v1, but don't hardcode any colors either.

---

## Typography

### Font Stack

**Primary (UI):** `"Geist Sans"` — Vercel's typeface. Clean, geometric, excellent at small sizes. If unavailable, fall back to `"Inter"` then system sans-serif.

**Monospace (code, tags, metadata):** `"Geist Mono"` — Pairs with Geist Sans. Fallback to `"JetBrains Mono"` then system monospace.

**Preview panel (resume rendering):** Use whatever font the active template specifies. The "Editorial Dense" template uses `"Charter"` or `"Georgia"` (serif) for body, with the section headers in a clean sans.

```css
:root {
  --font-sans: "Geist Sans", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", "JetBrains Mono", "SF Mono", "Fira Code", monospace;
}
```

Load via CDN:
```html
<link href="https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-sans/style.css" rel="stylesheet">
<link href="https://cdn.jsdelivr.net/npm/geist@1.0.0/dist/fonts/geist-mono/style.css" rel="stylesheet">
```

### Type Scale

| Use | Size | Weight | Font | Color |
|-----|------|--------|------|-------|
| Page title | 20px | 600 | Sans | --text-primary |
| Section header | 11px | 600 | Mono | --text-tertiary |
| Component name | 14px | 500 | Sans | --text-primary |
| Component body | 13px | 400 | Sans | --text-secondary |
| Vector badge | 11px | 500 | Mono | vector color |
| Priority badge | 10px | 600 | Mono | priority color |
| Button label | 13px | 500 | Sans | varies |
| Status bar | 12px | 400 | Mono | --text-tertiary |
| Metadata/label | 11px | 400 | Sans | --text-tertiary |

### Section Headers
All-caps, letterspaced, monospace. Small. They're wayfinding labels, not headlines.

```css
.section-header {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--text-tertiary);
}
```

---

## Spacing System

Use a **4px base grid**. All spacing values are multiples of 4.

| Token | Value | Use |
|-------|-------|-----|
| --space-1 | 4px | Tight gaps (badge padding, inline spacing) |
| --space-2 | 8px | Component internal padding, gap between badges |
| --space-3 | 12px | Card padding (compact), gap between small elements |
| --space-4 | 16px | Card padding (default), section gap |
| --space-6 | 24px | Panel padding, major section separation |
| --space-8 | 32px | Page-level padding |
| --space-12 | 48px | Large section breaks |

---

## Component Patterns

### Cards (Component Cards)
```css
.component-card {
  background: var(--bg-surface);
  border: 1px solid var(--border-subtle);
  border-radius: 8px;
  padding: 12px 16px;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.component-card:hover {
  border-color: var(--border-default);
  box-shadow: var(--shadow-sm);
}

.component-card.selected {
  border-color: var(--accent-primary);
  background: var(--accent-primary-subtle);
}

.component-card.dimmed {
  opacity: 0.4;
}
```

Cards should feel like paper. No heavy shadows, no rounded-to-the-moon corners. The border does the work.

### Vector Badges
Small, pill-shaped, monospace. The vector color is the text + a very subtle background tint.

```css
.vector-badge {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 500;
  padding: 2px 8px;
  border-radius: 4px;
  /* Color set dynamically per vector */
  color: var(--vector-color);
  background: color-mix(in srgb, var(--vector-color) 8%, transparent);
}
```

### Priority Badges
Even more understated than vector badges. Just a small label.

```css
.priority-badge {
  font-family: var(--font-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.priority-must { color: var(--priority-must); }
.priority-strong { color: var(--priority-strong); }
.priority-optional { color: var(--priority-optional); }
```

### Vector Selector Bar
Sticky top bar. Clean pills, not buttons. Selected state is subtle — filled background, not a glowing border.

```css
.vector-pill {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 500;
  padding: 6px 16px;
  border-radius: 6px;
  border: 1px solid var(--border-subtle);
  background: transparent;
  color: var(--text-tertiary);
  cursor: pointer;
  transition: all 0.15s ease;
}

.vector-pill:hover {
  border-color: var(--border-default);
  color: var(--text-secondary);
}

.vector-pill.active {
  background: var(--vector-color);
  color: var(--text-inverse);
  border-color: transparent;
}
```

### Buttons

**Primary** (Download, major actions):
```css
.btn-primary {
  background: var(--text-primary);     /* Near-black */
  color: var(--text-inverse);
  border: none;
  border-radius: 6px;
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.btn-primary:hover {
  opacity: 0.85;
}
```

**Secondary** (Export, toggle, less important actions):
```css
.btn-secondary {
  background: transparent;
  color: var(--text-secondary);
  border: 1px solid var(--border-default);
  border-radius: 6px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
}

.btn-secondary:hover {
  background: var(--bg-surface-hover);
  border-color: var(--border-strong);
}
```

**Ghost** (inline actions, card-level):
```css
.btn-ghost {
  background: transparent;
  color: var(--text-tertiary);
  border: none;
  padding: 4px 8px;
  font-size: 12px;
  cursor: pointer;
}

.btn-ghost:hover {
  color: var(--text-secondary);
  background: var(--bg-surface-hover);
  border-radius: 4px;
}
```

---

## Layout

### Overall Structure
```
Full viewport height. No scrolling on the page level — panels scroll independently.

┌─────────────────────────────────────────────────────────────────┐
│  Top bar: Logo/name left, [Import] [Export] [Download ▾] right  │  48px fixed
├─────────────────────────────────────────────────────────────────┤
│  Vector bar: [V1] [V2] [V3] [All]  ·  Auto-Select · Clear      │  44px sticky
├──────────────────────────────┬──────────────────────────────────┤
│                              │                                  │
│  Component Library           │  Live Preview                    │
│  width: ~45%                 │  width: ~55%                     │
│  overflow-y: auto            │  overflow-y: auto                │
│  padding: 24px               │  padding: 24px                   │
│  background: var(--bg-primary)│ background: var(--bg-inset)      │
│                              │                                  │
│                              │  ┌─────────────────────────┐     │
│                              │  │  Resume preview         │     │
│                              │  │  (white, paper-like,    │     │
│                              │  │   constrained width,    │     │
│                              │  │   centered, shadowed)   │     │
│                              │  └─────────────────────────┘     │
│                              │                                  │
├──────────────────────────────┴──────────────────────────────────┤
│  Status bar: page count · bullet count · word estimate          │  32px fixed
└─────────────────────────────────────────────────────────────────┘
```

### Preview Panel
The preview should look like a piece of paper floating on a gray surface. This is the "what you get" view.

```css
.preview-paper {
  background: white;
  max-width: 680px;           /* Approximate letter-width feel */
  margin: 0 auto;
  padding: 48px 56px;
  box-shadow: var(--shadow-lg);
  border-radius: 2px;         /* Almost no radius — it's paper */
  min-height: 880px;          /* Approximate page height */
}
```

The preview panel background is `var(--bg-inset)` — slightly darker than the component library side — to create visual separation and make the white "paper" pop.

### Resizable Split
The divider between component library and preview should be draggable. Default 45/55 split. Store preference in localStorage.

---

## Iconography

Use **Lucide** icons (already in the spec's dependency list via lucide-react). 

- Size: 16px for inline, 18px for buttons, 14px for badges
- Stroke width: 1.5 (default Lucide, slightly lighter feel)
- Color: inherit from text color

Key icons:
- Drag handle: `GripVertical`
- Toggle include/exclude: `Eye` / `EyeOff`
- Download: `Download`
- Import: `Upload`
- Export: `Share2`
- Add component: `Plus`
- Delete: `Trash2`
- Edit: `Pencil`
- Vector: `Target`
- Copy: `Copy` → `Check` (on success)
- Warning (page over budget): `AlertTriangle`

---

## Motion & Transitions

### Philosophy
Motion should be **functional, not decorative**. Things move to communicate state changes, not to entertain. Keep durations short.

### Timing
```css
:root {
  --duration-fast: 100ms;      /* Hover states, toggles */
  --duration-normal: 150ms;    /* Panel transitions, card selection */
  --duration-slow: 250ms;      /* Modal open/close, major layout shifts */
  --easing: cubic-bezier(0.4, 0, 0.2, 1);  /* Material-style ease */
}
```

### What animates
- Card hover → border color, shadow (fast)
- Card selection → background color, border (normal)
- Vector switch → preview content crossfade (normal)
- Drag reorder → smooth position swap (normal)
- Toast notifications → slide in from bottom-right, auto-dismiss (slow)
- Modal → fade + slight scale (slow)

### What doesn't animate
- Text content changes (instant swap, no fade)
- Scroll (native)
- Page load (no staggered reveals — tool should feel instant)

---

## Responsive Behavior

### Desktop (>1024px)
Full two-panel layout as described.

### Tablet (768–1024px)
Stack panels vertically: component library on top, preview below. Or use tabs to switch between them.

### Mobile (<768px)
Single panel with tab switching: Library | Preview | Download
Not a primary use case — this is a desktop tool — but it should be functional, not broken.

---

## Empty States

When there's no data:

```
┌─────────────────────────────────────┐
│                                     │
│         ┌───────────────┐           │
│         │   📄 (icon)    │           │
│         └───────────────┘           │
│                                     │
│    No components yet.               │
│                                     │
│    Import a YAML config or start    │
│    adding components to build       │
│    your resume library.             │
│                                     │
│    [Import YAML]  [Start from       │
│                    Scratch]         │
│                                     │
└─────────────────────────────────────┘
```

Keep it simple. One line of explanation, two action buttons. No illustrations.

---

## Do's and Don'ts

### Do
- Use consistent 4px grid spacing
- Let whitespace do the structural work
- Keep text small and dense where appropriate (this is a power-user tool)
- Use monospace for metadata, labels, and tags
- Make the preview panel feel like real paper
- Ensure every interactive element has a visible hover/focus state
- Keep border-radius small (4–8px max for cards, 4–6px for pills/badges)

### Don't
- Don't use gradients anywhere
- Don't use shadows heavier than `--shadow-lg`
- Don't use more than 2 font families
- Don't use color as the only differentiator (pair with text/shape)
- Don't animate text content changes
- Don't use rounded corners >8px on any element
- Don't add decorative elements (illustrations, patterns, blobs)
- Don't use placeholder text that's cute or clever ("Your awesome resume goes here!")
- Don't default to purple. Ever.

---

## Reference Aesthetic

The closest existing products to the target feel:

- **Linear** — Minimal UI, monospace labels, information-dense, professional
- **Raycast** — Clean, fast, tool-like, respects the user's expertise  
- **Vercel Dashboard** — Geist typography, light theme done right, quiet confidence
- **Stripe Docs** — Content-focused, excellent typography, no visual noise

Study these for spatial relationships and information hierarchy, not to copy their layouts.
