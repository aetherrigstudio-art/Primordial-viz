# Wedding-Pagoda Landing Page — Act 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Act 1 of the wedding-planner landing page — a scroll-through, audio-reactive **raw-WebGL2 geometry** experience: a candlelit ivory-draped pagoda hallway you travel down, where drapes part on click, the fabric breathes to the music, the planner's words drift through, and the space morphs from drapery toward ivy/flowers (Act 2 is a later, separate plan).

**Architecture:** A standalone static page (`clients/wedding-pagoda/`) with its **own hand-built raw-WebGL2 geometry renderer** — a perspective camera tracking scroll down a -Z hallway, **instanced** pagoda bays (columns/arches), **tessellated draped-plane meshes** displaced by a vertex sway shader, lit warm/candlelit. It **reuses** primordial's audio engine (`src/audio/Analyser` + `BeatTempo`, unchanged) and its loop/mobile-budget *patterns* (dynamic resolution, pause-on-hidden, dt guards). Words are **real DOM text** positioned over the canvas by projecting world-space anchors to screen each frame (the SEO/a11y-safe proxy pattern). No rendering library.

**Tech Stack:** Raw WebGL2 + Web Audio `AnalyserNode` (reused), ES modules, GLSL-in-`.js` `/* glsl */` strings, Playwright (headless verify, existing devDep). Optional later: Lenis (MIT) for smooth scroll — Phase B starts hand-rolled.

## Global Constraints

Every task's requirements implicitly include these (copy verbatim into each subagent brief's constraints block):

- **Raw WebGL2, no rendering library.** No three.js / ogl / regl. Hand-built geometry + shaders only.
- **Reuse, don't fork, the audio engine.** Import `src/audio/analyser.js` (`Analyser`) and `src/audio/bpm.js` (`BeatTempo`) **unchanged**; do not modify `src/audio/*` or `src/gl/*` (those belong to the primordial instrument).
- **Write-our-own shaders / commercial licensing.** Author every shader + asset from a blank file. Reuse only MIT / CC0 / CC-BY with attribution; never copy CC-BY-NC-SA / Shadertoy code or scraped assets. Study references via the gather method (`docs/superpowers/specs/2026-06-20-reference-gather-method-design.md`), recipe-only.
- **Mobile performance budget:** cap `devicePixelRatio ≤ 1.5`; render the scene to a **0.5–0.75 render-scale FBO and upscale**; **dynamic resolution** (drop scale as frame-time climbs); **instance** repeated geometry (one draw call per bay-type, not per bay); keep draped-plane tessellation modest with distance LOD; **pause on `visibilitychange`**; honor `prefers-reduced-motion`.
- **Real DOM text.** Headlines, the drifting words, and the CTA are real server-served DOM over the canvas (findability + accessibility). The canvas is an enhancement layer; the page must still convey who the planner is and how to reach them with JS off.
- **Audio starts on a user gesture.** `AudioContext.resume()` only from a trusted tap/scroll; silent-synth fallback drives gentle motion before that. Secure context (HTTPS/localhost) required.
- **Durable state = git only** (ephemeral container). **Deliverables verified headless** (a `render-check`-style WebGL2/console/a11y check) **and visually** (a `clip` + `visual-qa`/`perf-budget`/`audio-dsp` agent review) — the visual tasks' "test cycle" is the clip-and-review loop, the pure-logic tasks carry real Node unit tests.
- **Scope:** Act 1 only. Act 2 (the interactive flower garden) is a stub entered at scroll-end here, fully built in a later plan.

## File Structure

