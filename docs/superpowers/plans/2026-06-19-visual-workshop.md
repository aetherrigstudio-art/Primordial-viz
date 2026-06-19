# Visual Workshop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a throwaway WebGL2 sandbox, separate from the shipped app, that renders experimental "sketch" shaders to short audio-driven `.webm` clips (and stills) for phone review, with a clean path to graduate a winner into the real instrument.

**Architecture:** A sketch is a self-contained GLSL fragment module + a params JSON under `workshop/sketches/<name>/`. A disposable `workshop/sandbox.html` + `sketch-runner.mjs` mounts one sketch using the *real* `src/gl/renderer.js` plumbing (after a tiny refactor to accept custom shader sources), driven by a deterministic synthetic "fake song" so the visual moves and reacts without a mic. A node recorder `tools/workshop/clip.mjs` loads the sandbox in headless Chromium and records it with Playwright's built-in video capture (no ffmpeg). A `/workshop` skill drives the discuss -> research -> author -> clip -> react -> graduate loop.

**Tech Stack:** Raw WebGL2 + ES modules (no framework), Playwright (existing devDep) for headless render + video, `python3 -m http.server` for serving, node:assert for tests.

## Global Constraints

Copied verbatim from the spec / repo rules. Every task implicitly includes these.

- **Workshop is dev-only tooling, never deployed.** Deploy stages only `index.html src` (see `.github/workflows/deploy.yml`); `workshop/` + `tools/workshop/` are out of the deployed surface. Do not add anything to the deployed app.
- **Zero runtime deps on the web path.** Playwright is a devDep only. The sandbox uses raw WebGL2 / ES modules.
- **WRITE-OUR-OWN shaders (commercial licensing).** Author every shader from a blank file; learn techniques, never copy CC BY-NC-SA Shadertoy/GLSL code. Reuse only MIT/CC0/CC-BY with attribution. (`.claude/rules/shaders.md`)
- **GLSL ES 3.00.** `#version 300 es` must be **byte one** of each exported fragment-shader string (no leading whitespace/comment). `COMMON_GLSL` is concatenated *after* the header.
- **Mobile budget** (`.claude/rules/shaders.md`): raymarch steps `<= 64`, heavy pass at `0.5`-`0.75` render-scale. The sandbox runs at `steps = 64`, `renderScale = 0.7`. The budget is *enforced* (with `visual-qa`/`audio-dsp` review) only at graduation.
- **No em/en dashes in committed text** (use `-`); the site audit + AI-tell rule forbid them. Keep all committed files ASCII punctuation.
- **Sketches are committed** to git (durable across cloud wipes). `workshop/artifacts/` is gitignored (binary, regenerable).
- **Commit message trailer** (each commit):
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg
  ```
- **Branch:** `claude/review-claude-md-di5jvm`.

---

## File Structure

**Create:**
- `workshop/synth-audio.mjs` - deterministic fake-song generator (browser + node safe).
- `workshop/sandbox.html` - disposable mount page (`?sketch=<name>`).
- `workshop/sketch-runner.mjs` - boots the sandbox: loads a sketch, runs the loop with synthetic audio, sets the `window.__primordial` beacon.
- `workshop/sketches/_demo/_demo.frag.js` - reference sketch shader.
- `workshop/sketches/_demo/_demo.json` - reference sketch params.
- `tools/workshop/clip.mjs` - node recorder (`npm run clip -- <name>`).
- `.claude/skills/visual-workshop/SKILL.md` - the `/workshop` skill (area `design`).

**Modify:**
- `src/gl/renderer.js` - `Renderer` constructor accepts optional `{ slimeFrag, postFrag }`, defaulting to the shipped shaders (no behavior change).
- `test/smoke.mjs` - add synthetic-audio assertions + per-sketch validation.
- `package.json` - add `"clip"` script.
- `.gitignore` - add `workshop/artifacts/`.
- `progress.md` - session handoff entry.

---

## Task 1: Parameterize the Renderer's shader sources

Lets the sandbox mount an arbitrary sketch shader while the app keeps using the slime shader unchanged.

**Files:**
- Modify: `src/gl/renderer.js` (constructor + `_createResources`)
- Test: `test/render-check.mjs` (existing; proves the app still renders)

**Interfaces:**
- Produces: `new Renderer(canvas, opts?)` where `opts = { slimeFrag?: string, postFrag?: string }`. Defaults: `slimeFrag = SLIME_FRAG`, `postFrag = POST_FRAG`. Existing `new Renderer(canvas)` calls are unaffected.

- [ ] **Step 1: Run the baseline render check (must pass before changing anything)**

Run: `node test/render-check.mjs`
Expected: `all render checks passed`

- [ ] **Step 2: Accept optional shader sources in the constructor**

In `src/gl/renderer.js`, change the constructor signature and store the sources before `_createResources()`. Replace:

```js
  constructor(canvas) {
    const gl = canvas.getContext('webgl2', {
```

with:

```js
  constructor(canvas, opts = {}) {
    const gl = canvas.getContext('webgl2', {
```

Then, immediately after `this.gl = gl;`, add:

```js
    // Shader sources default to the shipped slime/post pair; the workshop
    // sandbox passes a sketch's fragment source here to preview it.
    this.slimeFrag = opts.slimeFrag || SLIME_FRAG;
    this.postFrag = opts.postFrag || POST_FRAG;
```

- [ ] **Step 3: Use the stored sources when linking programs**

In `_createResources()`, replace:

```js
    this.slimeProg = linkProgram(gl, FULLSCREEN_VERT, SLIME_FRAG);
    this.postProg = linkProgram(gl, FULLSCREEN_VERT, POST_FRAG);
```

with:

```js
    this.slimeProg = linkProgram(gl, FULLSCREEN_VERT, this.slimeFrag);
    this.postProg = linkProgram(gl, FULLSCREEN_VERT, this.postFrag);
```

(Keep the `import { SLIME_FRAG }` / `import { POST_FRAG }` lines - they are now the defaults.)

- [ ] **Step 4: Verify the app is unchanged**

Run: `node --check src/gl/renderer.js && node test/render-check.mjs`
Expected: `all render checks passed` (the app still uses the defaults, so behavior is identical).

- [ ] **Step 5: Commit**

```bash
git add src/gl/renderer.js
git commit -m "refactor(gl): Renderer accepts optional shader sources (defaults unchanged)

$(printf 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg')"
```

---

## Task 2: Synthetic "fake song" generator

A deterministic, stateless audio source so clips move + react reproducibly without a mic.

**Files:**
- Create: `workshop/synth-audio.mjs`
- Modify: `test/smoke.mjs` (add assertions)
- Test: `test/smoke.mjs`

**Interfaces:**
- Produces: `synthAudio(t, opts?) -> { bass, mid, treble, level, flux, beat, fft, wave }` where `t` is seconds (number), `opts = { bpm?: number }` (default 120), each scalar is `0..1`, `fft` and `wave` are `Uint8Array(512)` with values `0..255`. Pure/stateless: same `t` -> same output.

- [ ] **Step 1: Write the failing assertions in smoke.mjs**

In `test/smoke.mjs`, after the `coerceParams` test block (around line 106), add:

```js
// ---------------------------------------------------------------------------
// Workshop synthetic audio
// ---------------------------------------------------------------------------
const { synthAudio } = await import('../workshop/synth-audio.mjs');

test('synthAudio returns full feature set in range, deterministic', () => {
  const a = synthAudio(1.23, { bpm: 120 });
  for (const k of ['bass', 'mid', 'treble', 'level', 'flux', 'beat']) {
    assert.ok(a[k] >= 0 && a[k] <= 1, `${k} in 0..1`);
  }
  assert.ok(a.fft instanceof Uint8Array && a.fft.length === 512, 'fft is Uint8Array(512)');
  assert.ok(a.wave instanceof Uint8Array && a.wave.length === 512, 'wave is Uint8Array(512)');
  const b = synthAudio(1.23, { bpm: 120 });
  assert.deepEqual(a.fft, b.fft, 'deterministic fft');
  assert.equal(a.bass, b.bass, 'deterministic bass');
});

test('synthAudio beat pulse peaks on the downbeat', () => {
  const onBeat = synthAudio(0.0, { bpm: 120 }).beat;     // phase 0
  const offBeat = synthAudio(0.25, { bpm: 120 }).beat;   // mid-beat (0.5s period)
  assert.ok(onBeat > offBeat, `beat on-downbeat (${onBeat}) > mid-beat (${offBeat})`);
});
```

- [ ] **Step 2: Run smoke to verify it fails**

Run: `node test/smoke.mjs`
Expected: FAIL - cannot find module `../workshop/synth-audio.mjs`.

- [ ] **Step 3: Implement the generator**

Create `workshop/synth-audio.mjs`:

```js
// Deterministic synthetic "fake song" for the Visual Workshop sandbox.
// Stateless: synthAudio(t, opts) -> { bass, mid, treble, level, flux, beat,
// fft, wave } so headless clips are reproducible. No mic, no assets. Safe to
// import in both the browser (sandbox) and node (tests). This is dev-only
// tooling; it never ships with the deployed app.

const TAU = Math.PI * 2;

function fract(x) { return x - Math.floor(x); }
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
// Cheap deterministic hash for per-bin spectral sparkle.
function hash(n) { return fract(Math.sin(n * 12.9898) * 43758.5453); }

export function synthAudio(t, { bpm = 120 } = {}) {
  const beatPeriod = 60 / bpm;            // seconds per beat
  const phase = fract(t / beatPeriod);    // 0..1 within the beat
  const kick = Math.exp(-phase * 9.0);    // sharp attack, fast decay
  const hatPhase = fract(t / beatPeriod + 0.5);
  const hat = Math.exp(-hatPhase * 16.0); // offbeat hat

  const bass = clamp01(0.18 + 0.72 * kick);
  const mid = clamp01(0.28 + 0.18 * Math.sin(t * 1.7) + 0.25 * hat);
  const treble = clamp01(0.20 + 0.15 * Math.sin(t * 3.1 + 1.0) + 0.5 * hat);
  const level = clamp01(0.25 + 0.5 * kick + 0.2 * hat);
  const flux = clamp01(0.85 * kick + 0.6 * hat); // onset energy
  const beat = kick;

  // 512-bin spectrum: bass weights low bins, mid the middle, treble the top,
  // plus a little per-bin sparkle so the audio texture is not flat.
  const fft = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    const f = i / 512;
    let band;
    if (f < 0.12) band = bass;
    else if (f < 0.5) band = mid * (1.0 - (f - 0.12) / 0.5);
    else band = treble * (1.0 - (f - 0.5) / 0.9);
    const sparkle = 0.15 * hash(i + Math.floor(t * 8));
    fft[i] = Math.round(clamp01(band + sparkle) * 255);
  }

  // 512-sample waveform from the band sines, centered at 128.
  const wave = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    const x = i / 512;
    const s =
      bass * Math.sin(TAU * x * 2 + t * 4) +
      mid * 0.6 * Math.sin(TAU * x * 8 + t * 7) +
      treble * 0.3 * Math.sin(TAU * x * 24 + t * 11);
    wave[i] = Math.round(clamp01(0.5 + 0.45 * s) * 255);
  }

  return { bass, mid, treble, level, flux, beat, fft, wave };
}
```

- [ ] **Step 4: Run smoke to verify it passes**

Run: `node --check workshop/synth-audio.mjs && node test/smoke.mjs`
Expected: all `ok`, `N passed, 0 failed`.

- [ ] **Step 5: Commit**

```bash
git add workshop/synth-audio.mjs test/smoke.mjs
git commit -m "feat(workshop): deterministic synthetic audio generator for the sandbox

$(printf 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg')"
```

---

## Task 3: Sandbox page, runner, and reference sketch

The renderable unit: a page that mounts a sketch and runs the loop with synthetic audio, plus a demo sketch to prove it, plus a smoke gate over all sketches.

**Files:**
- Create: `workshop/sandbox.html`
- Create: `workshop/sketch-runner.mjs`
- Create: `workshop/sketches/_demo/_demo.frag.js`
- Create: `workshop/sketches/_demo/_demo.json`
- Modify: `test/smoke.mjs` (per-sketch validation)
- Test: `test/smoke.mjs`

**Interfaces:**
- Consumes: `new Renderer(canvas, { slimeFrag, postFrag })` (Task 1); `synthAudio(t, { bpm })` (Task 2); `buildAudioTextureData(fft, wave, out)` and `POST_FRAG` (existing, from `src/gl/uniforms.js` / `src/shaders/post.frag.js`).
- Produces: a sketch module contract - `export const SKETCH_FRAG: string` (GLSL ES 3.00, `#version 300 es` byte one) in `<name>.frag.js`, and a `<name>.json` of shape `{ name: string, note?: string, bpm?: number, params: object }`. `params` values that are length-3 arrays upload as `vec3 u<Key>`, numbers as `float u<Key>` (key capitalized, e.g. `warpAmt` -> `uWarpAmt`).

- [ ] **Step 1: Write the failing per-sketch validation in smoke.mjs**

In `test/smoke.mjs`, update the fs import line:

```js
import { readFileSync } from 'node:fs';
```

to:

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
```

Then, just before the final `console.log(`\n${pass} passed...`)` line, add:

```js
// ---------------------------------------------------------------------------
// Workshop sketches - each must export a GLSL ES 3.00 frag + a valid json
// ---------------------------------------------------------------------------
const sketchRoot = join(root, 'workshop', 'sketches');
if (existsSync(sketchRoot)) {
  const names = readdirSync(sketchRoot, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);
  for (const name of names) {
    await atest(`workshop sketch ${name} is valid`, async () => {
      const mod = await import(join(sketchRoot, name, name + '.frag.js'));
      assert.ok(typeof mod.SKETCH_FRAG === 'string', 'exports SKETCH_FRAG string');
      assert.ok(mod.SKETCH_FRAG.startsWith('#version 300 es'),
        'frag begins with "#version 300 es" (byte one)');
      const j = JSON.parse(readFileSync(join(sketchRoot, name, name + '.json'), 'utf8'));
      assert.ok(j.name && typeof j.params === 'object', 'json has name + params object');
    });
  }
}
```

- [ ] **Step 2: Run smoke to verify it fails (or no-ops with no sketches)**

Run: `node test/smoke.mjs`
Expected: still passes (no `workshop/sketches/` dir yet, so the block is skipped). This confirms the guard; the real assertions activate once the demo sketch exists in Step 4.

- [ ] **Step 3: Write the sketch runner**

Create `workshop/sketch-runner.mjs`:

```js
// Boots the workshop sandbox: loads one sketch (?sketch=<name>) using the real
// renderer plumbing, drives it with synthetic audio, and exposes the
// window.__primordial beacon (glOk / frames / pause / error) the clip recorder
// waits on. Dev-only tooling; never deployed.

import { Renderer } from '../src/gl/renderer.js';
import { POST_FRAG } from '../src/shaders/post.frag.js';
import { buildAudioTextureData } from '../src/gl/uniforms.js';
import { synthAudio } from './synth-audio.mjs';

const SAFE = /^[a-z0-9_-]+$/i;
const qs = new URLSearchParams(location.search);
const name = qs.get('sketch') || '_demo';

const canvas = document.getElementById('glcanvas');
const health = { frames: 0, glOk: false, error: null, pause: false };
window.__primordial = health;

function fail(msg) {
  health.error = msg;
  document.body.insertAdjacentHTML(
    'beforeend',
    '<pre style="color:#f55;position:fixed;top:0;left:0;margin:0;padding:8px;' +
      'font:12px monospace;white-space:pre-wrap">' + msg + '</pre>',
  );
}

async function boot() {
  if (!SAFE.test(name)) return fail('bad sketch name: ' + name);

  let frag;
  try {
    ({ SKETCH_FRAG: frag } = await import(`./sketches/${name}/${name}.frag.js`));
  } catch (e) { return fail('cannot load sketch shader: ' + e.message); }
  if (typeof frag !== 'string') return fail('sketch must export SKETCH_FRAG string');

  let sketch = { params: {} };
  try { sketch = await (await fetch(`./sketches/${name}/${name}.json`)).json(); }
  catch { /* params optional */ }
  const P = sketch.params || {};
  const bpm = Number(qs.get('bpm')) || sketch.bpm || 120;

  let renderer;
  try {
    renderer = new Renderer(canvas, { slimeFrag: frag, postFrag: POST_FRAG });
  } catch (e) { return fail('shader compile error:\n' + e.message); }
  health.glOk = true;

  const scratch = new Uint8Array(1024);
  const MAX_DPR = 1.5;
  const renderScale = 0.7;
  const steps = 64;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Generic uniform setter: standard audio + time/res + every json param by
  // name. uName = 'u' + Capitalized(key). Setting an undeclared uniform is a
  // safe no-op (getUniformLocation returns null).
  function setUniforms(gl, U, a, resW, resH, t) {
    gl.uniform2f(U.loc('uResolution'), resW, resH);
    gl.uniform1f(U.loc('uTime'), t);
    gl.uniform1f(U.loc('uBass'), a.bass);
    gl.uniform1f(U.loc('uMid'), a.mid);
    gl.uniform1f(U.loc('uTreble'), a.treble);
    gl.uniform1f(U.loc('uLevel'), a.level);
    gl.uniform1f(U.loc('uFlux'), a.flux);
    gl.uniform1f(U.loc('uBeat'), a.beat);
    gl.uniform1i(U.loc('uSteps'), steps);
    for (const k in P) {
      const v = P[k];
      const uname = 'u' + k.charAt(0).toUpperCase() + k.slice(1);
      if (Array.isArray(v) && v.length === 3) gl.uniform3f(U.loc(uname), v[0], v[1], v[2]);
      else if (typeof v === 'number') gl.uniform1f(U.loc(uname), v);
    }
  }

  const start = performance.now();
  function frame() {
    if (health.pause) return;
    requestAnimationFrame(frame);
    if (renderer.contextLost) return;
    const t = (performance.now() - start) / 1000;
    const a = synthAudio(t, { bpm });
    buildAudioTextureData(a.fft, a.wave, scratch);
    renderer.uploadAudioTexture(scratch);
    const rw = Math.max(1, Math.floor(canvas.width * renderScale));
    const rh = Math.max(1, Math.floor(canvas.height * renderScale));
    try {
      renderer.resizeFbo(rw, rh);
      renderer.renderSlime((gl, U) => setUniforms(gl, U, a, rw, rh, t));
      renderer.renderPost((gl, U) => setUniforms(gl, U, a, canvas.width, canvas.height, t),
        canvas.width, canvas.height);
    } catch (e) { return fail('render error: ' + e.message); }
    health.frames++;
  }
  requestAnimationFrame(frame);
}

boot();
```

- [ ] **Step 4: Write the sandbox page**

Create `workshop/sandbox.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Primordial - Sketch Sandbox</title>
  <style>
    html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
    #glcanvas { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="glcanvas"></canvas>
  <script type="module" src="./sketch-runner.mjs"></script>
</body>
</html>
```

- [ ] **Step 5: Write the reference sketch shader**

Create `workshop/sketches/_demo/_demo.frag.js`:

```js
// Reference sketch: audio-reactive warped plasma with neon rings. Authored from
// a blank file (technique only, commercial-safe). Demonstrates the sketch
// shader contract - it is NOT the target art direction, just a canary.
import { COMMON_GLSL } from '../../../src/shaders/common.glsl.js';

export const SKETCH_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform sampler2D uAudioTex;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uLevel;
uniform float uFlux;
uniform float uBeat;
uniform vec3  uColA;
uniform vec3  uColB;
uniform float uWarpAmt;
uniform float uGlow;

${COMMON_GLSL}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;

  // Warp the plane with fbm; bass pumps the warp, the beat kicks it.
  float w = uWarpAmt * (0.5 + 1.2 * uBass + 0.8 * uBeat);
  vec3 p = vec3(uv * 2.0, uTime * 0.3);
  p = domainWarp(p, uTime, w, 2);
  float n = fbm(p * 1.5, 3);

  float bands = 0.5 + 0.5 * sin(n * 6.2831 + uTime + uMid * 6.0);
  vec3 col = mix(uColA, uColB, bands);

  // Neon rings riding flux + treble.
  float r = length(uv);
  float rings = 0.5 + 0.5 * sin(r * 18.0 - uTime * 3.0);
  col += uColB * rings * (0.15 + 0.6 * uTreble + 0.5 * uFlux);

  col *= uGlow * (0.7 + 0.6 * uLevel);
  col *= 1.0 - 0.4 * r;  // vignette

  fragColor = vec4(max(col, 0.0), 1.0);
}
`;
```

- [ ] **Step 6: Write the reference sketch params**

Create `workshop/sketches/_demo/_demo.json`:

```json
{
  "name": "Demo - warped plasma",
  "note": "Reference sketch proving the workshop loop. Not art direction.",
  "bpm": 124,
  "params": {
    "colA": [0.05, 0.5, 0.9],
    "colB": [0.9, 0.2, 0.7],
    "warpAmt": 0.6,
    "glow": 1.1,
    "grain": 0.1,
    "scanline": 0.12,
    "chroma": 0.005,
    "vignette": 0.6,
    "bloom": 1.0
  }
}
```

- [ ] **Step 7: Run smoke to verify the demo sketch validates**

Run: `node --check workshop/sketch-runner.mjs && node test/smoke.mjs`
Expected: includes `ok   workshop sketch _demo is valid`; `N passed, 0 failed`.

- [ ] **Step 8: Commit**

```bash
git add workshop/sandbox.html workshop/sketch-runner.mjs workshop/sketches/_demo test/smoke.mjs
git commit -m "feat(workshop): sandbox page + runner + reference sketch

$(printf 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg')"
```

---

## Task 4: Clip recorder

Records the sandbox to a `.webm` (and optional stills) for delivery to the phone. This is the integration test for Tasks 1-3.

**Files:**
- Create: `tools/workshop/clip.mjs`
- Modify: `package.json` (add `clip` script)
- Modify: `.gitignore` (ignore `workshop/artifacts/`)
- Test: `npm run clip -- _demo` (manual integration)

**Interfaces:**
- Consumes: `launchBrowser()` from `tools/mcp/lib/browser.mjs`; the sandbox at `workshop/sandbox.html?sketch=<name>` (Task 3).
- Produces: `workshop/artifacts/<name>.webm` (default) or `workshop/artifacts/<name>-NN.png` (with `--stills N`). CLI: `node tools/workshop/clip.mjs <name> [--stills N] [--secs S]`.

- [ ] **Step 1: Add the gitignore entry**

In `.gitignore`, under the `# test artifacts` section, add a new line:

```
workshop/artifacts/
```

- [ ] **Step 2: Add the npm script**

In `package.json`, add to `"scripts"` (after the `"render-check"` line):

```json
    "clip": "node tools/workshop/clip.mjs",
```

- [ ] **Step 3: Write the recorder**

Create `tools/workshop/clip.mjs`:

```js
// Record a workshop sketch to a webm clip (and optional stills) for phone
// review. Serves the repo, loads workshop/sandbox.html?sketch=<name> in
// headless Chromium (SwiftShader), and records with Playwright's built-in
// video capture (no ffmpeg). Reuses tools/mcp/lib/browser.mjs. Dev-only.
//
//   npm run clip -- <name>             # ~5s webm  -> workshop/artifacts/<name>.webm
//   npm run clip -- <name> --stills 4  # 4 PNG keyframes for side-by-side
//   npm run clip -- <name> --secs 8    # longer capture

import { spawn } from 'node:child_process';
import { mkdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import net from 'node:net';
import { launchBrowser } from '../mcp/lib/browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..'); // tools/workshop -> repo root
const artifacts = join(root, 'workshop', 'artifacts');

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, () => { const { port } = s.address(); s.close(() => res(port)); });
    s.on('error', rej);
  });
}
function flagVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
}

const name = process.argv[2];
if (!name || name.startsWith('--') || !/^[a-z0-9_-]+$/i.test(name)) {
  console.error('usage: npm run clip -- <sketch-name> [--stills N] [--secs S]');
  process.exit(1);
}
const stills = process.argv.includes('--stills') ? Number(flagVal('--stills', 4)) : 0;
const secs = Number(flagVal('--secs', 5));
const size = { width: 800, height: 450 };

mkdirSync(artifacts, { recursive: true });
const port = await freePort();
const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 800));
const url = `http://localhost:${port}/workshop/sandbox.html?sketch=${encodeURIComponent(name)}`;

const browser = await launchBrowser();
try {
  if (stills > 0) {
    const ctx = await browser.newContext({ viewport: size });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForFunction(() => window.__primordial && window.__primordial.glOk, { timeout: 10000 });
    const err = await page.evaluate(() => window.__primordial.error);
    if (err) throw new Error('sketch failed to boot: ' + err);
    const out = [];
    for (let i = 0; i < stills; i++) {
      await page.waitForTimeout((secs * 1000) / stills);
      const p = join(artifacts, `${name}-${String(i + 1).padStart(2, '0')}.png`);
      await page.screenshot({ path: p, timeout: 15000 });
      out.push(p);
    }
    await ctx.close();
    console.log('stills:\n  ' + out.join('\n  '));
  } else {
    const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: artifacts, size } });
    const page = await ctx.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: 20000 });
    await page.waitForFunction(() => window.__primordial && window.__primordial.glOk, { timeout: 10000 });
    const err = await page.evaluate(() => window.__primordial.error);
    if (err) throw new Error('sketch failed to boot: ' + err);
    await page.waitForTimeout(secs * 1000);
    const video = page.video();
    await ctx.close(); // flushes the webm to disk
    const tmp = await video.path();
    const dest = join(artifacts, `${name}.webm`);
    renameSync(tmp, dest);
    console.log('clip: ' + dest);
  }
} finally {
  await browser.close().catch(() => {});
  server.kill();
}
```

- [ ] **Step 4: Syntax-check, then record the demo clip**

Run: `node --check tools/workshop/clip.mjs && npm run clip -- _demo`
Expected: prints `clip: .../workshop/artifacts/_demo.webm`. Verify the file is non-empty:

Run: `test -s workshop/artifacts/_demo.webm && echo "webm OK"`
Expected: `webm OK`

- [ ] **Step 5: Record stills**

Run: `npm run clip -- _demo --stills 3`
Expected: prints three `_demo-01.png` ... `_demo-03.png` paths. Verify:

Run: `test -s workshop/artifacts/_demo-01.png && echo "stills OK"`
Expected: `stills OK`

- [ ] **Step 6: Confirm artifacts are gitignored**

Run: `git status --porcelain workshop/artifacts/`
Expected: empty output (the directory is ignored).

- [ ] **Step 7: Commit**

```bash
git add tools/workshop/clip.mjs package.json .gitignore
git commit -m "feat(workshop): clip recorder (webm + stills) via Playwright video

