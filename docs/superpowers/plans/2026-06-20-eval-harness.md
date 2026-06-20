# Skill/Rule Eval Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an eval harness that measures whether a skill actually *triggers* and *helps* — not just whether the repo's data is correct — so skill/rule changes can be evaluated, not just syntax-gated.

**Architecture:** One tool, `tools/eval-skills.mjs`, with a pure core (frontmatter parse, static checks, fixture load, response parse) plus a single impure boundary (`callModel`, injected for tests). Three tiers: **Tier 1 static** (deterministic, free, GATES every push via `npm run health` + CI); **Tier 2 trigger** (one model call per fixture decides which skill applies; REPORTS); **Tier 3 outcome A/B** (two completions with/without the skill body + an LLM judge against a rubric; REPORTS). The LLM tiers self-skip (exit 0) when `ANTHROPIC_API_KEY` is absent, so the free path never pays tokens or fails.

**Tech Stack:** Node ESM (`.mjs`, matches `tools/guard.mjs` / `tools/harvest-links.mjs`), zero-dep test runner via `node --test`-style direct asserts (matches `test/*.test.mjs`), `@anthropic-ai/sdk` (new devDep) for the LLM tiers, GitHub Actions for the on-demand CI job.

## Global Constraints

- **Model:** `claude-opus-4-8` (exact string, no date suffix) for both the router-sim and the judge. Verified against the `claude-api` skill on 2026-06-20.
- **Thinking/effort:** Tier-2 router-sim is a cheap classification — `output_config: { effort: "low" }`, no `thinking`. Tier-3 judge — `output_config: { effort: "medium" }`. Never pass `budget_tokens`, `temperature`, `top_p`, `top_k` (all 400 on Opus 4.8).
- **Structured parsing:** use `output_config: { format: { type: "json_schema", schema: ... } }` so the pick/score parse deterministically. Never raw-string-match model output.
- **Determinism boundary:** only `callModel` touches the network. Every pure function is unit-tested with a fake `callModel`; no test spends a token.
- **Self-skip:** if `process.env.ANTHROPIC_API_KEY` is unset/empty, Tiers 2–3 print `skipped (no ANTHROPIC_API_KEY)` and the process exits 0. Only Tier-1 violations (or a `--require-llm` flag in CI) cause a non-zero exit.
- **Frontmatter parser handles YAML block scalars.** At least one skill (`find-docs`) writes `description: >-` with the text on following indented lines (folded scalar). The parser must fold `>`/`>-`/`|`/`|-` continuations into the value, or it mis-reads the description as empty (false error in Tier 1, empty catalog entry in Tier 2). Verified 2026-06-20.
- **Official-skill exemption.** `skills-lock.json` now tracks **only official Anthropic skills** (`frontend-design`, `task-management`) as pristine/un-editable. Tier-1 ERROR checks apply to every other skill (ours + freely-adapted adopted ones); skills listed in `skills-lock.json` are downgraded to warn-only since we don't edit them. Derive the exempt set from `skills-lock.json` (DRY: same file the drift gate uses).
- **Zero web-path impact:** nothing here ships to the deployed site. `tools/`, `test/`, devDeps are all out of the client-side-privacy scope (per `.claude/rules/deploy.md`).
- **Repo conventions:** 2-space indent, single quotes, `#!/usr/bin/env node` shebang on the CLI, pure-core + CLI-dispatch shape (mirror `tools/harvest-links.mjs`).

---

## File Structure

- `tools/eval-skills.mjs` — the tool. Exports pure functions (`loadSkills`, `parseFrontmatter`, `staticChecks`, `loadFixtures`, `routerSim`, `outcomeAB`, `formatReport`) + a CLI dispatcher under an `import.meta`-main guard. Only `callModel` is impure (injected default).
- `test/eval-skills.test.mjs` — unit tests for every pure function, with a fake `callModel`.
- `test/eval/triggers.json` — Tier-2 fixtures: `[{ prompt, expect: [skillId], note }]`.
- `test/eval/outcomes.json` — Tier-3 fixtures: `[{ skill, task, rubric, note }]`.
- `.github/workflows/eval-skills.yml` — `workflow_dispatch` job running Tiers 2–3 with the `ANTHROPIC_API_KEY` secret.
- `package.json` — add `@anthropic-ai/sdk` devDep + `eval` script; add Tier-1 to the existing `health` flow.
- `tools/health.mjs` (or wherever `npm run health` is wired) — add the Tier-1 gate.

