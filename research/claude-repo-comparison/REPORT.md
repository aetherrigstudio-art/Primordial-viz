# Claude-repo comparison — Primordial-viz vs. the ecosystem

**Date:** 2026-06-19 · **Axis:** Claude-agent tooling + methodology (primary).
**Brief:** `research/claude-repo-comparison/BRIEF.md`. **Method:** each candidate
profiled from **primary sources** (the repo's own `CLAUDE.md` / `.claude/` tree /
`SKILL.md` / `settings.json` / `.mcp.json`), via four parallel research agents,
not blog summaries. Baseline row (this repo) verified from the working tree.

> Scope note: "similar" here = repos heavily built **with** Claude Code tooling.
> The realistic peers are **skills frameworks / best-practice reference repos**,
> not product apps — see the synthesis. A second, product-domain comparison
> (raw-WebGL2 / shader / audio-visual apps) is parked as a follow-up.

## Comparison table

| Repo | 1. Config & rules | 2. Skills / agents / MCP | 3. Hooks & automation | 4. Process & methodology |
|---|---|---|---|---|
| **Primordial-viz** (this repo) | `CLAUDE.md` 200 lines as a **knowledge-router table** + always-loaded accuracy/communication rules; **4 scoped `.claude/rules/`** (shaders/audio/deploy/mobile); `@`-imports `task_plan.md`+`progress.md`; `ONBOARDING.md` start gate | **32 skills** (5 ours + ~20 adopted via `npx skills`, area-tagged, provenance in `skills-lock.json`); **2 subagents** (visual-qa, audio-dsp); **3 MCP** (mdn, context7, + local `primordial`); auto-generated router `.claude/skills-router.md` | **7 hooks** across SessionStart/PreToolUse/PostToolUse/UserPromptSubmit (orient, inject-rules, check-syntax, check-data, gen-docs, suggest-workflow, detect-correction); **docs generator + drift gate** (`gen-docs.mjs` fails CI on dangling path refs); `npm run health` one-pass; GitHub Actions CI + auto-deploy | brainstorm→plan→subagent-driven lifecycle; **git-committed session continuity** (cloud-wipe-proof); **parking lot** (`/park` + Open threads); **learn-from-corrections** (`/lesson` + detect-correction hook); named workflow chains |
| **obra/superpowers** | Root `CLAUDE.md` is a **contributor/governance guide** (not a runtime router); behavioral rules live **inside skills**; cross-harness `AGENTS.md`/`GEMINI.md` parity | **~14 skills**, flat dirs, `SKILL.md`+frontmatter; **no file-defined subagents** (spawned at runtime via skills); **no MCP server**; packaged as a **multi-harness plugin/marketplace** (Claude/Cursor/Codex/Gemini/Kimi/OpenCode/Pi) | **SessionStart only** — injects `using-superpowers` so every session "has superpowers"; **no Pre/PostToolUse**; pre-commit, cross-harness **sync tests**, an **eval harness gating skill changes** | Linear lifecycle baked into skills: brainstorm→worktrees→plan (2–5 min tasks)→subagent exec + 2-stage review→TDD→code-review→finish; the "**1% rule**" forces skill use |
| **anthropics/skills** | **No `CLAUDE.md`, no `.claude/` rules** — it's the upstream **source of the skill format/spec** itself; always-on context = each skill's name+description (~100 tok) | **17 skills** by domain; registered via `.claude-plugin/marketplace.json` as **3 plugins**; skills bundle `scripts/` (Python), `references/`, `assets/`; **experimental per-skill `allowed-tools`** permissions; no subagents/MCP servers (has an `mcp-builder` *skill*) | **No hooks, no in-repo drift gate**; validation **externalized** to a `skills-ref validate` CLI; CI not verified | Methodology *is* the deliverable: **progressive disclosure** (metadata→body<5k tok→on-demand); `skill-creator` documents intent→research→draft→test→eval loop; no session-continuity (not that kind of repo) |
| **shanraisshan/claude-code-best-practice** | `CLAUDE.md` **~290 lines** (ironically over the 200 it preaches); coarse routing ("search this repo first"); **2 `.claude/rules/`** via path-glob frontmatter | **5 skills**, **6 subagents** (+workflows), 2–3 commands; **3 MCP** (Playwright, Context7, Deepwiki), `enableAllProjectMcpServers` | **Heaviest hooks**: `settings.json` wires **~28 lifecycle events** to one Python dispatcher; audio notifications, JSONL logging, team/local config layers; **no CI, no docs-drift gate**; empty `deny` list | Orchestration-by-example with a **fail-closed gate** between steps; **per-agent memory dir**; methodology mostly **curated externally** (catalogs 13+ community workflows, 83+ tips) |
| **MuhammadUsmanGM/claude-code-best-practices** | Concise repo `CLAUDE.md` + **11 stack `claude-md-*` templates** (the headline asset); routing = doc cross-linking | One dogfooded skill (`lint-docs`) + examples; guides for skills/MCP; **plugins** `commit-helper`, `claude-md-checker`; subagents documented not shipped | `settings.json`: PreToolUse `block-secrets`, PostToolUse `format-on-write`, Stop→`test-on-stop`; **deny** `git push`/`rm -rf`; **CI gates** shellcheck/markdownlint/lychee + a **`lint-claude-md` drift gate**; cost/benchmark tooling | Guides for multi-agent (orchestrator + **git-worktree per agent**), cost-management, goal-mode, decision-trees; **published benchmarks** with a reproducible harness |