$(printf 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg')"
```

---

## Task 5: The `/workshop` skill

Encodes the repeatable loop (discuss -> research -> author -> clip -> react -> graduate) so it is invokable and router-registered.

**Files:**
- Create: `.claude/skills/visual-workshop/SKILL.md`
- Test: `node tools/gen-docs.mjs && node tools/gen-docs.mjs --check`

**Interfaces:**
- Consumes: `npm run clip -- <name>` (Task 4); the sandbox + sketch contract (Task 3); `SendUserFile` (harness) to deliver artifacts; `new-preset` skill / `create_look` MCP tool for graduation.
- Produces: a skill with frontmatter `area: design` that `gen-docs.mjs` auto-adds to the router block in `.claude/skills-router.md`.

- [ ] **Step 1: Write the skill**

Create `.claude/skills/visual-workshop/SKILL.md`:

```markdown
---
name: visual-workshop
description: Workshop visuals for primordial in a throwaway sandbox, separate from the shipped app - discuss a direction, optionally research similar/trending designs + implementation best-practice, author an experimental "sketch" shader, render it to a short audio-driven clip delivered to the phone, iterate, then graduate a winner into a real look or shader. Use when exploring art direction, trying a new visual idea, or refining a look without touching the live instrument.
area: design
---

# Visual Workshop

A sandbox loop for designing visuals without the full build. Sketches live under
`workshop/sketches/<name>/` (committed, durable); the shipped app in `src/` is
never touched until graduation. See `docs/superpowers/specs/2026-06-19-visual-workshop-design.md`.

## The loop

1. **Mood / reference.** Discuss the direction in chat - vibe, palette, motion,
   references. Keep it concise (the operator is on a phone).
2. **Research & trend scan (optional, ask first).** Two facets, run together:
   - *Creative:* similar + newest/trending work in that direction (use
     `WebSearch` / `WebFetch`, or the `deep-research` skill for depth).
   - *Implementation best-practice:* the best way to build the chosen technique
     on a mobile GPU (`find-docs` / Context7 + the project MCP `search_docs`,
     cross-checked against `.claude/rules/shaders.md`).
   Report back concisely with sources + license flags. Reference-only (see
   Licensing). Optionally capture sources to `workshop/sketches/<name>/references.md`.
3. **Author.** Create `workshop/sketches/<name>/<name>.frag.js` (export
   `SKETCH_FRAG`, `#version 300 es` byte one, may `import { COMMON_GLSL }` from
   `src/shaders/common.glsl.js`) and `<name>.json` (`{ name, note, bpm, params }`).
   Params upload by name: length-3 arrays -> `vec3 u<Key>`, numbers -> `float u<Key>`.
   Standard uniforms are always provided: `uResolution`, `uTime`, `uAudioTex`,
   `uBass`/`uMid`/`uTreble`/`uLevel`/`uFlux`/`uBeat`, `uSteps`.
4. **Render + deliver.** `npm run clip -- <name>` produces
   `workshop/artifacts/<name>.webm`; `--stills N` produces keyframes. Deliver the
   artifact to the operator with `SendUserFile` (file:// links do not open on the
   phone). Use `--secs S` for a longer capture.
5. **React + iterate.** Operator reacts in chat; revise the sketch; re-render.
   Keep prior versions for comparison (e.g. `<name>` vs `<name>-v2`).
6. **Graduate (only on explicit approval).** Either promote params into a real
   look via the `new-preset` skill / `create_look` MCP tool, or promote the
   shader into `src/shaders/`. Graduation is when the mobile budget (`<= 64`
   steps, `0.5`-`0.75` render-scale), the licensing note, and `visual-qa` +
   `audio-dsp` review apply, plus the normal verify gates
   (`node test/smoke.mjs`, `node test/render-check.mjs`).

## Licensing guardrail (load-bearing)

Commercial work. Research is reference-only: study trending work and technique,
then author every shader from a blank file (`.claude/rules/shaders.md`). Never
copy CC BY-NC-SA Shadertoy/GLSL code. Anything reused must be MIT/CC0/CC-BY with
attribution recorded in `references.md`.

## Notes

- The sandbox uses a deterministic synthetic "fake song" (`workshop/synth-audio.mjs`),
  not a mic - clips are reproducible. Real-track audio is a later upgrade.
- Workshop tooling is dev-only and never deployed (deploy stages only `index.html src`).
```

- [ ] **Step 2: Regenerate docs + verify the drift gate and router**

Run: `node tools/gen-docs.mjs && node tools/gen-docs.mjs --check`
Expected: regenerates cleanly, `--check` exits 0 (docs + router + drift gate green). The drift gate confirms every backtick path in the new SKILL.md exists.

- [ ] **Step 3: Confirm the skill is in the router**

Run: `grep -n "visual-workshop" .claude/skills-router.md`
Expected: a match under the `design` area line.

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/visual-workshop/SKILL.md .claude/skills-router.md ENCYCLOPEDIA.md TREE.md
git commit -m "feat(workshop): /workshop skill driving the sandbox clip loop

$(printf 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg')"
```

---

## Task 6: Full verification, handoff, and push

**Files:**
- Modify: `progress.md` (session entry)
- Test: `npm run health`

- [ ] **Step 1: Run the full health gate**

Run: `npm run health`
Expected: `Health: all local gates pass.` (JS syntax, smoke incl. synth + sketch checks, site audit, docs+drift). If the site audit flags anything in `workshop/`, replace any em/en dashes with `-` and re-run.

- [ ] **Step 2: Re-run the render check (app regression guard)**

Run: `node test/render-check.mjs`
Expected: `all render checks passed` (Task 1 left the app unchanged).

- [ ] **Step 3: Add the progress.md handoff entry**

In `progress.md`, immediately after the `## Open threads` block, add a new session section:

```markdown
## Session - 2026-06-19 (Visual Workshop - sandbox clip loop SHIPPED)

Built the Visual Workshop (spec: `docs/superpowers/specs/2026-06-19-visual-workshop-design.md`,
plan: `docs/superpowers/plans/2026-06-19-visual-workshop.md`) - a throwaway
sandbox, separate from the shipped app, for workshopping visuals via short
audio-driven clips delivered to the phone.

- `workshop/sketches/<name>/` (committed): each sketch = `<name>.frag.js`
  (exports `SKETCH_FRAG`, GLSL ES 3.00) + `<name>.json` (`{name,note,bpm,params}`).
- `workshop/sandbox.html` + `sketch-runner.mjs`: mounts a sketch via the real
  `Renderer` (now accepts `{slimeFrag,postFrag}`), driven by a deterministic
  synthetic "fake song" (`workshop/synth-audio.mjs`).
- `npm run clip -- <name>` (`tools/workshop/clip.mjs`): records the sandbox to
  `workshop/artifacts/<name>.webm` (or `--stills N`) via Playwright video, no
  ffmpeg. Artifacts gitignored. Deliver with `SendUserFile`.
- `/workshop` skill (area design): drives discuss -> (optional) research ->
  author -> clip -> react -> graduate, with the reference-only licensing
  guardrail. Graduation applies the mobile budget + visual-qa/audio-dsp review.

Reference sketch `_demo` proves the loop. **Verified:** `npm run health` green,
`node test/render-check.mjs` green (app unchanged), `npm run clip -- _demo`
produces a non-empty webm.

**Next:** use it - workshop the real `/Test/` visual. Possible upgrades: real
sample-track audio, portrait clip option, expose `clip` as an MCP tool.
```

- [ ] **Step 4: Commit the handoff**

```bash
git add progress.md
git commit -m "docs(progress): record the Visual Workshop session

$(printf 'Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>\nClaude-Session: https://claude.ai/code/session_019UfnW5BFSbDB3Vk2WtUHVg')"
```

- [ ] **Step 5: Push the branch**

```bash
git push -u origin claude/review-claude-md-di5jvm
```

Expected: push succeeds (retry with backoff on a network error).

- [ ] **Step 6: Deliver a demo artifact to the operator**

Render and send the demo clip so the loop is proven end-to-end on the phone:

Run: `npm run clip -- _demo`
Then use `SendUserFile` with `workshop/artifacts/_demo.webm` (caption: "Demo sketch - proves the Visual Workshop clip loop; not the target look").

---

## Self-Review

**Spec coverage:**
- Sandbox separate from app -> Tasks 1, 3. ✓
- Sketches committed, self-contained (frag + json) -> Task 3. ✓
- `npm run clip` -> webm + stills, no deploy, no mic -> Task 4. ✓
- Synthetic fake-song drive (moves + reacts) -> Task 2 + runner in Task 3. ✓
- Reuses real renderer/uniforms; uniform contract -> Task 1 (refactor) + Task 3 (runner uniform setter). ✓
- `/workshop` skill driving the loop, router-registered -> Task 5. ✓
- Research step (creative + implementation best-practice, reference-only) -> documented in the skill (Task 5). ✓
- Graduation path (look via new-preset/create_look, shader into src/ with gates) -> skill (Task 5). ✓
- Licensing guardrail -> Global Constraints + skill. ✓
- Durability (committed sketches) / artifacts gitignored -> Task 4. ✓
- Verification: demo sketch + smoke validation + health -> Tasks 3, 6. ✓
- `references.md` (optional) -> documented in skill; created ad hoc per sketch, no task needed (optional artifact). ✓

**Placeholder scan:** No TBD/TODO; every code step has complete code. ✓

**Type consistency:** `synthAudio(t, {bpm}) -> {bass,mid,treble,level,flux,beat,fft,wave}` used identically in Task 2 (def), smoke (Task 2), and the runner (Task 3). `Renderer(canvas, {slimeFrag,postFrag})` defined in Task 1, consumed in Task 3. Sketch contract `SKETCH_FRAG` + json shape defined in Task 3, validated in smoke (Task 3), consumed by runner (Task 3) and clip (Task 4). `window.__primordial` beacon shape matches what `clip.mjs` waits on. ✓

**Open items (deferred, per spec):** real sample-track audio; portrait clip option; `clip` as an MCP tool; per-genre synth presets.
