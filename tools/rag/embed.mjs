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
