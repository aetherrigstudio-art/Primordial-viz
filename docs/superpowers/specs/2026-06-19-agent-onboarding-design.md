# Fresh-Agent Onboarding System - design spec

**Date:** 2026-06-19
**Status:** approved (design); pending implementation plan
**Branch:** `claude/review-claude-md-di5jvm`

## Problem

A fresh AI session on Primordial-viz orients *passively* - the `orient`
SessionStart hook prints live state and `CLAUDE.md` imports `task_plan.md` +
`progress.md`, but there is no single curated entry point, no active "do this
before editing" gate, and role-specific first-reads only surface *reactively*
(the `inject-rules` hook fires on an Edit, after the agent has already chosen an
approach). `progress.md` has also grown long. The result is the repo's two
recurring failures: re-doing already-finished work, and acting on the wrong
referent/deliverable.

## Goal

A fresh agent is productive in one read: a single curated **START-HERE** with an
**active start gate** (confirm state + verify before touching code) and
**role-aware first-reads** (jump to the right rule + reviewer agent + skill for
the task). It reuses the existing `orient` hook (which stays the live-state
source) without duplicating any rule content.

### Selected scope (from brainstorming)

- **Distilled START-HERE entry** - one curated page, kept fresh by pointing at
  sources, not copying them.
- **Active confirmation gate** - a numbered protocol the agent runs before
  editing: confirm branch + tree, restate the next step, read the task rule, run
  health.
- **Role-aware first-reads** - a compact route table by task area.

(Front-loading past lessons is folded in lightly as the "Non-negotiables"
section, not a headline.)

## Non-goals

- Not human-contributor docs, not a portable cross-project template.
- No new `/onboard` skill (deferred - the hook is automatic, so a fresh agent
  needs no manual invocation).
- No blocking/enforcement hook (the gate is a documented protocol + a strong
  orient nudge, not a pre-edit block).
- Do **not** restate rule content - `ONBOARDING.md` links to the rules/agents/
  skills so it cannot drift out of sync with them.

## Architecture

Four small, additive changes. The split: **the hook holds live state; the doc
holds the durable protocol.**

### 1. `ONBOARDING.md` (repo root) - the distilled START-HERE

Sections:

- **What this is** (1-2 lines + pointer to `CLAUDE.md` for depth): audio-reactive
  raw-WebGL2 visual instrument; one hand-built app (`index.html` -> `src/main.js`).
- **Start gate** (the active protocol - numbered, run before touching code):
  1. Read the orient block (auto-printed at session start) and this file.
  2. Confirm the branch and working tree (`git status`).
  3. Restate the current next step (from the orient block / `progress.md` tail)
     back to the user in one line before starting.
  4. Find your task in **Role routes** below and read that rule first.
  5. `npm run health` is green before you start and before you claim "done"
     (see the `verification-before-completion` skill).
- **Role routes** - a compact table pointing to existing first-reads:

  | Working on... | Read first | Also |
  | --- | --- | --- |
  | Shaders / renderer (`src/shaders`, `src/gl`) | `.claude/rules/shaders.md` | agent `visual-qa`, skill `perf-budget` |
  | Audio (`src/audio`) | `.claude/rules/audio.md` | agent `audio-dsp` |
  | A look / preset (`src/looks`, `src/params`) | skill `new-preset` | `check-data` hook |
  | Deploy / hosting | `.claude/rules/deploy.md` | skill `deploy-check` |
  | Workshopping a visual (no full build) | skill `visual-workshop` (`/workshop`) | `workshop/` |
  | A multi-step build / feature / new look | skill `workflow` (`.claude/workflows.md`) | - |
  | Where a file lives / what it does | `TREE.md` | `ENCYCLOPEDIA.md` |

- **Non-negotiables** - the load-bearing rules, one line each, linked to source:
  mobile perf budget (`.claude/rules/shaders.md`), write-our-own shader licensing
  (`.claude/rules/shaders.md`), only-git-committed-files-survive-a-cloud-wipe
  (`progress.md` continuity), phone handoff ergonomics
  (`.claude/rules/mobile-ergonomics.md`), accuracy / verify-before-done
  (`CLAUDE.md`).
- **Live state pointer**: branch / next step / open threads are in the orient
  block above and `progress.md` tail; this file is the durable how-to-start.

### 2. `.claude/hooks/orient.sh` - point at the start gate

Add a short, robust line (the hook must still never error the session start)
near the top, after the repo line:

> `New here? START HERE -> ONBOARDING.md (start gate + role routes). Before editing: confirm the branch + the next step above, read your task's rule, and get 'npm run health' green; restate the next step to the user first.`

No other hook behavior changes.

### 3. `CLAUDE.md` - name the entry point

One line in the "Session continuity" section: a fresh agent's entry point is
`ONBOARDING.md` (the start gate + role routes); the imported `task_plan.md` +
`progress.md` remain the full state.

### 4. Drift-gate coverage

Add `ONBOARDING.md` to the set of files `tools/gen-docs.mjs` `checkRefs()` scans,
so every backtick-quoted repo path in it must exist (gated by
`gen-docs --check` in CI). This keeps the START-HERE from rotting - directly
countering the "docs drift from reality" failure.

## Decisions (and why)

| Decision | Choice | Why |
| --- | --- | --- |
| State vs protocol | Hook = live state; doc = durable protocol | No duplication; the auto hook stays fresh, the doc rarely changes. |
| Rule content | Point, never copy | A copy drifts; a link cannot. |
| Trigger | Automatic (hook + always-loaded pointer) | A fresh, not-yet-oriented agent will not know to invoke a skill. |
| `/onboard` skill | Deferred | YAGNI; revisit if mid-session re-orient is wanted. |
| Enforcement | Documented protocol + nudge, not a blocking hook | Keep it light; avoid annoying false-positives. |
| Drift protection | Add `ONBOARDING.md` to `checkRefs()` | Countering the repo's top recurring failure. |

## Verification

- `node tools/gen-docs.mjs --check` green, including the new `ONBOARDING.md`
  path scan (and ENCYCLOPEDIA/TREE regenerated to list the new file).
- `bash .claude/hooks/orient.sh` runs clean (exit 0) and prints the new start-gate
  line; the existing output is unchanged otherwise.
- Every backtick path in `ONBOARDING.md` resolves (the drift gate proves this).
- `npm run health` all green.

## Open items (deferred)

- An optional on-demand `/onboard` skill (re-orient mid-session).
- Optional pre-edit enforcement of the gate (a PreToolUse warning).
- Generating the Role-routes table from the same source as the `CLAUDE.md`
  knowledge router, if the two ever risk diverging.