| File | Responsibility |
| --- | --- |
| `clients/wedding-pagoda/index.html` | Standalone entry: real DOM (headline/words/CTA, `<noscript>`), `<canvas>`, module script. |
| `clients/wedding-pagoda/style.css` | Layout: fixed full-viewport canvas behind DOM word/CTA layer; reduced-motion rules. |
| `clients/wedding-pagoda/app.js` | Bootstrap + rAF loop + scroll state + orchestration; owns the dynamic-res controller + beacon. |
| `clients/wedding-pagoda/gl/context.js` | WebGL2 init, scaled FBO + upscale blit, resize (`ResizeObserver`), context-loss, `window.__weddingviz` beacon. |
| `clients/wedding-pagoda/gl/mat4.js` | Minimal own matrix math (perspective, lookAt, multiply, identity). |
| `clients/wedding-pagoda/gl/camera.js` | Scroll→camera transform down the hallway; `viewProj(scroll, aspect)`. |
| `clients/wedding-pagoda/gl/hallway.js` | Instanced pagoda-bay geometry (columns/arches) + draw. |
| `clients/wedding-pagoda/gl/drapes.js` | Tessellated draped-plane meshes + instances + draw; sway+morph uniforms. |
| `clients/wedding-pagoda/gl/scroll.js` | Pure scroll model: wheel/touch → eased target → progress 0..1. |
| `clients/wedding-pagoda/gl/morph.js` | Pure `morphState(progress)` → drape density/opacity + ivy amount. |
| `clients/wedding-pagoda/gl/project.js` | Pure world→screen projection for the word overlay. |
| `clients/wedding-pagoda/shaders/*.js` | GLSL-in-`.js` `/* glsl */` exports (hallway, drape, blit). |
| `clients/wedding-pagoda/audio.js` | Music-file → `Analyser`/`BeatTempo` wiring; gesture start; silent-synth fallback. |
| `clients/wedding-pagoda/words.js` | DOM word/CTA overlay positioned via `gl/project.js`. |
| `clients/wedding-pagoda/interact.js` | Click → pick nearest drape → part-animation. |
| `test/wedding-pagoda.test.mjs` | Node unit tests for `mat4`, `scroll`, `morph`, `project` (pure modules). |
| `test/wedding-render-check.mjs` | Headless Playwright render-check for the page (WebGL2 ok, frames advance, no console errors, a11y DOM). |
| `tools/workshop/clip.mjs` | Extend with `--url <path>` so the page can be recorded to a webm for phone review. |

---

## Phase A — clip-able hallway (vertical slice)

### Task 1: Page scaffold + GL context + loop + headless render-check

**Files:**
- Create: `clients/wedding-pagoda/index.html`, `clients/wedding-pagoda/style.css`, `clients/wedding-pagoda/app.js`, `clients/wedding-pagoda/gl/context.js`
- Create: `test/wedding-render-check.mjs`

**Interfaces:**
- Produces: `createContext(canvas) → { gl, beginFrame(scale)→{fbW,fbH}, blitToScreen(), resize(), contextLost:boolean, dispose() }` (FBO at `scale` of canvas pixels, then upscale-blit to the default framebuffer); `window.__weddingviz = { frames, glOk, error, pause }` beacon.
- Consumes: nothing.

- [ ] **Step 1** — `index.html`: real DOM first — a `<header>` with the planner's working name + a one-line headline, a `<main>` with placeholder copy + a CTA `<a>`, a `<noscript>` fallback paragraph, then `<canvas id="scene">`, then `<script type="module" src="./app.js">`. (Copy is placeholder; real voice is Task 8.)
- [ ] **Step 2** — `style.css`: `#scene { position: fixed; inset: 0; width: 100%; height: 100%; z-index: 0 }`; DOM layer `z-index: 1`, pointer-events only on the CTA for now; `@media (prefers-reduced-motion: reduce)` hook (used later).
- [ ] **Step 3** — `gl/context.js`: get `canvas.getContext('webgl2', { antialias: true, alpha: false })`; if null set `__weddingviz.glOk=false` and show the DOM fallback. Create a color FBO (RGBA8) sized to `floor(cssW*dpr*scale) × floor(cssH*dpr*scale)`, `dpr=min(devicePixelRatio,1.5)`. `beginFrame(scale)` (re)sizes+binds the FBO and returns its dims; `blitToScreen()` binds the default FBO and draws the FBO texture fullscreen via a tiny blit shader (`shaders/blit.js`, Task created inline here). Add `webglcontextlost`/`restored` handlers (recreate resources; set `contextLost`). `ResizeObserver` on the canvas drives `resize()`.
- [ ] **Step 4** — `app.js`: rAF loop with dt guard (`dt = clamp((now-last)/1000, 0, 0.1)`, skip NaN/neg), `visibilitychange` → pause, `__weddingviz.pause` hard-stop (for headless screenshots), `prefers-reduced-motion` → `motionScale=0.15`. For this task the loop just clears the FBO to a warm color, blits, and increments `__weddingviz.frames`.
- [ ] **Step 5** — `test/wedding-render-check.mjs`: mirror `test/render-check.mjs` — launch Playwright Chromium, serve the repo, open `/clients/wedding-pagoda/index.html`, wait for `__weddingviz.glOk===true && frames>5`, assert no console errors, assert the headline + CTA text exist in the DOM, pause via `__weddingviz.pause`, screenshot to `test/artifacts/wedding.png` (gitignored).
- [ ] **Step 6** — Run: `node test/wedding-render-check.mjs` → Expected: PASS (glOk, frames advance, DOM text present, no console errors).
- [ ] **Step 7** — Commit: `feat(wedding): page scaffold + raw-WebGL2 context, loop, headless render-check`.

