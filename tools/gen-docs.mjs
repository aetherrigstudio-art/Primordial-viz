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
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
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

// True if a path is gitignored (a deliberately-ignored generated artifact, e.g.
// test/artifacts/render.png). Such paths legitimately don't exist at rest, so the
// drift gate must not flag a doc that references them. `git check-ignore -q` exits
// 0 when ignored, 1 when not (and throws on non-zero → caught as "not ignored").
function isIgnored(relPath) {
  try {
    execFileSync('git', ['check-ignore', '-q', '--', relPath], { cwd: root, stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
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
  ['Deployment', (p) => p.startsWith('deploy/') || p === '.cpanel.yml'],
  ['Vendored libraries', (p) => p.startsWith('vendor/')],
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
    // Skip leading HTML comment block (e.g. <!-- @generated ... -->)
    text = text.replace(/^<!--[\s\S]*?-->\s*/, '');
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
// Skills router — a generated "Skills by area" table kept in sync inside
// .claude/skills-router.md (imported by CLAUDE.md so the always-loaded file stays
// lean), between <!-- @generated-start/end skills:router -->.
// Each skill declares its workflow via a frontmatter `area:` field.
// ---------------------------------------------------------------------------
function listSkillFiles() {
  return listFiles().filter((p) => /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(p));
}

function skillMeta(path) {
  const text = readFileSync(join(root, path), 'utf8');
  const fm = {};
  if (text.startsWith('---')) {
    const end = text.indexOf('\n---', 3);
    if (end > 0) {
      for (const line of text.slice(3, end).split('\n')) {
        const m = line.match(/^([A-Za-z][\w-]*):\s*(.*)$/);
        if (m) fm[m[1].toLowerCase()] = m[2].trim().replace(/^["']|["']$/g, '');
      }
    }
  }
  return {
    name: fm.name || basename(dirname(path)),
    description: fm.description || '',
    area: fm.area || 'general',
  };
}

function buildSkillsRouter() {
  // Compact routing map only (area → skill names). Each skill's full description
  // is already injected into context every session by the harness, so repeating
  // it here would be redundant and would bloat the always-loaded CLAUDE.md — this
  // stays one line per area so it scales to dozens of skills.
  const byArea = new Map();
  for (const s of listSkillFiles().map(skillMeta)) {
    if (!byArea.has(s.area)) byArea.set(s.area, []);
    byArea.get(s.area).push(s.name);
  }
  const lines = [];
  lines.push('**Skills by area** — the routing map (each skill\'s description is injected every session; auto-generated from `.claude/skills/*/SKILL.md` `area:`, refreshed by `/skill-router` or `node tools/gen-docs.mjs`):');
  lines.push('');
  for (const area of [...byArea.keys()].sort()) {
    const names = byArea.get(area).sort().map((n) => `\`${escapeCell(n)}\``).join(', ');
    lines.push(`- **${escapeCell(area)}** — ${names}`);
  }
  return lines.join('\n');
}

// Replace a marked region in a markdown file. If the markers are absent, leave
// the file untouched (safe — never corrupts a hand-written file).
function updateRegion(text, name, body) {
  const re = new RegExp(`(<!-- @generated-start ${name} -->\\n)[\\s\\S]*?(<!-- @generated-end ${name} -->)`);
  if (!re.test(text)) return text;
  return text.replace(re, `$1${body}\n$2`);
}

function routerRegionUpdated(text) {
  return updateRegion(text, 'skills:router', buildSkillsRouter());
}

// ---------------------------------------------------------------------------
// Drift gate — repo-rooted paths referenced in the knowledge docs must exist.
// Conservative by design (zero false positives over correctness): only checks
// backtick-quoted tokens that contain '/', have no glob/placeholder/space, and
// are rooted at a real top-level repo entry. Catches "this file was renamed/
// deleted but a doc still points at it"; intentionally skips bare filenames and
// abstract paths (public_html, band lists like bass/mid/treble) to never
// false-fail CI. Scanned docs: CLAUDE.md, deploy/DEPLOY.md, rules, skills.
// ---------------------------------------------------------------------------
// Skills adopted from the ecosystem (via `npx skills`, tracked in skills-lock.json)
// are third-party — exclude them from the drift gate, which polices OUR authored
// docs, not external content (their example paths can collide with our dir names).
function adoptedSkills() {
  try {
    const lock = JSON.parse(readFileSync(join(root, 'skills-lock.json'), 'utf8'));
    return new Set(Object.keys(lock.skills || {}));
  } catch { return new Set(); }
}

function refDocs() {
  const adopted = adoptedSkills();
  return [
    'CLAUDE.md',
    'ONBOARDING.md',
    'deploy/DEPLOY.md',
    ...listFiles().filter((p) =>
      /^\.claude\/rules\/[^/]+\.md$/.test(p) ||
      (/^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(p) && !adopted.has(p.split('/')[2]))),
  ].filter((p) => existsSync(join(root, p)));
}

function checkRefs() {
  const topLevel = new Set(listFiles().map((p) => p.split('/')[0]));
  const missing = [];
  for (const doc of refDocs()) {
    // Strip fenced code blocks first — their ``` fences otherwise mis-pair the
    // inline-code backtick scan below (and code examples aren't path references).
    const text = readFileSync(join(root, doc), 'utf8').replace(/```[\s\S]*?```/g, '');
    const seen = new Set();
    for (const m of text.matchAll(/`([^`]+)`/g)) {
      const tok = m[1].trim().replace(/\/+$/, '');
      if (!tok.includes('/')) continue;            // skip bare filenames (ambiguous)
      if (/[\s*<>{}()|$~?:,…]/.test(tok)) continue; // skip globs / placeholders / vars / URLs / prose ellipses
      if (!topLevel.has(tok.split('/')[0])) continue; // only paths rooted at a real repo entry
      if (seen.has(tok)) continue;
      seen.add(tok);
      if (!existsSync(join(root, tok)) && !isIgnored(tok)) missing.push(`${doc} → \`${tok}\``);
    }
  }
  return missing;
}

// ---------------------------------------------------------------------------
// AGENTS.md — tool-agnostic mirror of CLAUDE.md for non-Claude harnesses.
// ---------------------------------------------------------------------------
// AGENTS.md: a tool-agnostic mirror of CLAUDE.md so non-Claude harnesses
// (Codex/Cursor/etc.) get the same knowledge. Generated — do not hand-edit.
// Claude-only `@import` lines are converted to plain "See <file>" references.
function buildAgentsMd() {
  const claude = readFileSync(join(root, 'CLAUDE.md'), 'utf8');
  const body = claude
    .replace(/^@(\S+)\s*$/gm, 'See `$1`.')
    .replace(/^(See `[^`]+`\.)\n(#)/gm, '$1\n\n$2');
  return `<!-- @generated from CLAUDE.md by tools/gen-docs.mjs — do not edit. -->\n\n${body}`;
}

// ---------------------------------------------------------------------------
// Main — write/check both documents.
// ---------------------------------------------------------------------------
// Always include the generated docs themselves so the output converges in a
// single pass even before the files exist on disk (keeps --check stable in CI).
const OUTPUTS = ['ENCYCLOPEDIA.md', 'TREE.md', 'AGENTS.md'];
const files = [...new Set([...listFiles(), ...OUTPUTS])].sort();
const docs = [
  ['ENCYCLOPEDIA.md', buildEncyclopedia(files)],
  ['TREE.md', buildTree(files)],
  ['AGENTS.md', buildAgentsMd()],
];
// Generated regions kept in sync inside hand-written files (markdown markers).
const regions = [['.claude/skills-router.md', routerRegionUpdated]];

if (process.argv.includes('--check')) {
  let stale = false;
  for (const [name, content] of docs) {
    let current = '';
    try { current = readFileSync(join(root, name), 'utf8'); } catch { /* missing */ }
    if (current !== content) { console.error(`${name} is stale. Run: node tools/gen-docs.mjs`); stale = true; }
    else console.log(`${name} is up to date.`);
  }
  for (const [name, fn] of regions) {
    let current = '';
    try { current = readFileSync(join(root, name), 'utf8'); } catch { /* missing */ }
    if (fn(current) !== current) { console.error(`${name} generated region is stale. Run: node tools/gen-docs.mjs`); stale = true; }
    else console.log(`${name} (generated region) is up to date.`);
  }
  const missingRefs = checkRefs();
  if (missingRefs.length) {
    console.error('Referenced repo paths are missing (drift) — fix the path or update the doc:');
    for (const r of missingRefs) console.error(`  ${r}`);
    stale = true;
  } else {
    console.log('Referenced repo paths all exist.');
  }
  process.exit(stale ? 1 : 0);
} else {
  for (const [name, content] of docs) {
    writeFileSync(join(root, name), content);
    console.log(`Wrote ${name} (${content.split('\n').length} lines).`);
  }
  for (const [name, fn] of regions) {
    let current = '';
    try { current = readFileSync(join(root, name), 'utf8'); } catch { /* missing */ }
    const next = fn(current);
    if (next !== current) { writeFileSync(join(root, name), next); console.log(`Updated ${name} generated region.`); }
    else console.log(`${name} region already current.`);
  }
  const missingRefs = checkRefs();
  if (missingRefs.length) {
    console.warn('⚠ drift — referenced repo paths missing (fix the path or update the doc):');
    for (const r of missingRefs) console.warn(`  ${r}`);
  }
}
