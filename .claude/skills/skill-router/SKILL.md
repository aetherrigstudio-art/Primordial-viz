---
name: skill-router
area: meta
description: Route to the right IN-REPO skill and keep the local skill registry in sync — regenerate the "Skills by area" router block (.claude/skills-router.md, imported by CLAUDE.md) from .claude/skills/*/SKILL.md and report the workflow→skill map. For finding/installing NEW community skills, defer to `npx skills` (skills.sh). Use after adding/editing a local skill, or when unsure which existing skill applies.
---

# skill-router — route among our skills & keep the local registry in sync

This is about **our in-repo skills**, not the wider ecosystem. Two jobs:
(1) **route** to the right existing skill, and (2) **register** a local skill into
the always-loaded router so it's wired with no hand-edits.

> **Not the same as `npx skills`.** The community `find-skills` / `npx skills`
> tool (skills.sh) **discovers and installs *external* community skills**. This
> skill only manages **our own** `.claude/skills/*`. They're complementary — see
> "Finding new skills" below.

## Route to the right local skill
1. Skill names + descriptions are injected into context every session, and the
   **Skills by area** table lives in `.claude/skills-router.md` (imported into
   `CLAUDE.md`'s Knowledge router) — scan those first.
2. Fuzzy match over our docs (works even when the MCP server isn't loaded — cloud/
   phone sessions may not load `.mcp.json`, bug #54441, so prefer the CLI):
   `node tools/mcp/lib/docs.mjs search "<task keywords>"` (every `SKILL.md` is indexed).
3. Recommend the single best-fit skill — or say none fits and proceed directly.

## Register / re-sync a local skill (after adding or editing one)
The router's **Skills by area** table is generated from each skill's frontmatter
`area:` field. To wire a new skill in:
1. Ensure `.claude/skills/<name>/SKILL.md` has frontmatter `name`, `description`,
   and **`area:`** — reuse an existing area when you can: `shaders`, `audio`,
   `looks`, `deploy`, `design`, `meta`. Only coin a new area when none fit.
2. Regenerate: `node tools/gen-docs.mjs` — rewrites the `@generated skills:router`
   block in `.claude/skills-router.md` (plus `ENCYCLOPEDIA.md`/`TREE.md`). The
   PostToolUse `gen-docs` hook runs this automatically on any skill edit, so it's
   usually done.
3. Verify: `node tools/gen-docs.mjs --check` (CI gates this too), and confirm the
   skill now appears in the "Skills by area" table.

## Finding NEW skills (external) — use the real tool
Don't reinvent discovery. To browse/install community skills, use **`npx skills`**
(vercel-labs/skills · skills.sh). Treat anything installed as third-party code:
this is commercial work, so review its **license** (MIT/CC0/CC-BY/permissive only)
and contents before relying on it — Anthropic doesn't vet ecosystem skills.

## Notes
- **The server needs no manual step.** `SKILL.md` is git-tracked markdown, so the
  MCP doc index (`search_docs`/`get_doc`) and `ENCYCLOPEDIA.md` already include it.
- A skill with no `area:` is grouped under `general` — add an `area:` so it routes.
- Keep descriptions tight and distinct: selection accuracy degrades before context
  cost does as the skill count grows.
