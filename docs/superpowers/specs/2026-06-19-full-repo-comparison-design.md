# Spec — Full-repository Claude-peer comparison (wider run)

**Date:** 2026-06-19 · **Status:** approved, ready for plan.
**Builds on:** `research/claude-repo-comparison/BRIEF.md` (primary axis) and the
delivered `research/claude-repo-comparison/REPORT.md` (skills-library run).

## Problem

The first comparison's honest caveat: its 4 peers were **skills/methodology
libraries and a template handbook**, not real product/project repos like ours.
This run widens the net to **full repositories** — a mix of real product/tool
repos built *with* Claude Code and complete agent-config repos — so the
comparison is more apples-to-apples to a product repo that carries heavy
`.claude/` scaffolding.

## Decisions (locked with the operator)

1. **Peer type:** mixed — real product/tool repos **and** complete agent-config
   repos. Add a **`Kind`** column. (Skill libraries from run 1 are kept as
   context, tagged `skills-lib`.)
2. **Breadth:** **8** new peers, profiled **deeply** from primary sources
   (~4 product + ~4 config; backfill config if product side is thin).
3. **Deliverable:** **merge** into the existing
   `research/claude-repo-comparison/REPORT.md` — one comprehensive report
   spanning both runs.
4. **Parked follow-up:** a separate "whole-workflow systems" comparison (ccpm,
   Continuous-Claude, etc.).

## Candidate slate (8 peers + this repo baseline)

**Config repos (confirmed exist):**
1. `carlrannaberg/claudekit` — commands + hooks + subagents toolkit (AGENTS.md)
2. `wshobson/agents` — multi-harness marketplace; dir-auto-discovered agents/commands
3. `yzhao062/anywhere-agents` — one portable config; routing + destructive-command guard
4. `disler/claude-code-hooks-mastery` — all 13 hook lifecycle events

**Product / tool repos (provisional; discovery locks 7–8):**
5. `anthropics/claude-code` — the CLI product itself, first-party CLAUDE.md
6. `krzemienski/shannon-mcp` — a real MCP-server tool with a working CLAUDE.md
7–8. Two real-project repos from `josix/awesome-claude-md` (curated exemplary
   CLAUDE.md files). If <4 real product repos clear the bar, backfill with another
   config repo and label the mix.

### Selection bar (per repo)
Genuinely comparable: a substantive `CLAUDE.md` and/or `.claude/` tooling (not a
toy or one-line mention); real/active/reputable; public; license recorded.

## Method

- **Discovery step first:** a short web pass to confirm slate + lock slots 7–8
  (read `josix/awesome-claude-md`).
- **8 parallel research agents**, one per repo, reading **primary sources** (the
  repo's own `CLAUDE.md`, `.claude/` tree, `settings.json`, `.mcp.json`,
  `SKILL.md`/agent files). Each returns: the 4-dimension profile + license +
  stars + link + standout ideas + **kind**. Each flags anything unverifiable.
- **Synthesize + merge** into `REPORT.md`.

## Comparison dimensions (unchanged)

1. Config & rules · 2. Skills / agents / MCP · 3. Hooks & automation ·
4. Process & methodology. Plus per-repo: license, stars, link, standout ideas,
**kind**.

## Report structure (merged `REPORT.md`)

- Retitle to cover both runs; add a **`Kind`** column
  (`baseline` / `skills-lib` / `config` / `product`).
- One master table: this repo (baseline) + 4 prior skills-lib peers + 8 new =
  **13 rows**.
- Per-repo paragraphs grouped by kind (keep the 4 existing, add 8).
- **Rewrite the synthesis** (adopt-vs-ahead) against the wider, truer-peer set.

## Definition of done

- 8 verified full-repo peers profiled across all 4 dimensions, merged into
  `REPORT.md` with the `Kind` column + rewritten synthesis.
- `npm run health` no worse than baseline (pre-existing `render.png` drift aside).
- Committed + pushed to `claude/onboarding-hxwhw6`.
- `SendUserFile` the merged report + a tight, jargon-light chat summary
  (`.claude/rules/mobile-ergonomics.md`).
- "Whole-workflow systems" follow-up parked in `progress.md` Open threads;
  session entry added.

## Out of scope

- Product-domain (raw-WebGL2 / shader / audio-visual) comparison — separate
  parked thread.
- Whole-workflow-systems comparison — separate parked thread.
- Any app code change.
