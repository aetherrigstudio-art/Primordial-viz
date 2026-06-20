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
// Tier-1 CLI
// ---------------------------------------------------------------------------

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
