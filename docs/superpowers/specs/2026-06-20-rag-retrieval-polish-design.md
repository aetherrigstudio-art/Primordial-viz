# RAG retrieval polish — design spec

> Date: 2026-06-20 · Status: approved (brainstorm) · Area: dev-tooling (`tools/rag/`)
> Source thread: `progress.md` → "RAG retrieval-quality follow-ups (slice 1 polish)".

## Goal

Three independent quality/maintenance fixes to the slice-1 semantic-recall system
(`tools/rag/`), with **no change to the web path** (stays zero-runtime-dep) and **no
change to the global-merge seam** (chunks still carry `scope`/`project`).

1. **(b) `index.json` size + churn** — the committed index is ~5.9 MB on one line,
   rewritten wholesale on any doc edit. Shrink it ~5× and make git diffs
   chunk-scoped.
2. **(a) Self-referential pollution** — `docs/superpowers/**` plan/spec docs quote
   example query phrasings verbatim, so they outrank the canonical answer doc for
   those exact queries. Down-weight them gently (keep them in the corpus).
3. **(c) Snippet headings** — chunks with no section heading render a bare `›`.
   Fall back to the doc title.

Non-goals: the global/cross-project layer (slice 2), changing the embedding model,
changing which files are in the corpus, or touching `index.html`/`src/`.

## Constraints (load-bearing)

- **Web path stays zero-dependency.** All of this is dev-tooling under `tools/rag/`,
  never imported by `index.html`/`src/`.
- **The `--check` drift gate must stay model-free + dep-free.** It recomputes
  `inputHash` from `chunkCorpus()` (re-reads source files) and compares to
  `index.json.builtFromHash`. It must not load the embedder or decode vectors.
- **`retrieve.mjs` runs without the model** at query time (cosine only) — and must
  decode the new vector format with no new dependency.
- **Preserve the global-merge seam.** Every chunk keeps `scope: "project"` and
  `project: "primordial-viz"` so slice 2 stays a merge+filter.
- Rebuilding the index needs `@huggingface/transformers` (devDep) + a one-time
  ~90 MB MiniLM download over HTTPS/443 (allowed in-container). Prerequisite:
  `npm ci` then `npm run rag:index`.

## Current shape (as built)

Per-chunk record in `index.json`:
`{ scope, project, path, heading, text, vector }` — `text` is the full ≤1500-char
section body; `vector` is 384 float32 components rounded to 1e-6 and stored as a
JSON array. The whole index is `JSON.stringify(idx)` (single line).

Consumers:
- `retrieve.mjs` uses `c.vector` (cosine), `c.text.slice(0,200)` (snippet),
  `c.heading`, `c.path`. Nothing reads the full `text`.
- `tools/mcp/server.mjs` `semantic_search` renders `path › heading` + snippet.
- `build-index.mjs` `inputHash` is computed from `chunkCorpus()` (NOT from
  `index.json`), so the index's storage format is independent of drift detection.

## Design

### Shared: `tools/rag/quantize.mjs` (new, dep-free)

Pure JS, no imports beyond `node:buffer` semantics (use `Buffer`). Two functions:

- `encode(vector: Float32Array|number[]) -> { q: string, scale: number }`
  - `scale = max(|v_i|)` (per-vector max-abs; `0 → scale 1` to avoid /0).
  - `q_i = clamp(round(v_i / scale * 127), -127, 127)` into an `Int8Array(DIM)`.
  - `q = Buffer.from(int8.buffer).toString('base64')`.
- `decode(q: string, scale: number) -> Float32Array(DIM)`
  - base64 → `Int8Array` → `v_i = q_i * scale / 127`.

Asymmetric use: the float32 query vector is dotted against decoded doc vectors.
Accuracy: per-vector scaling uses the full int8 range, so cosine error is small.

### (b) `build-index.mjs`

- Bump `VERSION` 1 → 2 (invalidates the old index via `inputHash`, forcing a
  rebuild; `retrieve` also version-guards).
- Per chunk, write `{ scope, project, path, title, heading, snippet, q, scale }`:
  - `snippet = c.text.slice(0, SNIPPET_LEN)` (SNIPPET_LEN = 200) — drop full `text`.
  - `{ q, scale } = encode(vector_i)` — drop the float array.
  - `title` from chunk (see (c)).
- Serialize **one chunk per line** inside a valid JSON object:
  ```
  {"version":2,"model":"…","dim":384,"builtFromHash":"…","chunks":[
  {…chunk…},
  {…chunk…}
  ]}
  ```
  i.e. `header + '"chunks":[\n' + chunks.map(JSON.stringify).join(',\n') + '\n]}'`.
  Parses with a plain `JSON.parse`; git diffs only touch changed chunk lines.
