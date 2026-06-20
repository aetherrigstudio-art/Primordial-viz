# RAG Retrieval Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shrink the committed RAG index ~5× with chunk-scoped git diffs, stop meta-dev docs from polluting results, and give headingless chunks a readable label.

**Architecture:** Dev-tooling only, all under `tools/rag/` — the web path (`index.html`/`src/`) stays zero-runtime-dependency and is untouched. A new dep-free `quantize.mjs` int8-encodes vectors (per-vector max-abs scale, base64); the build writes a snippet (not full text) and one chunk per line; `retrieve.mjs` decodes at query time and applies a gentle additive penalty to `docs/superpowers/**`. The `--check` drift gate stays model-free.

**Tech Stack:** Node ESM (`.mjs`), `node:buffer`, `node:test`; embedding rebuild via the existing `@huggingface/transformers` devDep + MiniLM (`Xenova/all-MiniLM-L6-v2`, dim 384).

## Global Constraints

- **Web path stays zero-dependency** — changes live only in `tools/rag/` + `test/`; never import these from `index.html`/`src/`.
- **`--check` drift gate must stay model-free + dep-free** — it recomputes `inputHash` from `chunkCorpus()`; it must not load the embedder or decode vectors.
- **`retrieve.mjs` must run without the model** at query time (cosine only) and decode the new format with **no new dependency**.
- **Preserve the global-merge seam** — every chunk keeps `scope: "project"` and `project: "primordial-viz"`.
- **Model id:** `Xenova/all-MiniLM-L6-v2`; **DIM = 384** (from `tools/rag/model.mjs`).
- **Index `VERSION` bumps 1 → 2** (invalidates the old index, forces one rebuild).
- **Meta down-weight:** additive `-0.05` on paths under `docs/superpowers/` only.
- Commit messages end with the repo trailer (Co-Authored-By + Claude-Session) and push to branch `claude/whats-next-brainstorming-tdzom3`.
- Expected-green: `npm run health` passes except the known `test/artifacts/render.png` drift (see `.claude/rules/gotchas.md`).

---

## Task 0: Embedding-model A/B (decides `MODEL` before the rebuild)

**Decision gate (operator-requested):** before locking the model, build retrieval with both `Xenova/all-MiniLM-L6-v2` (current) and `Xenova/bge-small-en-v1.5` (same 384 dims → no format change) and compare on the probe set. API models and 768/1024-d / multilingual models are rejected (privacy egress + against the compaction goal). The winner becomes `MODEL` in `tools/rag/model.mjs` for Task 5's rebuild; if bge-small fails to load or doesn't beat MiniLM, keep MiniLM and proceed unchanged.

**Files:**
- Create (eval, may be kept): `tools/rag/ab-model.mjs`

- [ ] **Step 1:** `npm ci` (shared prereq).
- [ ] **Step 2:** Confirm `Xenova/bge-small-en-v1.5` loads via `@huggingface/transformers` with a single embedding; if it errors, record the failure, keep MiniLM, skip to the File Structure tasks.
- [ ] **Step 3:** For each model, embed the full `chunkCorpus()` once, then for each probe query (bge gets the instruction prefix `Represent this sentence for searching relevant passages: `) cosine-rank and print top-3 doc paths.
- [ ] **Step 4:** Score each model = how often the canonical doc is `#1` across the probe set (`how is the app deployed`→deploy-cpanel; `how do looks and presets work`→new-preset; `shader licensing write our own`→shaders.md; `audio bands texture`→audio.md; `mobile performance budget step cap`→shaders.md; `what survives a cloud session`→gotchas/continuity).
- [ ] **Step 5:** Report the table to the operator; set `MODEL` to the winner. (Note: swapping `MODEL` already invalidates the index via `inputHash`, composing with the VERSION-2 rebuild.)

---

## File Structure

- **Create** `tools/rag/quantize.mjs` — pure int8/base64 `encode`/`decode`. One responsibility: vector compaction. Dep-free.
- **Modify** `tools/rag/chunk.mjs` — add a per-doc `title` (first `# H1`, else basename) to every chunk.
- **Modify** `tools/rag/build-index.mjs` — `VERSION` 2; store `{scope,project,path,title,heading,snippet,q,scale}`; one chunk per line; drop `builtAt`.
- **Modify** `tools/rag/retrieve.mjs` — decode int8 vectors; meta-doc penalty; heading→title fallback; extract a pure `rankBySim` for testing; harden the embedder import to fall back to lexical.
- **Modify** `test/rag.test.mjs` — quantize round-trip, meta-penalty ordering, title fallback.
- **Rebuild + commit** `tools/rag/index.json`.
- **Modify** `tools/rag/README.md` and `progress.md` (+ remove the open-thread line).

