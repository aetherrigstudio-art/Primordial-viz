#!/usr/bin/env node
// Primordial-viz MCP server — local stdio dev tools for AI assistants working on
// this project. Each tool is a thin wrapper over a standalone module in lib/ that
// ALSO runs via CLI/CI, so the capability survives even if a session doesn't load
// project MCP servers (see research/findings/mcp-build-our-own.md).
//
// Run:        node tools/mcp/server.mjs           (spawned by Claude Code via .mcp.json)
// Inspect:    npx @modelcontextprotocol/inspector node tools/mcp/server.mjs
// Self-test:  node tools/mcp/selftest.mjs
//
// IMPORTANT: stdout is the JSON-RPC channel — all logging MUST go to stderr.

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { validateShaders } from './lib/validate.mjs';
import { runRenderCheck } from './lib/render.mjs';
import { listLooks, getLook, saveLook } from './lib/looks.mjs';
import { searchDocs, getDoc } from './lib/docs.mjs';
import { siteHealth } from './lib/site.mjs';
import { semanticSearch } from '../rag/retrieve.mjs';
import { projectStatus, openThreads, recentLessons, latestHandoff } from './lib/state.mjs';
import { listSkills, getSkill, listAgents, listRules } from './lib/catalog.mjs';

const server = new McpServer({ name: 'primordial', version: '0.1.0' });

// Identity tool — confirms the server is wired and discoverable. The real tool
// groups follow: validate_shaders, render_check, looks CRUD, docs Q&A
// (search_docs / semantic_search / get_doc / repo_map), project state
// (project_status / open_threads / recent_lessons), capability catalog
// (list_skills / get_skill / list_agents / list_rules), and site_health.
server.registerTool(
  'about',
  {
    description:
      'Describe this MCP server and the project it serves (Primordial-viz, a static ' +
      'zero-dependency audio-reactive WebGL2 visual instrument).',
    inputSchema: {},
  },
  async () => ({
    content: [
      {
        type: 'text',
        text:
          'primordial MCP server — dev tools for the Primordial-viz WebGL2 visual ' +
          'instrument. Tools are added per phase; see tools/mcp/ and ' +
          'research/findings/mcp-build-our-own.md.',
      },
    ],
  }),
);

// validate_shaders — compile + link the project's GLSL ES 3.00 shaders in a real
// headless WebGL2 context. Highest-value tool: catches shader errors before they
// reach the browser. Wraps lib/validate.mjs (also runnable as a CLI / in CI).
server.registerTool(
  'validate_shaders',
  {
    description:
      "Compile and link the project's GLSL ES 3.00 shaders in a headless WebGL2 " +
      '(ANGLE/SwiftShader) context — the exact pipeline the browser uses. Returns ' +
      'per-program compile/link status and any error logs. Takes no arguments.',
    inputSchema: {},
  },
  async () => {
    const res = await validateShaders();
    const summary = res.ok
      ? 'All shaders compiled and linked.'
      : 'Shader validation FAILED:\n' + res.errors.join('\n');
    return {
      content: [{ type: 'text', text: summary }],
      structuredContent: res,
      isError: !res.ok,
    };
  },
);

// render_check — boot the app in headless WebGL2 and report whether it renders
// (glOk, frames advancing, no console errors, a11y) plus a screenshot. target
// 'local' serves the repo; 'live' checks the deployed primordial.video.
server.registerTool(
  'render_check',
  {
    description:
      'Boot the app in headless Chromium (WebGL2/SwiftShader) and report whether it ' +
      'renders: WebGL2 available, glOk, frames advancing, no console errors, and the ' +
      'accessibility DOM. Returns the checks + health beacon and a PNG screenshot. ' +
      "Set target 'live' to check the deployed https://primordial.video instead of a " +
      'local server.',
    inputSchema: {
      target: z
        .enum(['local', 'live'])
        .default('local')
        .describe("'local' serves and checks the repo; 'live' checks primordial.video"),
    },
  },
  async ({ target }) => {
    // Small JPEG thumbnail keeps the tool result well under MCP output limits;
    // the full PNG artifact is produced by the CI render check, not here.
    const res = await runRenderCheck({
      target: target || 'local',
      screenshot: 'jpeg',
      screenshotQuality: 55,
      viewport: { width: 640, height: 400 },
    });
    const summary =
      `render_check (${res.url}): ${res.pass ? 'PASS' : 'FAIL'}\n` +
      res.checks.map((c) => `  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ` (${c.detail})` : ''}`).join('\n');
    const content = [{ type: 'text', text: summary }];
    if (res.screenshot) content.push({ type: 'image', data: res.screenshot.toString('base64'), mimeType: res.screenshotMime });
    // Drop the image buffer from the structured payload; it's in the image block.
    const { screenshot, ...structured } = res;
    return { content, structuredContent: structured, isError: !res.pass };
  },
);

