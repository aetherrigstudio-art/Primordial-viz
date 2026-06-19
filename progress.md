# Progress Log — primordial

## Open threads (parked - resume these; the `orient` hook surfaces them; `/park` adds them)

- [ ] **non-local RAG system (cross-project + global)** | want: a hosted (non-local) retrieval system that serves THIS project's knowledge AND a shared/global layer across the user's other projects, since workflows/info overlap and could be reused | needs: separation + access gates between per-project and global scopes (best architecture is TBD - user is unsure) | when resumed, BRAINSTORM the architecture: scoping/namespaces (per-project vs global), the gate/permission model, hosted vs self-hosted store + embedder, how it ingests this repo's docs (ENCYCLOPEDIA/TREE/rules/skills) and stays in sync, and whether it surfaces as an MCP server. Likely lives outside this repo (cross-project infra) but parked here for now | parked 2026-06-19

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

## Session — 2026-06-19 (skill-router rename + drift gate)

Grounded in the repo's Claude research (`findings.md §B`, `research/findings/mcp-*`).

**1. Renamed `find-skill` → `skill-router`** (avoids colliding with the popular
`npx skills` / `find-skills` community tool — vercel-labs/skills + skills.sh, which
*discovers/installs external* skills). Our skill is now scoped to its unique job —
the **local** in-repo router-sync + routing — and explicitly **defers external
discovery/install to `npx skills`** (with a license/supply-chain review note). The
generated `skills:router` note in CLAUDE.md and the gen-docs string now say
`/skill-router`.

