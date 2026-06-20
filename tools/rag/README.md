# tools/rag — semantic recall over the repo's knowledge

Dev-tooling. Adds semantic (vector) search over the project's markdown docs,
blended with the existing lexical search. Web path stays zero-dependency.

## Pieces
- `chunk.mjs` — corpus → heading-section chunks (reuses docs.mjs `docFiles()`);
  also attaches each doc's `title` (first `# H1`, else basename).
- `embed.mjs` — local MiniLM embeddings (`@huggingface/transformers`, no egress).
- `quantize.mjs` — dep-free int8/base64 vector codec (per-vector scale); shared by
  build + retrieve so the committed index stays compact and the `--check` gate
  stays model-free.
- `build-index.mjs` — `npm run rag:index` builds the committed `index.json`
  (compact: snippet + int8 vectors, one chunk per line); `--check` is the drift
  gate (in `npm run health` + CI).
- `retrieve.mjs` — hybrid retrieval: decodes int8 vectors, ranks by semantic
  cosine, adds a small in-set lexical boost (exact-keyword matches re-order within
  the relevant set) and a gentle down-weight on aggregator/meta docs (always-loaded
  root/state docs, generated docs, research reports, specs/plans) so the canonical
  rule/skill/answer doc wins instead of a catch-all; headingless chunks fall back to
  the doc title; `semanticSearch()` + a CLI; falls back to lexical if the
  index/embedder is missing. Tuning probes live in `ab-model.mjs`.

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
