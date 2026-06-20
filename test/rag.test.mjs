import { test } from 'node:test';
import assert from 'node:assert/strict';
import { chunkDoc } from '../tools/rag/chunk.mjs';

test('chunkDoc splits a doc into heading sections', () => {
  const text = '# Title\nintro line\n\n## Audio\nbands and texture\n\n## Shaders\nstep cap';
  const chunks = chunkDoc('CLAUDE.md', text);
  const headings = chunks.map((c) => c.heading);
  assert.ok(headings.includes('Audio'));
  assert.ok(headings.includes('Shaders'));
  const audio = chunks.find((c) => c.heading === 'Audio');
  assert.match(audio.text, /bands and texture/);
  assert.equal(audio.scope, 'project');
  assert.equal(audio.project, 'primordial-viz');
  assert.equal(audio.path, 'CLAUDE.md');
});

test('chunkDoc sub-splits an oversized section with overlap', () => {
  const big = 'x'.repeat(4000);
  const chunks = chunkDoc('big.md', `## Big\n${big}`);
  assert.ok(chunks.length >= 3, `expected >=3 pieces, got ${chunks.length}`);
  assert.ok(chunks.every((c) => c.text.length <= 1500));
});

import { embed, embedOne, DIM } from '../tools/rag/embed.mjs';

test('embed returns normalized vectors; related text scores higher than unrelated', async () => {
  const [a, b, c] = await embed([
    'audio bands drive the visuals',
    'the FFT feeds the audio-reactive shader',
    'cPanel SSL certificate renewal',
  ]);
  assert.equal(a.length, DIM);
  const norm = Math.sqrt(a.reduce((s, x) => s + x * x, 0));
  assert.ok(Math.abs(norm - 1) < 1e-3, `expected unit-norm, got ${norm}`);
  const dot = (x, y) => x.reduce((s, v, i) => s + v * y[i], 0);
  assert.ok(dot(a, b) > dot(a, c), 'audio pair should be closer than audio/deploy pair');
});

import { inputHash, checkIndex } from '../tools/rag/build-index.mjs';
import { chunkCorpus } from '../tools/rag/chunk.mjs';

test('inputHash is stable for the same chunks and changes when text changes', () => {
  const chunks = chunkCorpus();
  assert.equal(inputHash(chunks), inputHash(chunks));
  const mutated = chunks.map((c, i) => (i === 0 ? { ...c, text: c.text + ' EDIT' } : c));
  assert.notEqual(inputHash(chunks), inputHash(mutated));
});

test('checkIndex passes against the committed index', () => {
  const r = checkIndex();
  assert.equal(r.ok, true, r.reason || '');
});

import { semanticSearch } from '../tools/rag/retrieve.mjs';

test('semanticSearch surfaces the right doc for a conceptual query', async () => {
  const results = await semanticSearch('how do looks and presets work', { limit: 5 });
  const paths = results.map((r) => r.path);
  assert.ok(
    paths.includes('.claude/skills/new-preset/SKILL.md'),
    `expected new-preset skill in ${JSON.stringify(paths)}`,
  );
});

test('semanticSearch returns [] for an empty query', async () => {
  assert.deepEqual(await semanticSearch('   '), []);
});

import { encode, decode } from '../tools/rag/quantize.mjs';

test('quantize round-trip preserves direction (cosine > 0.999)', () => {
  const v = Float32Array.from({ length: 384 }, (_, i) => Math.sin(i * 0.37) * 0.1);
  const norm = Math.sqrt(v.reduce((s, x) => s + x * x, 0));
  for (let i = 0; i < v.length; i++) v[i] /= norm; // unit-norm, like a real embedding
  const { q, scale } = encode(v);
  assert.equal(typeof q, 'string');
  const d = decode(q, scale);
  assert.equal(d.length, v.length);
  const dot = (a, b) => a.reduce((s, x, i) => s + x * b[i], 0);
  const nd = Math.sqrt(d.reduce((s, x) => s + x * x, 0));
  const cos = dot(v, d) / nd; // v is already unit-norm
  assert.ok(cos > 0.999, `expected cosine > 0.999, got ${cos}`);
});