**Verification:** `node test/wedding-render-check.mjs` green.

---

### Task 2: Minimal matrix math (`mat4`) + unit tests

**Files:** Create `clients/wedding-pagoda/gl/mat4.js`, add cases to `test/wedding-pagoda.test.mjs`.

**Interfaces:** Produces `identity()`, `perspective(fovyRad, aspect, near, far)`, `lookAt(eye, center, up)`, `multiply(a, b)`, `translate(m, v)` — all operating on length-16 `Float32Array` column-major; pure, no GL.

- [ ] **Step 1** — Write failing tests in `test/wedding-pagoda.test.mjs`: `identity()` is the 16-element identity; `multiply(identity, M)===M`; `perspective(Math.PI/2, 1, 1, 100)` has `m[0]≈1`, `m[5]≈1`, `m[11]===-1`; `lookAt([0,0,5],[0,0,0],[0,1,0])` maps the origin to z≈-5 in view space (multiply a point).
- [ ] **Step 2** — Run: `node --test test/wedding-pagoda.test.mjs` → FAIL (module missing).
- [ ] **Step 3** — Implement `mat4.js` (standard column-major formulas; ~90 lines; authored from the math, not copied from a library).
- [ ] **Step 4** — Run: `node --test test/wedding-pagoda.test.mjs` → PASS.
- [ ] **Step 5** — Commit: `feat(wedding): own mat4 math lib + tests`.

---

### Task 3: Scroll model + camera

**Files:** Create `clients/wedding-pagoda/gl/scroll.js`, `clients/wedding-pagoda/gl/camera.js`; tests in `test/wedding-pagoda.test.mjs`; wire input in `app.js`.

**Interfaces:**
- Produces `createScroll({ length }) → { onWheel(dy), onTouch(dy), update(dt)→progress, progress }` — accumulates input to a target, eases current→target (`cur += (target-cur)*min(1, dt*k)`), clamps `progress∈[0,1]`.
- Produces `cameraViewProj(progress, aspect) → Float32Array(16)` — eye travels from `z=Z0` to `z=Z1` along the hallway centerline as progress 0→1; `lookAt` down -Z; uses `mat4`.

- [ ] **Step 1** — Failing tests: fresh scroll `progress===0`; after `onWheel(+big)` then several `update(0.1)`, `progress` rises toward 1 and **clamps at 1**; never exceeds 1 or drops below 0; `cameraViewProj(0,1)` and `cameraViewProj(1,1)` differ (camera moved).
- [ ] **Step 2** — Run: `node --test test/wedding-pagoda.test.mjs` → FAIL.
- [ ] **Step 3** — Implement `scroll.js` (pure easing/clamp) and `camera.js` (lerp eye z, `lookAt`, `multiply(perspective, view)`).
- [ ] **Step 4** — Run tests → PASS.
- [ ] **Step 5** — Wire `app.js`: `wheel` + `touchmove` listeners → `scroll.onWheel/onTouch`; each frame `progress = scroll.update(dt)`; compute `cameraViewProj(progress, aspect)` (unused by draw yet — log to beacon).
- [ ] **Step 6** — Commit: `feat(wedding): eased scroll model + hallway camera + tests`.

