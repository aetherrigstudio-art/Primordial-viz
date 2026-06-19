---
name: lesson
area: meta
description: Capture a correction or lesson durably so the same mistake doesn't recur. Use right after the user corrects a wrong assumption, an over-applied rule, or a stale fact. Routes the lesson to the home that actually changes future behavior (sharpen an always-loaded rule, fix the source-of-truth doc, or note it) - not a write-only log.
---

# lesson - turn a correction into a durable behavior change

The goal is that the same mistake doesn't happen again. Route the lesson to where
it will be loaded/enforced next time; don't dump it in a list nobody reads.

## Classify, then route (pick ONE primary home)
1. **Behavioral / assumption** - I over-applied a rule, asserted something
   unverified, or assumed intent. Sharpen the relevant **always-loaded** rule:
   usually the `accuracy` rule in `CLAUDE.md`, or a scoped `.claude/rules/*`. This
   is what actually stops the repeat.
2. **Factual repo correction** - a doc/rule was stale or wrong. Fix the
   source-of-truth file (the drift gate's territory) so the wrong fact is gone.
3. **Gap** - a missing skill/workflow/check would have prevented it. Park it
   (`/park`) or scaffold the skill.
4. **One-off context** - useful but not a rule. One line in the current
   `progress.md` Session entry.

## Rules
- Keep the edit tight: a clause, not an essay. Prefer strengthening an existing
  rule over adding a new file (always-loaded budget is finite).
- Commit it. Say which home you routed to and why.
- If a behavioral lesson lands anywhere other than an always-loaded file, it won't
  take effect - re-home it.

## Notes
- The `detect-correction` hook nudges you here when the user pushes back; you can
  also invoke it directly.
- Durable = git (survives a container wipe).