**2. Drift gate (the recurring failure: docs drifted from reality twice).**
`gen-docs.mjs` now runs `checkRefs()` — backtick-quoted, **repo-rooted** paths in
`CLAUDE.md`, `deploy/DEPLOY.md`, `.claude/rules/*`, `.claude/skills/*` must exist;
`gen-docs --check` gates it in CI. **Conservative** (skips bare filenames, globs,
placeholders, vars, and — crucially — **fenced code blocks**, whose ``` fences
otherwise mis-pair the inline-code scan; that was a real bug found + fixed in
testing) so it never false-fails CI. Proven: it catches a dangling
`src/three/main.js` ref and is clean at rest.

**3. Fixed the first drift offender** — the `deploy-cpanel` skill: dropped the
nonexistent `assets/`, and it now leads with the automatic Actions-FTPS deploy
(manual cPanel is the full-site/homepage fallback).

**Decided via thought-based-reasoning (dogfooded):** complement `npx skills`
rather than compete; root the drift gate at known top-level entries for zero false
positives. Deferred: adopting the `npx skills` ecosystem (needs license review),
PreCompact hook, phone-resilient CLI-first discovery doc.

**Verified:** `node --check tools/gen-docs.mjs`; `gen-docs --check` green (docs +
CLAUDE.md region + drift gate); gate catches a dangling ref; smoke 12/12.

## Session — 2026-06-19 (adopt community skills via `npx skills`)

Used the real **`npx skills`** (vercel-labs, skills.sh) to discover community
skills — wide sweep across webgl/shader/audio/perf/a11y/deploy/security/testing/
docs. **Most of the ecosystem is wrong-stack for us** (three.js/R3F, React/
Tailwind, Firebase, Flutter, Go/Python, Vercel/Azure) — filtered hard.

**Adopted (vetted: read SKILL.md + license, markdown-only, no scripts):**
- `addyosmani/web-quality-skills@performance` — **MIT** (Lighthouse web perf).
- `addyosmani/web-quality-skills@accessibility` — **MIT** (WCAG 2.2; + WCAG/
  A11Y reference docs). Reinforces our existing a11y pass.
Installed with `--copy` (real files survive a container wipe) → `.claude/skills/
{performance,accessibility}/`; provenance + content hashes in `skills-lock.json`.

**Rejected (with reasons):**
- `anthropics/skills@webapp-testing` (first-party, safe) — but **Python**
  Playwright; mismatches our **JS** `render-check` + PHP-only host. Wrong stack.
- `useai-pro/openclaw-skills-security@skill-vetter` — **no license** + unverified
  OpenClaw provenance → fails its own (and our commercial) vetting gate.

**Infra:** the drift gate (`gen-docs checkRefs`) now **excludes adopted skills**
(those in `skills-lock.json`) — it polices OUR authored docs, not third-party
content whose example paths can collide with our dir names. Adopted skills
auto-register in the router under area `general` (the skill-router system handled
them with zero manual wiring).

**Adoption policy (durable):** treat every ecosystem skill as third-party —
read its SKILL.md, confirm MIT/CC0/CC-BY license, prefer markdown-only / no
scripts, prefer first-party (anthropics) or reputable (addyosmani) authors;
`skills-lock.json` records provenance. (More candidates still being curated —
user asked for a wider set.)

**Verified:** `gen-docs --check` green (incl. drift gate w/ adopted-skill
exclusion); router shows both new skills; smoke 12/12; CLAUDE.md 185 lines.

**Round 2 (wider sweep) — adopted 3 more (vetted license + content):**
- `anthropics/skills@frontend-design` — **Apache-2.0** (first-party; non-document
  skills are Apache-2.0); for the neon HUD / control surface. Ships `LICENSE.txt`.
- `addyosmani/agent-skills@debugging-and-error-recovery` — **MIT**.
- `addyosmani/agent-skills@documentation-and-adrs` — **MIT**.
Rejected `onewave-ai/...@color-palette-extractor` — **Tailwind**-oriented (wrong
stack) + no license + unknown author. **Now 10 skills total** (5 ours + 5 adopted,
all MIT/Apache, provenance in `skills-lock.json`). CLAUDE.md 188 lines — the
always-loaded `skills:router` block is the growth driver; if it nears 200, move
the generated block to a linked file. **Verified:** `gen-docs --check` green;
smoke 12/12.

**Round 3 (meta/workflow tier) — adopted 4 (all license-vetted, commercial-OK):**
- `obra/superpowers@brainstorming` — **MIT** (232K installs). HARD-GATE "design
  before implementing." ⚠️ shipped a `scripts/` **local WebSocket server** +
  telemetry-named flag + a remote brand-image URL — diligence showed **no data
  egress** (the flag only toggles branding; the server is an optional localhost
  visual UI). For our lean/privacy/phone-driven repo we **stripped `scripts/` +
  `visual-companion.md`** (kept the standalone methodology; added an adaptation
  note). MIT permits the modification.
- `obra/superpowers@writing-plans` — MIT. Plan/spec discipline.
- `warpdotdev/common-skills@spec-driven-implementation` — MIT (Warp). PRODUCT.md/
  TECH.md spec-first workflow.
- `anthropics/knowledge-work-plugins@task-management` — **Apache-2.0** (first-party).
Rejected the overlap set (planning-with-files, critical-thinking, obra
systematic-debugging, deep-research) — duplicate our own systems / a built-in.

**Now 14 skills** (5 ours + 9 adopted). **ALL skills are markdown/license only —
no third-party executable code in the repo** (verified). User is fine with up to
~30 skills.

**Scaling fix:** the always-loaded `skills:router` block is now a **compact
routing map** (one line per `area`, skill names only — descriptions are already
injected each session by the harness, so the old per-skill table was redundant).
CLAUDE.md **192 → 182 lines**; the block now grows ~1 line per new area, so it
scales to 30+ skills without nearing the 200-line cap.

**Verified:** `node --check tools/gen-docs.mjs`; `gen-docs --check` green (docs +
compact region + drift gate); smoke 12/12.

## Session — 2026-06-19 (correct brainstorming + adopt the superpowers workflow)

**Corrected the brainstorming call:** the privacy boundary is the **deployed
website**, not local dev tooling — `.claude/` never ships (deploy stages only
`index.html src`) and the repo stays private. So the optional localhost,
token-authed visual-companion server is fine (and potentially useful). **Restored
brainstorming to pristine** (scripts + `visual-companion.md` back).

**Adopted 9 of the 14-skill `obra/superpowers` bundle (MIT)** — a coherent
agentic-dev lifecycle: `systematic-debugging` (151K — supersedes our adopted
`debugging-and-error-recovery`), `verification-before-completion` (= our
evidence-before-assertions ethos), `test-driven-development`, `executing-plans`
(completes brainstorm→plan→execute), `finishing-a-development-branch`,
`requesting-code-review`, `receiving-code-review`, `dispatching-parallel-agents`,
`writing-skills` (complements `skill-router`).
**Skipped (reasons):** `using-superpowers` (forces skill-invocation before every
response → conflicts with our orient hook + router), `using-git-worktrees` (low
value in ephemeral cloud), `subagent-driven-development` (overlaps
`dispatching-parallel-agents`).

**Support scripts vetted benign** (user OK'd local scripts in the private repo):
`writing-skills/render-graphs.js` (shells to local `dot`/graphviz),
`systematic-debugging/find-polluter.sh` (test-pollution bisector) — no network.

**Now 23 skills** (5 ours + 18 adopted, all MIT/Apache; provenance in
`skills-lock.json`). Compact router held CLAUDE.md at **182 lines**.

**Open follow-ups:** (1) the 18 adopted skills all sit under area `general` —
**area-tagging** them (debugging/planning/review/testing/design/docs) would make
the router a real map; (2) optional prune of `debugging-and-error-recovery`
(superseded by `systematic-debugging`). **Verified:** `gen-docs --check` green;
smoke 12/12.

## Session — 2026-06-19 (corrections: subagent-driven-development + Context7)

- **Adopted `obra/superpowers@subagent-driven-development`** (MIT) — corrected an
  earlier bad call: it does NOT overlap `dispatching-parallel-agents`
  (parallelize independent tasks) — it's a methodology for **executing an
  implementation plan via subagents in the current session**. Different tool.
  Bundled scripts (`task-brief`, `sdd-workspace`, `review-package`) are benign
  local bash (no network).
- **Adopted Context7 (user request — "try it out"), set up BOTH ways:**
  - Skill `upstash/context7@find-docs` (**MIT**) — uses the `npx ctx7` CLI, so it
    works even when cloud sessions don't load `.mcp.json` (#54441). Installer
    rated it **Med Risk** (runs an external CLI + network — inherent to a remote
    doc service, not malicious).
  - MCP server `context7` → added to `.mcp.json` (`https://mcp.context7.com/mcp`,
    keyless free tier; `CONTEXT7_API_KEY` header for higher limits later).
  - **Why now** (vs the original defer in `mcp-adoption.md`): the repo now has
    build/desktop devDeps (vite, @tauri-apps/cli, playwright, zod, MCP SDK) whose
    versioned docs Context7 covers and MDN doesn't. Reconciled `mcp-adoption.md §3`.
  - ⚠️ **Privacy:** Context7 queries go to Upstash — **public-library docs only,
    never proprietary shader code or secrets** (the skill warns this too).
  - **Trust dialog** expected on next launch (new MCP server; post-CVE no silent
    self-approve). Approve `context7` to use the MCP path.

