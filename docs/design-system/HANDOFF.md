# HANDOFF — Primordial immersive WebGL/splat landing page

**Next-agent onboarding. Date: 2026-06-22.** Read this, then `PLAN.md` +
`BUILD-WORKFLOW.md`. This covers the design-system/website effort *and* the
device/tooling state (which isn't in normal repo context).

## What this is
The point-cloud immersive landing page: **dawn → sheer drapery gathers into a tent →
flutters away → interactive Appalachian-rainforest music visualizer.** Mostly Gaussian
splats, animated, static-deployed to primordial.video for mobile. Built with Claude
Opus 4.8 + a multi-tool workflow.

## Read-first
- `docs/design-system/PLAN.md` — design-system plan: point-cloud direction, locked
  decisions, research-confirmed stack.
- `docs/design-system/BUILD-WORKFLOW.md` — tool-by-phase build workflow.
- `docs/design-system/colab/{drapery-trellis,forest-video-splat}.md` — asset-gen runbooks.
- NotebookLM notebook **`688cc151`** ("Elite WebGL Landing Pages", 239+ sources) + the
  Doc **"Engineering Build Spec"** (in the operator's NotebookLM Google account).

## Decisions locked this session
- Mostly point-cloud; **full diegetic 3D UI** (+ 2D a11y mirror); sync scope = splat
  scenes + camera moves; **no webcam**; arc dawn→tent→flutter→visualizer.
- **D-COMPUTE = free/rented cloud GPU** (Colab/Kaggle).
- **Generate, don't capture:** drapery via image→**TRELLIS 2** (MIT); rainforest via
  **AI video → frames → Nerfstudio Splatfacto**. (Avoid SfM-free/DUSt3R — needs A100/80GB.)
- Confirmed stack: R3F/three + **Spark 2.0 or PlayCanvas**; `.SPZ`/`.SOG`; **global-buffer
  merge**; subset animation = **LBS / semantic-mask**; relight = **proxy-mesh + PCSS**;
  motion = **Theatre.js + GSAP**; budget **200–500K splats + virtual-memory paging**.

## Open gates / next steps
1. **Generate first asset** — drapery is fastest (image→TRELLIS); run `colab/drapery-trellis.md`.
2. **Gemini CLI API key** — OAuth is blocked by a Google bug; use an AI Studio key.
3. **Start the web build** vs a placeholder splat (parallel, unblocks code).
4. Pending design calls: **D1** palette (dusk/bone), **D2** type (Fraunces/Hanken/DM Mono),
   splat-motion v1 scope.
5. **Push** the commits (all local; see below).

## Environment foot-guns (IMPORTANT)
- This Claude Code runs as **root in Termux**: `pkg`/`apt` blocked as root; **proot won't
  run as root** (no local glibc builds here — use the operator's non-root session or cloud).
- **FUSE:** `/root/AI_Workspace` → `/sdcard` (no `chmod +x`/locking); executables live in
  native `/root/`.
- Device runs **hot** (peaked **84 °C**) + swaps under load → **one heavy tool at a time**;
  keep GPU work off-device. Monitor with `mem` / `temp` / `sys` (in `~/.bashrc`); passive
  watchdog `sysguard start` (autostart disabled; at `/root/.local/bin/sysguard`).
- `CLAUDE_EFFORT=medium` set for next session (`~/.claude/settings.json`).

## Tools (state)
- **NotebookLM CLI** (`notebooklm`, notebooklm-py) — WORKING/authed. Auth file
  `~/.notebooklm/profiles/default/storage_state.json` (cookies, ~weeks; re-export from
  Firefox + run `/root/.local/bin/nlm-cookies-to-state`). `notebooklm use 688cc151` then
  `ask` / `generate report|audio`.
- **Antigravity (`agy`)** — non-root; has Google auth + browser/proot; use for visual QA
  and multi-model. Workspace rules: `AI_Workspace/.agents/rules/` (orchestration / memory /
  knowledge / context).
- **Gemini CLI** — installed (needs `TERMUX_VERSION`, set in `.bashrc`); **UNAUTHED**.
- **Google Stitch** (2D look prototyping) · **Claude Design + /design-sync** (component
  builds; the kit isn't built yet).
- Global orchestration rule (`~/.claude/CLAUDE.md`): right-size the agent to the task,
  parallelize independent work, verify against real artifacts.

## Commit status
- Committed **LOCALLY (not pushed):** Primordial-viz `c2d0807` (+ `2fe8d54`, `33030a5`);
  AI_Workspace `39e644c`.
- **NOT git-tracked** (home/device): `~/.claude/*`, `~/.bashrc`,
  `/root/.local/bin/{sysguard,nlm-cookies-to-state}`, `~/.notebooklm/`.
