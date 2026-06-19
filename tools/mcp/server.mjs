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

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { validateShaders } from './lib/validate.mjs';
import { runRenderCheck } from './lib/render.mjs';

const server = new McpServer({ name: 'primordial', version: '0.1.0' });

// Skeleton tool — confirms the server is wired and discoverable. Real tool groups
// (validate_shaders, render_check, looks CRUD, search_docs, site_health) are
// registered in later phases.
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

const transport = new StdioServerTransport();
await server.connect(transport);
console.error('[primordial-mcp] ready on stdio');
