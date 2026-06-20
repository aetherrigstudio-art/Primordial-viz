# RAG down-weight: structural predicates + regression test — design spec

> Date: 2026-06-20 · Status: approved (brainstorm) · Area: dev-tooling (`tools/rag/`)
> Follows: `2026-06-20-rag-retrieval-polish-design.md` (which introduced the
> aggregator/meta down-weight as a hand-curated file list).

## Goal

Make the retrieval down-weight **self-maintaining** and add a **regression guard**,
without changing retrieval behavior (the probe set must stay 6/6 canonical-#1).

Today `retrieve.mjs` down-weights aggregator/meta docs via a 16-entry hand-curated
`DOWNWEIGHT_FILES` set plus two prefixes. New root/`.claude/` state docs must be
remembered and added by hand, or they silently start polluting results.

## Why not the obvious alternative (chunk count)

Rejected on evidence (measured against the committed index):
- The largest docs by chunk count are legitimate **skill docs**
  (`writing-skills` 90, `documentation-and-adrs` 35, `accessibility` 32) — a
  chunk-count penalty would wrongly bury them on their own topic.
- Canonical answer docs are **small** (DEPLOY 8, shaders 7, audio 7) and small
  aggregators are **smaller** (TODO 4, workflows 3) — so chunk count would penalize
  `DEPLOY.md` *more* than `TODO.md`, reversing the deploy fix.

"Aggregator" is a **role** property, not a size property. In this repo the role
maps cleanly to **path location**, which is what we exploit.

## Design

### Structural predicate (replaces the hand list)

In `tools/rag/retrieve.mjs`, replace `DOWNWEIGHT_FILES` (the explicit Set) with
structural tests. Keep `DOWNWEIGHT` (0.08) and the existing prefix list.

```js
const DOWNWEIGHT = 0.08;
const DOWNWEIGHT_PREFIXES = ['docs/superpowers/', 'research/'];
const DOWNWEIGHT_EXACT = new Set(['docs/BUILD-SPEC.md']); // lone spec under docs/ root
const isRootDoc = (p) => !p.includes('/');             // root-level state/index doc
const isClaudeMeta = (p) => /^\.claude\/[^/]+\.md$/.test(p); // .claude/ top-level meta
const isDownweighted = (p) =>
  isRootDoc(p) ||
  isClaudeMeta(p) ||
  DOWNWEIGHT_EXACT.has(p) ||
  DOWNWEIGHT_PREFIXES.some((x) => p.startsWith(x));
```

Why each clause is safe (topic/answer docs are structurally excluded):
- `isRootDoc` — every root `*.md` in this repo is a state/index doc (CLAUDE, AGENTS,
  README, ONBOARDING, TODO, ROADMAP, progress, task_plan, findings, ENCYCLOPEDIA,
  TREE). Topic docs never live at the repo root. Auto-captures future root docs.
- `isClaudeMeta` — matches `.claude/<file>.md` exactly (one slash). Captures
  `.claude/ROADMAP.md`, `.claude/TODO.md`, `.claude/workflows.md`,
  `.claude/skills-router.md`. Excludes `.claude/rules/*.md`, `.claude/agents/*.md`,
  and `.claude/skills/*/SKILL.md` (deeper paths) — those are canonical and must rank.
- prefixes/exact — unchanged from the prior spec.

Net: 16 hand-listed files → 2 structural predicates + 2 prefixes + 1 explicit entry.

### Probe-set regression test

Add a committed test that locks the canonical-#1 expectations, so a corpus change
that reintroduces pollution fails CI instead of silently degrading. Because the
real ranking needs the embedder (not always present in CI), the test must
**self-skip when the model/index is unavailable** (mirroring the existing
embedder-dependent tests, which run locally + in the verify workflow that installs
Chromium/deps). The probe set and expectations live next to the existing
`tools/rag/ab-model.mjs` PROBES (single source of truth) where practical.

Probe expectations (canonical doc the top result's path must contain):
- `how is the app deployed` → `deploy/DEPLOY.md`
- `how do looks and presets work` → `new-preset`
- `shader licensing write our own` → `shaders.md`
- `audio bands texture analysis` → `audio.md`
- `mobile performance budget step cap` → `perf-budget`
- `what survives a cloud session` → `.claude/ROADMAP.md`

(The last is the persistence-model section — the accepted canonical answer.)

## Constraints

- **No behavior change** beyond making the predicate structural — the 6/6 probe
  result must hold. Verify by running the probes through the real pipeline before
  committing; if any regresses, the structural rule is wrong and must be corrected
  (not patched with a re-added file entry).
- Dev-tooling only; web path untouched; `--check` gate stays model-free (this
  change is in `retrieve.mjs`, never loaded by the gate).
- No new dependency. Pure refactor + a test.

## Files

- Modify: `tools/rag/retrieve.mjs` (predicate only).
- Modify: `test/rag.test.mjs` (probe regression test; the existing `rankBySim`
  ordering test stays — update its example path if it referenced a now-implicit
  file, but `CLAUDE.md` is still down-weighted by `isRootDoc`, so it remains valid).
- Optionally export the `PROBES`/expectations from `tools/rag/ab-model.mjs` for
  reuse by the test.

## Testing

- `node --test test/rag.test.mjs` — existing 13 + the new probe regression test
  (skips cleanly with no model).
- Manual: re-run the 6 probes via `node tools/rag/retrieve.mjs "<q>"`; confirm 6/6.
- `npm run health` green except the known `render.png` drift.

## Definition of done

- `retrieve.mjs` uses structural predicates; the 16-file hand list is gone.
- Probe set still 6/6 canonical-#1 (verified through the real pipeline).
- A committed regression test locks the probe expectations (self-skips without the
  model).
- `progress.md` updated. `npm run health` green except the known drift.

## Out of scope

Slice 2 (global/cross-project layer); index format; embedding model.
