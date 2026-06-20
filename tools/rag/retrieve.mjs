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
import { decode } from './quantize.mjs';
import { VERSION } from './build-index.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = join(here, 'index.json');

const SEM_CANDIDATES = 30; // how many top semantic docs to consider
const LEX_BOOST = 0.15;    // weight of the in-set lexical nudge

// Aggregator / always-loaded / meta docs mention everything, so they score near
// any query and crowd out the canonical topic doc (a rule, skill, or answer file).
// A gentle additive penalty pushes them below the specific doc that actually
// answers the query; they can still appear lower in the list. Tuned on the probe
// set (tools/rag/ab-model.mjs).
const DOWNWEIGHT = 0.08;
const DOWNWEIGHT_PREFIXES = ['docs/superpowers/', 'research/'];
const DOWNWEIGHT_FILES = new Set([
  'CLAUDE.md', 'AGENTS.md', 'README.md', 'ONBOARDING.md', 'TODO.md', 'ROADMAP.md',
  'progress.md', 'task_plan.md', 'findings.md', 'ENCYCLOPEDIA.md', 'TREE.md',
  'docs/BUILD-SPEC.md',
  '.claude/ROADMAP.md', '.claude/TODO.md', '.claude/workflows.md', '.claude/skills-router.md',
]);
const isDownweighted = (p) =>
  DOWNWEIGHT_FILES.has(p) || DOWNWEIGHT_PREFIXES.some((x) => p.startsWith(x));

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

// Pure ranker: blend the semantic candidates with the in-set lexical boost and the
// aggregator/meta down-weight, then sort + slice. Exported so the scoring is unit-
// testable without the model.
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
        score: s.sim + (l ? LEX_BOOST * (l.score / lexMax) : 0) - (isDownweighted(s.path) ? DOWNWEIGHT : 0),
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
