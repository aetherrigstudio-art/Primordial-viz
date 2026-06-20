// tools/rag/ab-model.mjs
// One-off A/B: compare embedding models on the probe set. For each model, embed
// the full corpus once, then rank each probe query by cosine (best chunk per doc)
// and report whether the canonical doc lands at #1. Dev-tooling eval — not on the
// web path. Run: node tools/rag/ab-model.mjs
import { pipeline } from '@huggingface/transformers';
import { chunkCorpus } from './chunk.mjs';

const MODELS = [
  { key: 'minilm', id: 'Xenova/all-MiniLM-L6-v2', qPrefix: '' },
  { key: 'bge', id: 'Xenova/bge-small-en-v1.5', qPrefix: 'Represent this sentence for searching relevant passages: ' },
];

// probe query → substring the canonical answer doc's path must contain
const PROBES = [
  { q: 'how is the app deployed', expect: 'deploy-cpanel' },
  { q: 'how do looks and presets work', expect: 'new-preset' },
  { q: 'shader licensing write our own', expect: 'shaders.md' },
  { q: 'audio bands texture analysis', expect: 'audio.md' },
  { q: 'mobile performance budget step cap', expect: 'shaders.md' },
  { q: 'what survives a cloud session', expect: 'gotchas' },
];

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };

async function makeEmbed(id) {
  const pipe = await pipeline('feature-extraction', id);
  return async (t) => Float32Array.from((await pipe(String(t), { pooling: 'mean', normalize: true }).then((r) => r.data)));
}

const chunks = chunkCorpus();
console.log(`corpus: ${chunks.length} chunks`);

for (const m of MODELS) {
  process.stdout.write(`\n=== ${m.key} (${m.id}) ===\n`);
  let embed;
  try { embed = await makeEmbed(m.id); }
  catch (e) { console.log(`  LOAD FAILED: ${e.message}`); continue; }

  const vecs = [];
  for (const c of chunks) vecs.push(await embed(c.text));

  let hits = 0;
  for (const p of PROBES) {
    const qv = await embed(m.qPrefix + p.q);
    const best = new Map();
    for (let i = 0; i < chunks.length; i++) {
      const sim = dot(qv, vecs[i]);
      const path = chunks[i].path;
      if (!best.has(path) || sim > best.get(path)) best.set(path, sim);
    }
    const top = [...best.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
    const ok = top[0][0].includes(p.expect);
    if (ok) hits++;
    console.log(`  [${ok ? 'HIT ' : 'miss'}] "${p.q}" (want ~${p.expect})`);
    for (const [path, sim] of top) console.log(`      ${sim.toFixed(4)}  ${path}`);
  }
  console.log(`  >>> ${m.key}: ${hits}/${PROBES.length} canonical-at-#1`);
}
