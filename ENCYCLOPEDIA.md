# Encyclopedia — Primordial-viz

> **Auto-generated — do not edit by hand.** A categorized index of every
> file in the repository, each with a one-line description taken from the
> file's own header (leading comment, first sentence, `<title>`, or a JSON
> `description` field). Regenerate with `node tools/gen-docs.mjs`; it also
> refreshes via the PostToolUse hook and is gated in CI. For the directory
> layout see [`TREE.md`](TREE.md).
>
> 176 files across 17 categories.

## Contents
- [Overview & Planning](#overview--planning) (10)
- [Specs & Long-form Docs](#specs--long-form-docs) (4)
- [App — Entry & Bootstrap](#app--entry--bootstrap) (2)
- [App — Audio](#app--audio) (3)
- [App — Graphics / WebGL](#app--graphics--webgl) (3)
- [App — Shaders (GLSL)](#app--shaders-glsl) (4)
- [App — Looks / Presets](#app--looks--presets) (3)
- [App — Params / State](#app--params--state) (2)
- [App — UI](#app--ui) (2)
- [Tests & Verification](#tests--verification) (2)
- [Desktop / Standalone (Tauri)](#desktop--standalone-tauri) (25)
- [Tooling / Scripts](#tooling--scripts) (11)
- [Claude Environment](#claude-environment) (82)
- [Deployment](#deployment) (3)
- [Research](#research) (13)
- [CI / Build Config](#ci--build-config) (6)
- [Other](#other) (1)

## Overview & Planning

| File | Description |
| --- | --- |
| [`CLAUDE.md`](CLAUDE.md) | Working notes for agents in this repo. |
| [`ENCYCLOPEDIA.md`](ENCYCLOPEDIA.md) | Auto-generated — do not edit by hand. |
| [`LICENSE`](LICENSE) | Software license for the project. |
| [`README.md`](README.md) | An audio-reactive WebGL2 visual instrument for live electronic-music gigs. |
| [`ROADMAP.md`](ROADMAP.md) | Phased plan for primordial — the audio-reactive WebGL2 visual instrument. |
| [`TODO.md`](TODO.md) | The app is built and running — scaffold, audio core, visual core, and instrument controls are done. |
| [`TREE.md`](TREE.md) | Auto-generated — do not edit by hand. |
| [`findings.md`](findings.md) | Consolidated from 7 deep-research passes this session. |
| [`progress.md`](progress.md) | State: Phase 0 (scaffold) in progress. |
| [`task_plan.md`](task_plan.md) | Working name primordial (rename freely). |

## Specs & Long-form Docs

| File | Description |
| --- | --- |
| [`docs/BUILD-SPEC.md`](docs/BUILD-SPEC.md) | BUILT DIFFERENTLY (as-shipped correction): this is the original planning doc. |
| [`docs/STANDALONE.md`](docs/STANDALONE.md) | Wrap the Primordial visual app into a native desktop application with [Tauri v2](https://tauri.app). |
| [`docs/superpowers/plans/2026-06-19-automatic-skill-workflows.md`](docs/superpowers/plans/2026-06-19-automatic-skill-workflows.md) | For agentic workers: implement task-by-task; steps use - [ ] checkboxes. |
| [`docs/superpowers/plans/2026-06-19-learn-from-corrections.md`](docs/superpowers/plans/2026-06-19-learn-from-corrections.md) | Self-improvement loop #1. |

## App — Entry & Bootstrap

| File | Description |
| --- | --- |
| [`index.html`](index.html) | Primordial - Audio Instrument |
| [`src/main.js`](src/main.js) | Bootstrap: start gate -> mic + AudioContext resume, the rAF render loop, wiring audio features -> GL uniforms -> UI, and the dynamic-resolution… |

## App — Audio

| File | Description |
| --- | --- |
| [`src/audio/analyser.js`](src/audio/analyser.js) | AnalyserNode wrapper. |
| [`src/audio/bpm.js`](src/audio/bpm.js) | Dependency-free tempo + beat utilities: 1. |
| [`src/audio/input.js`](src/audio/input.js) | Microphone / line-in capture: getUserMedia with RAW constraints (no AGC, no noise suppression, no echo cancellation -> we want the true signal for… |

## App — Graphics / WebGL

| File | Description |
| --- | --- |
| [`src/gl/passes.js`](src/gl/passes.js) | Orchestrates the two-pass render pipeline (slime -> post) for a frame. |
| [`src/gl/renderer.js`](src/gl/renderer.js) | WebGL2 renderer: context creation, shader/program compilation, fullscreen triangle draw, and the offscreen FBO used for the heavy SDF pass (rendered… |
| [`src/gl/uniforms.js`](src/gl/uniforms.js) | Maps audio features + current look params -> shader uniforms, and builds the 512x2 audio texture byte array each frame. |

## App — Shaders (GLSL)

| File | Description |
| --- | --- |
| [`src/shaders/common.glsl.js`](src/shaders/common.glsl.js) | Shared GLSL helpers: hashing, value noise, fbm, domain warp, smin, SDF primitives, tetrahedron normals. |
| [`src/shaders/fullscreen.vert.js`](src/shaders/fullscreen.vert.js) | Fullscreen "big triangle" vertex shader. |
| [`src/shaders/post.frag.js`](src/shaders/post.frag.js) | Post pass: tonemap the HDR slime buffer + screen-space grunge. |
| [`src/shaders/slime.frag.js`](src/shaders/slime.frag.js) | Slime raymarch pass. |

## App — Looks / Presets

| File | Description |
| --- | --- |
| [`src/looks/hud-amber.json`](src/looks/hud-amber.json) | Tighter, drier blobs in an amber technical-HUD palette, crisp scanlines. |
| [`src/looks/registry.js`](src/looks/registry.js) | Look registry. |
| [`src/looks/slime-green.json`](src/looks/slime-green.json) | Wet metaball goo, neon green-on-black, heavy churn and glow. |

## App — Params / State

| File | Description |
| --- | --- |
| [`src/params/schema.js`](src/params/schema.js) | Parameter schema for a "look": defines every tunable, its type, range, and default. |
| [`src/params/store.js`](src/params/store.js) | Versioned localStorage persistence for the current look + slider values + perf knobs. |

## App — UI

| File | Description |
| --- | --- |
| [`src/ui/controls.js`](src/ui/controls.js) | HUD controls: builds the panel (sliders from the schema, device picker, look switcher, tap-tempo, perf sliders), wires DOM events to the param store… |
| [`src/ui/styles.css`](src/ui/styles.css) | Primordial Studio - green-on-black technical HUD. |

## Tests & Verification

| File | Description |
| --- | --- |
| [`test/render-check.mjs`](test/render-check.mjs) | test/render-check.mjs — headless-Chromium render check (laptop-free). |
| [`test/smoke.mjs`](test/smoke.mjs) | test/smoke.mjs — laptop-free logic checks (no browser, no deps). |

## Desktop / Standalone (Tauri)

| File | Description |
| --- | --- |
| [`src-tauri/.gitignore`](src-tauri/.gitignore) | Generated by Cargo will have compiled files and executables |
| [`src-tauri/Cargo.toml`](src-tauri/Cargo.toml) | TOML file. |
| [`src-tauri/Info.plist`](src-tauri/Info.plist) | PLIST file. |
| [`src-tauri/build.rs`](src-tauri/build.rs) | RS file. |
| [`src-tauri/capabilities/default.json`](src-tauri/capabilities/default.json) | enables the default permissions |
| [`src-tauri/icons/128x128.png`](src-tauri/icons/128x128.png) | Image asset. |
| [`src-tauri/icons/128x128@2x.png`](src-tauri/icons/128x128@2x.png) | Image asset. |
| [`src-tauri/icons/32x32.png`](src-tauri/icons/32x32.png) | Image asset. |
| [`src-tauri/icons/Square107x107Logo.png`](src-tauri/icons/Square107x107Logo.png) | Image asset. |
| [`src-tauri/icons/Square142x142Logo.png`](src-tauri/icons/Square142x142Logo.png) | Image asset. |
| [`src-tauri/icons/Square150x150Logo.png`](src-tauri/icons/Square150x150Logo.png) | Image asset. |
| [`src-tauri/icons/Square284x284Logo.png`](src-tauri/icons/Square284x284Logo.png) | Image asset. |
| [`src-tauri/icons/Square30x30Logo.png`](src-tauri/icons/Square30x30Logo.png) | Image asset. |
| [`src-tauri/icons/Square310x310Logo.png`](src-tauri/icons/Square310x310Logo.png) | Image asset. |
| [`src-tauri/icons/Square44x44Logo.png`](src-tauri/icons/Square44x44Logo.png) | Image asset. |
| [`src-tauri/icons/Square71x71Logo.png`](src-tauri/icons/Square71x71Logo.png) | Image asset. |
| [`src-tauri/icons/Square89x89Logo.png`](src-tauri/icons/Square89x89Logo.png) | Image asset. |
| [`src-tauri/icons/StoreLogo.png`](src-tauri/icons/StoreLogo.png) | Image asset. |
| [`src-tauri/icons/icon.icns`](src-tauri/icons/icon.icns) | ICNS file. |
| [`src-tauri/icons/icon.ico`](src-tauri/icons/icon.ico) | Icon asset. |
| [`src-tauri/icons/icon.png`](src-tauri/icons/icon.png) | Image asset. |
| [`src-tauri/src/lib.rs`](src-tauri/src/lib.rs) | [cfg_attr(mobile, tauri::mobile_entry_point)] |
| [`src-tauri/src/main.rs`](src-tauri/src/main.rs) | Prevents additional console window on Windows in release, DO NOT REMOVE!! |
| [`src-tauri/tauri.conf.json`](src-tauri/tauri.conf.json) | Configuration / data file. |
| [`vite.config.js`](vite.config.js) | Vite config for the DESKTOP STANDALONE build (and any bundled deploy). |

## Tooling / Scripts

| File | Description |
| --- | --- |
| [`tools/audit-site.mjs`](tools/audit-site.mjs) | Audit the DEPLOYED surface (index.html + src/) for AI "tells" a visitor could see via View-Source. |
| [`tools/gen-docs.mjs`](tools/gen-docs.mjs) | Generates two always-current repo maps from a single source of truth: ENCYCLOPEDIA.md — a categorized index of every file, each with a one-line… |
| [`tools/health.mjs`](tools/health.mjs) | Consolidated repo health check - runs the local gates in one pass and prints a PASS/FAIL dashboard. |
| [`tools/mcp/lib/browser.mjs`](tools/mcp/lib/browser.mjs) | Shared headless-Chromium launch for the WebGL2 dev tools (shader validation, render checks). |
| [`tools/mcp/lib/docs.mjs`](tools/mcp/lib/docs.mjs) | Project Q&A: keyword search + retrieval over the repo's own markdown docs, so an assistant can answer questions about the project. |
| [`tools/mcp/lib/looks.mjs`](tools/mcp/lib/looks.mjs) | Looks/preset management: list, validate, and create/update the params-only JSON "looks" in src/looks/, keeping src/looks/registry.js's generated… |
| [`tools/mcp/lib/render.mjs`](tools/mcp/lib/render.mjs) | Reusable headless render check: load the app in headless Chromium (WebGL2 via SwiftShader), confirm it boots and renders, and capture a screenshot +… |
| [`tools/mcp/lib/site.mjs`](tools/mcp/lib/site.mjs) | Live-site health for primordial.video (read-only — no credentials). |
| [`tools/mcp/lib/validate.mjs`](tools/mcp/lib/validate.mjs) | Headless GLSL ES 3.00 validation: compile + link the project's shaders in a real WebGL2 context (ANGLE/SwiftShader via Playwright) — the exact… |
| [`tools/mcp/selftest.mjs`](tools/mcp/selftest.mjs) | Self-test for the primordial MCP server: spawns server.mjs over stdio using the MCP SDK client, lists tools/resources/prompts, and exits non-zero if… |
| [`tools/mcp/server.mjs`](tools/mcp/server.mjs) | Primordial-viz MCP server — local stdio dev tools for AI assistants working on this project. |

## Claude Environment

| File | Description |
| --- | --- |
| [`.claude/ROADMAP.md`](.claude/ROADMAP.md) | Scope: the Claude setup only — how we make this repo + agent optimal so the app can be built phone-driven and laptop-free. |
| [`.claude/TODO.md`](.claude/TODO.md) | Claude-environment checklist only (the app's task list is the repo-root TODO.md). |
| [`.claude/agents/audio-dsp.md`](.claude/agents/audio-dsp.md) | Audio-analysis specialist for primordial. Reviews or implements the FFT/band-energy/beat/BPM path and the 512×2 audio texture for correctness. Use… |
| [`.claude/agents/visual-qa.md`](.claude/agents/visual-qa.md) | Reviews a visual/shader/renderer change in primordial for both look quality and mobile performance budget compliance. Use after editing… |
| [`.claude/cloud-setup.sh`](.claude/cloud-setup.sh) | Primordial-viz — CLOUD ENVIRONMENT SETUP SCRIPT (reference copy). |
| [`.claude/hooks/check-data.sh`](.claude/hooks/check-data.sh) | PostToolUse hook (matcher: Edit\|Write). |
| [`.claude/hooks/check-syntax.sh`](.claude/hooks/check-syntax.sh) | PostToolUse hook (matcher: Edit\|Write). |
| [`.claude/hooks/detect-correction.sh`](.claude/hooks/detect-correction.sh) | UserPromptSubmit hook: when the prompt reads like the user CORRECTING me, inject a NON-BLOCKING nudge to capture the lesson durably via the… |
| [`.claude/hooks/gen-docs.sh`](.claude/hooks/gen-docs.sh) | PostToolUse hook (matcher: Edit\|Write). |
| [`.claude/hooks/inject-rules.sh`](.claude/hooks/inject-rules.sh) | PreToolUse hook (matcher: Edit\|Write). |
| [`.claude/hooks/orient.sh`](.claude/hooks/orient.sh) | SessionStart hook: orient a fresh agent (especially cloud/phone sessions) with zero typing — repo state, branch + recent commits, the latest handoff… |
| [`.claude/hooks/suggest-workflow.sh`](.claude/hooks/suggest-workflow.sh) | UserPromptSubmit hook: when the prompt looks like a substantial build/feature or a new visual-look task, inject a NON-BLOCKING nudge toward the… |
| [`.claude/rules/audio.md`](.claude/rules/audio.md) | Scoped to the audio capture + analysis code. |
| [`.claude/rules/deploy.md`](.claude/rules/deploy.md) | Facts about the host. |
| [`.claude/rules/shaders.md`](.claude/rules/shaders.md) | Scoped to the shader/renderer code. |
| [`.claude/settings.json`](.claude/settings.json) | Claude Code hooks + permissions for this repo. |
| [`.claude/skills/accessibility/SKILL.md`](.claude/skills/accessibility/SKILL.md) | Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance",… |
| [`.claude/skills/accessibility/references/A11Y-PATTERNS.md`](.claude/skills/accessibility/references/A11Y-PATTERNS.md) | Practical, copy-paste-ready patterns for common accessibility requirements. |
| [`.claude/skills/accessibility/references/WCAG.md`](.claude/skills/accessibility/references/WCAG.md) | html <button>Label</button> <!-- or --> <button aria-label="Close dialog">×</button> |
| [`.claude/skills/brainstorming/SKILL.md`](.claude/skills/brainstorming/SKILL.md) | You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user… |
| [`.claude/skills/brainstorming/scripts/frame-template.html`](.claude/skills/brainstorming/scripts/frame-template.html) | Superpowers Brainstorming |
| [`.claude/skills/brainstorming/scripts/helper.js`](.claude/skills/brainstorming/scripts/helper.js) | JS file. |
| [`.claude/skills/brainstorming/scripts/server.cjs`](.claude/skills/brainstorming/scripts/server.cjs) | CJS file. |
| [`.claude/skills/brainstorming/scripts/start-server.sh`](.claude/skills/brainstorming/scripts/start-server.sh) | Start the brainstorm server and output connection info Usage: start-server.sh [--project-dir <path>] [--host <bind-host>] [--url-host… |
| [`.claude/skills/brainstorming/scripts/stop-server.sh`](.claude/skills/brainstorming/scripts/stop-server.sh) | Stop the brainstorm server and clean up Usage: stop-server.sh <session_dir> Kills the server process. |
| [`.claude/skills/brainstorming/spec-document-reviewer-prompt.md`](.claude/skills/brainstorming/spec-document-reviewer-prompt.md) | Use this template when dispatching a spec document reviewer subagent. |
| [`.claude/skills/brainstorming/visual-companion.md`](.claude/skills/brainstorming/visual-companion.md) | Browser-based visual brainstorming companion for showing mockups, diagrams, and options. |
| [`.claude/skills/debugging-and-error-recovery/SKILL.md`](.claude/skills/debugging-and-error-recovery/SKILL.md) | Guides systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected… |
| [`.claude/skills/deploy-check/SKILL.md`](.claude/skills/deploy-check/SKILL.md) | Diagnose the deploy pipeline in one pass — check the latest GitHub Actions deploy run, pull failing job logs, confirm the required FTP_PASSWORD… |
| [`.claude/skills/deploy-cpanel/SKILL.md`](.claude/skills/deploy-cpanel/SKILL.md) | Manual deploy checklist for shipping primordial to Namecheap Stellar Plus (cPanel). Invoke deliberately when deploying; not auto-activated. |
| [`.claude/skills/dispatching-parallel-agents/SKILL.md`](.claude/skills/dispatching-parallel-agents/SKILL.md) | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| [`.claude/skills/documentation-and-adrs/SKILL.md`](.claude/skills/documentation-and-adrs/SKILL.md) | Records decisions and documentation. Use when making architectural decisions, changing public APIs, shipping features, or when you need to record… |
| [`.claude/skills/executing-plans/SKILL.md`](.claude/skills/executing-plans/SKILL.md) | Use when you have a written implementation plan to execute in a separate session with review checkpoints |
| [`.claude/skills/find-docs/SKILL.md`](.claude/skills/find-docs/SKILL.md) | >- |
| [`.claude/skills/finishing-a-development-branch/SKILL.md`](.claude/skills/finishing-a-development-branch/SKILL.md) | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by… |
| [`.claude/skills/frontend-design/LICENSE.txt`](.claude/skills/frontend-design/LICENSE.txt) | Plain-text notes. |
| [`.claude/skills/frontend-design/SKILL.md`](.claude/skills/frontend-design/SKILL.md) | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography,… |
| [`.claude/skills/health/SKILL.md`](.claude/skills/health/SKILL.md) | One-pass repo + deploy health check, then route any failure to its fix. Runs the local gates (npm run health - JS syntax, smoke, site audit,… |
| [`.claude/skills/lesson/SKILL.md`](.claude/skills/lesson/SKILL.md) | Capture a correction or lesson durably so the same mistake doesn't recur. Use right after the user corrects a wrong assumption, an over-applied… |
| [`.claude/skills/new-preset/SKILL.md`](.claude/skills/new-preset/SKILL.md) | Scaffold a new visual "look" for primordial — a params-only JSON preset in src/looks/, wired into the look registry (all looks share the slime… |
| [`.claude/skills/park/SKILL.md`](.claude/skills/park/SKILL.md) | Park the current in-progress thread (a design, task, or decision we're partway through) into the "Open threads" list in progress.md with enough… |
| [`.claude/skills/perf-budget/SKILL.md`](.claude/skills/perf-budget/SKILL.md) | Run the in-app FPS stress-test readout for primordial and read its SMOOTH / OK / TOO-MUCH verdict to set the mobile performance budget (FBO… |
| [`.claude/skills/performance/SKILL.md`](.claude/skills/performance/SKILL.md) | Optimize web performance for faster loading and better user experience. Use when asked to "speed up my site", "optimize performance", "reduce load… |
| [`.claude/skills/receiving-code-review/SKILL.md`](.claude/skills/receiving-code-review/SKILL.md) | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable -… |
| [`.claude/skills/requesting-code-review/SKILL.md`](.claude/skills/requesting-code-review/SKILL.md) | Use when completing tasks, implementing major features, or before merging to verify work meets requirements |
| [`.claude/skills/requesting-code-review/code-reviewer.md`](.claude/skills/requesting-code-review/code-reviewer.md) | Use this template when dispatching a code reviewer subagent. |
| [`.claude/skills/send-report/SKILL.md`](.claude/skills/send-report/SKILL.md) | Send the newest /insights usage report to the user as a file. Use after running /insights when the file:/// link can't be opened (mobile/cloud… |
| [`.claude/skills/skill-router/SKILL.md`](.claude/skills/skill-router/SKILL.md) | Route to the right IN-REPO skill and keep the local skill registry in sync — regenerate the CLAUDE.md "Skills by area" router block from… |
| [`.claude/skills/spec-driven-implementation/SKILL.md`](.claude/skills/spec-driven-implementation/SKILL.md) | Drive a spec-first workflow for substantial features by writing PRODUCT.md before implementation, writing TECH.md when warranted, and keeping both… |
| [`.claude/skills/subagent-driven-development/SKILL.md`](.claude/skills/subagent-driven-development/SKILL.md) | Use when executing implementation plans with independent tasks in the current session |
| [`.claude/skills/subagent-driven-development/implementer-prompt.md`](.claude/skills/subagent-driven-development/implementer-prompt.md) | Use this template when dispatching an implementer subagent. |
| [`.claude/skills/subagent-driven-development/scripts/review-package`](.claude/skills/subagent-driven-development/scripts/review-package) | Generate a review package: commit list, stat summary, and the net diff with extended context, written to a file the reviewer reads in one call. |
| [`.claude/skills/subagent-driven-development/scripts/sdd-workspace`](.claude/skills/subagent-driven-development/scripts/sdd-workspace) | Resolve and ensure the working-tree directory SDD uses for its short-lived artifacts: task briefs, implementer reports, review packages, and the… |
| [`.claude/skills/subagent-driven-development/scripts/task-brief`](.claude/skills/subagent-driven-development/scripts/task-brief) | Extract one task's full text from an implementation plan into a file the implementer reads in one call, so the task text never has to be pasted… |
| [`.claude/skills/subagent-driven-development/task-reviewer-prompt.md`](.claude/skills/subagent-driven-development/task-reviewer-prompt.md) | Use this template when dispatching a task reviewer subagent. |
| [`.claude/skills/systematic-debugging/CREATION-LOG.md`](.claude/skills/systematic-debugging/CREATION-LOG.md) | Reference example of extracting, structuring, and bulletproofing a critical skill. |
| [`.claude/skills/systematic-debugging/SKILL.md`](.claude/skills/systematic-debugging/SKILL.md) | Use when encountering any bug, test failure, or unexpected behavior, before proposing fixes |
| [`.claude/skills/systematic-debugging/condition-based-waiting-example.ts`](.claude/skills/systematic-debugging/condition-based-waiting-example.ts) | Complete implementation of condition-based waiting utilities From: Lace test infrastructure improvements (2025-10-03) Context: Fixed 15 flaky tests… |
| [`.claude/skills/systematic-debugging/condition-based-waiting.md`](.claude/skills/systematic-debugging/condition-based-waiting.md) | Flaky tests often guess at timing with arbitrary delays. |
| [`.claude/skills/systematic-debugging/defense-in-depth.md`](.claude/skills/systematic-debugging/defense-in-depth.md) | When you fix a bug caused by invalid data, adding validation at one place feels sufficient. |
| [`.claude/skills/systematic-debugging/find-polluter.sh`](.claude/skills/systematic-debugging/find-polluter.sh) | Bisection script to find which test creates unwanted files/state Usage: ./find-polluter.sh <file_or_dir_to_check> <test_pattern> Example:… |
| [`.claude/skills/systematic-debugging/root-cause-tracing.md`](.claude/skills/systematic-debugging/root-cause-tracing.md) | Bugs often manifest deep in the call stack (git init in wrong directory, file created in wrong location, database opened with wrong path). |
| [`.claude/skills/systematic-debugging/test-academic.md`](.claude/skills/systematic-debugging/test-academic.md) | You have access to the systematic debugging skill at skills/debugging/systematic-debugging |
| [`.claude/skills/systematic-debugging/test-pressure-1.md`](.claude/skills/systematic-debugging/test-pressure-1.md) | IMPORTANT: This is a real scenario. |
| [`.claude/skills/systematic-debugging/test-pressure-2.md`](.claude/skills/systematic-debugging/test-pressure-2.md) | IMPORTANT: This is a real scenario. |
| [`.claude/skills/systematic-debugging/test-pressure-3.md`](.claude/skills/systematic-debugging/test-pressure-3.md) | IMPORTANT: This is a real scenario. |
| [`.claude/skills/task-management/SKILL.md`](.claude/skills/task-management/SKILL.md) | Simple task management using a shared TASKS.md file. Reference this when the user asks about their tasks, wants to add/complete tasks, or needs help… |
| [`.claude/skills/test-driven-development/SKILL.md`](.claude/skills/test-driven-development/SKILL.md) | Use when implementing any feature or bugfix, before writing implementation code |
| [`.claude/skills/test-driven-development/testing-anti-patterns.md`](.claude/skills/test-driven-development/testing-anti-patterns.md) | Load this reference when: writing or changing tests, adding mocks, or tempted to add test-only methods to production code. |
| [`.claude/skills/thought-based-reasoning/SKILL.md`](.claude/skills/thought-based-reasoning/SKILL.md) | Structured reasoning harness for design, architecture, and planning decisions in Primordial-viz. Frame the problem, pull the right project knowledge… |
| [`.claude/skills/verification-before-completion/SKILL.md`](.claude/skills/verification-before-completion/SKILL.md) | Use when about to claim work is complete, fixed, or passing, before committing or creating PRs - requires running verification commands and… |
| [`.claude/skills/workflow/SKILL.md`](.claude/skills/workflow/SKILL.md) | Drive a named multi-step workflow — an ordered chain of skills/agents — for a substantial build, feature, or new-look task. Use at the START of such… |
| [`.claude/skills/writing-plans/SKILL.md`](.claude/skills/writing-plans/SKILL.md) | Use when you have a spec or requirements for a multi-step task, before touching code |
| [`.claude/skills/writing-plans/plan-document-reviewer-prompt.md`](.claude/skills/writing-plans/plan-document-reviewer-prompt.md) | Use this template when dispatching a plan document reviewer subagent. |
| [`.claude/skills/writing-skills/SKILL.md`](.claude/skills/writing-skills/SKILL.md) | Use when creating new skills, editing existing skills, or verifying skills work before deployment |
| [`.claude/skills/writing-skills/anthropic-best-practices.md`](.claude/skills/writing-skills/anthropic-best-practices.md) | Learn how to write effective Skills that agents can discover and use successfully. |
| [`.claude/skills/writing-skills/examples/CLAUDE_MD_TESTING.md`](.claude/skills/writing-skills/examples/CLAUDE_MD_TESTING.md) | Testing different documentation variants to find what actually makes agents discover and use skills under pressure. |
| [`.claude/skills/writing-skills/graphviz-conventions.dot`](.claude/skills/writing-skills/graphviz-conventions.dot) | DOT file. |
| [`.claude/skills/writing-skills/persuasion-principles.md`](.claude/skills/writing-skills/persuasion-principles.md) | LLMs respond to the same persuasion principles as humans. |
| [`.claude/skills/writing-skills/render-graphs.js`](.claude/skills/writing-skills/render-graphs.js) | Render graphviz diagrams from a skill's SKILL.md to SVG files. |
| [`.claude/skills/writing-skills/testing-skills-with-subagents.md`](.claude/skills/writing-skills/testing-skills-with-subagents.md) | Load this reference when: creating or editing skills, before deployment, to verify they work under pressure and resist rationalization. |
| [`.claude/workflows.md`](.claude/workflows.md) | Ordered chains of skills/agents for common task types. |

## Deployment

| File | Description |
| --- | --- |
| [`.cpanel.yml`](.cpanel.yml) | CI / workflow configuration. |
| [`deploy/.htaccess`](deploy/.htaccess) | primordial — Stellar Plus (LiteSpeed/Apache) static config. |
| [`deploy/DEPLOY.md`](deploy/DEPLOY.md) | This app is static and has no build step. |

## Research

| File | Description |
| --- | --- |
| [`research/README.md`](research/README.md) | Regenerate full corpus: python3 scripts/crawl-site.py (no API key; stdlib only). |
| [`research/TODO.md`](research/TODO.md) | MD file. |
| [`research/corpus/claude-code-auto-memory-guide.md`](research/corpus/claude-code-auto-memory-guide.md) | Every AI coding tool has the same dirty secret: on Monday, it doesn't remember anything you told it on Friday. |
| [`research/corpus/claude-code-best-practices.md`](research/corpus/claude-code-best-practices.md) | Most people who bounce off Claude Code don't bounce off the model. |
| [`research/corpus/claude-code-workflows-10x-productivity.md`](research/corpus/claude-code-workflows-10x-productivity.md) | Most developers use Claude Code the same way: type a question, get an answer, copy-paste. |
| [`research/corpus/claude-md-guide.md`](research/corpus/claude-md-guide.md) | If you're using Claude Code — Anthropic's agentic coding tool for the terminal — you've probably noticed it works pretty well out of the box. |
| [`research/corpus/context-engineering-claude-code.md`](research/corpus/context-engineering-claude-code.md) | The difference between developers who get mediocre output from Claude Code and those who get production-ready code on the first try almost always… |
| [`research/corpus/mcp-servers-guide.md`](research/corpus/mcp-servers-guide.md) | Out of the box, Claude Code can read your files, write code, and run terminal commands. |
| [`research/findings/fmhy-tooling.md`](research/findings/fmhy-tooling.md) | Deep-research synthesis (4 parallel passes, adversarially verified). |
| [`research/findings/mcp-adoption.md`](research/findings/mcp-adoption.md) | Deep-research synthesis (5 parallel search angles, adversarially verified). |
| [`research/findings/mcp-build-our-own.md`](research/findings/mcp-build-our-own.md) | Deep-research synthesis (5 parallel search angles, adversarially verified). |
| [`research/scripts/crawl-site.py`](research/scripts/crawl-site.py) | Python script. |
| [`research/scripts/scrape-blog.py`](research/scripts/scrape-blog.py) | Python script. |

## CI / Build Config

| File | Description |
| --- | --- |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | CI / workflow configuration. |
| [`.github/workflows/verify.yml`](.github/workflows/verify.yml) | CI: syntax-check, smoke test, and headless render check on every push. |
| [`.gitignore`](.gitignore) | deps / build |
| [`.mcp.json`](.mcp.json) | Project-scoped MCP server configuration for Claude Code. |
| [`package-lock.json`](package-lock.json) | Locked dependency tree for reproducible dev-tool installs. |
| [`package.json`](package.json) | npm manifest — scripts + dev dependencies only (the app runtime stays zero-dependency). |

## Other

| File | Description |
| --- | --- |
| [`skills-lock.json`](skills-lock.json) | Configuration / data file. |