---

## Task 1: Static tier (the deterministic gate)

**Files:**
- Create: `tools/eval-skills.mjs` (pure core + Tier-1 CLI only)
- Test: `test/eval-skills.test.mjs`

**Interfaces:**
- Produces: `parseFrontmatter(text) -> { name?, area?, description?, 'allowed-tools'? }`; `loadSkills(rootDir) -> [{ id, dir, name, area, description }]` (id = directory name); `loadOfficial(rootDir) -> Set<string>` (skill ids in `skills-lock.json` = official Anthropic, exempt from errors); `staticChecks(skills, official) -> [{ skill, level: 'error'|'warn', msg }]` (violations on a skill in `official` are emitted as `warn`, never `error`).

- [ ] **Step 1: Write the failing test for `parseFrontmatter`**

```js
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
```

- [ ] **Step 2: Run it to confirm failure**

Run: `node --test test/eval-skills.test.mjs`
Expected: FAIL — `parseFrontmatter` is not exported / module missing.

- [ ] **Step 3: Implement `parseFrontmatter` + `loadSkills`**

```js
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

export function parseFrontmatter(text) {
  const fm = {};
  if (!text.startsWith('---')) return fm;
  const end = text.indexOf('\n---', 3);
  if (end < 0) return fm;
  const lines = text.slice(3, end).split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^([A-Za-z][\w-]*):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    let val = m[2].trim();
    if (/^[|>][+-]?$/.test(val)) {
      // YAML block scalar (>- folds to spaces, |- keeps newlines): gather
      // following blank or more-indented lines as the value.
      const fold = val[0] === '>';
      const body = [];
      while (i + 1 < lines.length && (lines[i + 1].trim() === '' || /^\s/.test(lines[i + 1]))) {
        body.push(lines[++i].replace(/^\s+/, ''));
      }
      val = fold ? body.join(' ').replace(/\s+/g, ' ').trim() : body.join('\n').trim();
    } else {
      val = val.replace(/^["']|["']$/g, '');
    }
    fm[key] = val;
  }
  return fm;
}

export function loadSkills(rootDir) {
  const skillsDir = join(rootDir, '.claude', 'skills');
  const out = [];
  for (const ent of readdirSync(skillsDir, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    let text;
    try {
      text = readFileSync(join(skillsDir, ent.name, 'SKILL.md'), 'utf8');
    } catch {
      continue; // no SKILL.md → not a skill dir
    }
    const fm = parseFrontmatter(text);
    out.push({
      id: ent.name,
      dir: join(skillsDir, ent.name),
      name: fm.name || ent.name,
      area: fm.area || '',
      description: fm.description || '',
    });
  }
  return out.sort((a, b) => a.id.localeCompare(b.id));
}
```

- [ ] **Step 4: Write the failing test for `staticChecks`**

```js
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
```

- [ ] **Step 5: Run it to confirm failure**

Run: `node --test test/eval-skills.test.mjs`
Expected: FAIL — `staticChecks` not defined.

- [ ] **Step 6: Implement `staticChecks`**

```js
const DESC_MIN = 40;   // chars — below this a description can't carry a trigger
const DESC_MAX = 1024; // chars — above this it bloats the always-injected context
const TRIGGER_RE = /\buse (when|this|after|at|before|for|right)\b|\byou must\b/i;

export function loadOfficial(rootDir) {
  try {
    const lock = JSON.parse(readFileSync(join(rootDir, 'skills-lock.json'), 'utf8'));
    return new Set(Object.keys(lock.skills || {}));
  } catch { return new Set(); }
}

export function staticChecks(skills, official = new Set()) {
  const out = [];
  for (const s of skills) {
    // Official (locked) skills are not ours to edit → never error on them.
    const lvl = official.has(s.id) ? 'warn' : 'error';
    if (!s.area) out.push({ skill: s.id, level: lvl, msg: 'missing frontmatter `area:`' });
    if (s.name !== s.id)
      out.push({ skill: s.id, level: lvl, msg: `frontmatter name "${s.name}" ≠ directory "${s.id}"` });
    const d = s.description || '';
    if (d.length < DESC_MIN)
      out.push({ skill: s.id, level: lvl, msg: `description too short (${d.length} < ${DESC_MIN})` });
    if (d.length > DESC_MAX)
      out.push({ skill: s.id, level: lvl, msg: `description too long (${d.length} > ${DESC_MAX})` });
    if (d.length >= DESC_MIN && !TRIGGER_RE.test(d))
      out.push({ skill: s.id, level: 'warn', msg: 'description has no trigger phrasing ("Use when …")' });
  }
  return out;
}
```

