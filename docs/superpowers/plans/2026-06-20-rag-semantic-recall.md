# RAG Semantic Recall (slice 1) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add semantic (vector) recall over the repo's markdown knowledge, surfaced through the existing `primordial` MCP server + a CLI, blended with the current lexical search.

**Architecture:** A new `tools/rag/` dev-tooling module: chunk the corpus → embed locally → write a committed `index.json` → retrieve with hybrid (cosine + lexical RRF). A `--check` drift gate keeps the index fresh like `gen-docs --check`. Chunks carry `{scope, project}` metadata as the seam for a future global layer.

**Tech Stack:** Node ESM, `@huggingface/transformers` (local MiniLM embeddings, devDep), `node:test`, `node:crypto`, the `@modelcontextprotocol/sdk` already in the repo.

**Spec:** `docs/superpowers/specs/2026-06-20-rag-semantic-recall-design.md`

## Global Constraints

- **Web path stays zero-runtime-dep.** All new deps go in `devDependencies`. Nothing here is imported by `index.html` or `src/`.
- **No network egress of doc text to a third party.** Embeddings are computed by a local model; only model *weights* download (once, over HTTPS/443) and cache.
- **The index is committed.** `tools/rag/index.json` is generated and checked into git; a `--check` gate fails CI when it's stale.
- **Reuse, don't fork, the file list.** `docFiles()` in `tools/mcp/lib/docs.mjs` is the single source of which files count (git-tracked `*.md`/`*.markdown` minus `research/corpus/`).
- **Carry the seam.** Every chunk has `scope: "project"` and `project: "primordial-viz"`. Unused now; the global layer is a later merge+filter.
- **MCP stdout is the JSON-RPC channel** — any logging in server code goes to stderr.
- **Commit trailers:** end every commit message with, on their own lines:
  ```
  Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_01S2oXYpgDVSFufJZJrrDpnE
  ```
  Shown in Task 1's commit; append the same to every later commit.

---

### Task 1: Corpus chunker

**Files:**
- Create: `tools/rag/chunk.mjs`
- Test: `test/rag.test.mjs`

**Interfaces:**
- Consumes: `docFiles()` from `tools/mcp/lib/docs.mjs` (returns repo-relative paths).
- Produces:
  - `chunkDoc(path: string, text: string) → Chunk[]`
  - `chunkCorpus() → Chunk[]`
  - `Chunk = { scope: "project", project: "primordial-viz", path: string, heading: string, text: string }`
  - Constants `MAX_CHARS = 1500`, `OVERLAP = 100`.

- [ ] **Step 1: Write the failing test**

```js
// test/rag.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkDoc } from '../tools/rag/chunk.mjs';

test('chunkDoc splits a doc into heading sections', () => {
  const text = '# Title\nintro line\n\n## Audio\nbands and texture\n\n## Shaders\nstep cap';
  const chunks = chunkDoc('CLAUDE.md', text);
  const headings = chunks.map((c) => c.heading);
  assert.ok(headings.includes('Audio'));
  assert.ok(headings.includes('Shaders'));
  const audio = chunks.find((c) => c.heading === 'Audio');
  assert.match(audio.text, /bands and texture/);
  assert.equal(audio.scope, 'project');
  assert.equal(audio.project, 'primordial-viz');
  assert.equal(audio.path, 'CLAUDE.md');
});

test('chunkDoc sub-splits an oversized section with overlap', () => {
  const big = 'x'.repeat(4000);
  const chunks = chunkDoc('big.md', `## Big\n${big}`);
  assert.ok(chunks.length >= 3, `expected >=3 pieces, got ${chunks.length}`);
  assert.ok(chunks.every((c) => c.text.length <= 1500));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/rag.test.mjs`
Expected: FAIL — `Cannot find module '../tools/rag/chunk.mjs'`.

- [ ] **Step 3: Write the chunker**

```js
// tools/rag/chunk.mjs
// Splits the repo's markdown corpus into heading-section chunks for embedding.
// Reuses docFiles() so "which files count" has one source of truth. Sections
// longer than MAX_CHARS are sub-split with OVERLAP so no chunk is too large to
// embed well. Dev-tooling only — never imported by the web path.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { docFiles } from '../mcp/lib/docs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..');

