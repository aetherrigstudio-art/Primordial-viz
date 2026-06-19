# Full-repository Claude-peer comparison Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Widen the Claude-repo comparison to 8 full-repository peers (mixed
product + config repos), merged into one comprehensive `REPORT.md`.

**Architecture:** A discovery step locks the slate; 8 parallel research agents
profile one repo each from primary sources across 4 fixed dimensions; the results
are synthesized and merged into the existing report with a new `Kind` column and a
rewritten adopt-vs-ahead synthesis.

**Tech Stack:** WebSearch / WebFetch (discovery + primary-source reads), the Agent
tool (parallel `general-purpose` research agents), Bash/git, SendUserFile.

## Global Constraints

- Spec of record: `docs/superpowers/specs/2026-06-19-full-repo-comparison-design.md`.
- **No app code changes** — research/docs only.
- **Primary sources only** — read each repo's own `CLAUDE.md` / `.claude/` tree /
  `settings.json` / `.mcp.json` / agent files; never rely on blog summaries.
- Fixed **4 dimensions** per repo: (1) Config & rules, (2) Skills/agents/MCP,
  (3) Hooks & automation, (4) Process & methodology — plus license, stars, link,
  standout ideas, **Kind** (`baseline`/`skills-lib`/`config`/`product`).
- **8 new peers** (~4 product + ~4 config; backfill config if product side is
  thin, and label the mix).
- Deliverable: **merge** into `research/claude-repo-comparison/REPORT.md`
  (one report, 13 rows: baseline + 4 skills-lib + 8 new).
- Branch `claude/onboarding-hxwhw6`; commit per task; mobile-ergonomics for the
  final hand-off (`SendUserFile`, concise summary).
- `npm run health` must be no worse than baseline (pre-existing `render.png`
  drift is the only allowed failure).

---

### Task 1: Discovery — lock the final 8-repo slate

**Files:**
- None (research; record the locked slate in the commit message of Task 4).

**Interfaces:**
- Produces: the confirmed list of 8 `org/repo` strings (4 config + 4 product),
  each with a default branch, consumed by Task 2.

- [ ] **Step 1: Confirm the 4 config repos resolve**

WebFetch each GitHub page; confirm non-trivial `.claude/` tooling:
`carlrannaberg/claudekit`, `wshobson/agents`, `yzhao062/anywhere-agents`,
`disler/claude-code-hooks-mastery`.

- [ ] **Step 2: Lock product slots 7–8**

WebFetch `https://github.com/josix/awesome-claude-md` and pick 2 real
product/project repos (not collections) with a substantive `CLAUDE.md`. Confirm
`anthropics/claude-code` and `krzemienski/shannon-mcp` for slots 5–6.

- [ ] **Step 3: Apply the selection bar + backfill rule**

Drop any candidate that is a toy / one-line mention / abandoned. If fewer than 4
real product repos clear the bar, backfill with another config repo and note the
mix. Final list must be exactly 8.

- [ ] **Step 4: Verify**

Confirm: exactly 8 `org/repo` entries, each with a known default branch, each
tagged `product` or `config`. Expected: a written 8-line slate.

---

### Task 2: Profile all 8 peers (parallel research agents)

**Files:**
- None yet (each agent returns a markdown profile to the orchestrator).

**Interfaces:**
- Consumes: the 8-repo slate from Task 1.
- Produces: 8 structured profiles, each covering the 4 dimensions + license +
  stars + link + standout ideas + Kind, with unverifiable items flagged.

- [ ] **Step 1: Dispatch 8 `general-purpose` agents in one message**

Each prompt: target `org/repo`; read PRIMARY sources via WebFetch
(`https://github.com/<org>/<repo>`, the `.claude/` tree,
`https://raw.githubusercontent.com/<org>/<repo>/<branch>/CLAUDE.md`,
`settings.json`, `.mcp.json`, representative agent/SKILL files; adjust branch on
404 by reading the tree). Return a ~300–450-word profile across the 4 dimensions
+ license/stars/link/standout/Kind; flag anything unverifiable; no padding.

- [ ] **Step 2: Verify each profile is usable**

Expected: 8 returned profiles, each with all 4 dimensions answered (or an explicit
"could not verify"), a license, and a link. Re-dispatch any agent that returned a
thin/blocked profile (e.g., wrong branch → point it at the tree).

---

### Task 3: Build the verified baseline self-profile row