---

### Task 4: Instanced pagoda-bay geometry

**Files:** Create `clients/wedding-pagoda/gl/hallway.js`, `clients/wedding-pagoda/shaders/hallway.js`; render it from `app.js`.

**Interfaces:** Produces `createHallway(gl) → { draw(viewProj, time, audio, motionScale), dispose() }`. Geometry: a small set of base meshes (column, arch/lintel, floor strip) built once into VBOs; the receding bays are drawn via **instancing** (`gl.drawArraysInstanced` / `drawElementsInstanced`) with a per-instance `z` offset, `INSTANCES` bays down -Z. One draw call per base mesh.

- [ ] **Step 1** — `shaders/hallway.js`: export `HALLWAY_VERT` + `HALLWAY_FRAG` (`#version 300 es` at byte 0). Vertex: `gl_Position = uViewProj * (aPos + vec3(0,0, aInstanceZ))`; pass world pos + normal. Fragment: warm ivory/stone material, simple lambert + a candlelit ambient (warm gold), gentle distance fog toward the vanishing point. (First-pass, authored; refined in the visual loop.)
- [ ] **Step 2** — `hallway.js`: build column/arch/floor vertex data (own helper, e.g. a box/extrusion generator), upload VBOs + an instance-Z buffer (`vertexAttribDivisor(…,1)`), compile the program (reuse a small `compile(gl, vert, frag)` helper — create in `gl/context.js` and export it), expose `draw(viewProj, time, audio, motionScale)` setting `uViewProj`, `uTime`, warm-light uniforms.
- [ ] **Step 3** — `app.js`: construct the hallway, and each frame `hallway.draw(cameraViewProj, time, audio, motionScale)` into the scaled FBO, then `blitToScreen()`.
- [ ] **Step 4 (verify — headless)** — Run `node test/wedding-render-check.mjs` → PASS (still glOk, frames advance, no console/shader-compile errors). Extend the check to assert `__weddingviz.error===null`.
- [ ] **Step 5 (verify — visual)** — Run `npm run clip -- --url /clients/wedding-pagoda/index.html` (Task 11 adds `--url`; until then use `tools/mcp` `render_check` target=local or a manual screenshot) and **review the still/clip**: a receding colonnade with depth + vanishing point. Dispatch `visual-qa` for look + mobile-budget (instancing, draw-call count) review; address Critical/Important findings.
- [ ] **Step 6** — Commit: `feat(wedding): instanced pagoda-bay hallway geometry`.

**Verification:** headless render-check green; `visual-qa` review clean; one draw call per base mesh (instanced).

---

### Task 5: Draped-plane meshes + sway shader

**Files:** Create `clients/wedding-pagoda/gl/drapes.js`, `clients/wedding-pagoda/shaders/drape.js`; render from `app.js`.

**Interfaces:** Produces `createDrapes(gl) → { draw(viewProj, time, audio, morph, motionScale), dispose() }`. Geometry: a **tessellated plane** (e.g. 24×32 grid) instanced as vertical panels hung in the bays + overhead swags (per-instance transform: position, width, hang-length, phase). Sway is a **vertex displacement** in the shader (no physics).

