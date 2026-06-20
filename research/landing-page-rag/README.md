# Landing-page craft notes (RAG corpus)

Curated, **our-own-words** reference knowledge for building a top-tier landing
page for primordial / the artist. These notes enter the semantic RAG corpus
(`tools/rag/`) automatically — they're tracked `.md` outside the excluded
`research/corpus/` and `research/fmhy-dev-tools/` scrapes — so an agent building
the frontpage can pull them on demand via `semantic_search` or
`node tools/rag/retrieve.mjs "<query>"`.

## Why this exists

The repo already knows the visual *instrument* deeply (shaders, audio, looks,
mobile budget) but had little **landing-page-specific** craft. These notes close
that gap: the structure, motion, type, and copy patterns that separate a
default-template page from an intentional, award-quality one — filtered through
primordial's identity (grungy-future-geometric-slimy, neon-HUD, a phone-first
audience, an electronic-music visual artist's voice).

## The notes

- `structure-and-conversion.md` — hero anatomy, narrative order, the single CTA,
  social proof, performance-as-UX, progressive disclosure.
- `motion-and-feel.md` — tasteful scroll/reveal, reduced-motion, WebGL/canvas
  hero accents that respect the mobile perf budget.
- `type-and-layout.md` — distinctive type pairing, spacing rhythm, grid, the
  dark neon-HUD aesthetic.
- `copy-and-voice.md` — voice for an electronic-music visual artist; hero lines,
  CTA wording, confident-not-corporate tone.
- `reference-study-method.md` — how to gather references (`reel-ingest` + web
  search) under the reference-only / write-our-own rule, and how to record
  takeaways as notes rather than assets.
- `dynamic-canvas-deep-research.md` — cited multi-source research for a dynamic
  full-page WebGL canvas (point clouds, Gaussian splats, depth maps): architecture,
  acquiring splats without training them, mobile cost, reverse-engineering method,
  and gather-tooling — with licenses flagged and shaky claims dropped. The design +
  plan for the gathering *method* live in `docs/superpowers/{specs,plans}/2026-06-20-
  reference-gather-method*`.

## How to use when building the frontpage

1. Read the relevant note(s) for the section you're building.
2. Gather references the right way (`reference-study-method.md`) — study, never
   copy; author every asset and line from scratch (commercial licensing).
3. Hold the hard constraints that already govern this repo: the **mobile perf
   budget** (`.claude/rules/shaders.md`), **deployed-site privacy / no AI
   fingerprints** (`.claude/rules/deploy.md`), and the **visuals-only-by-default
   hero** (`workshop/sketches/frontpage/BRIEF.md` — a visitor sees something
   great before granting mic).

## Scope tag

Like every corpus chunk, these carry `{ scope: "project", project:
"primordial-viz" }`. Craft that's genuinely cross-project (not primordial-
specific) is a candidate for the future global layer (`research/rag-system/`),
but for now it all lives here as project knowledge.
