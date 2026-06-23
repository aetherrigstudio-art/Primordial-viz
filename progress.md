# Progress Log — primordial

## HANDOFF — 2026-06-23 (immersive instrument-handoff: built · reviewed · shipped to preview · merged) — RESUME HERE
Branch `claude/immersive-instrument-handoff` → merged to `main`; phone-openable preview live.

**Built — the immersive page's end-state instrument (ADR-013).** At `travel===1` the rainforest
Gaussian-splat scene BECOMES the live audio-reactive, performer-controllable instrument INSIDE the
R3F app (operator-directed; a scoped supersession of ADR-012's end-state — NOT a handoff to the
raw-WebGL2 `src/` app). New under `immersive/src/`: `audio/*` (mic + AnalyserNode bands + 512×2 audio
texture + `BeatClock` beat/bar/downbeat — re-authored from `src/audio/*`, no cross-app import),
`splat/{reactiveModifier,useReactiveSplat,semanticMask}` (Spark `dyno` `worldModifier` reactivity —
`updateGenerator()` ONCE / `updateVersion()` per frame), `control/*` (params schema + store + targets
seam; keyboard baseline, MIDI/OSC flagged off), `mode/*` (travelDriver + one-way instrument latch +
skip fast-forward + beat-synced waypoint camera). Wired in `App.jsx` + `SparkScene.jsx`.

**Knowledge captured (RAG corpus):** `docs/decisions/013-instrument-in-r3f.md`,
`docs/design-system/INSTRUMENT-HANDOFF.md` (verified Spark dyno API + architecture),
`docs/tooling/antigravity-qa.md`, `research/reuse-libraries/REUSE-CATALOG.md`, + an esbuild-bundle
reconcile lesson in `.claude/rules/gotchas.md`. Index rebuilt off-device by `rag-index.yml` on merge.

**agy (Antigravity CLI):** `.claude/agy-setup.sh` restores it after a cloud wipe — 4 MCP servers
(context7, mdn, primordial, notebooklm via a zero-dep wrapper) + a PostToolUse verify hook. **KEY:
the agy CLI has NO browser/WebGL2 tool** — visual QA is the Antigravity IDE or CI, NOT the CLI.

**CI / phone QA:** `immersive.yml` builds → headless WebGL2 screenshot → **deploys a phone-openable
preview** to `https://primordial.video/Test/immersive/` (`VITE_BASE` drives build+preview; reuses the
Test@ FTP account). Open it on a phone — real mobile GPU is the true QA.

**Reviewed + fixed:** a budget-tiered adversarial review workflow found 19 issues; applied the
verified fixes (`2ffaa20`) — bias compounding, AudioContext leak, the preview-base bug, +14 more. No
critical blockers.

**Roadmap:** consolidated out-of-scope + parked-threads roadmap in the plan file (Tracks 0–5).
**Appalachian aesthetic is LOCKED for both** the rainforest splat generation (`rainforest-asset-spec.md`
— explicit Appalachian species + a no-tropical negative prompt) AND the new ambient fallback playlist
(Track 1.9 — curated CC0 Appalachian folk/old-time-ambient + temperate-forest field recordings; NOT tropical).

**Next:** (1) the gated immersive build sequence — arrow-nav rewrite (`travel` is a stub) → Theatre.js
journey choreography + focus stations → real Appalachian `.spz` assets (operator, off-device) → drapery
flutter animation → content slots → MIDI/OSC enablement → atmospherics. (2) Build the Appalachian ambient
playlist (Track 1.9): shortlist CC0 tracks → operator approval → wire the mechanism.

**Gotchas:** agy CLI has no browser (QA = phone preview / CI / Antigravity IDE); for large multi-agent
tasks use the budget-efficient pattern (batch-verify per dimension, tiered effort — auto-memory); the
root `package-lock.json` has a pre-existing uncommitted change left untouched.

## HANDOFF — 2026-06-22 (immersive build + subagent-orchestration)
Branch `main`, everything pushed. Big session — current state + the next moves:

**Live now (committed/pushed):**
- **`immersive/`** — standalone Vite + R3F + Spark proving ground: multi-splat composite (drapery +
  rainforest) via `useSplatLayer` (placeholder→real swap + fallback), off-axis camera, no-sensor
  arrow-nav stub, mobile-budget guards. Heavy builds run OFF-DEVICE (CI `immersive.yml`); on-device
  verify = `node --check` + the esbuild bundle smoke; render QA = Antigravity. Reference: `docs/design-system/IMPLEMENTATION.md`.
- **Asset recipes** — drapery via TRELLIS (one-tap HF Space); rainforest via **Veo 3.1** → COLMAP →
  `splatfacto-big` → SuperSplat. Specs: `docs/design-system/{rainforest-asset-spec.md,colab/*}`.
  Real `.spz` are operator-generated OFF-DEVICE → drop in `immersive/public/assets/` (gitignored).
- **Subagent-orchestration system** — `.claude/rules/immersive.md` (routed + auto-injected on
  `immersive/**`); 6 specialist agents (splat-graphics/motion-choreography/interface-design/splat-asset
  + design-reviewer/perf-a11y-reviewer); hooks: SubagentStart context (`subagent-context.sh`) + a
  triage router (`route-request.mjs`/`subagent-route.mjs`/`lib/triage.mjs`) + SubagentStop verify
  reminder (`subagent-verify.sh`); `immersive-page` workflow; 13 `permissions.allow` rules.
