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

import { sortManifest, groupBursts } from '../tools/portfolio/sort-vision.mjs';

test('groupBursts groups by time and flags best-of-group', () => {
  const t = '2024-01-01T00:00:00.000Z';
  const t2 = '2024-01-01T00:00:02.000Z';
  const far = '2024-01-01T01:00:00.000Z';
  const items = [
    makeItem({ id: 'a', path: 'a', type: 'image', score: 40, takenAt: t }),
    makeItem({ id: 'b', path: 'b', type: 'image', score: 70, takenAt: t2 }),
    makeItem({ id: 'c', path: 'c', type: 'image', score: 90, takenAt: far }),
  ];
  groupBursts(items, { windowSec: 3 });
  const a = items.find(i => i.id === 'a'), b = items.find(i => i.id === 'b'), c = items.find(i => i.id === 'c');
  assert.equal(a.dupGroup, b.dupGroup); // same burst
  assert.notEqual(a.dupGroup, c.dupGroup);
  assert.equal(b.bestOfGroup, true);  // higher score in the burst
  assert.equal(a.bestOfGroup, false);
});

test('sortManifest ranks by model score', async () => {
  const callModel = async ({ name }) => ({ score: name === 'good.jpg' ? 95 : 10, tags: ['t'], reason: 'r' });
  const m = await sortManifest({
    files: [{ name: 'meh.jpg', destPath: 'meh.jpg', type: 'image' }, { name: 'good.jpg', destPath: 'good.jpg', type: 'image' }],
    callModel,
    now: 'NOW',
  });
  assert.equal(m.generatedAt, 'NOW');
  assert.equal(m.count, 2);
  assert.equal(m.items[0].path, 'good.jpg'); // highest score first
});

import { renderSheet } from '../tools/portfolio/build-sheet.mjs';

test('renderSheet emits a cell per item and a keeper deep-link', () => {
  const manifest = { generatedAt: 'x', count: 1, items: [
    { id: 'a&b', path: 'a.jpg', type: 'image', score: 88, tags: ['neon'], reason: 'sharp', dupGroup: null, bestOfGroup: true, takenAt: null },
  ] };
  const html = renderSheet(manifest, { issueBase: 'https://github.com/o/r/issues/new' });
  assert.ok(html.includes('data-id="a&amp;b"'), 'escapes + carries id');
  assert.ok(html.includes('a.jpg'));
  assert.ok(html.includes('88'));
  assert.ok(/issues\/new/.test(html));
  assert.ok(html.includes('portfolio-keepers'));
});

import { parseKeepers, selectFinals } from '../tools/portfolio/stage-finals.mjs';

test('parseKeepers extracts comma list from a body', () => {
  assert.deepEqual(parseKeepers('thanks\nkeepers: a, b ,c\n--'), ['a', 'b', 'c']);
  assert.deepEqual(parseKeepers('no list here'), []);
});

test('selectFinals returns matching items in manifest order', () => {
  const manifest = { items: [
    { id: 'a', path: 'a.jpg' }, { id: 'b', path: 'b.jpg' }, { id: 'c', path: 'c.jpg' },
  ] };
  const out = selectFinals(manifest, ['c', 'a']);
  assert.deepEqual(out.map(i => i.id), ['a', 'c']); // manifest order, not keeper order
});