- [ ] **Step 7: Run tests to confirm pass**

Run: `node --test test/eval-skills.test.mjs`
Expected: PASS.

- [ ] **Step 8: Add the Tier-1 CLI dispatcher**

Append to `tools/eval-skills.mjs`:

```js
import { fileURLToPath } from 'node:url';

const root = process.cwd();

function runTier1() {
  const skills = loadSkills(root);
  const violations = staticChecks(skills, loadOfficial(root));
  const errors = violations.filter((v) => v.level === 'error');
  const warns = violations.filter((v) => v.level === 'warn');
  for (const v of violations) console.log(`  [${v.level}] ${v.skill}: ${v.msg}`);
  console.log(`tier1: ${skills.length} skills, ${errors.length} errors, ${warns.length} warnings`);
  return errors.length === 0;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const ok = runTier1();
  process.exit(ok ? 0 : 1);
}
```

- [ ] **Step 9: Run Tier 1 against the real repo and confirm it is clean**

Run: `node tools/eval-skills.mjs`
Expected: exit 0, `0 errors` (warnings are acceptable). If a real skill fails, fix that skill's frontmatter — do not weaken the check to pass.

- [ ] **Step 10: Commit**

```bash
git add tools/eval-skills.mjs test/eval-skills.test.mjs
git commit -m "feat(eval): tier-1 static skill-frontmatter gate"
```

---

## Task 2: Fixture schema + loader/validator

**Files:**
- Create: `test/eval/triggers.json`, `test/eval/outcomes.json`
- Modify: `tools/eval-skills.mjs` (add `loadFixtures`)
- Test: `test/eval-skills.test.mjs` (add cases)

**Interfaces:**
- Consumes: nothing from earlier tasks.
- Produces: `loadFixtures(path, kind) -> array` where `kind` is `'triggers'` or `'outcomes'`; throws `Error` with a clear message on a malformed fixture (missing/empty required fields, wrong types). Trigger item shape `{ prompt: string, expect: string[], note?: string }`; outcome item shape `{ skill: string, task: string, rubric: string, note?: string }`.

- [ ] **Step 1: Seed `test/eval/triggers.json` (small, high-value skills)**

```json
[
  { "prompt": "Add a new neon-pink look to the visualizer", "expect": ["new-preset"], "note": "explicit look-creation intent" },
  { "prompt": "The frame rate tanks on my phone, what render scale should I use?", "expect": ["perf-budget"], "note": "mobile perf budget" },
  { "prompt": "I want to build a preset cross-fade feature — help me think it through first", "expect": ["brainstorming"], "note": "design-before-implement" }
]
```

- [ ] **Step 2: Seed `test/eval/outcomes.json`**

```json
[
  {
    "skill": "new-preset",
    "task": "Add a new look called 'ember' to primordial with a warm orange palette.",
    "rubric": "A correct answer creates a params-only JSON preset in src/looks/, registers it in the look registry, and does NOT author a new shader (all looks share the slime shader). It should mention { id, name, description, params }.",
    "note": "tests that the skill body steers toward data-not-code"
  }
]
```

- [ ] **Step 3: Write the failing test for `loadFixtures`**

```js
import { loadFixtures } from '../tools/eval-skills.mjs';

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
```

- [ ] **Step 4: Run it to confirm failure**

Run: `node --test test/eval-skills.test.mjs`
Expected: FAIL — `loadFixtures` not defined.

- [ ] **Step 5: Implement `loadFixtures` (+ a `fromString` helper for tests)**

