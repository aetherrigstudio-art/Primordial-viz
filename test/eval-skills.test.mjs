import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, staticChecks } from '../tools/eval-skills.mjs';

test('parseFrontmatter reads name/area/description and strips quotes', () => {
  const fm = parseFrontmatter(
    '---\nname: brainstorming\narea: planning\ndescription: "Use when X."\n---\n# body',
  );
  assert.equal(fm.name, 'brainstorming');
  assert.equal(fm.area, 'planning');
  assert.equal(fm.description, 'Use when X.');
});

test('parseFrontmatter returns {} when no frontmatter', () => {
  assert.deepEqual(parseFrontmatter('# just a body'), {});
});

test('parseFrontmatter folds a >- block-scalar description', () => {
  const fm = parseFrontmatter(
    '---\nname: find-docs\narea: research\ndescription: >-\n  Retrieves up-to-date docs.\n  Use when the user asks about a library.\n---\n# body',
  );
  assert.equal(fm.description, 'Retrieves up-to-date docs. Use when the user asks about a library.');
});

test('staticChecks flags missing area, missing/short description, name≠dir', () => {
  const violations = staticChecks([
    { id: 'good', name: 'good', area: 'meta',
      description: 'A clear, sufficiently long description. Use when the user asks to do the good thing in this repo.' },
    { id: 'noarea', name: 'noarea', area: '', description: 'x'.repeat(60) + ' Use when needed.' },
    { id: 'short', name: 'short', area: 'meta', description: 'too short' },
    { id: 'mismatch', name: 'other', area: 'meta',
      description: 'A clear, sufficiently long description here. Use when the user asks for the mismatch case.' },
  ], new Set());
  const byId = (id, level) => violations.some((v) => v.skill === id && v.level === level);
  assert.ok(byId('noarea', 'error'));   // missing area
  assert.ok(byId('short', 'error'));    // description below min length
  assert.ok(byId('mismatch', 'error')); // name ≠ dir id
  assert.ok(!violations.some((v) => v.skill === 'good')); // clean skill: no violations
});

test('staticChecks downgrades violations on official (locked) skills to warn', () => {
  const violations = staticChecks(
    [{ id: 'short', name: 'short', area: 'meta', description: 'too short' }],
    new Set(['short']), // listed in skills-lock.json → official, exempt from errors
  );
  assert.ok(violations.every((v) => v.level === 'warn'));
  assert.ok(!violations.some((v) => v.level === 'error'));
});
