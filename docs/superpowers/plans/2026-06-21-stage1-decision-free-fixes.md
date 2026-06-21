# Stage 1 — Decision-Free Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the decision-free Stage-1 stabilization fixes (PII, dead deploy trigger, vestigial config, a latent bug, doc/gate hygiene) — no ADR-005 ratification or disputed-claim verification required.

**Architecture:** Small, independent, verifiable edits to config + tooling. No app-behavior change to the renderer/audio. Each task ends green against the repo's existing gates (`gen-docs --check`, `rag --check`, `smoke`, `node --check`, MCP selftest).

**Tech Stack:** Node ESM tooling, GitHub Actions YAML, Apache `.htaccess`, the repo's `tools/` scripts. No new dependencies (web path stays zero-runtime-dep).

## Global Constraints
- **Web path stays zero-runtime-dep**; `package.json` is devDeps-only. (CLAUDE.md)
- **No build tooling introduced** in Stage 1 — Astro/Vite comes only at Stage 2 (ADR-012, research-validated).
- **Keep `new URL(asset, import.meta.url)` literals static**; no CDN import maps (bridge gotchas for the later Astro migration).
- **Rebuild the RAG index only AFTER staging changed/added `.md`** (`gotchas.md`): stage → `npm run rag:index` → stage `index.json` → commit.
- **Audit, don't refactor beyond scope.** These are the decision-free items only.
- Commit-message trailers per repo convention; develop on branch `claude/audit-brief-execution-xur28z`.

---

### Task 1: Redact operator email PII

**Files:**
- Modify: `research/claude-repo-comparison/BRIEF.md:4`
- Regenerate: `tools/rag/index.json` (re-embeds the redacted text)

**Interfaces:**
- Produces: a repo with no committed `events.bricem@gmail.com` string.

- [ ] **Step 1: Verify the PII is present (baseline)**

Run: `grep -rn "events.bricem@gmail.com" research/ tools/rag/index.json`
Expected: 2 hits — `research/claude-repo-comparison/BRIEF.md:4`, `tools/rag/index.json:1474`.

- [ ] **Step 2: Redact the email in the source doc**

In `research/claude-repo-comparison/BRIEF.md` line 4, replace the parenthetical email with a role label:
`**Owner:** operator, drives from a phone.`  →  `**Owner:** operator (events.bricem@gmail.com), drives from a phone.` becomes `**Owner:** operator (contact redacted).`
(Remove the live email; the "drives from a phone" note is still accurate (operator is still on a phone) — leave it.)

- [ ] **Step 3: Rebuild the RAG index so the chunk text loses the email**

Run: `git add research/claude-repo-comparison/BRIEF.md && npm run rag:index && git add tools/rag/index.json`
Expected: `rag index: wrote N chunks`.

- [ ] **Step 4: Verify no email remains**

Run: `grep -rn "events.bricem@gmail.com" . ':!.git'`
Expected: no output (exit 1).

- [ ] **Step 5: Verify gates green**

Run: `node tools/rag/build-index.mjs --check && node tools/gen-docs.mjs --check && npm run smoke`
Expected: `rag index: up to date`, drift gate passes, `15 passed, 0 failed`.

- [ ] **Step 6: Commit**

```bash
git commit -m "fix(privacy): redact operator email PII from BRIEF + RAG index"
```

---

### Task 2: Fix the dead auto-deploy trigger

**Files:**
- Modify: `.github/workflows/deploy.yml:14-16`

**Interfaces:**
- Produces: a deploy workflow whose push trigger references a branch that exists (or push-trigger removed).

- [ ] **Step 1: Confirm the trigger is dead (baseline)**

Run: `sed -n '14,16p' .github/workflows/deploy.yml && git branch -a | grep review-claude-md-di5jvm || echo "BRANCH ABSENT"`
Expected: `branches: [claude/review-claude-md-di5jvm]` and `BRANCH ABSENT`.

- [ ] **Step 2: Repoint the trigger to `main`**

In `.github/workflows/deploy.yml`, change:
```yaml
  push:
    branches: [claude/review-claude-md-di5jvm]
```
to:
```yaml
  push:
    branches: [main]
```
(Keep `workflow_dispatch:`.) Rationale: deploy on merges to `main`; manual dispatch still available. NOTE: this only goes live once this branch merges to `main`.

- [ ] **Step 3: Validate the YAML**

