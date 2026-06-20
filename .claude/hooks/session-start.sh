#!/usr/bin/env bash
# SessionStart hook: install the dev/test toolchain so 'npm run health',
# smoke, render-check and the linters work in Claude Code on the web.
#
# Why a hook (vs only .claude/cloud-setup.sh): the cloud setup script is
# snapshot-cached and goes STALE — the orient hook keeps reporting
# "ENV INCOMPLETE — missing node_modules". This runs EVERY web session, so a
# stale or expired snapshot self-heals instead of leaving red gates mid-session.
# The app RUNTIME stays zero-dependency; this only installs devDeps.
#
# Mode: SYNCHRONOUS — the session waits until deps are ready (no race where the
# agent runs tests/linters before install finishes). Flip to async by emitting
# '{"async": true, "asyncTimeout": 300000}' as the first stdout line.

set -uo pipefail

# Web-only: a local CLI session already has its toolchain; don't reinstall.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Locate the Primordial-viz checkout (the env may clone several repos).
root="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)" || exit 0
repo=""
for d in "$root" "$PWD" "$PWD/Primordial-viz" "$HOME/Primordial-viz" "/workspace/Primordial-viz"; do
  if [ -f "$d/package.json" ] && [ -f "$d/test/render-check.mjs" ]; then repo="$d"; break; fi
done
if [ -z "$repo" ]; then
  echo "[session-start] Primordial-viz checkout not found — nothing to install."
  exit 0
fi
cd "$repo"

# Dev/test toolchain only. npm install is idempotent (fast no-op when already
# present → cheap on a warm snapshot) and tolerates a lockfile that drifted
# ahead of an older snapshot, unlike npm ci.
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules ]; then
  echo "[session-start] installing dev/test toolchain (npm install)…"
  if ! npm install --no-audit --no-fund; then
    echo "[session-start] npm install FAILED" >&2
    exit 1
  fi
else
  echo "[session-start] node_modules present and up to date — skipping npm install."
fi

# Assert the critical devDeps actually RESOLVED. A stale snapshot or a lockfile
# that predates a devDep can leave packages absent even after a clean install —
# which otherwise surfaces later as a mystery red gate (RAG drift gate can't
# rebuild without the embedder; render-check can't run without Playwright).
missing=""
for pkg in @huggingface/transformers playwright zod @modelcontextprotocol/sdk; do
  [ -e "node_modules/$pkg/package.json" ] || missing="${missing} ${pkg}"
done
if [ -n "$missing" ]; then
  echo "[session-start] FATAL: devDep(s) did not install:${missing}" >&2
  echo "[session-start]   Likely a stale lockfile. Try: rm -rf node_modules && npm install" >&2
  exit 1
fi

# Chromium for the headless render check. Idempotent (no-op if already cached).
# Try system libs first (needs root); fall back to the plain browser download.
if ! ls "${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"/chromium-* >/dev/null 2>&1; then
  echo "[session-start] installing Playwright Chromium…"
  npx playwright install --with-deps chromium || npx playwright install chromium || \
    echo "[session-start] WARN: Chromium install failed — render-check will be unavailable." >&2
fi

# Pre-warm the local embedding model so the first RAG query is fast (downloads
# ~25MB once). Network-only step → non-fatal.
node -e "import('./tools/rag/embed.mjs').then(m => m.embedOne('warm')).then(() => console.log('[session-start] rag model warmed')).catch(e => console.error('[session-start] rag warm skipped (network?):', e.message))" || true

echo "[session-start] OK — toolchain ready. Verify with: npm run health"
exit 0
