# ADR-013: Immersive page's end-state instrument lives in R3F (rainforest splats *become* the instrument)

## Status
**Accepted** — operator-directed 2026-06-22. **Scoped supersession of ADR-012:** for the
**immersive page's terminal visualizer only**, this overrides ADR-012's "embed the
instrument as-is, NOT in React-Three-Fiber." ADR-012 still governs the **studio-site**
instrument embedding (the no-build raw-WebGL2 `src/main.js` in a `'use client'` component);
this ADR carves out only the immersive journey's end-state.

## Date
2026-06-22

## Context
The immersive point-cloud page (`immersive/` — Vite + React-Three-Fiber + `@sparkjsdev/spark`)
plays a journey (dawn → drapery tent → flutter away) and must **come to rest on a
visualizer**. The question was what that visualizer *is*: the committed design docs
(ADR-012, `docs/design-system/IMPLEMENTATION.md`, and a prior session entry) pointed to
**(b)** — the R3F journey hands off / navigates *into* the separate raw-WebGL2 `src/`
instrument, with the rainforest splat as mere "world context." The operator chose **(a)**.

## Decision
At journey's end (`travel === 1`) the **rainforest Gaussian-splat scene itself becomes the
live, audio-reactive, performer-controllable instrument inside the R3F app.** It is **not**
a handoff/navigation to `src/`, and does **not** embed `src/main.js`. Concretely:
- The audio *pattern* from `src/audio/*` is **re-authored** (not imported) into the R3F app.
- The rainforest `SplatMesh` is driven by Spark `dyno` shader modifiers fed by audio + control uniforms.
- A performer control layer (keyboard baseline; MIDI/OSC pluggable) drives a params schema.
- The visualizer is the page's **terminal, persistent** state; a "Skip to visualize" control fast-forwards the same `travel` timeline to it.
- A beat-synced waypoint camera moves on musical time (every 8/16 bars).

The operator made this call **knowingly**, accepting the "R3F rewrite" tradeoff ADR-012
named — because the immersive instrument is a *splat-based* instrument (audio-reactive
Gaussian splats), not the slime raymarcher, so reusing `src/main.js` was never a fit here.

## Validation
Built and committed (`bb3ae73`). On-device gate green: `node --check` + the esbuild bundle
smoke (whole module graph resolves, including the verified `@sparkjsdev/spark` `dyno` API).
**GPU/visual correctness is NOT yet verified** — that QA is off-device (Antigravity `agy`).

## Alternatives Considered
- **(b) Hand off to the `src/` instrument** (the committed-docs default) — rejected by the operator: it's the slime raymarcher, not a splat instrument, so it can't *be* the rainforest visualizer; embedding it would mean a hard cross-stack swap (two WebGL contexts) at the journey's end.
- **Rebuild the whole `src/` instrument in R3F** — out of scope; ADR-012's rejection of that still stands for the studio site.

## Consequences
- `immersive/` now carries an audio + control + reactive-splat + mode + beat-camera stack (~24 new/changed files; see `docs/design-system/INSTRUMENT-HANDOFF.md` for the architecture + the verified Spark API).
- The `src/` instrument is the **reference** for the audio pipeline (bands, 512×2 texture, mic gesture, deny→visuals-only), **not** a runtime dependency. No cross-app imports.
- All splat-shader (`dyno` GLSL) correctness QA is **off-device** (no GPU on the dev device).
- The studio-site instrument embedding (ADR-012) is **unaffected** — that path stays raw-WebGL2-embedded-as-is.

## Related
- `docs/decisions/012-replatform-target.md` (the scoped-superseded decision)
- `docs/design-system/INSTRUMENT-HANDOFF.md` (architecture + verified Spark `dyno` reactivity API)
- `.claude/rules/immersive.md` (load-bearing immersive constraints)
- Feature commit `bb3ae73` on `claude/immersive-instrument-handoff`
