# Point-Cloud Design System — refined plan (review before build)

**Status:** plan for operator review · **Originated:** 2026-06-21 · **Refined:** 2026-06-22 ·
No code built yet. This defines the design system that **Claude Design** consumes via
**`/design-sync`** so its agent composes with your real, on-brand spatial parts.

> **This revision changed direction.** The earlier draft described a conventional
> React kit (tokens + 2D Button/Card/etc.) with a 3D hero bolted on. Per operator
> decisions (2026-06-22) it is now a **point-cloud–first system**: the real
> components are **Gaussian-splat scenes + camera movements**, the UI lives
> **diegetically inside** those scenes, and `/design-sync` ships the **point clouds
> and camera moves**. It is also reconciled with the authoritative experience doc
> (`WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md`, 2026-06-22), which supersedes the
> stale "open on dark / hallway / webcam" framing below's predecessor.

## 0. Decisions locked in this revision
- **Mostly point-cloud.** The DS centers on splat scenes, not 2D primitives.
- **Full diegetic 3D kit.** Every UI primitive is a real 3D object (R3F/three +
  troika text) paired with a hidden 2D DOM mirror for a11y / clicks / SEO.
- **Sync scope = point clouds + camera movements.** That is what goes to Claude
  Design; the 2D editorial surface is secondary.
- **No webcam / no interface devices.** Viewpoint is driven by gyro, scroll, and
  pointer only. (This resolves old decision D3 — the live-camera tier is dropped.)
- **Splats do not exist yet → full capture pipeline** (capture → poses → train →
  web-compress), run **on servers, not the dev device.**
- **Experience arc (authoritative):** dawn → drapery gathers into a tent → a moment
  inside → drapery flutters away → land in the live Appalachian-rainforest music
  visualizer (the existing audio-reactive instrument). Source: the experience doc.

## 1. Project identity (unchanged — only the "how shown" reconciled)
A visual-effects artist's **portfolio piece** — not a wedding-services/decor site,
not picture-heavy. The artist builds enchanting, sensor-driven environments at real
weddings (drapery + flowers) using TouchDesigner + LiDAR + depth models. **Clients
never see the tech**; they're sold *"a beautiful, enchanting, magic experience,
tailored to your palette / theme / setting."* Voice = **poetic, benefit-led, never
technical**. The website itself *is* the demo: the visitor moves (gyro/scroll/
pointer) and the **viewpoint travels forward** through a draped-and-flowered splat
volume, the UI embedded inside it, resolving into the living visualizer. Each scene
is **parameter-driven** — mapping onto the project's existing **"looks = params-only
JSON"** DNA.

## 2. Compute & device model (NEW — mind the dev device, use servers)
The dev device is a **CPU-only Android/Termux container**: no GPU, no COLMAP/CUDA,
and the repo's own build/test tooling isn't even installed there. So responsibilities
split hard:
- **Phone (dev device):** capture footage, orchestrate/trigger jobs, review results,
  approve. All operator-facing handoffs stay phone-friendly (one value per block,
  files via `SendUserFile`, no large copy-paste) per `mobile-ergonomics.md`.
- **Servers / CI (all heavy work):**
  - **GPU server** — COLMAP camera poses + **3D Gaussian-splat training** +
    web-compression. *Mandatory; cannot run on the phone.* (Provider = open
    decision D-COMPUTE below.)
  - **CI (GitHub Actions)** — build the R3F library, run the `/design-sync`
    render-grading harness, deploy. Mirrors the existing push→Actions→FTPS flow.
- **Web-ready splats are versioned back** into the repo/asset store so the rendering
  + camera system (built against a placeholder until then) swaps them in.

