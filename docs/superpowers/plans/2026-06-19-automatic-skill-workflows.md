# Automatic Skill-Workflow System — Implementation Plan

> **For agentic workers:** implement task-by-task; steps use `- [ ]` checkboxes.

**Goal:** Named skill-chains ("workflows") that fire automatically — a prompt-intent
hook nudges, and a `workflow` skill drives the chain.

**Architecture:** Workflows are data (`.claude/workflows.md`). A `UserPromptSubmit`
hook (`suggest-workflow.sh`) detects intent and injects a non-blocking nudge. A
`workflow` skill (area `meta`) reads the data and walks the chain with each skill's
own gates. Surfaced in the knowledge router + `orient` hook.

**Tech stack:** bash hooks (jq), markdown skills, `gen-docs.mjs` generation, `settings.json`.

## Global Constraints
- Durable state = git only (cloud wipes the rest). Hooks robust: never block; degrade to no-op without jq.
- Non-blocking nudge only (NOT `using-superpowers`-style forced invocation).
- `gen-docs --check` + `node test/smoke.mjs` must stay green; drift gate excludes nothing new (workflows.md isn't a skill).

---

### Task 1: Workflow definitions (`.claude/workflows.md`)
**Files:** Create `.claude/workflows.md`
- [ ] Define `feature` chain: brainstorming → writing-plans → executing-plans → test-driven-development → verification-before-completion → requesting-code-review → finishing-a-development-branch
- [ ] Define `new-look` chain: new-preset → perf-budget → visual-qa (agent) → verification-before-completion
- [ ] Note: "skip steps that don't apply — guidance, not handcuffs."

### Task 2: `workflow` orchestrator skill
**Files:** Create `.claude/skills/workflow/SKILL.md` (frontmatter: name `workflow`, area `meta`, description that auto-activates at the start of a build/feature/look task)
- [ ] Body: read `.claude/workflows.md`, pick the chain matching the task, invoke each skill/agent in order, honor each one's gates (brainstorming approval, verification before done).

### Task 3: Prompt-intent hook + unit test
**Files:** Create `.claude/hooks/suggest-workflow.sh`; Modify `.claude/settings.json`
- [ ] Hook: read stdin JSON, extract `.prompt`; if it matches feature intent (`build|implement|add|create … feature|component|function`) or look intent (`look|preset|visual|shader|palette`), emit `hookSpecificOutput.additionalContext` nudging the `workflow` skill. Non-blocking (exit 0); no-op without jq or on no match.
- [ ] Unit-test: feed sample prompts (feature / look / unrelated) → assert the right nudge / silence.
- [ ] Wire `UserPromptSubmit` → `suggest-workflow.sh` in `settings.json`.

### Task 4: Surface + verify + commit
**Files:** Modify `CLAUDE.md` (router note), `.claude/hooks/orient.sh` (one line), regenerate docs
- [ ] Add a "Workflows" pointer to the knowledge router and an orient line.
- [ ] `node tools/gen-docs.mjs && node tools/gen-docs.mjs --check` green; `node test/smoke.mjs` 12/12; `bash -n` the hook.
- [ ] Commit + push.

## Self-Review
- Coverage: Tasks 1–4 cover data, skill, hook+test, wiring+verify. ✓
- Placeholders: none — exact paths + behaviors above. ✓
- Consistency: hook nudges the `workflow` skill (Task 2 name) reading `workflows.md` (Task 1 path). ✓