## Per-repo notes

**Primordial-viz (baseline)** — MIT. A real **product** repo (raw-WebGL2 audio-visual
instrument) that also carries best-practice Claude scaffolding. Its distinctive bet
is **durable, cloud-wipe-proof continuity**: state lives in git-committed files
(`progress.md`/`task_plan.md`), surfaced by a SessionStart `orient` hook that is
branch-aware. Plus a real **docs drift gate**, a **parking lot**, and a
**learn-from-corrections** loop — closed-loop self-maintenance most reference repos lack.

**obra/superpowers** ([link](https://github.com/obra/superpowers), MIT, ~233k★) —
The dominant **methodology framework**. Standouts: the SessionStart injection +
"1% rule" that *forces* skill use; **subagent-driven-development** (agents grind a
pre-approved plan unattended with two-stage review); genuine **multi-harness
packaging** with cross-harness sync tests; an **eval harness that gates skill
changes**. We already adopted ~9 of its skills. Weak on per-project config/routing
and has no PreToolUse enforcement.

**anthropics/skills** ([link](https://github.com/anthropics/skills), Apache-2.0,
~153k★) — First-party **source of the skill spec**. Standouts: **progressive
disclosure** as a formal loading contract, **per-skill `allowed-tools`**
permissions, and **skill-as-eval-target** (variance-benchmark a skill's trigger
reliability). Not a project/agent-driven repo — no hooks, rules, or continuity by
design. It's the format authority, not a workflow peer.

**shanraisshan/claude-code-best-practice**
([link](https://github.com/shanraisshan/claude-code-best-practice), MIT, ~58k★) —
A popular **reference/showcase** repo whose depth is concentrated in **hooks**:
~28 lifecycle events to a single Python dispatcher, with team/local config layering
and a per-agent memory directory. But **no CI and no docs-drift gate**, and its
methodology is curated from elsewhere rather than enforced in-repo.

**MuhammadUsmanGM/claude-code-best-practices**
([link](https://github.com/MuhammadUsmanGM/claude-code-best-practices), MIT, ~48★) —
A smaller but well-engineered **template/handbook** repo. Standouts most relevant
to us: a **CLAUDE.md linter as a CI drift gate** across 11 stack templates,
**published benchmarks** with a reproducible harness, a **cost-estimator**, and
security-first hooks (secret-blocking, `git push`/`rm -rf` denied).

## Synthesis

### Where we're already ahead (keep)
- **Continuity that survives a wipe.** Git-committed `progress.md`/`task_plan.md` +
  a branch-aware `orient` hook is more robust than per-agent memory dirs
  (shanraisshan) or no continuity at all (superpowers/anthropics). This is our
  strongest, most differentiated piece.
- **Docs↔code drift gate wired into `npm run health` + CI.** Only MuhammadUsmanGM
  has a comparable gate; the two bigger repos don't. Ours also checks path refs
  repo-wide.
- **Breadth of enforcement hooks for a product repo** — PreToolUse rule-injection,
  PostToolUse syntax/data checks, UserPromptSubmit workflow nudge + correction
  detection. superpowers has SessionStart only; anthropics none.
- **Self-improvement loop** (parking lot + learn-from-corrections) — not seen in
  any candidate.

### What we could adopt (concrete, ranked)
1. **An eval harness that gates skill/rule changes** (from superpowers + anthropics).
   We have *correctness* gates (smoke/render/drift) but **nothing measures whether a
   skill actually triggers or improves behavior.** Highest-value gap. Could be a tiny
   "run prompt with/without skill, diff outcome" check.
2. **Per-skill `allowed-tools` permissions** (from anthropics/skills) — tighten what
   each of our 32 skills can do; fits our commercial-safety posture.
3. **A `lint-claude-md` style check** (from MuhammadUsmanGM) — assert our 200-line
   cap and router-block invariants in CI, not just by hand. Cheap, prevents the
   "CLAUDE.md crept over 200" failure we've hit twice.
4. **Cost/benchmark tooling** (from MuhammadUsmanGM) — a reproducible perf/cost
   harness; complements our in-HUD FPS verdict with a token/cost view.
5. **Multi-harness portability** (from superpowers) — low priority unless we ever
   run this under Cursor/Codex; worth knowing the `AGENTS.md` parity pattern exists.

### One honest caveat
None of the four is a true peer: three are skills/methodology **libraries** and one
is a **template handbook**. We're a **product repo** carrying that scaffolding — so
our continuity/drift/perf machinery is arguably more advanced *for an app*, while the
libraries lead on **skill packaging, eval, and multi-harness distribution** (their
actual product). The most transferable idea across all of them is **evaluation** —
measuring that the tooling works, which is our clearest next investment.

---
*Generated via 4 parallel research agents reading primary sources; star counts are
GitHub's reported figures (approximate). Unverifiable items were flagged per-profile.*