**Now 25 skills** (5 ours + 20 adopted) + 3 MCP servers (mdn, context7, primordial).
**Verified:** `.mcp.json` valid JSON; `gen-docs --check` green; smoke 12/12.

## Session — 2026-06-19 (privacy soften · accuracy rule · automatic workflows)

Four things, the last two designed *with* our own skills (dogfooded):
1. **Softened the client-side privacy rule** (`rules/deploy.md`) — scoped to the
   **deployed site only**; `.claude/`, `tools/`, scripts, MCP, private repo are
   out of scope. "Lock down what's served; relax for everything local."
2. **Area-tagged all 20 adopted skills** → the `skills:router` is now a real map
   (debugging/planning/review/testing/ui/perf/docs/research/workflow/meta).
3. **Accuracy rule** (CLAUDE.md, always-loaded) — corrects my recurring
   "assert-the-unverified" failure: label guesses; read both before claiming
   overlap/equivalence; ask/check for intent & rule-scope; verify before "done".
   Reasoned via `thought-based-reasoning`.
4. **Automatic skill-workflow system** — designed via `brainstorming`, planned via
   `writing-plans` (plan in `docs/superpowers/plans/`):
   - `.claude/workflows.md` — named chains: **feature** (brainstorming→writing-plans
     →executing-plans→TDD→verification→code-review→finishing-branch) and
     **new-look** (new-preset→perf-budget→visual-qa→verification).
   - `workflow` skill (area `meta`) — drives a chain with each step's gates.
   - `.claude/hooks/suggest-workflow.sh` (**UserPromptSubmit**) — detects
     feature/look intent and injects a **non-blocking** nudge (unit-tested:
     catches build/implement/preset/new-look; silent on "take a look"/unrelated).
   - Wired in `settings.json`; surfaced in the router + `orient` hook.
   The chains bake in the anti-assumption gates (design-first, verify-before-done),
   so the workflow system reinforces #3.

**Now 26 skills.** ⚠️ **CLAUDE.md is at 197/200** — next addition crosses the cap;
the slim (move the generated `skills:router` block to an imported file) is the
next maintenance step. **Verified:** settings.json valid; both hooks valid bash;
`gen-docs --check` green (incl. drift gate); smoke 12/12; hook intent-detection
unit-tested.

## Session — 2026-06-19 (self-improvement tooling: parking lot + learn-from-corrections)

Built the self-improvement loop's capture machinery, plus support tooling:
- **`deploy-check`** skill - one-pass deploy health (latest Actions run -> failing
  logs -> FTP_PASSWORD secret -> curl live /Test/ -> concise root cause). From the
  /insights report.
- **`send-report`** skill - SendUserFile the newest /insights report (the
  `file:///root/...` link is unreachable on mobile; /insights itself is built-in).
- **Site audit** (`tools/audit-site.mjs`, `npm run audit`, CI step in verify.yml,
  step in deploy-check) - flags em/en dashes (AI writing tell) + AI/tooling
  fingerprints in the deployed surface (index.html + src/). Fixed 3 existing em
  dashes (page <title> + 2 CSS comments) -> hyphens.
- **Parking lot** - `/park` skill + `## Open threads` section in progress.md +
  `orient` surfacing, so a thread interrupted by a subject change resumes reliably
  with full context next session.
- **Learn-from-corrections (loop #1)** - `/lesson` skill (routes a correction to
  its durable home: sharpen the always-loaded `accuracy` rule / fix the source
  doc / note it) + `detect-correction.sh` UserPromptSubmit hook (nudges on a
  correction; specific phrases only, never bare "no"; unit-tested). Designed via
  brainstorming, planned via writing-plans (plan in `docs/superpowers/plans/`).

**Now 30 skills.** Loop status: sense (insights/audits) + diagnose + fix + remember
(corrections->rules, parking) all have machinery now. **Verified:** both new hooks
valid + unit-tested; settings.json valid; `gen-docs --check` green; smoke 12/12;
site audit clean.
