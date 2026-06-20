import assert from 'node:assert';
import { test } from 'node:test';
import { parseArgs, autoGrid, parseGrid, isUrl, slugFor } from '../tools/reel/ingest.mjs';

test('parseArgs: input + flags', () => {
  const a = parseArgs(['https://x/reel/AB12', '--grid', '5x4', '--stills', '2,8', '--keep-video']);
  assert.equal(a.input, 'https://x/reel/AB12');
  assert.equal(a.grid, '5x4');
  assert.equal(a.stills, '2,8');
  assert.equal(a.keepVideo, true);
  assert.equal(a.noBootstrap, false);
});

test('parseGrid: valid + invalid', () => {
  assert.deepEqual(parseGrid('4x3'), { cols: 4, rows: 3, cells: 12 });
  assert.equal(parseGrid('bad'), null);
  assert.equal(parseGrid(''), null);
});

test('autoGrid: clamps cells 6..20, 4 cols', () => {
  assert.equal(autoGrid(5).cells, 8);     // round(5/2.5)=2 -> clamp 6 -> rows 2 -> 8 cells
  assert.equal(autoGrid(1000).cells, 20); // clamp 20
  assert.equal(autoGrid(0).cols, 4);
});

test('isUrl', () => {
  assert.equal(isUrl('https://instagram.com/reel/x'), true);
  assert.equal(isUrl('http://x'), true);
  assert.equal(isUrl('./clip.mp4'), false);
});

test('slugFor: reel id, youtube id, local file', () => {
  assert.equal(slugFor('https://www.instagram.com/reel/DZdHeceOL8J/'), 'DZdHeceOL8J');
  assert.equal(slugFor('https://youtu.be/watch?v=abc123'), 'abc123');
  assert.equal(slugFor('/tmp/My Clip.mov'), 'My_Clip');
});
