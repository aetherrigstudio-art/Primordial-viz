# Adopt-Ideas Roadmap — Phase 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Record the full adopt-ideas roadmap in the two ROADMAP files and ship the 5 cheap Phase-1 tooling wins.

**Architecture:** Pure repo-tooling/docs work — extend `tools/gen-docs.mjs` (AGENTS.md mirror), add `tools/check-config.mjs` (config gate) wired into `tools/health.mjs`, add two hook/script behaviours (`precompact-handoff.sh`, lessons in `orient.sh`), and a new `.claude/rules/gotchas.md`. No app/runtime code changes.

**Tech Stack:** Node ESM scripts (`tools/*.mjs`), bash hooks (`.claude/hooks/*.sh`), JSON (`.claude/settings.json`), markdown docs.

## Global Constraints

- Git-only, zero-infra, phone-friendly — no new services/daemons.
- `CLAUDE.md` must stay **≤ 200 lines** (it is exactly 200 now).
- Commercial-safe; no AGPL/LGPL/preset code copied.
- `npm run health` stays green except the known pre-existing `test/artifacts/render.png` drift; `gen-docs --check` stays green.
- Branch `claude/onboarding-hxwhw6`; commit per task. Commit trailers (exact):
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P`
- A PostToolUse `gen-docs` hook may regenerate `ENCYCLOPEDIA.md`/`TREE.md`; if so, stage them in the same commit so `git status` ends clean.

---

### Task 1: Record the full roadmap in the two ROADMAP files

**Files:**
- Modify: `.claude/ROADMAP.md` (Track 1 — Claude tooling)
- Modify: `ROADMAP.md` (repo root — Track 2 — product/visual)

**Interfaces:**
- Produces: durable roadmap entries the rest of Phase 1 (and future phases) reference. No code symbols.

- [ ] **Step 1: Append the Track-1 roadmap section to `.claude/ROADMAP.md`**

Add this block at the end of `.claude/ROADMAP.md`:

```markdown
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
```

- [ ] **Step 2: Append the Track-2 roadmap section to repo-root `ROADMAP.md`**

Add this block at the end of `ROADMAP.md`:

```markdown
## Audio/visual techniques to adopt (from product-domain research, 2026-06-19)

Source: `research/product-domain-comparison/REPORT.md` (technique-only; no AGPL/
LGPL/preset code copied).

- **Perceptual audio bands (bark/mel)** — improves the existing `src/audio` analyser; NOT gated, can be planned after Phase-1 tooling.
- **Preset cross-fade** — smooth look-to-look transitions. GATED on the real `/Test/` visual.
- **Look playlist** — sequence looks over time. GATED on the real `/Test/` visual.
- **Waveform aligner** — beat-aligned waveform draw. GATED on the real `/Test/` visual.
```

- [ ] **Step 3: Verify both files updated**

Run: `grep -c "Adopt-ideas roadmap" .claude/ROADMAP.md ; grep -c "techniques to adopt" ROADMAP.md`
Expected: `1` then `1`.

- [ ] **Step 4: Commit**

```bash
git add .claude/ROADMAP.md ROADMAP.md
git commit -m "docs(roadmap): record adopt-ideas roadmap (tracks 1 & 2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 2: AGENTS.md cross-tool mirror (gen-docs)

**Files:**
- Modify: `tools/gen-docs.mjs` (add `buildAgentsMd`, add to `OUTPUTS` + `docs`)
- Create: `AGENTS.md` (generated output)

**Interfaces:**
- Consumes: `CLAUDE.md` (read at gen time).
- Produces: `AGENTS.md` generated doc, covered by `gen-docs --check`. Function `buildAgentsMd(): string`.

- [ ] **Step 1: Add `buildAgentsMd()` to `tools/gen-docs.mjs`**

Insert this function just above the `const OUTPUTS = [...]` line (near line 426):

```javascript
// AGENTS.md: a tool-agnostic mirror of CLAUDE.md so non-Claude harnesses
// (Codex/Cursor/etc.) get the same knowledge. Generated — do not hand-edit.
// Claude-only `@import` lines are converted to plain "See <file>" references.
function buildAgentsMd() {
  const claude = readFileSync(join(root, 'CLAUDE.md'), 'utf8');
  const body = claude.replace(/^@(\S+)\s*$/gm, 'See `$1`.');
  return `<!-- @generated from CLAUDE.md by tools/gen-docs.mjs — do not edit. -->\n\n${body}`;
}
```

- [ ] **Step 2: Register AGENTS.md as a generated output**

Change (near line 426):

```javascript
const OUTPUTS = ['ENCYCLOPEDIA.md', 'TREE.md'];
```
to:
```javascript
const OUTPUTS = ['ENCYCLOPEDIA.md', 'TREE.md', 'AGENTS.md'];
```

