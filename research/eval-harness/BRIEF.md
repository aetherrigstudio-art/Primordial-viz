# Onboarding BRIEF — skill/rule eval harness (for the brainstorm)

**Status:** prep for a brainstorm (NOT a design). Assembles context, prior art,
constraints, and the open questions so the eval-harness work starts grounded.
**Method when resumed:** run `/brainstorming` (reason via `thought-based-reasoning`)
using this brief → decide the smallest useful design WITH the operator → `writing-plans`
→ build (subagent-driven). This is the **last Phase-2 item**; the operator's order is
**preparations first, the real `/Test/` visual LAST**.

## The want / why it's the #1 gap

Across all comparison runs (`research/claude-repo-comparison/REPORT.md`), the single
most-recommended adopt-idea was an **eval harness that measures whether a skill/rule
actually works** — does it *trigger* when it should, and does it *improve* the
outcome? We currently gate **correctness** (`npm run health`: JS syntax, smoke,
site-audit, docs/drift, config gate) but **never efficacy**. So a skill can rot
(stop triggering, or stop helping) and nothing catches it.

## The crux to resolve (why this needs a brainstorm, not just a plan)

"**Does a skill work**" is ambiguous in our setup. The brainstorm must define what
we actually measure and what's *buildable laptop-free*. Likely sub-questions:
- **Trigger reliability** — given a prompt that SHOULD invoke skill X, does the
  router/model pick X? (tests the `description:` trigger quality)
- **Outcome lift** — does running a task WITH the skill beat WITHOUT it? (needs an
  LLM-judge → costs tokens, non-deterministic)
- **Static quality** — deterministic lints on skill frontmatter/description
  (cheap, no LLM): length, trigger-phrase presence, `area:` set, no dead refs.

## Prior art (to weigh, NOT copy — license + fit)

- **obra/superpowers** — an eval harness that **gates skill changes** ("Skill
  Changes Require Evaluation").
- **anthropics/skills** — `skill-creator` documents an eval loop: run prompts
  **with/without** the skill, **variance analysis** on trigger reliability
  (`eval-viewer`).
- **wshobson/agents** — `plugin-eval`: **three-layer** — static (<2s) → LLM-judge
  (~30s) → **Monte-Carlo** statistical testing (~2-5 min). The most complete model.

## Candidate approaches (for the brainstorm to choose among / combine)

1. **Static-only (cheapest, deterministic, no LLM):** a `tools/eval-skills.mjs`
   that lints all 32 `SKILL.md` — description has trigger phrasing, `area:` present,
   referenced paths exist, length bounds, no duplicate trigger overlap. Wire into
   `npm run health`. Catches rot mechanically; zero token cost.
2. **Trigger fixtures:** a small committed set of `prompt → expected-skill` cases;
   a runner checks the right skill would be selected. (How to invoke selection
   headless is an open question — may need the SDK or a heuristic.)
3. **Outcome A/B (LLM-judge):** run a task with/without a skill, judge the diff.
   Highest signal, but token cost + non-determinism + needs an API key (secret
   handling) — heavier; probably roadmap-later, not v1.
4. **Layered (superpowers/wshobson model):** static gate in CI always; LLM/MC tiers
   on demand. Aspirational target; start with tier 1.

## Load-bearing constraints (judge every option)

- **Laptop-free:** must run in-container or CI (like smoke/render-check), phone-driven.
- **Git-only durable; cloud-ephemeral.** Fixtures/configs live in git.
- **Lean / low-cost / low-upkeep** (repo ethos). Prefer deterministic; treat
  LLM-judge token cost + **secret handling** (API keys via GitHub/host secrets,
  never committed) as a real cost that pushes it later.
- **Commercial-safe;** no proprietary code sent to third-party judges.
- **Fits existing patterns:** `tools/*.mjs` gates wired into `tools/health.mjs`;
  `test/*.mjs` run directly; CI in `.github/workflows/verify.yml`.

## What exists to build on

- **Gates:** `tools/health.mjs` (orchestrates), `tools/gen-docs.mjs` (drift +
  skills:router), `tools/check-config.mjs`, `tools/audit-site.mjs`.
- **Skills:** 32 `SKILL.md` with `name` / `area:` / `description` (+ 12 own now
  carry `allowed-tools`); router generated into `.claude/skills-router.md`.
- **Retrieval:** the local MCP keyword doc-search indexes skills already.
- **Tests:** `test/{smoke,render-check,harvest-links,guard}.test.mjs` — direct-run style.

## Success test (good brainstorm outcome)

A chosen **smallest-useful** eval that, on a skill/rule change, tells us whether it
still triggers/helps — runnable laptop-free, lean, mostly deterministic, with a
clear path to add LLM/MC tiers later. Spec → `docs/superpowers/specs/`. Decide
build-now (likely tier-1 static) vs roadmap-later (LLM/MC tiers).

## Out of scope for the brainstorm

- Building it (follows the spec/plan).
- The real `/Test/` visual (explicitly LAST, after all preparations).
- The non-local RAG system (separate brief: `research/rag-system/BRIEF.md`).