```js
function validateFixtures(items, kind) {
  if (!Array.isArray(items)) throw new Error(`${kind}: fixture root must be an array`);
  items.forEach((it, i) => {
    if (kind === 'triggers') {
      if (typeof it.prompt !== 'string' || !it.prompt.trim())
        throw new Error(`triggers[${i}]: missing non-empty "prompt"`);
      if (!Array.isArray(it.expect) || it.expect.length < 1 || it.expect.some((e) => typeof e !== 'string'))
        throw new Error(`triggers[${i}]: "expect" must be a non-empty string[]`);
    } else if (kind === 'outcomes') {
      for (const f of ['skill', 'task', 'rubric']) {
        if (typeof it[f] !== 'string' || !it[f].trim())
          throw new Error(`outcomes[${i}]: missing non-empty "${f}"`);
      }
    } else {
      throw new Error(`unknown fixture kind: ${kind}`);
    }
  });
  return items;
}

export function loadFixtures(path, kind) {
  return validateFixtures(JSON.parse(readFileSync(join(root, path), 'utf8')), kind);
}
loadFixtures.fromString = (str, kind) => validateFixtures(JSON.parse(str), kind);
```

- [ ] **Step 6: Run tests to confirm pass**

Run: `node --test test/eval-skills.test.mjs`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add tools/eval-skills.mjs test/eval/triggers.json test/eval/outcomes.json test/eval-skills.test.mjs
git commit -m "feat(eval): fixture schema + validating loader"
```

---

## Task 3: Model boundary + Tier 2 (trigger router-sim)

**Files:**
- Modify: `tools/eval-skills.mjs` (add `callModel`, `routerSim`, `parsePick`)
- Modify: `package.json` (add `@anthropic-ai/sdk` devDep)
- Test: `test/eval-skills.test.mjs` (add cases with a fake `callModel`)

**Interfaces:**
- Consumes: `loadSkills` (Task 1), `loadFixtures` (Task 2).
- Produces: `routerSim({ skills, fixtures, samples, callModel }) -> { perFixture: [{ prompt, expect, picks: string[], hits: number, rate: number }], hitRate: number }`. `callModel(messages, opts) -> Promise<string>` returns the model's raw JSON text. `parsePick(text, validIds) -> string|null` (the chosen skill id, or null for "none").

- [ ] **Step 1: Add the SDK devDep**

Run: `npm install --save-dev @anthropic-ai/sdk`
Expected: `package.json` devDependencies now lists `@anthropic-ai/sdk`; `package-lock.json` updated.

- [ ] **Step 2: Write the failing test for `routerSim` with a fake model**

```js
import { routerSim, parsePick } from '../tools/eval-skills.mjs';

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
```

- [ ] **Step 3: Run it to confirm failure**

Run: `node --test test/eval-skills.test.mjs`
Expected: FAIL — `routerSim` / `parsePick` not defined.

- [ ] **Step 4: Implement `parsePick`, `routerSim`, and the default `callModel`**

```js
export function parsePick(text, validIds) {
  let obj;
  try { obj = JSON.parse(text); } catch { return null; }
  const pick = obj && typeof obj.skill === 'string' ? obj.skill : null;
  if (!pick || pick === 'none') return null;
  return validIds.includes(pick) ? pick : null;
}

const PICK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { skill: { type: 'string' } },
  required: ['skill'],
};

export async function defaultCallModel(messages, opts = {}) {
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const client = new Anthropic(); // reads ANTHROPIC_API_KEY
  const res = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 1024,
    output_config: { effort: opts.effort || 'low', format: opts.format },
    messages,
  });
  return res.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
}

