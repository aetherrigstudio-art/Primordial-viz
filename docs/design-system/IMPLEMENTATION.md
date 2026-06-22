# Immersive page — implementation reference

Load-bearing facts for **building the point-cloud wedding landing page** (the `immersive/` app),
in our own words so they're retrievable via the RAG. Canonical companions: `PLAN.md` (design),
`WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md` (the arc), `rainforest-asset-spec.md` +
`colab/*.md` (assets), `ROADMAP`/`BUILD-WORKFLOW.md` (workflow). APIs below were verified via
context7 / vendor docs in June 2026 — re-verify version-specific details at build time.

## Stack
- **`immersive/`** is a standalone Vite + React app, separate from the no-build raw-WebGL2 instrument
  in `src/` (its React/three deps never tangle with the gig path). Graduates into a Vite library-mode
  build consumed by the Next.js studio site (ADR-012) for `/design-sync`.
- **`@react-three/fiber`** v9 + **three** r0.171 — declarative three.js.
- **`@sparkjsdev/spark`** — three.js-native Gaussian-splat renderer.
- **Theatre.js** (`@theatre/core` + `@theatre/r3f`) — the journey camera/timeline (planned).

## Spark (Gaussian splats) — API
- `new SparkRenderer({ renderer })` shares R3F's WebGL renderer (the `gl` from `useThree`); add it
  to the scene once. `SplatMesh` is a `THREE.Object3D`, so it drops into the R3F tree via `<primitive>`.
- Load a real splat: `new SplatLoader().loadAsync(url)` → `Promise<PackedSplats>` (`.catch` on a
  missing/invalid file — the clean fallback hook), then `new SplatMesh({ packedSplats })`. Or
  `new SplatMesh({ url, onLoad, onProgress })`. Formats: `.spz/.ply/.sog/.ksplat` (auto-detected).
- **Multiple splats composite** under one `SparkRenderer` via global-buffer merge (back-to-front
  sort) — so drapery + rainforest layer together without artifacts.
- Procedural splats (placeholders, no binary asset): `new PackedSplats({ maxSplats })` +
  `packed.pushSplat(center, scales, quaternion, opacity, color)`.
- Re-orient real splats: `mesh.quaternion.set(1,0,0,0)` (OpenCV→OpenGL), `mesh.position`,
  `mesh.scale.setScalar(...)`. `mesh.dispose()` frees GPU buffers when swapping out.

## App architecture (`immersive/src/`)
- **`splat/`** — `SparkScene.jsx` is a multi-splat holder; `useSplatLayer(loadFn, placeholderFn)` is
  the shared per-layer pattern: render the placeholder on frame 1, swap in the real splat on load,
  dispose on swap/unmount, **fall back to the placeholder when the asset is absent** (so the app + CI
  always render). `loadDrapery.js` / `loadRainforest.js` each export a loader, a placeholder factory,
  and a `*_TRANSFORM` (position/quaternion/scale) QA knob; `transform.js` applies it.
- **`camera/`** — `offAxisFrustum.js` does the off-axis ("window into depth") frustum via
  `camera.setViewOffset`. `CameraRig.jsx` maps the nav input → camera.
- **Navigation = no-sensor on-screen directional arrows** (gyro/scroll dropped): a forward `travel`
  (0→1 journey progress) + `look` (lookX/lookY peek). Deterministic, keyboard-accessible, needs no
  permissions.
- **`perf/mobileBudget.js`** — DPR cap (≤1.5), frame-time regression, pause-on-hidden, reduced-motion.
- **Journey (planned)** — a Theatre.js sequence scrubbed by `travel`: `sheet.sequence.position =
  progress * length` each frame (NOT `sequence.play()`); state authored in Theatre studio →
  `state.json`. No GSAP/ScrollTrigger (the journey is travel-driven, not scroll-driven).

## Assets — generate, don't capture
- **Drapery (object):** image → **TRELLIS** (`microsoft/TRELLIS-image-large`, MIT) → `.ply`. One-tap
  via the HuggingFace Space; runbook `colab/drapery-trellis.md`.
- **Rainforest (scene):** **Veo 3.1** (Google AI sub; ~8s clips → stitch 2–3) → COLMAP →
  Nerfstudio **`splatfacto-big`** (density flags: `cull_alpha_thresh=0.005`,
  `continue_cull_post_densification=False`, `use_scale_regularization=True`) → SuperSplat cleanup +
  decimate → `.spz`. Avoid Sora (deprecated). Art direction + prompts: `rainforest-asset-spec.md`;
  runbook `colab/forest-video-splat.md`.
- Web-ready `.spz` assets live in `immersive/public/assets/` (gitignored binaries; host/CDN-delivered)
  and load via `/assets/<name>.spz`. Keep combined splats ~200–500K (mobile budget).

## Environment constraints (this dev container)
- **Root Termux / Android arm64.** Native Node binaries can't `dlopen`: the Vite/Rollup production
  build, esbuild's native path, and the RAG embedder (`onnxruntime-node`) all fail here. **Heavy
  builds run off-device** (GitHub Actions / `immersive.yml`); on-device verification is `node --check`
  + an `esbuild --bundle` smoke (esbuild's standalone binary works).
- **Render/visual QA is off-device** — root-Claude can't run Chromium; drive the app + Theatre.js
  studio in Antigravity's browser.
- Outbound is HTTPS-443 only; only git-committed files survive a container wipe.