---

## Task 1: `quantize.mjs` — int8/base64 vector codec

**Files:**
- Create: `tools/rag/quantize.mjs`
- Test: `test/rag.test.mjs` (append)

**Interfaces:**
- Consumes: nothing (pure).
- Produces:
  - `encode(vector: Float32Array|number[]) -> { q: string, scale: number }`
  - `decode(q: string, scale: number) -> Float32Array`

- [ ] **Step 1: Install deps (one-time prerequisite for the whole plan)**

Run: `npm ci`
Expected: completes; `node_modules/@huggingface/transformers` exists. (Needed later by the embed-dependent tests + the rebuild. Network/443 allowed in-container.)

- [ ] **Step 2: Write the failing test**

Append to `test/rag.test.mjs`:

```js
import { encode, decode } from '../tools/rag/quantize.mjs';

test('quantize round-trip preserves direction (cosine > 0.999)', () => {
  const v = Float32Array.from({ length: 384 }, (_, i) => Math.sin(i * 0.37) * 0.1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  for (let i = 0; i < v.length; i++) v[i] /= norm; // unit-norm, like a real embedding
  const { q, scale } = encode(v);
  assert.equal(typeof q, 'string');
  const d = decode(q, scale);
  assert.equal(d.length, v.length);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const nd = Math.sqrt(d.reduce((s, x) => s + x * x, 0));
  const cos = dot(v, d) / nd; // v is already unit-norm
  assert.ok(cos > 0.999, `expected cosine > 0.999, got ${cos}`);
});

test('quantize handles an all-zero vector without dividing by zero', () => {
  const { q, scale } = encode(new Float32Array(384));
  const d = decode(q, scale);
  assert.equal(d.length, 384);
  assert.ok(d.every((x) => x === 0));
});
```

- [ ] **Step 3: Run the test to verify it fails**

Run: `node --test --test-name-pattern='quantize' test/rag.test.mjs`
Expected: FAIL — `Cannot find module '../tools/rag/quantize.mjs'`.

- [ ] **Step 4: Write the implementation**

Create `tools/rag/quantize.mjs`:

```js
// tools/rag/quantize.mjs
// Dep-free int8 vector compaction for the committed RAG index. Per-vector
// max-abs scaling uses the full int8 range; the float32 query is dotted against
// decoded doc vectors (asymmetric quantization). Loaded by build-index (encode)
// and retrieve (decode) — no model, no third-party dependency, so the --check
// drift gate and query path stay light. Dev-tooling only.
import { Buffer } from 'node:buffer';

export function encode(vector) {
  let scale = 0;
  for (let i = 0; i < vector.length; i++) {
    const a = Math.abs(vector[i]);
    if (a > scale) scale = a;
  }
  if (scale === 0) scale = 1; // all-zero vector → avoid /0
  const int8 = new Int8Array(vector.length);
  for (let i = 0; i < vector.length; i++) {
    let q = Math.round((vector[i] / scale) * 127);
    if (q > 127) q = 127;
    else if (q < -127) q = -127;
    int8[i] = q;
  }
  return { q: Buffer.from(int8.buffer).toString('base64'), scale };
}

export function decode(q, scale) {
  const buf = Buffer.from(q, 'base64');
  const int8 = new Int8Array(buf.buffer, buf.byteOffset, buf.byteLength);
  const out = new Float32Array(int8.length);
  for (let i = 0; i < int8.length; i++) out[i] = (int8[i] * scale) / 127;
  return out;
}
```

- [ ] **Step 5: Run the test to verify it passes**

Run: `node --test --test-name-pattern='quantize' test/rag.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add tools/rag/quantize.mjs test/rag.test.mjs
git commit -m "feat(rag): dep-free int8/base64 vector codec"
```

---

## Task 2: `chunk.mjs` — per-doc title

**Files:**
- Modify: `tools/rag/chunk.mjs:28-50` (`chunkDoc`)
- Test: `test/rag.test.mjs` (append)