export async function routerSim({ skills, fixtures, samples = 3, callModel = defaultCallModel }) {
  const ids = skills.map((s) => s.id);
  const catalog = skills.map((s) => `- ${s.id}: ${s.description}`).join('\n');
  const perFixture = [];
  for (const fx of fixtures) {
    const picks = [];
    for (let i = 0; i < samples; i++) {
      const text = await callModel(
        [{
          role: 'user',
          content:
            `You route a user request to at most one skill. Available skills:\n${catalog}\n\n` +
            `User request: "${fx.prompt}"\n\n` +
            `Reply ONLY with JSON {"skill":"<id>"} or {"skill":"none"}.`,
        }],
        { effort: 'low', format: { type: 'json_schema', schema: PICK_SCHEMA } },
      );
      picks.push(parsePick(text, ids));
    }
    const hits = picks.filter((p) => p && fx.expect.includes(p)).length;
    perFixture.push({ prompt: fx.prompt, expect: fx.expect, picks, hits, rate: hits / samples });
  }
  const hitRate = perFixture.reduce((a, f) => a + f.rate, 0) / (perFixture.length || 1);
  return { perFixture, hitRate };
}
```

- [ ] **Step 5: Run tests to confirm pass**

Run: `node --test test/eval-skills.test.mjs`
Expected: PASS (no token spent — fake `callModel`).

- [ ] **Step 6: Commit**

```bash
git add tools/eval-skills.mjs package.json package-lock.json test/eval-skills.test.mjs
git commit -m "feat(eval): tier-2 trigger router-sim with injected model boundary"
```

---

## Task 4: Tier 3 (outcome A/B proxy + judge)

**Files:**
- Modify: `tools/eval-skills.mjs` (add `outcomeAB`)
- Test: `test/eval-skills.test.mjs` (add a case with fake model + judge)

**Interfaces:**
- Consumes: `loadSkills` (Task 1, to read a skill's full body), `loadFixtures` (Task 2).
- Produces: `outcomeAB({ fixtures, skills, samples, callModel })` →
  `{ perFixture: [{ skill, task, withScore, withoutScore, lift }], avgLift }`.
  `withScore`/`withoutScore` are mean judge scores in `[0,1]`; `lift = withScore - withoutScore`.
- Reuses `defaultCallModel` from Task 3 (the judge uses `effort: 'medium'` and a score schema).

- [ ] **Step 1: Write the failing test for `outcomeAB`**

```js
import { outcomeAB } from '../tools/eval-skills.mjs';

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
```

- [ ] **Step 2: Run it to confirm failure**

Run: `node --test test/eval-skills.test.mjs`
Expected: FAIL — `outcomeAB` not defined.

- [ ] **Step 3: Implement `outcomeAB`**

```js
const SCORE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { score: { type: 'number' } },
  required: ['score'],
};

function parseScore(text) {
  try {
    const n = JSON.parse(text).score;
    return typeof n === 'number' && n >= 0 && n <= 1 ? n : null;
  } catch { return null; }
}

async function completion(callModel, task, skillBody) {
  const ctx = skillBody ? `SKILL CONTENT (apply if relevant):\n${skillBody}\n\n` : '';
  return callModel([{ role: 'user', content: `${ctx}Task: ${task}` }], { effort: 'medium' });
}

async function judge(callModel, task, rubric, answer, tag) {
  const text = await callModel(
    [{
      role: 'user',
      content:
        `You are grading an answer (variant ${tag}) against a rubric. Score 0..1.\n\n` +
        `Task: ${task}\nRubric: ${rubric}\n\nAnswer:\n${answer}\n\n` +
        `Reply ONLY with JSON {"score":<number 0..1>}.`,
    }],
    { effort: 'medium', format: { type: 'json_schema', schema: SCORE_SCHEMA } },
  );
  return parseScore(text);
}

export async function outcomeAB({ fixtures, skills, samples = 1, callModel = defaultCallModel }) {
  const byId = new Map(skills.map((s) => [s.id, s]));
  const perFixture = [];
  for (const fx of fixtures) {
    const skill = byId.get(fx.skill);
    if (!skill) throw new Error(`outcomes fixture references unknown skill "${fx.skill}"`);
    const body = readFileSync(join(root, skill.dir, 'SKILL.md'), 'utf8');
    let withSum = 0, withoutSum = 0;
    for (let i = 0; i < samples; i++) {
      const a1 = await completion(callModel, fx.task, body);
      const a0 = await completion(callModel, fx.task, null);
      withSum += (await judge(callModel, fx.task, fx.rubric, a1, 'WITH-SKILL')) ?? 0;
      withoutSum += (await judge(callModel, fx.task, fx.rubric, a0, 'NO-SKILL')) ?? 0;
    }
    const withScore = withSum / samples;
    const withoutScore = withoutSum / samples;
    perFixture.push({ skill: fx.skill, task: fx.task, withScore, withoutScore, lift: withScore - withoutScore });
  }
  const avgLift = perFixture.reduce((a, f) => a + f.lift, 0) / (perFixture.length || 1);
  return { perFixture, avgLift };
}
```

Note: the test's fake `skill.dir` points at the real `.claude/skills/new-preset` dir, so `readFileSync` succeeds — keep that dir in the fixture.

- [ ] **Step 4: Run tests to confirm pass**

Run: `node --test test/eval-skills.test.mjs`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add tools/eval-skills.mjs test/eval-skills.test.mjs
git commit -m "feat(eval): tier-3 outcome A/B proxy with LLM judge"
```

