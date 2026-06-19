#!/usr/bin/env node
// Self-auditing config gate: assert the always-on config invariants that have
// silently drifted before (CLAUDE.md size, the generated router markers, settings JSON).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fail = (msg) => { console.error(`config gate: ${msg}`); process.exit(1); };

// 1. CLAUDE.md line cap (always-loaded file must stay lean).
const CAP = 200;
const lines = readFileSync(join(root, 'CLAUDE.md'), 'utf8').split('\n');
const n = lines[lines.length - 1] === '' ? lines.length - 1 : lines.length;
if (n > CAP) fail(`CLAUDE.md is ${n} lines (cap ${CAP}). Trim it or move prose to a .claude/rules/* file.`);

// 2. The generated skills:router region markers must exist.
const router = readFileSync(join(root, '.claude/skills-router.md'), 'utf8');
if (!router.includes('@generated-start skills:router') || !router.includes('@generated-end skills:router'))
  fail('.claude/skills-router.md is missing the @generated skills:router markers.');

// 3. settings.json must be valid JSON.
try { JSON.parse(readFileSync(join(root, '.claude/settings.json'), 'utf8')); }
catch (e) { fail(`.claude/settings.json is not valid JSON: ${e.message}`); }

console.log(`config gate OK (CLAUDE.md ${n}/${CAP} lines; router markers present; settings.json valid).`);
