# Progress Log — primordial

## Session 1 — 2026-06-19 (planning + research)

**Did:**
- Scoped the project: static-first audio-reactive WebGL2 visual instrument for electronic-musician
  collabs, hosted on Namecheap Stellar Plus. Artist operates the tool (instrument, not art-for-them).
- Ran 7 deep-research passes (Stellar Plus, Claude-repo best practice, audio-visual stack, + 4 shader
  passes: porting/audio-texture, licensing, technique, tooling). Synthesis → `findings.md`.
- Wrote approved build spec (plan) and copied to `docs/BUILD-SPEC.md`.
- Created durable planning files (`task_plan.md`, `findings.md`, `progress.md`) via pi-planning-with-files.
- Built artifacts available from this session: phone **stress-test rig** (raymarched slime + FPS readout,
  to be ported in Phase 1), curated Claude corpus subset (→ `research/corpus/`), scraper (→ `research/scripts/`).

**State:** Phase 0 (scaffold) in progress. Build of the app (Phases 1–6) **awaits explicit "go"**
(user chose build-later; execution = agent-orchestrator-task + subagent-task-execution).

**Next:** finish scaffold files (docs, tailored `.claude/`, `src/` skeleton, `deploy/.htaccess`,
`.gitignore`, README/ROADMAP/TODO/LICENSE), then on "go" run the orchestrated build from Phase 1.

**Notes:** container is ephemeral + Perchance repo is read-only → this project is delivered as a
zip + git bundle for the user to push to a fresh GitHub repo.

## Session 2 — 2026-06-19 (orchestrated build)

**Did:**
- Ran agent-orchestrator-task + subagent-task-execution: 2 parallel subagents (disjoint file sets) →
  full docs + tailored `.claude/` + `deploy/` (agent 1) and the complete runnable app `index.html`+`src/` (agent 2).
- Synthesis pass: applied **Primordial** branding (LICENSE → Primordial Studio LLC; HUD wordmark → PRIMORDIAL;
  title/README/CLAUDE.md → Primordial Studio; domain → **primordial.video** in deploy), renamed dir → `primordial`.
- Verified: `node --check` on all 15 JS (pass); **headless Chromium render** confirmed shaders compile + app
  boots + slime renders at ~36 fps on software GL with live HUD/FPS readout.
- **Fixed a real bug:** `src/looks/registry.js` fetched `/looks/*.json` (resolved vs page) → 404; now resolves
  vs the module via `import.meta.url` → loads `/src/looks/*.json` 200. Re-render: zero console errors, zero 404s.

**State:** App runs end-to-end (Phases 1,3,4,5 done). Remaining: Phase 2 = user hosts on primordial.video
(HTTPS unblocks mic); Phase 3 = verify audio reactivity vs real music live; Phase 6 = first collab.

## Test results
| Phase | Test | Result |
|-------|------|--------|
| 0–5 | `node --check` × 15 JS files | ✅ pass |
| 4 | Headless WebGL2 render — shaders compile + slime renders | ✅ pass (~36fps software GL) |
| 4 | HUD/FPS readout + PRIMORDIAL wordmark | ✅ visible |
| 4 | Looks load (slime-green, hud-amber) | ✅ 200 after registry fix |
| — | Console errors / 404s | ✅ none |

## Session 3 — 2026-06-19 (own repo + hardening + Claude env for phone-driven dev)

**Did:**
- **Migrated** the full app from `perchance-ai-tool/primordial/` into its own repo
  **`aetherrigstudio-art/Primordial-viz`** (DASH = canonical; a separate empty
  `Primordial.viz` DOT repo exists — user to delete). Companion change removed it
  from `perchance-ai-tool`.
- **Reconciled docs to shipped code:** shaders are `src/shaders/*.js` ES modules
  exporting GLSL template strings (NOT fetched `.glsl`); looks are
  `{id,name,description,params}` params-only over one shared shader (NOT
  `{shader,defaultParams}`). Rewrote the `new-preset` skill; "BUILT DIFFERENTLY"
  banners on BUILD-SPEC / findings.
- **Verified Claude/host facts vs official docs:** auto-memory is on-by-default
  but **machine-local → does NOT survive cloud sessions**; CLAUDE.md <200 lines;
  commands merged into skills; `.mcp.json` is current; Stellar Plus free SSL is
  **not** auto-renewing; ~300k inode cap. `findings.md §B` confirmed accurate.
- **WS0 verification backbone (laptop-free):** `test/smoke.mjs` (zero-dep
  schema/look/store checks), `test/render-check.mjs` (headless Chromium — WebGL2,
  shaders compile, render loop, a11y DOM, screenshot), `.github/workflows/verify.yml`,
  `package.json` (playwright = dev-only dep), `window.__primordial` render beacon.
- **WS2 accessibility:** labelled controls, `#readout` aria-live, `:focus-visible`,
  AA contrast, `prefers-reduced-motion` slows the visual clock.
- **CI fix:** freeze render loop before screenshot (CPU starvation on CI software GL).
- **Claude env:** added `.claude/hooks/check-data.sh` PostToolUse hook (runs smoke
  on `src/params`/`src/looks` edits). Permission allow-rules blocked by the
  self-modification guard → user to apply.

**State:** branch `claude/primordial-visual-instrument-ai-o7gfcm`, draft **PR #1**,
CI green. Behavior unchanged except a11y + render beacon + reduced-motion.

**Next (durable plan):**
- **WS1** code fixes — `renderer.js:86-87` LINEAR→NEAREST; `schema.js:30` step
  max 96→64; `schema.js:29` renderScale min 0.3→0.5 (+ main.js dyn floor);
  `input.js` `devicechange` listener; implement `flux`; WebGL context-loss +
  FBO-complete checks; getUserMedia/resume error surfacing; dt/FPS NaN guards;
  dynamic-res hysteresis.
- **WS3** docs/research honesty (write real research into `research/findings/`),
  **WS4** hygiene (prune vestigial `.htaccess` `.glsl` rules), **WS5** CLAUDE.md /
  skills / agents tuning.
- **Claude-env / phone-driven — USER actions:** (1) enable phone push (input-needed
  + done) in the mobile app; (2) Auto mode as default permission (user-level —
  ignored from project settings); (3) add `Primordial-viz` to the **Claude GitHub
  App** repo access (currently only on `perchance-ai-tool`); (4) set the cloud
  Environment **setup script** to install the toolchain (`npm ci` + playwright
  chromium) — it's snapshot-cached, runs once.
- **Rule:** only git-committed files survive a fresh cloud session — keep this log
  + `task_plan.md` current.
