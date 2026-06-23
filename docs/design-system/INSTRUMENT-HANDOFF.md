# Immersive instrument-handoff — implementation reference

How the `immersive/` page's rainforest splat scene becomes the live audio-reactive
instrument (ADR-013). Our-own-words build reference, retrievable via the RAG. Companions:
`IMPLEMENTATION.md` (the splat/Spark base), `PLAN.md`, `WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md`.
APIs below were verified against `@sparkjsdev/spark` (context7 + the package's own
`examples/glsl` + `examples/splat-dissolve-effects` + `docs/splat-mesh.md`) in June 2026 —
re-verify version-specific details at build time.

## The instrument is the rainforest splats, reactive in R3F
At `travel === 1` the rainforest `SplatMesh` is animated per-splat by audio + performer
control, in React-Three-Fiber. No handoff to the raw-WebGL2 `src/` app; the `src/` audio
code is the *pattern* we port, not a dependency. Four subsystems under `immersive/src/`:
audio, splat reactivity, control, mode transition — plus a beat-synced camera.

## Spark `dyno` reactivity — the verified mechanism
Per-splat GPU animation in Spark is done with **`splatMesh.worldModifier` /
`objectModifier`** set to a **`dyno.dynoBlock`** that wraps a **`dyno.Dyno`** GLSL node
transforming a `Gsplat` struct. This is the load-bearing API; it is correct and exercised
in `immersive/src/splat/reactiveModifier.js`.

```js
import { dyno } from '@sparkjsdev/spark'   // `dyno` is a NAMESPACE export
const uBass = dyno.dynoFloat(0)            // uniforms: dynoFloat / dynoVec3 / dynoSampler2D
splatMesh.worldModifier = dyno.dynoBlock(
  { gsplat: dyno.Gsplat }, { gsplat: dyno.Gsplat },
  ({ gsplat }) => {
    const d = new dyno.Dyno({
      inTypes:  { gsplat: dyno.Gsplat, bass: 'float' },
      outTypes: { gsplat: dyno.Gsplat },
      globals:    () => [ dyno.unindent(`/* helper GLSL, authored from blank */`) ],
      statements: ({ inputs, outputs }) => dyno.unindentLines(`
        ${outputs.gsplat} = ${inputs.gsplat};
        ${outputs.gsplat}.center = ${inputs.gsplat}.center + /* audio-driven offset */;
        ${outputs.gsplat}.rgba   = /* recolor */ ${inputs.gsplat}.rgba;
      `),
    })
    gsplat = d.apply({ gsplat, bass: uBass }).gsplat
    return { gsplat }
  },
)
splatMesh.updateGenerator()        // ONCE after assigning/attaching a modifier (recompiles)
// per frame, after writing uniform .value:
uBass.value = features.bass; splatMesh.updateVersion()
```

Rules that matter:
- `Gsplat` struct: `center(vec3)`, `flags(uint)`, `scales(vec3)`, `index(int)`, `quaternion(vec4)`, `rgba(vec4)`. We touch `center`, `scales`, `rgba`.
- **`updateGenerator()` once** on attach/mesh-swap (it recompiles the GPU pipeline; do NOT call per frame). **`updateVersion()` every frame** after changing any uniform `.value`.
- Uniforms are created in JS (`dyno.dynoFloat/dynoVec3/dynoSampler2D`) and read as named `inTypes` inside the `Dyno`; set `.value` each frame.
- `dyno.unindent` / `dyno.unindentLines` wrap the GLSL. **Write GLSL from blank** (commercial licensing rule); never copy NC/Shadertoy.
- CPU-side `packedSplats` edits (`needsUpdate = true`) exist but are a full re-upload — use sparingly (authoring, not per-frame reactivity).

One combined modifier runs all per-splat effects in a single GLSL pass (mobile budget).
Effect → mechanism: movement = displace `center` by audio-driven flow noise; growth = scale
`scales`; bloom/flower-color = recolor/scale flower-masked splats; lighting/shadow = cheap
fake directional + AO darkening (no real normals). True PCSS relighting is deferred.

## Flower mask
`immersive/src/splat/semanticMask.js` derives a flower-region mask **in-shader from splat
colour** (a bloom-hue test on `gsplat.rgba`) — real Splatfacto captures ship no semantic
channel. A baked per-splat mask is a v2 option once real assets land.

## Audio in R3F (pattern ported from `src/audio/*`)
`immersive/src/audio/` re-authors (no cross-app import) the AnalyserNode wrapper:
`fftSize 1024 → 512 bins`, smoothing 0.8, bands `{bass[1,6], mid[6,46], treble[46,186],
level=RMS, flux=positive spectral-flux ×12}`, plus a **512×2 R8 `THREE.DataTexture`**
(row 0 FFT, row 1 waveform, `NEAREST`) so Shadertoy-style audio shaders port unchanged.
`useAudio.jsx` is a context provider holding analyser/input/texture/beat in **refs (never
per-frame React state)**; it exposes `{ start, status, featuresRef, audioTexture, beatRef,
updateRef, pickDevice }`. The mic gesture is the existing start-gate tap (and the skip tap);
deny → `status:'visuals-only'` with zeroed features. A single `updateRef.current()` runs
once per frame from an in-Canvas pump (`AudioPump` in `App.jsx`), skipped while hidden.

