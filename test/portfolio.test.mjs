import assert from 'node:assert';
import { test } from 'node:test';
import { makeItem, validateManifest, classifyType } from '../tools/portfolio/schema.mjs';

test('makeItem fills defaults', () => {
  const it = makeItem({ id: 'a', path: 'a.jpg', type: 'image' });
  assert.equal(it.score, 0);
  assert.deepEqual(it.tags, []);
  assert.equal(it.dupGroup, null);
  assert.equal(it.bestOfGroup, true);
});

test('classifyType maps extensions', () => {
  assert.equal(classifyType('Shot.JPG'), 'image');
  assert.equal(classifyType('clip.mov'), 'video');
  assert.equal(classifyType('notes.txt'), null);
});

test('validateManifest catches bad score and count', () => {
  const bad = { generatedAt: 'x', count: 2, items: [makeItem({ id: 'a', path: 'a.jpg', type: 'image', score: 200 })] };
  const r = validateManifest(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /count/.test(e)));
  assert.ok(r.errors.some(e => /score/.test(e)));
});
