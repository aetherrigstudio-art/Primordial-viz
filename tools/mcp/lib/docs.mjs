// Project Q&A: keyword search + retrieval over the repo's own markdown docs, so an
// assistant can answer questions about the project. Zero-dependency (git ls-files
// + substring scoring; no vector store needed at this scale). Excludes the scraped
// research/corpus (external reference, not project knowledge).
//
//   node tools/mcp/lib/docs.mjs search "audio texture"
//   node tools/mcp/lib/docs.mjs get CLAUDE.md

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

export function docFiles() {
  const out = execFileSync('git', ['ls-files', '*.md', '*.markdown'], { cwd: root, encoding: 'utf8' });
  return out
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((p) => !p.startsWith('research/corpus/')); // external scrape, not project knowledge
}

// Rank docs by term-frequency over the query terms; return the best matching line
// (with its nearest heading) as a snippet.
export function searchDocs(query, { limit = 8 } = {}) {
  const terms = String(query || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  if (!terms.length) return [];
  const results = [];
  for (const path of docFiles()) {
    const lines = readFileSync(join(root, path), 'utf8').split('\n');
    let score = 0;
    let bestHits = 0;
    let snippet = '';
    let heading = '';
    let curHeading = '';
    for (const line of lines) {
      if (/^#{1,6}\s/.test(line)) curHeading = line.replace(/^#+\s*/, '').trim();
      const low = line.toLowerCase();
      let hits = 0;
      for (const t of terms) hits += low.split(t).length - 1;
      if (hits) {
        score += hits;
        if (hits > bestHits) { bestHits = hits; snippet = line.trim().slice(0, 200); heading = curHeading; }
      }
    }
    if (score) results.push({ path, score, heading, snippet });
  }
  results.sort((a, b) => b.score - a.score);
  return results.slice(0, limit);
}

// Return a doc's text (optionally just one heading's section). Restricted to known
// project docs — no arbitrary file reads.
export function getDoc(path, { section = null, maxBytes = 20000 } = {}) {
  if (!docFiles().includes(path)) throw new Error(`'${path}' is not a known project doc`);
  let text = readFileSync(join(root, path), 'utf8');
  if (section) {
    const lines = text.split('\n');
    const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && l.toLowerCase().includes(section.toLowerCase()));
    if (start >= 0) {
      const level = (lines[start].match(/^#+/) || ['#'])[0].length;
      let end = lines.length;
      for (let i = start + 1; i < lines.length; i++) {
        const m = lines[i].match(/^#+/);
        if (m && m[0].length <= level) { end = i; break; }
      }
      text = lines.slice(start, end).join('\n');
    }
  }
  if (text.length > maxBytes) text = text.slice(0, maxBytes) + '\n…(truncated)';
  return text;
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, ...rest] = process.argv.slice(2);
  if (cmd === 'search') {
    for (const r of searchDocs(rest.join(' '))) console.log(`${r.score}\t${r.path}\t${r.heading} — ${r.snippet}`);
  } else if (cmd === 'get') {
    console.log(getDoc(rest[0], { section: rest[1] || null }));
  } else {
    console.error('usage: docs.mjs search "<query>" | get <path> [section]');
    process.exit(1);
  }
}
