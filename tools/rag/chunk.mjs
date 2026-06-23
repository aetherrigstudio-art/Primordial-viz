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

export function docTitle(path, text) {
  const h1 = String(text).split('\n').find((l) => /^#\s+/.test(l));
  return h1 ? h1.replace(/^#\s+/, '').trim() : path.split('/').pop();
}

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

export function chunkCorpus() {
  const chunks = [];
  const skip = new Set(['ENCYCLOPEDIA.md', 'TREE.md']);
  for (const path of docFiles()) {
    if (skip.has(path)) continue;
    chunks.push(...chunkDoc(path, readFileSync(join(root, path), 'utf8')));
  }
  return chunks;
}
