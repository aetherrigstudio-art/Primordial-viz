# CLAUDE.md

Working notes for agents in this repo. Facts and commands only — hard rules
live in the hook (`.claude/hooks/check-syntax.sh`) and the scoped
`.claude/rules/` files, which override anything implied here.

## Project Overview

**primordial** is an audio-reactive WebGL2 visual instrument for live
electronic-music gigs. A musician opens one HTTPS link, grants mic/line-in, and
room audio drives generative "grungy-future-geometric-slimy" visuals; the artist
operates the controls.

- **Two front-ends, same idea.** `index.html` → `src/main.js` is the original
  **raw WebGL2** app (no library). `three.html` → `src/three/main.js` is a
  **three.js** variant (three is vendored in `vendor/three.module.js`, resolved
  by an import map). Both are static ES modules and both deploy. `index.html` is
  the default page served at the site root. GLSL ships **inside `.js` modules**
  as exported `/* glsl */` template strings — no `fetch()`, no `.glsl` files.
- **The gig/web path still has no build step.** Plain HTML + ES modules served
  statically (`python3 -m http.server`, or the live link). Mic needs HTTPS.
- **Vite + Tauri are additive, not the web path.** `npm run build` (`vite build`)
  → `dist/` is for the **desktop standalone** (`src-tauri/`, Tauri v2 / Rust —
  build on a real machine, not a phone) and can optionally be uploaded to static
  hosting. `dist/` is gitignored. See `docs/STANDALONE.md`.
- **Local tooling.** A small **MCP server** (`tools/mcp/server.mjs`, wired in
  `.mcp.json`) exposes look/render/validate helpers; `tools/gen-docs.mjs`
  (`npm run docs`) regenerates `ENCYCLOPEDIA.md` + `TREE.md`.
- **Host = Namecheap Stellar Plus** (cPanel / LiteSpeed); static delivery is the
  ideal fit. Web deploy is **automated**: push → GitHub Actions FTPS →
  `https://primordial.video/Test/` (see `progress.md` + `deploy/DEPLOY.md`).
  Backend, if ever needed, is **PHP 8 only** — never Node/Python (they fight the
  Passenger EP=30 / 2 GB cap).

## Commands

```bash
# Serve the static web app locally (localhost is a secure context → mic works)
python3 -m http.server 8000        # http://localhost:8000/  (index.html or three.html)

# Syntax-check an edited module
node --check src/main.js

# Optional Vite build / desktop standalone (needs a real machine, not a phone)
npm run build                      # vite build → dist/
npm run tauri dev                  # hot-reloading native window (needs Rust + OS webview)
npm run tauri build                # installers → src-tauri/target/release/bundle/

# Verify (laptop-free)
node test/smoke.mjs ; node test/render-check.mjs

# Local MCP server / regenerate docs
npm run mcp                        # tools/mcp/server.mjs
npm run docs                       # regenerate ENCYCLOPEDIA.md + TREE.md

# Stress test / perf budget — read the in-HUD FPS verdict (SMOOTH/OK/TOO-MUCH);
# see the perf-budget skill.

# Deploy — automatic on push (GitHub Actions FTPS → primordial.video/Test/).
# Manual cPanel checklist: .claude/skills/deploy-cpanel/SKILL.md + deploy/DEPLOY.md
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
├── three/           # three.js front-end: main.js + pipeline.js (used by three.html)
└── ui/              # controls.js + styles.css
```

The raw-WebGL2 path (`src/gl/*`) and the three.js path (`src/three/*`) are
parallel renderers over the same audio + looks + ui; pick the one matching the
HTML entry you're editing (`index.html` vs `three.html`).

## Rules / Constraints

- **HTTPS required for mic.** `getUserMedia` only works on a secure context
  (`localhost` or HTTPS). Never assume `file://` works.
- **Mobile perf budget** (enforced from day one): render the heavy SDF pass to
  a **0.5–0.75 FBO** and upscale; **cap raymarch steps ≤ 64**; use **dynamic
  resolution** (auto-drop scale/steps as frame-time climbs); pause on
  `visibilitychange`. Details in `.claude/rules/shaders.md`.
- **Keep runtime deps minimal & vendored.** The web path ships only what's in
  `vendor/` via import maps (currently **three.js**, MIT). `package.json` deps
  are for the **build / desktop / MCP tooling** (vite, @tauri-apps/cli,
  playwright, zod, three) — keep them tiny and MIT/permissive. Don't add runtime
  libraries to the gig path beyond a vendored, import-mapped file.
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

Canonical repo: **`Primordial-viz`** (dash). The current active branch and PR
live in `progress.md` (last handoff entry) — that file is the source of truth,
not this line.

Claude-environment docs: `.claude/ROADMAP.md` (roadmap + AI-handoff method &
template), `.claude/TODO.md` (checklist), `.claude/cloud-setup.sh` (paste into the
cloud Environment → Setup script). Latest **handoff** = the last entry in
`progress.md`.