And change the `docs` array (near line 428) to add the AGENTS.md entry:

```javascript
const docs = [
  ['ENCYCLOPEDIA.md', buildEncyclopedia(files)],
  ['TREE.md', buildTree(files)],
  ['AGENTS.md', buildAgentsMd()],
];
```

- [ ] **Step 3: Generate and verify the mirror exists and is clean**

Run: `node tools/gen-docs.mjs && head -1 AGENTS.md && grep -c '^@' AGENTS.md`
Expected: prints the `Wrote AGENTS.md (...)` line; first line is the `@generated` comment; the `grep -c '^@'` count is `0` (no raw `@import` lines leaked).

- [ ] **Step 4: Verify the check gate passes at rest**

Run: `node tools/gen-docs.mjs --check ; echo "exit=$?"`
Expected: `AGENTS.md is up to date.` among the output and `exit=0`.

- [ ] **Step 5: Verify the gate CATCHES staleness**

Run:
```bash
printf '\n<!-- drift test -->\n' >> CLAUDE.md
node tools/gen-docs.mjs --check ; echo "exit=$?"
git checkout CLAUDE.md
```
Expected: `AGENTS.md is stale...` and `exit=1`. (Then CLAUDE.md is restored.)

- [ ] **Step 6: Commit**

```bash
git add tools/gen-docs.mjs AGENTS.md ENCYCLOPEDIA.md TREE.md
git commit -m "feat(tooling): generate AGENTS.md mirror of CLAUDE.md

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 3: Self-auditing config gate

**Files:**
- Create: `tools/check-config.mjs`
- Modify: `tools/health.mjs:12-21` (add a check to the `checks` array)

**Interfaces:**
- Produces: `tools/check-config.mjs` — exits 0 if all asserts pass, prints a reason + exits 1 on first failure. Consumed by `health.mjs` via `run('node', ['tools/check-config.mjs'])`.

- [ ] **Step 1: Create `tools/check-config.mjs`**

```javascript
#!/usr/bin/env node
// Self-auditing config gate: assert the always-on config invariants that have
// silently drifted before (CLAUDE.md size, the generated router markers, settings JSON).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => { console.error(`config gate: ${msg}`); process.exit(1); };

// 1. CLAUDE.md line cap (always-loaded file must stay lean).
const CAP = 200;
const lines = readFileSync(join(root, 'CLAUDE.md'), 'utf8').split('\n');
const n = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
if (n > CAP) fail(`CLAUDE.md is ${n} lines (cap ${CAP}). Trim it or move prose to a .claude/rules/* file.`);

// 2. The generated skills:router region markers must exist.
const router = readFileSync(join(root, '.claude/skills-router.md'), 'utf8');
if (!router.includes('@generated-start skills:router') || !router.includes('@generated-end skills:router'))
  fail('.claude/skills-router.md is missing the @generated skills:router markers.');