**Files:**
- None (read the working tree; values feed Task 4's baseline row).

**Interfaces:**
- Produces: current counts for this repo's baseline row.

- [ ] **Step 1: Re-confirm baseline numbers**

Run:
```bash
cd /home/user/Primordial-viz
echo "skills: $(ls .claude/skills | wc -l)"; echo "rules:"; ls .claude/rules
echo "agents:"; ls .claude/agents; echo "hooks:"; ls .claude/hooks
echo "CLAUDE.md lines: $(wc -l < CLAUDE.md)"
grep -oE '"(mdn|context7|primordial)":' .mcp.json | sort -u
```
Expected: 32 skills, 4 rules, 2 agents, 7 hooks, 200-line CLAUDE.md, 3 MCP.
(Use whatever the command actually prints — these are the verified values.)

---

### Task 4: Merge everything into REPORT.md

**Files:**
- Modify: `research/claude-repo-comparison/REPORT.md`

**Interfaces:**
- Consumes: 8 profiles (Task 2) + baseline row (Task 3) + the existing 4
  skills-lib profiles already in the file.

- [ ] **Step 1: Add the `Kind` column + retitle**

Retitle the report to cover both runs. Tag existing rows: this repo = `baseline`;
the 4 prior peers = `skills-lib`. Add `Kind` to the master table header.

- [ ] **Step 2: Add the 8 new rows to the master table**

One row per new peer across the 4 dimensions, with its `Kind` (`product`/`config`).
Table must total **13 rows** (1 baseline + 4 skills-lib + 8 new).

- [ ] **Step 3: Add the 8 per-repo paragraphs, grouped by kind**

Keep the 4 existing paragraphs; add 8 new ones under "Config repos" and
"Product/tool repos" subheadings. Each: one-line what-it-is, standout ideas,
link, license, stars.

- [ ] **Step 4: Rewrite the synthesis**

Update "where we're ahead" / "what to adopt" against the wider, truer-peer set.
Call out which adopt-ideas now look stronger because real product/config peers
(not just skill libs) corroborate them. Note the final product/config mix.

- [ ] **Step 5: Verify the merge**

Run:
```bash
cd /home/user/Primordial-viz
grep -c '^| ' research/claude-repo-comparison/REPORT.md   # table rows incl. header/sep
grep -c 'github.com' research/claude-repo-comparison/REPORT.md  # every peer linked
```
Expected: master table has 13 data rows (+ header + separator); each new peer has
a `github.com` link. Eyeball that no `Kind` cell is blank.

---

### Task 5: Park follow-up, log, verify health

**Files:**
- Modify: `progress.md` (Open threads + session entry)

**Interfaces:**
- Consumes: the finished `REPORT.md`.

- [ ] **Step 1: Park the whole-workflow-systems follow-up**

Add an Open-threads line in `progress.md` for a "whole-workflow systems"
comparison (ccpm, Continuous-Claude, etc.), referencing this spec.

- [ ] **Step 2: Add a session entry to `progress.md`**

Summarize: 8 full-repo peers compared + merged into REPORT.md; key adopt/ahead
findings; what's parked.

- [ ] **Step 3: Verify health**

Run: `npm run health 2>&1 | grep -E 'PASS|FAIL|Health:'`
Expected: only the pre-existing `test/artifacts/render.png` drift may fail;
nothing else.

---

### Task 6: Commit, push, deliver

**Files:**
- None new (commits Task 4 + Task 5 changes).

- [ ] **Step 1: Commit + push**

```bash
cd /home/user/Primordial-viz
git add research/claude-repo-comparison/REPORT.md progress.md
git commit -m "docs(research): widen Claude-repo comparison to 8 full-repo peers"
git push origin claude/onboarding-hxwhw6
```

- [ ] **Step 2: Deliver to the operator**

`SendUserFile` `research/claude-repo-comparison/REPORT.md`; chat summary leads
with the answer, jargon-light, no full-report dump (output-token cap).

- [ ] **Step 3: Verify delivery**

Expected: push succeeded (clean tree), file delivered, summary sent.

## Self-Review

- **Spec coverage:** mixed peers + Kind column (Tasks 1,4) ✓; 8 deep peers
  (Tasks 1–2) ✓; merge into REPORT.md (Task 4) ✓; parked follow-up + log
  (Task 5) ✓; commit/push/SendUserFile (Task 6) ✓; health gate (Task 5) ✓.
- **Placeholder scan:** slots 7–8 are intentionally discovery-locked in Task 1,
  not a placeholder; backfill rule stated. No TBDs elsewhere.
- **Consistency:** the 4 dimensions, `Kind` tag values, and the 13-row total are
  used identically across Tasks 2, 3, 4, 5.
