# Claude-repo comparison — Primordial-viz vs. the ecosystem

**Date:** 2026-06-19 · **Axis:** Claude-agent tooling + methodology.
**Brief:** `research/claude-repo-comparison/BRIEF.md` ·
**Spec (run 2):** `docs/superpowers/specs/2026-06-19-full-repo-comparison-design.md`.

**Method:** every peer profiled from **primary sources** (its own `CLAUDE.md` /
`AGENTS.md` / `.claude/` tree / `SKILL.md` / `settings.json` / `.mcp.json`), via
parallel research agents — not blog summaries. Baseline row verified from this
working tree. Star counts are GitHub's reported figures (approximate).

**Four runs, merged here:**
- **Run 1 — skills/methodology libraries** (4 peers).
- **Run 2 — full repositories** (8 peers): a mix of **config** repos (complete
  agent setups) and **product** repos (real apps/frameworks that also carry Claude
  tooling). This is the more apples-to-apples set for a *product* repo like ours.
- **Run 3 — reader-suggested candidates** (4 considered): 1 added as a labeled
  `collection`; 3 excluded with reasons (see "Run 3" notes below).
- **Run 4 — whole-workflow systems** (5 peers): end-to-end process/orchestration
  systems (PM-via-Issues, swarm orchestration, task-driven dev, continuity
  management, spec-driven dev). These are the **closest peers to our continuity /
  process machinery** (orient hook, git-committed branch-aware continuity, parking
  lot, learn-from-corrections) — see "Run 4" notes + the rewritten synthesis.

**`Kind` legend:** `baseline` (us) · `skills-lib` · `config` · `product` ·
`collection` (an installable bundle/catalog, not a single-project config) ·
`workflow` (an end-to-end process/orchestration system).

## Master comparison table (19 rows)

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
| automazeio/ccpm | workflow | No root `CLAUDE.md`; rules in `skill/ccpm/references/conventions.md` (PRD/epic/task YAML schemas, real-datetime rule, git/worktree conventions); `.claude/context/` | One portable **Agent Skill** (`skill/ccpm/`, intent-routed) + ~14 deterministic bash report scripts; per-stream subagents in Execute; **no MCP** (uses `gh` CLI, not Projects API) | **No lifecycle hooks / CI / drift gate** — "automation" is the script-first reporting layer + `gh`-based Issue sync | **PRD→epic→numbered tasks→GitHub sync→parallel worktree execute→track**; **GitHub Issues = source of truth**; single-issue → 5–8 conflict-scoped work-streams; "No Vibe Coding" |
| ruvnet/ruflo (claude-flow) | workflow | `CLAUDE.md`+`CLAUDE.local.md`+`AGENTS.md`; aggressive "all-concurrent-in-one-message / never-save-to-root / <500-line files" rulebook; **MCP coordinates, Task tool executes** | Claims **100+ agents** (~25 category folders); **is itself an MCP server** (~210 tools advertised); commands/skills/workflows/checkpoints dirs | Full lifecycle via one `hook-handler.cjs` dispatcher (Pre/Post/UserPromptSubmit/SessionStart/End/Stop/PreCompact/SubagentStop); claims **27 hooks + 12 background workers**; env-file/destructive denies | **Swarm topologies** (hierarchical Queen-led default, mesh/star/ring/adaptive) + **consensus** (Raft/Byzantine/Gossip); vector memory (AgentDB/RAG/RVF), SONA neural + ReasoningBank self-learning; comms-first named-agent `SendMessage` |
| eyaltoledano/claude-task-master | workflow | `CLAUDE.md`+`CLAUDE_CODE_PLUGIN.md`+`assets/AGENTS.md`; `task-master init --rules` scaffolds **per-editor rule profiles** (.cursor/.claude/.vscode/.kiro) + `.taskmaster/` | **MCP server exposing ~36 task tools** (parse_prd/next_task/expand_task/…) mirrored by a CLI; **3 model roles** (main/research/fallback), provider-agnostic; no formal subagents | Build/CI-grade (turbo/biome/vitest/Actions) but **no Claude lifecycle hooks**; automation = the `next→show→implement→update-subtask→set-status` loop | **PRD→`tasks.json`→expand→dependency-ordered execution**; **state = version-controlled `tasks.json` + `tasks/` files** (never hand-edited); `update-subtask` logs progress into task state; editor-portable |
| parcadei/Continuous-Claude-v3 | workflow | No root `CLAUDE.md`; **12-file `.claude/rules/`** incl. `claim-verification` (≈ our accuracy rule), `destructive-commands`, memory-recall rules; `settings.json`+`skill-rules.json` | **109 skills, 32 agents** (isolated-context sub-sessions: orchestrators/planners/scouts/critics); meta-skills chain workflows; MCP/Task subagents get TLDR-summarized context injected | **30 lifecycle hooks** (TS→JS), every event incl. **PreCompact auto-save**, tldr-read-enforcer, compiler-in-the-loop, auto-handoff-stop — far broader than ours | **"Compound, don't compact":** Continuity Ledgers + **YAML handoffs** + **save→wipe→resume**; state in **Postgres+pgvector** + a **daemon** that extracts "learnings" into archival memory (automated learn-from-corrections); ~95% token-save claim |
| github/spec-kit | workflow | **Constitution** model (`.specify/memory/constitution.md` — numbered NON-NEGOTIABLE articles); **templates as executable guardrails** with `[NEEDS CLARIFICATION]` markers + **Phase-Gates** that block progression | Installs a **slash-command set** into each agent (`/speckit.specify|plan|tasks|implement|…`) across **30+ agents**; **no MCP** | Automation = the **Specify CLI** (`specify init` scaffolds `.specify/`+`specs/`); **no Claude lifecycle hooks**; `/speckit.taskstoissues` = GitHub-native bridge | **constitution→/specify→/clarify→/plan→/tasks→/analyze→/implement**; specs are **first-class executable artifacts** that generate code; each phase emits a reviewable artifact feeding the next; auto-numbered per-feature spec dirs |

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

