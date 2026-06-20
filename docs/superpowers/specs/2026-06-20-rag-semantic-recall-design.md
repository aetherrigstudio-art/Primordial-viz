# Design — Semantic recall over the repo's knowledge (RAG, slice 1)

**Date:** 2026-06-20
**Status:** approved design, ready for writing-plans
**Brief:** `research/rag-system/BRIEF.md` (the full non-local RAG vision)
**Parked thread:** `progress.md` → Open threads → "non-local RAG system"
**Branch:** `claude/rag-recall`

## Summary

Add **semantic (vector) recall** over this repo's ~40 markdown knowledge files,
surfaced through the existing `primordial` MCP server and a CLI. This is **slice 1**
of the larger non-local RAG vision (per-project + global + operator-facing). We
build only the per-project semantic layer now, but carve the **seam** (scope/project
metadata) so the global layer is a later merge+filter, not a rewrite.

The current in-repo search (`tools/mcp/lib/docs.mjs`) is **lexical only**
(term-frequency over headings). It misses fuzzy/conceptual queries (synonyms,
paraphrases). This slice adds embeddings and **blends** them with the existing
lexical score — keeping exact-keyword strength while gaining concept recall.

## Decisions (settled in the brainstorm)

| Fork | Decision | Why |
| --- | --- | --- |
| First pain | Better recall in **this repo** first; all 3 (per-project/global/operator) eventually | Operator's call; design seams for growth |
| Persistence | **Git** (committed index); no hosting for the per-project layer | Repo ethos: durable state = git only; hosting only for the global layer later |
| Embedder | **Local model** (transformers.js, MiniLM, Apache-2.0) | No egress of proprietary knowledge, no API key, commercial-safe |
| Index sync | **Commit the index**, regenerate via `npm run` + CI/hook like `gen-docs` | Fresh cloud session / CI can query instantly; drift-gated |
| Store | **Brute-force cosine** over a committed JSON; no vector DB | ~few hundred chunks — ANN/DB is pointless and fights the container |
| Ranking | **Hybrid** (cosine blended with lexical term-freq) | Exact keywords (filenames, `uFlux`, errors) need lexical; concepts need vectors |

## Scope

**In scope (slice 1):**
- Chunk the repo's markdown corpus (same file set as `docs.mjs`, minus
  `research/corpus/`).
- Local embedding model wrapper.
- A committed semantic index + a `--check` drift gate.
- A hybrid retriever.
- An MCP tool (`semantic_search`) + a CLI.
- Tests proving semantic recall beats lexical on fuzzy queries.

**Out of scope (explicitly later — YAGNI):**
- Hosted store, vector DB, hosted embedding API.
- The **global** cross-project layer and its access gate (only the metadata seam now).
- Operator-facing web UI / personal endpoint.
- Re-deciding the lexical search — it stays as the fast path / fallback.

## Architecture

A new `tools/rag/` module. **All dev-tooling** → any new dependency goes in
`devDependencies`, never the web path (`index.html` + `src/` keep zero runtime deps).

```
tools/rag/
├── chunk.mjs        # corpus → chunks (reuses docs.mjs docFiles + heading split)
├── embed.mjs        # local model wrapper: embed(texts) → normalized vectors
├── build-index.mjs  # chunk → embed → write index.json ; also --check (drift gate)
├── retrieve.mjs     # load index, embed query, hybrid rank, return top-k
└── index.json       # COMMITTED generated index {version, model, dim, hash, chunks[]}
```

Surface wiring:
- `tools/mcp/server.mjs` — add a `semantic_search` tool delegating to
  `retrieve.mjs`. Keep `search_docs` (lexical) as a fallback / fast path.
- CLI: `node tools/rag/retrieve.mjs "<query>"` for local/phone use, and
  `npm run rag:index` / `npm run rag:index -- --check`.

### Components (each independently testable)

1. **`chunk.mjs`** — exports `chunkCorpus() → Chunk[]`. Reuses `docFiles()` from
   `tools/mcp/lib/docs.mjs` (single source of which files count). Splits each doc
   into **heading-section chunks** (the same heading logic `getDoc` already uses);
   sections longer than ~1.5k chars are split with a small overlap so no chunk is
   too large to embed well. Each chunk:
   ```
   { scope: "project", project: "primordial-viz",
     path, heading, text }
   ```
   `scope`/`project` are the **global-layer seam** — carried now, unused now.

2. **`embed.mjs`** — exports `embed(texts: string[]) → Float32Array[]` (L2-normalized,
   mean-pooled). Wraps a local **transformers.js** feature-extraction pipeline
   (model `Xenova/all-MiniLM-L6-v2`, Apache-2.0, 384-dim). Model weights download
   once over HTTPS/443 and cache; `.claude/cloud-setup.sh` pre-warms the cache so
   fresh containers don't re-download. `embedOne(text)` convenience for the query path.

