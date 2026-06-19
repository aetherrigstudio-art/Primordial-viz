# CLAUDE.md

Working notes for agents in this repo. Facts and commands only — hard rules
live in the hook (`.claude/hooks/check-syntax.sh`) and the scoped
`.claude/rules/` files, which override anything implied here.

## Project Overview

**primordial** is a static-first, audio-reactive WebGL2 visual instrument
for live electronic-music gigs. A musician opens one HTTPS link, grants
mic/line-in, and room audio drives generative "grungy-future-geometric-slimy"
visuals; the artist operates the controls.

- **No build step.** Plain `index.html` + vanilla ES modules + raw WebGL2 +
  Web Audio `AnalyserNode`. GLSL ships **inside `.js` ES modules** as exported
  `/* glsl */` template-string constants, imported directly — no `fetch()`, no
  `.glsl` files on disk.
- **Zero runtime dependencies** by default. Renderer is raw WebGL2 (ogl ~8 KB
  is the only sanctioned fallback). Not three.js.
- **Host = Namecheap Stellar Plus** (cPanel / LiteSpeed). Static delivery is
  the ideal fit. Backend, if ever needed, is **PHP 8 only** — never Node/Python
  (they fight the Passenger EP=30 / 2 GB cap).

## Commands

```bash
# Serve locally (localhost is a secure context → mic works)
python3 -m http.server 8000        # open http://localhost:8000/

# Syntax-check an edited module
node --check src/main.js

# Stress test / perf budget — open the rig page and read the FPS verdict
# (SMOOTH / OK / TOO-MUCH); see the perf-budget skill.

# Deploy — manual checklist
# see .claude/skills/deploy-cpanel/SKILL.md and deploy/DEPLOY.md
```

## Architecture

Data flows **audio → gl → ui**:

- **audio** captures the mic, analyses it, and produces band scalars
  (`bass/mid/treble/level/flux`) plus a **512×2 audio texture**.
- **gl** renders a fullscreen triangle into FBOs (ping-pong post chain),
  consuming the audio texture + band uniforms + look params.
- **ui** is the performer control surface that sets look + params and drives
  the start gate / device picker.

`src/` map:

```
src/
├── main.js          # bootstrap: start-gate, rAF loop, wires audio→gl→ui
├── audio/
│   ├── input.js     # getUserMedia (raw: AGC/NS/echo off) + device picker
│   ├── analyser.js  # AnalyserNode → bands + 512×2 audio texture
│   └── bpm.js        # realtime-bpm-analyzer + tap-tempo fallback
├── gl/
│   ├── renderer.js  # WebGL2 fullscreen triangle, FBOs, ping-pong
│   ├── passes.js    # post chain (bloom/feedback/grade), half-res FBOs
│   └── uniforms.js  # audio features + params → shader uniforms
├── shaders/         # *.frag.js / *.glsl.js: ES modules exporting GLSL strings
├── looks/           # "looks" as JSON data + registry.js
├── params/          # schema.js + store.js (versioned localStorage)
└── ui/              # controls.js + styles.css
```

## Rules / Constraints

- **HTTPS required for mic.** `getUserMedia` only works on a secure context
  (`localhost` or HTTPS). Never assume `file://` works.
- **Mobile perf budget** (enforced from day one): render the heavy SDF pass to
  a **0.5–0.75 FBO** and upscale; **cap raymarch steps ≤ 64**; use **dynamic
  resolution** (auto-drop scale/steps as frame-time climbs); pause on
  `visibilitychange`. Details in `.claude/rules/shaders.md`.
- **Keep dependencies at zero.** Prefer raw WebGL2 / Web Audio. Anything added
  must be tiny, MIT/permissive, pinned in `vendor/` or an import map.
- **Backend = PHP 8 only**, and only if truly needed.
- **WRITE-OUR-OWN shaders.** This is commercial work. Learn techniques from any
  source, but author every shader from a blank file. **Never copy CC BY-NC-SA
  Shadertoy code** (NC forbids commercial use; SA forces copyleft). Reuse only
  MIT / CC0 / CC-BY code, with attribution. See `.claude/rules/shaders.md`.

## Key Patterns

- **Looks / presets are JSON data** in `src/looks/` — `{ id, name, description,
  params }` (one shared slime shader; looks vary **params only**) + a
  `registry.js` that fetches the JSON (resolved via `import.meta.url`) with an
  inline `INLINE_LOOKS` mirror as the `file://` fallback. Switching looks is
  data, not code.
- **Versioned localStorage key** for saved state (e.g. `primordialV1`);
  validate/coerce on load so a schema bump never corrupts a saved set.
- **512×2 R8 audio texture** — row 0 = `getByteFrequencyData` (fftSize 1024 →
  512 bins), row 1 = `getByteTimeDomainData`. Matches Shadertoy's iChannel
  layout so audio shaders prototyped elsewhere port with zero rewiring. Details
  in `.claude/rules/audio.md`.

## Session continuity (read first — especially on a fresh cloud/phone session)

The cloud container is wiped between sessions; **only git-committed files
survive** (auto-memory and `~/.claude/plans` do not). The current state and the
active plan live in committed files, imported here so they load on launch:

@task_plan.md
@progress.md

**Verify (laptop-free, runs in-container or CI):**
- `node test/smoke.mjs` — param/look/store integrity (zero-dep)
- `node test/render-check.mjs` — headless Chromium: WebGL2, shaders compile,
  render loop, a11y DOM, saves `test/artifacts/render.png`
  (needs Playwright Chromium; CI installs it)
- `.github/workflows/verify.yml` runs both + `node --check` on every push.

Canonical repo: **`Primordial-viz`** (dash). Active branch:
`claude/primordial-visual-instrument-ai-o7gfcm` → draft PR #1.
