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
3. **Handoff, then PROMPT the operator - do NOT assume.** Give a short handoff
   (branch, what's done, verified-open issues, open decisions), then **ask the
   operator what they want to do and wait.** Do not auto-pick a parked thread, a
   stack, or an approach - those are context, not orders. The destination is the
   operator's call; surface it with something they can **see**, then let them
   decide. (Lesson 2026-06-20: assuming the task and barrelling in = wasted work.)
4. **Tools FIRST.** A fresh container has no `node_modules`/Chromium, so you can
   show the operator nothing until you fix it: `npm install` +
   `npx playwright install chromium`, verify `node tools/mcp/selftest.mjs`. Never
   route around a broken env with docs.
5. **Route**: find your task in the table below and read that rule first.
6. **Verify**: `npm run health` is green before you start and before you claim
   "done" (see the `verification-before-completion` skill). Render check:
   `node test/render-check.mjs`.
7. **Branch LAST**: only now create/switch a working branch if you need one.
   **Never branch as your first action** - the orient `guard` hook *blocks*
   branch creation (`git checkout -b`, `git switch -c`, `git branch <name>`)
   until you've engaged this gate by running `npm run health` (step 6). Switching
   to an *existing* branch (e.g. the active branch the orient warning names) is
   always allowed.

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
above and the top of `progress.md` (newest entries first). The imported
`task_plan.md` + `progress.md` are the full state. This file changes rarely; the
state files change every session.

## Continuity is BRANCH-SCOPED (read this)

"Only committed files survive a wipe" - true, but they survive **on the branch
you committed them to**. A new task often spawns a fresh branch off the default
branch (`main`), which can lag the active working branch by many commits - so a
session can start with stale or missing continuity (a handoff queued on the
working branch will not be on `main`). Guards now in place:

- The `orient` hook **fetches and detects the most recently updated remote
  branch**, reads the handoff + open threads FROM IT, and prints a loud WARNING
  with the exact `git checkout` if you are on a different branch. **Heed it:**
  switch to the active branch before starting work, or your changes diverge.
- **Keep the fork base current.** Durable continuity (`progress.md`,
  `task_plan.md`, queued briefs) and `.claude/` tooling only reach future
  sessions once they are on the branch new sessions fork from (the default branch
  `main`). Merge the working branch to `main` regularly, or new sessions keep
  starting blind. Do not let a long-lived feature branch drift dozens of commits
  ahead of `main`.
