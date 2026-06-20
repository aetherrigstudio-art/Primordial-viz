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
import { encode } from './quantize.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const INDEX = join(here, 'index.json');
export const VERSION = 2;
const SNIPPET_LEN = 200;

export function inputHash(chunks) {
  const h = createHash('sha256');
  h.update(`${MODEL}\n${VERSION}\n`);
  for (const c of chunks) h.update(`${c.path}\0${c.heading}\0${c.text}\n`);
  return h.digest('hex');
}

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
