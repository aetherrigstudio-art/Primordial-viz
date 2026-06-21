# Design — The best path forward (stabilize → Astro studio site)

**Status:** design, for operator review · **Date:** 2026-06-21
**Backing research:** `docs/research/best-path-forward/findings.md` (2 deep rounds, 6 agents,
~45 cross-checked sources). **Stage-1 detail:** `docs/plans/refactor/` (10 phase plans).
**Decisions:** this spec + ADR-005 (visibility/license), ADR-006 (phone-dev softened),
ADR-012 (re-platform stack).

## Context / goal
The operator wants to "refactor the entire codebase" and move from a phone-driven, single
static raw-WebGL2 page to a modern, maintainable **multi-page "studio" website** (server/PC
workflow). Decided shape: **Both, sequenced** — stabilize first, then re-platform. Recurring
constraint: real deliverables, minimal wasted process. The current app is a hand-built,
zero-dependency raw-WebGL2 + Web-Audio audio-reactive instrument.

## Decisions (operator-confirmed this session)
| # | Decision | Source |
|---|----------|--------|
| D1 | Both, sequenced: stabilize, THEN re-platform | operator |
| D2 | Instrument is **embedded as-is**, not rebuilt in R3F | operator ("let research decide") + research |
| D3 | Studio site is **content-heavy → Astro** | operator |
| D4 | Host **static on Cloudflare Pages**; no server needed | research |
| D5 | Migrate via **strangler-fig**; instrument migrates LAST | research |
| D6 | Stabilize **no-build**; introduce the build only at Stage 2 | research |

## Stage 1 — Stabilize (no build)
Execute the 10 refactor phases in `docs/plans/refactor/` — they are correctly scoped: 100%
behavior / tests / module boundaries / dead-code / doc-CI hygiene, **0% build scaffolding**
(research confirmed early build work is throwaway). Priority order (phase-10 synthesis):
- **Critical (decision-free):** rebuild RAG index (done), redact operator email PII, fix dead
  `deploy.yml` trigger.
- **Important:** apply ADR-006 softening (mostly done — soften phrasings, keep the rules); converge CI↔local gates; wire unrun tests.
- **Nits:** shader/audio polish, `$`-replace hardening, Tauri CSP, `.htaccess` vestigial.
- **Gated on ADR-005:** license/privacy edits.
- **Verify-before-fix (disputed):** eval-skills API params, skills-lock hashes, missing-area router.

**Bridge gotchas to honor NOW** (make Stage 2 friction-free): keep `new URL(asset,
import.meta.url)` literals **static** (Vite only rewrites static literals — `registry.js`
already complies); **no CDN import maps** (already zero-dep); avoid bare specifiers in `new URL`.

## Stage 2 — Re-platform to an Astro studio site (strangler-fig)
1. **Freeze the instrument** as an isolated standalone route (keep it working, untouched).
2. **Stand up Astro alongside** (new content surface; the app stays a passthrough static asset).
   File-based `src/pages/`, content collections/MDX for portfolio/case-study/per-collab/weddings.
3. **Embed the instrument** on a dedicated full-page route via a plain Astro **`<script>`** that
   imports the existing `boot()` — **not** `client:only` (that's for framework islands), **not**
   under `<ClientRouter>` (view transitions break long-lived WebGL2/AudioContext).
4. **Migrate content pages smallest-first**; route new URLs to the Astro build (Cloudflare Pages
   `_redirects`), old URLs to the frozen app, until every URL has a new owner.
5. **Migrate the instrument last** (or leave it a linked standalone route).
6. **Deploy static to Cloudflare Pages** from GitHub on push (replaces the FTPS→cPanel chain);
   point `primordial.video` DNS at Cloudflare. Keep any future AI/RAG backend on its own infra
   (ADR-001).

**Asset gotcha:** under a `base` sub-route, prefix literal asset URLs with
`import.meta.env.BASE_URL` or `import` the JSON so Astro rewrites it.

## Risks + mitigations (from research)
- **View-transitions break canvas/audio** → keep the visualizer a standalone route, no ClientRouter
  (if used elsewhere, `transition:persist` the canvas). De-risked by design.
- **Astro "wrong tool" if thin** → resolved: operator confirmed content-heavy.
- **Cloudflare/Astro lock-in** → minor; a static `astro build` is maximally portable. Watch.
- **Pages limits (20k files / 25 MiB-per-file)** → only bites with large sample/video libraries;
  use R2 if it ever does.

## Out of scope (later, their own specs)
- The Astro site's concrete **information architecture / page list** (design when Stage 2 starts).
- ADR-005 ratification (gates the license/privacy edits).
- The AI/RAG backend (separate infra, separate spec).

## Verification
- Stage 1: each phase's own gates (render-check, smoke, gen-docs/rag `--check`, CI green).
- Stage 2: a throwaway Astro spike that embeds the instrument on one route + `astro build` →
  static `dist/` serves the canvas with working audio, before committing to the full migration.
