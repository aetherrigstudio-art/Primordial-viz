# Build Workflow — Primordial immersive WebGL/splat landing page

How we build and ship the point-cloud "journey" landing page (dawn → drapery
gathers into a tent → flutters away → Appalachian rainforest music visualizer)
using every tool available, each assigned to what it's best at. Grounded in the
NotebookLM research (239 sources). Full cited spec: **NotebookLM Doc "Engineering
Build Spec: Immersive Gaussian-Splat Journey Landing Page"** (in the NotebookLM-
login Google account) + notebook `688cc151` ("Elite WebGL Landing Pages").

## Tool roster → role
- **Claude Code / Opus 4.8** — orchestrator + hard GL/shader/architecture coding; spawns right-sized subagents.
- **Antigravity (`agy`)** — runs what root-Claude can't (proot, a real browser for visual QA), multi-model (Gemini legwork + Claude review), holds Google auth.
- **Gemini CLI / Flash** — cheap bulk legwork (content, config, asset wiring) once API-keyed.
- **NotebookLM** (notebooklm-py, working) — grounded research brain; `generate report`/`audio` for durable specs.
- **Google Stitch** — fast/free 2D look-layout prototyping (Gemini-powered, token import).
- **Claude Design + `/design-sync`** — component-accurate UI builds.
- **Cloud GPU / capture app** — splat creation (off-device).
- **sysguard / `temp`** — heat+RAM watch during local runs.
- **GitHub Actions → primordial.video/Test** — static deploy (HTTPS = mic works).

## Phases

### Phase 0 — Lock direction (cheap/fast)
- NotebookLM `generate report` → the durable build spec (done).
- Stitch → prototype the 2D editorial pages + mood/palette/type; export as the visual target.
- Claude Code → resolve open PLAN calls (D-COMPUTE, palette, type); update `PLAN.md`.

### Phase 1 — Splat assets (off-device, GPU — gating dependency)
- Capture drapery + Appalachian scene (dawn + day variants) via phone app (Luma/Polycam) or footage → cloud-GPU train (COLMAP → 3DGS) → compress to `.SPZ`/`.SOG`.
- Build against a **placeholder splat in parallel** so this never blocks code.

### Phase 2 — Web build (Opus 4.8 primary; right-sized help)
- Stack: **R3F/three + Spark 2.0 or PlayCanvas** (splat render) + **Theatre.js** (cinematic camera) + **GSAP ScrollTrigger** (the journey).
- Multi-splat = **global-buffer merge**; drape subset = **LBS / semantic-mask**; light = **proxy-mesh + PCSS**; budget **200–500K splats + virtual-memory paging**.
- Opus 4.8 on hard GL/shaders; Flash/Antigravity on mechanical wiring/content; subagents for parallel workstreams; an **independent model reviews**.

### Phase 3 — UI layer
- Diegetic 3D UI in-app (Claude Code); flat editorial screens via Stitch → Claude Design/`design-sync` for component accuracy; reconcile to the dusk/bone tokens.

### Phase 4 — Verify + ship
- `/verify` runtime drive; **Antigravity's real browser** for visual QA (root-Claude can't run Chromium); `temp`/sysguard watch heat.
- Push → GitHub Actions FTPS → primordial.video/Test.
- NotebookLM `generate audio` as a stakeholder walkthrough.

## Guardrails (cross-cutting)
- **Right-size every model** — Flash legwork, Opus 4.8 hard core, independent review.
- **One heavy tool at a time** (the device peaked at 84 °C this session); GPU work stays off-device.
- State lives in `PLAN.md` / `.agents/MEMORY.md`.

## Open dependencies (gate Phase 1)
- **D-COMPUTE** — which GPU runs splat training (cloud GPU vs capture-app cloud).
- **Gemini CLI auth** — API key (OAuth is blocked by the Google bug).