Run: `node -e "const y=require('fs').readFileSync('.github/workflows/deploy.yml','utf8'); if(!/branches:\s*\[main\]/.test(y)) throw new Error('not repointed'); console.log('ok')"`
Expected: `ok`.

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml
git commit -m "fix(ci): repoint dead deploy trigger to main"
```

---

### Task 3: Remove vestigial `.htaccess` shader MIME/cache rules

**Files:**
- Modify: `deploy/.htaccess` (remove the `.glsl/.frag/.vert` `AddType` lines ~27-29 and matching cache block ~55-57)

- [ ] **Step 1: Locate the vestigial lines (baseline)**

Run: `grep -nE '\.glsl|\.frag|\.vert' deploy/.htaccess`
Expected: the `AddType text/plain .glsl/.frag/.vert` lines (+ any cache block).

- [ ] **Step 2: Delete those lines**

Remove every `.glsl`/`.frag`/`.vert` `AddType` line and any `ExpiresByType`/cache line referencing them. Shaders ship as `.js` ES modules — no shader files are served.

- [ ] **Step 3: Verify they're gone and `.htaccess` is otherwise intact**

Run: `grep -nE '\.glsl|\.frag|\.vert' deploy/.htaccess || echo "CLEAN"; grep -c 'Options -Indexes' deploy/.htaccess`
Expected: `CLEAN` and `1` (directory-listing hardening still present).

- [ ] **Step 4: Commit**

```bash
git add deploy/.htaccess
git commit -m "chore(deploy): drop vestigial .glsl/.frag/.vert htaccess rules"
```

---

### Task 4: Harden the `$`-in-replace footgun (with regression test)

**Files:**
- Modify: `tools/gen-docs.mjs:377`, `tools/mcp/lib/looks.mjs:80-83`
- Test: `test/replace-region.test.mjs` (new)

**Interfaces:**
- Produces: `replaceRegion(text, name, body)` exported from `tools/mcp/lib/looks.mjs` (signature unchanged: `(string, string, string) => string`), using the callback form of `String.replace` so `$` sequences in `body` are emitted literally.

- [ ] **Step 1: Write the failing test**

Create `test/replace-region.test.mjs`:
```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { replaceRegion } from '../tools/mcp/lib/looks.mjs';

