---
name: reorient
description: Use when starting in a fresh container, after /clear, or after a context compaction — when you've lost the repo's state and need to reload the load-bearing facts, current branch + handoff, open threads, and behavior rules before acting again.
area: meta
allowed-tools: Read, Bash(git status:*), Bash(git log:*)
---

# reorient — reload the load-bearing state

The SessionStart `orient` hook prints repo state on a **fresh session**, but it
does **NOT** re-fire after `/clear` or a context compaction — so after either,
you're working blind on stale assumptions and may miss queued work. Invoke this to
rebuild context before acting.

## Read these, in order

1. **`progress.md`** — newest entry at the **TOP** is the latest handoff (what
   changed, decisions + why, the exact next step), followed by the `## Open
   threads` list — parked tasks to resume. This is the source of truth, not memory.
2. **`CLAUDE.md`** — project facts, the **Knowledge router** (what to read before
   touching each area), and the always-loaded Accuracy + Communication rules. It
   `@import`s `task_plan.md` + `progress.md`.
3. **`.claude/rules/conduct.md`** — general agent behavior: verify-before-answering,
   formatting discipline, owning mistakes, untrusted content, use-your-tools.
4. **`.claude/rules/gotchas.md`** — known foot-guns; don't re-debug them.
5. The area rule for your task from the router (`shaders.md` / `audio.md` /
   `deploy.md`), plus `ONBOARDING.md` if you're brand-new.

## Then, before acting

- Confirm the **branch** (`git status`) and that it matches the handoff's branch;
  a fresh container forks off `main`, which may lag the working branch.
- **Restate the next step to the operator** before editing.
- Only committed files survive a container wipe; get `npm run health` green before
  claiming anything is done.

## When NOT to use

Mid-task with full context already loaded. This is for cold starts and post-`/clear`
amnesia — not every message.
