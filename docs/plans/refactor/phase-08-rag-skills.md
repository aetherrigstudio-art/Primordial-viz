# Refactor Phase 8 — RAG / skills integrity

Concern: `tools/rag/*`, `tools/eval-skills.mjs`, `.claude/skills/*` frontmatter,
`skills-lock.json`, `.claude/skills-router.md`. Agent-gathered; **disputed items flagged
for verification before any fix** (verification-before-completion).

## Problem
**Verified (FACT):**
- **RAG index STALE** — `node tools/rag/build-index.mjs --check` → STALE. Root cause is
  this-session-self-inflicted: `docFiles()` (`tools/mcp/lib/docs.mjs:18`) lists tracked
  `*.md`, and we modified `ENCYCLOPEDIA.md`/`TREE.md` + added new docs, so the input hash
  moved. The embedder (`@huggingface/transformers`) **IS** in `node_modules` → **we can
  rebuild in-container** (`npm run rag:index`). This is the root of CI-red-on-main too.
- **`grill-with-docs` is a thin stub** (`.claude/skills/grill-with-docs/SKILL.md:8`)
  delegating to a `/grilling` skill that is **not installed**. Either install
  `mattpocock/skills@grilling` or document/inline the dependency.
- **`.agents/` skill mirror is stale + duplicated** — it lags `.claude/skills/` and is
  unreferenced. Duplication with no consumer (coordinate the cleanup decision w/ phase 9).

**DISPUTED — do NOT act until verified:**
- **`tools/eval-skills.mjs` API params** (`:233,:261,:307,:329` use `output_config` /
  `effort` / `format`). An evidence agent called these invalid Anthropic params
  (CRITICAL); but a **prior session's progress.md claims they were "verified vs the
  claude-api reference, no banned params."** These conflict. **Verify against the
  `claude-api` skill / current SDK before changing anything** — the agent may be judging
  from stale memory (exactly the over-claim trap this whole exercise guards against).
- **`skills-lock.json` "all 11 hashes stale"** — an agent computed fresh hashes and said
  all 11 differ, including skills we never edited this session. That implies its hash
  method differs from how `npx skills` stores `computedHash`. **Verify how the lock hash
  is actually computed (and whether anything enforces it) before "fixing" 11 entries.**
- **4 skills missing `area:`** (astro-framework, legacy-modernizer, planning-with-files,
  r3f-shaders) yet the router lists them under `general`. **Verify** whether `gen-docs`
  defaults missing-area to `general` (then it's fine) or it's real drift.

## Solution
1. **Rebuild + commit the RAG index** AFTER all this session's docs are committed (order
   matters — `docFiles()` lists tracked files; see `gotchas.md`). Unblocks CI.
2. **Resolve `grill-with-docs`**: install `grilling` (+ maybe `to-issues`) or annotate.
3. **Verify the 3 disputed items** (eval-skills params, lock-hash method, area-default),
   THEN decide fixes from evidence — no blind edits.
4. **Decide the `.agents/` mirror's fate** with phase 9 (keep synced vs drop).

## Decision doc / ADRs
- **Proposed ADR-010 (shared with phase 9): the `.agents/` mirror + skills-lock policy** —
  do we maintain a tool-agnostic mirror and lock all skills, or simplify? Affects the
  gen-docs/skills tooling contract.

## Testing
- `node tools/rag/build-index.mjs --check` → current (after rebuild + commit-order).
- For each disputed item: the verification command/doc cited inline, output shown, BEFORE
  any code change (Iron Law).
- `node tools/gen-docs.mjs --check` green.

## Out of scope
- App code. The actual eval-skills/lock fixes (gated on the verification above).
