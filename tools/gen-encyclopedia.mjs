#!/usr/bin/env node
// Generates ENCYCLOPEDIA.md — a categorized index of every file in the repo,
// each with a one-line description pulled from the file's OWN header (leading
// comment, markdown heading/sentence, <title>, or a JSON `description` field).
// New files self-document: give a file a header comment and it appears here.
//
//   node tools/gen-encyclopedia.mjs           # (re)write ENCYCLOPEDIA.md
//   node tools/gen-encyclopedia.mjs --check    # exit 1 if ENCYCLOPEDIA.md is stale
//
// Zero runtime dependencies (Node stdlib only). The file list comes from git so
// it tracks exactly what's version-controlled (respects .gitignore) plus any
// new, not-yet-committed files. Deterministic output → safe as a CI gate.

import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname, basename } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const OUT = 'ENCYCLOPEDIA.md';
const MAXLEN = 150; // max description length before ellipsis

// ---------------------------------------------------------------------------
// File enumeration: tracked + untracked-but-not-ignored, sorted, stable.
// ---------------------------------------------------------------------------
function listFiles() {
  const out = execFileSync(
    'git',
    ['ls-files', '--cached', '--others', '--exclude-standard'],
    { cwd: root, encoding: 'utf8' },
  );
  return [...new Set(out.split('\n').map((s) => s.trim()).filter(Boolean))].sort();
}

// ---------------------------------------------------------------------------
// Categories — first match wins; order defines section order in the output.
// ---------------------------------------------------------------------------
const CATEGORIES = [
  ['Overview & Planning', (p) => !p.includes('/') && /\.(md|txt)$/i.test(p) || p === 'LICENSE'],
  ['Specs & Long-form Docs', (p) => p.startsWith('docs/')],
  ['App — Entry & Bootstrap', (p) => p === 'index.html' || p === 'src/main.js'],
  ['App — Audio', (p) => p.startsWith('src/audio/')],
  ['App — Graphics / WebGL', (p) => p.startsWith('src/gl/')],
  ['App — Shaders (GLSL)', (p) => p.startsWith('src/shaders/')],
  ['App — Looks / Presets', (p) => p.startsWith('src/looks/')],
  ['App — Params / State', (p) => p.startsWith('src/params/')],
  ['App — UI', (p) => p.startsWith('src/ui/')],
  ['App — Other source', (p) => p.startsWith('src/')],
  ['Tests & Verification', (p) => p.startsWith('test/')],
  ['Tooling / Scripts', (p) => p.startsWith('tools/')],
  ['Claude Environment', (p) => p.startsWith('.claude/')],
  ['Deployment', (p) => p.startsWith('deploy/')],
  ['Research', (p) => p.startsWith('research/')],
  ['CI / Build Config', (p) => p.startsWith('.github/') || /^(package(-lock)?\.json|\.gitignore|\.mcp\.json|\.editorconfig)$/.test(p)],
  ['Other', () => true],
];

function categorize(p) {
  for (const [name, test] of CATEGORIES) if (test(p)) return name;
  return 'Other';
}

// ---------------------------------------------------------------------------
// Description extraction.
// ---------------------------------------------------------------------------
function tidy(s) {
  s = (s || '').replace(/\s+/g, ' ').trim();
  if (s.length > MAXLEN) s = s.slice(0, MAXLEN - 1).replace(/\s+\S*$/, '') + '…';
  return s;
}

function firstSentence(s) {
  const m = s.match(/^(.*?[.!?])(\s|$)/);
  return m ? m[1] : s;
}