// --- Looks / presets -------------------------------------------------------
// A look is params-only data over the shared slime shader. create/update write
// the JSON and re-sync registry.js's generated mirror (keeps smoke green).
const lookParams = z
  .record(z.string(), z.union([z.number(), z.array(z.number())]))
  .optional()
  .describe('Param overrides from src/params/schema.js; omitted keys use defaults.');
const lookInput = {
  id: z.string().describe('kebab-case id (also the filename), e.g. "acid-fog"'),
  name: z.string().describe('Display name shown in the UI'),
  description: z.string().describe('One-line description'),
  params: lookParams,
};

server.registerTool(
  'list_looks',
  { description: 'List the project\'s visual "looks" (params-only presets) with their params.', inputSchema: {} },
  async () => {
    const looks = listLooks();
    return {
      content: [{ type: 'text', text: looks.map((l) => `${l.id} — ${l.name}: ${l.description}`).join('\n') }],
      structuredContent: { looks },
    };
  },
);

for (const mode of ['create', 'update']) {
  server.registerTool(
    `${mode}_look`,
    {
      description:
        `${mode === 'create' ? 'Create a new' : 'Update an existing'} look. Validates params ` +
        'against src/params/schema.js (out-of-range values are rejected) and re-syncs the ' +
        'registry mirror so the change is picked up everywhere.',
      inputSchema: lookInput,
    },
    async (input) => {
      const r = saveLook(input, mode);
      if (!r.ok) {
        return { content: [{ type: 'text', text: 'Could not save look:\n- ' + r.errors.join('\n- ') }], isError: true };
      }
      return {
        content: [{ type: 'text', text: `Saved ${r.path} and synced registry.js.` }],
        structuredContent: { look: r.look, path: r.path },
      };
    },
  );
}

// Read-only browse of looks as resources (look://<id>).
server.registerResource(
  'look',
  new ResourceTemplate('look://{id}', {
    list: async () => ({
      resources: listLooks().map((l) => ({
        uri: `look://${l.id}`,
        name: l.name,
        description: l.description,
        mimeType: 'application/json',
      })),
    }),
  }),
  { title: 'Looks', description: 'Params-only visual presets' },
  async (uri, { id }) => {
    const look = getLook(id);
    if (!look) throw new Error(`look '${id}' not found`);
    return { contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(look, null, 2) }] };
  },
);

// Guided workflow to draft + save a new look.
server.registerPrompt(
  'scaffold_new_look',
  {
    title: 'Scaffold a new look',
    description: 'Draft a new params-only look and save it with create_look.',
    argsSchema: {
      name: z.string().describe('Display name, e.g. "Acid Fog"'),
      base: z.string().optional().describe('Existing look id to start from'),
    },
  },
  ({ name, base }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text:
            `Create a new Primordial look named "${name}"` +
            (base ? ` based on the existing look "${base}"` : '') +
            '. Pick a kebab-case id and a one-line description, choose param overrides from ' +
            'src/params/schema.js (palette colA/colB plus blobCount, sminK, warpAmt, glow, sss, ' +
            'bloom, grain, scanline, chroma, vignette — all within their schema ranges), then call ' +
            'create_look with { id, name, description, params }.',
        },
      },
    ],
  }),
);

// --- Docs / project Q&A ----------------------------------------------------
server.registerTool(
  'search_docs',
  {
    description:
      "Keyword-search the project's own markdown docs (README, CLAUDE.md, ROADMAP, " +
      'findings, .claude rules, etc.; excludes the scraped research corpus). Returns ' +
      'ranked path + heading + snippet — use get_doc to read a full file.',
    inputSchema: {
      query: z.string().describe('Search terms'),
      limit: z.number().int().min(1).max(25).default(8).optional(),
    },
  },
  async ({ query, limit }) => {
    const results = searchDocs(query, { limit: limit || 8 });
    const text = results.length
      ? results.map((r) => `${r.path}${r.heading ? ` › ${r.heading}` : ''}\n  ${r.snippet}`).join('\n\n')
      : 'No matches.';
    return { content: [{ type: 'text', text }], structuredContent: { results } };
  },
);