**Interfaces:**
- Consumes: nothing new.
- Produces: every chunk object gains `title: string` (first `# H1` in the doc, else the path basename). `chunkDoc(path, text)` signature unchanged. Existing fields (`scope, project, path, heading, text`) unchanged.

- [ ] **Step 1: Write the failing test**

Append to `test/rag.test.mjs`:

```js
test('chunkDoc attaches the doc title and exposes it as a heading fallback', () => {
  // content BEFORE the first heading → that chunk has heading '' but a title
  const text = 'intro before any heading\n# Real Title\n\n## Section\nbody text';
  const chunks = chunkDoc('docs/example.md', text);
  assert.ok(chunks.every((c) => c.title === 'Real Title'), 'all chunks share the doc title');
  const intro = chunks.find((c) => c.heading === '');
  assert.ok(intro, 'expected an intro chunk with no section heading');
  assert.equal(intro.heading || intro.title, 'Real Title'); // the fallback consumers use
});

test('chunkDoc falls back to the basename when there is no H1', () => {
  const chunks = chunkDoc('docs/no-title.md', '## Only\nsubheading content');
  assert.ok(chunks.every((c) => c.title === 'no-title.md'));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --test-name-pattern='chunkDoc attaches|basename' test/rag.test.mjs`
Expected: FAIL — `c.title` is `undefined`.

- [ ] **Step 3: Add `docTitle` and attach `title` in `chunkDoc`**

In `tools/rag/chunk.mjs`, add this helper above `chunkDoc` (after the `splitLong` function, before line 28):

```js
export function docTitle(path, text) {
  const h1 = String(text).split('\n').find((l) => /^#\s+/.test(l));
  return h1 ? h1.replace(/^#\s+/, '').trim() : path.split('/').pop();
}
```

Then in `chunkDoc`, compute the title once and add it to each pushed chunk. Change the body so the loop reads:

```js
export function chunkDoc(path, text) {
  const title = docTitle(path, text);
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
      chunks.push({ scope: 'project', project: PROJECT, path, title, heading: h, text: piece });
    }
  }
  return chunks;
}
```

- [ ] **Step 4: Run the new + existing chunk tests to verify they pass**

Run: `node --test --test-name-pattern='chunkDoc' test/rag.test.mjs`
Expected: PASS — the two new tests plus the two existing `chunkDoc` tests (`splits a doc into heading sections`, `sub-splits an oversized section`).

- [ ] **Step 5: Commit**

```bash
git add tools/rag/chunk.mjs test/rag.test.mjs
git commit -m "feat(rag): attach per-doc title to chunks (H1 or basename)"
```

---

## Task 3: `build-index.mjs` — compact format (VERSION 2)

**Files:**
- Modify: `tools/rag/build-index.mjs:14` (`VERSION`), `:23-35` (`buildIndex`)
- Test: covered indirectly; `checkIndex` test re-validated in Task 5 after rebuild.

**Interfaces:**
- Consumes: `encode` (Task 1), chunk `title` (Task 2), `chunkCorpus`, `inputHash`, `MODEL`, `DIM`.
- Produces: `index.json` whose chunk records are `{scope, project, path, title, heading, snippet, q, scale}` and whose top object is `{version:2, model, dim, builtFromHash, chunks:[…]}` with **one chunk per line** and **no `builtAt`**.

- [ ] **Step 1: Bump VERSION and add the snippet constant + import**

In `tools/rag/build-index.mjs`:
- Change line 14 `export const VERSION = 1;` → `export const VERSION = 2;`
- Add `const SNIPPET_LEN = 200;` just below it.
- Add the codec import next to the existing imports (after the `chunkCorpus` import):

```js
import { encode } from './quantize.mjs';
```

- [ ] **Step 2: Replace `buildIndex` (lines 23-35) with the compact builder + serializer**

```js
function serialize(header, records) {
  const head = JSON.stringify(header).slice(0, -1); // drop the closing brace
  const lines = records.map((r) => JSON.stringify(r)).join(',\n');
  return `${head},"chunks":[\n${lines}\n]}`;
}

export async function buildIndex() {
  const { embed } = await import('./embed.mjs'); // load the model lib only when building
  const chunks = chunkCorpus();
  const vectors = await embed(chunks.map((c) => c.text));
  const round = (v) => Math.round(v * 1e6) / 1e6;
  const records = chunks.map((c, i) => {
    const { q, scale } = encode(vectors[i]);
    return {
      scope: c.scope, project: c.project, path: c.path,
      title: c.title, heading: c.heading,
      snippet: c.text.slice(0, SNIPPET_LEN),
      q, scale: round(scale),
    };
  });
  const header = { version: VERSION, model: MODEL, dim: DIM, builtFromHash: inputHash(chunks) };
  writeFileSync(INDEX, serialize(header, records));
  return { ...header, chunks: records };
}
```