## Per-repo notes (run 4 = whole-workflow systems — closest peers to our continuity/process)

These five are **end-to-end process systems**, the most apples-to-apples to our
own continuity + methodology machinery (orient-on-launch hook, git-committed
branch-aware continuity, parking lot, learn-from-corrections). Two axes recur:
**source-of-truth for state** (GitHub Issues vs `tasks.json` vs Postgres vs
spec files vs our committed markdown) and **how phases/agents are sequenced**.

**automazeio/ccpm** ([link](https://github.com/automazeio/ccpm), MIT, ~8.2k★) —
a PM workflow that makes **GitHub Issues the durable source of truth**: a five-phase
**PRD → epic → numbered tasks → GitHub sync → parallel worktree execute → track**
lifecycle. Standouts: decomposing a single issue into 5–8 **conflict-scoped parallel
work-streams** (each subagent owns a file-pattern set, pull-before-write) for real
multi-agent parallelism; a **script-first deterministic reporting layer** (~14 bash
scripts) so the LLM isn't burned on mechanical state; worktree-per-epic isolation
with `Issue #N:` commit linkage tracing every line to a spec. No hooks/CI/drift gate.
*Flag:* its headline metrics (89% less context-switching, 75% fewer bugs) are
uncited marketing figures. Recently refactored from a command tree into one portable
Agent Skill.

**ruvnet/ruflo** (formerly claude-flow) ([link](https://github.com/ruvnet/ruflo),
MIT, ~60k★) — the maximalist **multi-agent orchestration meta-harness**: it is
*itself* an MCP server (~210 advertised tools) that coordinates while Claude Code's
Task tool executes. Standouts: **swarm topologies** (hierarchical Queen-led default,
plus mesh/star/ring/adaptive) with **consensus protocols** (Raft/Byzantine/Gossip);
persistent **vector memory** (AgentDB/RAG/RVF) + self-learning (SONA neural patterns,
ReasoningBank trajectory capture) for cross-session continuity; a **comms-first**
protocol where named agents message each other rather than poll shared memory; and
three-tier cost routing. *Flags:* the impressive figures (210 tools, 27 hooks, 89%
routing accuracy, 1.9–4.7× speedups) are vendor-stated, not independently verifiable
from code. **Provenance:** a heavy harness that *wraps* Claude Code primitives (Task
tool, hooks, CLAUDE.md, SendMessage) rather than reimplementing the CLI — far more
machinery than a lean product repo needs, but a rich idea source.

**eyaltoledano/claude-task-master** ([link](https://github.com/eyaltoledano/claude-task-master),
**MIT WITH Commons Clause**, ~27.6k★) — a **task-driven dev** engine delivered as an
MCP server (~36 task tools) + CLI, droppable into many editors. Standouts: **three
explicit model roles** (main / **research** / fallback) — directly relevant to a
multi-source posture; **`update-subtask` logs implementation progress *into* task
state**, so context survives a session reset (close parallel to our `progress.md`);
**`tasks.json` as version-controlled source of truth** that agents may only mutate via
commands; editor-portable rule profiles from one engine. *Licensing nuance:* the
Commons Clause means you can build *on* it commercially but **cannot resell it or host
it as a service** — fine to learn from, watch the clause before any deeper dependence.

**parcadei/Continuous-Claude-v3** ([link](https://github.com/parcadei/Continuous-Claude-v3),
MIT, ~3.8k★) — **the single closest peer to our continuity system.** Its principle is
**"compound, don't compact":** Continuity Ledgers (within-session) + **YAML handoffs**
(between-session) + a **save → wipe → resume** cycle that dodges lossy compaction.
Direct parallels to us, but heavier: a **PreCompact hook auto-saves** state (vs our
manual handoff); a background **daemon extracts "learnings" from thinking blocks into
archival memory** for the next session to recall (an automated analog of our `/lesson`
learn-from-corrections loop); 30 lifecycle hooks vs our handful; a `claim-verification`
rule mirroring our accuracy rule. **Key contrast:** its state lives in a
**Postgres + pgvector + daemon** stack — powerful but infra-heavy — whereas ours is
deliberately **git-only, zero-infra, branch-scoped**, which suits a phone-driven,
ephemeral-cloud operator. *Flags:* v3 (~3.8k★) is canonical-by-engagement over a newer
low-star v4 dev branch; exact ledger/YAML schemas weren't readable (likely gitignored
runtime state); docs say "25+" hooks while settings.json registers 30.

**github/spec-kit** ([link](https://github.com/github/spec-kit), MIT, ~114k★) —
**first-party GitHub** spec-driven-development toolkit (the Specify CLI), supporting
30+ agents incl. Claude Code via installed slash commands. Standouts: a **constitution**
of numbered NON-NEGOTIABLE principles every phase must honor; **templates as executable
guardrails** (forced `[NEEDS CLARIFICATION]` markers, **Phase-Gates that block
progression** until principles pass); a strict **constitution → /specify → /clarify →
/plan → /tasks → /analyze → /implement** lifecycle where **specs are first-class
executable artifacts** and each phase emits a reviewable artifact feeding the next;
`/speckit.taskstoissues` bridges specs to GitHub issues. **No MCP, no Claude lifecycle
hooks** — purely command-driven. The most disciplined "design-before-code" peer; the
spirit overlaps our own brainstorm→plan→execute chain (and our adopted `spec-kit`-style
`spec-driven-implementation` skill), but with hard machine-enforced gates we lack.
*(BMAD-METHOD was considered as an alternate spec-driven pick; spec-kit was chosen as
the stronger, first-party, MIT, no-IP-baggage representative — BMAD's strongest
Claude-Code ports are community forks.)*

## Synthesis (rewritten against the wider, truer-peer set)

### The big finding: two opposite philosophies, and we straddle them
*(Run 4 adds a third lens — process/continuity systems — addressed in its own
takeaway below; the run-2 product-vs-config split still frames the core.)*
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

### Where we're ahead (keep) — recalibrated after run 4
Run 4 is the first set with **direct continuity peers**, so two earlier "nobody
else does this" claims need honest softening:
- **Continuity that survives a wipe** is no longer unique — **Continuous-Claude-v3**
  is a full continuity system (ledgers + YAML handoffs + save/wipe/resume), and
  ccpm/task-master persist state too (Issues / `tasks.json`). What stays
  differentiated is our **implementation choice**: **git-only, zero-infra,
  branch-scoped** continuity with an **orient-on-launch hook**, vs their heavier
  stacks (Continuous-Claude's Postgres+pgvector+daemon; ruflo's vector DB). For a
  **phone-driven operator on an ephemeral cloud container**, git-only is the right
  trade — nothing to host, nothing to lose on a wipe. We're not ahead on capability;
  we're ahead on **fit-to-constraint**.
- **Self-improvement loop** (parking lot + learn-from-corrections) — **partly
  matched now**: Continuous-Claude's daemon auto-extracts "learnings" into recallable
  memory (a more automated version of our `/lesson` loop) and ruflo's ReasoningBank
  captures trajectories. Ours is manual but **transparent and committed** (a human
  can read/edit every lesson). The *parking lot* specifically still has no clean peer.
- **A real docs drift gate wired into CI** — still rare: we share it only with
  wshobson (`make garden`) and MuhammadUsmanGM (`lint-claude-md`); none of the five
  workflow systems ship one (their discipline is process gates, not doc-drift gates).

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
7. **A PreCompact auto-save hook** (Continuous-Claude-v3; also ruflo) — the cheapest
   high-leverage idea from run 4. We already update `progress.md` *manually* at
   session end; a PreCompact hook that nudges (or auto-writes) a handoff entry
   before compaction would close the gap where a long session compacts mid-task and
   loses unsaved context. This was already a parked TODO ("PreCompact 'update
   progress.md' reminder hook") — run 4 confirms it's worth doing and is the
   minimal, git-only version of what the continuity peers automate with a daemon.
8. **An auto-extracted "learnings" recall** (Continuous-Claude's daemon; ruflo's
   ReasoningBank) — a lighter-weight, git-only take on our `/lesson` loop: surface
   recent committed lessons in the orient hook so they actively shape the next
   session, not just sit in a log. Don't adopt the Postgres/daemon machinery — keep
   it markdown + hook, matching our zero-infra posture.

### Honest caveat (updated)
Run 2 delivered true product peers — so the earlier "no real peers" caveat is
resolved. The new caveat is narrower: the most sophisticated *tooling* still lives
in **config repos** (whose product *is* the tooling), while the most sophisticated
*products* keep tooling thin. Our position between them is defensible, but the two
cheapest high-leverage moves — an **eval harness** and an **`AGENTS.md` mirror** —
are exactly what the wider field is converging on.

### Run 4 takeaway (whole-workflow systems)
The five workflow systems split cleanly on **how much infrastructure they bind to
continuity**: spec-kit and ccpm are **stateless engines** that lean on existing
durable stores (git-tracked spec files / GitHub Issues); task-master adds one
version-controlled file (`tasks.json`); ruflo and Continuous-Claude build **heavy
stateful stacks** (vector DBs, Postgres+daemon). Our position is the **lean end of
the stateful spectrum** — real cross-session continuity, but git-only and
zero-infra, which is exactly right for a one-operator, phone-driven, ephemeral-cloud
project. The honest update vs the earlier runs: continuity is **no longer our unique
capability** (Continuous-Claude proves the pattern is established), but our
*constraint-fit* implementation, our drift gate, and our parking lot remain
distinctive. The two cheapest run-4 borrows — a **PreCompact handoff hook** and
**surfacing recent lessons in orient** — are both git-only and already half-parked.

---
*Run 1: 4 parallel agents. Run 2: 8 parallel agents. Run 3: 4 parallel agents
(reader-suggested; 1 added, 3 excluded). Run 4: 5 parallel agents (whole-workflow
systems: ccpm, ruflo/claude-flow, claude-task-master, Continuous-Claude-v3,
spec-kit). All read primary sources; unverifiable items flagged per-profile. Star
counts approximate except where noted API-verified.*
