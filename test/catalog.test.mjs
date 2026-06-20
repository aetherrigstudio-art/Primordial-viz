import { test } from 'node:test';
import assert from 'node:assert/strict';
import { listSkills, getSkill, listAgents, listRules } from '../tools/mcp/lib/catalog.mjs';

test('listSkills returns the in-repo skills with area + description', () => {
  const skills = listSkills();
  assert.ok(skills.length >= 20, `expected many skills, got ${skills.length}`);
  const perf = skills.find((s) => s.id === 'perf-budget');
  assert.ok(perf, 'perf-budget skill present');
  assert.equal(perf.area, 'shaders');
  assert.ok(perf.description.length > 0);
  assert.equal(perf.path, '.claude/skills/perf-budget/SKILL.md');
});

test('getSkill returns the full SKILL.md body', () => {
  const text = getSkill('new-preset');
  assert.match(text, /look/i);
  assert.throws(() => getSkill('no-such-skill'));
});

test('listAgents returns subagents with their tool allowlists', () => {
  const agents = listAgents();
  const ids = agents.map((a) => a.id);
  assert.ok(ids.includes('audio-dsp'));
  assert.ok(ids.includes('visual-qa'));
  const audio = agents.find((a) => a.id === 'audio-dsp');
  assert.deepEqual(audio.tools, ['Read', 'Grep', 'Glob', 'Bash']);
});

test('listRules returns scoped rules with title + governed paths', () => {
  const rules = listRules();
  const shaders = rules.find((r) => r.id === 'shaders');
  assert.ok(shaders, 'shaders rule present');
  assert.match(shaders.paths, /shaders/);
  assert.ok(shaders.title.length > 0);
});