(`checkIndex` at lines 37-44 is unchanged — it already reads `builtFromHash` via `JSON.parse`, which still works on the one-chunk-per-line layout. The CLI block at the bottom is unchanged.)

- [ ] **Step 3: Verify the file parses and serializes to valid JSON (no embedder needed)**

Run:
```bash
node -e "import('./tools/rag/build-index.mjs').then(m=>{const s=require('node:fs');console.log('VERSION',m.VERSION);}).catch(e=>{console.error(e);process.exit(1)})"
```
Expected: prints `VERSION 2` with no error (module loads; `encode` import resolves).

- [ ] **Step 4: Sanity-check the serializer shape with a tiny inline harness**

Run:
```bash
node --input-type=module -e "
const head={version:2,model:'m',dim:384,builtFromHash:'h'};
const recs=[{path:'a',q:'AA',scale:0.1},{path:'b',q:'BB',scale:0.2}];
const serialize=(header,records)=>{const h=JSON.stringify(header).slice(0,-1);const l=records.map(r=>JSON.stringify(r)).join(',\n');return h+',\"chunks\":['+'\n'+l+'\n]}';};
const out=serialize(head,recs);
const parsed=JSON.parse(out);
console.log('lines',out.split('\n').length,'chunks',parsed.chunks.length,'version',parsed.version);
"
```
Expected: `lines 4 chunks 2 version 2` (header line + 2 chunk lines + closing line; valid `JSON.parse`).

- [ ] **Step 5: Commit**

```bash
git add tools/rag/build-index.mjs
git commit -m "feat(rag): compact index format — snippet, int8 vectors, one chunk per line (VERSION 2)"
```

---

## Task 4: `retrieve.mjs` — decode, meta down-weight, title fallback, embedder fallback

**Files:**
- Modify: `tools/rag/retrieve.mjs` (whole `semanticSearch` + add `rankBySim`, constants, imports)
- Test: `test/rag.test.mjs` (append — meta-penalty ordering, pure)

**Interfaces:**
- Consumes: `decode` (Task 1), `VERSION` (Task 3), index chunks `{path,title,heading,snippet,q,scale}`.
- Produces:
  - `semanticSearch(query, {limit}) -> Array<{path, heading, snippet, score}>` (unchanged signature).
  - `rankBySim(sem, lexical, limit) -> Array<{path, heading, snippet, score}>` (new, **exported**, pure) — applies the lexical in-set boost and the meta penalty, then sorts/slices.

- [ ] **Step 1: Write the failing test for the pure ranker**

Append to `test/rag.test.mjs`:

```js
import { rankBySim } from '../tools/rag/retrieve.mjs';

test('rankBySim down-weights docs/superpowers meta-docs on a tie', () => {
  const sem = [
    { path: 'docs/superpowers/specs/x.md', heading: '', snippet: '', sim: 0.50 },
    { path: '.claude/rules/deploy.md', heading: 'Host', snippet: '', sim: 0.50 },
  ];
  const ranked = rankBySim(sem, [], 5); // no lexical input
  assert.equal(ranked[0].path, '.claude/rules/deploy.md', 'non-meta doc wins the tie');
  assert.ok(ranked[1].path.startsWith('docs/superpowers/'));
  assert.ok(ranked[0].score > ranked[1].score);
});

test('rankBySim leaves non-meta ordering by sim intact', () => {
  const sem = [
    { path: 'a.md', heading: '', snippet: '', sim: 0.30 },
    { path: 'b.md', heading: '', snippet: '', sim: 0.60 },
  ];
  const ranked = rankBySim(sem, [], 5);
  assert.equal(ranked[0].path, 'b.md');
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test --test-name-pattern='rankBySim' test/rag.test.mjs`
Expected: FAIL — `rankBySim` is not exported.

- [ ] **Step 3: Rewrite `retrieve.mjs`**

Replace the whole file with:

```js
// tools/rag/retrieve.mjs
// Hybrid semantic + lexical retrieval over the committed index. Decodes int8
// doc vectors, ranks by cosine among the top semantic candidates, applies a small
// in-set lexical boost (exact-keyword re-ordering that can't inject big catch-all
// docs) and a gentle penalty on meta-dev docs (docs/superpowers/**) that only rank
// because they quote a query verbatim. Falls back to lexical when the index or the
// embedder is absent/incompatible. Dev-tooling only.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { searchDocs } from '../mcp/lib/docs.mjs';
import { decode } from './quantize.mjs';
import { VERSION } from './build-index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = join(here, 'index.json');

const SEM_CANDIDATES = 30;  // how many top semantic docs to consider
const LEX_BOOST = 0.15;     // weight of the in-set lexical nudge
const META_PREFIXES = ['docs/superpowers/'];
const META_PENALTY = 0.05;  // gentle down-weight for query-quoting meta-dev docs
const isMeta = (p) => META_PREFIXES.some((x) => p.startsWith(x));

let _idx;
function loadIndex() {
  if (_idx !== undefined) return _idx;
  _idx = existsSync(INDEX) ? JSON.parse(readFileSync(INDEX, 'utf8')) : null;
  return _idx;
}

function cosine(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s; // query is unit-norm; decoded doc vector ≈ unit-norm → dot ≈ cosine
}

export function rankBySim(sem, lexical, limit) {
  const lexMax = Math.max(1e-9, ...lexical.map((l) => l.score), 1e-9);
  const lexByPath = new Map(lexical.map((l) => [l.path, l]));
  return sem
    .map((s) => {
      const l = lexByPath.get(s.path);
      return {
        path: s.path,
        heading: s.heading || '',
        snippet: s.snippet || '',
        score: s.sim + (l ? LEX_BOOST * (l.score / lexMax) : 0) - (isMeta(s.path) ? META_PENALTY : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export async function semanticSearch(query, { limit = 8 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const lexical = searchDocs(q, { limit: 50 });
  const idx = loadIndex();

  let sem = [];
  if (idx && idx.version === VERSION && Array.isArray(idx.chunks)) {
    let embedMod = null;
    try { embedMod = await import('./embed.mjs'); } catch { embedMod = null; }
    if (embedMod && idx.dim === embedMod.DIM) {
      const qv = await embedMod.embedOne(q);
      const best = new Map();
      for (const c of idx.chunks) {
        const sim = cosine(qv, decode(c.q, c.scale));
        const prev = best.get(c.path);
        if (!prev || sim > prev.sim) {
          best.set(c.path, { path: c.path, heading: c.heading || c.title, snippet: c.snippet, sim });
        }
      }
      sem = [...best.values()].sort((a, b) => b.sim - a.sim).slice(0, SEM_CANDIDATES);
    }
  }

  if (!sem.length) return lexical.slice(0, limit); // graceful fallback
  return rankBySim(sem, lexical, limit);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = await semanticSearch(process.argv.slice(2).join(' '));
  for (const r of results) {
    console.log(`${r.score.toFixed(4)}\t${r.path}${r.heading ? ` › ${r.heading}` : ''}\n  ${r.snippet}`);
  }
}
```

- [ ] **Step 4: Run the ranker tests to verify they pass**

