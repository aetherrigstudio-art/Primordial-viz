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
