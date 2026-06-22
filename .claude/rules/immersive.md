# Immersive page rule — the point-cloud wedding landing page (`immersive/`)

Load-bearing constraints for building the immersive page. Full build reference:
`docs/design-system/IMPLEMENTATION.md`; the arc: `WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md`;
the design plan: `docs/design-system/PLAN.md`.

## Architecture
- `immersive/` is a **standalone Vite + React-Three-Fiber + Spark** app, separate from the no-build
  raw-WebGL2 instrument in `src/`. Graduates into a Vite library-mode build for the Next.js site (ADR-012).
- **Splats:** one `SparkRenderer` composites multiple `SplatMesh` (global-buffer merge). Layers load
  via the shared `useSplatLayer(loadFn, placeholderFn)` hook — placeholder first, real on load,
  dispose on swap, **graceful fallback when the asset is absent** (app + CI always render).
- **Camera/nav:** off-axis frustum ("window into depth"); **no-sensor on-screen arrow nav** (forward
  `travel` 0→1 + `look` peek) — gyro/scroll dropped.
- **Journey:** a Theatre.js sequence scrubbed by `travel` (`sheet.sequence.position = progress *
  length`), state authored in Theatre studio → `state.json`. No GSAP ScrollTrigger (travel-driven).

## Instrument reactivity (ADR-013 — the rainforest splats ARE the instrument)
At `travel === 1` the rainforest `SplatMesh` becomes the live audio-reactive instrument **inside
R3F** — NOT a handoff to the `src/` raw-WebGL2 app. Full reference: `docs/design-system/INSTRUMENT-HANDOFF.md`.
Load-bearing facts:
- **Per-splat reactivity** = `splatMesh.worldModifier = dyno.dynoBlock(...)` wrapping a `dyno.Dyno`
  (GLSL on the `Gsplat` struct: center/scales/rgba), uniforms `dyno.dynoFloat`/`dynoVec3`;
  **`updateGenerator()` ONCE** on attach/mesh-swap, **`updateVersion()` per frame** after writing
  uniform `.value`. Import is `import { dyno } from '@sparkjsdev/spark'` (namespace).
- Audio/control/mode stacks live under `immersive/src/{audio,control,mode}` — **re-authored, NO
  cross-app import** from `src/`. Reactivity stays **inert until `travel===1`** (deterministic scrub).
- **`dyno` GLSL is authored blind (no on-device GPU) → all visual/GPU QA is OFF-DEVICE** in
  Antigravity (`agy`); on-device verification is `node --check` + the esbuild bundle smoke only.

## Build + verify (this dev container)
- **Heavy builds run OFF-DEVICE** (GitHub Actions / `immersive.yml`) — Termux can't dlopen native
  Rollup/onnxruntime. On-device verify = `node --check` + `node_modules/.bin/esbuild
  immersive/src/main.jsx --bundle --format=esm --jsx=automatic --outfile=/dev/null`.
- **Render/visual QA is off-device** — drive the app + Theatre studio in Antigravity's browser.

## Mobile budget (non-negotiable)
~200–500K splats combined; DPR ≤ 1.5; pause on `visibilitychange`; reduced-motion tier; dynamic
resolution. `immersive/src/perf/mobileBudget.js` holds the guards. (Mirrors `.claude/rules/shaders.md`.)

## Assets — generate, don't capture; commercial-safe
Drapery = TRELLIS (MIT); rainforest = Veo 3.1 → COLMAP → Splatfacto → SuperSplat. Specs:
`rainforest-asset-spec.md` + `colab/*.md`. **Write our own / use only commercially-licensed or
generated assets** — never copy NC-licensed work. Compressed `.spz` live in `immersive/public/assets/`
(gitignored; host/CDN-delivered).

## Specialists / skills (dispatch the right one)
splat-graphics (render) · motion-choreography (journey) · interface-design (UI/tokens) · splat-asset
(pipeline); review with design-reviewer + perf-a11y-reviewer. Skills: r3f-shaders, frontend-design,
perf-budget, accessibility, find-docs.