// Collect a leading comment block given the line-comment prefixes and whether
// /* ... */ block comments apply. Stops at the first blank line or real code.
function leadingComment(text, linePrefixes, allowBlock) {
  const lines = text.split('\n');
  let i = lines[0] && lines[0].startsWith('#!') ? 1 : 0; // skip shebang
  const out = [];
  let inBlock = false;
  for (; i < lines.length && out.length < 10; i++) {
    let l = lines[i].trim();
    if (inBlock) {
      const end = l.includes('*/');
      l = l.replace(/\*\/.*$/, '').replace(/^\*+/, '').trim();
      if (l) out.push(l);
      if (end) break;
      continue;
    }
    if (!l) { if (out.length) break; continue; }
    if (allowBlock && l.startsWith('/*')) {
      const end = l.includes('*/');
      l = l.replace(/^\/\*+/, '').replace(/\*\/.*$/, '').replace(/^\*+/, '').trim();
      if (l) out.push(l);
      if (end) break;
      inBlock = true;
      continue;
    }
    const pref = linePrefixes.find((p) => l.startsWith(p));
    if (pref) { out.push(l.slice(pref.length).trim()); continue; }
    break; // first non-comment, non-blank line → stop
  }
  return out.join(' ').trim();
}

function describe(relPath, text) {
  const ext = extname(relPath).toLowerCase();

  // Markdown: prefer a YAML-frontmatter `description:` (agents/skills carry one);
  // otherwise the first prose paragraph's first sentence, else the H1. Skips
  // headings, list/table rows, indented continuations, and standalone bold
  // labels (e.g. "**Did:**" in a log) so the description is the informative line.
  if (ext === '.md') {
    let lines = text.split('\n');
    if (lines[0].trim() === '---') {
      const end = lines.indexOf('---', 1);
      if (end > 0) {
        const d = lines.slice(1, end).find((x) => /^description:\s*\S/i.test(x));
        if (d) return tidy(d.replace(/^description:\s*/i, '').replace(/^["']|["']$/g, ''));
        lines = lines.slice(end + 1); // drop non-description frontmatter (e.g. paths:)
      }
    }
    let h1 = '';
    const para = [];
    for (const raw of lines) {
      let l = raw.trim();
      if (!l) { if (para.length) break; continue; }
      if (l.startsWith('#')) { if (!h1) h1 = l.replace(/^#+\s*/, '').replace(/[`*]/g, ''); if (para.length) break; continue; }
      if (!para.length && /^\s/.test(raw)) continue; // indented list/code continuation
      l = l.replace(/^>\s*/, '').replace(/[`*]/g, '').trim();
      if (!para.length) {
        if (/^[-*|]/.test(l)) continue;            // list / table row
        if (/:$/.test(firstSentence(l))) continue; // standalone label
      }
      para.push(l);
    }
    return tidy(firstSentence(para.join(' '))) || tidy(h1) || fallback(relPath);
  }

  // JSON: use an embedded `description`, else fall back by name.
  if (ext === '.json') {
    try {
      const j = JSON.parse(text);
      if (j && typeof j.description === 'string' && j.description) return tidy(j.description);
    } catch { /* not parseable → fallback */ }
    return fallback(relPath);
  }

  // HTML: the <title>.
  if (ext === '.html' || ext === '.htm') {
    const m = text.match(/<title>([^<]+)<\/title>/i);
    if (m) return tidy(m[1]);
    return tidy(leadingComment(text, [], false)) || fallback(relPath);
  }

  let desc = '';
  if (['.js', '.mjs', '.cjs', '.css', '.glsl', '.ts'].includes(ext)) {
    desc = leadingComment(text, ['//'], true);
  } else if (['.sh', '.bash', '.py', '.yml', '.yaml', '.conf', '.toml', '.htaccess'].includes(ext) || basename(relPath) === '.gitignore') {
    desc = leadingComment(text, ['#'], false);
  } else {
    desc = leadingComment(text, ['//', '#'], true);
  }
  desc = tidy(firstSentence(desc));
  return desc || fallback(relPath);
}

// Last-resort descriptions for files with no extractable header.
function fallback(relPath) {
  const known = {
    'LICENSE': 'Software license for the project.',
    'package.json': 'npm manifest — scripts + dev dependencies only (the app runtime stays zero-dependency).',
    'package-lock.json': 'Locked dependency tree for reproducible dev-tool installs.',
    '.gitignore': 'Paths excluded from version control.',
    '.claude/settings.json': 'Claude Code hooks + permissions for this repo.',
    '.github/workflows/verify.yml': 'CI: syntax-check, smoke test, and headless render check on every push.',
  };
  if (known[relPath]) return known[relPath];
  const byExt = {
    '.json': 'Configuration / data file.', '.yml': 'CI / workflow configuration.',
    '.yaml': 'YAML configuration.', '.png': 'Image asset.', '.jpg': 'Image asset.',
    '.svg': 'Vector image asset.', '.ico': 'Icon asset.', '.css': 'Stylesheet.',
    '.htaccess': 'Apache/LiteSpeed server configuration.', '.sh': 'Shell script.',
    '.py': 'Python script.', '.txt': 'Plain-text notes.',
  };
  const e = extname(relPath).toLowerCase();
  return byExt[e] || `${e ? e.slice(1).toUpperCase() + ' file' : 'File'}.`;
}

function descriptionFor(relPath) {
  let text = '';
  try { text = readFileSync(join(root, relPath), 'utf8'); }
  catch { return fallback(relPath); }
  // Skip binary-ish content.
  if (text.includes('\u0000')) return fallback(relPath);
  return describe(relPath, text);
}

// ---------------------------------------------------------------------------
// Render the document.
// ---------------------------------------------------------------------------
function escapeCell(s) {
  return s.replace(/\|/g, '\\|');
}

function build() {
  const files = listFiles();
  const groups = new Map(CATEGORIES.map(([name]) => [name, []]));
  for (const f of files) groups.get(categorize(f)).push(f);

  const usedCats = CATEGORIES.map(([name]) => name).filter((n) => groups.get(n).length);

  const lines = [];
  lines.push('# Encyclopedia — Primordial-viz');
  lines.push('');
  lines.push('> **Auto-generated — do not edit by hand.** A categorized index of every');
  lines.push('> file in the repository, each with a one-line description taken from the');
  lines.push("> file's own header (leading comment, first sentence, `<title>`, or a JSON");
  lines.push('> `description` field). Regenerate with `node tools/gen-encyclopedia.mjs`;');
  lines.push('> it also refreshes via the PostToolUse hook and is gated in CI.');
  lines.push('>');
  lines.push(`> ${files.length} files across ${usedCats.length} categories.`);
  lines.push('');
  lines.push('## Contents');
  for (const name of usedCats) {
    const anchor = name.toLowerCase().replace(/[^\w\- ]/g, '').replace(/ /g, '-');
    lines.push(`- [${name}](#${anchor}) (${groups.get(name).length})`);
  }
  lines.push('');

  for (const name of usedCats) {
    lines.push(`## ${name}`);
    lines.push('');
    lines.push('| File | Description |');
    lines.push('| --- | --- |');
    for (const f of groups.get(name)) {
      lines.push(`| [\`${f}\`](${f}) | ${escapeCell(descriptionFor(f))} |`);
    }
    lines.push('');
  }
  return lines.join('\n').replace(/\n+$/, '\n');
}

// ---------------------------------------------------------------------------
// Main.
// ---------------------------------------------------------------------------
const outPath = join(root, OUT);
const content = build();

if (process.argv.includes('--check')) {
  let current = '';
  try { current = readFileSync(outPath, 'utf8'); } catch { /* missing */ }
  if (current !== content) {
    console.error(`${OUT} is stale. Run: node tools/gen-encyclopedia.mjs`);
    process.exit(1);
  }
  console.log(`${OUT} is up to date.`);
} else {
  writeFileSync(outPath, content);
  console.log(`Wrote ${OUT} (${content.split('\n').length} lines).`);
}
