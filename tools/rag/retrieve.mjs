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
