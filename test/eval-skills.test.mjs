import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseFrontmatter, staticChecks, loadFixtures, parsePick, routerSim, outcomeAB } from '../tools/eval-skills.mjs';

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

test('loadFixtures parses valid triggers', () => {
  const items = loadFixtures('test/eval/triggers.json', 'triggers');
  assert.ok(items.length >= 1);
  assert.equal(typeof items[0].prompt, 'string');
  assert.ok(Array.isArray(items[0].expect) && items[0].expect.length >= 1);
});

test('loadFixtures throws on a malformed trigger', () => {
  assert.throws(
    () => loadFixtures.fromString('[{"prompt":"hi"}]', 'triggers'),
    /expect/,
  );
});

test('parsePick extracts a valid id and rejects unknown', () => {
  assert.equal(parsePick('{"skill":"new-preset"}', ['new-preset', 'perf-budget']), 'new-preset');
  assert.equal(parsePick('{"skill":"none"}', ['new-preset']), null);
  assert.equal(parsePick('{"skill":"made-up"}', ['new-preset']), null);
});

test('routerSim scores hit-rate against expectations', async () => {
  const skills = [{ id: 'new-preset', name: 'new-preset', area: 'looks', description: 'Use when adding a look.' }];
  const fixtures = [{ prompt: 'add a look', expect: ['new-preset'] }];
  const fakeModel = async () => '{"skill":"new-preset"}';
  const r = await routerSim({ skills, fixtures, samples: 3, callModel: fakeModel });
  assert.equal(r.perFixture[0].hits, 3);
  assert.equal(r.perFixture[0].rate, 1);
  assert.equal(r.hitRate, 1);
});

test('outcomeAB reports positive lift when skill body helps', async () => {
  const skills = [{ id: 'new-preset', name: 'new-preset', area: 'looks',
    description: 'Use when adding a look.',
    dir: '.claude/skills/new-preset' }];
  const fixtures = [{ skill: 'new-preset', task: 'add ember look', rubric: 'mentions JSON preset' }];
  // Fake: tag the answer by whether the skill body was in context, judge scores accordingly.
  const fakeModel = async (messages) => {
    const prompt = messages.map((m) => m.content).join('\n');
    if (prompt.includes('You are grading')) {
      return prompt.includes('WITH-SKILL') ? '{"score":1}' : '{"score":0.2}';
    }
    return prompt.includes('SKILL CONTENT') ? 'WITH-SKILL answer' : 'baseline answer';
  };
  const r = await outcomeAB({ fixtures, skills, samples: 1, callModel: fakeModel });
  assert.ok(r.perFixture[0].lift > 0);
  assert.ok(r.avgLift > 0);
});
