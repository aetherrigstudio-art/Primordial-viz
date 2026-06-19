# Learn-from-Corrections Implementation Plan

> Self-improvement loop #1. Implement task-by-task; `- [ ]` steps.

**Goal:** When the user corrects me, capture the lesson durably so it doesn't recur.

**Architecture:** A `UserPromptSubmit` hook (`detect-correction.sh`) nudges when a
prompt reads like a correction. A `/lesson` skill captures it by ROUTING to the
home that changes future behavior (sharpen the always-loaded `accuracy` rule / fix
the source doc / note it), not a write-only dump.

**Tech:** bash hook (jq), markdown skill, `settings.json`.

## Global Constraints
- Non-blocking nudge only; robust (no-op without jq / on no match).
- Behavioral lessons must land in an always-loaded file (CLAUDE.md/rules) to take effect.
- Keep gates green: `gen-docs --check`, `smoke`, `audit`.

### Task 1: `/lesson` skill
- [ ] Create `.claude/skills/lesson/SKILL.md` (area `meta`). Body: classify the
  correction (behavioral / factual / gap / one-off) and route to its durable home;
  pick ONE primary home; prefer strengthening an existing rule; commit.

### Task 2: `detect-correction.sh` hook + unit test
- [ ] Create `.claude/hooks/detect-correction.sh` (UserPromptSubmit): read `.prompt`;
  if it matches correction phrases (`that's wrong`, `not accurate`, `you assumed`,
  `incorrect`, `no i meant`, ... NOT bare "no"), inject a non-blocking nudge toward
  `/lesson`. Exit 0; no-op without jq / on no match.
- [ ] Unit-test: correction prompts nudge; "take a look"/normal prompts stay silent.
- [ ] Wire as a 2nd `UserPromptSubmit` hook in `settings.json` (alongside suggest-workflow).

### Task 3: Close out
- [ ] Remove the `learn-from-corrections` line from `## Open threads` in progress.md
  (it's done) and log the outcome in a Session entry.
- [ ] Verify: `gen-docs --check`, `smoke`, `audit`, `bash -n` the hook. Commit + push.

## Self-Review
- Coverage: skill (Task 1), hook+test+wiring (Task 2), close+verify (Task 3). OK.
- Consistency: hook nudges `/lesson` (Task 1 name); both on UserPromptSubmit. OK.
