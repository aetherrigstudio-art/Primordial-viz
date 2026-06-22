# Workflows — named skill chains

Ordered chains of skills/agents for common task types. **Auto-suggested** by
`.claude/hooks/suggest-workflow.sh` (on your prompt) and **driven** by the
`workflow` skill. Each step honors that skill's own gates (e.g. `brainstorming`
won't write code before design approval; `verification-before-completion` runs the
checks before "done"). **Skip steps that don't apply to a trivial change —
guidance, not handcuffs.**

## feature — build a feature or substantial change
1. `brainstorming` — design before code (HARD-GATE: design approved first)
2. `writing-plans` — turn the design into a step-by-step plan
3. `executing-plans` *(or `subagent-driven-development` for independent tasks)* — implement task-by-task
4. `test-driven-development` — test-first for each unit
5. `verification-before-completion` — run the checks; evidence before "done"
6. `requesting-code-review` *(or the built-in `/code-review`)* — review before merge
7. `finishing-a-development-branch` — merge / PR / cleanup decision

## new-look — add a visual look / preset
1. `new-preset` — scaffold the params-only JSON + registry wiring
2. `perf-budget` — check the mobile FPS budget for the look
3. `visual-qa` *(agent)* — review look quality + mobile-budget compliance
4. `verification-before-completion` — `smoke` + `render-check` before "done"

## immersive-page — build a part of the point-cloud landing page (`immersive/`)
1. `brainstorming` — design before code (HARD-GATE; the arc + art direction live in `docs/design-system/`)
2. `writing-plans` — turn the design into a step-by-step plan
3. `subagent-driven-development` — dispatch the right specialist *(agent)*: `splat-graphics` (render) ·
   `motion-choreography` (journey) · `interface-design` (UI/tokens) · `splat-asset` (assets)
4. `verification-before-completion` — on-device `node --check` + the esbuild bundle smoke (heavy build is OFF-DEVICE/CI)
5. `design-reviewer` + `perf-a11y-reviewer` *(agents)* — art-direction fidelity + phone-shippability
6. `finishing-a-development-branch` — merge / PR / cleanup decision

---
*Add a workflow:* append a `## <name> — <when>` section with a numbered chain,
then it's available to the `workflow` skill. The suggest-workflow hook only nudges
for intents it knows (feature/look) — extend its patterns to add more triggers.
