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
