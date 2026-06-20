# tools/rag — semantic recall over the repo's knowledge

Dev-tooling. Adds semantic (vector) search over the project's markdown docs,
blended with the existing lexical search. Web path stays zero-dependency.

## Pieces
- `chunk.mjs` — corpus → heading-section chunks (reuses docs.mjs `docFiles()`).
- `embed.mjs` — local MiniLM embeddings (`@huggingface/transformers`, no egress).
- `build-index.mjs` — `npm run rag:index` builds the committed `index.json`;
  `--check` is the drift gate (in `npm run health` + CI).
- `retrieve.mjs` — hybrid retrieval: ranks by semantic cosine among the top
  candidates, then a small in-set lexical boost (exact-keyword matches re-order
  within the relevant set, but can't inject big catch-all docs); `semanticSearch()`
  + a CLI; falls back to lexical if the index is missing.

## Surfaces
- MCP tool `semantic_search` (in `tools/mcp/server.mjs`).
- CLI: `node tools/rag/retrieve.mjs "<query>"`.

## Refresh
Editing a tracked doc makes `index.json` stale → the `--check` gate fails →
run `npm run rag:index` and commit the updated index.

## The global seam (future, not built)
Every chunk carries `scope: "project"` and `project: "primordial-viz"`. The
planned cross-project/global layer (see `research/rag-system/BRIEF.md`) is then a
**merge + filter**: load multiple projects' `index.json`, concatenate, and filter
by `scope`/`project` (the access gate is a filter predicate, later an auth check).
No schema change or hosting decision is forced by this slice.