- [ ] **Step 1** — `shaders/drape.js`: `DRAPE_VERT` displaces each vertex by layered sines/noise along the cloth's hang + width, amplitude scaled by `uSway` (audio-driven) and damped near the top anchor; passes a fold normal for lighting. `DRAPE_FRAG`: ivory translucent fabric — soft diffuse + rim/backlight from candle gold, alpha from `uOpacity` (× per-instance), subtle sheen along folds. Uniform contract (exact names): `uViewProj, uTime, uSway, uOpacity, uMorph, uMotionScale`. (Authored first-pass; refined visually.)
- [ ] **Step 2** — `drapes.js`: build the tessellated-plane mesh + instance buffer (panels along both sides + overhead per bay), compile the program, `draw(...)` sets uniforms (`uSway` from `audio.level/flux` smoothed; `uOpacity`/`uMorph` from Task 7 — pass `morph.drapeOpacity`/`morph.drapeDensity`, default 1 for now), enable alpha blending + correct depth handling for translucent layers (back-to-front or depth-write off).
- [ ] **Step 3** — `app.js`: draw drapes after the hallway each frame.
- [ ] **Step 4 (verify — headless)** — `node test/wedding-render-check.mjs` → PASS (no shader errors; frames advance).
- [ ] **Step 5 (verify — visual)** — clip + `visual-qa` review: ivory drapes hang and **breathe**; reads as the reference mood (`clients/wedding-pagoda/VISION.md`). Address findings.
- [ ] **Step 6** — Commit: `feat(wedding): draped-plane meshes + vertex sway shader`.

**Verification:** headless green; `visual-qa` confirms drape look + budget; blending correct (no z-fighting halos).

---

## Phase B — life, words, interaction, polish

### Task 6: Audio wiring (music file → reused engine)

**Files:** Create `clients/wedding-pagoda/audio.js`; wire into `app.js`.

**Interfaces:** Produces `createAudio({ src }) → { startOnGesture(el), update(dt)→features, features }` where `features = { bass, mid, treble, level, flux, beat }`. Reuses `Analyser` (`src/audio/analyser.js`) + `BeatTempo` (`src/audio/bpm.js`) unchanged; before gesture returns the **silent-synth fallback** (gentle sines, same shape as `src/main.js`).