## 3. The full splat pipeline (per-stage: where it runs)
1. **Generate (don't capture)** *(AI, free-tier — no footage needed)* — **Drapery**
   (object): text/image → **TRELLIS 2** (MIT, instant image→3DGS, handles sheer cloth),
   skips COLMAP. **Rainforest** (scene): AI video (Sora/Kling/Veo) of a slow 360° pan →
   extract frames → COLMAP. Real on-site capture stays the max-fidelity upgrade.
   Runbooks: `colab/drapery-trellis.md`, `colab/forest-video-splat.md`.
2. **Poses** *(GPU server)* — COLMAP structure-from-motion → camera intrinsics/extrinsics.
3. **Train** *(GPU server)* — 3D Gaussian-splat training (e.g. the gsplat / Nerfstudio
   `splatfacto` family — exact tool + version confirmed at build time, not assumed here).
4. **Compress for web** *(GPU/CPU server)* — convert raw `.ply` → a compact web format
   (compressed splat / SOG-style packing) with LOD so it's mobile-deliverable.
5. **Version + deliver** — store the compressed splats as assets the web app loads
   (CDN/host; not committed raw into git if large — keep the tree lean per the inode cap).

## 4. Web rendering + camera architecture
- **Splat rendering:** R3F/three Gaussian-splat renderer (specific package confirmed at
  build time). Each **scene = a parameter-driven module** (drapery, rainforest, light
  variants), cross-faded/combined; a **labelled subset (the drape splats) animates at
  runtime** — drift/gather, then flutter/dissolve — since each splat carries its own
  position/scale/opacity.
- **Camera movements (the other half of the synced kit):** forward dolly; **off-axis /
  anamorphic frustum** (the "window into recessed depth," `setViewOffset` / custom
  projection); **viewpoint** driven by `useGyro` (iOS `requestPermission()` from a tap,
  HTTPS), scroll, and pointer — **no webcam.** Writes a smoothed vec to a ref consumed
  in `useFrame`, never React state per frame.
- **Diegetic UI + a11y:** primitives are true 3D objects (mesh panels, troika text) that
  occlude and move with the splat, **plus a slim hidden 2D HTML layer** for a11y/clicks/SEO.
- **Mobile budget** (matches existing perf rules): DPR ≤ 1.5, KTX2/compressed assets,
  splat LOD, `PerformanceMonitor` → DPR regression, pause on `visibilitychange`,
  ≤1–2 heavy post effects. **Fallback tier** (low-end): layered-quad parallax + a
  depth-displacement shader — the flat version of the same illusion.
- **Reduced motion:** a composed, calm version; the page still conveys who the studio
  is and what it offers without the immersive scene.

## 5. The 3D UI primitives (full diegetic kit — secondary to the splats)
Practical names the design agent + engineers use, each = a 3D object + 2D DOM mirror:
`Button`, `Text` (display/body), `Section`, `Card`, `Field`, `Nav`. Plus the signature
**`BotanicalScene`** wrappers (drapery / rainforest) and the **camera-move** components.
Tokens still define the look of any diegetic text/surfaces:

**Type** (Google Fonts / open-license): **Fraunces** display (Wonk + Soft axes on) ·
**Hanken Grotesk** body · **DM Mono** for dates/labels/captions. *(Decision D2 — confirm
or pick an alternate pairing.)*

**Palette — two themes** *(Decision D1 — confirm the dusk direction):*
- Light "Pressed & Bone": `--bone #F6F1E6` · `--pressed-fern #1F4F3A` ·
  `--sage-veil #A9C2B2` · `--cocoa-ink #3A2F2A` · `--dusty-rose #C97A6A` ·
  `--brut-champagne #EBDAB0`
- Dark "Glasshouse at Dusk" (the immersive scenes): `--ink-ivy #0B1F18` ·
  `--conservatory #1E3F34` · `--verdigris #4C7A68` · `--champagne #E6D7B8` ·
  `--petal #D9B8C4` · `--gilt #C9B06A`

Gold stays champagne/old-gold (never brass); blush stays dusk (never candy-pink).

## 6. Packaging for `/design-sync`
- **R3F library** (Vite library-mode → ESM `dist/`, `preserveModules`, externalized
  React, `vite-plugin-dts`; `"sideEffects":["**/*.css"]`); **Storybook** stories are the
  preview source (R3F renders via a canvas decorator). Tokens as a `tokens.css` subpath.
  `'use client'` on leaf interactive components for the Next.js consumer (ADR-012).
- **What syncs:** the **point-cloud scene modules + camera-movement modules** (and the
  diegetic primitives). Their `/design-sync` previews are **captured frames/short clips**
  of the rendered scene — not tidy static cards — so the agent composes *scenes and
  camera moves.*
- **Honest fit note:** splats are **large binary assets** and rendering them in the
  `/design-sync` grading harness is the heaviest case the tool handles. The grading +
  library build run on **CI**, not the phone. Expect previews to be representative
  captures, and keep raw splats out of the synced bundle (reference compressed assets).

## 7. Build sequence (only after you approve this plan)
0. **Stand up compute** — pick the GPU path (D-COMPUTE), wire a repeatable job
   (capture-in → web-splat-out) and install the repo's dev deps in CI.
1. **Prove the rendering + camera pipeline against a placeholder splat** (in parallel with
   capture) — R3F splat render + forward dolly + off-axis frustum + gyro/scroll, mobile
   budget + fallback tier.
2. **Create the first real splat** (drapery) through the full pipeline; swap it in.
3. **Camera-movement + scene modules + tokens** → **first `/design-sync`** (the synced kit).
4. **Diegetic UI primitives** (3D + a11y mirror) → add to lib + Storybook → sync.
5. **Rainforest splat + the dawn→tent→flutter→visualizer arc** → integrate on a standalone
   route (ADR-012); hand off into the existing audio-reactive instrument.

## 8. Open decisions for you
- **D-COMPUTE (RESOLVED 2026-06-22):** **rented cloud GPU** runs splat training —
  COLMAP → 3DGS (gsplat/Nerfstudio) on a pay-per-hour instance (RunPod/Lambda/Vast/
  Colab), driven from the phone, output compressed to `.SPZ`/`.SOG`. Provider pick +
  per-job budget still TBD; capture footage is the upstream prerequisite.
- **D1 — dusk direction:** confirm dark immersive scenes + light editorial body.
- **D2 — type:** confirm Fraunces + Hanken Grotesk + DM Mono (or an alternate pairing).
- **D3 — camera tier:** RESOLVED — webcam dropped (no interface devices).
- **D-SPLAT-MOTION:** v1 realism is load + cross-fade authored light variants + camera
  motion + drape subset animation; true relighting / 4D dynamic splats are research-stage
  and deferred — confirm that's acceptable for the first ship.

## 9. Risks
GPU compute is off-device and costs money (provision deliberately). Splat assets are
heavy → aggressive compression + LOD or phones jank. iOS gyro needs a tap + HTTPS
(silently dead otherwise). True splat relighting/deformation is research-stage — keep v1
to cross-fade + subset animation. `/design-sync` previews of splat scenes are captures,
not crisp component cards — set expectations.

## Research-confirmed stack & techniques (2026-06-22, NotebookLM 239 sources)

Grounded findings (full cited spec: NotebookLM Doc "Engineering Build Spec" +
notebook `688cc151`; build steps in `BUILD-WORKFLOW.md`). **Production-ready** vs
**research-stage** is called out — it sharpens this plan's bets.

- **Web rendering:** Spark 2.0 or PlayCanvas (or mkkellogg/GaussianSplats3D); ship
  compressed `.SPZ`/`.SOG`/`.ksplat`, never raw `.PLY`.
- **Multiple splats in one scene:** global-buffer merge — aggregate all Gaussians
  into one world-space buffer + single back-to-front sort (per-splat depth), so
  drapery + rainforest composite without artifacts.
- **Animating the drape subset:** *production* = Linear Blend Skinning (bind splat
  subset to a skeleton) + semantic-mask (VLM labels object → mask its splats);
  *research-stage* = 4DGS deformation fields / physics cloth (too heavy to stream).
- **Light & shadow (relighting):** *production* = proxy-mesh relighting + PCSS soft
  shadows (PlayCanvas splats can write the depth buffer); *research-stage* = full
  PBR decomposition (SSD-GS) — not web-deployable yet. (Confirms this plan's
  "relighting is the hard part" flag.)
- **Camera & motion:** Theatre.js (cinematic keyframes, custom `rafDriver` synced
  to three.js) + GSAP ScrollTrigger (scroll → camera fly-through).
- **Mobile budget:** ~200–500K splats @30–45fps on a flagship; `.SPZ`/`.SOG` +
  virtual-memory paging (swap 64K chunks by view frustum) or VRAM-thrash → thermal
  throttle. Matches the existing mobile-budget rule.

## Sources
Packaging: Vite library-mode, Storybook (`@storybook/react-vite`), W3C DTCG tokens,
Next.js `use client`. Viewpoint: MDN DeviceOrientation, iOS `requestPermission`, Codrops
fake-3D / depth-displacement, drei `DeviceOrientationControls`. Splats: 3D Gaussian
Splatting (Inria), gsplat / Nerfstudio `splatfacto`, COLMAP, web splat renderers +
compression — **specific libraries/versions to be confirmed at build time** via the repo's
`find-docs`/context7 workflow, not asserted from memory. Botanical/look + palette/type
research carried over from the prior revision. (Full URLs in the session research transcript.)