test('body containing $ sequences is emitted literally', () => {
  const text = '// @generated-start x\nOLD\n// @generated-end x';
  const body = 'cost $5 and $& and $1 literal';
  const out = replaceRegion(text, 'x', body);
  assert.ok(out.includes('cost $5 and $& and $1 literal'), 'dollar sequences must be literal');
});
```

- [ ] **Step 2: Run it — expect failure (not yet exported / current `$1$2` form mangles `$`)**

Run: `node --test test/replace-region.test.mjs`
Expected: FAIL (import error, or the assertion fails because `$&`/`$1` in `body` get interpreted).

- [ ] **Step 3: Switch both call sites to the callback form and export the helper**

In `tools/mcp/lib/looks.mjs`, export and rewrite:
```js
export function replaceRegion(text, name, body) {
  const re = new RegExp(`(// @generated-start ${name}[^\\n]*\\n)[\\s\\S]*?(// @generated-end ${name})`);
  if (!re.test(text)) throw new Error(`@generated marker '${name}' not found in registry.js`);
  return text.replace(re, (_m, g1, g2) => `${g1}${body}\n${g2}`);
}
```
In `tools/gen-docs.mjs:377`, change `return text.replace(re, \`$1${body}\n$2\`);` to:
```js
return text.replace(re, (_m, g1, g2) => `${g1}${body}\n${g2}`);
```

- [ ] **Step 4: Run the test — expect pass**

Run: `node --test test/replace-region.test.mjs`
Expected: PASS.

- [ ] **Step 5: Verify regen output is unchanged (no behavior drift)**

Run: `node tools/gen-docs.mjs --check && node tools/mcp/selftest.mjs && npm run smoke`
Expected: drift gate passes, `selftest OK`, `15 passed`.

- [ ] **Step 6: Wire the new test into CI**

In `.github/workflows/verify.yml`, add after the smoke step:
```yaml
      - name: replace-region regression
        run: node --test test/replace-region.test.mjs
```

- [ ] **Step 7: Commit**

```bash
git add tools/gen-docs.mjs tools/mcp/lib/looks.mjs test/replace-region.test.mjs .github/workflows/verify.yml
git commit -m "fix(tooling): harden \$-in-replace via callback form + regression test"
```

---

### Task 5: Fix the `shaders.md` render-scale doc divergence

**Files:**
- Modify: `.claude/rules/shaders.md` (the render-scale line) — reconcile with `src/params/schema.js:29`

- [ ] **Step 1: Confirm the divergence (baseline)**

Run: `grep -n 'render-scale\|0.5' .claude/rules/shaders.md | head; sed -n '29p' src/params/schema.js`
Expected: doc says "0.5–0.75"; schema allows `min 0.5, max 1.0, default 0.7`.

- [ ] **Step 2: Update the doc to match the shipped range**

Edit `.claude/rules/shaders.md` so the budget reads: heavy SDF pass renders to a **0.5–0.75 default** FBO scale with headroom to 1.0 on capable devices; **dynamic resolution floors at 0.5** (matching `schema.js`).

- [ ] **Step 3: Verify the drift gate (the doc references must still resolve)**

Run: `node tools/gen-docs.mjs --check`
Expected: `Referenced repo paths all exist.`

- [ ] **Step 4: Commit**

```bash
git add .claude/rules/shaders.md
git commit -m "docs(shaders): reconcile render-scale range with schema (0.5–0.75 default, 0.5 floor)"
```

---

### Task 6: Bound the `orient.sh` git fetch + converge CI with local health

**Files:**
- Modify: `.claude/hooks/orient.sh:43-44` (guarantee a bound on the fetch)
- Modify: `.github/workflows/verify.yml` (add the `check-config` gate that local `health` runs)

- [ ] **Step 1: Confirm the gaps (baseline)**

Run: `sed -n '43,44p' .claude/hooks/orient.sh; grep -c 'check-config' .github/workflows/verify.yml`
Expected: fetch line where the non-`timeout` fallback is unbounded; `0` (config gate absent from CI).

- [ ] **Step 2: Bound the fetch fallback**

In `.claude/hooks/orient.sh`, ensure the no-`timeout` branch can't hang: replace the bare fallback `git fetch --quiet origin 2>/dev/null || true` with one that skips when `timeout` is unavailable:
```bash
if command -v timeout >/dev/null 2>&1; then timeout 15 git fetch --quiet origin 2>/dev/null || true; fi
```
(If `timeout` is absent, skip the network fetch rather than risk a hang — orient still works from local state.)

- [ ] **Step 3: Add the config gate to CI**

In `.github/workflows/verify.yml`, add after the docs-check step:
```yaml
      - name: Config gate
        run: node tools/check-config.mjs
```

- [ ] **Step 4: Verify locally**

Run: `bash -n .claude/hooks/orient.sh && node tools/check-config.mjs`
Expected: no syntax error; `config gate OK`.

- [ ] **Step 5: Commit**

```bash
git add .claude/hooks/orient.sh .github/workflows/verify.yml
git commit -m "chore(ci): bound orient fetch; add check-config gate to CI"
```

---

## Self-Review
- **Spec coverage:** implements the decision-free items from `phase-06` (PII, deploy trigger, .htaccess), `phase-07` (`$`-replace), `phase-04` (render-scale doc), `phase-03` (orient fetch, CI/health convergence). ADR-005-gated edits (license/privacy posture, Tauri license), disputed-verify items (eval-skills params, skills-lock hashes, missing-area router), and the phone-dev softening (ADR-006, multi-file) are **deliberately deferred** to follow-on plans.
- **Placeholder scan:** none — every step has the exact command/edit.
- **Type consistency:** `replaceRegion(text, name, body)` signature identical across both call sites and the test.

## Follow-on plans (not in this batch)
- **Plan B — ADR-005-gated:** redact-vs-history-scrub scope, repo visibility/license, `Cargo.toml` license, `tauri.conf.json` CSP (ADR-009). Blocked on operator ratifying ADR-005.
- **Plan C — phone-dev softening (ADR-006):** soften `mobile-ergonomics.md` in place (DONE) + reword absolute phone phrasings; KEEP the rules, hooks, and playback budget (operator still on a phone).
- **Plan D — disputed-verify:** check eval-skills API params vs `claude-api`, the skills-lock hash method, the missing-area router default — then fix only what's confirmed.
- **Plan E — tests/dead-weight (phase-09):** wire the 4 unrun tests, add audio/gl unit tests, decide `server/`+`android/`+`.agents/` fate (ADR-010/011).
- **Stage 2 — Astro re-platform** (ADR-012): its own spec→plan when Stage 1 is green.
