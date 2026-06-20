import { test } from 'node:test';
import assert from 'node:assert/strict';
import { latestHandoff, openThreads, recentLessons } from '../tools/mcp/lib/state.mjs';

const SAMPLE = `# Progress Log

## Session — 2026-06-20 (newest thing)
Did the newest thing.
More detail.

## Open threads
- [ ] **Thread A** | context A | parked
- [ ] **Thread B** | context B | parked
- [x] done one (should be ignored)

## Session — 2026-06-19 (LESSON: branch-scoped)
A lesson body.

## Session — 2026-06-18 (older)
old.
`;

test('latestHandoff returns the newest session entry, skipping Open threads', () => {
  const h = latestHandoff(SAMPLE);
  assert.equal(h.title, 'Session — 2026-06-20 (newest thing)');
  assert.match(h.body, /Did the newest thing/);
  assert.doesNotMatch(h.body, /Open threads/);
});

test('openThreads returns only unchecked items in the section', () => {
  const t = openThreads(SAMPLE);
  assert.equal(t.length, 2);
  assert.match(t[0].text, /Thread A/);
  assert.match(t[1].text, /Thread B/);
});

test('openThreads stops at the next section heading', () => {
  // The checked item and later session headings must not leak in.
  const t = openThreads(SAMPLE);
  assert.ok(t.every((x) => !/done one/.test(x.text)));
  assert.ok(t.every((x) => !/LESSON/.test(x.text)));
});

test('recentLessons finds LESSON headings, newest first, capped at n', () => {
  const l = recentLessons(5, SAMPLE);
  assert.equal(l.length, 1);
  assert.match(l[0].title, /LESSON/);
});

test('parsers are safe on empty / heading-less input', () => {
  assert.equal(latestHandoff(''), null);
  assert.deepEqual(openThreads(''), []);
  assert.deepEqual(recentLessons(3, ''), []);
});
