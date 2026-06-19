# ONBOARDING - start here (fresh agent)

The single entry point for an AI agent starting work on **Primordial-viz**. The
*live* state (branch, next step, open threads) is printed by the SessionStart
orient hook and lives in `progress.md`; this file is the durable how-to-start.
For full project facts and rules, see `CLAUDE.md` (always loaded).

**What this is:** an audio-reactive, raw-WebGL2 visual instrument for live gigs.
One hand-built app - `index.html` -> `src/main.js` (NOT three.js). Shaders ship
as `src/shaders/*.js` (no `.glsl` files). Looks are params-only JSON.

## Start gate - run this before touching code

1. **Read** the orient block (auto-printed at session start) and this file.
2. **Confirm** the branch and working tree: `git status`. Only git-committed
   files survive a container wipe.
3. **Restate** the current next step (from the orient block / the tail of
   `progress.md`) back to the user in one line before you start - so you don't
   re-do finished work or build the wrong thing.
4. **Route**: find your task in the table below and read that rule first.
5. **Verify**: `npm run health` is green before you start and before you claim
   "done" (see the `verification-before-completion` skill). Render check:
   `node test/render-check.mjs`.

## Role routes - read these first, by task

| Working on... | Read first | Also |
| --- | --- | --- |
| Shaders / renderer (`src/shaders`, `src/gl`) | `.claude/rules/shaders.md` | agent `visual-qa`, skill `perf-budget` |
| Audio (`src/audio`) | `.claude/rules/audio.md` | agent `audio-dsp` |
| A look / preset (`src/looks`, `src/params`) | skill `new-preset` | the `check-data` hook |
| Deploy / hosting | `.claude/rules/deploy.md` | skill `deploy-check` |
| Workshopping a visual (no full build) | skill `visual-workshop` (`/workshop`) | the `workshop/` sandbox |
| A multi-step build / feature / new look | skill `workflow` (`.claude/workflows.md`) | the `suggest-workflow` hook |
| Where a file lives / what it does | `TREE.md` | `ENCYCLOPEDIA.md` |

## Non-negotiables (one line each; source linked)

- **Mobile perf budget** - heavy pass at 0.5-0.75 render-scale, raymarch steps
  <= 64, dynamic resolution. `.claude/rules/shaders.md`.
- **Write our own shaders** - commercial work; learn techniques, author from a
  blank file, never copy CC BY-NC-SA code. `.claude/rules/shaders.md`.
- **Only git-committed files survive** a cloud-container wipe - keep
  `progress.md` + `task_plan.md` current; commit before the session ends.
- **Phone-driven operator** - hand values one-per-code-block, deliver files with
  SendUserFile, drive deploy via GitHub state (no local FTP).
  `.claude/rules/mobile-ergonomics.md`.
- **Accuracy + verify-before-done** - state verified facts plainly, label
  guesses, run the check before claiming "done". `CLAUDE.md`.

## Live state (not here - kept fresh elsewhere)

Branch, the current next step, and parked "open threads" are in the orient block
above and the tail of `progress.md`. The imported `task_plan.md` + `progress.md`
are the full state. This file changes rarely; the state files change every
session.
