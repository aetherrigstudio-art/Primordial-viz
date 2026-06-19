# Spec — Actioning the comparison research (adopt-ideas roadmap + Phase 1)

**Date:** 2026-06-19 · **Status:** approved, ready for plan.
**Inputs:** `research/claude-repo-comparison/REPORT.md` (runs 1–4) +
`research/product-domain-comparison/REPORT.md` (run 5).

## Problem / goal

The comparison research surfaced ~12 concrete "adopt" ideas but no plan to act on
them. Turn them into a **prioritized, sequenced roadmap** recorded in the repo's
existing roadmap files, and produce an **executable plan for Phase 1** (the cheap,
high-leverage tooling wins). Later phases stay as roadmap stubs until reached
(YAGNI — some depend on the real `/Test/` visual, which is still TBD).

## Constraints (apply to every item)

- **Git-only, zero-infra, phone-friendly** — no new services/daemons; durable
  state is git (cloud wipes everything else).
- **`CLAUDE.md` ≤ 200 lines** (it's at 200 now) — new always-on prose goes in a
  scoped `.claude/rules/*` file referenced from the router, not inline.
- **Commercial-safe** — technique-only adoption from the product peers; no AGPL/
  LGPL/Milkdrop-preset code copied (run 5 licensing finding).
- **No regressions** — `npm run health` stays green except the known pre-existing
  `test/artifacts/render.png` drift; `gen-docs --check` stays green.

## The roadmap (all items, phased)

### Track 1 — Claude tooling → record in `.claude/ROADMAP.md`

**Phase 1 — cheap wins (this spec plans these in detail):**
1. **`AGENTS.md` cross-tool mirror.** `gen-docs.mjs` emits a generated, tool-agnostic
   `AGENTS.md` from `CLAUDE.md` (header: "generated — edit CLAUDE.md"). Claude-only
   `@import` lines (`@task_plan.md`, `@progress.md`) are transformed to plain
   "See `task_plan.md` / `progress.md`" references so the mirror is valid for
   non-Claude harnesses. `gen-docs --check` gates it (fails if stale). *Why:*
   near-universal pattern (sentry/workers-sdk/openai-agents/claudekit/wshobson/
   anywhere-agents) we alone lack; makes our knowledge portable to Codex/Cursor.
2. **Self-auditing config gate.** A check (in `tools/`, wired into `npm run health`
   / `gen-docs --check`) asserting: `CLAUDE.md` ≤ 200 lines; the
   `@generated skills:router` markers exist in `.claude/skills-router.md`;
   `.claude/settings.json` is valid JSON. *Why:* corroborated by 4 peers
   (lint-claude-md / claude-settings-audit / make garden / AgentShield); kills the
   "CLAUDE.md crept over 200" failure we've hit twice.
3. **PreCompact handoff hook.** `.claude/hooks/precompact-handoff.sh` (matcher
   `PreCompact` in `settings.json`) injects a non-blocking reminder to update
   `progress.md` before compaction. *Why:* already a roadmap TODO; reconfirmed by
   run 4 as a cheap, git-only continuity win.
4. **Recent lessons surfaced in `orient`.** `orient.sh` greps `progress.md` for the
   most recent `LESSON`-tagged entries and prints them. *Why:* run 4; cheap; closes
   the loop so past corrections resurface at session start.
5. **Anti-footgun "Gotchas" rule.** New `.claude/rules/gotchas.md` (referenced from
   the CLAUDE.md router) capturing distilled tribal knowledge: the looks-registry
   `import.meta.url` 404, the CI software-GL screenshot-must-freeze gotcha, the
   HTTPS-443-only container (no FTP/cPanel), `render.png` drift being expected.
   *Why:* trailofbits' anti-footgun pattern; saves repeated loops.

**Phase 2 — higher-effort tooling (roadmap stubs only; plan when reached):**
6. **Eval harness** — measure whether a skill/rule actually triggers + helps
   (run-with/without, diff outcome). Research's #1 gap; biggest build.
7. **Hardened destructive-command PreToolUse guard** — wrapper-depth stripping
   (anywhere-agents `guard.py` pattern).
8. **Per-skill `allowed-tools`** — scope what each of the 32 skills can touch.

### Track 2 — Product/visual techniques → record in repo-root `ROADMAP.md`

(technique-only; license-safe per run 5)
9. **Perceptual audio bands (bark/mel)** — improves the *existing* `src/audio`
   analyser path; not gated, can be planned independently after Phase 1.
10. **Preset cross-fade** · 11. **Look playlist** · 12. **Waveform aligner** —
    **gated** behind the real `/Test/` visual / art direction being decided.

## Phase 1 — detail for the plan

Each item is independently testable and committable:
- **#1 AGENTS.md:** modify `tools/gen-docs.mjs` (add `AGENTS.md` emit + `@import`
  transform + include in `--check`); create generated `AGENTS.md`. Test:
  `gen-docs --check` green at rest, fails when `CLAUDE.md` changes without regen;
  `AGENTS.md` contains no raw `@import` lines.
- **#2 config gate:** add `tools/check-config.mjs` (the assertions) and call it as a
  gate from `tools/health.mjs`. Test: passes now; fails on a 201-line `CLAUDE.md`
  fixture / missing router markers.
- **#3 PreCompact hook:** add script + `settings.json` entry. Test: script emits
  valid JSON `additionalContext`; `settings.json` valid; unit-run the script.
- **#4 lessons in orient:** extend `orient.sh`. Test: prints the latest `LESSON`
  entry from `progress.md`; no-op cleanly when none.
- **#5 gotchas rule:** add `.claude/rules/gotchas.md` + a router row in `CLAUDE.md`
  (watch the 200-line cap — may require trimming a line elsewhere; the #2 gate
  enforces this). Test: `gen-docs --check` (drift gate) confirms the new path
  resolves; `npm run health` green.

## Definition of done

- Roadmap entries written into `.claude/ROADMAP.md` (Track 1) and repo-root
  `ROADMAP.md` (Track 2), each item with one-line value + phase.
- Phase 1 items 1–5 implemented, each verified, committed, pushed to
  `claude/onboarding-hxwhw6`.
- `npm run health` green (render.png drift excepted); `gen-docs --check` green.
- `progress.md` session entry; Phase 2 + gated product items left as roadmap stubs.

## Out of scope

- Phase 2 tooling (items 6–8) and product techniques (9–12) — roadmap stubs only.
- Any change to the actual shader/visual art direction.
- The non-local RAG system (separate parked thread).