test('quantize handles an all-zero vector without dividing by zero', () => {
  const { q, scale } = encode(new Float32Array(384));
  const d = decode(q, scale);
  assert.equal(d.length, 384);
  assert.ok(d.every((x) => x === 0));
});

import { docTitle } from '../tools/rag/chunk.mjs';

test('chunkDoc attaches the doc title and exposes it as a heading fallback', () => {
  const text = 'intro before any heading\n# Real Title\n\n## Section\nbody text';
  const chunks = chunkDoc('docs/example.md', text);
  assert.ok(chunks.every((c) => c.title === 'Real Title'), 'all chunks share the doc title');
  const intro = chunks.find((c) => c.heading === '');
  assert.ok(intro, 'expected an intro chunk with no section heading');
  assert.equal(intro.heading || intro.title, 'Real Title'); // the fallback consumers use
});

test('docTitle falls back to the basename when there is no H1', () => {
  assert.equal(docTitle('docs/no-title.md', '## Only\nsubheading content'), 'no-title.md');
});

import { rankBySim } from '../tools/rag/retrieve.mjs';

test('rankBySim down-weights aggregator/meta docs on a tie', () => {
  const sem = [
    { path: 'CLAUDE.md', heading: '', snippet: '', sim: 0.50 },
    { path: '.claude/rules/deploy.md', heading: 'Host', snippet: '', sim: 0.50 },
  ];
  const ranked = rankBySim(sem, [], 5); // no lexical input
  assert.equal(ranked[0].path, '.claude/rules/deploy.md', 'canonical doc wins the tie');
  assert.equal(ranked[1].path, 'CLAUDE.md');
  assert.ok(ranked[0].score > ranked[1].score);
});

test('rankBySim leaves non-meta ordering by sim intact', () => {
  const sem = [
    { path: 'a.md', heading: '', snippet: '', sim: 0.30 },
    { path: 'b.md', heading: '', snippet: '', sim: 0.60 },
  ];
  const ranked = rankBySim(sem, [], 5);
  assert.equal(ranked[0].path, 'b.md');
});

test('rankBySim: structural boundary — .claude/ top-level meta is down-weighted, deeper topic docs are not', () => {
  const sem = [
    { path: '.claude/ROADMAP.md', heading: '', snippet: '', sim: 0.50 },   // meta → penalized
    { path: '.claude/rules/shaders.md', heading: '', snippet: '', sim: 0.50 }, // topic → kept
  ];
  const ranked = rankBySim(sem, [], 5);
  assert.equal(ranked[0].path, '.claude/rules/shaders.md', 'deeper topic doc wins');
  assert.equal(ranked[1].path, '.claude/ROADMAP.md');
  assert.ok(ranked[0].score > ranked[1].score);
});

test('rankBySim: a skill doc (deep .claude path) is NOT down-weighted', () => {
  const sem = [
    { path: '.claude/skills/new-preset/SKILL.md', heading: '', snippet: '', sim: 0.40 },
    { path: 'progress.md', heading: '', snippet: '', sim: 0.45 }, // root → penalized below the skill
  ];
  const ranked = rankBySim(sem, [], 5);
  assert.equal(ranked[0].path, '.claude/skills/new-preset/SKILL.md');
});

import { PROBES } from '../tools/rag/probes.mjs';

// The probe set needs the local embedder; in a model-free environment it can't run,
// so detect availability once and skip rather than fail.
let MODEL_OK = false;
try {
  const m = await import('../tools/rag/embed.mjs');
  await m.embedOne('availability probe');
  MODEL_OK = true;
} catch { MODEL_OK = false; }

test('probe set: canonical doc is #1 through the real pipeline', { skip: !MODEL_OK ? 'embedder unavailable' : false }, async () => {
  for (const p of PROBES) {
    const results = await semanticSearch(p.q, { limit: 1 });
    assert.ok(results.length > 0, `no results for "${p.q}"`);
    assert.ok(
      results[0].path.includes(p.expect),
      `"${p.q}" → expected #1 to contain ${p.expect}, got ${results[0].path}`,
    );
  }
});