`immersive/src/audio/bpm.js` (`BeatClock`) re-authors the `src/audio/bpm.js` energy-spike
detector and adds musical time: `{ bpm, beat, bar, beatPhase, downbeat }` (4/4; `downbeat`
true the frame a bar starts), updated in the same per-frame pass and exposed via `beatRef`.

## Control layer
`immersive/src/control/` mirrors the `src/params/schema.js` params-only pattern:
- `schema.js` — entries `{ key, label, type:'range'|'color', min, max, step, default, group }` across 6 active groups: movement, lighting, growth, shadow, bloom, flowerColor. `coerceValue(key,v)` / `coerceParams(obj)` / `DEFAULTS`. (An `atmos` group returns when the atmospherics post-pass lands — roadmap 1.7.)
- `store.js` — `createStore()` → `{ getParams, getParam, setParam, subscribe }`, versioned `localStorage` key `immersiveV1`, coerce-on-load.
- `targets.js` — the **seam**: a flat registry `targetId → { schemaKey, apply(value01, store) }`. Range params map 0..1 into `[min,max]`; colours expand into per-channel `…R/.G/.B` targets. Every input source maps onto `targetId`s only — it never touches splats.
- `sources/{keyboard,midi,osc}.js` + `useControls(store, flags)`. **Keyboard is the baseline**; MIDI/OSC are pluggable adapters behind `{ midi:false, osc:false }`.

The reactive splat reads `featuresRef.current` (audio) + the store params each frame and
writes them into the modifier uniforms — **gated inert until `travel === 1`** so the
journey scrub stays deterministic.

## Browser MIDI/OSC reality
- **Web MIDI** (`navigator.requestMIDIAccess`) is *limited-availability*, **secure-context only**, and **absent on Safari/iOS** — capability-gate it, degrade silently. Keyboard is the real baseline.
- **OSC cannot be pure-browser** (no raw UDP). `sources/osc.js` is a **WebSocket** client to an operator-run OSC↔WS bridge (`{address, args}`); the bridge is a separate process, not in the app.

## Mode transition (terminal visualizer + skip)
`immersive/src/mode/`:
- `travelDriver.js` — `createTravelDriver()` owns the single `travel` 0..1 scalar via `setSource(fn)`; `requestSkip()` runs an eased **monotonic** ramp to 1 (an accelerated scrub, not a teleport); `tick(dt)` advances it.
- `useInstrumentMode.js` — `useInstrumentMode(driver)` → `{ mode:'journey'|'instrument', requestSkip }` with a **one-way permanent latch** at `travel ≥ 0.999`. The visualizer is the page's terminal state; both natural completion and skip converge on the same latch. On flip: enable reactivity + controls, move focus to the instrument region, announce via `aria-live`.

`travel`'s source is currently a stub (`viewpoint.scroll`); it will be repointed to the
arrow-nav rewrite's real travel.

## Beat-synced instrument camera
`immersive/src/mode/{instrumentCamera.js,cameraWaypoints.js}`: in instrument mode the
camera advances to the next "near-area" waypoint **every `ADVANCE_BARS` (8) bars on a bar
boundary** (read from `beatRef`), easing position + lookAt via frame-rate-independent
exponential damp. Each waypoint carries a pose + an `animation` param-bias applied once on
arrival. Manual camera input calls `notifyManualInput()` → suspends auto-advance for 4 s
and rebaselines the bar counters so no backlog fires on resume. Inert unless `active`
(journey's `CameraRig` owns the camera until the latch).

## File map (`immersive/src/`)
- `audio/{analyser,input,audioTexture,bpm}.js` + `audio/useAudio.jsx`
- `splat/{reactiveModifier,useReactiveSplat,semanticMask}.js` (+ `useSplatLayer.js` gained an `onMesh` callback)
- `control/{schema,store,targets,useControls}.js` + `control/sources/{keyboard,midi,osc}.js`
- `mode/{travelDriver,useInstrumentMode,instrumentCamera,cameraWaypoints}.js`
- Wiring: `App.jsx` (providers, start-gate → audio, skip control, audio/travel pumps, a11y latch, camera-rig swap) + `splat/SparkScene.jsx` (threads the live rainforest mesh into `useReactiveSplat`).

## Constraints
Mobile budget (reuse `perf/mobileBudget.js`): ~200–500K splats, DPR ≤ 1.5, pause on hidden,
reduced-motion tier, dynamic resolution; per-splat modifiers stay tiny. **All GLSL/GPU/visual
correctness QA is OFF-DEVICE** (the dev device has no GPU) — drive it in Antigravity (`agy`);
on-device verification is only `node --check` + the esbuild bundle smoke.