3. **`build-index.mjs`** — `chunkCorpus()` → `embed()` → writes `index.json`:
   ```
   { version, model, dim, builtFromHash, builtAt, chunks: [{scope,project,path,heading,text,vector}] }
   ```
   `--check` mode recomputes `builtFromHash` (hash of the chunked corpus + model id)
   and **exits non-zero if the committed index is stale** — same contract as
   `gen-docs --check`. Folded into `npm run health` and CI.

4. **`retrieve.mjs`** — exports `semanticSearch(query, {limit}) → Result[]`. Loads
   `index.json`, embeds the query, computes cosine vs every chunk, **blends** with
   the lexical term-frequency score (reciprocal-rank fusion so the two scales don't
   need hand-tuned weights), returns top-k `{path, heading, snippet, score}`. Falls
   back to pure lexical if the index is missing/incompatible.

## Data flow

**Query:**
```
query → retrieve.semanticSearch
      → embed(query)  +  lexical score (reuse docs.mjs scoring)
      → RRF blend over index.json chunks
      → top-k {path, heading, snippet}
      → MCP semantic_search  OR  CLI stdout
```

**Build (npm run rag:index, + CI/hook on doc change):**
```
docFiles() (git *.md minus research/corpus/)
  → chunk per heading-section (split > ~1.5k chars, small overlap)
  → embed all chunks (batched, local model)
  → write tools/rag/index.json (committed)
```

## Sync / drift

- `build-index.mjs --check` gates staleness in `npm run health` + CI
  (`.github/workflows/verify.yml`), mirroring the existing `gen-docs --check`.
- A PostToolUse sibling to the existing `gen-docs` hook refreshes the index when a
  tracked doc changes (or, at minimum, the `--check` gate fails loudly so the author
  runs `npm run rag:index`). Decide hook-vs-gate-only in the plan; the gate is the
  hard guarantee, the hook is convenience.
- Model cache pre-warmed in `.claude/cloud-setup.sh`.

## The global seam (designed now, built later)

`index.json` is a **flat list** of chunks each tagged `{scope, project}`. The future
global layer is therefore a **merge + filter**, not a redesign:
- Global query = load multiple projects' `index.json`, concatenate, filter by
  `scope`/`project` (the access **gate** is a filter predicate + later an auth check).
- No schema change, no hosting decision is forced today.

This is the only forward-looking work in slice 1: the two metadata fields and a
one-paragraph note in the `tools/rag/` README. Nothing else global is built.

## Error handling

- **Missing/incompatible index** (wrong `version`/`model`/`dim`) → `retrieve` logs a
  warning and falls back to lexical search; never throws to the caller.
- **Model download/load failure** → `embed` surfaces a clear error; `build-index`
  exits non-zero; `retrieve` falls back to lexical so an agent is never blocked.
- **Empty/whitespace query** → returns `[]` (matches current lexical behavior).
- **Oversized chunk** → split at build time so embedding never silently truncates.

## Testing

`test/rag.test.mjs` (Node test runner, dev-only — the model is a devDep so this runs
in CI, not on the web path):
- **Chunker:** a known doc splits into the expected heading sections; an oversized
  section splits with overlap.
- **Core value proof:** a fuzzy query the lexical search misses returns the right doc
  semantically (e.g. *"how do I make visuals react to the beat"* → an audio doc; *"why
  is my frame rate dropping on phones"* → the shaders/perf rule). Assert the right
  `path` ranks in top-k where lexical-only does not.
- **Hybrid ≥ either alone** on a small labeled query set.
- **Drift gate:** `build-index.mjs --check` passes when fresh, fails when a doc is
  edited without rebuild.
- `npm run health` stays green (the new `--check` is added as a gate).

## Success test

- An agent (or the operator via CLI) gets the *right* doc for a conceptual query that
  lexical search misses, from a committed index, with no hosted service and no API key.
- The index is drift-gated like the other generated artifacts.
- The `{scope, project}` seam exists so the global layer is a later merge+filter.
- `index.html` + `src/` still carry **zero runtime deps**; all RAG deps are devDeps.

## Open items for the plan (writing-plans resolves these)

- Exact embedding model + transformers.js wiring (confirm Apache-2.0 + Node support;
  consider `fastembed` as an alternative if transformers.js is heavy).
- Hook-vs-gate-only for auto-refresh (gate is mandatory; hook is optional convenience).
- Chunk size / overlap constants (start ~1.5k chars / ~100-char overlap; tune on the
  real corpus).
- RRF constant `k` (start 60, the common default).