// 3. settings.json must be valid JSON.
try { JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8')); }
catch (e) { fail(`.claude/settings.json is not valid JSON: ${e.message}`); }

console.log(`config gate OK (CLAUDE.md ${n}/${CAP} lines; router markers present; settings.json valid).`);
```

- [ ] **Step 2: Confirm the marker strings match the real file**

Run: `grep -o "@generated-[a-z]* skills:router" .claude/skills-router.md`
Expected: prints `@generated-start skills:router` and `@generated-end skills:router`. (If the real markers differ, update the two `router.includes(...)` strings in Step 1 to match exactly before continuing.)

- [ ] **Step 3: Run the gate — expect PASS now**

Run: `node tools/check-config.mjs ; echo "exit=$?"`
Expected: `config gate OK (...)` and `exit=0`.

- [ ] **Step 4: Verify it CATCHES an over-cap CLAUDE.md**

Run:
```bash
cp CLAUDE.md /tmp/CLAUDE.bak
yes "" | head -5 >> CLAUDE.md
node tools/check-config.mjs ; echo "exit=$?"
cp /tmp/CLAUDE.bak CLAUDE.md
```
Expected: `config gate: CLAUDE.md is 205 lines (cap 200)...` and `exit=1`. (Then CLAUDE.md is restored.)

- [ ] **Step 5: Wire into health.mjs**

In `tools/health.mjs`, add this entry to the `checks` array (after the `Docs + drift gate` line ~20):

```javascript
  ['Config gate (CLAUDE.md cap / router / settings)', () => run('node', ['tools/check-config.mjs'])],
```

- [ ] **Step 6: Run health — config gate PASS, only render.png drift FAIL**

Run: `npm run health 2>&1 | grep -E 'PASS|FAIL'`
Expected: `PASS  Config gate (...)`; the only FAIL is `Docs + drift gate` (the pre-existing render.png).

- [ ] **Step 7: Commit**

```bash
git add tools/check-config.mjs tools/health.mjs
git commit -m "feat(tooling): self-auditing config gate (CLAUDE.md cap / router / settings)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 4: PreCompact handoff hook

**Files:**
- Create: `.claude/hooks/precompact-handoff.sh`
- Modify: `.claude/settings.json` (add a `PreCompact` hook entry)

**Interfaces:**
- Produces: a PreCompact hook printing JSON with `hookSpecificOutput.additionalContext` (non-blocking reminder).

- [ ] **Step 1: Create `.claude/hooks/precompact-handoff.sh`**

```bash
#!/usr/bin/env bash
# PreCompact hook: before the session compacts, remind to capture continuity in
# progress.md so mid-session state isn't lost. Non-blocking; never errors the session.
set -u
msg="PreCompact: before context is compacted, update progress.md — append/refresh the newest session entry (what changed, decisions+why, the exact next step) so a fresh agent can resume. Durable state = git only."
if command -v jq >/dev/null 2>&1; then
  jq -nc --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PreCompact",additionalContext:$m}}'
else
  printf '{"hookSpecificOutput":{"hookEventName":"PreCompact","additionalContext":"%s"}}\n' "$msg"
fi
exit 0
```

- [ ] **Step 2: Make it executable and unit-run it**

Run: `chmod +x .claude/hooks/precompact-handoff.sh && .claude/hooks/precompact-handoff.sh | node -e 'JSON.parse(require("fs").readFileSync(0));console.log("valid JSON")'`
Expected: `valid JSON`.

- [ ] **Step 3: Register the hook in `.claude/settings.json`**

Inside the `"hooks"` object, add a `PreCompact` array sibling to the existing event keys (e.g. after the `PostToolUse` array). Match the existing entries' shape:

```json
    "PreCompact": [
      {
        "hooks": [
          { "type": "command", "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/precompact-handoff.sh" }
        ]
      }
    ]
```

(Use the same `command` style the other hooks in this file use — if they use a bare relative path or a different variable, match that exactly. Verify by reading an existing entry first.)

- [ ] **Step 4: Verify settings.json still valid**

Run: `node -e 'JSON.parse(require("fs").readFileSync(".claude/settings.json"));console.log("ok")'`
Expected: `ok`.

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/precompact-handoff.sh .claude/settings.json
git commit -m "feat(hooks): PreCompact handoff reminder

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 5: Surface recent lessons in orient

**Files:**
- Modify: `.claude/hooks/orient.sh` (add a lessons block before the final `exit 0`)

**Interfaces:**
- Consumes: `progress.md` (reads `pcontent` if present, else the file). Reuses the existing `$pcontent` variable already populated earlier in `orient.sh`.

- [ ] **Step 1: Add a lessons block near the end of `.claude/hooks/orient.sh`**

Immediately before the final `case "${CLAUDE_CODE_ENTRYPOINT:-}"` device block (or before `exit 0` if that's last), add:

```bash
# Surface the most recent LESSON entries so past corrections resurface on launch.
if [ -n "${pcontent:-}" ]; then
  lessons="$(printf '%s\n' "$pcontent" | grep -iE '^## .*LESSON' | head -2)"
  if [ -n "$lessons" ]; then
    echo "Recent lessons (don't repeat these — see progress.md for the fix):"
    printf '%s\n' "$lessons" | sed 's/^## /  - /'
  fi
fi
```

- [ ] **Step 2: Syntax-check the script**

Run: `bash -n .claude/hooks/orient.sh ; echo "exit=$?"`
Expected: `exit=0`.

- [ ] **Step 3: Run orient and confirm lessons surface**

Run: `bash .claude/hooks/orient.sh 2>/dev/null | grep -A2 'Recent lessons'`
Expected: prints the "Recent lessons" header + at least the existing `LESSON + FIX: continuity is branch-scoped` entry from `progress.md`.

- [ ] **Step 4: Commit**

```bash
git add .claude/hooks/orient.sh
git commit -m "feat(orient): surface recent LESSON entries on session start

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 6: Anti-footgun gotchas rule

**Files:**
- Create: `.claude/rules/gotchas.md`
- Modify: `CLAUDE.md` (append a reference to an EXISTING line — zero net new lines, to stay ≤200)

**Interfaces:**
- Produces: `.claude/rules/gotchas.md`, referenced from `CLAUDE.md` so the drift gate validates the path.

- [ ] **Step 1: Create `.claude/rules/gotchas.md`**

```markdown
# Gotchas / Time-wasters — read before re-debugging these

Distilled tribal knowledge so the same loops don't recur (anti-footgun manual,
trailofbits pattern). Add to this when a non-obvious failure costs real time.

- **`npm run health` shows a `test/artifacts/render.png` drift FAIL in a fresh
  container — this is EXPECTED.** That PNG is generated by `node test/render-check.mjs`
  (needs Playwright Chromium) and is gitignored, so it's absent at rest. Not a regression.
- **Looks must be fetched relative to the module, not the page.** `src/looks/registry.js`
  resolves JSON via `import.meta.url` (with an inline `INLINE_LOOKS` `file://` fallback);
  fetching `/looks/*.json` 404s. Don't "fix" it back to a page-relative path.
- **The render screenshot must freeze the loop first.** On CI software-GL the rAF loop
  starves the CPU; `test/render-check.mjs` pauses via `window.__primordial.pause` before
  capturing. Don't remove the freeze.
- **The cloud container is HTTPS-443 only.** FTP/21 and cPanel/2083 are blocked — you
  cannot deploy or drive cPanel from here. Push → GitHub Actions FTPS deploys; verify by
  `curl`-ing `https://primordial.video/Test/`.
- **Only git-committed files survive a session.** Auto-memory and `~/.claude/plans` do
  not persist. Commit durable state (`progress.md`/`task_plan.md`) before the session ends.
```

- [ ] **Step 2: Reference it from `CLAUDE.md` WITHOUT adding a line**

Read the existing "Session continuity" / router area of `CLAUDE.md`, then append
`` See `.claude/rules/gotchas.md` for known foot-guns. `` to the END of an existing
sentence/line there (do NOT add a new line — `CLAUDE.md` is at the 200 cap and the
Task-3 gate will fail if it grows). Example: append to the existing ONBOARDING line.

- [ ] **Step 3: Verify CLAUDE.md is still ≤200 lines and references the file**

Run: `wc -l < CLAUDE.md ; grep -c 'gotchas.md' CLAUDE.md`
Expected: a number `≤ 200`, then `1`.

- [ ] **Step 4: Run the drift gate + config gate**

Run: `node tools/gen-docs.mjs --check 2>&1 | grep -E 'gotchas|exist' ; node tools/check-config.mjs`
Expected: the drift gate reports referenced paths all exist (gotchas.md resolves); `config gate OK`.

- [ ] **Step 5: Regenerate docs (AGENTS.md mirrors the CLAUDE.md edit) and commit**

```bash
node tools/gen-docs.mjs
git add .claude/rules/gotchas.md CLAUDE.md AGENTS.md ENCYCLOPEDIA.md TREE.md
git commit -m "docs(rules): add anti-footgun gotchas rule + router reference

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 7: Final verification, log, push

**Files:**
- Modify: `progress.md` (session entry)

- [ ] **Step 1: Full health green (render.png excepted)**

Run: `npm run health 2>&1 | grep -E 'PASS|FAIL|Health:'`
Expected: all PASS except the single pre-existing `Docs + drift gate` render.png FAIL.

- [ ] **Step 2: Add a `progress.md` session entry**

Add a new `## Session — 2026-06-19 (adopt-ideas Phase 1)` entry just under the
Open-threads block summarizing: AGENTS.md mirror, config gate, PreCompact hook,
lessons-in-orient, gotchas rule; roadmap recorded in both ROADMAP files; Phase 2 +
gated product items remain backlog.

- [ ] **Step 3: Commit + push**

```bash
git add progress.md
git commit -m "docs(progress): log adopt-ideas Phase 1

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
git push origin claude/onboarding-hxwhw6
```

## Self-Review

- **Spec coverage:** roadmap recorded (Task 1) ✓; AGENTS.md mirror #1 (Task 2) ✓;
  config gate #2 (Task 3) ✓; PreCompact hook #3 (Task 4) ✓; lessons in orient #4
  (Task 5) ✓; gotchas rule #5 (Task 6) ✓; verify/log/push (Task 7) ✓. Phase 2 +
  product items intentionally roadmap-stub only (Task 1) ✓.
- **Placeholder scan:** the two "match the existing file's exact shape" notes
  (Task 3 Step 2, Task 4 Step 3) are guarded by a concrete verify command, not
  open-ended TODOs. No "handle edge cases"/TBD left.
- **200-cap consistency:** Task 6 explicitly adds zero lines to `CLAUDE.md` and the
  Task-3 gate (built first) enforces it; ordering is correct (gate before the
  CLAUDE.md edit).
- **Consistency:** `buildAgentsMd`, `check-config.mjs`, `precompact-handoff.sh`,
  and the `pcontent` reuse in `orient.sh` are named identically wherever referenced.
