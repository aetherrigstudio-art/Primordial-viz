---
name: workflow
area: meta
description: Drive a named multi-step workflow — an ordered chain of skills/agents — for a substantial build, feature, or new-look task. Use at the START of such a task to run the right chain end-to-end with each step's gates, instead of ad-hoc one-off steps. Reads .claude/workflows.md.
---

# workflow — run a named skill chain

Turn a substantial task into a disciplined chain instead of ad-hoc steps. This
prevents the "assume and charge ahead" failure: the chains start with a design
gate and end with a verification gate.

## When to use
- The start of a **feature / substantial change** or a **new visual look** — i.e.
  anything bigger than a one-line edit. The `suggest-workflow` hook nudges you here
  when it detects that intent; you can also invoke it directly.
- NOT for a trivial fix with an obvious one-step path — just do that.

## How to run a workflow
1. **Read `.claude/workflows.md`** and pick the chain matching the task
   (`feature` for a build/change; `new-look` for a visual look/preset). If none
   fits, proceed normally — don't force a chain.
2. **Walk the chain in order.** Invoke each listed skill/agent as its own step and
   honor its gates — e.g. `brainstorming` blocks implementation until the design is
   approved; `verification-before-completion` runs the checks before any "done"
   claim; `visual-qa` reviews before a look ships.
3. **Adapt, don't handcuff.** Skip a step that genuinely doesn't apply (state which
   and why). The chain is the default path, not a rigid gate.
4. **Track it.** For a multi-step chain, keep a short checklist of the steps so the
   thread shows live progress; tick each as it completes.

## Notes
- Workflows are **data** in `.claude/workflows.md` — add/extend chains there, no
  code change. To make a new workflow auto-suggested, add its intent patterns to
  `.claude/hooks/suggest-workflow.sh`.
- This skill *runs* a chain; `skill-router` *manages the registry*. Different jobs.
- Durable: `.claude/workflows.md` is committed, so a fresh container keeps the chains.