server.registerTool(
  'semantic_search',
  {
    description:
      "Semantic + keyword hybrid search over the project's own markdown docs. Better " +
      'than search_docs for conceptual/fuzzy questions (paraphrases, synonyms); blends ' +
      'vector similarity with keyword ranking. Returns ranked path + heading + snippet — ' +
      'use get_doc to read a full file.',
    inputSchema: {
      query: z.string().describe('Natural-language or keyword query'),
      limit: z.number().int().min(1).max(25).default(8).optional(),
    },
  },
  async ({ query, limit }) => {
    const results = await semanticSearch(query, { limit: limit || 8 });
    const text = results.length
      ? results.map((r) => `${r.path}${r.heading ? ` › ${r.heading}` : ''}\n  ${r.snippet}`).join('\n\n')
      : 'No matches.';
    return { content: [{ type: 'text', text }], structuredContent: { results } };
  },
);

server.registerTool(
  'get_doc',
  {
    description: 'Return a project markdown doc (optionally just one heading\'s section).',
    inputSchema: {
      path: z.string().describe('Repo-relative path, e.g. "CLAUDE.md" or "docs/BUILD-SPEC.md"'),
      section: z.string().optional().describe('Heading text to return just that section'),
    },
  },
  async ({ path, section }) => {
    try {
      return { content: [{ type: 'text', text: getDoc(path, { section: section || null }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: err.message }], isError: true };
    }
  },
);

server.registerTool(
  'repo_map',
  {
    description:
      'Return the categorized file map of the repo (the generated ENCYCLOPEDIA.md: ' +
      'every file with a one-line description, grouped by category). Use to find where ' +
      'something lives. Pass a category heading to return just that section.',
    inputSchema: {
      section: z.string().optional().describe('Category heading, e.g. "App — Audio" or "Tooling / Scripts"'),
    },
  },
  async ({ section }) => {
    try {
      return { content: [{ type: 'text', text: getDoc('ENCYCLOPEDIA.md', { section: section || null }) }] };
    } catch (err) {
      return { content: [{ type: 'text', text: err.message }], isError: true };
    }
  },
);

// Expose the headline + state docs as resources for @-mention in clients.
for (const [name, path, title] of [
  ['readme', 'README.md', 'README'],
  ['roadmap', 'ROADMAP.md', 'Roadmap'],
  ['claude', 'CLAUDE.md', 'CLAUDE (agent notes)'],
  ['onboarding', 'ONBOARDING.md', 'Onboarding'],
  ['progress', 'progress.md', 'Progress / handoff log'],
  ['task-plan', 'task_plan.md', 'Task plan'],
  ['encyclopedia', 'ENCYCLOPEDIA.md', 'Encyclopedia (file map)'],
  ['tree', 'TREE.md', 'File tree'],
]) {
  server.registerResource(
    name,
    `doc://${name}`,
    { title, description: `${title} (project doc)`, mimeType: 'text/markdown' },
    async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'text/markdown', text: getDoc(path) }] }),
  );
}

// --- Project state / continuity --------------------------------------------
// Structured access to the committed handoff log (progress.md) — the same data
// the SessionStart orient hook parses, but queryable on demand. lib/state.mjs is
// the single source of truth (the hook calls it too), so they can't drift.
server.registerTool(
  'project_status',
  {
    description:
      'Where the project stands right now: current git branch + working-tree state, ' +
      'the latest handoff entry title, open-thread count, and recent lessons — parsed ' +
      'from progress.md (the committed continuity log). Use to orient on a fresh session.',
    inputSchema: {},
  },
  async () => {
    const s = projectStatus();
    const text =
      `Branch: ${s.branch ?? '?'} (${s.clean ? 'clean' : s.dirtyCount + ' uncommitted'})\n` +
      `Latest handoff: ${s.latestHandoff ?? '(none)'}\n` +
      `Open threads: ${s.openThreadCount}\n` +
      (s.recentLessons.length ? `Recent lessons:\n  - ${s.recentLessons.join('\n  - ')}` : '');
    return { content: [{ type: 'text', text }], structuredContent: s };
  },
);

server.registerTool(
  'open_threads',
  {
    description:
      'List the parked "Open threads" from progress.md — unfinished work to resume, ' +
      'each with its context and next step. The same list the orient hook surfaces.',
    inputSchema: {},
  },
  async () => {
    const threads = openThreads();
    const text = threads.length ? threads.map((t) => `- ${t.text}`).join('\n\n') : 'No open threads.';
    return { content: [{ type: 'text', text }], structuredContent: { threads } };
  },
);