- **RAG** — `IMPLEMENTATION.md` in the corpus; off-device reindex CI (`rag-index.yml`) keeps
  `index.json` fresh (embedder/onnxruntime can't run on Termux); drift gate is warn-only.
- **MCP** — primordial-http handshake fixed + auto-starts locally.

**Next — the page build, in order:**
1. **Merge the cloud arrow-camera PR** (no-sensor arrow nav) — it rewrites CameraRig/App; the journey builds on it.
2. **Journey choreography** (Theatre.js scrubbed by `travel`; no GSAP ScrollTrigger) — implement after the arrow PR.
3. **Generate the real splats** (operator, off-device via the runbooks) → swap into `immersive/public/assets/`.
4. **Instrument handoff** at journey's end (the live audio-reactive visualizer) — separate increment.

**Env:** root Termux, no GPU, HTTPS-443 only; heavy builds / RAG embedder / Chromium are OFF-DEVICE
(CI / Antigravity); only committed files survive. `npm run health` green (RAG warn-only).

## HANDOFF — 2026-06-22 (design-system / point-cloud landing page) → read `docs/design-system/HANDOFF.md`

Started the **immersive point-cloud landing-page** effort + a multi-tool build pipeline.
**Full next-agent onboarding: `docs/design-system/HANDOFF.md` (read first).** Highlights:
- PLAN refined to point-cloud (`docs/design-system/PLAN.md`); build workflow + Colab
  asset-gen runbooks (`BUILD-WORKFLOW.md`, `colab/{drapery-trellis,forest-video-splat}.md`).
- Research via **NotebookLM CLI (now working on-device)**: notebook `688cc151` (239+
  sources) + a "Build Spec" Doc — WebGL landing pages, splat composite/animate/relight/
  motion, and generating assets without capture.
- Decisions: **D-COMPUTE = free/rented cloud GPU (Colab)**; **generate-don't-capture**
  (drapery→TRELLIS 2, rainforest→AI-video→Splatfacto); stack = Spark/PlayCanvas +
  Theatre.js/GSAP, `.SPZ`/`.SOG`, global-buffer merge, LBS/semantic-mask, proxy-mesh+PCSS,
  200–500K splat budget.
- **Env foot-guns:** Claude Code is **root in Termux** (no `pkg`/proot as root); device
  runs **hot (84 °C peak)** → one heavy tool at a time; `notebooklm`/`sysguard`/`mem`/
  `temp` live in home dotfiles (NOT git-tracked).
- Commits **LOCAL, not pushed:** this repo `c2d0807`; AI_Workspace `39e644c`.
- **Open gates:** generate first asset (drapery/TRELLIS), Gemini API key, start web build
  vs a placeholder splat, push.

## Session — 2026-06-22 (subagent-orchestration system + request-triage router hooks)

Built the consistent subagent-orchestration scaffolding for the immersive page, extending the proven
instrument pattern (rules + inject-rules + specialist agents + workflow chains). Plan:
`melodic-hatching-penguin` (approved).

- **Context hooks:** `subagent-context.sh` (SubagentStart) injects the page-build orientation into every
  spawned subagent; `orient.sh` got an immersive-page pointer line. (SubagentStart confirmed to inject
  context via the claude-code-guide agent.)
- **Request-triage router (hybrid):** `lib/triage.mjs` (shared heuristic router → persona/skills/tools/
  docs + context-gap + effort hint, escalates a self-triage directive on ambiguous/complex input) used by
  `route-request.mjs` (UserPromptSubmit) AND `subagent-route.mjs` (SubagentStart, on the subagent's task).
  Node hooks (no jq — the existing jq-gated hooks no-op on this Termux device). Honest limit: hooks
  INJECT context, they can't set effort or bind tools — they recommend, the model acts.
- **Area rule:** `.claude/rules/immersive.md` (architecture · off-device build · mobile budget ·
  write-our-own licensing), routed in CLAUDE.md + injected by `inject-rules.sh` on `immersive/**` edits.
- **Specialist agents** (`.claude/agents/`, mirror visual-qa/audio-dsp): `splat-graphics`,
  `motion-choreography`, `interface-design`, `splat-asset` (impl) + `design-reviewer`,
  `perf-a11y-reviewer` (review). Instrument's visual-qa/audio-dsp unchanged.
- **Workflow:** `immersive-page` chain in `.claude/workflows.md` + `suggest-workflow.sh` trigger.
- **Approvals — APPLIED:** `permissions.allow` widened with the page-build command set
  (esbuild · npm run · git add/commit/status/diff/log/push/fetch · gh run/workflow). The auto-mode
  guard treats agent self-modification of permissions as a hard boundary — it denied verbal/"yolo"
  authorization three times; only the operator's **explicit per-rule `/update-config`** naming each rule
  cleared it. Lesson: widening own permissions requires the operator to name the exact rules.

**Verified:** `node --check` all hooks; `bash -n` the shell hooks; settings.json valid; gen-docs
regenerated (new rule + agents); route-request pipe-tests correctly + silent on trivial; `npm run health`
all-green (RAG warn). New hooks may need `/hooks` reload to activate in this session. UNCOMMITTED until
this commit.

## Session — 2026-06-22 (RAG: implementation knowledge + off-device reindex; doc-drift fix)

Added implementation knowledge to the RAG and fixed accumulated drift gates.
- **New `docs/design-system/IMPLEMENTATION.md`** — our-own-words build reference (Spark
  SparkRenderer/SplatMesh/SplatLoader API, multi-splat composite + `useSplatLayer`, R3F/Theatre.js
  scrubbing, the TRELLIS/Veo-3.1/Splatfacto asset pipeline, env constraints). Corpus-eligible
  (`docFiles()` = git-tracked `*.md` minus the two scrape dirs).
- **Off-device reindex:** the RAG embedder (`@huggingface/transformers` → `onnxruntime-node`) has
  **no Android arm64 binary**, so the index can't be rebuilt on the dev device. New
  `.github/workflows/rag-index.yml` rebuilds `tools/rag/index.json` on a linux runner on every
  docs-push to main and commits it back. The RAG drift gate in `verify.yml` + `tools/health.mjs` is
  now **warn-only** (a hard gate requiring the embedder can never pass on the phone).
- **Fixed pre-existing drift:** earlier session commits (immersive/ + design-system docs) never
  regenerated the derived docs or reindexed → `gen-docs --check` AND the RAG gate were red on main.
  Regenerated ENCYCLOPEDIA/TREE/AGENTS/GEMINI; `npm run health` now all-green (RAG warns).

**LESSON:** run `npm run health` (not just `node --check` + esbuild) before pushing — I shipped
several immersive commits this session without it and left two drift gates red on main. Fixed here.

**Verified:** `node tools/health.mjs` → all local gates pass (RAG warn). The committed index is
refreshed off-device by the new workflow on push. UNCOMMITTED until this commit.

## Session — 2026-06-22 (rainforest asset GENERATION recipe — Ultraplan-approved)

Built out the rainforest *generation* so the output is a realistic, dense, blooming Appalachian
rainforest. Realism is set upstream (video-gen prompt + reconstruction params), not in app code, and
the heavy steps are off-device — so the deliverable is an engineered recipe + spec the operator runs.

- **New `docs/design-system/rainforest-asset-spec.md`** — art direction grounded in the experience
  doc's Appalachian botanical catalog (laurel/rhododendron/azalea/hydrangea/trillium/dogwood/ferns/
  moss; golden dappled light; god-rays; haze), an **engineered prompt library** (3 variants +
  negative) tuned for BOTH photoreal bloom AND clean 3DGS reconstruction (one continuous slow move,
  deep focus, no motion blur, steady light, parallax), an acceptance checklist, a failure→fix
  iteration loop, and drafted NotebookLM research queries.
- **Hardened `colab/forest-video-splat.md`** for density: `splatfacto-big` + verified flags
  (`cull_alpha_thresh=0.005`, `continue_cull_post_densification=False`, `use_scale_regularization=True`
  — confirmed via docs.nerf.studio), higher `--num-frames-target 300`, sky-masking note, SuperSplat
  floater-cleanup + decimate-to-budget; points step 0 at the spec.
- **Enriched `placeholderRainforest.js`** — ~12% bloom flecks (pink laurel/rhododendron, white
  hydrangea, coral azalea) so the proving ground previews the blooming target, not flat green.

**Verified on-device:** `node --check` + esbuild full bundle 0 errors (placeholder change); docs are
markdown (no build impact). Research routed to NotebookLM (`688cc151`) per spend discipline — queries
drafted in the spec; one bounded find-docs check done (splatfacto-big). Plan:
`melodic-hatching-penguin` (Ultraplan-approved, teleported back). UNCOMMITTED.

## Session — 2026-06-22 (immersive — Appalachian rainforest splat wired, multi-splat composite)

PLAN §7 step 5 (app side). **Reconciled a research error against the source:** an Explore pass
concluded "no rainforest splat is needed — it's just the instrument." The authoritative experience
doc (`WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md` 47–56, 161–164) is explicit: the page composites
**captured drapery AND a captured rainforest** splat, with the audio-reactive instrument as the
visualizer *at the very end*. So the rainforest splat is real + distinct from the instrument.

**App wiring (mirrors drapery, refactored to multi-splat):**
- `SparkScene.jsx` → multi-splat holder: one `SparkRenderer` composites layers via global-buffer
  merge (Spark supports multiple `SplatMesh` under one renderer — verified via its multiple-splats
  example). Rainforest = enclosing env (z≈-8, scale 3); drapery = foreground (z≈-3).
- New `useSplatLayer.js` — shared placeholder→real swap + dispose + fallback hook; both drapery and
  rainforest now use it (factored the step-2 logic out of SparkScene). New `transform.js` applies
  each layer's `*_TRANSFORM`.
- New `loadRainforest.js` (+ `RAINFOREST_TRANSFORM` knob) and `placeholderRainforest.js` (procedural
  hollow-corridor mossy volume). `loadDrapery.js` refactored to expose `makeDraperyPlaceholder`.
- `rainforest.spz` gitignored already (`*.spz`); documented in `public/assets/README.md`.

**Runbook hardened** (`colab/forest-video-splat.md`): two paths — official Nerfstudio Colab
(recommended; handles the fragile CUDA install) + verified manual cells (torch 2.1.2+cu118 →
tiny-cuda-nn → nerfstudio → COLMAP; ns-process-data/ns-train splatfacto/ns-export, confirmed via
docs.nerf.studio). Flagged: **no one-tap Space for scene capture** (vs drapery's TRELLIS) → rented
GPU (D-COMPUTE) or the official Colab; ~15k iters can exceed a free T4 session.

**Verified on-device** (no assets → both layers fall back to placeholders): `node --check` the 5
splat modules; esbuild full bundle 0 errors. Real-render/composite QA → Antigravity once assets
land. Plan: `melodic-hatching-penguin`. Still LOCAL/unpushed. **Deferred:** flutter/reveal
choreography (Theatre.js/GSAP) + the instrument handoff at journey's end.

## Session — 2026-06-22 (immersive Step 2 — real drapery swap-in wired)

PLAN §7 step 2: wired loading the real drapery splat with **graceful placeholder fallback**. New
`immersive/src/splat/loadDrapery.js` — `new SplatLoader().loadAsync('/assets/drapery.spz')` →
`SplatMesh` (export verified via context7) + a `DRAPERY_TRANSFORM` calibration knob (real TRELLIS
splats arrive at arbitrary scale/orientation). `SparkScene.jsx` now renders the placeholder on the
first frame, swaps in the real splat on load (disposing buffers), and falls back to the placeholder
when the asset is absent (fresh clone / CI / pre-generation). The asset is **not committed** —
`immersive/public/assets/*.{spz,sog,ply,ksplat}` gitignored; `public/assets/README.md` documents the
source (drapery runbook), host upload, and the transform knob.

**Verified on-device** (no asset → fallback path): `node --check loadDrapery.js`; esbuild full
bundle 0 errors (confirms `SplatLoader` export + the graph resolves). Real-render QA + transform
tuning go to Antigravity once the operator generates `drapery.spz`. Plan:
`melodic-hatching-penguin`. The cloud arrow-camera PR (step-1 refinement) is independent — it
doesn't touch `splat/*`, so the two compose. All this session's work is still LOCAL/unpushed.

## Session — 2026-06-22 (immersive render pipeline — proving-ground scaffolded)

Started BUILD-WORKFLOW Phase 2 / PLAN §7 step 1: prove the point-cloud render + camera
pipeline against a **placeholder splat**, in parallel with (not blocked on) GPU asset capture.

**Stack verified via context7** (not memory, per PLAN): **`@sparkjsdev/spark`**
(`/sparkjsdev/spark`) — three.js-native Gaussian-splat renderer; `SparkRenderer` shares
R3F's `gl`, `SplatMesh` is an `Object3D` (→ `<primitive>`), loads `.spz`/`.ply` + builds
procedural `PackedSplats` (placeholder needs no binary asset). **`@react-three/fiber`** v9 +
three r0.171.

**Built `immersive/`** (standalone Vite + R3F app, separate from the no-build root `src/` so
its React/three deps never tangle; graduates into the Vite library-mode build for `/design-sync`
per PLAN §6, ADR-012):
- `src/splat/{placeholderSplats.js,SparkScene.jsx}` — procedural drapery cloud + SparkRenderer.
- `src/camera/{offAxisFrustum.js,CameraRig.jsx}` — off-axis "window into depth" + forward dolly.
- `src/viewpoint/useViewpoint.js` — gyro + scroll + pointer → smoothed ref (no webcam; iOS gyro via tap).
- `src/perf/mobileBudget.js` — DPR cap, frame-time regression, pause-on-hidden, reduced-motion.
- `src/App.jsx` — Canvas + mandatory start gate + reduced-motion tier. `README.md` documents it.

**Off-device build server:** `.github/workflows/immersive.yml` (GitHub Actions, ubuntu) installs
+ builds the app on push — the real off-device compute for the heavy build (and later the library
build + `/design-sync` grading). Root-Termux **cannot** run the Vite/Rollup bundle: Rollup's native
`rollup-android-arm64.node` can't `dlopen` here (ERR_DLOPEN_FAILED) — a known Termux/PRoot limit,
which is exactly why builds belong on CI.

**Verified on-device:** deps install clean (81 pkgs, pure JS); all 4 framework-agnostic modules
pass `node --check`; **esbuild bundles the whole module graph (3.4 MB, zero errors)** — JSX compiles
+ every import (react/three/R3F/Spark) resolves. NOT verifiable here: GPU render (→ Antigravity
browser, BUILD-WORKFLOW Phase 4) and the production Rollup bundle (→ CI).

**Decisions:** D-SPLAT-MOTION v1 scope locked (cross-fade + camera + drape-subset anim; defer true
relighting). **Still open:** D1 palette + D2 type (deferred — not needed until the diegetic UI/token
layer). **D-COMPUTE provider/budget** still open — GPU splat-training server can't be started from
this container (no GPU, HTTPS-443-only, costs money); free-Colab runbooks exist (`colab/*.md`).

**Next:** Theatre.js/GSAP journey choreography · fallback tier · diegetic UI + a11y mirror ·
graduate to the library build. Commits LOCAL (unpushed). Also uncommitted from earlier this session:
`tools/mcp/server.mjs` (HTTP handshake fix) + `.claude/hooks/mcp-http.sh` (auto-start local).

## Session — 2026-06-21 (merged RAG visual-reference notes from a parallel branch)

A parallel session ran on `claude/brief-bzwlzk` (forked before the audit-execution
work) and produced two things: a SessionStart deps hook (a **duplicate** of this
branch's `cf9a873` — dropped, this branch's version is the truth) and curated
**WebGL/WebGPU creative technique notes** for the RAG corpus. Per operator direction
("their version is the truth, merge to it carefully"), this branch
(`claude/audit-brief-execution-xur28z`) is canonical; only the net-new artifact was
folded in:

- **`research/visual-references/webgl-creative-technique-notes.md`** — our-own-words
  technique notes from 13 verified creative WebGL/WebGPU projects (Aurelia,
  curtains.js/gpu-curtains, Igloo Inc, DRIFT, Troika, Motion GPU, Gemini, Pixel
  Vault, Find Your Way to Oz, Mapillary, Shader.se, Patina, Ameen Abdullah) + 2
  flagged UNVERIFIED (Drage, Banati). Each: what it is, core technique, transfer to our stack, relevance,
  verified source + license. Reference-study only (write-our-own rule); reusable MIT
  ones noted (curtains.js, gpu-curtains, Troika, mapillary-js).
- Derived files regenerated on THIS branch's base: `ENCYCLOPEDIA.md`, `TREE.md`, and
  the RAG index (`tools/rag/index.json`, rebuilt → my doc surfaces #1 for visual-
  technique probes). The duplicate session-start hook + settings/index churn from the
  other branch were NOT brought over.

**Verified:** `npm run health` all gates green; probe "audio reactive particle field"
→ the new doc at 0.77. `claude/brief-bzwlzk` is now superseded by this merge.

## MILESTONE — 2026-06-20 (cross-agent Drive handoff channel — LIVE)

Established the **two-agent collaboration channel** for the Primordial Studio
wedding landing page, with **Google Drive as the shared layer**:
- **DESIGN agent** = claude.ai/design session (produces the HTML/look).
- **CODE agent** = this Claude Code session in `Primordial-viz` (builds/deploys).

Drive folder **"Primordial Studio — Design Handoff"**
(`1wd9VRtTRx0xF8HQ7koLASEOeBh0TZmmv`) holds the protocol + both sides of the loop:
- `HANDOFF` doc (protocol/conventions: newest file wins, never overwrite, bump
  `-vN`; design tokens live in the HTML `:root`; assets go in `/assets/`).
- `/from-design/` — DESIGN drops new HTML versions + NOTES.
- `/from-code/` — **created this session** (CODE agent's side); seeded
  `STATUS.txt` confirming the channel.
- `Primordial Studio - Weddings.html` — **v1 design** (25 KB) in the folder root.

**Verified from this session:** the CODE agent (me) has **read AND write** access
to the folder via the `mcp__Google_Drive__*` tools — read the v1 HTML + HANDOFF,
and wrote `/from-code/` + `STATUS.txt`. So the loop is fully wired both ways.

**Gotcha logged:** the DESIGN session hit a transient *"Error in input stream"* +
a Google Drive internal-error-on-create while compiling its question log — both
transient; retry clears them. That compiled-questions doc lives only in the
DESIGN session's history (not visible to the CODE agent).

**Next:** on the operator's go, pick up the newest `/from-design/` HTML (currently
v1 in root), review vs the mobile-perf + a11y rules, then integrate into the repo
(the parked frontpage thread — `workshop/sketches/frontpage/BRIEF.md`) and open a
PR, recording the PR link in `/from-code/STATUS.txt`.

## Session — 2026-06-20 (branch rescues: portfolio + whats-next → main)

Checked all remote branches; 7 were fully merged, 2 had unmerged work — both
rescued into `main`:
- **Portfolio (sub-project #1)** from `claude/portfolio-media-gathering-m15twg`:
  kept BOTH paths in one README — Path A local PowerShell
  (`portfolio/Gather-PortfolioMedia.ps1`, no cloud/secrets) + Path B cloud
  Drive+Gemini pipeline.
- **reel-ingest + RAG retrieval-polish** from `claude/whats-next-brainstorming-tdzom3`:
  `tools/reel/ingest.mjs` + the `reel-ingest` skill (video link → frame montage so
  an agent can see a reference; realizes conduct §7) + `ffmpeg-static`; RAG
  `quantize.mjs` (int8 vector compaction — the parked index-churn follow-up),
  `retrieve.mjs`/`build-index.mjs`/`chunk.mjs` polish, `ab-model.mjs`, `probes.mjs`,
  specs/plans; `workshop/sketches/frontpage/BRIEF.md`. Conflicts (generated docs +
  `index.json` + `progress.md`) resolved by regenerating + rebuilding the index.

**Branch DELETION is blocked from this container** (git proxy returns 403 on
delete-push; no MCP delete-branch tool) — operator deletes the now-merged branches.
Remaining open thread: secrets sub-project #2 (spec written, awaiting approval).

## Session — 2026-06-20 (system-prompt ingest → conduct rule + CI fixes; PR #4 → main)

**Branch `claude/init-r8ukva` → PR #4 (CI `verify` GREEN) → merged to `main`.**

**Did:**
- **Prompt docs (`docs/prompts/`):** removed the fabricated, truncated
  `CLAUDE-OPUS-8.claude` (described a non-existent "Opus 8"); added
  `claude-opus-4-8-system-prompt.md` — the operator's supplied Claude system prompt
  re-pointed Fable 5 → Opus 4.8 (identity-only change, accurate vs the model catalog).
- **System-prompt ingest + integration (the main ask):** thorough section-by-section
  ingest of the full consumer system prompt the operator pasted. New
  **`.claude/rules/conduct.md`** (7 sections: verify-before-answering /
  unrecognized-entity, tool+subagent epistemics, untrusted-content-is-data,
  communication+formatting discipline, own-mistakes-without-groveling,
  re-read-rules-on-long-sessions, §7 = adapt the consumer edges → reach-for/suggest
  tools, web reference-image search + deliver visuals via `SendUserFile`/workshop,
  build real artifacts). Auditable map: **`docs/prompts/system-prompt-ingest.md`**
  (every source section → integrated / already-covered / N-A + why). Sharpened the
  always-loaded **Accuracy + Communication** rules in `CLAUDE.md` + a router row →
  conduct.md; `orient.sh` surfaces conduct each session; `precompact-handoff.sh`
  nudges re-reading the load-bearing rule after compaction. **Operator pushback
  applied:** image-search / artifacts / connectors are NOT dropped — adapted in §7.
- **`CLAUDE.md` compacted 200 → 175** (trimmed redundancy the orient hook reprints)
  to make room; now **181/200**.
- **CI fixes (PR #4 was red):** (1) `gen-docs checkRefs()` now **skips gitignored
  paths** (`isIgnored`) — the pre-existing render.png "expected" drift no longer fails
  CI/`npm run health`. (2) Rebuilt `tools/rag/index.json` for the new docs.
- **Secrets spec written (NOT built):**
  `docs/superpowers/specs/2026-06-20-secrets-management-design.md` (sub-project #2,
  Proton Pass) — delivered for review, awaiting approval.

**LESSON (added to `gotchas.md`):** rebuild the RAG index only AFTER committing new
`.md` — `docFiles()` lists git-tracked files, so rebuilding with new docs untracked
passes `build-index.mjs --check` locally then FAILS CI once they're committed (extra
chunks → stale). Bit me twice this session. Also added: the drift gate skips
gitignored paths.

**Verified:** CI `verify` green on PR #4; local gates green (config 181/200, drift,
smoke 15/15, eval-skills tier-1, rag `--check`, rag tests 7/7).

**Next step (specific):**
- **Sub-project #2 (secrets):** awaiting operator approval of the spec → then
  writing-plans → SDD build (`secrets/registry.json` + `tools/secrets/preflight.mjs`
  + `secrets/README.md` runbook + wire preflight into the portfolio workflow).
- Parked: RAG **slice-2** (cross-project layer — operator leans goals 2+3;
  recommendation = **git-synced shared index, NOT hosted**, since a host only earns
  its keep for phone-anywhere chat); RAG retrieval-quality follow-ups.
- The conduct/system-prompt integration is **DONE**; future agents load it via
  `CLAUDE.md` → `conduct.md` + the orient hook.

## Session — 2026-06-20 (policy: adopted skills are freely editable)

Operator pushed back on the "don't edit adopted skills" convention — correctly: those
skills are plain markdown, nothing technically locked them. **New durable policy:** we
freely edit/adapt adopted skills and `.md` files like our own; only **official Anthropic**
skills are kept pristine + provenance-tracked. `skills-lock.json` slimmed from 20 → **2
entries** (`frontend-design`, `task-management`); the 18 obra/superpowers/addyosmani/
upstash/warp skills are now ours to adapt. The lock + the gen-docs drift-gate exclusion now
mean "official, leave pristine," not "untouchable." Created `docs/decisions/README.md` to
resolve the one drift this surfaced (`documentation-and-adrs` → `docs/decisions/`). Verified
`gen-docs --check` green (only the expected render.png container drift). The eval-harness
plan was updated to match: Tier-1 error-gates all skills except the official set (from
skills-lock.json, warn-only), and the frontmatter parser now folds YAML block scalars (`>-`).

## Session — 2026-06-20 (skill/rule eval harness — BUILT, MERGED to main)

Brainstorm → writing-plans → subagent-driven-development (fresh implementer + reviewer
per task; whole-branch opus review at the end). `tools/eval-skills.mjs` — pure core +
one injected `callModel` boundary, three tiers: **Tier-1 static** (frontmatter/description
quality; deterministic; GATES `npm run health` + CI; exempts official skills via
skills-lock.json; folds YAML block scalars), **Tier-2 trigger** router-sim (one model call
per fixture picks a skill; N-sample hit-rate; REPORTS), **Tier-3 outcome A/B** proxy (two
completions ± skill body + LLM judge vs rubric → lift; REPORTS). LLM tiers self-skip
(exit 0) with no `ANTHROPIC_API_KEY` and run via the on-demand `eval-skills.yml`
(`workflow_dispatch`, needs the `ANTHROPIC_API_KEY` repo secret). Fixtures in `test/eval/`;
11 unit tests, all tokenless (fake `callModel`). Model `claude-opus-4-8`, structured
outputs, no banned params (verified vs the claude-api reference). Whole-branch review =
READY TO MERGE; only nits (node-version match, hyphen) fixed. Parked follow-ups: expand
fixtures; gate Tier-2 hit-rate once stable; a rule-eval variant.

## Open threads (parked - resume these; the `orient` hook surfaces them; `/park` adds them)
- [ ] **Re-platform pass over the stack-specific docs (after the re-platform is BUILT)** | The always-loaded charter (CLAUDE.md + AGENTS.md mirror), README, and ONBOARDING were already updated to retire the hand-built / zero-dep / raw-WebGL2 / not-three.js mandate and defer to the re-platform ADRs (`docs/decisions/`). STILL stack-specific and needing a pass once the Next.js/React re-platform actually lands: `.claude/rules/shaders.md` (mobile-budget + WebGL framing), `.claude/rules/deploy.md`, and `research/visual-references/webgl-creative-technique-notes.md` ("our stack is raw WebGL2… NOT three.js/WebGPU" framing — the *technique* notes stay valid, only the stack framing dates). Not wrong today (code is still WebGL2) — don't touch until the code moves. Historical logs/audits/plans/specs were intentionally left as dated records. | parked 2026-06-21
- [ ] **TOP PRIORITY — exhaustive 20-pass repo audit (next-agent task)** | Run a ridiculously extensive, self-directed audit of the whole repo. Full spec: `AUDIT-BRIEF.md` (repo root). HARD SEQUENCE: Phase 0 = extensive context-gathering from PRIMARY SOURCES first (read CLAUDE.md + all @imports, every `.claude/rules/*`, every hook, every SKILL.md, the app `src/`, `test/`, `tools/`, workflows, git state) — do NOT trust prior `progress.md` summaries as fact; the authoring session had degraded context and seeded NO findings on purpose. Phase 1 = decide your tools from what Phase 0 surfaced. Phase 2 = ~20 audit passes (rule-compliance, doc↔code drift, hooks, verification gates, shaders/mobile-budget, audio, licensing, a11y, deploy/privacy, security, deps, skills, RAG, git hygiene, tests, perf, public-exposure, Drive handoff, dead weight, synthesis). Phase 3 = report with `file:line` evidence to `docs/audits/<date>-audit.md` + `SendUserFile`. Audit, don't refactor. | parked 2026-06-20
- [ ] **Buff the RAG with landing-page craft context (next-container task)** | Curate our-own-words landing-page craft notes under `research/landing-page-rag/` into the RAG corpus so agents building the frontpage get strong, retrievable context. Brief: `research/landing-page-rag/BRIEF.md`. Ties to `workshop/sketches/frontpage/BRIEF.md`, the `reel-ingest` tool, and the `frontend-design` skill. Also: the new `reorient` skill re-loads state after a `/clear` (the orient hook only fires at SessionStart). | parked 2026-06-20
- [ ] **Proton Pass secrets wiring (sub-project #2 — brainstorm parked)** | Approach chosen: A = Proton Pass vault + E2EE expiring Secure Links for sharing + a **secrets registry** (single source of truth) + a **CI/CLI preflight verifier** (checks all required GitHub secrets are present, never prints values). Reframe locked: AI consumes secrets only via GitHub Actions env, NEVER raw in chat; this cloud session can't reach Proton directly. Research done (deep-research agent #5). OPEN: registry scope — all 3 subsystems (portfolio + deploy + Opus-8 keys, Opus-8 marked `planned`) vs portfolio+deploy only. Secrets inventory ~11 keys across 3 subsystems (see .env.example commit 41454da7). ADR-001 (backend-rule-scope) already done. RESOLVED: registry covers all 3 subsystems (Opus-8 `planned`). Spec WRITTEN + delivered: `docs/superpowers/specs/2026-06-20-secrets-management-design.md`. Next: operator approves spec → writing-plans → SDD build. | parked 2026-06-20

- [ ] **non-local RAG system — GLOBAL/cross-project layer (slice 2+)** | SLICE 1 (in-repo semantic recall) is now BUILT & MERGE-READY on `claude/rag-recall` — see the session entry below + `tools/rag/`. What remains parked: the **hosted, cross-project + global** layer (serve THIS project's knowledge AND a shared layer across the user's other projects). The seam is already in place — every chunk in `tools/rag/index.json` carries `{scope:"project", project:"primordial-viz"}`, so the global layer is a **merge + filter** (load multiple projects' index.json, filter by scope/project; access gate = filter predicate, later auth). When resumed, BRAINSTORM: where the merged index lives (hosted vs git-synced), the gate/permission model, how other repos feed in, MCP surface. Brief: `research/rag-system/BRIEF.md` | parked 2026-06-19, slice-1 built 2026-06-20
- [ ] **RAG retrieval-quality follow-ups (slice 1 polish)** | (a) self-referential pollution: `docs/superpowers/**` plan/spec docs contain example query phrasings, so they rank #1 for those exact queries — consider excluding/​down-ranking meta-dev docs (operator chose to KEEP planning docs in the corpus for now). (b) `index.json` is ~6MB single-line, fully rewritten on any doc edit (churn) — consider int8/base64 vector compaction. (c) optional: top-level vs best-chunk heading for snippets. None block use | noted 2026-06-20

## Session — 2026-06-20 (RAG slice 1: in-repo semantic recall — BUILT, MERGE-READY)

Brainstorm → writing-plans → subagent-driven-development (fresh implementer +
reviewer per task; whole-branch opus review at the end). Branch `claude/rag-recall`.
Spec `docs/superpowers/specs/2026-06-20-rag-semantic-recall-design.md`; plan
`docs/superpowers/plans/2026-06-20-rag-semantic-recall.md`. Slice 1 of the parked
non-local RAG vision = **semantic (vector) recall over this repo's markdown docs**,
git-persisted, local-embedder, surfaced via the MCP server + a CLI.

**Shipped (`tools/rag/`, all dev-tooling — web path keeps zero runtime deps):**
- `chunk.mjs` — corpus → heading-section chunks (reuses `docFiles()`; oversize split).
- `model.mjs` — dep-free constants (MiniLM, dim 384) so the drift gate loads no model.
- `embed.mjs` — **local** `@huggingface/transformers` MiniLM (devDep; no doc text egress).
- `build-index.mjs` — `npm run rag:index` builds committed `tools/rag/index.json`
  (1355 chunks); `--check` is a **model-free + dep-free** drift gate (~186ms) wired
  into `npm run health` + CI (`verify.yml`), mirroring `gen-docs --check`.
- `retrieve.mjs` — hybrid: rank by semantic cosine among top-30 candidates, then a
  small **in-set** lexical boost (`LEX_BOOST=0.15`) that re-orders within the
  relevant set but can't inject big catch-all docs. `semanticSearch()` + CLI;
  lexical fallback if the index is missing/incompatible.
- MCP tool `semantic_search` (keeps `search_docs` lexical as fast-path/fallback).
- `tools/rag/README.md` documents the pieces + the global seam.

**The key save (value of the review loop):** the planned **RRF** fusion *flattened*
the cosine signal (scores ~0.03, big docs like progress.md/ENCYCLOPEDIA won). I
caught it during Task-4 QA, diagnosed (pure-semantic was good; RRF discards
magnitude; lexical-normalized blend over-rewarded big docs), and replaced it with
the semantic-ranked + in-set-boost algorithm — **verified** to put the right doc in
top 1–4 across 6 probe queries (e.g. "how is the app deployed" → `deploy-cpanel`
#1; "looks and presets" → `new-preset` #1; shader-licensing → `shaders.md`).

**Operator decision:** excluded the external **FMHY** tool catalog
(`research/fmhy-dev-tools/`) from the corpus (external scrape, like the already-
excluded `research/corpus/`); KEPT planning/spec docs in.

**The global seam (built as data only):** every chunk carries `{scope, project}`
→ slice 2 is a merge+filter, not a rewrite. No hosting/DB/global code built (YAGNI).

**Verified:** 7/7 rag tests; MCP selftest lists `semantic_search`; RAG drift gate
PASS; whole-branch opus review = **READY TO MERGE** (no Critical/Important). The
ONE `npm run health` failure is the **pre-existing** `CLAUDE.md → render.png`
docs-drift (gitignored artifact, fails identically at branch base — gotchas.md),
unrelated to this work. Parked follow-ups: global layer (slice 2), self-referential
meta-doc pollution, index.json compaction (see Open threads).

## Session — 2026-06-20 (Phase 2: destructive-command guard — DONE)

Built the parked, approved guard. **`.claude/hooks/guard.mjs`** (PreToolUse, matcher
`Bash`; registered in `settings.json`): emits `permissionDecision` JSON — **DENY**
irreversible cmds (rm -rf of / ~ $HOME /*, dd of=/dev/*, mkfs, shred, forkbomb,
chmod -R 777 /, force-push to main/master), **ASK** on recoverable-risky (reset
--hard, clean -f*, non-main force-push, recursive rm of an abs path, chmod -R), else
no-op. Strips leading sudo/env/nohup/time wrappers; deny patterns anchored to command
boundaries. **Node, not bash** — chosen for reliable parsing (no jq-escaping bugs in a
safety-critical guard). Unit-tested (`test/guard.test.mjs`).

**Lesson surfaced live:** once registered, the guard blocked *its own commit* — the
heredoc commit message described the deny patterns ("rm -rf / ~ $HOME /*"), and the
guard scanned that DATA. First fix (regex quote-strip) then desynced on an apostrophe
inside a double-quoted string ("didn't"). Real fix: a **shell-quote-state scanner**
(`stripData`) that removes heredoc bodies + quoted spans before matching, so command
*text/messages* never trip the guard while real piped/`;`-separated commands still do.
Added apostrophe + heredoc cases to the test. Verified: dangerous→deny, our workflow
(incl. `git push -u origin claude/*` and danger-describing commit messages)→allow;
`npm run health` green except the expected render.png drift.

**Phase 2 remaining:** eval harness (#1 research gap) — still backlog.

## Session — 2026-06-20 (FMHY developer-tools harvester — DELIVERED)

Brainstorm→plan→subagent-driven build (spec
`docs/superpowers/specs/2026-06-20-fmhy-link-harvester-design.md`, plan
`docs/superpowers/plans/2026-06-20-fmhy-link-harvester.md`). Turned the operator's
`share.google` link (→ `https://fmhy.net/developer-tools`) into a structured,
safety-gated catalog + a Primordial-relevant shortlist. Lives in
`research/fmhy-dev-tools/`.

- **Harvester** `tools/harvest-links.mjs` (reusable on any markdown link-index):
  pure `parseIndex` + `renderCatalog` + CLI; unit-tested (`test/harvest-links.test.mjs`).
  Safety gate excludes piracy/warez/nulled/nsfw; tags `relevant_to_primordial`.
- **Source** snapshot `source.md` (FMHY raw markdown, 942 links).
- **Catalog** `links.json` + `CATALOG.md`: **1576 entries, 6 excluded, 268 relevant,
  52 categories.**
- **Shortlist** `SHORTLIST.md`: **18** vetted picks (Hosting×7, Graphics×3, Audio×2,
  CI/Perf×4, Other×2) — top: Pingbreak, Lighthouse, Theatre.js. Curated with a
  **capped (≤25), depth-1** homepage enrichment; 5 candidates dropped (offline/403/
  wrong-stack).
- **README** documents schema, re-run, safety policy, RAG-readiness (links.json is
  shaped to feed the parked non-local RAG thread later).

**Review-loop catch (the value of SDD):** Task-4 verification found the parser only
grabbed the FIRST link per FMHY line; many lines list 2-6 tools. Fixed
`parseIndex` to extract ALL links per list item → **739 → 1576 entries** (>2×), and
the shortlist's picks then reconciled 20/20 with the catalog. Verified each subagent
claim against the files directly (per the new cite-evidence guardrail) — Pingbreak's
catalog "miss" was a false alarm (invisible U+2060 in its name); the 3 off-catalog
shortlist picks were real FMHY entries the old parser had dropped.

**Verified:** unit test green, `npm run health` green except the expected render.png
drift. **Parked follow-ons:** deep recursive crawl of linked sites; actual RAG
ingestion. Both subagents noted `SendUserFile` is unavailable in their env, so the
controller delivered the shortlist.

## Session — 2026-06-20 (Phase 2 started: per-skill tool permissions — DONE)

Started Phase 2 with the "per-skill allowed-tools" item. **Verified the mechanism
first (vs official docs) and the premise was wrong:** skill `allowed-tools` is
**ADVISORY** — it pre-approves tools (no permission prompt) but does NOT restrict;
every tool stays callable. Real enforcement is the **subagent `tools:`** allowlist
(and skill `disallowed-tools`, which clears each turn). So the item split:

- **Enforced least-privilege — already in place:** `visual-qa` + `audio-dsp` already
  declare `tools: Read, Grep, Glob, Bash` (no Write/Edit/WebFetch/MCP). Confirmed, no
  change needed.
- **Fewer phone prompts — applied:** added **command-scoped** `allowed-tools` to our
  **12 own skills** (health, deploy-check, skill-router, visual-workshop, new-preset,
  park, lesson, perf-budget, thought-based-reasoning, workflow, deploy-cpanel,
  send-report). Never `Bash(*)` — only the exact commands each skill runs. The **20
  adopted skills** were left untouched (vendored/hash-locked in `skills-lock.json`).

**Verified:** `gen-docs --check` (frontmatter still parses, router region current),
`check-config` OK, smoke 15/15; only the expected render.png drift. Honest caveat:
in Auto/bypass permission mode the prompt-reduction win is modest; the enforced-safety
half (the real prize) was already done. **Phase 2 remaining:** eval harness (#1 gap)
+ destructive-command guard — both still backlog.

## Session — 2026-06-19 (adopt-ideas Phase 1 — DELIVERED)

Executed the adopt-ideas plan (spec:
`docs/superpowers/specs/2026-06-19-adopt-ideas-roadmap-design.md`; plan:
`docs/superpowers/plans/2026-06-19-adopt-ideas-phase1.md`) via subagent-driven
development (fresh implementer + reviewer per task) — 7 tasks, all review-clean.
Phase 1 = the cheap, git-only tooling wins corroborated by the peer comparison.

**Task 1 — Roadmap recorded:** the full adopt-ideas roadmap written into
`.claude/ROADMAP.md` (Track 1, Claude tooling) + root `ROADMAP.md` (Track 2, product
techniques). Phase 1 = 5 items below; Phase 2 (eval harness, destructive-cmd guard,
per-skill `allowed-tools`) + gated product techniques (preset cross-fade, perceptual
bands, look playlist, waveform aligner) are backlog.

**Task 2 — AGENTS.md mirror:** added `buildAgentsMd()` to `tools/gen-docs.mjs` that
generates `AGENTS.md` as a tool-agnostic **mirror of `CLAUDE.md`** (Claude-only
`@import` lines → plain ``See `file`.`` references; `@generated` header). Registered
in `OUTPUTS` + `docs` so `gen-docs --check` gates it (stale → CI fail). Gives
Codex/Cursor the same knowledge for free.

**Task 3 — Config gate:** new `tools/check-config.mjs` asserts (1) `CLAUDE.md` ≤ 200
lines, (2) the `@generated…skills:router` markers exist in `.claude/skills-router.md`,
(3) `.claude/settings.json` is valid JSON. Wired into `npm run health` as a gate.
Kills the recurring "CLAUDE.md crept over 200" failure.

**Task 4 — PreCompact handoff hook:** `.claude/hooks/precompact-handoff.sh` — a
**PreCompact** hook (registered in `settings.json`) that emits a **non-blocking**
reminder (via `hookSpecificOutput.additionalContext`) to update `progress.md` before
the session compacts. jq path + printf fallback; `set -u`, `exit 0`.

**Task 5 — Recent lessons in orient:** `.claude/hooks/orient.sh` now greps the
existing `$pcontent` (progress.md) for the most recent `LESSON` headings and prints a
"Recent lessons" block at session start. Clean no-op when none.

**Task 6 — Gotchas rule:** new `.claude/rules/gotchas.md` capturing 5 **technical
anti-footguns**: render.png drift is expected; looks registry resolves via
`import.meta.url` (don't revert to page-relative); render-check must freeze the loop
on CI software-GL; container is HTTPS-443-only (no FTP/cPanel); only git-committed
files survive. Referenced by appending to an existing `CLAUDE.md` line (no new line —
stays at the 200 cap, enforced by Task 3's gate).

**Verified:** `npm run health` green except the pre-existing/expected
`test/artifacts/render.png` drift; `gen-docs --check` + `check-config` pass. No app
code changed. Minor follow-ups noted for final review: a missing blank line before one
`## Rules` heading in generated AGENTS.md, and the ENCYCLOPEDIA row for AGENTS.md
showing its `@generated` HTML comment as the description.

## Session — 2026-06-19 (Claude-repo comparison WIDENED to full repos — DELIVERED)

Ran the brainstorm→writing-plans→inline-execution flow (spec:
`docs/superpowers/specs/2026-06-19-full-repo-comparison-design.md`; plan:
`docs/superpowers/plans/2026-06-19-full-repo-comparison.md`) to widen the
comparison from skills libraries to **full repositories**. Merged everything into
one `research/claude-repo-comparison/REPORT.md` (14-row master table + `Kind`
column: baseline / skills-lib / config / product / collection).

**Run 2 — 8 full-repo peers** (primary sources, 8 parallel agents):
- config: `carlrannaberg/claudekit` (compiled TS hook runner, checkpoint/restore),
  `wshobson/agents` (192 agents, `make garden` drift gate, Monte-Carlo `plugin-eval`),
  `yzhao062/anywhere-agents` (portable CLI config, hardened `guard.py`),
  `disler/claude-code-hooks-mastery` (all 13 hooks, but 0-byte CLAUDE.md + NO LICENSE).
- product: `getsentry/sentry` (glob-scoped AGENTS.md, skills symlinked tool-agnostic,
  `claude-settings-audit` skill), `cloudflare/workers-sdk` (4-line CLAUDE.md stub →
  per-package AGENTS.md), `openai/openai-agents-python` (CLAUDE.md→AGENTS.md symlink,
  `$skill` gates, PLANS.md ExecPlans), `trailofbits/algo` (one dense CLAUDE.md as an
  anti-footgun manual).

**Run 3 — 4 reader-suggested** (operator asked): added `affaan-m/ECC` (~218k★
collection — install profiles, AgentShield, memory hooks); EXCLUDED
`ruvnet/open-claude-code` + `Gitlawb/openclaude` (CLI reimpl/fork — category
mismatch + IP flags) and `avalonreset/legends-github` (tiny skills suite).

**Headline finding:** two opposite philosophies — real *product* repos keep Claude
tooling deliberately THIN (vendor-neutral AGENTS.md + strong existing CI, no hooks),
while *config* repos go deep on machinery. **We're a product repo built like a
config repo** — unusual, mostly a strength. Top adopt-ideas (now corroborated more
widely): (1) an **eval harness** (3 peers), (2) **AGENTS.md as cross-tool source +
CLAUDE.md symlink** (near-universal — the one thing we lack), (3) a **self-auditing
config gate** (4 peers), (4) a **hardened destructive-command guard**. Parked a
run-4 "whole-workflow-systems" follow-up. No app code changed.

## Session — 2026-06-19 (Claude-repo comparison — DELIVERED)

Executed the queued primary-axis task (brief: `research/claude-repo-comparison/BRIEF.md`).
Compared this repo's Claude-agent tooling/methodology against **4** real, verified
peers, profiled from **primary sources** via 4 parallel research agents:
**obra/superpowers** (MIT, ~233k★), **anthropics/skills** (Apache-2.0, ~153k★),
**shanraisshan/claude-code-best-practice** (MIT, ~58k★), **MuhammadUsmanGM/
claude-code-best-practices** (MIT, ~48★). Deliverable committed:
`research/claude-repo-comparison/REPORT.md` (table across the 4 dimensions +
per-repo notes + adopt-vs-ahead synthesis) and SendUserFile'd to the operator.

**Key findings:** we're ahead on **wipe-proof git continuity**, the **docs/drift
gate**, breadth of **enforcement hooks**, and a **self-improvement loop**
(parking + learn-from-corrections) — none of the peers have all of these. Biggest
gap to adopt: an **eval harness that gates skill/rule changes** (superpowers +
anthropics both have one; we measure *correctness* but never whether a skill
actually triggers/helps). Runner-ups to adopt: per-skill `allowed-tools`
permissions (anthropics), a `lint-claude-md` CI invariant check + cost/benchmark
tooling (MuhammadUsmanGM). Honest caveat: no peer is a true product-repo peer —
three are skills/methodology libraries, one a template handbook — so the most
transferable theme is **evaluation**.

**Parked the follow-up:** product-domain comparison (raw-WebGL2 / shader /
audio-visual apps) is now the top Open thread. No app code changed.

## Session — 2026-06-19 (two comparison runs: workflow-systems + product-domain)

Executed the two parked comparison threads sequentially via the proven method
(discovery -> one general-purpose agent per repo in parallel reading primary
sources -> synthesize table + per-repo notes + adopt-vs-ahead). On branch
`claude/onboarding-hxwhw6`.

**Run 4 — whole-workflow systems (Claude-axis, extends `research/claude-repo-comparison/REPORT.md`).**
Slate (all MIT unless noted, all active, primary-source-profiled): `automazeio/ccpm`
(~8.2k, PM via GitHub Issues + worktrees), `ruvnet/ruflo`/claude-flow (~60k,
swarm/consensus meta-harness, is itself an MCP server), `eyaltoledano/claude-task-master`
(~27.6k, **MIT WITH Commons Clause** — can't resell/host), `parcadei/Continuous-Claude-v3`
(~3.8k, the closest continuity peer — ledgers+YAML handoffs+save/wipe/resume on a
Postgres+pgvector+daemon stack), `github/spec-kit` (~114k, first-party spec-driven
constitution->specify->plan->tasks->implement with hard Phase-Gates). Added 5 `Kind:
workflow` rows (14->19), per-repo notes, folded into synthesis; updated Three->Four
runs. **Key honest finding:** continuity is **no longer unique** (Continuous-Claude
proves the pattern); our edge is **constraint-fit** — git-only, zero-infra,
branch-scoped, phone-friendly — vs their heavy stacks. Cheapest borrows (both git-only,
already half-parked): a **PreCompact handoff hook** and **surfacing recent lessons in
orient**.

**Run 5 — product-domain (NEW `research/product-domain-comparison/REPORT.md`).**
Axis = our product (raw-WebGL2 / shader / audio-reactive web apps). Slate:
`jberg/butterchurn` (MIT engine, ~1.9k, Milkdrop->WebGL2, preset cross-fade),
`hydra-synth/hydra` (**AGPL**, ~2.6k, regl, DSL-as-look), `projectM-visualizer/projectm`
(**LGPL-2.1**, ~4.3k, C++/Emscripten->WebGL2, own DSP+beat detect), `fand/veda`/vedajs
(**MIT**, ~531, three.js, **Shadertoy-style audio texture — our closest cousin**),
`hvianna/audioMotion-analyzer` (**AGPL**, ~922, Canvas2D library, state-of-the-art
audio features). Dimensions: renderer / audio->features / mobile budget / looks /
deploy+license. **Key findings:** (1) we are the **only peer purpose-built for the
mobile gig path** — none of the five ship dynamic-res + step-cap + pause-on-hidden;
(2) our **512x2 Shadertoy audio texture is independently validated by VEDA**; (3)
**licensing punchline** — only VEDA is MIT; hydra+audioMotion are AGPL (hard blockers),
projectM is LGPL, and every Milkdrop path drags preset art with its own terms — which
**vindicates our write-our-own posture**. Adopt (technique only): preset cross-fade,
perceptual bands (bark/mel), look playlist, waveform aligner.

**Verified:** `npm run health` — only the pre-existing gitignored `render.png` drift
fails (acceptable); no app code touched; no gen-docs regen triggered (research-only
edits). Both runs committed + pushed (`33ebd33`, `1cc5d3d`). **Delivery note:**
`SendUserFile` is unavailable in this agent environment — both reports are committed
to the branch; operator can read them in-repo (paths above).

## Session - 2026-06-19 (LESSON + FIX: continuity is branch-scoped)

**What broke:** the Claude-repo-comparison task was queued (brief + "Open threads"
entry) on the working branch `claude/review-claude-md-di5jvm`, but the next
session started on a DIFFERENT branch (`claude/onboarding-z2z67e`) forked off
`main`. `main` is **67 commits behind** the working branch, so that session's
orient hook + continuity docs had none of it - the queued task was silently
missed. Root cause: "only committed files survive" is true only **on the branch
you committed to**; new tasks fork off stale `main`.

**Fix applied (this branch):**
- `orient.sh` is now **cross-branch aware**: best-effort `git fetch`, detect the
  most-recently-updated remote branch, read the handoff + open threads FROM IT,
  and print a loud WARNING + the exact `git checkout` when the session is on a
  different branch. Verified by simulating a wrong-branch session - it surfaced
  the queued task and the switch command. Also fixed a latent bug: the "Latest
  progress entry" line used `tail -1` (oldest heading) - now reads the newest
  (top) entry.
- Documented the rule in `ONBOARDING.md` ("Continuity is BRANCH-SCOPED") and
  `CLAUDE.md`: keep durable state + `.claude/` reaching `main` (merge regularly)
  or new sessions start blind.

**LINCHPIN - RESOLVED 2026-06-19:** operator approved a **direct merge** of
`claude/review-claude-md-di5jvm` into `main` (merge commit `79e4998`, no
conflicts, `README.md` preserved, gates green). `main` now contains the full
build incl. the cross-branch orient hook + the queued comparison brief, so future
sessions forking off `main` inherit everything. **Going forward: keep `main`
current** - merge the working branch to `main` after each batch (or work on
`main`) so it never drifts dozens of commits behind again.

## Session - 2026-06-19 (queued next-agent task: Claude-repo comparison)

Set up a durable brief for the NEXT container to execute: search GitHub for 3-5
other/similar Claude-based repos and compare them against this one (primary axis:
Claude-agent tooling + methodology; later goal: product-domain / WebGL-audio
axis), across config&rules, skills/agents/MCP, hooks&automation, and
process&methodology. Full self-contained brief (context + tools + selection
criteria + deliverable + definition-of-done) is in
`research/claude-repo-comparison/BRIEF.md`; surfaced as the top "Open threads"
entry so the orient hook + ONBOARDING start gate route a fresh agent straight to
it. The next agent writes `research/claude-repo-comparison/REPORT.md` and
SendUserFiles it to the operator. No app code changed this step.

## Session - 2026-06-19 (Visual Workshop - sandbox clip loop SHIPPED)

Built the Visual Workshop (spec: `docs/superpowers/specs/2026-06-19-visual-workshop-design.md`,
plan: `docs/superpowers/plans/2026-06-19-visual-workshop.md`) via subagent-driven
development (fresh implementer + reviewer per task) - a throwaway sandbox,
separate from the shipped app, for workshopping visuals via short audio-driven
clips delivered to the phone.

- `workshop/sketches/<name>/` (committed): each sketch = `<name>.frag.js`
  (exports `SKETCH_FRAG`, GLSL ES 3.00) + `<name>.json` (`{name,note,bpm,params}`).
- `workshop/sandbox.html` + `sketch-runner.mjs`: mounts a sketch via the real
  `Renderer` (now accepts `{slimeFrag,postFrag}`), driven by a deterministic
  synthetic "fake song" (`workshop/synth-audio.mjs`). Generic uniform upload by
  name (arrays -> vec3 u<Key>, numbers -> float u<Key>).
- `npm run clip -- <name>` (`tools/workshop/clip.mjs`): records the sandbox to
  `workshop/artifacts/<name>.webm` (or `--stills N`, `--secs S`) via Playwright
  video, no ffmpeg. Artifacts gitignored. Deliver with `SendUserFile`.
- `/workshop` skill (area design): drives discuss -> (optional) research
  [creative + implementation best-practice] -> author -> clip -> react ->
  graduate, with the reference-only licensing guardrail. Graduation applies the
  mobile budget + visual-qa/audio-dsp review.

Reference sketch `_demo` proves the loop. **Verified:** `npm run health` green,
`node test/render-check.mjs` green (app unchanged), `npm run clip -- _demo`
produces a ~800K webm. Per-task reviews clean (2 small fixes applied: runner
self-halts on render error; clip recorder always kills its server + fast-fails
on boot error).

**Next:** use it - workshop the real `/Test/` visual. Possible upgrades: real
sample-track audio, portrait clip option, expose `clip` as an MCP tool, per-genre
synth presets.

## Session — 2026-06-19 (WS1 code hardening — DONE)

Executed **WS1** (the documented next-step across ~6 handoffs) on branch
`claude/review-claude-md-di5jvm`, in 5 verified commits:

1. **GL correctness** (`renderer.js`): audio texture LINEAR→**NEAREST** (512×2 R8
   maps 1:1 to texels); `resizeFbo()` now does **checkFramebufferStatus** with an
   RGBA16F→RGBA8 fallback + throw if still incomplete; **webglcontextlost/restored**
   handlers (resources rebuilt via new `_createResources()`, `fboW/H`→0 to force
   realloc); render loop skips drawing while `renderer.contextLost`.
2. **Perf budget**: `schema.js` steps max 96→**64**, renderScale min 0.3→**0.5**;
   `main.js` dynamic-res floor 0.4→**0.5**; `slime.frag.js` raymarch hard bound
   96→**64**. Now matches `rules/shaders.md` (steps ≤64).
3. **Spectral flux** (`analyser.js`): smoothed sum of positive frame-to-frame FFT
   bin rises (onset energy), gained ×12, in `features`; wired `uFlux` through
   `uniforms.js` + a subtle rim-flash in `slime.frag.js`. Completes the
   `{bass,mid,treble,level,flux}` set (`rules/audio.md`).
4. **Robustness** (`input.js`/`main.js`): `devicechange` listener (hotplug refresh
   via `onDevicesChanged`); `startMic` returns `{ok,message}` and mic failures
   (denied / no device / in-use / still-suspended) surface as a screen-reader
   `role=alert` on the gate (operator can pick Visuals Only); `dt` NaN/neg/huge
   guard; `cancelAnimationFrame` + mic release on `pagehide`.
5. **Review fixes**: wrapped `pipeline.render()` so a fatal GL error stops the loop
   + shows the gate (was un-caught); flux gain 8→12. Reviewed by **audio-dsp** +
   **visual-qa** agents (both: ship-ready).

**Verified:** `node test/render-check.mjs` (headless Chromium — shaders compile,
loop advances, no console errors), `npm run health` (all gates: JS syntax, smoke
12/12, site audit, docs+drift). Pushed.

**Next:** **verify-live** items (need a real track/phone, not testable here):
flux gain/punch, dynamic-res feel, mic-error UX on a phone. Then the real `/Test/`
visual (still a placeholder), Phase 6 (first collab), WS3 (`research/findings/`),
WS4 (prune vestigial `.glsl`/`.htaccess` rules). Parked: non-local RAG system.

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

## Session — 2026-06-19 (pattern-mining → 3 durable captures)

Mined all 136 user turns across both session transcripts + cross-checked against
the `/insights` report (independent second opinion). Two analyses converged on the
same recurring gaps → captured three:

1. **Wrong-referent correction** (most-repeated; distinct from "inaccurate facts"):
   "put them on MY WEBSITE! not chromium for you to see", "no the main", "I meant
   the insights skill". Fix: sharpened the always-loaded **Accuracy rule** with a
   *referent check* — confirm "make/show/put X" is for the deliverable (live site /
   portfolio / `/Test/`) vs my local sandbox; when in doubt build for the deliverable.
2. **Too verbose / jargon** (broke sessions via the 500-output-token cap; `/insights`
   flagged it twice; "im not sure what that all means"). Fix: new always-loaded
   **Communication** bullet (answer-first, offer depth, low jargon).
3. **Mobile fights the tooling** (the friction arc — "copy-paste large files doesnt
   work on android", file:// reports unreachable, FTP blocked). Fix: new
   **`.claude/rules/mobile-ergonomics.md`** (one value per code-block, no large
   copy-paste, SendUserFile over file:// links, deploy via GitHub state) surfaced
   device-aware by the `orient` hook on `*mobile*` sessions.

**Also did the parked CLAUDE.md slim** (prereq for #2's room): moved the generated
`skills:router` block to **`.claude/skills-router.md`** (imported via `@`), repointed
`gen-docs.mjs` `regions` at it, updated the `skill-router` skill wording. CLAUDE.md
**197 → 188 lines**.

**Verified:** `gen-docs --check` green (docs + moved region + drift gate, which
confirms the new rule path exists); `npm run health` all-pass; `orient.sh` syntax OK
+ the mobile branch fires only on `*mobile*` (unit-checked).

**Open-thread note:** the slim task is now done; remaining halted items unchanged
(WS1 code fixes, real `/Test/` visual, Phase 6, PreCompact hook, `list_skills` MCP
tool, `window.__primordial` prod-gating, WS3/WS4, the parked RAG system).