export const PROJECT = 'primordial-viz';
export const MAX_CHARS = 1500;
export const OVERLAP = 100;

function splitLong(body) {
  if (body.length <= MAX_CHARS) return body ? [body] : [];
  const out = [];
  let i = 0;
  while (i < body.length) {
    out.push(body.slice(i, i + MAX_CHARS));
    i += MAX_CHARS - OVERLAP;
  }
  return out;
}

export function chunkDoc(path, text) {
  const lines = String(text).split('\n');
  const sections = [];
  let heading = '';
  let buf = [];
  const flush = () => {
    const body = buf.join('\n').trim();
    if (body) sections.push({ heading, body });
    buf = [];
  };
  for (const line of lines) {
    if (/^#{1,6}\s/.test(line)) { flush(); heading = line.replace(/^#+\s*/, '').trim(); }
    else buf.push(line);
  }
  flush();
  const chunks = [];
  for (const { heading: h, body } of sections) {
    for (const piece of splitLong(body)) {
      chunks.push({ scope: 'project', project: PROJECT, path, heading: h, text: piece });
    }
  }
  return chunks;
}

export function chunkCorpus() {
  const chunks = [];
  for (const path of docFiles()) {
    chunks.push(...chunkDoc(path, readFileSync(join(root, path), 'utf8')));
  }
  return chunks;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/rag.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/rag/chunk.mjs test/rag.test.mjs
git commit -m "feat(rag): corpus chunker (heading sections + oversize split)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01S2oXYpgDVSFufJZJrrDpnE"
```

---

### Task 2: Local embedder

**Files:**
- Create: `tools/rag/model.mjs` (dep-free constants), `tools/rag/embed.mjs`
- Modify: `package.json` (add devDependency)
- Test: `test/rag.test.mjs` (append)

**Interfaces:**
- Produces:
  - `model.mjs`: `MODEL: string` (`'Xenova/all-MiniLM-L6-v2'`), `DIM: number` (`384`) — **no third-party import**, so `build-index --check` and other model-free callers can read the constants without loading the transformers library.
  - `embed.mjs`: re-exports `MODEL`, `DIM`; `embed(texts: string[]) → Promise<Float32Array[]>` (mean-pooled, L2-normalized); `embedOne(text: string) → Promise<Float32Array>`.

- [ ] **Step 1: Install the embedding library**

Run: `npm install --save-dev @huggingface/transformers`
Expected: `package.json` gains `@huggingface/transformers` under `devDependencies`.
(If it fails to load models in Step 4, fall back to `npm install --save-dev @xenova/transformers` and change the import in `embed.mjs` to `@xenova/transformers` — same `pipeline` API and same `Xenova/all-MiniLM-L6-v2` model.)

- [ ] **Step 2: Write the failing test**

```js
// append to test/rag.test.mjs
import { embed, embedOne, DIM } from '../tools/rag/embed.mjs';

test('embed returns normalized vectors; related text scores higher than unrelated', async () => {
  const [a, b, c] = await embed([
    'audio bands drive the visuals',
    'the FFT feeds the audio-reactive shader',
    'cPanel SSL certificate renewal',
  ]);
  assert.equal(a.length, DIM);
  const norm = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
  assert.ok(Math.abs(norm - 1) < 1e-3, `expected unit-norm, got ${norm}`);
  const dot = (x, y) => x.reduce((s, v, i) => s + v * y[i], 0);
  assert.ok(dot(a, b) > dot(a, c), 'audio pair should be closer than audio/deploy pair');
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `node --test test/rag.test.mjs`
Expected: FAIL — `Cannot find module '../tools/rag/embed.mjs'`.

- [ ] **Step 4: Write the constants module and the embedder**

```js
// tools/rag/model.mjs
// Dep-free model constants. Kept separate from embed.mjs so model-free callers
// (e.g. build-index --check) can read these without loading the transformers lib.
export const MODEL = 'Xenova/all-MiniLM-L6-v2';
export const DIM = 384;
```

```js
// tools/rag/embed.mjs
// Local text embeddings via a small transformer (no doc text leaves the machine,
// no API key). Model weights download once over HTTPS and cache. Dev-tooling only.
import { pipeline } from '@huggingface/transformers';
import { MODEL, DIM } from './model.mjs';

export { MODEL, DIM };

let _pipe = null;
async function getPipe() {
  if (!_pipe) _pipe = await pipeline('feature-extraction', MODEL);
  return _pipe;
}

export async function embed(texts) {
  const pipe = await getPipe();
  const out = [];
  for (const t of texts) {
    const res = await pipe(String(t), { pooling: 'mean', normalize: true });
    out.push(Float32Array.from(res.data));
  }
  return out;
}

export async function embedOne(text) {
  return (await embed([text]))[0];
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `node --test test/rag.test.mjs`
Expected: PASS (first run downloads the model ~25MB over the network, then caches). If the model is unreachable, this test is the one that proves the embedder works — do not stub it.

- [ ] **Step 6: Commit**

```bash
git add tools/rag/model.mjs tools/rag/embed.mjs test/rag.test.mjs package.json package-lock.json
git commit -m "feat(rag): local MiniLM embedder (devDep, no egress)

<append standard trailers>"
```

---

### Task 3: Index builder + drift gate

**Files:**
- Create: `tools/rag/build-index.mjs`, `tools/rag/index.json` (generated, committed)
- Modify: `package.json` (add `rag:index` script)
- Test: `test/rag.test.mjs` (append)

**Interfaces:**
- Consumes: `chunkCorpus()` (Task 1); `MODEL`, `DIM` from `model.mjs` (dep-free); `embed` from `embed.mjs` (dynamically imported only when building, so `--check` never loads the transformers lib).
- Produces:
  - `inputHash(chunks) → string` (sha256 of model id + chunk path/heading/text; excludes vectors)
  - `buildIndex() → Promise<Index>` (writes `index.json`, returns it)
  - `checkIndex() → { ok: boolean, reason?: string }`
  - `Index = { version, model, dim, builtFromHash, builtAt, chunks: Array<Chunk & { vector: number[] }> }`
  - CLI: `node tools/rag/build-index.mjs` (build) / `--check` (gate, model-free).

- [ ] **Step 1: Write the failing test**

```js
// append to test/rag.test.mjs
import { inputHash, checkIndex } from '../tools/rag/build-index.mjs';
import { chunkCorpus } from '../tools/rag/chunk.mjs';

test('inputHash is stable for the same chunks and changes when text changes', () => {
  const chunks = chunkCorpus();
  assert.equal(inputHash(chunks), inputHash(chunks));
  const mutated = chunks.map((c, i) => (i === 0 ? { ...c, text: c.text + ' EDIT' } : c));
  assert.notEqual(inputHash(chunks), inputHash(mutated));
});

test('checkIndex passes against the committed index', () => {
  const r = checkIndex();
  assert.equal(r.ok, true, r.reason || '');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/rag.test.mjs`
Expected: FAIL — `Cannot find module '../tools/rag/build-index.mjs'`.

- [ ] **Step 3: Write the builder**

```js
// tools/rag/build-index.mjs
// Build the committed semantic index: chunk -> embed -> write index.json.
// --check recomputes the input hash (model-free, fast) and fails if index.json is
// stale, mirroring `gen-docs --check`. Dev-tooling only.
import { writeFileSync, readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chunkCorpus } from './chunk.mjs';
import { MODEL, DIM } from './model.mjs'; // dep-free — keeps --check model-free

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = join(here, 'index.json');
export const VERSION = 1;

export function inputHash(chunks) {
  const h = createHash('sha256');
  h.update(`${MODEL}\n${VERSION}\n`);
  for (const c of chunks) h.update(`${c.path}\0${c.heading}\0${c.text}\n`);
  return h.digest('hex');
}

export async function buildIndex() {
  const { embed } = await import('./embed.mjs'); // load the model lib only when building
  const chunks = chunkCorpus();
  const vectors = await embed(chunks.map((c) => c.text));
  const round = (v) => Math.round(v * 1e6) / 1e6; // keep the committed file lean
  const idx = {
    version: VERSION, model: MODEL, dim: DIM,
    builtFromHash: inputHash(chunks), builtAt: new Date().toISOString(),
    chunks: chunks.map((c, i) => ({ ...c, vector: Array.from(vectors[i], round) })),
  };
  writeFileSync(INDEX, JSON.stringify(idx));
  return idx;
}

export function checkIndex() {
  if (!existsSync(INDEX)) return { ok: false, reason: 'index.json missing — run: npm run rag:index' };
  const idx = JSON.parse(readFileSync(INDEX, 'utf8'));
  if (idx.builtFromHash !== inputHash(chunkCorpus())) {
    return { ok: false, reason: 'index.json stale — run: npm run rag:index' };
  }
  return { ok: true };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const r = checkIndex();
    console.log(r.ok ? 'rag index: up to date' : `rag index: STALE — ${r.reason}`);
    process.exit(r.ok ? 0 : 1);
  } else {
    const idx = await buildIndex();
    console.log(`rag index: wrote ${idx.chunks.length} chunks (${idx.model}, dim ${idx.dim})`);
  }
}
```

- [ ] **Step 4: Add the npm script**

Modify `package.json` `scripts` — add after the `"docs"` line:

```json
    "rag:index": "node tools/rag/build-index.mjs",
```

- [ ] **Step 5: Build the index (generates the committed artifact)**

Run: `npm run rag:index`
Expected: `rag index: wrote <N> chunks (Xenova/all-MiniLM-L6-v2, dim 384)` and `tools/rag/index.json` now exists.

- [ ] **Step 6: Run tests to verify they pass**

Run: `node --test test/rag.test.mjs`
Expected: PASS (hash + checkIndex tests green now that `index.json` exists).

- [ ] **Step 7: Commit**

```bash
git add tools/rag/build-index.mjs tools/rag/index.json test/rag.test.mjs package.json
git commit -m "feat(rag): committed index builder + --check drift gate

<append standard trailers>"
```

---

### Task 4: Hybrid retriever + CLI

**Files:**
- Create: `tools/rag/retrieve.mjs`
- Test: `test/rag.test.mjs` (append)

**Interfaces:**
- Consumes: `searchDocs` from `tools/mcp/lib/docs.mjs`; `embedOne`, `DIM` (Task 2); committed `index.json` (Task 3).
- Produces:
  - `semanticSearch(query: string, opts?: { limit?: number, k?: number }) → Promise<Result[]>`
  - `Result = { path: string, heading: string, snippet: string, score: number }`
  - CLI: `node tools/rag/retrieve.mjs "<query>"`.
- Behavior: reciprocal-rank fusion of the semantic ranking (best chunk per path) and the lexical ranking; falls back to pure lexical if the index is missing or its `dim` mismatches.

- [ ] **Step 1: Write the failing test**

```js
// append to test/rag.test.mjs
import { semanticSearch } from '../tools/rag/retrieve.mjs';

test('semanticSearch surfaces the right doc for a fuzzy query', async () => {
  // Phrasing that shares few exact words with the docs — the semantic win.
  const results = await semanticSearch('how do I make the visuals move to the beat', { limit: 6 });
  const paths = results.map((r) => r.path);
  assert.ok(
    paths.some((p) => p.includes('audio') || p.toLowerCase().includes('audio')),
    `expected an audio doc in ${JSON.stringify(paths)}`,
  );
});

test('semanticSearch returns [] for an empty query', async () => {
  assert.deepEqual(await semanticSearch('   '), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/rag.test.mjs`
Expected: FAIL — `Cannot find module '../tools/rag/retrieve.mjs'`.

- [ ] **Step 3: Write the retriever**

```js
// tools/rag/retrieve.mjs
// Hybrid semantic + lexical retrieval over the committed index. Blends the two
// ranked lists with reciprocal-rank fusion (RRF) so the score scales need no
// hand-tuning. Falls back to lexical-only if the index is absent/incompatible.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { searchDocs } from '../mcp/lib/docs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = join(here, 'index.json');

let _idx;
function loadIndex() {
  if (_idx !== undefined) return _idx;
  _idx = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : null;
  return _idx;
}

function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // both sides are L2-normalized
}

export async function semanticSearch(query, { limit = 8, k = 60 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const lexical = searchDocs(q, { limit: 50 });
  const idx = loadIndex();

  let sem = [];
  if (idx && Array.isArray(idx.chunks)) {
    const { embedOne, DIM } = await import('./embed.mjs');
    if (idx.dim === DIM) {
      const qv = await embedOne(q);
      const bestByPath = new Map();
      for (const c of idx.chunks) {
        const sim = cosine(qv, c.vector);
        const prev = bestByPath.get(c.path);
        if (!prev || sim > prev.sim) {
          bestByPath.set(c.path, { path: c.path, heading: c.heading, snippet: c.text.slice(0, 200), sim });
        }
      }
      sem = [...bestByPath.values()].sort((a, b) => b.sim - a.sim);
    }
  }

  if (!sem.length) return lexical.slice(0, limit); // graceful fallback

  const score = new Map();
  const meta = new Map();
  const fuse = (list) => list.forEach((r, rank) => {
    score.set(r.path, (score.get(r.path) || 0) + 1 / (k + rank + 1));
    if (!meta.has(r.path)) meta.set(r.path, r);
  });
  fuse(sem);
  fuse(lexical);

  return [...score.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([path, s]) => ({
      path,
      heading: meta.get(path).heading || '',
      snippet: meta.get(path).snippet || '',
      score: s,
    }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = await semanticSearch(process.argv.slice(2).join(' '));
  for (const r of results) {
    console.log(`${r.score.toFixed(4)}\t${r.path}${r.heading ? ` › ${r.heading}` : ''}\n  ${r.snippet}`);
  }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `node --test test/rag.test.mjs`
Expected: PASS. Then sanity-check the CLI:
Run: `node tools/rag/retrieve.mjs "why does my frame rate drop on phones"`
Expected: a shaders/perf-rule doc (e.g. `.claude/rules/shaders.md`) near the top.

- [ ] **Step 5: Commit**

```bash
git add tools/rag/retrieve.mjs test/rag.test.mjs
git commit -m "feat(rag): hybrid (semantic+lexical RRF) retriever + CLI

<append standard trailers>"
```

---

### Task 5: Wire surfaces — MCP tool, health gate, CI

**Files:**
- Modify: `tools/mcp/server.mjs` (register `semantic_search`)
- Modify: `tools/health.mjs` (add the drift gate)
- Modify: `.github/workflows/verify.yml` (add `--check` + run the rag tests)

**Interfaces:**
- Consumes: `semanticSearch` (Task 4); `checkIndex` is exercised via the CLI in health/CI.
- Produces: an MCP tool `semantic_search({ query, limit })`; a `npm run health` gate; CI steps.

- [ ] **Step 1: Register the MCP tool**

In `tools/mcp/server.mjs`, add to the imports near line 20:

```js
import { semanticSearch } from '../rag/retrieve.mjs';
```

Then, immediately after the `search_docs` tool registration (after its closing `);` around line 233), add:

```js
server.registerTool(
  'semantic_search',
  {
    description:
      "Semantic + keyword hybrid search over the project's own markdown docs. Better " +
      'than search_docs for conceptual/fuzzy questions (paraphrases, synonyms); blends ' +
      'vector similarity with keyword ranking. Returns ranked path + heading + snippet — ' +
      'use get_doc to read a full file.',
    inputSchema: {
      query: z.string().describe('Natural-language or keyword query'),
      limit: z.number().int().min(1).max(25).default(8).optional(),
    },
  },
  async ({ query, limit }) => {
    const results = await semanticSearch(query, { limit: limit || 8 });
    const text = results.length
      ? results.map((r) => `${r.path}${r.heading ? ` › ${r.heading}` : ''}\n  ${r.snippet}`).join('\n\n')
      : 'No matches.';
    return { content: [{ type: 'text', text }], structuredContent: { results } };
  },
);
```

- [ ] **Step 2: Verify the MCP server still starts and exposes the tool**

Run: `node tools/mcp/selftest.mjs`
Expected: `selftest OK` and `semantic_search` appears in the printed `tools:` line.

- [ ] **Step 3: Add the health drift gate**

In `tools/health.mjs`, add to the `checks` array (after the `'Docs + drift gate'` line):

```js
  ['RAG index drift gate', () => run('node', ['tools/rag/build-index.mjs', '--check'])],
```

- [ ] **Step 4: Verify the health gate passes**

Run: `npm run health`
Expected: `PASS  RAG index drift gate` among the gates; overall `Health: all local gates pass.` (the gitignored `render.png` drift is not part of `npm run health`).

- [ ] **Step 5: Add CI steps**

In `.github/workflows/verify.yml`, after the `Docs (encyclopedia + tree) up to date` step, add:

```yaml
      - name: RAG index up to date
        run: node tools/rag/build-index.mjs --check
```

And after the `MCP server self-test` step, add:

```yaml
      - name: RAG tests (chunker / embedder / retriever)
        run: node --test test/rag.test.mjs
```

(The `npm ci` + the model download already happen earlier in the job, so the model is available for the rag tests.)

- [ ] **Step 6: Commit**

```bash
git add tools/mcp/server.mjs tools/health.mjs .github/workflows/verify.yml
git commit -m "feat(rag): surface semantic_search via MCP; wire drift gate + CI

<append standard trailers>"
```

---

### Task 6: Model cache, docs, and the global seam note

**Files:**
- Create: `tools/rag/README.md`
- Modify: `.claude/cloud-setup.sh` (pre-warm the model cache)
- Modify: `ENCYCLOPEDIA.md`, `TREE.md` (regenerated)

**Interfaces:** none (docs + setup only).

- [ ] **Step 1: Write the module README (documents the global seam)**

```markdown
# tools/rag — semantic recall over the repo's knowledge

Dev-tooling. Adds semantic (vector) search over the project's markdown docs,
blended with the existing lexical search. Web path stays zero-dependency.

## Pieces
- `chunk.mjs` — corpus → heading-section chunks (reuses docs.mjs `docFiles()`).
- `embed.mjs` — local MiniLM embeddings (`@huggingface/transformers`, no egress).
- `build-index.mjs` — `npm run rag:index` builds the committed `index.json`;
  `--check` is the drift gate (in `npm run health` + CI).
- `retrieve.mjs` — hybrid (cosine + lexical RRF) retrieval; `semanticSearch()` +
  a CLI; falls back to lexical if the index is missing.

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
```

- [ ] **Step 2: Pre-warm the model in the cloud setup script**

Open `.claude/cloud-setup.sh`, find where it runs `npm ci` (or `npm install`), and add **after** that line:

```bash
# Pre-warm the local embedding model so the first RAG query in a session is fast
# (downloads ~25MB once; cached in the snapshot). Non-fatal if offline.
node -e "import('./tools/rag/embed.mjs').then(m => m.embedOne('warm')).then(() => console.log('rag model warmed')).catch(e => console.error('rag warm skipped:', e.message))" || true
```

- [ ] **Step 3: Regenerate the generated docs**

Run: `npm run docs`
Expected: `ENCYCLOPEDIA.md` + `TREE.md` updated to include `tools/rag/*`.

- [ ] **Step 4: Verify everything is green**

Run: `npm run health`
Expected: all local gates pass (incl. `Docs + drift gate` and `RAG index drift gate`).
Run: `node --test test/rag.test.mjs`
Expected: all rag tests pass.

- [ ] **Step 5: Commit**

```bash
git add tools/rag/README.md .claude/cloud-setup.sh ENCYCLOPEDIA.md TREE.md
git commit -m "docs(rag): module README + global-seam note; pre-warm model in setup

<append standard trailers>"
```

---

## Final verification (after all tasks)

- [ ] `npm run health` — all local gates pass.
- [ ] `node --test test/rag.test.mjs` — chunker, embedder, builder, retriever all green.
- [ ] `node tools/mcp/selftest.mjs` — `semantic_search` listed; `selftest OK`.
- [ ] `node tools/rag/retrieve.mjs "how do I make visuals react to the beat"` — an audio doc ranks top.
- [ ] `git status` clean; push `claude/rag-recall`.
- [ ] Update `progress.md` (new session entry) + clear the RAG open thread; update `task_plan.md` if the phase view changed.

## Notes for the implementer

- **Web path untouched:** confirm no file under `src/` or `index.html` imports anything in `tools/rag/`. The audit (`tools/audit-site.mjs`) only scans the deployed surface, so it won't flag dev-tooling — but keep it that way by construction.
- **Index size:** vectors are rounded to 6 decimals to keep `index.json` lean. If the committed file is still large (> ~3MB), that's acceptable per the spec's "commit the index" decision; do not switch to a binary format in this slice.
- **If the model package misbehaves:** the only swap point is `embed.mjs`'s import line (`@huggingface/transformers` → `@xenova/transformers`); everything downstream depends on `embed()`/`embedOne()`/`DIM`, not the library.
- **RRF constant `k = 60`** is the common default; leave it unless the retriever test shows a clear miss.
