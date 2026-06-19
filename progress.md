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
  commands merged into skills; Stellar Plus free SSL is
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

## Handoff — 2026-06-19 (session end · own-repo + Claude env) — READY

**Metadata:** repo `Primordial-viz` (canonical, dash) · branch
`claude/primordial-visual-instrument-ai-o7gfcm` · draft **PR #1** · CI green ·
latest commits in `git log` (migration → docs reconcile → WS0/WS2 → CI fix →
hooks → continuity → roadmap/TODO → cloud-setup).

**Did:** migrated app into its own repo; reconciled docs↔code; WS0 verification
backbone (`test/smoke.mjs`, `test/render-check.mjs`, CI); WS2 accessibility; CI
screenshot fix; hooks (`check-syntax`, `check-data`, SessionStart `orient`);
cross-session continuity (`CLAUDE.md` `@imports`); Claude-only roadmap+TODO
(`.claude/ROADMAP.md`, `.claude/TODO.md`); finalized cloud setup script
(`.claude/cloud-setup.sh`).

**Decisions (+why):** durable state = git only (cloud wipes `~/.claude` +
auto-memory + plans); setup script = one-time cached install, SessionStart hook =
per-session orient; code is source of truth (shaders are `.js`, looks params-only);
permission-allow widening + skill edits are user-gated (self-mod guard / "don't
modify skills" rule).

**Next step (specific) — START WS1, exact edits:**
- `src/gl/renderer.js:86-87` → `gl.NEAREST` (both MIN/MAG) for the 512×2 audio texture.
- `src/params/schema.js:30` → `steps` max `96`→`64`; `:29` → `renderScale` min `0.3`→`0.5`; raise the dynamic-res floor in `src/main.js` `updateDynamicRes` (`0.4`→`0.5`).
- `src/audio/input.js` → add `navigator.mediaDevices.addEventListener('devicechange', …)` to re-refresh devices.
- `src/audio/analyser.js` → compute `flux` (store prev FFT frame, positive-diff sum, smoothed); expose in `features`; wire `uFlux` in `src/gl/uniforms.js` + a subtle use in `src/shaders/slime.frag.js`.
- `src/gl/renderer.js` → `webglcontextlost`/`webglcontextrestored` handlers + `checkFramebufferStatus` after FBO attach; surface shader compile/link errors to the start gate.
- `src/audio/input.js` + `src/main.js` → surface `getUserMedia` rejection + post-`resume()` still-`suspended` state to the gate; guard `dt`/`lastT` & FPS ÷0; add dynamic-res hysteresis; `cancelAnimationFrame` on unload.
- Verify each area: `node test/smoke.mjs && node test/render-check.mjs`; commit per-area; let `audio-dsp`/`visual-qa` agents review.

**Pending:** WS1 (above) · WS3 (write `research/findings/`) · WS4 (prune vestigial
`.htaccess` `.glsl` rules) · WS5 (finish CLAUDE.md/skills tuning).
**USER control plane — ✅ ALL DONE:** phone push, Auto mode, `Primordial-viz`
added to the Claude GitHub App, cloud setup script pasted (Network=Full).
(Optional remaining: delete the empty `Primordial.viz` dot repo.)

**Critical files:** `src/main.js` (loop+beacon+reduced-motion) · `src/gl/*` ·
`src/audio/*` · `src/params/*` · `src/looks/registry.js` · `test/*.mjs` ·
`.claude/{settings.json,hooks/*,ROADMAP.md,TODO.md,cloud-setup.sh}` ·
`.github/workflows/verify.yml`.

**Gotchas:** render screenshot must freeze the loop first (CI software-GL CPU
starvation) — handled via `window.__primordial.pause`; editing `permissions.allow`
in `.claude/settings.json` is blocked by the self-mod guard (user applies);
Chromium download needs Network=Full; auto-memory / `~/.claude/plans` do NOT persist.

**Fresh-agent test:** PASS — a new agent loads `CLAUDE.md` (which imports
`task_plan.md` + `progress.md`), runs the verify commands, and can begin WS1 from
the exact edits above.

## Session — 2026-06-19 (FTPS auto-deploy to /Test/ — LIVE)

**Phase 2 (hosting) is partially unblocked: a live preview now serves over HTTPS.**

**How it's wired (auto-deploys on every push to `claude/review-claude-md-di5jvm`):**
GitHub push/`workflow_dispatch` → `.github/workflows/deploy.yml` stages
`index.html three.html src vendor` + `deploy/.htaccess` → **SamKirkland
FTP-Deploy-Action over FTPS** → cPanel → served at **https://primordial.video/Test/**.
- Verified **HTTP 200** for `/Test/`, `/Test/index.html`, `/Test/three.html`.
- `index.html` = raw WebGL2 build; `three.html` = three.js variant.

**The two things that made it work (both were the blockers):**
1. **`FTP_PASSWORD` repo secret** (Settings→Secrets→Actions) on the
   `Test@primordial.video` account. Host + username are inlined in `deploy.yml`,
   so it's the ONLY secret. Earlier runs failed: `Error: Input required and not
   supplied: password`.
2. **FTP account directory must be inside the web root.** It was created at
   `~/primordial.video/Test` (NOT web-served → 404). Fix = delete + recreate the
   `Test@primordial.video` FTP account with **Directory = `public_html/Test`**
   (cPanel can't edit an existing account's dir). Workflow `server-dir: ./`
   uploads into that home, so no workflow change was needed.

**Environment gotcha (important for future agents):** this cloud container's
network allows outbound **HTTPS/443 only** — FTP/21 and cPanel/2083 both
**time out**, so you CANNOT deploy or drive cPanel from the container. The
GitHub Actions runner does the FTP upload (it has open network). You CAN verify
deploys with `curl https://primordial.video/Test/...` from the container.

**Decisions:** keep the preview on **`/Test/`** for now (leaves the homepage
untouched); pointing the same flow at `public_html` root (live homepage) is a
future step. `Deploy@primordial.video` account still points outside the web root
(unused).

**Cleanup TODO (non-urgent):** ~~rotate the `Test@primordial.video` FTP password
and update the `FTP_PASSWORD` secret~~ ✅ DONE — rotated + verified in sync (a
post-rotation deploy authenticated and succeeded).

**⚠️ The `/Test/` visual is a disposable PLACEHOLDER — NOT the target look.**
It exists only as a canary to prove the deploy chain is live. Do **not** polish,
tune, or treat the current placeholder slime as intended art direction; the
real visual the artist wants there is still TBD and will be built fresh. When
it is, it auto-ships to the same `/Test/` URL via the existing pipeline.

## Session — 2026-06-19 (CLAUDE.md reconcile + remove three.js variant)

**Two doc/scope cleanups after a directory review:**

1. **Reconciled `CLAUDE.md` to reality** then trimmed it back: it had claimed
   "no build step / zero deps / not three.js" while the repo had grown a Vite
   build, a Tauri desktop app (`src-tauri/`), an MCP server (`tools/mcp/`), and a
   second three.js front-end. CLAUDE.md now documents Vite/Tauri/MCP as
   **additive** tooling and the web path as the hand-built raw-WebGL2 app.

2. **Removed the three.js variant** (artist preference: the hand-built renderer
   is the keeper, matching the original charter). Deleted `three.html`,
   `src/three/`, and `vendor/` (the 2 MB vendored three.js). Updated everything
   that referenced them: `.github/workflows/deploy.yml` + `.cpanel.yml` staging
   (now `index.html src` only), `package.json` (dropped the `three` runtime dep →
   back to **devDeps only**), `package-lock.json`, `tools/gen-docs.mjs`,
   `deploy/DEPLOY.md`, and regenerated `ENCYCLOPEDIA.md` + `TREE.md`.
   `index.html` (raw WebGL2 → `src/main.js`) is now the **sole** front-end.
   Recoverable from git history if ever wanted back.

**Verified:** `node test/smoke.mjs`, `node --check` on all JS,
`node tools/gen-docs.mjs --check` (docs in sync). Deploy still ships `/Test/`.

## Session — 2026-06-19 (rule-injector hook — device-aware)

**Built the knowledge-system "rule-injector"** (was the top TODO in the
Knowledge & context section of `.claude/ROADMAP.md`):

- `.claude/hooks/inject-rules.sh` — **PreToolUse** hook (matcher `Edit|Write`,
  wired in `.claude/settings.json`). On an edit to `src/shaders/**`/`src/gl/**`
  it injects the **shaders** rule (mobile budget + write-our-own licensing) and
  on `src/audio/**` the **audio** rule, via `hookSpecificOutput.additionalContext`
  — so the load-bearing rules surface *before* the edit instead of relying on the
  agent to fetch them. Non-blocking (exits 0); no-op on other paths; degrades to
  a no-op if `jq` is missing.
- **Device-aware (operator's chosen requirement).** Grounding found the container
  exposes the operator's client via **`CLAUDE_CODE_ENTRYPOINT`** (this session =
  `remote_mobile`). The hook branches on it: phone → "no desktop perf rig / Tauri
  build here; lean on CI + defer real-device FPS to a venue test"; web / CLI
  variants. It always asserts the **playback** target is a phone GPU (why the
  budget is non-negotiable) and names the reviewer agent (`visual-qa` / `audio-dsp`).
- Decided via the new **`thought-based-reasoning`** skill (dogfooded): the key
  realization was that "device" splits into operator-device (detectable) vs
  playback-device (always mobile).

**Verified:** unit-tested the hook across shader/audio/gl/no-match paths and
mobile/web/cli device branches (correct rule, tailored note, valid JSON, clean
no-op); `settings.json` valid; smoke 12/12; `gen-docs --check` in sync.

**Knowledge-system items remaining (see `.claude/ROADMAP.md`):** drift gate +
fix the stale `deploy-cpanel` skill; PreCompact "update progress.md" reminder hook.

## Session — 2026-06-19 (client-side privacy: strip AI/tooling fingerprints)

**Operator requirement:** the deployed site must show **no proof it's AI-assisted**
and expose **no reachable AI** to visitors. Audited the deployed surface
(`index.html` + `src/` + `.htaccess` — the no-build static site is fully
View-Source-readable). No live AI endpoint exists (only same-origin look JSON
fetch; MCP server is dev-only, never deployed). Fixed three confirmed live leaks:

1. **Directory listing was OPEN** — `/Test/src/`, `/src/looks/`, `/src/shaders/`
   returned browsable indexes → added `Options -Indexes` to `deploy/.htaccess`.
2. **`/Test/.ftp-deploy-sync-state.json` was public (HTTP 200)** — the
   FTP-Deploy-Action's file manifest → added `<FilesMatch "^\.">  Require all
   denied` to deny dotfiles.
3. **AI-tooling fingerprints in deployed source** — `registry.js` comment named
   `tools/mcp/lib/looks.mjs`; `main.js` comment named `test/render-check.mjs`.
   Reworded both to tool-agnostic (the `@generated` marker is preserved — the
   `looks.mjs` regex matches `[^\n]*` after the marker, verified by smoke).

New durable rule in `.claude/rules/deploy.md` ("Client-side privacy") so a future
agent can't reintroduce fingerprints. **Note:** repo is private; commit trailers
carry `Co-Authored-By: Claude` → don't make it public without scrubbing history.

**Follow-ups:** gate `window.__primordial`/`__looks` so they're absent in prod
(touches the render-check test contract); a CI grep guard that fails if any
AI/tooling fingerprint reaches `index.html`/`src/` (fits the roadmap "drift gate").
**Verified:** smoke 12/12, node --check, fingerprint re-scan clean, gen-docs in sync.

## Session — 2026-06-19 (skills auto-registration + /find-skill)

**Goal:** adding a skill should auto-wire it into the workflow router and be
discoverable on the server, no hand-edits.

**Grounding result (saved work):** the **server side was already automatic** —
`SKILL.md` files are git-tracked markdown, so the MCP `search_docs`/`get_doc`
index and `ENCYCLOPEDIA.md` already include every skill (verified: `search_docs`
returns `perf-budget/SKILL.md` as the top hit). The only gap was the **router**.

**Built:**
- Each skill declares a frontmatter **`area:`** (`shaders` perf-budget · `looks`
  new-preset · `deploy` deploy-cpanel · `design` thought-based-reasoning · `meta`
  find-skill).
- **`gen-docs.mjs`** now regenerates a `@generated skills:router` **"Skills by
  area"** table inside the `CLAUDE.md` Knowledge router (markdown
  `<!-- @generated-start/end skills:router -->` markers; `updateRegion` leaves the
  file untouched if markers are absent — safe). `gen-docs --check` now also gates
  the CLAUDE.md region in CI.
- The existing **PostToolUse `gen-docs` hook** fires on any skill edit → the router
  block updates itself. Proven: adding `find-skill` auto-populated the table.
- **`/find-skill`** skill (`area: meta`) — manual trigger to re-sync + "which skill
  for task X?" discovery (leans on the MCP doc index that already covers skills).

**Decided (via thought-based-reasoning, dogfooded):** "server" = the MCP server,
already covered; chose the auto-block-in-CLAUDE.md approach (always-loaded) over a
separate SKILLS.md; deferred a dedicated `list_skills` MCP tool until the skill
count grows (skills scale cheaply — only the ~80–110-token description is always-on;
bodies load on demand).

**Verified:** generated block maps all 5 skills by area; `gen-docs --check` green
(incl. CLAUDE.md region); `node --check tools/gen-docs.mjs`; smoke 12/12.
