# RAG Structural Down-weight + Regression Test Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 16-file hand-curated down-weight list with self-maintaining structural predicates, and lock the 6/6 probe result with a regression test — no change to retrieval behavior.

**Architecture:** Pure refactor of the `isDownweighted` predicate in `tools/rag/retrieve.mjs` (role-by-path: root-level `*.md` and `.claude/<file>.md` are aggregator/meta; topic docs live deeper and are structurally excluded). A shared `tools/rag/probes.mjs` holds the canonical probe set, reused by a new regression test (self-skips without the embedder) and the existing `ab-model.mjs`.

**Tech Stack:** Node ESM (`.mjs`), `node:test`. No new dependencies. No index rebuild (the index format is unchanged).

## Global Constraints

- **No behavior change** beyond making the predicate structural — the probe set must stay **6/6 canonical-#1**. Verify through the real pipeline before committing.
- Dev-tooling only; the web path (`index.html`/`src/`) is untouched; the `--check` drift gate stays model-free (it never loads `retrieve.mjs`).
- No new dependency. `DOWNWEIGHT` stays `0.08`; prefixes stay `docs/superpowers/`, `research/`.
- The regression test must **self-skip** when the embedder/model is unavailable (so it passes in a model-free environment).
- Commit messages end with the repo trailer (Co-Authored-By + Claude-Session); push to branch `claude/whats-next-brainstorming-tdzom3`.
- Expected-green: `npm run health` passes except the known `test/artifacts/render.png` drift (see `.claude/rules/gotchas.md`).

---

## File Structure

- **Modify** `tools/rag/retrieve.mjs` — swap `DOWNWEIGHT_FILES` (explicit Set) for structural predicates `isRootDoc` + `isClaudeMeta` + a one-entry `DOWNWEIGHT_EXACT`.
- **Create** `tools/rag/probes.mjs` — exports `PROBES` (the canonical query→expected-path set). Single source of truth.
- **Modify** `tools/rag/ab-model.mjs` — import `PROBES` from `probes.mjs` instead of its local copy.
- **Modify** `test/rag.test.mjs` — add a structural-boundary unit test + a probe-set regression test (self-skips without the model).

---

## Task 1: Structural down-weight predicate

**Files:**
- Modify: `tools/rag/retrieve.mjs:23-32` (the `DOWNWEIGHT*` constants + `isDownweighted`)
- Test: `test/rag.test.mjs` (append a boundary test)

**Interfaces:**
- Consumes: nothing new.
- Produces: `isDownweighted(path) -> boolean` with the same true-set as today but computed structurally. `rankBySim` (unchanged signature) keeps using it.

- [ ] **Step 1: Write the failing boundary test**

Append to `test/rag.test.mjs` (after the existing `rankBySim` tests):

```js
test('rankBySim: structural boundary — .claude/ top-level meta is down-weighted, deeper topic docs are not', () => {
  const sem = [
    { path: '.claude/ROADMAP.md', heading: '', snippet: '', sim: 0.50 },   // meta → penalized
    { path: '.claude/rules/shaders.md', heading: '', snippet: '', sim: 0.50 }, // topic → kept
  ];
  const ranked = rankBySim(sem, [], 5);
  assert.equal(ranked[0].path, '.claude/rules/shaders.md', 'deeper topic doc wins');
  assert.equal(ranked[1].path, '.claude/ROADMAP.md');
  assert.ok(ranked[0].score > ranked[1].score);
});

test('rankBySim: a skill doc (deep .claude path) is NOT down-weighted', () => {
  const sem = [
    { path: '.claude/skills/new-preset/SKILL.md', heading: '', snippet: '', sim: 0.40 },
    { path: 'progress.md', heading: '', snippet: '', sim: 0.45 }, // root → penalized below the skill
  ];
  const ranked = rankBySim(sem, [], 5);
  assert.equal(ranked[0].path, '.claude/skills/new-preset/SKILL.md');
});
```

- [ ] **Step 2: Run the test to verify the current behavior already partly holds, then confirm the second case fails or passes**

Run: `node --test --test-name-pattern='structural boundary|skill doc' test/rag.test.mjs`
Expected: the FIRST passes today (`.claude/ROADMAP.md` is in the current Set). The SECOND also passes today (`progress.md` is in the Set, `0.45 - 0.08 = 0.37 < 0.40`). Both passing now is fine — they pin the behavior the refactor must preserve. (If the runner reports "no tests match", check the pattern.)

