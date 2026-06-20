#!/usr/bin/env node
// Eval harness for primordial skills — Tier 1: static frontmatter gate.
// Pure core functions + a CLI dispatcher under an import.meta-main guard.
// Tier 2-3 (trigger/help) added in later tasks.

import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

// ---------------------------------------------------------------------------
// parseFrontmatter
// ---------------------------------------------------------------------------

/**
 * Parse YAML-style frontmatter from a markdown string.
 * Handles single-line scalar values, quoted strings, and block scalars (>/|).
 * Returns an object of the parsed key-value pairs (all lowercased keys).
 *
 * @param {string} text
 * @returns {{ name?: string, area?: string, description?: string, [key: string]: string }}
 */
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

// ---------------------------------------------------------------------------
// loadSkills
// ---------------------------------------------------------------------------

/**
 * Load all skills from .claude/skills/<name>/SKILL.md under rootDir.
 * Returns an array sorted by id.
 *
 * @param {string} rootDir
 * @returns {Array<{ id: string, dir: string, name: string, area: string, description: string }>}
 */
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

// ---------------------------------------------------------------------------
// loadOfficial
// ---------------------------------------------------------------------------

/**
 * Read skills-lock.json and return a Set of skill ids that are official
 * (Anthropic-sourced) and therefore exempt from error-level violations.
 *
 * @param {string} rootDir
 * @returns {Set<string>}
 */
export function loadOfficial(rootDir) {
  try {
    const lock = JSON.parse(readFileSync(join(rootDir, 'skills-lock.json'), 'utf8'));
    return new Set(Object.keys(lock.skills || {}));
  } catch { return new Set(); }
}

// ---------------------------------------------------------------------------
// staticChecks
// ---------------------------------------------------------------------------

const DESC_MIN = 40;   // chars — below this a description can't carry a trigger
const DESC_MAX = 1024; // chars — above this it bloats the always-injected context
const TRIGGER_RE = /\buse (when|this|after|at|before|for|right)\b|\byou must\b/i;

/**
 * Run static checks on a list of skills.
 * Violations on skills in `official` are downgraded from 'error' to 'warn'.
 *
 * @param {Array<{ id: string, name: string, area: string, description: string }>} skills
 * @param {Set<string>} official
 * @returns {Array<{ skill: string, level: 'error'|'warn', msg: string }>}
 */
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

// ---------------------------------------------------------------------------
// Root directory (available to all functions)
// ---------------------------------------------------------------------------

const root = process.cwd();

// ---------------------------------------------------------------------------
// validateFixtures
// ---------------------------------------------------------------------------

/**
 * Validate fixture array shape and content.
 * Throws with a clear message if any item is malformed.
 *
 * @param {Array} items
 * @param {'triggers'|'outcomes'} kind
 * @returns {Array} items (if valid)
 */
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

// ---------------------------------------------------------------------------
// loadFixtures
// ---------------------------------------------------------------------------

/**
 * Load and validate a fixture file (triggers or outcomes).
 *
 * @param {string} path - relative path from repo root
 * @param {'triggers'|'outcomes'} kind
 * @returns {Array}
 */
export function loadFixtures(path, kind) {
  return validateFixtures(JSON.parse(readFileSync(join(root, path), 'utf8')), kind);
}
loadFixtures.fromString = (str, kind) => validateFixtures(JSON.parse(str), kind);

// ---------------------------------------------------------------------------
// parsePick / PICK_SCHEMA / defaultCallModel / routerSim  (Tier 2)
// ---------------------------------------------------------------------------

/**
 * Parse a model JSON response and return the chosen skill id, or null.
 * Returns null for "none", an unknown id, or unparseable JSON.
 *
 * @param {string} text  - raw model output
 * @param {string[]} validIds - list of known skill ids
 * @returns {string|null}
 */
