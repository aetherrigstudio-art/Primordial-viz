# Refactor Phase 9 — Tests / perf / dead-weight / handoff

Concern: `test/*`, perf-budget evidence, vestigial files, the Drive handoff, git hygiene.
Agent-gathered; cite `file:line`/command.

## Problem
- **Tests exist but aren't run in CI** — `test/guard.test.mjs`,
  `test/harvest-links.test.mjs`, `test/portfolio.test.mjs`, `test/reel-ingest.test.mjs`
  exist but `verify.yml` never invokes them (no grep hit). Dead test coverage. FACT.
- **Core code has no unit tests** — `src/audio/*` and `src/gl/*` are covered only by the
  integration `render-check`; no module-level tests. FACT. (audio tests → phase 5.)
- **Perf budget is assertion-only in CI** — the FPS verdict (`perf-budget` skill) is
  measured on the operator's device; CI's `render-check` only asserts "frames advance,"
  no frame-time gate. FACT. (Acceptable — but the on-device workflow should be documented.)
- **Dead/half weight:**
  - `server/` and `android/` are **skeleton READMEs only** (not implemented). FACT.
  - `src-tauri/` is a full desktop scaffold but **not CI-gated** (laptop-only build). FACT.
  - `.agents/` skill mirror is stale + duplicated, unreferenced (shared w/ phase 8). FACT.
  - `research/` is reference material, correctly **excluded from deploy** — keep. FACT.
- **Drive handoff is external-only** — `progress.md:3-31` describes a Google Drive
  channel with the design agent; **zero in-repo artifact**, so it's invisible/unversioned
  and goes stale silently. FACT.
- **Git hygiene** — `origin/main` is **6 commits behind** HEAD; ~4 stale/unmerged remote
  branches; branch deletion is **blocked from the container** (proxy 403 → operator
  deletes). FACT.

## Solution
1. **Wire or archive the 4 unrun tests** — add to `verify.yml` (preferred, they're cheap)
   or move to an `archive/` if obsolete. Decide per test.
2. **Add core unit tests** for `src/audio` (phase 5) + `src/gl` pure bits (uniforms math).
3. **Document the on-device perf workflow** in the perf-budget skill; optionally add a
   headless frame-time smoke (best-effort, software-GL caveat).
4. **Decide dead-weight fate** (ADR): keep `server/`/`android/` as roadmap stubs vs
   archive; keep `src-tauri` (CI-gate it or label optional); drop/sync `.agents/`.
5. **Anchor the Drive handoff in-repo** — commit a small `docs/handoff/DRIVE.md` pointer
   (folder id, protocol, last state) so it's versioned, not memory-only.
6. **Merge to `main`** regularly (the branch-scoped-continuity foot-gun); operator deletes
   stale remote branches.

## Decision doc / ADRs
- **Proposed ADR-010 (shared w/ phase 8)**: `.agents/` mirror + skills-lock policy.
- **Proposed ADR-011: fate of `server/` + `android/` + `src-tauri/`** — keep as roadmap,
  CI-gate, or archive (expensive-to-reverse if deleted, so record it).

## Testing
- `npm test`/the wired CI runs all kept test files green; `verify.yml` lists them.
- `git log --oneline origin/main..HEAD` shrinks toward 0 after a merge.
- Grep proves no unreferenced `.agents/` duplication remains (if dropped).

## Out of scope
- The audio/gl code changes themselves (phases 4/5). RAG/skills internals (phase 8).
