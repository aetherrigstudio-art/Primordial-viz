// tools/rag/quantize.mjs
// Dep-free int8 vector compaction for the committed RAG index. Per-vector max-abs
// scaling uses the full int8 range; the float32 query is dotted against decoded
// doc vectors (asymmetric quantization). Loaded by build-index (encode) and
// retrieve (decode) — no model, no third-party dependency, so the --check drift
// gate and query path stay light. Dev-tooling only.
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
