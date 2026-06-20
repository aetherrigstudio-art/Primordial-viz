# ADR-002: Wedding landing page uses a hand-built raw-WebGL2 geometry renderer (no library)

## Status
Accepted

## Date
2026-06-20

## Context
We're building the wedding-planner **landing page** (`clients/wedding-pagoda/`):
a cinematic, scroll-through, audio-reactive experience — a candlelit draped pagoda
hallway that morphs into a garden (`VISION.md`). It needs a rendering approach.

Constraints in play: the repo's **raw-WebGL2, zero-runtime-dependency, write-our-own**
posture; a hard **mobile performance budget**; and the existing engine. Grounding
(4 parallel inventory agents, 2026-06-20) found: the primordial renderer is a
**fullscreen-triangle raymarch** pipeline (`src/gl/*`) whose FBO/post/dynamic-res/
audio-texture plumbing and the `src/audio/*` engine are reusable — but it has **no
geometry, camera, or scroll**. The dynamic-canvas deep research
(`research/landing-page-rag/dynamic-canvas-deep-research.md`) showed award studios
build a persistent canvas + DOM-proxy text with three.js + scroll libs.

## Decision
Build a **small, hand-built raw-WebGL2 geometry engine, with no rendering library**:
a perspective camera tracking scroll down an **instanced** pagoda hallway,
**tessellated draped-plane meshes** swayed in the vertex shader, and **real DOM text
projected** onto the geometry (world→screen). Reuse the audio engine and the
loop/mobile-budget *patterns*; do not reuse the fullscreen-triangle draw path.
(Operator decision via `AskUserQuestion`, 2026-06-20.) Locked recipe in `TECH.md`.

## Alternatives Considered

### Raymarch the whole hallway in a fragment shader (recommended by the analysis)
- Pros: maximal reuse — the existing `Renderer(canvas,{slimeFrag,postFrag})` + the
  `workshop/` clip rig host it as-is; zero new engine; fastest to a phone clip.
- Cons: a **stylized/volumetric** look, not literal geometry; drapes are
  shader-faked (not real cloth meshes); DOM text isn't locked to geometry.
- **Rejected by the operator** — wanted literal 3D drapery, real meshes, and
  DOM words pinned to the geometry.

### Adopt a 3D library (three.js / ogl)
- Pros: batteries-included geometry/camera; the only clean path to real **Gaussian
  splats** (Spark is three.js-based).
- Cons: a **runtime dependency**, against the zero-dep posture; heaviest; makes the
  landing page a library-carrying surface.
- **Rejected** — splats are gated/later (see ADR-003); geometry + cloth + DOM
  projection are all achievable in raw WebGL2.

## Consequences
- A new but small engine: own `mat4`, instancing (`drawElementsInstanced`), a
  render-scale FBO + upscale, hand-rolled eased scroll→camera, and per-frame
  world→screen DOM projection. Procedural-JS geometry (no stock 3D models, no
  DCC/glTF on the gig path).
- The fullscreen-triangle **workshop clip rig can't host it** → a standalone page +
  a Playwright-based clip path are needed (a first prototype was built + recorded,
  validating the drape technique on 2026-06-20).
- The mobile budget shifts to **overdraw + draw-call** control (translucent drapes/
  foliage) rather than raymarch steps; still render to a 0.5–0.75 FBO, cap DPR,
  instance, LOD, pause-on-hidden.
- Reuses `src/audio/*` (Analyser/BeatTempo) unchanged and the `src/main.js`
  loop/dynamic-res *patterns*; **does not modify** the primordial instrument's
  `src/gl/*` or `src/audio/*`.
- Adding real Gaussian splats later would reopen the "adopt a library" question
  (a separate decision).
