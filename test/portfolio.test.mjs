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

import { mergeSidecar, normalizeTree } from '../tools/portfolio/normalize-takeout.mjs';

test('mergeSidecar reads photoTakenTime', () => {
  const r = mergeSidecar('IMG_1.jpg', { photoTakenTime: { timestamp: '1700000000' } });
  assert.equal(r.takenAt, new Date(1700000000 * 1000).toISOString());
});

test('normalizeTree pairs media with supplemental sidecar', () => {
  const fakeFs = {
    readdirTree: () => [
      { name: 'IMG_1.jpg', absPath: '/t/IMG_1.jpg' },
      { name: 'IMG_1.jpg.supplemental-metadata.json', absPath: '/t/IMG_1.jpg.supplemental-metadata.json' },
      { name: 'clip.mov', absPath: '/t/clip.mov' },
      { name: 'metadata.json', absPath: '/t/metadata.json' }, // album-level, ignored
    ],
    readJson: (p) => p.includes('IMG_1') ? { photoTakenTime: { timestamp: '1700000000' } } : {},
  };
  const out = normalizeTree('/t', { fs: fakeFs });
  assert.equal(out.length, 2); // IMG_1.jpg + clip.mov (media only)
  const img = out.find(o => o.name === 'IMG_1.jpg');
  assert.equal(img.takenAt, new Date(1700000000 * 1000).toISOString());
});

import { pullFolder } from '../tools/portfolio/pull-drive.mjs';

test('pullFolder downloads only media and records destPaths', async () => {
  const fakeClient = {
    async list() {
      return [
        { id: '1', name: 'hero.jpg', mimeType: 'image/jpeg', size: '10' },
        { id: '2', name: 'notes.txt', mimeType: 'text/plain', size: '5' },
        { id: '3', name: 'reel.mp4', mimeType: 'video/mp4', size: '20' },
      ];
    },
    async download(id) { return new Uint8Array([id.charCodeAt(0)]); },
  };
  const written = [];
  const out = await pullFolder({
    driveClient: fakeClient,
    folderId: 'F',
    write: (name) => { written.push(name); return `/work/${name}`; },
  });
  assert.equal(out.length, 2); // jpg + mp4, not txt
  assert.deepEqual(written.sort(), ['hero.jpg', 'reel.mp4']);
  assert.equal(out.find(o => o.name === 'hero.jpg').type, 'image');
});
