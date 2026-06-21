#!/bin/bash
# SessionStart (web/cloud ONLY): start the primordial MCP server over Streamable HTTP
# on localhost, so cloud Claude Code sessions can reach it. Cloud sessions cannot spawn
# a local stdio MCP server (no local process host — issue #54441), but they CAN connect
# to an HTTP MCP server. Desktop keeps using the stdio `primordial` entry in .mcp.json;
# this HTTP path (`primordial-http`) is for the cloud environment.
#
# Idempotent: skips if the port is already serving; the server's own EADDRINUSE is a
# harmless second safety net against double-start. Non-blocking; always exits 0.
#
# CAVEAT: MCP config is read at session init; whether the web harness connects to this
# localhost HTTP entry given startup timing is the open question (issue #54441). If it
# doesn't load, no harm — desktop stdio is untouched and this is one revertible line.
set -uo pipefail

[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0   # cloud/web sessions only
PORT="${PRIMORDIAL_MCP_PORT:-7332}"
cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0
[ -f tools/mcp/server.mjs ] || exit 0

# Already serving? then nothing to do.
if command -v curl >/dev/null 2>&1; then
  curl -s -o /dev/null --max-time 1 "http://127.0.0.1:${PORT}/health" 2>/dev/null && exit 0
fi

# Start detached so it outlives this hook process.
MCP_HTTP_PORT="$PORT" nohup node tools/mcp/server.mjs >/tmp/primordial-mcp-http.log 2>&1 &
disown 2>/dev/null || true
exit 0
