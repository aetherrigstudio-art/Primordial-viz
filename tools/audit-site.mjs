#!/usr/bin/env node
// Audit the DEPLOYED surface (index.html + src/) for AI "tells" a visitor could
// see via View-Source. Flags em/en dashes (a well-known AI-writing fingerprint;
// prefer a plain hyphen) and AI/tooling references. Exits 1 on any finding so it
// can gate CI. Scope = only what deploys (deploy.yml stages `index.html src`);
// local tooling (.claude/, tools/, test/) is never served and is out of scope.
//
//   node tools/audit-site.mjs     (or: npm run audit)

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { join, dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function deployedFiles() {
  return execFileSync('git', ['ls-files', 'index.html', 'src'], { cwd: root, encoding: 'utf8' })
    .split('\n').map((s) => s.trim()).filter(Boolean);
}

// label -> regex. Em/en dash are the AI-writing tell; the rest are fingerprints.
const CHECKS = [
  ['em dash (AI tell; use "-")', /—/],
  ['en dash (AI tell; use "-")', /–/],
  ['AI/tooling fingerprint', /\b(claude|anthropic|openai|copilot|mcp)\b|generated (by|with)|co-authored/i],
];

const findings = [];
for (const f of deployedFiles()) {
  let text = '';
  try { text = readFileSync(join(root, f), 'utf8'); } catch { continue; }
  text.split('\n').forEach((line, i) => {
    for (const [label, re] of CHECKS) {
      if (re.test(line)) findings.push(`  ${f}:${i + 1}  [${label}]  ${line.trim().slice(0, 90)}`);
    }
  });
}

if (findings.length) {
  console.error(`Site audit: ${findings.length} finding(s) in the deployed surface (index.html + src/):`);
  findings.forEach((x) => console.error(x));
  console.error('Fix: replace em/en dashes with "-"; reword AI/tooling references.');
  process.exit(1);
}
console.log('Site audit clean: no AI tells or tooling fingerprints in index.html + src/.');
