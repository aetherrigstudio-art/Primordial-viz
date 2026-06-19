# TASK BRIEF - Compare this repo against other Claude-based repos

**Status:** QUEUED for the next agent session. Set up 2026-06-19.
**Owner:** operator (events.bricem@gmail.com), drives from a phone.
**You (next agent):** this is your task. Read it fully, then execute. The
operator expects you to already know what to do from this file - they should not
have to re-explain.

## First, orient (you are a fresh agent)

Follow `ONBOARDING.md` (the start gate): confirm the branch + working tree, run
`npm run health` to confirm the repo is green, and skim `CLAUDE.md`. Then do this
task. This is a **research** task - no app code changes.

## Goal

Search GitHub for **3 to 5 other, similar Claude-based repositories** and compare
them against THIS repo. Deliver a comparison the operator and I can review
together.

- **Primary axis (do this now): Claude-agent tooling + methodology.** "Similar"
  means repos that are themselves heavily built WITH Claude Code / Claude agents -
  i.e. they have substantial `.claude/` tooling (a real `CLAUDE.md`, custom
  skills, hooks, subagents, MCP servers, rules, docs-automation), not just a
  passing mention of Claude. Compare how their agent setup + working method
  stacks up against ours.
- **Later goal (note, do NOT do yet unless told): product-domain axis.** A second
  comparison against repos in our PRODUCT domain (raw-WebGL2 / shader /
  audio-reactive visual web apps), regardless of Claude usage. Park this as a
  follow-up when the primary comparison is delivered (see "After you finish").

## What THIS repo is (the baseline to compare against)

Primordial-viz is, deliberately, a "best-practice Claude Code repo from day one"
(see `task_plan.md`). The PRODUCT is a raw-WebGL2 audio-reactive visual
instrument, but the thing to COMPARE on the primary axis is the **Claude-agent
scaffolding**. Read these to build an accurate self-profile before judging
others: `CLAUDE.md`, `TREE.md`, `ENCYCLOPEDIA.md`, the `.claude/` tree, and the
`progress.md` history. In short, this repo has:

- **Config & rules:** an always-loaded `CLAUDE.md` (knowledge router table,
  accuracy/communication rules), scoped rule files in `.claude/rules/`
  (shaders, audio, deploy, mobile-ergonomics), `@`-imports of `task_plan.md` +
  `progress.md` for continuity, and `ONBOARDING.md` (start gate + role routes).
- **Skills / agents / MCP:** ~5 custom skills + ~20 adopted from the ecosystem
  via `npx skills` (area-tagged, provenance in `skills-lock.json`), an
  auto-generated skills router (`.claude/skills-router.md`), custom subagents
  (`visual-qa`, `audio-dsp`), and a local MCP server (`tools/mcp/`).
- **Hooks & automation:** SessionStart `orient`, PreToolUse `inject-rules`,
  PostToolUse `check-syntax` / `check-data` / `gen-docs`, UserPromptSubmit
  `suggest-workflow` / `detect-correction`; a docs generator with a **drift gate**
  (`tools/gen-docs.mjs` - regenerates ENCYCLOPEDIA/TREE/router and fails CI if a
  doc references a path that does not exist); `npm run health` one-pass gate;
  CI in `.github/workflows/`.
- **Process & methodology:** a brainstorming -> writing-plans ->
  subagent-driven-development lifecycle (specs/plans under
  `docs/superpowers/`), session continuity via committed state files (cloud wipes
  everything but git), a **parking lot** (`progress.md` "Open threads" + `/park`),
  a learn-from-corrections loop (`/lesson` + `detect-correction`), and named
  workflow chains (`.claude/workflows.md`).

## Comparison dimensions (cover all four)

For each candidate repo, capture how it handles:

1. **Config & rules** - CLAUDE.md structure/size, rule files, knowledge routing,
   how always-on context is encoded.
2. **Skills / agents / MCP** - custom vs adopted skills, subagents, MCP servers;
   how they are organized/registered.
3. **Hooks & automation** - lifecycle hooks, docs generation + drift/consistency
   gates, tests/CI.
4. **Process & methodology** - planning/spec-driven workflow, session
   continuity/memory, parking/lessons, onboarding.

## How to find candidates (tools + method)

The container is **HTTPS-443 only**; web access works, FTP/cPanel do not. Note:
your **GitHub MCP tools are scoped to this repo** for reads/writes - you cannot
read arbitrary repos through them. So:

- **Discovery:** use `WebSearch` for current/trending repos, and try
  `mcp__github__search_repositories` / `search_code` (they may work for discovery
  even under the scope limit - if denied, fall back to web search). Also consult
  the `npx skills` ecosystem (skills.sh / vercel-labs) and any
  "awesome-claude-code" lists.
- **Reading a candidate's files:** use `WebFetch` on the repo's GitHub page and
  on `https://raw.githubusercontent.com/<org>/<repo>/<branch>/<path>` to read its
  `CLAUDE.md`, `.claude/` tree, README, etc. Prefer reading primary sources over
  summaries.
- **Search terms to try:** "CLAUDE.md", ".claude/skills", ".claude/hooks",
  "Claude Code agent skills", "Claude Code subagents", "claude code mcp server",
  "superpowers skills", "awesome claude code".
- **Starting candidates to verify + expand** (from prior knowledge - MAY BE STALE,
  confirm they exist and are substantive; search fresh for trending ones):
  `anthropics/skills`, `anthropics/claude-code`, `anthropics/claude-cookbooks`,
  `obra/superpowers`, `vercel-labs/skills`, `addyosmani/agent-skills`,
  `warpdotdev/common-skills`, plus any well-regarded "awesome-claude-code"
  collection. Do not just take this list - find current, real, active repos.

## Selection criteria for the 3 to 5

- Genuinely comparable: real, non-trivial Claude Code config (a substantive
  `CLAUDE.md` and/or `.claude/` tooling), not a toy or a one-line mention.
- Diverse: pick repos that take *different* approaches, so the comparison is
  informative.
- Reputable + active: prefer first-party (anthropics) or well-known maintainers;
  avoid abandoned forks.
- Public. Record each repo's license (relevant if we later adopt anything - this
  repo's adoption policy: read the source, prefer MIT/CC0/CC-BY/first-party;
  see `progress.md`).

## Deliverable

Write `research/claude-repo-comparison/REPORT.md` (commit it - only git-committed
files survive a wipe):

- A **comparison table**: rows = the repos (including THIS repo as the baseline
  row), columns = the four dimensions, cells = concise findings.
- A short **paragraph per repo** (what it is, standout ideas, link, license).
- A **synthesis**: "what we could adopt" (concrete ideas to bring back here) vs
  "where we are already ahead", relative to this repo.

Then **deliver to the operator** (they are on a phone): `SendUserFile` the
REPORT.md and give a concise, jargon-light summary in chat (lead with the answer;
do not dump the whole report into the message - the output-token cap is a real
failure mode). Follow `.claude/rules/mobile-ergonomics.md`.

## Definition of done

- 3 to 5 substantive, verified repos compared across all four dimensions.
- `REPORT.md` committed + pushed; delivered to the operator via `SendUserFile`
  with a tight chat summary.
- Adopt-vs-ahead synthesis included.
- The product-domain follow-up parked (see below).

## After you finish

Park the **later goal** so it is not lost: add an "Open threads" line in
`progress.md` (or use `/park`) for the product-domain comparison (raw-WebGL2 /
shader / audio-reactive visual web apps), referencing this brief. Then update
`progress.md` with a session entry recording what you found.