server.registerTool(
  'recent_lessons',
  {
    description:
      'The most recent LESSON entries from progress.md — past corrections worth not ' +
      'repeating. Returns the entry titles (read the full section with get_doc progress.md).',
    inputSchema: {
      limit: z.number().int().min(1).max(10).default(3).optional(),
    },
  },
  async ({ limit }) => {
    const lessons = recentLessons(limit || 3);
    const text = lessons.length ? lessons.map((l) => `- ${l.title}`).join('\n') : 'No lessons recorded.';
    return { content: [{ type: 'text', text }], structuredContent: { lessons } };
  },
);

// Latest handoff as a resource for @-mention.
server.registerResource(
  'handoff',
  'state://handoff',
  { title: 'Latest handoff', description: 'Newest progress.md session entry', mimeType: 'text/markdown' },
  async (uri) => {
    const h = latestHandoff();
    const text = h ? `## ${h.title}\n\n${h.body}` : '(no handoff found)';
    return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text }] };
  },
);

// --- Capability catalog (skills / agents / rules) --------------------------
server.registerTool(
  'list_skills',
  {
    description:
      "List the project's skills (.claude/skills) with area + description — the in-repo " +
      'workflow toolkit. Use to discover which skill fits a task; read one with get_skill.',
    inputSchema: {
      area: z.string().optional().describe('Filter to one area, e.g. "shaders", "deploy", "planning"'),
    },
  },
  async ({ area }) => {
    let skills = listSkills();
    if (area) skills = skills.filter((s) => s.area === area);
    const text = skills.length
      ? skills.map((s) => `${s.id} [${s.area || '-'}] — ${s.description}`).join('\n')
      : 'No matching skills.';
    return { content: [{ type: 'text', text }], structuredContent: { skills } };
  },
);

server.registerTool(
  'get_skill',
  {
    description: 'Return one skill\'s full SKILL.md by id (e.g. "perf-budget", "new-preset").',
    inputSchema: { id: z.string().describe('Skill id (its directory name)') },
  },
  async ({ id }) => {
    try {
      return { content: [{ type: 'text', text: getSkill(id) }] };
    } catch {
      return { content: [{ type: 'text', text: `Skill '${id}' not found.` }], isError: true };
    }
  },
);

server.registerTool(
  'list_agents',
  {
    description:
      "List the project's subagents (.claude/agents) with their allowed tools and when " +
      'to use each (e.g. audio-dsp, visual-qa).',
    inputSchema: {},
  },
  async () => {
    const agents = listAgents();
    const text = agents.map((a) => `${a.id} [${a.tools.join(', ')}] — ${a.description}`).join('\n');
    return { content: [{ type: 'text', text }], structuredContent: { agents } };
  },
);

server.registerTool(
  'list_rules',
  {
    description:
      "List the scoped rule files (.claude/rules) — the load-bearing constraints, with the " +
      'paths each governs. Read a full rule with get_doc (e.g. ".claude/rules/shaders.md").',
    inputSchema: {},
  },
  async () => {
    const rules = listRules();
    const text = rules.map((r) => `${r.id}${r.paths ? ` (${r.paths})` : ''} — ${r.title}`).join('\n');
    return { content: [{ type: 'text', text }], structuredContent: { rules } };
  },
);

// --- Live-site health (primordial.video) -----------------------------------
server.registerTool(
  'site_health',
  {
    description:
      'Read-only health check of the live site https://primordial.video: reachable + ' +
      'HTTPS status and the TLS certificate days-to-expiry (the SSL is non-renewing, so ' +
      'a lapse silently breaks the mic). Set render:true to also boot the live page in ' +
      'headless WebGL2. No credentials; does not deploy.',
    inputSchema: {
      render: z.boolean().default(false).optional().describe('Also run the live render check'),
    },
  },
  async ({ render }) => {
    const res = await siteHealth({ render: !!render });
    const text =
      `${res.url}\n  reachable: ${res.reachable}  status: ${res.status ?? 'n/a'}\n` +
      `  SSL valid to: ${res.ssl.validTo ?? 'n/a'} (${res.ssl.daysToExpiry ?? '?'} days)` +
      (res.errors.length ? '\n  notes:\n    - ' + res.errors.join('\n    - ') : '');
    return { content: [{ type: 'text', text }], structuredContent: res, isError: !res.ok };
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[primordial-mcp] ready on stdio');
