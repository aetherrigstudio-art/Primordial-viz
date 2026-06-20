// tools/rag/retrieve.mjs
// Hybrid semantic + lexical retrieval over the committed index. Ranks by semantic
// similarity (cosine) among the top semantic candidates, then applies a small
// lexical in-set boost so exact-keyword matches re-order WITHIN the relevant set
// without letting large catch-all docs intrude. Falls back to lexical-only when
// the index is absent/incompatible.
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { searchDocs } from '../mcp/lib/docs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = join(here, 'index.json');

const SEM_CANDIDATES = 30; // how many top semantic docs to consider
const LEX_BOOST = 0.15;    // weight of the in-set lexical nudge

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

export async function semanticSearch(query, { limit = 8 } = {}) {
  const q = String(query || '').trim();
  if (!q) return [];

  const lexical = searchDocs(q, { limit: 50 });
  const idx = loadIndex();

  let sem = [];
  if (idx && Array.isArray(idx.chunks)) {
    const { embedOne, DIM } = await import('./embed.mjs');
    if (idx.dim === DIM) {
      const qv = await embedOne(q);
      const best = new Map();
      for (const c of idx.chunks) {
        const sim = cosine(qv, c.vector);
        const prev = best.get(c.path);
        if (!prev || sim > prev.sim) {
          best.set(c.path, { path: c.path, heading: c.heading, snippet: c.text.slice(0, 200), sim });
        }
      }
      sem = [...best.values()].sort((a, b) => b.sim - a.sim).slice(0, SEM_CANDIDATES);
    }
  }

  if (!sem.length) return lexical.slice(0, limit); // graceful fallback

  const lexMax = Math.max(1e-9, ...lexical.map((l) => l.score));
  const lexByPath = new Map(lexical.map((l) => [l.path, l]));

  return sem
    .map((s) => {
      const l = lexByPath.get(s.path);
      return {
        path: s.path,
        heading: s.heading || '',
        snippet: s.snippet || '',
        score: s.sim + (l ? LEX_BOOST * (l.score / lexMax) : 0),
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const results = await semanticSearch(process.argv.slice(2).join(' '));
  for (const r of results) {
    console.log(`${r.score.toFixed(4)}\t${r.path}${r.heading ? ` › ${r.heading}` : ''}\n  ${r.snippet}`);
  }
}
