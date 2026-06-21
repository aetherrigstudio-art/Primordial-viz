# Encyclopedia — Primordial-viz

> **Auto-generated — do not edit by hand.** A categorized index of every
> file in the repository, each with a one-line description taken from the
> file's own header (leading comment, first sentence, `<title>`, or a JSON
> `description` field). Regenerate with `node tools/gen-docs.mjs`; it also
> refreshes via the PostToolUse hook and is gated in CI. For the directory
> layout see [`TREE.md`](TREE.md).
>
> 383 files across 17 categories.

## Contents
- [Overview & Planning](#overview--planning) (13)
- [Specs & Long-form Docs](#specs--long-form-docs) (48)
- [App — Entry & Bootstrap](#app--entry--bootstrap) (2)
- [App — Audio](#app--audio) (3)
- [App — Graphics / WebGL](#app--graphics--webgl) (3)
- [App — Shaders (GLSL)](#app--shaders-glsl) (4)
- [App — Looks / Presets](#app--looks--presets) (3)
- [App — Params / State](#app--params--state) (2)
- [App — UI](#app--ui) (2)
- [Tests & Verification](#tests--verification) (10)
- [Desktop / Standalone (Tauri)](#desktop--standalone-tauri) (25)
- [Tooling / Scripts](#tooling--scripts) (32)
- [Claude Environment](#claude-environment) (140)
- [Deployment](#deployment) (3)
- [Research](#research) (24)
- [CI / Build Config](#ci--build-config) (8)
- [Other](#other) (61)

## Overview & Planning

| File | Description |
| --- | --- |
| [`AGENTS.md`](AGENTS.md) | Working notes for agents in this repo. |
| [`AUDIT-BRIEF.md`](AUDIT-BRIEF.md) | Read this whole file, then ignore it as a source of facts. |
| [`CLAUDE.md`](CLAUDE.md) | Working notes for agents in this repo. |
| [`ENCYCLOPEDIA.md`](ENCYCLOPEDIA.md) | Auto-generated — do not edit by hand. |
| [`LICENSE`](LICENSE) | Software license for the project. |
| [`ONBOARDING.md`](ONBOARDING.md) | The single entry point for an AI agent starting work on Primordial-viz. |
| [`README.md`](README.md) | An audio-reactive WebGL2 visual instrument for live electronic-music gigs. |
| [`ROADMAP.md`](ROADMAP.md) | Phased plan for primordial — the audio-reactive WebGL2 visual instrument. |
| [`TODO.md`](TODO.md) | The app is built and running — scaffold, audio core, visual core, and instrument controls are done. |
| [`TREE.md`](TREE.md) | Auto-generated — do not edit by hand. |
| [`findings.md`](findings.md) | Consolidated from 7 deep-research passes this session. |
| [`progress.md`](progress.md) | Established the two-agent collaboration channel for the Primordial Studio wedding landing page, with Google Drive as the shared layer: - DESIGN… |
| [`task_plan.md`](task_plan.md) | Working name primordial (rename freely). |

## Specs & Long-form Docs

| File | Description |
| --- | --- |
| [`docs/ANTHROPIC/OPUS8-SETUP-PLAN.md`](docs/ANTHROPIC/OPUS8-SETUP-PLAN.md) | This document describes what I committed so far and the remaining steps to finish the end-to-end setup so Claude Opus 8 can consult the Opus doc via… |
| [`docs/BUILD-SPEC.md`](docs/BUILD-SPEC.md) | BUILT DIFFERENTLY (as-shipped correction): this is the original planning doc. |
| [`docs/STANDALONE.md`](docs/STANDALONE.md) | Wrap the Primordial visual app into a native desktop application with [Tauri v2](https://tauri.app). |
| [`docs/audits/2026-06-20-audit-20pass.md`](docs/audits/2026-06-20-audit-20pass.md) | every file under src-tauri/, workshop/, all 34 skill bodies, every docs/ and research/ file, all tools/.mjs, and all test/ were read in full by six… |
| [`docs/audits/2026-06-20-audit.md`](docs/audits/2026-06-20-audit.md) | Self-directed ~20-pass audit per AUDIT-BRIEF.md. |
| [`docs/decisions/001-backend-rule-scope.md`](docs/decisions/001-backend-rule-scope.md) | Accepted |
| [`docs/decisions/005-public-repo-and-license-posture.md`](docs/decisions/005-public-repo-and-license-posture.md) | Proposed — needs an operator decision. |
| [`docs/decisions/006-retire-phone-based-development.md`](docs/decisions/006-retire-phone-based-development.md) | Accepted — operator-directed 2026-06-20 ("we no longer will be using rules that are to allow for phone based development"). |
| [`docs/decisions/012-replatform-target-astro.md`](docs/decisions/012-replatform-target-astro.md) | Accepted — operator-directed 2026-06-21, research-backed (docs/research/best-path-forward/findings.md). |
| [`docs/decisions/README.md`](docs/decisions/README.md) | Short, numbered records of significant decisions. |
| [`docs/plans/refactor/README.md`](docs/plans/refactor/README.md) | Per-phase refactor plans for the codebase, one per concern-area (the 10-phase decomposition). |
| [`docs/plans/refactor/phase-01-docs-context.md`](docs/plans/refactor/phase-01-docs-context.md) | Concern: the narrative/handoff docs (not the rules or hooks — those are phases 2/3). |
| [`docs/plans/refactor/phase-02-rules-drift.md`](docs/plans/refactor/phase-02-rules-drift.md) | Concern: .claude/rules/ + the rules section of CLAUDE.md. |
| [`docs/plans/refactor/phase-03-automation.md`](docs/plans/refactor/phase-03-automation.md) | Concern: .claude/hooks/, .claude/settings.json, .github/workflows/. |
| [`docs/plans/refactor/phase-04-shaders.md`](docs/plans/refactor/phase-04-shaders.md) | Concern: src/shaders/, src/gl/ vs the playback budget + write-our-own licensing. |
| [`docs/plans/refactor/phase-05-audio.md`](docs/plans/refactor/phase-05-audio.md) | Concern: src/audio/ (input.js, analyser.js, bpm.js) vs .claude/rules/audio.md. |
| [`docs/plans/refactor/phase-06-security-deploy.md`](docs/plans/refactor/phase-06-security-deploy.md) | Concern: secrets/PII, the deployed-site privacy surface, the deploy pipeline. |
| [`docs/plans/refactor/phase-07-deps-build.md`](docs/plans/refactor/phase-07-deps-build.md) | Concern: package.json, lockfile, vite.config.js, src-tauri/, tools/ build/gen tooling. |
| [`docs/plans/refactor/phase-08-rag-skills.md`](docs/plans/refactor/phase-08-rag-skills.md) | Concern: tools/rag/, tools/eval-skills.mjs, .claude/skills/ frontmatter, skills-lock.json, .claude/skills-router.md. |
| [`docs/plans/refactor/phase-09-tests-deadweight.md`](docs/plans/refactor/phase-09-tests-deadweight.md) | Concern: test/, perf-budget evidence, vestigial files, the Drive handoff, git hygiene. |
| [`docs/plans/refactor/phase-10-synthesis.md`](docs/plans/refactor/phase-10-synthesis.md) | Pulls phases 1–9 into one prioritized, dependency-ordered picture. |
| [`docs/plans/studio-refactor/NEXT-AGENT-PROMPT.md`](docs/plans/studio-refactor/NEXT-AGENT-PROMPT.md) | Paste this to the next agent at the start of its session. |
| [`docs/plans/studio-refactor/task_plan.md`](docs/plans/studio-refactor/task_plan.md) | Rewritten under the rule "do not assume anything." The earlier draft baked in a stack (Astro/R3F), a "first deliverable," and a phase order that the… |
| [`docs/prompts/claude-opus-4-8-system-prompt.md`](docs/prompts/claude-opus-4-8-system-prompt.md) | This is your pasted Claude system prompt, re-pointed from Claude Fable 5 to the model actually running, Claude Opus 4.8. |
| [`docs/prompts/system-prompt-ingest.md`](docs/prompts/system-prompt-ingest.md) | A thorough, auditable pass over the full consumer assistant system prompt (the "Fable 5" prompt the operator supplied), recording the disposition of… |
| [`docs/research/best-path-forward/findings.md`](docs/research/best-path-forward/findings.md) | Accumulating findings across compounding rounds (target: up to 15). |
| [`docs/superpowers/plans/2026-06-19-adopt-ideas-phase1.md`](docs/superpowers/plans/2026-06-19-adopt-ideas-phase1.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-19-automatic-skill-workflows.md`](docs/superpowers/plans/2026-06-19-automatic-skill-workflows.md) | For agentic workers: implement task-by-task; steps use - [ ] checkboxes. |
| [`docs/superpowers/plans/2026-06-19-full-repo-comparison.md`](docs/superpowers/plans/2026-06-19-full-repo-comparison.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-19-learn-from-corrections.md`](docs/superpowers/plans/2026-06-19-learn-from-corrections.md) | Self-improvement loop #1. |
| [`docs/superpowers/plans/2026-06-19-visual-workshop.md`](docs/superpowers/plans/2026-06-19-visual-workshop.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-20-eval-harness.md`](docs/superpowers/plans/2026-06-20-eval-harness.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-20-fmhy-link-harvester.md`](docs/superpowers/plans/2026-06-20-fmhy-link-harvester.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-20-portfolio-media-gathering.md`](docs/superpowers/plans/2026-06-20-portfolio-media-gathering.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-20-rag-downweight-structural.md`](docs/superpowers/plans/2026-06-20-rag-downweight-structural.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-20-rag-retrieval-polish.md`](docs/superpowers/plans/2026-06-20-rag-retrieval-polish.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/plans/2026-06-20-rag-semantic-recall.md`](docs/superpowers/plans/2026-06-20-rag-semantic-recall.md) | For agentic workers: REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this… |
| [`docs/superpowers/specs/2026-06-19-adopt-ideas-roadmap-design.md`](docs/superpowers/specs/2026-06-19-adopt-ideas-roadmap-design.md) | Date: 2026-06-19 · Status: approved, ready for plan. |
| [`docs/superpowers/specs/2026-06-19-agent-onboarding-design.md`](docs/superpowers/specs/2026-06-19-agent-onboarding-design.md) | Date: 2026-06-19 Status: approved (design); pending implementation plan Branch: claude/review-claude-md-di5jvm |
| [`docs/superpowers/specs/2026-06-19-full-repo-comparison-design.md`](docs/superpowers/specs/2026-06-19-full-repo-comparison-design.md) | Date: 2026-06-19 · Status: approved, ready for plan. |
| [`docs/superpowers/specs/2026-06-19-visual-workshop-design.md`](docs/superpowers/specs/2026-06-19-visual-workshop-design.md) | Date: 2026-06-19 Status: approved (design); pending implementation plan Branch: claude/review-claude-md-di5jvm |
| [`docs/superpowers/specs/2026-06-20-fmhy-link-harvester-design.md`](docs/superpowers/specs/2026-06-20-fmhy-link-harvester-design.md) | Date: 2026-06-20 · Status: approved, ready for plan. |
| [`docs/superpowers/specs/2026-06-20-portfolio-media-gathering-design.md`](docs/superpowers/specs/2026-06-20-portfolio-media-gathering-design.md) | Date: 2026-06-20 · Branch: claude/init-r8ukva · Status: design (awaiting user review) · Method: brainstorming → (next) writing-plans. |
| [`docs/superpowers/specs/2026-06-20-rag-downweight-structural-design.md`](docs/superpowers/specs/2026-06-20-rag-downweight-structural-design.md) | Date: 2026-06-20 · Status: approved (brainstorm) · Area: dev-tooling (tools/rag/) Follows: 2026-06-20-rag-retrieval-polish-design.md (which… |
| [`docs/superpowers/specs/2026-06-20-rag-retrieval-polish-design.md`](docs/superpowers/specs/2026-06-20-rag-retrieval-polish-design.md) | Date: 2026-06-20 · Status: approved (brainstorm) · Area: dev-tooling (tools/rag/) Source thread: progress.md → "RAG retrieval-quality follow-ups… |
| [`docs/superpowers/specs/2026-06-20-rag-semantic-recall-design.md`](docs/superpowers/specs/2026-06-20-rag-semantic-recall-design.md) | Date: 2026-06-20 Status: approved design, ready for writing-plans Brief: research/rag-system/BRIEF.md (the full non-local RAG vision) Parked thread:… |
| [`docs/superpowers/specs/2026-06-20-secrets-management-design.md`](docs/superpowers/specs/2026-06-20-secrets-management-design.md) | Date: 2026-06-20 · Branch: claude/init-r8ukva · Status: design (for review) · Method: brainstorming (done, parked) → this spec → writing-plans → SDD. |
| [`docs/superpowers/specs/2026-06-21-best-path-forward-design.md`](docs/superpowers/specs/2026-06-21-best-path-forward-design.md) | Status: design, for operator review · Date: 2026-06-21 Backing research: docs/research/best-path-forward/findings.md (2 deep rounds, 6 agents, ~45… |

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
| [`test/eval-skills.test.mjs`](test/eval-skills.test.mjs) | MJS file. |
| [`test/eval/outcomes.json`](test/eval/outcomes.json) | Configuration / data file. |
| [`test/eval/triggers.json`](test/eval/triggers.json) | Configuration / data file. |
| [`test/guard.test.mjs`](test/guard.test.mjs) | MJS file. |
| [`test/harvest-links.test.mjs`](test/harvest-links.test.mjs) | MJS file. |
| [`test/portfolio.test.mjs`](test/portfolio.test.mjs) | MJS file. |
| [`test/rag.test.mjs`](test/rag.test.mjs) | MJS file. |
| [`test/reel-ingest.test.mjs`](test/reel-ingest.test.mjs) | MJS file. |
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
| [`tools/check-config.mjs`](tools/check-config.mjs) | Self-auditing config gate: assert the always-on config invariants that have silently drifted before (CLAUDE.md size, the generated router markers,… |
| [`tools/eval-skills.mjs`](tools/eval-skills.mjs) | Eval harness for primordial skills — Tier 1: static frontmatter gate. |
| [`tools/gen-docs.mjs`](tools/gen-docs.mjs) | Generates two always-current repo maps from a single source of truth: ENCYCLOPEDIA.md — a categorized index of every file, each with a one-line… |
| [`tools/harvest-links.mjs`](tools/harvest-links.mjs) | Harvest a markdown "index of links" (e.g. |
| [`tools/health.mjs`](tools/health.mjs) | Consolidated repo health check - runs the local gates in one pass and prints a PASS/FAIL dashboard. |
| [`tools/mcp/lib/browser.mjs`](tools/mcp/lib/browser.mjs) | Shared headless-Chromium launch for the WebGL2 dev tools (shader validation, render checks). |
| [`tools/mcp/lib/docs.mjs`](tools/mcp/lib/docs.mjs) | Project Q&A: keyword search + retrieval over the repo's own markdown docs, so an assistant can answer questions about the project. |
| [`tools/mcp/lib/looks.mjs`](tools/mcp/lib/looks.mjs) | Looks/preset management: list, validate, and create/update the params-only JSON "looks" in src/looks/, keeping src/looks/registry.js's generated… |
| [`tools/mcp/lib/render.mjs`](tools/mcp/lib/render.mjs) | Reusable headless render check: load the app in headless Chromium (WebGL2 via SwiftShader), confirm it boots and renders, and capture a screenshot +… |
| [`tools/mcp/lib/site.mjs`](tools/mcp/lib/site.mjs) | Live-site health for primordial.video (read-only — no credentials). |
| [`tools/mcp/lib/validate.mjs`](tools/mcp/lib/validate.mjs) | Headless GLSL ES 3.00 validation: compile + link the project's shaders in a real WebGL2 context (ANGLE/SwiftShader via Playwright) — the exact… |
| [`tools/mcp/selftest.mjs`](tools/mcp/selftest.mjs) | Self-test for the primordial MCP server: spawns server.mjs over stdio using the MCP SDK client, lists tools/resources/prompts, and exits non-zero if… |
| [`tools/mcp/server.mjs`](tools/mcp/server.mjs) | Primordial-viz MCP server — local stdio dev tools for AI assistants working on this project. |
| [`tools/portfolio/build-sheet.mjs`](tools/portfolio/build-sheet.mjs) | Render a phone-friendly ranked contact sheet from a manifest. |
| [`tools/portfolio/normalize-takeout.mjs`](tools/portfolio/normalize-takeout.mjs) | Flatten an unzipped Google Takeout tree to media files, re-merging the per-file JSON sidecars (renamed to *.supplemental-metadata.json in late 2024). |
| [`tools/portfolio/pull-drive.mjs`](tools/portfolio/pull-drive.mjs) | Pull media from one Google Drive folder. |
| [`tools/portfolio/schema.mjs`](tools/portfolio/schema.mjs) | tools/portfolio/schema.mjs Shared manifest contract for the portfolio gathering pipeline. |
| [`tools/portfolio/sort-vision.mjs`](tools/portfolio/sort-vision.mjs) | tools/portfolio/sort-vision.mjs Score each candidate with a vision model and produce a ranked manifest. |
| [`tools/portfolio/stage-finals.mjs`](tools/portfolio/stage-finals.mjs) | Parse the keeper ids from the GitHub issue body and stage the chosen finals. |
| [`tools/rag/README.md`](tools/rag/README.md) | Dev-tooling. |
| [`tools/rag/ab-model.mjs`](tools/rag/ab-model.mjs) | tools/rag/ab-model.mjs One-off A/B: compare embedding models on the probe set. |
| [`tools/rag/build-index.mjs`](tools/rag/build-index.mjs) | tools/rag/build-index.mjs Build the committed semantic index: chunk -> embed -> write index.json. |
| [`tools/rag/chunk.mjs`](tools/rag/chunk.mjs) | Splits the repo's markdown corpus into heading-section chunks for embedding. |
| [`tools/rag/embed.mjs`](tools/rag/embed.mjs) | tools/rag/embed.mjs Local text embeddings via a small transformer (no doc text leaves the machine, no API key). |
| [`tools/rag/index.json`](tools/rag/index.json) | Configuration / data file. |
| [`tools/rag/model.mjs`](tools/rag/model.mjs) | tools/rag/model.mjs Dep-free model constants. |
| [`tools/rag/probes.mjs`](tools/rag/probes.mjs) | tools/rag/probes.mjs Canonical retrieval probe set: query → substring the #1 result's path must contain. |
| [`tools/rag/quantize.mjs`](tools/rag/quantize.mjs) | tools/rag/quantize.mjs Dep-free int8 vector compaction for the committed RAG index. |
| [`tools/rag/retrieve.mjs`](tools/rag/retrieve.mjs) | tools/rag/retrieve.mjs Hybrid semantic + lexical retrieval over the committed index. |
| [`tools/reel/ingest.mjs`](tools/reel/ingest.mjs) | Reel ingest — turn a video URL (Instagram / YouTube / etc.) OR a local mp4 into something an agent can actually "see": download it, then extract a… |
| [`tools/workshop/clip.mjs`](tools/workshop/clip.mjs) | Record a workshop sketch to a webm clip (and optional stills) for phone review. |

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
| [`.claude/hooks/guard.mjs`](.claude/hooks/guard.mjs) | PreToolUse hook (matcher: Bash) — destructive-command guard. |
| [`.claude/hooks/inject-rules.sh`](.claude/hooks/inject-rules.sh) | PreToolUse hook (matcher: Edit\|Write). |
| [`.claude/hooks/orient.sh`](.claude/hooks/orient.sh) | SessionStart hook: orient a fresh agent (especially cloud/phone sessions) with zero typing — repo state, branch + recent commits, the latest handoff… |
| [`.claude/hooks/precompact-handoff.sh`](.claude/hooks/precompact-handoff.sh) | PreCompact hook: before the session compacts, remind to capture continuity in progress.md so mid-session state isn't lost. |
| [`.claude/hooks/suggest-workflow.sh`](.claude/hooks/suggest-workflow.sh) | UserPromptSubmit hook: when the prompt looks like a substantial build/feature or a new visual-look task, inject a NON-BLOCKING nudge toward the… |
| [`.claude/rules/audio.md`](.claude/rules/audio.md) | Scoped to the audio capture + analysis code. |
| [`.claude/rules/conduct.md`](.claude/rules/conduct.md) | The transferable, behaviour-shaping parts of a complete consumer assistant system prompt, adapted to this repo (a dev tool, driven from a phone). |
| [`.claude/rules/deploy.md`](.claude/rules/deploy.md) | Facts about the host. |
| [`.claude/rules/gotchas.md`](.claude/rules/gotchas.md) | Distilled tribal knowledge so the same loops don't recur (anti-footgun manual, trailofbits pattern). |
| [`.claude/rules/mobile-ergonomics.md`](.claude/rules/mobile-ergonomics.md) | The operator runs this project from an Android phone, not a laptop. |
| [`.claude/rules/shaders.md`](.claude/rules/shaders.md) | Scoped to the shader/renderer code. |
| [`.claude/settings.json`](.claude/settings.json) | Claude Code hooks + permissions for this repo. |
| [`.claude/skills-router.md`](.claude/skills-router.md) | The routing map of skills by area. |
| [`.claude/skills/accessibility/SKILL.md`](.claude/skills/accessibility/SKILL.md) | Audit and improve web accessibility following WCAG 2.2 guidelines. Use when asked to "improve accessibility", "a11y audit", "WCAG compliance",… |
| [`.claude/skills/accessibility/references/A11Y-PATTERNS.md`](.claude/skills/accessibility/references/A11Y-PATTERNS.md) | Practical, copy-paste-ready patterns for common accessibility requirements. |
| [`.claude/skills/accessibility/references/WCAG.md`](.claude/skills/accessibility/references/WCAG.md) | html <button>Label</button> <!-- or --> <button aria-label="Close dialog">×</button> |
| [`.claude/skills/astro-framework/AGENTS.md`](.claude/skills/astro-framework/AGENTS.md) | Version: 2.0.0 \| Astro 5.x \| Updated: 2026-03-22 \| Author: [webreactiva.com](https://webreactiva.com/ia) |
| [`.claude/skills/astro-framework/SKILL.md`](.claude/skills/astro-framework/SKILL.md) | Astro framework specialist for building fast, content-driven websites with islands architecture. Use when creating Astro components, configuring… |
| [`.claude/skills/astro-framework/references/actions.md`](.claude/skills/astro-framework/references/actions.md) | Actions provide type-safe form handling and server functions in Astro. |
| [`.claude/skills/astro-framework/references/client-directives.md`](.claude/skills/astro-framework/references/client-directives.md) | Client directives control how UI framework components (React, Vue, Svelte, etc.) are hydrated on the client. |
| [`.claude/skills/astro-framework/references/components.md`](.claude/skills/astro-framework/references/components.md) | astro --- // Component Script (Frontmatter) // Runs on the server at build time (or request time for SSR) import SomeComponent from… |
| [`.claude/skills/astro-framework/references/configuration.md`](.claude/skills/astro-framework/references/configuration.md) | Astro configuration lives in astro.config.mjs at the project root. |
| [`.claude/skills/astro-framework/references/content-collections.md`](.claude/skills/astro-framework/references/content-collections.md) | Content collections provide type-safe content management with schema validation using Zod. |
| [`.claude/skills/astro-framework/references/environment-variables.md`](.claude/skills/astro-framework/references/environment-variables.md) | Added in: Astro 5.0+ |
| [`.claude/skills/astro-framework/references/i18n-routing.md`](.claude/skills/astro-framework/references/i18n-routing.md) | Astro's built-in i18n routing helps you build multilingual sites with URL-based locale management, fallback content, and helper functions. |
| [`.claude/skills/astro-framework/references/images.md`](.claude/skills/astro-framework/references/images.md) | Astro provides built-in image optimization through the astro:assets module. |
| [`.claude/skills/astro-framework/references/middleware.md`](.claude/skills/astro-framework/references/middleware.md) | Middleware intercepts requests and responses, allowing you to add logic before pages render. |
| [`.claude/skills/astro-framework/references/routing.md`](.claude/skills/astro-framework/references/routing.md) | Astro uses file-based routing in the src/pages/ directory. |
| [`.claude/skills/astro-framework/references/server-islands.md`](.claude/skills/astro-framework/references/server-islands.md) | Server islands allow you to defer rendering of specific Astro components to the server, loading them independently from the rest of the page. |
| [`.claude/skills/astro-framework/references/sessions.md`](.claude/skills/astro-framework/references/sessions.md) | Sessions store data on the server between requests for on-demand rendered pages. |
| [`.claude/skills/astro-framework/references/ssr-adapters.md`](.claude/skills/astro-framework/references/ssr-adapters.md) | Astro supports on-demand server rendering with various deployment adapters. |
| [`.claude/skills/astro-framework/references/styling.md`](.claude/skills/astro-framework/references/styling.md) | Astro supports various styling approaches with scoped styles as the default. |
| [`.claude/skills/astro-framework/references/view-transitions.md`](.claude/skills/astro-framework/references/view-transitions.md) | Astro's View Transitions provide smooth navigation between pages without full page reloads. |
| [`.claude/skills/astro-framework/rules/astro-components.rule.md`](.claude/skills/astro-framework/rules/astro-components.rule.md) | Rules for writing Astro components |
| [`.claude/skills/astro-framework/rules/astro-images.rule.md`](.claude/skills/astro-framework/rules/astro-images.rule.md) | Rules for image optimization in Astro |
| [`.claude/skills/astro-framework/rules/astro-routing.rule.md`](.claude/skills/astro-framework/rules/astro-routing.rule.md) | Rules for Astro routing and pages |
| [`.claude/skills/astro-framework/rules/astro-ssr.rule.md`](.claude/skills/astro-framework/rules/astro-ssr.rule.md) | Rules for SSR and hybrid rendering |
| [`.claude/skills/astro-framework/rules/astro-typescript.rule.md`](.claude/skills/astro-framework/rules/astro-typescript.rule.md) | Rules for TypeScript configuration in Astro projects |
| [`.claude/skills/astro-framework/rules/client-hydration.rule.md`](.claude/skills/astro-framework/rules/client-hydration.rule.md) | Rules for client-side hydration and islands architecture |
| [`.claude/skills/astro-framework/rules/content-collections.rule.md`](.claude/skills/astro-framework/rules/content-collections.rule.md) | Rules for content collections and type-safe content |
| [`.claude/skills/astro-framework/rules/server-islands.rule.md`](.claude/skills/astro-framework/rules/server-islands.rule.md) | Rules for server islands with deferred rendering |
| [`.claude/skills/astro-framework/rules/sessions.rule.md`](.claude/skills/astro-framework/rules/sessions.rule.md) | Rules for server-side sessions |
| [`.claude/skills/brainstorming/SKILL.md`](.claude/skills/brainstorming/SKILL.md) | You MUST use this before any creative work - creating features, building components, adding functionality, or modifying behavior. Explores user… |
| [`.claude/skills/brainstorming/scripts/frame-template.html`](.claude/skills/brainstorming/scripts/frame-template.html) | Superpowers Brainstorming |
| [`.claude/skills/brainstorming/scripts/helper.js`](.claude/skills/brainstorming/scripts/helper.js) | JS file. |
| [`.claude/skills/brainstorming/scripts/server.cjs`](.claude/skills/brainstorming/scripts/server.cjs) | CJS file. |
| [`.claude/skills/brainstorming/scripts/start-server.sh`](.claude/skills/brainstorming/scripts/start-server.sh) | Start the brainstorm server and output connection info Usage: start-server.sh [--project-dir <path>] [--host <bind-host>] [--url-host… |
| [`.claude/skills/brainstorming/scripts/stop-server.sh`](.claude/skills/brainstorming/scripts/stop-server.sh) | Stop the brainstorm server and clean up Usage: stop-server.sh <session_dir> Kills the server process. |
| [`.claude/skills/brainstorming/spec-document-reviewer-prompt.md`](.claude/skills/brainstorming/spec-document-reviewer-prompt.md) | Use this template when dispatching a spec document reviewer subagent. |
| [`.claude/skills/brainstorming/visual-companion.md`](.claude/skills/brainstorming/visual-companion.md) | Browser-based visual brainstorming companion for showing mockups, diagrams, and options. |
| [`.claude/skills/codebase-design/DEEPENING.md`](.claude/skills/codebase-design/DEEPENING.md) | How to deepen a cluster of shallow modules safely, given its dependencies. |
| [`.claude/skills/codebase-design/DESIGN-IT-TWICE.md`](.claude/skills/codebase-design/DESIGN-IT-TWICE.md) | When the user wants to explore alternative interfaces for a chosen deepening candidate, use this parallel sub-agent pattern. |
| [`.claude/skills/codebase-design/SKILL.md`](.claude/skills/codebase-design/SKILL.md) | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities,… |
| [`.claude/skills/debugging-and-error-recovery/SKILL.md`](.claude/skills/debugging-and-error-recovery/SKILL.md) | Guides systematic root-cause debugging. Use when tests fail, builds break, behavior doesn't match expectations, or you encounter any unexpected… |
| [`.claude/skills/deploy-check/SKILL.md`](.claude/skills/deploy-check/SKILL.md) | Diagnose the deploy pipeline in one pass — check the latest GitHub Actions deploy run, pull failing job logs, confirm the required FTP_PASSWORD… |
| [`.claude/skills/deploy-cpanel/SKILL.md`](.claude/skills/deploy-cpanel/SKILL.md) | Manual deploy checklist for shipping primordial to Namecheap Stellar Plus (cPanel). Invoke deliberately when deploying; not auto-activated. |
| [`.claude/skills/dispatching-parallel-agents/SKILL.md`](.claude/skills/dispatching-parallel-agents/SKILL.md) | Use when facing 2+ independent tasks that can be worked on without shared state or sequential dependencies |
| [`.claude/skills/documentation-and-adrs/SKILL.md`](.claude/skills/documentation-and-adrs/SKILL.md) | Records decisions and documentation. Use when making architectural decisions, changing public APIs, shipping features, or when you need to record… |
| [`.claude/skills/domain-modeling/ADR-FORMAT.md`](.claude/skills/domain-modeling/ADR-FORMAT.md) | ADRs live in docs/adr/ and use sequential numbering: 0001-slug.md, 0002-slug.md, etc. |
| [`.claude/skills/domain-modeling/CONTEXT-FORMAT.md`](.claude/skills/domain-modeling/CONTEXT-FORMAT.md) | md |
| [`.claude/skills/domain-modeling/SKILL.md`](.claude/skills/domain-modeling/SKILL.md) | Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural… |
| [`.claude/skills/executing-plans/SKILL.md`](.claude/skills/executing-plans/SKILL.md) | Use when you have a written implementation plan to execute in a separate session with review checkpoints |
| [`.claude/skills/find-docs/SKILL.md`](.claude/skills/find-docs/SKILL.md) | >- |
| [`.claude/skills/finishing-a-development-branch/SKILL.md`](.claude/skills/finishing-a-development-branch/SKILL.md) | Use when implementation is complete, all tests pass, and you need to decide how to integrate the work - guides completion of development work by… |
| [`.claude/skills/frontend-design/LICENSE.txt`](.claude/skills/frontend-design/LICENSE.txt) | Plain-text notes. |
| [`.claude/skills/frontend-design/SKILL.md`](.claude/skills/frontend-design/SKILL.md) | Guidance for distinctive, intentional visual design when building new UI or reshaping an existing one. Helps with aesthetic direction, typography,… |
| [`.claude/skills/grill-with-docs/SKILL.md`](.claude/skills/grill-with-docs/SKILL.md) | A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go. |
| [`.claude/skills/health/SKILL.md`](.claude/skills/health/SKILL.md) | One-pass repo + deploy health check, then route any failure to its fix. Runs the local gates (npm run health - JS syntax, smoke, site audit,… |
| [`.claude/skills/improve-codebase-architecture/HTML-REPORT.md`](.claude/skills/improve-codebase-architecture/HTML-REPORT.md) | The architectural review is rendered as a single self-contained HTML file in the OS temp directory. |
| [`.claude/skills/improve-codebase-architecture/SKILL.md`](.claude/skills/improve-codebase-architecture/SKILL.md) | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. |
| [`.claude/skills/legacy-modernizer/SKILL.md`](.claude/skills/legacy-modernizer/SKILL.md) | Designs incremental migration strategies, identifies service boundaries, produces dependency maps and migration roadmaps, and generates API facade… |
| [`.claude/skills/legacy-modernizer/references/legacy-testing.md`](.claude/skills/legacy-modernizer/references/legacy-testing.md) | Tests that document current behavior (even if buggy) before refactoring. |
| [`.claude/skills/legacy-modernizer/references/migration-strategies.md`](.claude/skills/legacy-modernizer/references/migration-strategies.md) | python |
| [`.claude/skills/legacy-modernizer/references/refactoring-patterns.md`](.claude/skills/legacy-modernizer/references/refactoring-patterns.md) | Enables large refactorings to happen incrementally without breaking existing code. |
| [`.claude/skills/legacy-modernizer/references/strangler-fig-pattern.md`](.claude/skills/legacy-modernizer/references/strangler-fig-pattern.md) | The strangler fig pattern gradually replaces legacy systems by incrementally building new functionality around the old system, eventually… |
| [`.claude/skills/legacy-modernizer/references/system-assessment.md`](.claude/skills/legacy-modernizer/references/system-assessment.md) | python |
| [`.claude/skills/lesson/SKILL.md`](.claude/skills/lesson/SKILL.md) | Capture a correction or lesson durably so the same mistake doesn't recur. Use right after the user corrects a wrong assumption, an over-applied… |
| [`.claude/skills/new-preset/SKILL.md`](.claude/skills/new-preset/SKILL.md) | Scaffold a new visual "look" for primordial — a params-only JSON preset in src/looks/, wired into the look registry (all looks share the slime… |
| [`.claude/skills/park/SKILL.md`](.claude/skills/park/SKILL.md) | Park the current in-progress thread (a design, task, or decision we're partway through) into the "Open threads" list in progress.md with enough… |
| [`.claude/skills/perf-budget/SKILL.md`](.claude/skills/perf-budget/SKILL.md) | Run the in-app FPS stress-test readout for primordial and read its SMOOTH / OK / TOO-MUCH verdict to set the mobile performance budget (FBO… |
| [`.claude/skills/performance/SKILL.md`](.claude/skills/performance/SKILL.md) | Optimize web performance for faster loading and better user experience. Use when asked to "speed up my site", "optimize performance", "reduce load… |
| [`.claude/skills/planning-with-files/SKILL.md`](.claude/skills/planning-with-files/SKILL.md) | This skill should be used when starting complex multi-step tasks, research projects, or any task requiring >5 tool calls. Implements Manus-style… |
| [`.claude/skills/r3f-shaders/SKILL.md`](.claude/skills/r3f-shaders/SKILL.md) | React Three Fiber shaders - GLSL, shaderMaterial, uniforms, custom effects. Use when creating custom visual effects, modifying vertices, writing… |
| [`.claude/skills/receiving-code-review/SKILL.md`](.claude/skills/receiving-code-review/SKILL.md) | Use when receiving code review feedback, before implementing suggestions, especially if feedback seems unclear or technically questionable -… |
| [`.claude/skills/reel-ingest/SKILL.md`](.claude/skills/reel-ingest/SKILL.md) | Download a video reference (Instagram reel / YouTube short / any URL) or an uploaded mp4, then extract a frame montage + metadata so it can actually… |
| [`.claude/skills/reorient/SKILL.md`](.claude/skills/reorient/SKILL.md) | Use when starting in a fresh container, after /clear, or after a context compaction — when you've lost the repo's state and need to reload the… |
| [`.claude/skills/requesting-code-review/SKILL.md`](.claude/skills/requesting-code-review/SKILL.md) | Use when completing tasks, implementing major features, or before merging to verify work meets requirements |
| [`.claude/skills/requesting-code-review/code-reviewer.md`](.claude/skills/requesting-code-review/code-reviewer.md) | Use this template when dispatching a code reviewer subagent. |
| [`.claude/skills/send-report/SKILL.md`](.claude/skills/send-report/SKILL.md) | Send the newest /insights usage report to the user as a file. Use after running /insights when the file:/// link can't be opened (mobile/cloud… |
| [`.claude/skills/setup-matt-pocock-skills/SKILL.md`](.claude/skills/setup-matt-pocock-skills/SKILL.md) | Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use… |
| [`.claude/skills/setup-matt-pocock-skills/domain.md`](.claude/skills/setup-matt-pocock-skills/domain.md) | How the engineering skills should consume this repo's domain documentation when exploring the codebase. |
| [`.claude/skills/setup-matt-pocock-skills/issue-tracker-github.md`](.claude/skills/setup-matt-pocock-skills/issue-tracker-github.md) | Issues and PRDs for this repo live as GitHub issues. |
| [`.claude/skills/setup-matt-pocock-skills/issue-tracker-gitlab.md`](.claude/skills/setup-matt-pocock-skills/issue-tracker-gitlab.md) | Issues and PRDs for this repo live as GitLab issues. |
| [`.claude/skills/setup-matt-pocock-skills/issue-tracker-local.md`](.claude/skills/setup-matt-pocock-skills/issue-tracker-local.md) | Issues and PRDs for this repo live as markdown files in .scratch/. |
| [`.claude/skills/setup-matt-pocock-skills/triage-labels.md`](.claude/skills/setup-matt-pocock-skills/triage-labels.md) | The skills speak in terms of five canonical triage roles. |
| [`.claude/skills/skill-router/SKILL.md`](.claude/skills/skill-router/SKILL.md) | Route to the right IN-REPO skill and keep the local skill registry in sync — regenerate the "Skills by area" router block (.claude/skills-router.md,… |
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
| [`.claude/skills/visual-workshop/SKILL.md`](.claude/skills/visual-workshop/SKILL.md) | Workshop visuals for primordial in a throwaway sandbox, separate from the shipped app - discuss a direction, optionally research similar/trending… |
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
| [`research/claude-repo-comparison/BRIEF.md`](research/claude-repo-comparison/BRIEF.md) | Status: QUEUED for the next agent session. |
| [`research/claude-repo-comparison/REPORT.md`](research/claude-repo-comparison/REPORT.md) | Date: 2026-06-19 · Axis: Claude-agent tooling + methodology. |
| [`research/corpus/claude-code-auto-memory-guide.md`](research/corpus/claude-code-auto-memory-guide.md) | Every AI coding tool has the same dirty secret: on Monday, it doesn't remember anything you told it on Friday. |
| [`research/corpus/claude-code-best-practices.md`](research/corpus/claude-code-best-practices.md) | Most people who bounce off Claude Code don't bounce off the model. |
| [`research/corpus/claude-code-workflows-10x-productivity.md`](research/corpus/claude-code-workflows-10x-productivity.md) | Most developers use Claude Code the same way: type a question, get an answer, copy-paste. |
| [`research/corpus/claude-md-guide.md`](research/corpus/claude-md-guide.md) | If you're using Claude Code — Anthropic's agentic coding tool for the terminal — you've probably noticed it works pretty well out of the box. |
| [`research/corpus/context-engineering-claude-code.md`](research/corpus/context-engineering-claude-code.md) | The difference between developers who get mediocre output from Claude Code and those who get production-ready code on the first try almost always… |
| [`research/corpus/mcp-servers-guide.md`](research/corpus/mcp-servers-guide.md) | Out of the box, Claude Code can read your files, write code, and run terminal commands. |
| [`research/eval-harness/BRIEF.md`](research/eval-harness/BRIEF.md) | Status: prep for a brainstorm (NOT a design). |
| [`research/findings/fmhy-tooling.md`](research/findings/fmhy-tooling.md) | Deep-research synthesis (4 parallel passes, adversarially verified). |
| [`research/findings/mcp-adoption.md`](research/findings/mcp-adoption.md) | Deep-research synthesis (5 parallel search angles, adversarially verified). |
| [`research/findings/mcp-build-our-own.md`](research/findings/mcp-build-our-own.md) | Deep-research synthesis (5 parallel search angles, adversarially verified). |
| [`research/fmhy-dev-tools/CATALOG.md`](research/fmhy-dev-tools/CATALOG.md) | Source: https://fmhy.net/developer-tools · fetched 2026-06-20 · 1570 entries (6 excluded by safety gate). |
| [`research/fmhy-dev-tools/README.md`](research/fmhy-dev-tools/README.md) | A structured, safety-gated catalog of the FMHY "Developer Tools" index (https://fmhy.net/developer-tools), plus a Primordial-relevant shortlist. |
| [`research/fmhy-dev-tools/SHORTLIST.md`](research/fmhy-dev-tools/SHORTLIST.md) | Filtered from the FMHY dev-tools catalog (124 candidates, safety-gated per task-3 CATALOG.md). |
| [`research/fmhy-dev-tools/links.json`](research/fmhy-dev-tools/links.json) | Configuration / data file. |
| [`research/fmhy-dev-tools/source.md`](research/fmhy-dev-tools/source.md) | [◄◄ Back to Wiki Index](https://www.reddit.com/r/FREEMEDIAHECKYEAH/wiki/tools-index) |
| [`research/landing-page-rag/BRIEF.md`](research/landing-page-rag/BRIEF.md) | Self-contained task for a fresh agent. |
| [`research/product-domain-comparison/REPORT.md`](research/product-domain-comparison/REPORT.md) | Date: 2026-06-19 · Axis: the product — raw-WebGL2 / GLSL-shader / audio-reactive visual web apps — regardless of whether the peer uses Claude. |
| [`research/rag-system/BRIEF.md`](research/rag-system/BRIEF.md) | Status: prep for a brainstorm. |
| [`research/scripts/crawl-site.py`](research/scripts/crawl-site.py) | Python script. |
| [`research/scripts/scrape-blog.py`](research/scripts/scrape-blog.py) | Python script. |

## CI / Build Config

| File | Description |
| --- | --- |
| [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) | CI / workflow configuration. |
| [`.github/workflows/eval-skills.yml`](.github/workflows/eval-skills.yml) | CI / workflow configuration. |
| [`.github/workflows/portfolio.yml`](.github/workflows/portfolio.yml) | .github/workflows/portfolio.yml |
| [`.github/workflows/verify.yml`](.github/workflows/verify.yml) | CI: syntax-check, smoke test, and headless render check on every push. |
| [`.gitignore`](.gitignore) | deps / build |
| [`.mcp.json`](.mcp.json) | Project-scoped MCP server configuration for Claude Code. |
| [`package-lock.json`](package-lock.json) | Locked dependency tree for reproducible dev-tool installs. |
| [`package.json`](package.json) | npm manifest — scripts + dev dependencies only (the app runtime stays zero-dependency). |

## Other

| File | Description |
| --- | --- |
| [`.agents/skills/astro-framework/AGENTS.md`](.agents/skills/astro-framework/AGENTS.md) | Version: 2.0.0 \| Astro 5.x \| Updated: 2026-03-22 \| Author: [webreactiva.com](https://webreactiva.com/ia) |
| [`.agents/skills/astro-framework/SKILL.md`](.agents/skills/astro-framework/SKILL.md) | Astro framework specialist for building fast, content-driven websites with islands architecture. Use when creating Astro components, configuring… |
| [`.agents/skills/astro-framework/references/actions.md`](.agents/skills/astro-framework/references/actions.md) | Actions provide type-safe form handling and server functions in Astro. |
| [`.agents/skills/astro-framework/references/client-directives.md`](.agents/skills/astro-framework/references/client-directives.md) | Client directives control how UI framework components (React, Vue, Svelte, etc.) are hydrated on the client. |
| [`.agents/skills/astro-framework/references/components.md`](.agents/skills/astro-framework/references/components.md) | astro --- // Component Script (Frontmatter) // Runs on the server at build time (or request time for SSR) import SomeComponent from… |
| [`.agents/skills/astro-framework/references/configuration.md`](.agents/skills/astro-framework/references/configuration.md) | Astro configuration lives in astro.config.mjs at the project root. |
| [`.agents/skills/astro-framework/references/content-collections.md`](.agents/skills/astro-framework/references/content-collections.md) | Content collections provide type-safe content management with schema validation using Zod. |
| [`.agents/skills/astro-framework/references/environment-variables.md`](.agents/skills/astro-framework/references/environment-variables.md) | Added in: Astro 5.0+ |
| [`.agents/skills/astro-framework/references/i18n-routing.md`](.agents/skills/astro-framework/references/i18n-routing.md) | Astro's built-in i18n routing helps you build multilingual sites with URL-based locale management, fallback content, and helper functions. |
| [`.agents/skills/astro-framework/references/images.md`](.agents/skills/astro-framework/references/images.md) | Astro provides built-in image optimization through the astro:assets module. |
| [`.agents/skills/astro-framework/references/middleware.md`](.agents/skills/astro-framework/references/middleware.md) | Middleware intercepts requests and responses, allowing you to add logic before pages render. |
| [`.agents/skills/astro-framework/references/routing.md`](.agents/skills/astro-framework/references/routing.md) | Astro uses file-based routing in the src/pages/ directory. |
| [`.agents/skills/astro-framework/references/server-islands.md`](.agents/skills/astro-framework/references/server-islands.md) | Server islands allow you to defer rendering of specific Astro components to the server, loading them independently from the rest of the page. |
| [`.agents/skills/astro-framework/references/sessions.md`](.agents/skills/astro-framework/references/sessions.md) | Sessions store data on the server between requests for on-demand rendered pages. |
| [`.agents/skills/astro-framework/references/ssr-adapters.md`](.agents/skills/astro-framework/references/ssr-adapters.md) | Astro supports on-demand server rendering with various deployment adapters. |
| [`.agents/skills/astro-framework/references/styling.md`](.agents/skills/astro-framework/references/styling.md) | Astro supports various styling approaches with scoped styles as the default. |
| [`.agents/skills/astro-framework/references/view-transitions.md`](.agents/skills/astro-framework/references/view-transitions.md) | Astro's View Transitions provide smooth navigation between pages without full page reloads. |
| [`.agents/skills/astro-framework/rules/astro-components.rule.md`](.agents/skills/astro-framework/rules/astro-components.rule.md) | Rules for writing Astro components |
| [`.agents/skills/astro-framework/rules/astro-images.rule.md`](.agents/skills/astro-framework/rules/astro-images.rule.md) | Rules for image optimization in Astro |
| [`.agents/skills/astro-framework/rules/astro-routing.rule.md`](.agents/skills/astro-framework/rules/astro-routing.rule.md) | Rules for Astro routing and pages |
| [`.agents/skills/astro-framework/rules/astro-ssr.rule.md`](.agents/skills/astro-framework/rules/astro-ssr.rule.md) | Rules for SSR and hybrid rendering |
| [`.agents/skills/astro-framework/rules/astro-typescript.rule.md`](.agents/skills/astro-framework/rules/astro-typescript.rule.md) | Rules for TypeScript configuration in Astro projects |
| [`.agents/skills/astro-framework/rules/client-hydration.rule.md`](.agents/skills/astro-framework/rules/client-hydration.rule.md) | Rules for client-side hydration and islands architecture |
| [`.agents/skills/astro-framework/rules/content-collections.rule.md`](.agents/skills/astro-framework/rules/content-collections.rule.md) | Rules for content collections and type-safe content |
| [`.agents/skills/astro-framework/rules/server-islands.rule.md`](.agents/skills/astro-framework/rules/server-islands.rule.md) | Rules for server islands with deferred rendering |
| [`.agents/skills/astro-framework/rules/sessions.rule.md`](.agents/skills/astro-framework/rules/sessions.rule.md) | Rules for server-side sessions |
| [`.agents/skills/codebase-design/DEEPENING.md`](.agents/skills/codebase-design/DEEPENING.md) | How to deepen a cluster of shallow modules safely, given its dependencies. |
| [`.agents/skills/codebase-design/DESIGN-IT-TWICE.md`](.agents/skills/codebase-design/DESIGN-IT-TWICE.md) | When the user wants to explore alternative interfaces for a chosen deepening candidate, use this parallel sub-agent pattern. |
| [`.agents/skills/codebase-design/SKILL.md`](.agents/skills/codebase-design/SKILL.md) | Shared vocabulary for designing deep modules. Use when the user wants to design or improve a module's interface, find deepening opportunities,… |
| [`.agents/skills/domain-modeling/ADR-FORMAT.md`](.agents/skills/domain-modeling/ADR-FORMAT.md) | ADRs live in docs/adr/ and use sequential numbering: 0001-slug.md, 0002-slug.md, etc. |
| [`.agents/skills/domain-modeling/CONTEXT-FORMAT.md`](.agents/skills/domain-modeling/CONTEXT-FORMAT.md) | md |
| [`.agents/skills/domain-modeling/SKILL.md`](.agents/skills/domain-modeling/SKILL.md) | Build and sharpen a project's domain model. Use when the user wants to pin down domain terminology or a ubiquitous language, record an architectural… |
| [`.agents/skills/grill-with-docs/SKILL.md`](.agents/skills/grill-with-docs/SKILL.md) | A relentless interview to sharpen a plan or design, which also creates docs (ADR's and glossary) as we go. |
| [`.agents/skills/improve-codebase-architecture/HTML-REPORT.md`](.agents/skills/improve-codebase-architecture/HTML-REPORT.md) | The architectural review is rendered as a single self-contained HTML file in the OS temp directory. |
| [`.agents/skills/improve-codebase-architecture/SKILL.md`](.agents/skills/improve-codebase-architecture/SKILL.md) | Scan a codebase for deepening opportunities, present them as a visual HTML report, then grill through whichever one you pick. |
| [`.agents/skills/legacy-modernizer/SKILL.md`](.agents/skills/legacy-modernizer/SKILL.md) | Designs incremental migration strategies, identifies service boundaries, produces dependency maps and migration roadmaps, and generates API facade… |
| [`.agents/skills/legacy-modernizer/references/legacy-testing.md`](.agents/skills/legacy-modernizer/references/legacy-testing.md) | Tests that document current behavior (even if buggy) before refactoring. |
| [`.agents/skills/legacy-modernizer/references/migration-strategies.md`](.agents/skills/legacy-modernizer/references/migration-strategies.md) | python |
| [`.agents/skills/legacy-modernizer/references/refactoring-patterns.md`](.agents/skills/legacy-modernizer/references/refactoring-patterns.md) | Enables large refactorings to happen incrementally without breaking existing code. |
| [`.agents/skills/legacy-modernizer/references/strangler-fig-pattern.md`](.agents/skills/legacy-modernizer/references/strangler-fig-pattern.md) | The strangler fig pattern gradually replaces legacy systems by incrementally building new functionality around the old system, eventually… |
| [`.agents/skills/legacy-modernizer/references/system-assessment.md`](.agents/skills/legacy-modernizer/references/system-assessment.md) | python |
| [`.agents/skills/planning-with-files/SKILL.md`](.agents/skills/planning-with-files/SKILL.md) | This skill should be used when starting complex multi-step tasks, research projects, or any task requiring >5 tool calls. Implements Manus-style… |
| [`.agents/skills/r3f-shaders/SKILL.md`](.agents/skills/r3f-shaders/SKILL.md) | React Three Fiber shaders - GLSL, shaderMaterial, uniforms, custom effects. Use when creating custom visual effects, modifying vertices, writing… |
| [`.agents/skills/setup-matt-pocock-skills/SKILL.md`](.agents/skills/setup-matt-pocock-skills/SKILL.md) | Configure this repo for the engineering skills — set up its issue tracker, triage label vocabulary, and domain doc layout. Run once before first use… |
| [`.agents/skills/setup-matt-pocock-skills/domain.md`](.agents/skills/setup-matt-pocock-skills/domain.md) | How the engineering skills should consume this repo's domain documentation when exploring the codebase. |
| [`.agents/skills/setup-matt-pocock-skills/issue-tracker-github.md`](.agents/skills/setup-matt-pocock-skills/issue-tracker-github.md) | Issues and PRDs for this repo live as GitHub issues. |
| [`.agents/skills/setup-matt-pocock-skills/issue-tracker-gitlab.md`](.agents/skills/setup-matt-pocock-skills/issue-tracker-gitlab.md) | Issues and PRDs for this repo live as GitLab issues. |
| [`.agents/skills/setup-matt-pocock-skills/issue-tracker-local.md`](.agents/skills/setup-matt-pocock-skills/issue-tracker-local.md) | Issues and PRDs for this repo live as markdown files in .scratch/. |
| [`.agents/skills/setup-matt-pocock-skills/triage-labels.md`](.agents/skills/setup-matt-pocock-skills/triage-labels.md) | The skills speak in terms of five canonical triage roles. |
| [`.env.example`](.env.example) | Example environment variables |
| [`android/README.md`](android/README.md) | This file shows the minimal approach for your Android (Kotlin) client to call the retrieval server. |
| [`portfolio/Gather-PortfolioMedia.ps1`](portfolio/Gather-PortfolioMedia.ps1) | PS1 file. |
| [`portfolio/README.md`](portfolio/README.md) | Two ways to pull image/video candidates into one place so you can pick the best for the portfolio. |
| [`server/README.md`](server/README.md) | This folder will contain the retrieval/indexing service that your Android app calls. |
| [`skills-lock.json`](skills-lock.json) | Configuration / data file. |
| [`workshop/sandbox.html`](workshop/sandbox.html) | Primordial - Sketch Sandbox |
| [`workshop/sketch-runner.mjs`](workshop/sketch-runner.mjs) | Boots the workshop sandbox: loads one sketch (?sketch=<name>) using the real renderer plumbing, drives it with synthetic audio, and exposes the… |
| [`workshop/sketches/_demo/_demo.frag.js`](workshop/sketches/_demo/_demo.frag.js) | Reference sketch: audio-reactive warped plasma with neon rings. |
| [`workshop/sketches/_demo/_demo.json`](workshop/sketches/_demo/_demo.json) | Configuration / data file. |
| [`workshop/sketches/frontpage/BRIEF.md`](workshop/sketches/frontpage/BRIEF.md) | Durable launch point for a visual-workshop session (run after a /clear). |
| [`workshop/synth-audio.mjs`](workshop/synth-audio.mjs) | Deterministic synthetic "fake song" for the Visual Workshop sandbox. |
