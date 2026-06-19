# Claude-repo comparison — Primordial-viz vs. the ecosystem

**Date:** 2026-06-19 · **Axis:** Claude-agent tooling + methodology.
**Brief:** `research/claude-repo-comparison/BRIEF.md` ·
**Spec (run 2):** `docs/superpowers/specs/2026-06-19-full-repo-comparison-design.md`.

**Method:** every peer profiled from **primary sources** (its own `CLAUDE.md` /
`AGENTS.md` / `.claude/` tree / `SKILL.md` / `settings.json` / `.mcp.json`), via
parallel research agents — not blog summaries. Baseline row verified from this
working tree. Star counts are GitHub's reported figures (approximate).

**Three runs, merged here:**
- **Run 1 — skills/methodology libraries** (4 peers).
- **Run 2 — full repositories** (8 peers): a mix of **config** repos (complete
  agent setups) and **product** repos (real apps/frameworks that also carry Claude
  tooling). This is the more apples-to-apples set for a *product* repo like ours.
- **Run 3 — reader-suggested candidates** (4 considered): 1 added as a labeled
  `collection`; 3 excluded with reasons (see "Run 3" notes below).

**`Kind` legend:** `baseline` (us) · `skills-lib` · `config` · `product` ·
`collection` (an installable bundle/catalog, not a single-project config).

## Master comparison table (14 rows)

