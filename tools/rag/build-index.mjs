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
