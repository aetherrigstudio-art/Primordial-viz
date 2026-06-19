---
name: find-skill
area: meta
description: Find the right skill for the task at hand, and keep the skill registry in sync — regenerate the CLAUDE.md "Skills by area" router block from .claude/skills/*/SKILL.md and report the workflow→skill map. Use when unsure which skill applies, or after adding/editing a skill so it's wired into the router and discoverable.
---

# find-skill — route to the right skill & keep the registry in sync

Two jobs: (1) **find** the right skill for what you're doing, and (2) **register**
skills into the always-loaded router so a new one is wired with no hand-edits.

## Find the right skill
1. Skill names + descriptions are injected into context every session, and the
   **Skills by area** block lives in `CLAUDE.md`'s Knowledge router — scan those first.
2. For a fuzzy match, query the MCP server (it already indexes every `SKILL.md`):
   `node tools/mcp/lib/docs.mjs search "<task keywords>"` (or the `search_docs`
   tool) surfaces the best-matching skill/doc.
3. Recommend the single best-fit skill — or say none fits and proceed directly.

## Register / re-sync skills (run after adding or editing a skill)
The router's **Skills by area** table is generated from each skill's frontmatter
`area:` field. To wire a new skill in:
1. Ensure `.claude/skills/<name>/SKILL.md` has frontmatter `name`, `description`,
   and **`area:`** — reuse an existing area when you can: `shaders`, `audio`,
   `looks`, `deploy`, `design`, `meta`. Only coin a new area when none fit.
2. Regenerate: `node tools/gen-docs.mjs` — rewrites the `@generated skills:router`
   block in `CLAUDE.md` (plus ENCYCLOPEDIA/TREE). The PostToolUse `gen-docs` hook
   runs this automatically on any skill edit, so it's usually already done.
3. Verify: `node tools/gen-docs.mjs --check` (CI gates this too), and confirm the
   skill now appears in the CLAUDE.md "Skills by area" table.

## Notes
- **The server needs no manual step.** `SKILL.md` is git-tracked markdown, so the
  MCP doc index (`search_docs`/`get_doc`) and `ENCYCLOPEDIA.md` already include it.
- A skill with no `area:` is grouped under `general` — add an `area:` so it routes.
- Keep descriptions tight and distinct: selection accuracy degrades before context
  cost does as the skill count grows.