- [ ] **Step 1** — `audio.js`: lazily create `AudioContext`; `startOnGesture(el)` adds a one-time `pointerdown` → `await ctx.resume()`, `fetch(src)→arrayBuffer→ctx.decodeAudioData`, `BufferSource(buffer, loop:true)`, `analyser.connect(source)`, `source.connect(ctx.destination)` (so it's audible), `source.start(0)`. `update(dt)`: if started, `analyser.update(); beat.update(analyser.rawBassEnergy(), dt)` → real features; else synth fallback.
- [ ] **Step 2** — `app.js`: `audio.startOnGesture(document.body)`; each frame `const audio = audioMod.update(dt)`; pass `audio` into `hallway.draw`/`drapes.draw` (drive `uSway` gently — "breathing," scaled low). Provide a placeholder `src` (a CC0/owned loop committed under `clients/wedding-pagoda/assets/` or referenced; if none yet, the fallback synth drives everything and `src` is wired but optional).
- [ ] **Step 3 (verify — headless)** — `node test/wedding-render-check.mjs` PASS (audio module must not throw with no gesture; fallback drives motion).
- [ ] **Step 4 (verify — review)** — Dispatch `audio-dsp` to confirm the music-file→Analyser wiring + gesture-resume are correct; the sway reads as gentle breathing, not a pulse.
- [ ] **Step 5** — Commit: `feat(wedding): music-file audio reactivity (reuses Analyser/BeatTempo)`.

---

### Task 7: The scroll-driven morph

**Files:** Create `clients/wedding-pagoda/gl/morph.js`; tests in `test/wedding-pagoda.test.mjs`; consume in `drapes.js`/`app.js` + an ivy stub.

**Interfaces:** Produces `morphState(progress) → { drapeDensity, drapeOpacity, ivyAmount }` — pure; as `progress` 0→1: `drapeDensity` 1→0, `drapeOpacity` 1→~0 (drapes thin then turn sheer), `ivyAmount` 0→1 (greenery grows). Smooth (smoothstep), monotonic.

- [ ] **Step 1** — Failing tests: `morphState(0)` = `{drapeDensity:1, drapeOpacity:1, ivyAmount:0}`; `morphState(1)` = `{drapeDensity:0, drapeOpacity:≤0.1, ivyAmount:1}`; monotonic across samples; values stay in `[0,1]`.
- [ ] **Step 2** — Run tests → FAIL.
- [ ] **Step 3** — Implement `morph.js` (smoothstep curves). Wire `app.js`: compute `morph = morphState(progress)`; pass `morph.drapeOpacity` → drape `uOpacity` and cull instances beyond `drapeDensity`; pass `ivyAmount` to an **ivy stub** (Task: a simple instanced billboard/leaf placeholder fading in — full foliage is Act 2).
- [ ] **Step 4** — Run unit tests → PASS; headless render-check → PASS.
- [ ] **Step 5 (verify — visual)** — clip across the scroll range + `visual-qa`: drapes visibly thin → sheer while greenery rises. 
- [ ] **Step 6** — Commit: `feat(wedding): scroll-driven drape→ivy morph + tests`.

---

### Task 8: Drifting words (DOM over canvas)

**Files:** Create `clients/wedding-pagoda/gl/project.js`, `clients/wedding-pagoda/words.js`; real copy into `index.html`; tests in `test/wedding-pagoda.test.mjs`.

**Interfaces:** Produces `worldToScreen(viewProj, worldPos, vpW, vpH) → { x, y, visible }` (pure; clip→NDC→pixels; `visible=false` if behind camera/clipped). Produces `createWords(container, anchors) → { update(viewProj, vpW, vpH) }` positioning real `<span>` words at projected anchors along the hallway.

- [ ] **Step 1** — Failing tests for `worldToScreen`: a point at screen center projects to `≈(vpW/2, vpH/2)`; a point behind the camera returns `visible:false`; a point right-of-center has `x>vpW/2`.
- [ ] **Step 2** — Run → FAIL; **Step 3** implement `project.js` → tests PASS.
- [ ] **Step 4** — `index.html`: add the real drifting-word phrases + the planner's invitation/CTA as DOM (placeholder voice now; final voice is an open thread). `words.js`: each frame position the spans via `worldToScreen` at anchors spaced down the hallway; fade by depth; `prefers-reduced-motion` → static positions. Keep them real, selectable, readable (contrast AA over the canvas).
- [ ] **Step 5 (verify)** — render-check asserts the word spans + CTA exist in the DOM and are non-empty; `accessibility` skill pass (contrast, focus order, the CTA is a real link). 
- [ ] **Step 6** — Commit: `feat(wedding): drifting DOM words projected onto the hallway + tests`.

---

### Task 9: Click-to-part-drape interaction

**Files:** Create `clients/wedding-pagoda/interact.js`; wire into `app.js`; reuse `gl/project.js`.

**Interfaces:** Produces `createInteract(canvas, drapes) → { onClick(x,y), update(dt) }` — on click, pick the nearest drape panel in front of the camera (project panel anchors to screen, choose the closest within a radius) and trigger a **part animation** (a per-instance `partT` 0→1 that sweeps the panel aside + raises opacity falloff in `drape.js`).

- [ ] **Step 1** — Add a `partT` per-instance attribute + `uPart` handling to `drapes.js`/`shaders/drape.js` (sway shader offsets the panel sideways by `partT`, eased).
- [ ] **Step 2** — `interact.js`: `onClick` → nearest-panel pick via screen-space distance (reuse `worldToScreen`); animate that instance's `partT` over ~0.6s (eased) in `update(dt)`.
- [ ] **Step 3 (verify)** — headless render-check still green; a scripted click in the render-check moves a panel (assert via a beacon counter `__weddingviz.parted++`).
- [ ] **Step 4 (verify — visual)** — clip showing a click parting a drape; `visual-qa` review.
- [ ] **Step 5** — Commit: `feat(wedding): click to part a drape`.

---

### Task 10: Mobile budget + dynamic resolution + perf pass

**Files:** Modify `clients/wedding-pagoda/app.js` (+ `gl/context.js`).

**Interfaces:** Produces a `dyn` controller (mirror `src/main.js`): tracks EMA frame-time, drops `renderScale` (0.75→0.5 floor) when `msAvg>22`, recovers under `<13`, with a cooldown; distance-LOD on drape tessellation/instance count.

- [ ] **Step 1** — Implement the `dyn` controller; `beginFrame(dyn.renderScale)` each frame; cap DPR ≤1.5; cull bays/drapes beyond a distance; ensure `visibilitychange` fully pauses (no GL work).
- [ ] **Step 2 (verify)** — render-check asserts frames advance and `renderScale` stays within `[0.5,0.75]`; dispatch `perf-budget` skill + `visual-qa` for a mobile-budget verdict (target SMOOTH/OK on a mid phone profile).
- [ ] **Step 3** — Commit: `perf(wedding): dynamic resolution + mobile budget pass`.

---

### Task 11: Clip/preview path + CI wiring

**Files:** Modify `tools/workshop/clip.mjs` (add `--url`); modify `.github/workflows/verify.yml`; `.gitignore` (artifacts).

- [ ] **Step 1** — `clip.mjs`: add a `--url <path>` flag so it serves the repo and records an arbitrary page (default stays the sandbox). Verify: `npm run clip -- --url /clients/wedding-pagoda/index.html` writes a webm under `workshop/artifacts/` (gitignored).
- [ ] **Step 2** — `verify.yml`: add `node test/wedding-render-check.mjs` and `node --test test/wedding-pagoda.test.mjs` to CI (after the Playwright install step).
- [ ] **Step 3 (verify)** — `npm run health` green; both new test commands green locally; `node --check` on all new JS.
- [ ] **Step 4** — Commit: `chore(wedding): clip --url + CI render-check & unit tests`.

---

## Phase C — Act 2 stub (full build deferred to a separate plan)

### Task 12: Garden-entry stub at scroll end

**Files:** `clients/wedding-pagoda/app.js` + a placeholder ivy/flower fade.

- [ ] **Step 1** — At `progress≈1`, fade the hallway out and reveal a simple ivy/flower placeholder scene + the planner's CTA prominently (real DOM). Mark clearly as a stub in a comment; the interactive flower experience (depth-parallax / point-cloud, per the deep-research) is a later plan.
- [ ] **Step 2** — render-check reaches `progress=1` (scripted scroll) without errors; commit: `feat(wedding): act-2 garden-entry stub`.

---

## Global Verification (whole-branch, before merge)

- `npm run health` green; `node --test test/wedding-pagoda.test.mjs` green; `node test/wedding-render-check.mjs` green; `node --check` on all new JS.
- Whole-branch review on the most capable model (per subagent-driven-development): no Critical/Important findings; `visual-qa` (look + mobile budget), `audio-dsp` (audio wiring), `accessibility` (DOM words/CTA) all clean.
- No rendering library added; `src/audio/*` + `src/gl/*` unmodified; no copied third-party assets/shaders.
- A clip delivered to the operator (`SendUserFile`) that reads as the reference within ~3 seconds.

## Open decisions folded in (from VISION + deep-research)

- **Renderer:** raw-WebGL2 geometry (operator decision, 2026-06-20) — no library.
- **Act 2 technique:** deferred (depth-parallax → point-cloud → gated splats, no training). Separate plan.
- **Words' voice, music track, brand/contact copy, own-repo split:** open threads in `clients/wedding-pagoda/VISION.md`; placeholders here, swap when decided (no structural change).

## Self-review notes

Spec coverage: each VISION mechanic maps to a task — hallway (T4), drapes+breathing (T5/T6), scroll travel (T3), morph (T7), drifting words (T8), click-to-part (T9), garden hand-off (T12), mobile budget (T10), audio reuse (T6). Pure modules (`mat4`, `scroll`, `morph`, `project`) carry real unit tests; GL/visual tasks carry headless render-check + clip + agent review (the honest test cycle for generative visuals). Names are consistent across tasks (`createContext`, `cameraViewProj`, `morphState`, `worldToScreen`, `features`). No "TODO/later" in code steps; visual iteration is an explicit review loop, not a placeholder.
