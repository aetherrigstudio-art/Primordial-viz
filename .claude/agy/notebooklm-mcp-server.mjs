#!/usr/bin/env node
// NotebookLM MCP server — a tiny ZERO-DEPENDENCY stdio JSON-RPC 2.0 bridge that exposes the
// authed `notebooklm` CLI as MCP tools, so an MCP client (Antigravity `agy`, Claude Code, etc.)
// can query a NotebookLM notebook's research corpus.
//
// Why zero-dep: this device (Termux/Android) can't reliably `npm install` native or even many
// pure packages (EBADPLATFORM aborts the whole tree), so we hand-roll the protocol instead of
// pulling @modelcontextprotocol/sdk. MCP stdio framing = newline-delimited JSON-RPC 2.0 messages
// (one compact JSON object per line). stdout is the JSON-RPC channel — ALL logs go to stderr.
//
// Wired into agy via /root/.gemini/config/mcp_config.json:
//   "notebooklm": { "command": "node", "args": ["/root/.local/share/notebooklm-mcp/server.mjs"] }

import { spawn } from 'node:child_process'
import { createInterface } from 'node:readline'

const SERVER = { name: 'notebooklm', version: '0.1.0' }
const NOTEBOOKLM_BIN = process.env.NOTEBOOKLM_BIN || 'notebooklm'
const CALL_TIMEOUT_MS = Number(process.env.NOTEBOOKLM_TIMEOUT_MS || 180000)

const log = (...a) => process.stderr.write(`[notebooklm-mcp] ${a.join(' ')}\n`)

// ---- tool catalog -------------------------------------------------------------------------------
const TOOLS = [
  {
    name: 'notebooklm_ask',
    description:
      'Ask the current (or a specified) NotebookLM notebook a question. Returns the grounded answer '
      + 'with inline [n] citations referencing the notebook sources. Use for research grounded in the '
      + "notebook's curated corpus (e.g. the 'Elite WebGL Landing Pages' notebook).",
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string', description: 'The question to ask.' },
        notebook: { type: 'string', description: 'Optional notebook id (partial ok). Defaults to the current context.' },
        fresh: { type: 'boolean', description: 'Start a new conversation instead of continuing the last one.' },
      },
      required: ['question'],
    },
    run: (a) => [
      'ask', '--json',
      ...(a.notebook ? ['-n', String(a.notebook)] : []),
      ...(a.fresh ? ['--new'] : []),
      String(a.question ?? ''),
    ],
  },
  {
    name: 'notebooklm_list',
    description: 'List the available NotebookLM notebooks (id + title).',
    inputSchema: { type: 'object', properties: {} },
    run: () => ['list'],
  },
  {
    name: 'notebooklm_use',
    description: 'Set the current notebook context for subsequent notebooklm_ask calls (partial id ok).',
    inputSchema: {
      type: 'object',
      properties: { notebook: { type: 'string', description: 'Notebook id (partial ok).' } },
      required: ['notebook'],
    },
    run: (a) => ['use', String(a.notebook ?? '')],
  },
  {
    name: 'notebooklm_summary',
    description: 'Get an AI-generated summary of the current (or a specified) notebook.',
    inputSchema: {
      type: 'object',
      properties: { notebook: { type: 'string', description: 'Optional notebook id (partial ok).' } },
    },
    run: (a) => ['summary', ...(a.notebook ? ['-n', String(a.notebook)] : [])],
  },
]
const TOOLS_BY_NAME = Object.fromEntries(TOOLS.map((t) => [t.name, t]))

// ---- notebooklm CLI runner ----------------------------------------------------------------------
function runCli(args) {
  return new Promise((resolve) => {
    let out = ''
    let err = ''
    let done = false
    const child = spawn(NOTEBOOKLM_BIN, args, { stdio: ['ignore', 'pipe', 'pipe'] })
    const timer = setTimeout(() => {
      if (!done) { done = true; child.kill('SIGKILL'); resolve({ ok: false, text: `notebooklm timed out after ${CALL_TIMEOUT_MS}ms` }) }
    }, CALL_TIMEOUT_MS)
    child.stdout.on('data', (d) => { out += d })
    child.stderr.on('data', (d) => { err += d })
    child.on('error', (e) => {
      if (done) return
      done = true; clearTimeout(timer)
      resolve({ ok: false, text: `failed to spawn ${NOTEBOOKLM_BIN}: ${e.message}` })
    })
    child.on('close', (code) => {
      if (done) return
      done = true; clearTimeout(timer)
      const text = (out || err || '').trim() || `notebooklm exited ${code}`
      resolve({ ok: code === 0, text })
    })
  })
}

// ---- JSON-RPC plumbing --------------------------------------------------------------------------
function send(msg) { process.stdout.write(JSON.stringify(msg) + '\n') }
function reply(id, result) { send({ jsonrpc: '2.0', id, result }) }
function fail(id, code, message) { send({ jsonrpc: '2.0', id, error: { code, message } }) }

async function handle(msg) {
  const { id, method, params } = msg
  const isNotification = id === undefined || id === null

  switch (method) {
    case 'initialize': {
      const protocolVersion = (params && params.protocolVersion) || '2024-11-05'
      return reply(id, {
        protocolVersion,
        capabilities: { tools: { listChanged: false } },
        serverInfo: SERVER,
      })
    }
    case 'notifications/initialized':
    case 'initialized':
      return // notification, no reply
    case 'ping':
      return reply(id, {})
    case 'tools/list':
      return reply(id, { tools: TOOLS.map(({ name, description, inputSchema }) => ({ name, description, inputSchema })) })
    case 'tools/call': {
      const tool = TOOLS_BY_NAME[params && params.name]
      if (!tool) return fail(id, -32602, `unknown tool: ${params && params.name}`)
      const args = (params && params.arguments) || {}
      const { ok, text } = await runCli(tool.run(args))
      return reply(id, { content: [{ type: 'text', text }], isError: !ok })
    }
    default:
      if (isNotification) return
      return fail(id, -32601, `method not found: ${method}`)
  }
}

const rl = createInterface({ input: process.stdin })
rl.on('line', (line) => {
  const s = line.trim()
  if (!s) return
  let msg
  try { msg = JSON.parse(s) } catch { return log('skip non-JSON line') }
  Promise.resolve(handle(msg)).catch((e) => {
    log('handler error:', e && e.message)
    if (msg && msg.id != null) fail(msg.id, -32603, `internal error: ${e && e.message}`)
  })
})
rl.on('close', () => process.exit(0))
log(`ready (bin=${NOTEBOOKLM_BIN}, tools=${TOOLS.length})`)
