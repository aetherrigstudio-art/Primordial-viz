#!/usr/bin/env node
// Generates two always-current repo maps from a single source of truth:
//   ENCYCLOPEDIA.md — a categorized index of every file, each with a one-line
//                     description pulled from the file's OWN header (leading
//                     comment, markdown sentence, <title>, or JSON `description`).
//   TREE.md         — a directory tree of every tracked file.
// New files self-document: give a file a header comment and it appears here.
//
//   node tools/gen-docs.mjs           # (re)write ENCYCLOPEDIA.md + TREE.md
//   node tools/gen-docs.mjs --check    # exit 1 if either is stale (CI gate)
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
const REPO = 'Primordial-viz';
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
  ['Desktop / Standalone (Tauri)', (p) => p.startsWith('src-tauri/') || p === 'vite.config.js'],
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
    '.mcp.json': 'Project-scoped MCP server configuration for Claude Code.',
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
// ENCYCLOPEDIA.md — categorized index with descriptions.
// ---------------------------------------------------------------------------
function escapeCell(s) {
  return s.replace(/\|/g, '\\|');
}

function buildEncyclopedia(files) {
  const groups = new Map(CATEGORIES.map(([name]) => [name, []]));
  for (const f of files) groups.get(categorize(f)).push(f);
  const usedCats = CATEGORIES.map(([name]) => name).filter((n) => groups.get(n).length);

  const lines = [];
  lines.push(`# Encyclopedia — ${REPO}`);
  lines.push('');
  lines.push('> **Auto-generated — do not edit by hand.** A categorized index of every');
  lines.push('> file in the repository, each with a one-line description taken from the');
  lines.push("> file's own header (leading comment, first sentence, `<title>`, or a JSON");
  lines.push('> `description` field). Regenerate with `node tools/gen-docs.mjs`; it also');
  lines.push('> refreshes via the PostToolUse hook and is gated in CI. For the directory');
  lines.push('> layout see [`TREE.md`](TREE.md).');
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
// TREE.md — directory tree (dirs first, then files, alphabetical per level).
// ---------------------------------------------------------------------------
function buildTreeData(files) {
  const tree = new Map(); // name -> { dir, children:Map }
  for (const f of files) {
    const parts = f.split('/');
    let node = tree;
    parts.forEach((part, i) => {
      const isDir = i < parts.length - 1;
      if (!node.has(part)) node.set(part, { dir: isDir, children: new Map() });
      const entry = node.get(part);
      if (isDir) entry.dir = true;
      node = entry.children;
    });
  }
  return tree;
}

function renderTree(node, prefix = '') {
  const entries = [...node.entries()].sort((a, b) => {
    if (a[1].dir !== b[1].dir) return a[1].dir ? -1 : 1; // directories first
    return a[0].localeCompare(b[0]);
  });
  const out = [];
  entries.forEach(([name, entry], idx) => {
    const last = idx === entries.length - 1;
    out.push(`${prefix}${last ? '└── ' : '├── '}${name}${entry.dir ? '/' : ''}`);
    if (entry.dir) out.push(...renderTree(entry.children, prefix + (last ? '    ' : '│   ')));
  });
  return out;
}

function buildTree(files) {
  const dirs = new Set();
  for (const f of files) {
    const parts = f.split('/');
    for (let i = 1; i < parts.length; i++) dirs.add(parts.slice(0, i).join('/'));
  }
  const lines = [];
  lines.push(`# File Tree — ${REPO}`);
  lines.push('');
  lines.push('> **Auto-generated — do not edit by hand.** The directory layout of every');
  lines.push('> tracked file. Regenerate with `node tools/gen-docs.mjs`; it also refreshes');
  lines.push('> via the PostToolUse hook and is gated in CI. For per-file descriptions see');
  lines.push('> [`ENCYCLOPEDIA.md`](ENCYCLOPEDIA.md).');
  lines.push('>');
  lines.push(`> ${files.length} files in ${dirs.size} directories.`);
  lines.push('');
  lines.push('```');
  lines.push(`${REPO}/`);
  lines.push(...renderTree(buildTreeData(files)));
  lines.push('```');
  return lines.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main — write/check both documents.
// ---------------------------------------------------------------------------
// Always include the generated docs themselves so the output converges in a
// single pass even before the files exist on disk (keeps --check stable in CI).
const OUTPUTS = ['ENCYCLOPEDIA.md', 'TREE.md'];
const files = [...new Set([...listFiles(), ...OUTPUTS])].sort();
const docs = [
  ['ENCYCLOPEDIA.md', buildEncyclopedia(files)],
  ['TREE.md', buildTree(files)],
];

if (process.argv.includes('--check')) {
  let stale = false;
  for (const [name, content] of docs) {
    let current = '';
    try { current = readFileSync(join(root, name), 'utf8'); } catch { /* missing */ }
    if (current !== content) { console.error(`${name} is stale. Run: node tools/gen-docs.mjs`); stale = true; }
    else console.log(`${name} is up to date.`);
  }
  process.exit(stale ? 1 : 0);
} else {
  for (const [name, content] of docs) {
    writeFileSync(join(root, name), content);
    console.log(`Wrote ${name} (${content.split('\n').length} lines).`);
  }
}
