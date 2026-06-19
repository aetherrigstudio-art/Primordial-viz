# Claude Environment Roadmap — Primordial-viz

Scope: **the Claude setup only** — how we make this repo + agent optimal so the
app can be built **phone-driven and laptop-free**. (The product/app roadmap is the
repo-root `ROADMAP.md`.)

## North star
One operator on a phone directs Claude. Claude does the work in ephemeral cloud
sessions and proves it with automated checks. Every session must **self-orient**
on start and **hand off cleanly** on end.

## The hard constraint — persistence model (official `code.claude.com` docs)
Each cloud session = a fresh VM with the repo cloned. Three buckets:
1. **Git repo** → survives every session. *This is the only durable layer.*
2. **Cloud Environment** (setup script + env vars + network) → snapshot-cached and reused; the setup script runs once then is skipped.
3. **`~/.claude/` (auto-memory, plan files) + installed tools** → do **NOT** survive.

> Rule: **durable state = git only.** Auto-memory and `~/.claude/plans` are
> machine-local and evaporate in cloud — don't rely on them.

## Phases (📱 = you, in app/web · 🤖 = me, in repo)

### A — Phone control plane (📱, ~5 min, highest leverage) — PENDING
- Phone **push**: notify on "input needed" + "task done".
- **Auto mode** as default permission (set at *user* level — it's ignored from project settings) + a small `permissions.deny` list for irreversible actions.
- Add **`Primordial-viz`** to the **Claude GitHub App** repo access (currently only on `perchance-ai-tool`) → unlocks phone-driven **Auto-fix PRs**.

### B — Cloud environment (📱, once; it's cached) — PENDING
- **Setup script** installs the toolchain: `npm ci` + `npx playwright install chromium`. Network **Full**. No secrets in env vars (they're visible).

### C — Repo durability + handoff (🤖) — ✅ DONE
- `CLAUDE.md` `@imports` `task_plan.md` + `progress.md`; `.claude/hooks/orient.sh` (SessionStart); smoke + render-check + CI; `window.__primordial` render beacon. All committed.

### D — Optional polish (later) — BACKLOG
- Terse output style; Context7 MCP (library docs); Routines/`/schedule` for unattended check-ins; new `verify`/`deploy` skills (needs OK). (Knowledge-delivery items live in their own section below.)

## AI handoff method (how we keep continuity)

Best practice (sources below): a handoff is a **structured artifact a fresh agent
can consume with zero ambiguity**. Principles:
- **Specific beats generic** — a vague "continue the work" handoff is worse than none. Quantify progress; name the **exact next step**.
- **Record the *why*** behind decisions, not just the what.
- **Write it proactively** — at milestones, after substantial work, or when context is ~>80% full / before compaction; not only at the very end.
- **Quality bar:** no unresolved `[TODO]` placeholders, no secrets, referenced files must exist.
- **The "fresh-agent test":** could a brand-new agent with zero memory resume from the handoff alone? If not, it's incomplete.

Our cloud-safe adaptation (committed files, since auto-memory/`--teleport` don't fit cloud/phone):
- **`progress.md`** = the rolling handoff log (one entry per session).
- **`task_plan.md`** = plan + status table.
- **`CLAUDE.md`** `@imports` both so a fresh agent auto-loads them at launch.
- **`.claude/hooks/orient.sh`** (SessionStart) prints branch/commits + verify commands + load-bearing rules.

### Handoff entry template (append to `progress.md` each session)
```
## Session N — <date> (<theme>)
Metadata: branch <…>, PR #<…>, key commits <…>
Did: <what changed>
Decisions (+ why): <…>
Next step (specific/quantified): <exact next action>
Pending: <prioritized list>
Critical files: <path — purpose>
Gotchas: <known issues / workarounds>
```

## Knowledge & context system (context-delivery hardening)

The rules/agents/skills **content** is strong; the gaps are **delivery**
(load-bearing rules only load if an agent thinks to read them) and **drift**
(prose knowledge isn't freshness-gated — `CLAUDE.md` and the `deploy-cpanel`
skill have both gone stale). The fix is to make knowledge *self-announce* and to
keep one source of truth per topic.

- **Knowledge router** — a `CLAUDE.md` table mapping each work area to its
  required reading (shaders → `rules/shaders.md`, audio → `rules/audio.md`, …).
  Always-loaded, so it can't be skipped. ✅ DONE.
- **`thought-based-reasoning` skill** — structured reasoning harness for
  design/architecture decisions; grounds via the router before proposing. ✅ DONE.
- **Rule-injector hook (PreToolUse on Edit|Write)** — when the edited path
  matches `src/shaders/**` / `src/gl/**` / `src/audio/**`, inject the scoped rule
  + the mobile-playback budget into context *before* the edit, so the load-bearing
  rules surface at the moment of relevance instead of relying on the agent to
  fetch them. **Device-aware:** reads `CLAUDE_CODE_ENTRYPOINT` to tailor the
  verification note to the operator's device (phone → no desktop profiler, lean on
  CI; web/CLI variants). ✅ DONE — `.claude/hooks/inject-rules.sh`.
- **Drift gate + single source of truth** — ✅ DONE. `gen-docs.mjs` has a
  `checkRefs()` pass (gated by `gen-docs --check` in CI): backtick-quoted,
  repo-rooted paths in the knowledge docs (`CLAUDE.md`, `deploy/DEPLOY.md`,
  `.claude/rules/*`, `.claude/skills/*`) must exist — catches "file renamed/deleted
  but a doc still points at it." Conservative (skips globs, placeholders, bare
  filenames, and fenced code blocks) to never false-fail CI. Fixed the first
  offender: the stale `deploy-cpanel` skill (dropped the nonexistent `assets/`;
  now leads with the auto-deploy path).
- **PreCompact hook** — remind to update `progress.md` before a long session
  compacts, so mid-session continuity isn't lost. — TODO.
- **Skills auto-registration** — skills declare a frontmatter `area:`;
  `gen-docs.mjs` regenerates the `@generated skills:router` block in the CLAUDE.md
  router (run by the existing PostToolUse gen-docs hook on any skill edit; CI-gated
  by `gen-docs --check`). The `/skill-router` skill is the manual trigger + "which
  skill for X?" discovery. The **server needs nothing** — every `SKILL.md` is
  already in the MCP `search_docs` index and `ENCYCLOPEDIA.md`. ✅ DONE.
- **`list_skills` / `get_skill` MCP tool** — structured skill discovery on the
  server. Deferred: the harness already injects skill descriptions and MCP
  doc-search already covers skills, so it adds little until the skill count grows
  (~20+). Per-session cost is only each skill's description (~80–110 tokens), so
  the set scales cheaply regardless. — TODO (later).

## Sources
- Claude Code cloud / memory / hooks / permission-modes / routines — `code.claude.com/docs`
- AI agent handoff best practice: agent-toolkit *session-handoff* skill (github.com/softaworks/agent-toolkit); jdhodges.com "Claude Handoff Prompt (2026)"; blakelink.us "Session Handoff Protocol"; Towards Data Science "How Agent Handoffs Work in Multi-Agent Systems"; Microsoft Agent Framework "Handoff"; OpenAI Agents SDK / LangGraph handoff primitive.

## Adopt-ideas roadmap (from comparison research, 2026-06-19)

Source: `research/claude-repo-comparison/REPORT.md` +
`research/product-domain-comparison/REPORT.md`. Spec:
`docs/superpowers/specs/2026-06-19-adopt-ideas-roadmap-design.md`.

**Phase 1 — cheap wins (git-only) — IN PROGRESS**
1. `AGENTS.md` cross-tool mirror (gen-docs emits it from `CLAUDE.md`) — portability we alone lack.
2. Self-auditing config gate (`CLAUDE.md` ≤200 / router markers / settings JSON) in `npm run health`.
3. PreCompact handoff hook — remind to update `progress.md` before compaction.
4. Recent `LESSON` entries surfaced in `orient`.
5. Anti-footgun `.claude/rules/gotchas.md`.

**Phase 2 — higher-effort tooling — BACKLOG**
6. Eval harness (does a skill/rule actually trigger + help?) — research's #1 gap.
7. Hardened destructive-command PreToolUse guard (wrapper-depth stripping).
8. Per-skill `allowed-tools` permissions.
