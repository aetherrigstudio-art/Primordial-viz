# CLAUDE.md

Working notes for agents in this repo. Facts and commands only — hard rules
live in the hook (`.claude/hooks/check-syntax.sh`) and the scoped
`.claude/rules/` files, which override anything implied here.

## Project Overview

**primordial** is an audio-reactive WebGL2 visual instrument for live
electronic-music gigs. A musician opens one HTTPS link, grants mic/line-in, and
room audio drives generative "grungy-future-geometric-slimy" visuals; the artist
operates the controls.

- **One hand-built app, no rendering library.** `index.html` → `src/main.js` is
  plain **raw WebGL2** + Web Audio `AnalyserNode` — **not three.js**. GLSL ships
  **inside `.js` modules** as exported `/* glsl */` template strings, imported
  directly — no `fetch()`, no `.glsl` files on disk. (A three.js variant existed
  briefly and was removed — the hand-built renderer is the keeper.)
- **The gig/web path has no build step.** Plain HTML + ES modules served
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
python3 -m http.server 8000        # http://localhost:8000/  (serves index.html)

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
└── ui/              # controls.js + styles.css
```

## Knowledge router — read these BEFORE touching each area

The load-bearing knowledge is scoped. Match what you're doing to its required
reading (these rules protect mobile perf and the commercial licensing position —
don't skip them):

| Working on… | Read first | Also |
| --- | --- | --- |
| Shaders / renderer (`src/shaders`, `src/gl`) | `.claude/rules/shaders.md` — mobile budget + write-our-own licensing | agent `visual-qa`, skill `perf-budget` |
| Audio (`src/audio`) | `.claude/rules/audio.md` — AnalyserNode, 512×2 texture, capture | agent `audio-dsp` |
| A new look / preset (`src/looks`, `src/params`) | skill `new-preset` | `check-data` hook runs smoke on save |
| Deploy / hosting | `.claude/rules/deploy.md` (source of truth) | `deploy/DEPLOY.md`; deploy auto-runs via `deploy.yml` |
| Design / architecture / "reason through" a choice | skill `thought-based-reasoning` | this router + `progress.md` |
| A multi-step build / feature / new look | skill `workflow` (chains in `.claude/workflows.md`) | auto-nudged by the `suggest-workflow` hook |
| Where a file lives / what it does | `TREE.md` (layout) · `ENCYCLOPEDIA.md` (per-file) | auto-generated |

@.claude/skills-router.md

## Rules / Constraints

- **Accuracy — verify, don't assume.** State verified facts plainly; label the
  unchecked as a guess ("I think / haven't verified"). Before claiming two things
  **overlap / are redundant / equivalent, read both first.** Confirm the
  **referent before acting** — is "make / show / put X" for *your deliverable*
  (the live site / portfolio / `/Test/` link) or just my local sandbox? When in
  doubt, build for the deliverable. For what the user wants, or how far a rule's
  scope reaches, **ask or check the source — don't infer.** For "done / fixed /
  passing," run the check before claiming it (see the
  `verification-before-completion` skill).
- **Communication — concise + plain language.** Lead with the answer or a short
  summary, then offer depth instead of dumping it (over-long replies hit the
  output-token cap and break the session). Keep jargon low — the operator drives
  this from a phone and isn't always deep in the stack. When handing over values
  or steps, follow `.claude/rules/mobile-ergonomics.md`.
- **HTTPS required for mic.** `getUserMedia` only works on a secure context
  (`localhost` or HTTPS). Never assume `file://` works.
- **Mobile perf budget** (enforced from day one): render the heavy SDF pass to
  a **0.5–0.75 FBO** and upscale; **cap raymarch steps ≤ 64**; use **dynamic
  resolution** (auto-drop scale/steps as frame-time climbs); pause on
  `visibilitychange`. Details in `.claude/rules/shaders.md`.
- **Zero runtime dependencies on the web path.** `index.html` + `src/` use only
  raw WebGL2 / Web Audio — no rendering library. `package.json` carries **devDeps
  only** (vite, @tauri-apps/cli, playwright, zod) for the build / desktop / MCP
  tooling. Anything ever added to the gig path must be tiny, MIT/permissive, and
  vendored via an import map.
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

**Container limits (fresh cloud/phone session).** Outbound network is **HTTPS
(443) only** — **FTP/21 and cPanel/2083 are blocked**, so you cannot deploy or
drive cPanel from the container. Web deploy runs on **GitHub Actions** (push to
the working branch, or trigger `deploy.yml` via the GitHub MCP); verify the live
site by `curl`-ing `https://primordial.video/Test/`. The `FTP_PASSWORD` secret
lives in GitHub and survives container wipes. Re-run/inspect CI via the GitHub
MCP, not local FTP.

Canonical repo: **`Primordial-viz`** (dash). The current active branch and PR
live in `progress.md` (last handoff entry) — that file is the source of truth,
not this line.

Claude-environment docs: `.claude/ROADMAP.md` (roadmap + AI-handoff method &
template), `.claude/TODO.md` (checklist), `.claude/cloud-setup.sh` (paste into the
cloud Environment → Setup script). Latest **handoff** = the last entry in
`progress.md`.