---

## Task 5: CLI dispatcher (unify tiers, self-skip, report)

**Files:**
- Modify: `tools/eval-skills.mjs` (replace the Task-1 `import.meta`-main block with a full dispatcher; add `formatReport`)
- Modify: `package.json` (add `"eval"` script)
- Test: `test/eval-skills.test.mjs` (add a `formatReport` case)

**Interfaces:**
- Consumes: everything above.
- Produces: CLI `node tools/eval-skills.mjs [--tier 1|2|3|all] [--samples N]`. Default `--tier 1`. `formatReport(kind, result) -> string`.

- [ ] **Step 1: Write the failing test for `formatReport`**

```js
import { formatReport } from '../tools/eval-skills.mjs';

test('formatReport renders a trigger hit-rate summary', () => {
  const out = formatReport('triggers', {
    perFixture: [{ prompt: 'add a look', expect: ['new-preset'], hits: 2, rate: 0.67 }],
    hitRate: 0.67,
  });
  assert.match(out, /hitRate/i);
  assert.match(out, /new-preset/);
});
```

- [ ] **Step 2: Run it to confirm failure**

Run: `node --test test/eval-skills.test.mjs`
Expected: FAIL — `formatReport` not defined.

- [ ] **Step 3: Implement `formatReport` + the full dispatcher**

```js
export function formatReport(kind, result) {
  const lines = [];
  if (kind === 'triggers') {
    for (const f of result.perFixture)
      lines.push(`  [${(f.rate * 100).toFixed(0)}%] ${f.expect.join('|')} — "${f.prompt}"`);
    lines.push(`tier2 hitRate: ${(result.hitRate * 100).toFixed(0)}%`);
  } else {
    for (const f of result.perFixture)
      lines.push(`  ${f.skill}: with=${f.withScore.toFixed(2)} without=${f.withoutScore.toFixed(2)} lift=${f.lift.toFixed(2)}`);
    lines.push(`tier3 avgLift: ${result.avgLift.toFixed(2)}`);
  }
  return lines.join('\n');
}

function parseArgs(argv) {
  const a = { tier: '1', samples: 3 };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--tier') a.tier = argv[++i];
    else if (argv[i] === '--samples') a.samples = Number(argv[++i]);
  }
  return a;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const skills = loadSkills(root);
  let ok = true;

  if (args.tier === '1' || args.tier === 'all') {
    ok = runTier1() && ok;
  }
  const wantLLM = args.tier === '2' || args.tier === '3' || args.tier === 'all';
  if (wantLLM && !process.env.ANTHROPIC_API_KEY) {
    console.log('tiers 2–3: skipped (no ANTHROPIC_API_KEY)');
    return ok;
  }
  if (args.tier === '2' || args.tier === 'all') {
    const r = await routerSim({ skills, fixtures: loadFixtures('test/eval/triggers.json', 'triggers'), samples: args.samples });
    console.log(formatReport('triggers', r));
  }
  if (args.tier === '3' || args.tier === 'all') {
    const r = await outcomeAB({ skills, fixtures: loadFixtures('test/eval/outcomes.json', 'outcomes'), samples: 1 });
    console.log(formatReport('outcomes', r));
  }
  return ok;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().then((ok) => process.exit(ok ? 0 : 1)).catch((e) => { console.error(e); process.exit(2); });
}
```

Replace the Task-1 `import.meta`-main block with this `main()` + guard (keep the `runTier1` function from Task 1).

- [ ] **Step 4: Add the `eval` script to package.json**

```json
"eval": "node tools/eval-skills.mjs"
```

- [ ] **Step 5: Run the full suite + Tier-1 CLI**