Run: `node --test --test-name-pattern='rankBySim' test/rag.test.mjs`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/rag/retrieve.mjs test/rag.test.mjs
git commit -m "feat(rag): decode int8 vectors, down-weight meta-docs, title fallback, lexical fallback on missing embedder"
```

---

## Task 5: Rebuild the index, update docs, run full gates

**Files:**
- Rebuild: `tools/rag/index.json`
- Modify: `tools/rag/README.md`, `progress.md` (+ remove the open-thread line in the parked list)

**Interfaces:**
- Consumes: everything above.
- Produces: a committed, compact `index.json` that passes `checkIndex`; green test + health gates.

- [ ] **Step 1: Rebuild the committed index (needs the model)**

Run: `npm run rag:index`
Expected: prints `rag index: wrote <N> chunks (Xenova/all-MiniLM-L6-v2, dim 384)` (N ≈ 1355). First run downloads MiniLM over HTTPS (~90 MB, cached).

- [ ] **Step 2: Confirm the new file is smaller and one-chunk-per-line**

Run:
```bash
du -h tools/rag/index.json && head -c 120 tools/rag/index.json && echo && echo "lines:" && wc -l < tools/rag/index.json
```
Expected: size roughly ~1 MB (down from ~5.9 MB); first line is the header + first chunk; line count ≈ N+1 (one chunk per line). The header shows `"version":2` and no `builtAt`.

- [ ] **Step 3: Verify the drift gate passes against the rebuilt index**

Run: `npm run rag:index -- --check`
Expected: `rag index: up to date` (exit 0).

- [ ] **Step 4: Run the full RAG test suite (needs the model for the embed/semantic tests)**

Run: `node --test test/rag.test.mjs`
Expected: PASS — all tests, including the existing `semanticSearch surfaces the right doc for a conceptual query` (new-preset skill in top results) and `checkIndex passes against the committed index`.

- [ ] **Step 5: Verify the meta-pollution fix on the probe set**

Run:
```bash
node tools/rag/retrieve.mjs "how is the app deployed" | head -3
node tools/rag/retrieve.mjs "how do looks and presets work" | head -3
node tools/rag/retrieve.mjs "shader licensing write our own" | head -3
```
Expected: `#1` is the canonical doc, not a `docs/superpowers/**` plan/spec — i.e. `deploy-cpanel` / `new-preset` SKILL.md and `.claude/rules/shaders.md` respectively. If a meta-doc still leads on a query that quotes it, note the score gap (penalty is tunable via `META_PENALTY`).

- [ ] **Step 6: Update `tools/rag/README.md`**

In the `## Pieces` list, update the `build-index.mjs` / `retrieve.mjs` bullets and add a `quantize.mjs` bullet. Replace the two relevant lines with:

```markdown
- `quantize.mjs` — dep-free int8/base64 vector codec (per-vector scale); shared by
  build + retrieve so the index is compact and the `--check` gate stays model-free.
- `build-index.mjs` — `npm run rag:index` builds the committed `index.json`
  (compact: snippet + int8 vectors, one chunk per line); `--check` is the drift
  gate (in `npm run health` + CI).
- `retrieve.mjs` — hybrid retrieval: decodes int8 vectors, ranks by cosine, adds a
  small in-set lexical boost and a gentle down-weight on `docs/superpowers/**`
  meta-docs; headingless chunks fall back to the doc title; `semanticSearch()` +
  CLI; falls back to lexical if the index/embedder is missing.
```

- [ ] **Step 7: Run the full health gate**

Run: `npm run health`
Expected: green except the known `test/artifacts/render.png` drift (gitignored, absent at rest — see `.claude/rules/gotchas.md`). The `rag:index --check`, smoke, syntax, audit, and docs/drift gates pass.

- [ ] **Step 8: Add a `progress.md` entry and remove the open-thread line**

Prepend a session entry to `progress.md` summarizing: index compaction (~5.9 MB → ~1 MB, one chunk per line, int8/base64 + snippet-only, VERSION 2), meta down-weight (−0.05 on `docs/superpowers/**`), title fallback, the latent embedder-crash fix, and the probe-query verification results. Then delete the `- [ ] **RAG retrieval-quality follow-ups (slice 1 polish)**` line from the `## Open threads` list (keep the global-layer thread).

- [ ] **Step 9: Commit and push**

```bash
git add tools/rag/index.json tools/rag/README.md progress.md
git commit -m "feat(rag): rebuild compact index + docs; resolve slice-1 retrieval-quality follow-ups"
git push -u origin claude/whats-next-brainstorming-tdzom3
```

---

## Self-Review Notes

- **Spec coverage:** (b) int8+base64 → Task 1/3/4; snippet-only → Task 3; one-chunk-per-line + drop builtAt → Task 3; VERSION bump → Task 3. (a) meta down-weight → Task 4 + verify Task 5/Step 5. (c) title fallback → Task 2 (chunk) + Task 4 (apply). Optional embedder-crash hardening → Task 4. Rebuild/README/progress + open-thread removal → Task 5. Prereq `npm ci` → Task 1/Step 1.
- **Type consistency:** `encode`→`{q,scale}` consumed identically in `build-index` and `decode`; `decode(q,scale)→Float32Array` fed to `cosine`; chunk `title` produced in Task 2, read in `build-index` (Task 3) and as `c.heading||c.title` in `retrieve` (Task 4); `rankBySim(sem, lexical, limit)` defined and tested in Task 4; `VERSION` (=2) produced in Task 3, imported in Task 4.
- **No placeholders:** every code step shows complete code; every run step has an expected result.