export function parsePick(text, validIds) {
  let obj;
  try { obj = JSON.parse(text); } catch { return null; }
  const pick = obj && typeof obj.skill === 'string' ? obj.skill : null;
  if (!pick || pick === 'none') return null;
  return validIds.includes(pick) ? pick : null;
}

/** JSON Schema used as output_config.format so picks parse deterministically. */
const PICK_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { skill: { type: 'string' } },
  required: ['skill'],
};

/**
 * Default model boundary — dynamically imports @anthropic-ai/sdk.
 * Only used when no fake callModel is injected; tests never reach this.
 *
 * @param {Array<{role:string,content:string}>} messages
 * @param {{ effort?: string, format?: object }} [opts]
 * @returns {Promise<string>} raw text from the model
 */
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

/**
 * Simulate the trigger-router: for each fixture, call the model `samples` times
 * and record how often it picks one of the expected skills.
 *
 * @param {{ skills: Array, fixtures: Array, samples?: number, callModel?: Function }} opts
 * @returns {Promise<{ perFixture: Array, hitRate: number }>}
 */
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

// ---------------------------------------------------------------------------
// SCORE_SCHEMA / parseScore / completion / judge / outcomeAB  (Tier 3)
// ---------------------------------------------------------------------------

/** JSON Schema used as output_config.format so judge scores parse deterministically. */
const SCORE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: { score: { type: 'number' } },
  required: ['score'],
};

/**
 * Parse a model JSON response and return a score in [0,1], or null if invalid.
 *
 * @param {string} text - raw model output
 * @returns {number|null}
 */
export function parseScore(text) {
  try {
    const n = JSON.parse(text).score;
    return typeof n === 'number' && n >= 0 && n <= 1 ? n : null;
  } catch { return null; }
}

/**
 * Request a task completion from the model, optionally including the skill body.
 *
 * @param {Function} callModel
 * @param {string} task
 * @param {string|null} skillBody
 * @returns {Promise<string>}
 */
async function completion(callModel, task, skillBody) {
  const ctx = skillBody ? `SKILL CONTENT (apply if relevant):\n${skillBody}\n\n` : '';
  return callModel([{ role: 'user', content: `${ctx}Task: ${task}` }], { effort: 'medium' });
}

/**
 * Ask the model to judge an answer against a rubric; returns a score in [0,1] or null.
 *
 * @param {Function} callModel
 * @param {string} task
 * @param {string} rubric
 * @param {string} answer
 * @param {string} tag - variant label included in the judge prompt
 * @returns {Promise<number|null>}
 */
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

/**
 * Run an outcome A/B proxy: for each fixture, generate a with-skill and without-skill
 * completion, then judge both against the rubric. Returns per-fixture scores and avgLift.
 *
 * @param {{ fixtures: Array, skills: Array, samples?: number, callModel?: Function }} opts
 * @returns {Promise<{ perFixture: Array, avgLift: number }>}
 */
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

// ---------------------------------------------------------------------------
// Tier-1 CLI
// ---------------------------------------------------------------------------

function runTier1() {
  const skills = loadSkills(root);
  const violations = staticChecks(skills, loadOfficial(root));
  const errors = violations.filter((v) => v.level === 'error');
  const warns = violations.filter((v) => v.level === 'warn');
  for (const v of violations) console.log(`  [${v.level}] ${v.skill}: ${v.msg}`);
  console.log(`tier1: ${skills.length} skills, ${errors.length} errors, ${warns.length} warnings`);
  return errors.length === 0;
}

// ---------------------------------------------------------------------------
// formatReport  (Tier 2/3 output)
// ---------------------------------------------------------------------------

/**
 * Render a human-readable summary for tier-2 trigger or tier-3 outcome results.
 *
 * @param {'triggers'|'outcomes'} kind
 * @param {{ perFixture: Array, hitRate?: number, avgLift?: number }} result
 * @returns {string}
 */
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

// ---------------------------------------------------------------------------
// parseArgs / main  (unified CLI dispatcher)
// ---------------------------------------------------------------------------

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