- **Drop `builtAt`** so an unchanged rebuild is a zero-diff (the hash already
  decides whether a rebuild is needed).

`inputHash` is unchanged in spirit (path\0heading\0text over `chunkCorpus()`), but
its value changes because `VERSION` is in the hash. `--check` stays model-free.

### (b) `retrieve.mjs`

- Version/dim guard: only use the index when `idx.version === VERSION` **and**
  `idx.dim === DIM`; else graceful lexical fallback (existing behavior).
- For each chunk: `vec = decode(c.q, c.scale)`, `sim = cosine(qv, vec)`.
- Use `c.snippet` directly (no more `c.text.slice`).
- **Optional hardening:** wrap the `await import('./embed.mjs')` so a missing
  embedder falls back to lexical instead of throwing (fixes the latent crash).

### (a) `retrieve.mjs` — meta-doc down-weight

```js
const META_PREFIXES = ['docs/superpowers/'];
const META_PENALTY = 0.05;
const isMeta = (p) => META_PREFIXES.some((x) => p.startsWith(x));
// final score:
score = s.sim + (l ? LEX_BOOST * (l.score / lexMax) : 0) - (isMeta(s.path) ? META_PENALTY : 0);
```

Gentle additive penalty: breaks near-ties where a plan/spec ranks only because it
quotes the query, without burying a plan from a genuine plan query. Tunable; verify
during implementation.

### (c) Doc title + heading fallback

- `chunk.mjs`: compute `title` = first `# H1` line in the doc, else the basename of
  `path`. Attach `title` to every chunk from that doc. (`heading` is unchanged.)
- Result label uses `heading || title`, so headingless (intro) chunks show the doc
  title instead of a bare `›`. The MCP/CLI render format `path › (heading||title)`.

Note: `chunkDoc` currently takes `(path, text)`; computing `title` there is local
(scan lines for the first `^#\s`). The existing test `chunkDoc splits a doc into
heading sections` still passes (it asserts `Audio`/`Shaders` headings, unaffected).

## Data flow (unchanged topology)

`docFiles()` → `chunkCorpus()` → `embed()` → `encode()` → `index.json` (committed).
Query: `embedOne(query)` → `decode()` per chunk → cosine → meta-penalty + lexical
boost → top-N → MCP/CLI.

## Testing

`test/rag.test.mjs` additions (all tokenless except the existing embed test):
- **quantize round-trip:** `decode(encode(v))` reconstructs `v` within tolerance;
  cosine(v, decode(encode(v))) > 0.99 on a representative vector.
- **meta down-weight ordering:** with two synthetic candidates of equal `sim`, the
  `docs/superpowers/**` one ranks below the non-meta one.
- **title fallback:** a chunk with empty heading exposes the doc title.
- Existing: `checkIndex()` passes against the **rebuilt** committed index;
  `semanticSearch('how do looks and presets work')` still returns the new-preset
  skill in the top results.

Manual verification (record results in `progress.md`):
- Probe set before/after the penalty: `how is the app deployed` → `deploy-cpanel`
  #1; `looks and presets` → `new-preset` #1; shader licensing → `shaders.md`;
  plus the queries known to surface RAG plan/spec docs — confirm the canonical doc
  is restored to #1 and the meta-doc drops.

## Sequencing

1. `npm ci` (prereq); confirm `npm run rag:index` builds in-container.
2. `quantize.mjs` + its round-trip test (TDD).
3. `chunk.mjs` title; `build-index.mjs` format (VERSION 2, snippet, q/scale,
   one-per-line, drop builtAt).
4. `retrieve.mjs` decode + meta-penalty + title fallback (+ optional embedder
   fallback).
5. Rebuild + commit `index.json`; `tools/rag/README.md` update.
6. Gates: `node --test test/rag.test.mjs`, `npm run rag:index --check`,
   `npm run health`; probe-query verification.

## Risks

- **Rebuild needs the model + network.** If the MiniLM download fails in-container,
  the committed index can't be regenerated and `checkIndex` will fail. De-risk by
  running the build first (step 1) before format changes.
- **Quantization recall loss.** Mitigated by per-vector scaling + the round-trip
  test; spot-check probe queries still return the right docs.
- **VERSION bump = full index rewrite once.** Expected one-time large diff on the
  switch commit; subsequent edits are chunk-scoped.

## Definition of done

- `index.json` ~5× smaller, one chunk per line, rebuilt + committed; `checkIndex`
  green.
- Meta-doc pollution fixed on the probe set (canonical doc #1).
- Headingless chunks show the doc title.
- All `test/rag.test.mjs` green; `npm run health` green except the known/expected
  `render.png` drift (see `.claude/rules/gotchas.md`).
- README + `progress.md` updated; open-thread line removed.
