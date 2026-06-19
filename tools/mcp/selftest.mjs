#!/usr/bin/env node
// Self-test for the primordial MCP server: spawns server.mjs over stdio using the
// MCP SDK client, lists tools/resources/prompts, and exits non-zero if the server
// fails to start or exposes nothing. Zero browser, fast — safe for CI.
//
//   node tools/mcp/selftest.mjs

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [join(here, 'server.mjs')],
  stderr: 'inherit',
});
const client = new Client({ name: 'primordial-selftest', version: '0.1.0' });

let failed = false;
try {
  await client.connect(transport);

  const { tools } = await client.listTools();
  console.log('tools:', tools.map((t) => t.name).join(', ') || '(none)');
  if (!tools.length) { console.error('FAIL: server exposed no tools'); failed = true; }

  // Resources / prompts are optional in early phases — list them if supported.
  const caps = client.getServerCapabilities() || {};
  if (caps.resources) {
    const { resources } = await client.listResources();
    console.log('resources:', resources.map((r) => r.uri).join(', ') || '(none)');
  }
  if (caps.prompts) {
    const { prompts } = await client.listPrompts();
    console.log('prompts:', prompts.map((p) => p.name).join(', ') || '(none)');
  }
} catch (err) {
  console.error('FAIL:', err && err.message ? err.message : err);
  failed = true;
} finally {
  await client.close().catch(() => {});
}

console.log(failed ? 'selftest FAILED' : 'selftest OK');
process.exit(failed ? 1 : 0);
