// Project continuity/state: parse the committed handoff log (progress.md) into
// structured data so an assistant can query "what's the current state / open
// threads / next step / recent lessons" on demand — not just at SessionStart.
//
// This is the single source of truth for that parsing: the SessionStart
// orient.sh hook calls this module (with an inline-bash fallback), so the hook
// and the MCP tools can never drift. The committed files stay canonical; this
// only reads them.
//
//   node tools/mcp/lib/state.mjs status
//   node tools/mcp/lib/state.mjs threads
//   node tools/mcp/lib/state.mjs lessons [n]

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

function readProgress() {
  try {
    return readFileSync(join(root, 'progress.md'), 'utf8');
  } catch {
    return '';
  }
}

// Newest session entry = the first '## ' heading that isn't the Open-threads
// section (newest entries are kept at the TOP of progress.md, above Open
// threads). Returns { title, body } or null. Mirrors orient.sh.
export function latestHandoff(text = readProgress()) {
  const lines = text.split('\n');
  let start = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^##\s/.test(lines[i]) && !/open threads/i.test(lines[i])) { start = i; break; }
  }
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^##\s/.test(lines[i])) { end = i; break; }
  }
  const title = lines[start].replace(/^##\s*/, '').trim();
  const body = lines.slice(start + 1, end).join('\n').trim();
  return { title, body };
}

// The unchecked '- [ ]' items under the '## Open threads' section. Returns an
// array of { text } (the full bullet line, hyphen/checkbox stripped).
export function openThreads(text = readProgress()) {
  const lines = text.split('\n');
  const out = [];
  let inSection = false;
  for (const line of lines) {
    if (/^##\s+open threads/i.test(line)) { inSection = true; continue; }
    if (inSection && /^##\s/.test(line)) break;
    if (inSection) {
      const m = line.match(/^-\s*\[ \]\s*(.*)$/);
      if (m) out.push({ text: m[1].trim() });
    }
  }
  return out;
}

// The most recent LESSON session headings (case-insensitive '## ... LESSON ...').
// Returns an array of { title }, newest first, capped at n.
export function recentLessons(n = 2, text = readProgress()) {
  const out = [];
  for (const line of text.split('\n')) {
    if (/^##\s/.test(line) && /lesson/i.test(line)) {
      out.push({ title: line.replace(/^##\s*/, '').trim() });
      if (out.length >= n) break;
    }
  }
  return out;
}

// Best-effort git facts; never throws (may run outside a git checkout).
function gitInfo() {
  const git = (args) => {
    try { return execFileSync('git', args, { cwd: root, encoding: 'utf8' }).trim(); }
    catch { return ''; }
  };
  const branch = git(['branch', '--show-current']) || null;
  const porcelain = git(['status', '--porcelain']);
  const dirtyCount = porcelain ? porcelain.split('\n').filter(Boolean).length : 0;
  const recentCommits = (git(['log', '--oneline', '-5']) || '')
    .split('\n').filter(Boolean);
  return { branch, dirtyCount, clean: dirtyCount === 0, recentCommits };
}

// Composite snapshot for a "where are we?" query.
export function projectStatus() {
  const text = readProgress();
  const handoff = latestHandoff(text);
  const threads = openThreads(text);
  const lessons = recentLessons(2, text);
  return {
    ...gitInfo(),
    latestHandoff: handoff ? handoff.title : null,
    openThreadCount: threads.length,
    openThreads: threads.map((t) => t.text),
    recentLessons: lessons.map((l) => l.title),
  };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const args = process.argv.slice(2);
  const flags = new Set(args.filter((a) => a.startsWith('--')));
  const positional = args.filter((a) => !a.startsWith('--'));
  const [cmd, arg] = positional;
  // --stdin lets a caller (e.g. the orient hook reading a cross-branch
  // progress.md via `git show`) parse arbitrary text, not just the local file.
  const text = flags.has('--stdin') ? readFileSync(0, 'utf8') : readProgress();
  if (cmd === 'status') {
    const s = projectStatus();
    console.log(`Branch: ${s.branch ?? '?'} (${s.clean ? 'clean' : s.dirtyCount + ' uncommitted'})`);
    console.log(`Latest handoff: ${s.latestHandoff ?? '(none)'}`);
    console.log(`Open threads: ${s.openThreadCount}`);
    for (const t of s.openThreads) console.log(`  - ${t}`);
    if (s.recentLessons.length) {
      console.log('Recent lessons:');
      for (const l of s.recentLessons) console.log(`  - ${l}`);
    }
  } else if (cmd === 'threads') {
    for (const t of openThreads(text)) console.log(`- ${t.text}`);
  } else if (cmd === 'lessons') {
    for (const l of recentLessons(arg ? parseInt(arg, 10) : 2, text)) console.log(`- ${l.title}`);
  } else if (cmd === 'handoff') {
    const h = latestHandoff(text);
    if (flags.has('--title')) console.log(h ? h.title : '');
    else console.log(h ? `## ${h.title}\n\n${h.body}` : '(no handoff found)');
  } else {
    console.error('usage: state.mjs status | threads | lessons [n] | handoff [--title] [--stdin]');
    process.exit(1);
  }
}
