<p align="center">
  <img src="docs/assets/facet-banner.png" alt="Facet — Same Diamond, Different Face" width="100%" />
</p>

<p align="center">
  <strong>Strategic resume assembly for senior engineers.</strong><br />
  One career library. Countless angles.
</p>

<p align="center">
  <a href="https://github.com/NickCrew/Facet/actions"><img alt="Build" src="https://img.shields.io/github/actions/workflow/status/NickCrew/Facet/ci.yml?branch=main&style=flat-square" /></a>
  <a href="#license"><img alt="License" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
  <a href="#"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-strict-3178C6?style=flat-square&logo=typescript&logoColor=white" /></a>
  <a href="#"><img alt="React 19" src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black" /></a>
  <a href="#"><img alt="Vite" src="https://img.shields.io/badge/Vite-7-646CFF?style=flat-square&logo=vite&logoColor=white" /></a>
  <a href="#"><img alt="PRs Welcome" src="https://img.shields.io/badge/PRs-welcome-brightgreen?style=flat-square" /></a>
</p>

---

## What is Facet?

You build a single **component library** — your roles, bullets, skills, target lines, projects — and tag each piece with a **priority per vector**. A vector is a positioning angle like _"Backend Engineering"_, _"Security Platform"_, or _"Engineering Leadership"_. When you select a vector, Facet's assembly engine automatically builds the highest-impact resume for that angle, respecting your page budget.

### Why vectors?

Senior engineers don't have one story — they have many. A single career can target backend infrastructure, security, platform engineering, or leadership roles. Traditional resume builders force you to maintain separate documents or manually reshuffle bullets every time. Facet eliminates that:

- **Define once** — write each bullet, skill group, and project once in your library
- **Prioritize per angle** — tag components as `must`, `strong`, `optional`, or `exclude` for each vector
- **Assemble instantly** — select a vector and get a ready-to-send resume in seconds
- **Stay within budget** — the page budget engine trims lowest-priority content from the oldest roles first

The result is a resume that is always structurally sound, strategically targeted, and produced in a fraction of the time.

## Features

- **Vector-based assembly** — define positioning angles and get purpose-built resumes per target
- **Priority system** — four-tier priority (`must` > `strong` > `optional` > `exclude`) with per-vector overrides
- **Text variants** — write vector-specific phrasing for any bullet or target line, with automatic fallback to default text
- **Live PDF preview** — WYSIWYG preview rendered via Typst with bundled fonts and downloadable output
- **Page budget engine** — heuristic page estimation with intelligent trimming (trims lowest-priority bullets from oldest roles)
- **Drag-and-drop ordering** — reorder bullets within roles, persisted independently per vector
- **Saved variants** — snapshot your override state and switch between configurations per vector
- **Multiple renderers** — PDF (Typst), plain text, and Markdown (clipboard)
- **Theme presets** — multiple typographic themes with full control over fonts, spacing, colors, and layout
- **Import / Export** — YAML and JSON with strict schema validation and additive merge on import
- **Fully local** — all data persisted to localStorage, no account required

## Screenshot

<!-- Replace with an actual screenshot or GIF -->
> _Screenshot coming soon_

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- `npm` (included with Node.js)
- [just](https://github.com/casey/just) (**optional** command runner for convenience)

```bash
# macOS
brew install just

# cargo
cargo install just
```

_For details and other platforms — see https://github.com/casey/just#installation_

### Installation

```bash
git clone https://github.com/NickCrew/Facet.git
cd facet
just install
```

### Development

```bash
just dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build

```bash
just build
just preview   # preview production build locally
```

### Available Recipes

Run `just --list` to see all recipes:

```
just dev         # Start Vite dev server
just build       # TypeScript check + Vite production build
just typecheck   # TypeScript type-check only
just test        # Run all Vitest tests
just test-file <file>  # Run a single test file
just test-watch  # Run tests in watch mode
just lint        # ESLint
just preview     # Preview production build locally
just ci          # Full CI check: typecheck + lint + test
just clean       # Clean build artifacts
```

## Usage

1. **Define your vectors** — create positioning angles like "Backend Engineering" or "Security Platform"
2. **Build your component library** — add target lines, profile summaries, roles with bullets, skill groups, and projects
3. **Tag priorities** — for each component, set its priority (`must`/`strong`/`optional`/`exclude`) per vector
4. **Select a vector** — the assembler builds the optimal resume for that angle
5. **Fine-tune** — use manual overrides, text variants, and drag-and-drop to polish
6. **Export** — download as PDF, copy as plain text or Markdown, or export your data as YAML/JSON

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 |
| Language | TypeScript (strict mode) |
| Build | Vite 7 |
| State | Zustand (persisted to localStorage) |
| PDF Rendering | Typst (via typst.ts WASM) |
| Drag & Drop | @dnd-kit |
| Icons | Lucide React |
| Testing | Vitest + Testing Library |
| Linting | ESLint 9 |

## Project Structure

```
src/
├── engine/          # Core assembly pipeline
│   ├── assembler.ts     # Vector-aware resume assembly
│   ├── pageBudget.ts    # Page estimation and trimming
│   ├── serializer.ts    # YAML/JSON parsing and validation
│   └── importMerge.ts   # Additive data merging
├── stores/          # Zustand state management
├── components/      # React UI components
├── templates/       # Resume template definitions
├── renderers/       # PDF, text, and Markdown output
├── utils/           # Shared utilities
├── types.ts         # Domain type system
└── test/            # Vitest test suites
```

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

```bash
just ci   # runs typecheck + lint + test in one shot
```

## License

[MIT](LICENSE)

## Links

<!-- TODO: Add project links -->
<!--
- Website:
- Documentation:
- Issue Tracker:
-->
