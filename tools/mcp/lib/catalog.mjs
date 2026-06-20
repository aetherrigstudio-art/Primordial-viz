// Capability catalog: enumerate the project's agent-workshop knowledge units —
// skills (.claude/skills/*/SKILL.md), subagents (.claude/agents/*.md), and the
// scoped rules (.claude/rules/*.md) — as structured data the MCP server (and any
// CLI/other tool) can list and fetch. Reuses the frontmatter parser + skill
// loader from tools/eval-skills.mjs (no second parser); full bodies are read via
// lib/docs.mjs getDoc, so nothing here duplicates the doc store.
//
//   node tools/mcp/lib/catalog.mjs skills
//   node tools/mcp/lib/catalog.mjs agents
//   node tools/mcp/lib/catalog.mjs rules
//   node tools/mcp/lib/catalog.mjs skill <id>

import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { parseFrontmatter, loadSkills } from '../../eval-skills.mjs';
import { getDoc } from './docs.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');

// Skills, grouped-ready: { id, name, area, description, path }. Sorted by id.
export function listSkills() {
  return loadSkills(root).map((s) => ({
    id: s.id,
    name: s.name,
    area: s.area,
    description: s.description,
    path: `.claude/skills/${s.id}/SKILL.md`,
  }));
}

// Full SKILL.md text for one skill (via the doc store, so reads stay path-scoped).
export function getSkill(id) {
  const path = `.claude/skills/${id}/SKILL.md`;
  return getDoc(path); // throws if not a known project doc
}

// Subagents: { id, name, description, tools, path }. tools is a list.
export function listAgents() {
  const dir = join(root, '.claude', 'agents');
  const out = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const fm = parseFrontmatter(readFileSync(join(dir, f), 'utf8'));
    const id = f.replace(/\.md$/, '');
    out.push({
      id,
      name: fm.name || id,
      description: fm.description || '',
      tools: (fm.tools || '').split(',').map((t) => t.trim()).filter(Boolean),
      path: `.claude/agents/${f}`,
    });
  }
  return out;
}

// Scoped rules: { id, title, paths, summary, path }. Rules use a `paths:`
// frontmatter then a `# Title` + lead prose (no name/description frontmatter).
export function listRules() {
  const dir = join(root, '.claude', 'rules');
  const out = [];
  for (const f of readdirSync(dir).filter((f) => f.endsWith('.md')).sort()) {
    const text = readFileSync(join(dir, f), 'utf8');
    const fm = parseFrontmatter(text);
    const lines = text.split('\n');
    const headingIdx = lines.findIndex((l) => /^#\s/.test(l));
    const title = headingIdx >= 0 ? lines[headingIdx].replace(/^#\s*/, '').trim() : f;
    // First non-empty prose line after the title = a one-line summary.
    let summary = '';
    for (let i = headingIdx + 1; i < lines.length; i++) {
      const t = lines[i].trim();
      if (t && !/^#/.test(t)) { summary = t; break; }
    }
    out.push({
      id: f.replace(/\.md$/, ''),
      title,
      paths: fm.paths || '',
      summary: summary.slice(0, 200),
      path: `.claude/rules/${f}`,
    });
  }
  return out;
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'skills') {
    for (const s of listSkills()) console.log(`${s.area || '-'}\t${s.id}\t${s.description}`);
  } else if (cmd === 'agents') {
    for (const a of listAgents()) console.log(`${a.id}\t[${a.tools.join(', ')}]\t${a.description}`);
  } else if (cmd === 'rules') {
    for (const r of listRules()) console.log(`${r.id}\t${r.title}`);
  } else if (cmd === 'skill' && arg) {
    try { console.log(getSkill(arg)); }
    catch (e) { console.error(e.message); process.exit(1); }
  } else {
    console.error('usage: catalog.mjs skills | agents | rules | skill <id>');
    process.exit(1);
  }
}