| Repo | Kind | 1. Config & rules | 2. Skills / agents / MCP | 3. Hooks & automation | 4. Process & methodology |
|---|---|---|---|---|---|
| **Primordial-viz** (this repo) | baseline | `CLAUDE.md` 200-line **knowledge-router** + always-on accuracy/comms rules; **4 scoped `.claude/rules/`**; `@`-imports `task_plan.md`+`progress.md`; `ONBOARDING.md` gate | **32 skills** (5 ours + ~20 adopted, area-tagged, `skills-lock.json`); **2 subagents**; **3 MCP** (mdn, context7, local); auto-gen router | **7 hooks** (SessionStart/Pre/PostToolUse/UserPromptSubmit); **docs drift gate** fails CI on dangling refs; `npm run health`; Actions CI + auto-deploy | brainstorm→plan→subagent lifecycle; **git-committed, branch-aware continuity**; **parking lot**; **learn-from-corrections** loop |
| obra/superpowers | skills-lib | `CLAUDE.md` = governance guide (not router); rules live in skills; `AGENTS.md`/`GEMINI.md` parity | ~14 skills, flat; no file-defined subagents; no MCP; multi-harness plugin/marketplace | **SessionStart only** (injects skills); pre-commit, cross-harness sync tests, **eval harness gates skill changes** | brainstorm→worktrees→plan→subagent+2-stage review→TDD; "**1% rule**" forces skill use |
| anthropics/skills | skills-lib | No `CLAUDE.md`/rules — it's the **skill spec source**; context = name+desc (~100 tok) | **17 skills**/3 plugins via `marketplace.json`; bundle scripts/refs/assets; **per-skill `allowed-tools`** | No hooks/drift gate; validation externalized to `skills-ref validate` CLI | **progressive disclosure** loading contract; `skill-creator` intent→draft→test→eval loop |
| shanraisshan/claude-code-best-practice | skills-lib | `CLAUDE.md` ~290 lines (over its own cap); coarse "search this repo first"; 2 path-glob rules | 5 skills, 6 subagents, ~3 commands; **3 MCP**, `enableAllProjectMcpServers` | **~28 lifecycle events → one Python dispatcher**; audio + JSONL logging; **no CI/drift gate** | orchestration-by-example w/ **fail-closed gate**; per-agent memory dir; methodology curated externally |
| MuhammadUsmanGM/claude-code-best-practices | skills-lib | concise `CLAUDE.md` + **11 stack templates**; routing = cross-linking | 1 dogfooded skill + examples; plugins `commit-helper`, `claude-md-checker` | Pre/Post/Stop hooks; **deny** `git push`/`rm -rf`; CI shellcheck/markdownlint/lychee + **`lint-claude-md` drift gate**; cost/benchmark tools | multi-agent (worktree per agent), cost-mgmt; **published benchmarks** |
| carlrannaberg/claudekit | config | `CLAUDE.md`→`AGENTS.md` **symlink**; rule = **mandatory delegation** to subagents; `.claude/{agents,commands}` symlinked from `src/` | **~27 subagents** (nested by domain), ~13 commands; **no skills dir**, no MCP | **Compiled TS hooks runner** (`claudekit-hooks`), all 5 events; file-guard (195+ patterns), typecheck/lint/test-changed, self-review on Stop | **git checkpoint/restore** (undo agent actions); `/spec:create`→6-phase; codebase-map injected on prompt |
| wshobson/agents | config | **`AGENTS.md` (~150-line cap)**, `CLAUDE.md` symlink; anti-monolith, progressive disclosure; generated per-harness rules | **192 agents, 156 skills, 102 commands, 84 plugins**; dir auto-discovery; `marketplace.json`; no MCP; model-tiering | **No lifecycle hooks** — Makefile+CI: `make garden` **drift gate**, 386 tests, smoke-installs real CLIs; CI fails on drift | **multi-harness adapter compilation** (1 source→6 harnesses); **`plugin-eval`** static+LLM-judge+**Monte-Carlo** |
| yzhao062/anywhere-agents | config | `CLAUDE.md` **generated from `AGENTS.md`** (~5k words); config-precedence + skill-lookup hierarchy; banned AI-tell words | 4 skills, 2 named agents, command pointers; **no MCP**; distributed as **pipx/npx CLI** | `guard.py` PreToolUse **destructive-cmd guard w/ wrapper-depth stripping**; SessionStart bootstrap; CI smoke on 3 OSes; CLAUDE.md regen | **version-control-first continuity** (distrust single-agent memory); leans on superpowers; `my-router` dispatch |
| disler/claude-code-hooks-mastery | config | **`CLAUDE.md` = 0 bytes**; config only in `settings.json`; **NO LICENSE** (not reusable) | ~6 agents incl. **meta-agent** (writes agents), 14 commands, no skills; 1 MCP (ElevenLabs, sample) | **All 13 hook events**, one isolated UV script each; `rm -rf`/`.env` block; **TTS feedback**; per-event JSON audit logs | `specs/` plan-before-build docs; **no continuity/memory** (empty CLAUDE.md) |
| getsentry/sentry | product | **No `CLAUDE.md`** — root `AGENTS.md` (234 ln); **glob-scoped `AGENTS.md`** per area (backend/frontend/tests) | **20 skills** in `.agents/skills` (**symlinked** from `.claude/skills`, tool-agnostic); 3 commands; **2 MCP** (own + internal); no subagents | **No Claude hooks** — ties into heavy native CI via curated `permissions.allow`; `includeCoAuthoredBy:false` | diff-first review; customer-data redaction; **`claude-settings-audit` skill polices own config**; `.claude/plans/` empty |
| cloudflare/workers-sdk | product | **`CLAUDE.md` = 4-line stub →`@AGENTS.md`**; root `AGENTS.md` (246 ln) routes to **per-package `AGENTS.md`** | **None** — no skills/subagents/commands/MCP | **No Claude hooks** — conventional CI: `pnpm check`, mandatory changeset, **PR-description validation** fails CI | "read your area's AGENTS.md, satisfy CI"; no spec/continuity/onboarding scaffold |
| openai/openai-agents-python | product | `CLAUDE.md` **symlink to `AGENTS.md`** (~350 ln); API-compat contract; no router | **9 skills** in `.agents/skills` (YAML frontmatter), invoked by **`$skill` gates**; no subagents/MCP | **`.codex/hooks.json`** Stop hook (ruff format/fix, blocks on fail) — Codex not Claude; 6 CI workflows mirror skills | **`PLANS.md` ExecPlans** living-spec (Progress/Decisions/Outcomes) for >1hr work |
| trailofbits/algo | product | **One `CLAUDE.md` ~370 ln, nothing else** — "LLM Guidance"; Philosophy + Quality Gates + **anti-footgun pitfalls** + security rationale; all inline | **None** | **No Claude hooks/drift gate**; strong conventional CI (pre-commit: ruff/semgrep/actionlint/zizmor; 7 workflows, change-based tests) — CLAUDE.md *mirrors* CI, doesn't own it | human-grade contributor discipline aimed at the LLM; **mutation-testing directive**; agent-operable non-interactive deploy |
| affaan-m/ECC ("Everything Claude Code") | collection | no `settings.json` in `.claude/`; root `rules/` + 14 harness dirs; `identity.json`/`ecc-tools.json` | **~98 agents, 200+ skills, ~144 commands** (root dirs, installed via profiles); 1 active MCP (`chrome-devtools`) + `mcp-configs/` | `hooks/hooks.json` (~50 KB, all 5 events): lint/format, git guards, **memory-persistence**, telemetry; bundled **AgentShield** security scanner over agent configs | "research-first"; **install profiles** (core/dev/security/full, per-harness); plugin-marketplace; 230+ contributors |

