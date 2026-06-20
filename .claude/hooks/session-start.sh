#!/bin/bash
# SessionStart hook — install the dev/test toolchain so `npm run health`,
# the unit tests, and `node test/render-check.mjs` work in Claude Code on the web.
# The web app's RUNTIME stays zero-dependency; these are dev/test deps only.
#
# Synchronous (no async wrapper) so deps are guaranteed ready before the agent
# runs tests/linters. All install output goes to stderr to keep the session
# context clean (stdout on SessionStart is injected as context; orient.sh owns it).
# Idempotent + non-fatal: a failed install logs but never blocks session start.
set -uo pipefail

# Web/remote sessions only — local machines manage their own setup.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

cd "${CLAUDE_PROJECT_DIR:-$(git rev-parse --show-toplevel 2>/dev/null || echo .)}" 2>/dev/null || exit 0
[ -f package.json ] || exit 0

# Dev/test deps (npm install is idempotent + cache-friendly; the container is
# snapshot-cached after the hook completes).
npm install --no-audit --no-fund 1>&2 || echo "[session-start] npm install failed" 1>&2

# Chromium for the headless render-check (test/render-check.mjs). --with-deps
# needs root for system libs; fall back to the plain browser download.
{ npx playwright install --with-deps chromium || npx playwright install chromium; } 1>&2 \
  || echo "[session-start] playwright chromium install skipped" 1>&2

# Pre-warm the local RAG embedding model so the first semantic query is fast
# (~25MB once, then cached). Non-fatal if offline.
node -e "import('./tools/rag/embed.mjs').then(m=>m.embedOne('warm')).catch(()=>{})" 1>&2 || true

echo "[session-start] dev/test toolchain ready" 1>&2
exit 0