- [ ] **Step 3: Replace the predicate with structural tests**

In `tools/rag/retrieve.mjs`, replace the constants block (currently lines 23-32, the `const DOWNWEIGHT = 0.08;` through the `isDownweighted` arrow) with:

```js
const DOWNWEIGHT = 0.08;
const DOWNWEIGHT_PREFIXES = ['docs/superpowers/', 'research/'];
const DOWNWEIGHT_EXACT = new Set(['docs/BUILD-SPEC.md']); // lone spec under docs/ root
const isRootDoc = (p) => !p.includes('/');                // root-level state/index doc
const isClaudeMeta = (p) => /^\.claude\/[^/]+\.md$/.test(p); // .claude/<file>.md (top level only)
const isDownweighted = (p) =>
  isRootDoc(p) ||
  isClaudeMeta(p) ||
  DOWNWEIGHT_EXACT.has(p) ||
  DOWNWEIGHT_PREFIXES.some((x) => p.startsWith(x));
```

Update the comment above the block to describe the structural approach (role-by-path) and note that chunk count was rejected (size ≠ role). Keep the comment short.

- [ ] **Step 4: Run the boundary + existing rankBySim tests**

Run: `node --test --test-name-pattern='rankBySim|structural boundary|skill doc' test/rag.test.mjs`
Expected: PASS — including the existing `rankBySim down-weights aggregator/meta docs on a tie` (`CLAUDE.md` is still caught by `isRootDoc`) and `leaves non-meta ordering by sim intact` (`a.md`/`b.md` are root docs, both penalized equally, so sim order holds).

- [ ] **Step 5: Verify the real probe set is still 6/6 (no behavior change)**

Run:
```bash
for q in "how is the app deployed" "how do looks and presets work" "shader licensing write our own" "audio bands texture analysis" "mobile performance budget step cap" "what survives a cloud session"; do
  top=$(node tools/rag/retrieve.mjs "$q" 2>/dev/null | grep -P '^-?\d+\.\d+\t' | head -1 | cut -f2 | sed 's/ ›.*//')
  printf '%-42s -> %s\n' "$q" "$top"
done
```
Expected (unchanged from the prior session):
```
how is the app deployed                    -> deploy/DEPLOY.md
how do looks and presets work              -> .claude/skills/new-preset/SKILL.md
shader licensing write our own             -> .claude/rules/shaders.md
audio bands texture analysis               -> .claude/rules/audio.md
mobile performance budget step cap         -> .claude/skills/perf-budget/SKILL.md
what survives a cloud session              -> .claude/ROADMAP.md
```
If any line differs, the structural rule is wrong — fix the predicate (do NOT re-add an explicit file entry to mask it). Likely culprit: a canonical doc accidentally matched (re-check `isClaudeMeta`'s `[^/]+` anchor).

- [ ] **Step 6: Commit**

```bash
git add tools/rag/retrieve.mjs test/rag.test.mjs
git commit -m "refactor(rag): structural (path-role) down-weight predicate replacing the hand list"
```

---

## Task 2: Shared probe set + regression test

**Files:**
- Create: `tools/rag/probes.mjs`
- Modify: `tools/rag/ab-model.mjs` (use the shared `PROBES`)
- Test: `test/rag.test.mjs` (append the regression test)

**Interfaces:**
- Consumes: `semanticSearch` (from `retrieve.mjs`).
- Produces: `export const PROBES: Array<{ q: string, expect: string }>` from `probes.mjs` — `expect` is a substring the top result's path must contain.

- [ ] **Step 1: Create the shared probe module**

Create `tools/rag/probes.mjs`:

```js
// tools/rag/probes.mjs
// Canonical retrieval probe set: query → substring the #1 result's path must
// contain. Single source of truth for the regression test (test/rag.test.mjs) and
// the model A/B harness (ab-model.mjs). Dev-tooling only.
export const PROBES = [
  { q: 'how is the app deployed', expect: 'deploy/DEPLOY.md' },
  { q: 'how do looks and presets work', expect: 'new-preset' },
  { q: 'shader licensing write our own', expect: 'shaders.md' },
  { q: 'audio bands texture analysis', expect: 'audio.md' },
  { q: 'mobile performance budget step cap', expect: 'perf-budget' },
  { q: 'what survives a cloud session', expect: '.claude/ROADMAP.md' },
];
```

- [ ] **Step 2: Point `ab-model.mjs` at the shared set**

In `tools/rag/ab-model.mjs`, add `import { PROBES } from './probes.mjs';` near the other imports and delete its local `const PROBES = [ ... ];` array (the old set used different `expect` substrings like `deploy-cpanel`; the shared set supersedes it). Leave the rest of the harness unchanged.

- [ ] **Step 3: Write the regression test (self-skips without the model)**

Append to `test/rag.test.mjs`:

```js
import { PROBES } from '../tools/rag/probes.mjs';

// The probe set needs the local embedder; in a model-free environment it can't run,
// so detect availability once and skip rather than fail.
let MODEL_OK = false;
try {
  const m = await import('../tools/rag/embed.mjs');
  await m.embedOne('availability probe');
  MODEL_OK = true;
} catch { MODEL_OK = false; }

test('probe set: canonical doc is #1 through the real pipeline', { skip: !MODEL_OK ? 'embedder unavailable' : false }, async () => {
  for (const p of PROBES) {
    const results = await semanticSearch(p.q, { limit: 1 });
    assert.ok(results.length > 0, `no results for "${p.q}"`);
    assert.ok(
      results[0].path.includes(p.expect),
      `"${p.q}" → expected #1 to contain ${p.expect}, got ${results[0].path}`,
    );
  }
});
```

- [ ] **Step 4: Run the regression test**

Run: `node --test --test-name-pattern='probe set' test/rag.test.mjs`
Expected: PASS (the committed index + model are present locally). In a model-free environment it would report the test as skipped — also acceptable.

- [ ] **Step 5: Run the full rag suite**

Run: `node --test test/rag.test.mjs 2>&1 | grep -E '^# (tests|pass|fail|skipped)'`
Expected: all pass (0 fail); `# tests` = previous 13 + the 3 new (two boundary + one probe regression) = 16 (or 15 with the probe test skipped if no model).

