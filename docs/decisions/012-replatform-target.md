# ADR-012: Re-platform target — Next.js (full React) studio site, static-exported to Cloudflare Pages, instrument embedded

## Status
**Accepted** — operator-directed 2026-06-21. **Supersedes an earlier same-day Astro framing**:
the research recommended Astro for a "content-heavy" site, but that question was answered on a
crossed wire — "content" was read as *graphics-rich*, not *many text/media pages*. On
clarification (the site is **graphics / video / picture-heavy**) the operator chose **full
React (Next.js)**. Feasibility **validated by a static-export spike** (below), so this is a
deliberate, proven choice — not a worse-but-forced one. Governs Stage 2; follows Stage 1.

## Date
2026-06-21

## Context
The operator is re-platforming the single-page raw-WebGL2 instrument into a modern,
maintainable, **media-heavy multi-page "studio" website**, **sequenced** after stabilizing the
current codebase. Deep research (6 agents, ~45 sources) leaned Astro for a *static content +
one heavy island* shape; the operator prefers a **full React app** (familiarity, ecosystem,
React-Three-Fiber optionality) and confirmed the site is graphics/media-heavy. The research's
one open worry about Next.js — whether its **static export** plays nice with the raw-WebGL2
canvas — was the thing to verify before committing.

## Decision
- **Framework = Next.js (App Router), full React**, **static export** (`output: 'export'`).
- **Instrument = embedded as-is** in a **`'use client'`** component that renders the same DOM
  (the canvas + HUD + gate by id/class) and **boots the existing raw-WebGL2 `main.js` in a
  `useEffect`** (after mount, since the module grabs elements by id at import). **NOT** rebuilt
  in React-Three-Fiber (it's *raw* WebGL2; R3F would be a pointless rewrite).
- **Hosting = Cloudflare Pages**, static deploy from GitHub on push (the static export is a
  plain `out/` tree — portable, no Node server).
- **Migration = strangler-fig**, instrument migrated last; **stabilize no-build first** (Stage 1).

## Validation — the spike (proof, not theory)
`spike/next-embed/` (throwaway): **Next.js 16.2.9 + React 19**, `output: 'export'` → static
`out/`. The instrument renders inside it — `beacon: glOk:true, frames advancing`, **zero
console errors** (cleaner than the parallel Astro spike, which hit a look-JSON 404 that its
inline fallback masked). So Next static export + the WebGL2 canvas works cleanly and deploys
static. Screenshot delivered to the operator.

## Alternatives Considered
- **Astro** (research's pick) — best for a *thin-content + one island* site and the simplest
  embed; chosen first on the "content" misunderstanding. Rejected for **full-React preference**;
  remains the strongest fallback (and Astro can host React islands if Next proves too heavy).
- **Astro + React islands** — React where it helps, Astro's static-media strengths kept. A real
  middle path; not chosen because the operator wants a *fully* React app.
- **vanilla + Vite** — lightest, but DIY routing/content; wrong for a media-heavy multi-page site.
- **Rebuild instrument in R3F** — full rewrite onto a new dep; discards a working renderer. Rejected.
- **Stay on Namecheap cPanel** — manual SSL, inode cap, FTP; weakest for a solo dev. Rejected.

## Consequences
- A build step (Next's bundler) lands **only at Stage 2** — Stage 1 stays no-build.
- **Tradeoff accepted:** Next.js is heavier than Astro (bigger JS baseline, React runtime). For a
  graphics/media-heavy app-like site that's acceptable; watch bundle size + image/video perf
  (Next `<Image>`, lazy-loading) since the research's perf edge was Astro's.
- Deploy chain changes from GitHub-Actions-FTPS→cPanel to **Cloudflare Pages** native Git.
- **Embed gotchas:** boot in `useEffect` (DOM exists post-mount); keep the instrument **idempotent**
  (guard against React StrictMode double-invoke in dev — cancel rAF / delete GL resources / close
  AudioContext on cleanup); `reactStrictMode:false` was used in the spike to sidestep it.
- **Bridge gotchas (honor in Stage 1):** keep `new URL(asset, import.meta.url)` literals static; no
  CDN import maps; avoid bare specifiers — so the bundler migration stays friction-free.
- **Tooling note:** the adopted `astro-framework` skill is now off-path; consider adopting a
  Next.js/React skill when Stage 2 starts (follow-up, not now).

## Related
- `spike/next-embed/` (the validating spike), `docs/research/best-path-forward/findings.md`
  (research history — recommended Astro), `docs/superpowers/specs/2026-06-21-best-path-forward-design.md`,
  `docs/plans/refactor/` (Stage 1), ADR-006 (phone-dev softened), ADR-005 (visibility/license),
  ADR-001 (backend on separate infra).