## Per-repo notes (run 2 = the new full-repo peers)

### Config repos (complete agent setups)

**carlrannaberg/claudekit** ([link](https://github.com/carlrannaberg/claudekit),
MIT, ~724★) — npm-installable Claude Code toolkit. Standouts: a **compiled
TypeScript hooks runner** (`claudekit-hooks run <name>`, ~28 hook source files) far
beyond shell scripts; **git checkpoint/restore** to undo agent actions; a
`thinking-level` + `codebase-map` injection on prompt-submit; and a **mandatory-
delegation** philosophy (the main agent must route everything to ~27 domain
subagents). `CLAUDE.md` is a symlink to `AGENTS.md`.

**wshobson/agents** ([link](https://github.com/wshobson/agents), MIT, ~37k★) — a
multi-harness marketplace (192 agents / 156 skills / 102 commands). Standouts:
**adapter compilation** of one Markdown source into 6 harnesses (Claude/Codex/
Cursor/OpenCode/Gemini/Copilot); **`plugin-eval`** with **Monte-Carlo statistical
testing** of agent reliability; and **`make garden`**, a mechanical drift gate
(dead links, stale artifacts, oversize skills) that fails CI. No lifecycle hooks —
automation is Makefile + CI, not the harness.

**yzhao062/anywhere-agents**
([link](https://github.com/yzhao062/anywhere-agents), Apache-2.0, ~182★) — "one
config to rule all your AI agents," distributed as a **pipx/npx CLI** that
bootstraps into any repo every session. Standouts: a hardened **`guard.py`**
PreToolUse safety hook that **strips `sudo`/`ssh`/`docker exec` wrappers** so its
destructive-command gates can't be bypassed; **version-control-first continuity**
(treats single-agent memory as unreliable); and mechanically-enforced writing
style (banned AI-tell words at the hook layer). `CLAUDE.md` generated from `AGENTS.md`.

**disler/claude-code-hooks-mastery**
([link](https://github.com/disler/claude-code-hooks-mastery), **NO LICENSE**,
~3.8k★) — a hooks teaching repo wiring **all 13 lifecycle events**, one isolated
UV Python script each, with TTS feedback and per-event JSON audit logs; includes a
**meta-agent** that authors other agents. The inverse of us: maximal hooks/agents
breadth with a **zero-byte `CLAUDE.md`**, no continuity, and **no license** (not
safely reusable — flag for any adoption).

### Product repos (real software that also carries Claude tooling)

**getsentry/sentry** ([link](https://github.com/getsentry/sentry), fair-source
FSL/non-OSI, ~44k★) — the richest *product* example. Standouts worth borrowing:
**glob-scoped `AGENTS.md`** files as monorepo knowledge routing; the
**`.claude/skills → .agents/skills` symlink** that keeps 20 skills tool-agnostic;
**dogfooding their own MCP server**; and a **`claude-settings-audit` skill that
polices its own config**. Notably uses `AGENTS.md` (no `CLAUDE.md`) and **no hooks**.

**cloudflare/workers-sdk**
([link](https://github.com/cloudflare/workers-sdk), Apache-2.0, ~4.2k★) — a big
monorepo with **deliberately thin** Claude tooling: a 4-line `CLAUDE.md` stub
delegating to a hierarchy of per-package `AGENTS.md` files, and **zero** skills/
subagents/hooks/MCP. Bets entirely on **portable docs + a strong CI gate**
(mandatory changesets, PR-description validation). The clean opposite philosophy
to ours.

**openai/openai-agents-python**
([link](https://github.com/openai/openai-agents-python), MIT, ~27k★) — OpenAI's
agent SDK (cross-vendor case). `CLAUDE.md` is a **symlink to `AGENTS.md`**.
Standouts: **`$skill` mandatory-gate syntax** invoked from the rules file; a Stop
**hook** (via Codex, not Claude) that auto-formats and blocks on failure; and
**`PLANS.md` ExecPlans** — a portable living-spec template (Progress / Decision
Log / Outcomes) that's the closest peer to our `progress.md` continuity.

**trailofbits/algo** ([link](https://github.com/trailofbits/algo), AGPL-3.0,
~30k★) — a mature security product whose entire Claude footprint is **one dense
~370-line `CLAUDE.md`** and nothing else. Standout: treating that file as a
**distilled anti-footgun / tribal-knowledge manual** ("Time Wasters to Avoid,"
real Jinja2 gotchas) with explicit **security rationale** for its zero-warning
policy, plus a **mutation-testing directive** ("introduce the bug to verify the
test fails first"). No hooks, skills, or continuity — all sophistication is in the
*content*.

### Run 3 — reader-suggested candidates (all considered; 1 added, 3 excluded)

Four repos surfaced in discovery and were profiled from primary sources at the
operator's request. The honest finding: **none is a clean full-repository peer**
on the agent-tooling axis, for two distinct reasons.

**affaan-m/ECC — "Everything Claude Code"**
([link](https://github.com/affaan-m/everything-claude-code), MIT, **~218k★**
API-verified — the popular "99.9k" figure is stale) — **ADDED as `collection`.**
A cross-harness **bundle** (~98 agents / 200+ skills / ~144 commands) meant to be
installed *into* other projects, not a single-project config. Borrowable ideas:
**install profiles** (core/dev/security/full), **AgentShield** (a security scanner
that audits agent configs), and **memory-persistence hooks**. Included as a labeled
collection because it's substantive, hugely popular, and idea-rich — but it is not
like-for-like with a purpose-built project setup.

**avalonreset/legends-github ("Claude GitHub")**
([link](https://github.com/avalonreset/legends-github), MIT, ~11★) — **excluded.**
A well-built **skills suite** (8 repo-audit skills + 6 subagents, optional
DataForSEO/KIE MCP) with **no `CLAUDE.md`, no hooks, no app domain** — i.e. exactly
the skills-collection tier run 2 set out to move beyond. Nice idea: a strict
"score-from-data-only, missing = 0 points" agent contract.

**ruvnet/open-claude-code**
([link](https://github.com/ruvnet/open-claude-code), MIT for its code, ~398★) —
**excluded (category mismatch + IP flag).** A **reverse-engineered reimplementation
of the Claude Code CLI itself** ("clean-room… informed by analysis of the published
npm package"). It's the *engine that consumes* CLAUDE.md/skills/hooks, not a project
*configured with* them — so it authors essentially no agent config to compare. The
clean-room claim over Anthropic's proprietary CLI is legally untested; **not a
licensing precedent to lean on** given our commercial "write-our-own" posture.

**Gitlawb/openclaude**
([link](https://github.com/Gitlawb/openclaude), see note, ~29k★) — **excluded
(category mismatch + harder IP flag).** A **fork of Claude Code's source**; its
LICENSE carries `Copyright (c) Anthropic PBC. All rights reserved.` plus MIT *for
modifications only*. No `.claude/`/`CLAUDE.md`/hooks-as-config exist — its
"skills/agents/hooks" are product source code. A relicensed derivative, not a
config/methodology peer.

**Takeaway from run 3:** the most-starred "Claude repos" are **CLI engines/forks**
(the wrong *kind* of peer, with IP baggage) or **mega-collections** (the
skills-bundle tier). This reinforces run 2's core finding — genuine *product repos
built like config repos* (our shape) remain rare.

## Synthesis (rewritten against the wider, truer-peer set)

### The big finding: two opposite philosophies, and we straddle them
Run 2 exposed a clean split the skills-only run couldn't:
- **Real product repos keep Claude tooling deliberately thin.** sentry,
  workers-sdk, openai-agents, and algo — all large, reputable, active — invest in
  **content** (a strong `AGENTS.md`/`CLAUDE.md`) and lean on their **existing CI**.
  None ship lifecycle hooks; most ship no skills/subagents. They bet on
  *portable docs + a strong gate* over bespoke harness automation.
- **Config repos go deep on machinery** (claudekit's compiled hook runner,
  wshobson's 192 agents + Monte-Carlo eval, anywhere-agents' hardened guard,
  disler's 13 hooks).

**We are a product repo built like a config repo** — the only entry that combines
a real app domain with config-repo-depth tooling (hooks, drift gate, continuity,
parking, lessons). That's genuinely unusual and mostly a strength, but it carries a
real trade-off the product repos avoid (see "adopt #2").

### Where we're ahead (keep)
- **Continuity that survives a wipe** remains our single most differentiated piece.
  The closest peers are openai-agents' `PLANS.md` (a *template*, not committed
  state) and claudekit's checkpoints (code-state, not knowledge). Ours is
  committed, branch-aware, and orient-on-launch.
- **Self-improvement loop** (parking lot + learn-from-corrections) — still not seen
  in any of the 13 peers.
- **A real docs drift gate wired into CI** — we share this only with wshobson
  (`make garden`) and MuhammadUsmanGM (`lint-claude-md`); the four product repos
  have none.

### What we could adopt (concrete, ranked — now corroborated more widely)
1. **An eval harness that measures whether a skill/rule actually works** — now seen
   in **3** peers (superpowers, anthropics, and wshobson's `plugin-eval` with
   Monte-Carlo). Still our highest-value gap: we gate *correctness*, never *efficacy*.
2. **Adopt `AGENTS.md` as the cross-tool source of truth + a `CLAUDE.md` symlink** —
   **near-universal** in run 2 (sentry, workers-sdk, openai-agents, claudekit,
   wshobson, anywhere-agents). Cheap, and the one thing the portable-docs crowd has
   that we don't: our knowledge would work under Codex/Cursor for free. Our
   `gen-docs` already generates files, so a generated `AGENTS.md` mirror fits.
3. **A self-auditing config gate** — now corroborated by **four** peers:
   MuhammadUsmanGM's `lint-claude-md` (assert our 200-line cap + router-block
   invariants), sentry's `claude-settings-audit` skill, wshobson's `make garden`,
   and ECC's **AgentShield** (a scanner over agent configs). Folds into
   `npm run health`; kills the "CLAUDE.md crept over 200" failure we've hit twice.
4. **A hardened destructive-command PreToolUse guard** (anywhere-agents' `guard.py`
   with wrapper-depth stripping; claudekit's 195-pattern file-guard; the
   `deny git push`/`rm -rf` lists; ECC's AgentShield rules). We rely on permission
   `deny` rules — a guard that survives `sudo`/`ssh` nesting is stronger and fits
   our commercial posture.
5. **Per-skill `allowed-tools` permissions** (anthropics) — scope what each of our
   32 skills can touch.
6. **`CLAUDE.md` as an anti-footgun manual** (trailofbits) — our rules are good, but
   a short "Time Wasters / known gotchas" section (the registry-fetch 404, the
   CI software-GL screenshot freeze, FTP-blocked container) would save real loops.

### Honest caveat (updated)
Run 2 delivered true product peers — so the earlier "no real peers" caveat is
resolved. The new caveat is narrower: the most sophisticated *tooling* still lives
in **config repos** (whose product *is* the tooling), while the most sophisticated
*products* keep tooling thin. Our position between them is defensible, but the two
cheapest high-leverage moves — an **eval harness** and an **`AGENTS.md` mirror** —
are exactly what the wider field is converging on.

---
*Run 1: 4 parallel agents. Run 2: 8 parallel agents. Run 3: 4 parallel agents
(reader-suggested; 1 added, 3 excluded). All read primary sources; unverifiable
items flagged per-profile. Star counts approximate except where noted API-verified.*