Run: `node --test test/eval-skills.test.mjs && node tools/eval-skills.mjs`
Expected: tests PASS; Tier-1 prints `0 errors`, exit 0. `node tools/eval-skills.mjs --tier all` (no key) prints the skip line and exits 0.

- [ ] **Step 6: Commit**

```bash
git add tools/eval-skills.mjs package.json test/eval-skills.test.mjs
git commit -m "feat(eval): unified CLI dispatcher with tier selection + self-skip"
```

---

## Task 6: Wire Tier-1 into health + on-demand CI for Tiers 2–3

**Files:**
- Modify: the `npm run health` entry (`tools/health.mjs` or `package.json` `health` script — read it first to match the existing pattern)
- Modify: `test/*` runner glob if the repo runs tests by explicit list (check `package.json` test script + `.github/workflows/verify.yml`)
- Create: `.github/workflows/eval-skills.yml`

**Interfaces:**
- Consumes: the Tier-1 CLI (exit code) and the test file.

- [ ] **Step 1: Read the current health + verify wiring**

Run: `sed -n '1,60p' tools/health.mjs; sed -n '1,40p' .github/workflows/verify.yml`
Expected: identify how gates are listed (an array of commands or steps) and how `test/*.test.mjs` is run.

- [ ] **Step 2: Add the Tier-1 gate to `npm run health`**

Add `node tools/eval-skills.mjs` (Tier-1, default) to the health gate list, alongside smoke/audit/docs. Match the existing array/step style exactly — do not restructure the file.

- [ ] **Step 3: Ensure `test/eval-skills.test.mjs` runs in CI**

If `verify.yml` runs an explicit list of test files, add `node --test test/eval-skills.test.mjs` (or extend the glob). If it already globs `test/*.test.mjs`, no change.

- [ ] **Step 4: Run health locally to confirm the gate is green**

Run: `npm run health`
Expected: all gates pass except the known/expected `test/artifacts/render.png` drift (see `.claude/rules/gotchas.md`). The new Tier-1 gate reports `0 errors`.

- [ ] **Step 5: Create `.github/workflows/eval-skills.yml`**

```yaml
name: eval-skills
on:
  workflow_dispatch:
    inputs:
      tier:
        description: 'Tier to run (2, 3, or all)'
        default: 'all'
      samples:
        description: 'Samples per trigger fixture'
        default: '3'
jobs:
  eval:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '20' }
      - run: npm ci
      - name: Run LLM eval tiers
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: node tools/eval-skills.mjs --tier "${{ github.event.inputs.tier }}" --samples "${{ github.event.inputs.samples }}"
```

- [ ] **Step 6: Commit**

```bash
git add tools/health.mjs .github/workflows/eval-skills.yml package.json .github/workflows/verify.yml
git commit -m "ci(eval): gate tier-1 in health; on-demand workflow for tiers 2-3"
```

- [ ] **Step 7: Push**

```bash
git push -u origin claude/onboarding-hxwhw6
```

---

## Self-Review

**Spec coverage:** Tier 1 (static gate) → Tasks 1, 6. Tier 2 (trigger) → Tasks 2, 3. Tier 3 (outcome A/B) → Tasks 2, 4. Injected `callModel` boundary → Task 3. Self-skip on no key → Task 5. CI on-demand + Tier-1 gate → Task 6. Fixtures seeded small (perf-budget, new-preset, brainstorming) → Task 2. Report-not-block for Tiers 2–3 → Tasks 5, 6 (only Tier-1 affects exit/health).

**Type consistency:** `loadSkills` item carries `id`, `dir`, `name`, `area`, `description` — `dir` is used by `outcomeAB` (Task 4) and present from Task 1. `callModel(messages, opts)` signature is identical across `routerSim` and `outcomeAB`. `parsePick`/`parseScore` both tolerate malformed JSON (return null). `formatReport` branches on the same `kind` strings as `loadFixtures`.

**Open follow-ups (out of scope for v1):** expand fixtures to more skills; consider gating Tier-2 hit-rate once it's proven stable; rule-eval (this v1 covers skills — rules don't carry frontmatter, so a rule variant is a later design).

## Execution Handoff

Pre-req before any LLM tier runs in CI: add the `ANTHROPIC_API_KEY` repo secret (Settings → Secrets and variables → Actions). Tiers 1 and the unit tests need no key.