- [ ] **Step 6: Commit**

```bash
git add tools/rag/probes.mjs tools/rag/ab-model.mjs test/rag.test.mjs
git commit -m "test(rag): probe-set regression guard + shared probes module"
```

---

## Task 3: Health, progress, push

**Files:**
- Modify: `progress.md`
- (Regenerated if the hook fires: `ENCYCLOPEDIA.md`, `TREE.md`.)

- [ ] **Step 1: Run the full health gate**

Run: `npm run health 2>&1 | tail -15`
Expected: green except the known `test/artifacts/render.png` drift. (`RAG index drift gate` PASS — the index was not touched; `Docs + drift gate` fails only on render.png.)

- [ ] **Step 2: Regenerate docs for the new file**

Run: `node tools/gen-docs.mjs`
Expected: updates `ENCYCLOPEDIA.md`/`TREE.md` to include `tools/rag/probes.mjs`.

- [ ] **Step 3: Add a `progress.md` entry**

Prepend a short session entry to `progress.md` (newest at top): the down-weight is now structural (root `*.md` + `.claude/<file>.md` + prefixes + one explicit), the 16-file hand list is gone, chunk count was rejected by measurement (size ≠ role; skill docs are the largest), a probe-set regression test locks 6/6 (self-skips without the model) via the shared `tools/rag/probes.mjs`. Note no index rebuild (format unchanged) and that the probe result is unchanged (6/6).

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "docs(rag): record structural down-weight + regression guard"
git push -u origin claude/whats-next-brainstorming-tdzom3
```

---

## Self-Review Notes

- **Spec coverage:** structural predicate → Task 1; probe regression test (self-skip) → Task 2; shared `probes.mjs` + `ab-model.mjs` refactor → Task 2; no-behavior-change verification → Task 1/Step 5; progress + health → Task 3. Chunk-count rejection is documented (spec + Task 3 progress note); no code implements it (correct).
- **Type consistency:** `isDownweighted(path)→boolean` consumed by `rankBySim` (unchanged); `PROBES` shape `{q, expect}` produced by `probes.mjs`, consumed identically by the test and `ab-model.mjs`; `semanticSearch(q,{limit})→[{path,...}]` used in the regression test matches its definition.
- **No placeholders:** every code step shows complete code; every run step states the expected result.
