# ADR-003: Volumetric content is acquired/authored, never trained; Act-2 garden uses instanced alpha-cutout cards

## Status
Accepted

## Date
2026-06-20

## Context
The wedding landing page's Act 2 (and the broader "dynamic canvas" vocabulary)
calls for greenery/flowers and possibly captured-3D depth. The deep research
(`research/landing-page-rag/dynamic-canvas-deep-research.md`, focused pass 2) mapped
three volumetric techniques — **depth maps, point clouds, Gaussian splats** — and
surfaced a **commercial-licensing trap**: the original Inria 3D Gaussian Splatting
*research/training* code is **non-commercial**. This is commercial work under our
**write-our-own / MIT-CC0-CC-BY-only** rule. The operator stated: **"we won't be
training splats."**

## Decision
1. **Never run splat-training code.** If Gaussian splats are ever used, **acquire**
   them: capture via a commercial app (KIRI Engine / Luma — we own the output per
   their ToS) → download `.ply`/`.spz` → render with an **MIT** renderer (Spark).
   This keeps the Inria non-commercial code out of our stack entirely (the clean
   renderer-vs-data-vs-training separation).
2. **Mobile technique ladder:** depth-parallax (cheapest, raw WebGL2) → point clouds
   (`gl.POINTS`, capped) → **gated** splats (desktop-first, LOD/fallback). Splats
   are not in v1.
3. **Act-2 garden + ivy = instanced alpha-cutout leaf/petal cards** (billboards),
   wind via the same sum-of-sines used for the drapes. **Textures must be CC0 or our
   own** (license-checked); reference pattern: `keaukraine/webgl-flowers` (MIT
   *code*, its *art assets are not ours*).

## Alternatives Considered

### Train our own Gaussian splats
- Pros: full control of captured scenes.
- Cons: Inria training code is **non-commercial**; needs GPU/training infrastructure
  we don't have (HTTPS-only cloud, phone-driven).
- **Rejected** — licensing + burden + operator decision.

### Point cloud or splats as the *first* Act-2 technique
- Pros: soft volume / photoreal.
- Cons: point clouds over-draw on mobile and have no crisp petal silhouette; splats
  need a library + acquired data.
- **Rejected as first** — reserved as later "mid"/"gated" rungs.

### Depth-parallax planes for the foliage
- Pros: cheapest.
- Cons: reads flat for ivy climbing columns (no real silhouette).
- **Rejected for foliage** — used elsewhere (flat art layers), not for the plants.

## Consequences
- Commercially clean: MIT renderer + data licensed via a capture app's ToS + **no
  Inria code**. Every shipped splat's training-tool license must still be verified.
- **One instanced-card engine serves both ivy (Act 1 morph) and the Act-2 flower
  garden** — no second renderer.
- All leaf/petal/flower textures are **CC0 or our own photography** (the safest
  path); "free" asset sites mix CC0 + premium → per-asset license check
  (`clients/wedding-pagoda/references.md`).
- Splats remain a **gated, desktop-first** enhancement with a point-cloud/poster
  fallback — adding them later is an isolated change, not a rearchitecture.
