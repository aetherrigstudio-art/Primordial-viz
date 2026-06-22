# immersive/ — render-pipeline proving ground

Standalone Vite + React-Three-Fiber app that proves the point-cloud landing-page rendering
+ camera pipeline against a **procedural placeholder splat**, in parallel with real asset
capture (PLAN §7 step 1, BUILD-WORKFLOW Phase 2). It is deliberately separate from the repo
root so its React/three/Spark deps never tangle with the no-build raw-WebGL2 instrument in
`../src/`.

## Stack (verified via context7, 2026-06-22)
- **`@react-three/fiber`** (`/pmndrs/react-three-fiber`) — declarative three.js.
- **`@sparkjsdev/spark`** (`/sparkjsdev/spark`) — three.js-native Gaussian-splat renderer.
  `SparkRenderer` shares R3F's `gl`; `SplatMesh` is an `Object3D` (drops in via `<primitive>`);
  loads `.spz`/`.ply`, and builds procedural `PackedSplats` (so the placeholder needs no asset).
- **three** r0.171.

## What's here (increment 1)
- `src/splat/SparkScene.jsx` — **multi-splat** scene: one `SparkRenderer` composites every layer
  (global-buffer merge). The rainforest is the enclosing environment; the drapery is the foreground.
- `src/splat/useSplatLayer.js` — shared hook: placeholder on the first frame, real splat when it
  loads, dispose on swap/unmount, graceful fallback when the asset is absent. Used by every layer.
- `src/splat/loadDrapery.js` / `loadRainforest.js` — each exports its loader, placeholder factory,
  and a `*_TRANSFORM` (position/quaternion/scale) QA knob. `transform.js` applies it.
- `src/splat/placeholderSplats.js` / `placeholderRainforest.js` — the procedural fallbacks.
- Real assets live in `public/assets/` (gitignored `.spz` binaries; see its README).
- `src/camera/offAxisFrustum.js` — off-axis / anamorphic frustum (the "window into depth").
- `src/camera/CameraRig.jsx` — forward dolly + off-axis, driven by viewpoint; per-frame perf monitor.
- `src/viewpoint/useViewpoint.js` — gyro + scroll + pointer → smoothed ref (no webcam; iOS gyro via tap).
- `src/perf/mobileBudget.js` — DPR cap, frame-time regression, pause-on-hidden, reduced-motion.
- `src/App.jsx` — Canvas + mandatory start gate + reduced-motion tier.

## Next increments
- Theatre.js + GSAP ScrollTrigger choreography for the dawn→tent→flutter→visualizer arc.
- Fallback tier (layered-quad parallax + depth-displacement shader) for low-end devices.
- Diegetic 3D UI primitives + hidden 2D a11y/SEO mirror.
- Graduate the scene/camera modules into a **Vite library-mode** build + Storybook for
  `/design-sync` (PLAN §6).

## Verify
- On-device (this container, no GPU/browser): `npm run build` proves it **compiles**.
- **Render QA is off-device** — root-Claude can't run Chromium; drive `npm run dev` in
  Antigravity's real browser (BUILD-WORKFLOW Phase 4) to confirm the splat actually renders.
