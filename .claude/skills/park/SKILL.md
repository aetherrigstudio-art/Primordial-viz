---
name: park
area: meta
description: Park the current in-progress thread (a design, task, or decision we're partway through) into the "Open threads" list in progress.md with enough context to resume - topic, what's decided so far, and the exact next step. Use when the conversation pivots to a new subject before the current one is finished, so it isn't lost. The orient hook resurfaces parked threads next session.
allowed-tools: Read, Edit
---

# park - capture an interrupted thread so we can resume it reliably

When the subject changes mid-thread, snapshot it so it survives the pivot (and a
container wipe), and we return with full context instead of re-deriving it.

## Steps
1. Open `progress.md`. If there's no `## Open threads` section near the top, add
   one (below the title) - it's the durable parking lot the `orient` hook reads.
2. Append a checkbox line for the current thread, carrying its resume-context:
   `- [ ] <thread> | decided: <key decisions> | next: <exact next step> | parked <YYYY-MM-DD>`
   Add sub-bullets only if a one-liner truly can't hold it (relevant files, the
   shape of an approved design).
3. Commit `progress.md`.

## Resuming / closing
- The `orient` hook lists open threads at session start. To resume, read the line
  (and any files it points to) - it should be enough to continue without guessing.
- When a thread is finished, **remove its line** and log the outcome in the normal
  Session entry. Don't let the list go stale.

## Notes
- Durable home is `progress.md` (git-committed), NOT the harness TODO list, which
  is session-local and lost on a fresh container.
- Keep it lean: one line per thread; the value is the *next step* being exact.
