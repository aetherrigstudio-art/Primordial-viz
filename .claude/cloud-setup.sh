#!/bin/bash
# Primordial-viz — CLOUD ENVIRONMENT SETUP SCRIPT (reference copy).
#
# This is NOT run automatically from the repo. PASTE its contents into:
#   claude.ai/code  →  Update cloud environment  →  Setup script
# It runs ONCE per environment, before Claude Code launches; the resulting
# filesystem is snapshot-cached and reused (skipped next session until this
# script/allowlist changes or ~7-day expiry). Put heavy installs here; per-session
# prep lives in the repo SessionStart hook (.claude/hooks/orient.sh).
# Requires Network = Full. Do NOT put secrets in the environment's env vars — they
# are visible to anyone who can edit the environment.

set -uo pipefail

echo "[setup] node $(node -v 2>/dev/null || echo MISSING) | npm $(npm -v 2>/dev/null || echo MISSING) | $(python3 -V 2>/dev/null || echo 'python3 MISSING')"

# Locate the Primordial-viz checkout (this environment may clone several repos).
repo=""
for d in "$PWD" "$PWD/Primordial-viz" "$HOME/Primordial-viz" "/workspace/Primordial-viz"; do
  if [ -f "$d/package.json" ] && [ -f "$d/test/render-check.mjs" ]; then repo="$d"; break; fi
done
if [ -z "$repo" ]; then
  echo "[setup] Primordial-viz checkout not found — nothing to install."
  exit 0
fi
cd "$repo"
echo "[setup] repo: $repo"

# Dev/test toolchain only (the app's RUNTIME stays zero-dependency).
# npm ci is reproducible from package-lock.json; fall back to npm install.
if ! { npm ci --no-audit --no-fund || npm install --no-audit --no-fund; }; then
  echo "[setup] npm install FAILED"; exit 1
fi

# Verify the critical dev toolchain actually RESOLVED. A stale snapshot or a
# lockfile that predates a devDep can leave packages absent even after a "clean"
# install — and that surfaces later as a mystery red gate mid-session (the RAG
# drift gate can't rebuild without the embedder; render-check can't run without
# Playwright). Fail HERE, loudly, where it's obviously a setup problem.
missing=""
for pkg in @huggingface/transformers playwright zod @modelcontextprotocol/sdk; do
  [ -e "node_modules/$pkg/package.json" ] || missing="${missing} ${pkg}"
done
if [ -n "$missing" ]; then
  echo "[setup] FATAL: devDep(s) did not install:${missing}"
  echo "[setup]   Likely a stale lockfile/snapshot. Try: rm -rf node_modules && npm install"
  exit 1
fi

# Pre-warm the local embedding model so the first RAG query in a session is fast
# (downloads ~25MB once; cached in the snapshot). The PACKAGE is asserted above;
# this only DOWNLOADS weights, so a failure here is network-only → non-fatal.
node -e "import('./tools/rag/embed.mjs').then(m => m.embedOne('warm')).then(() => console.log('rag model warmed')).catch(e => console.error('rag warm skipped (network?):', e.message))" || true

# Chromium for the headless render check. Try with system libs (needs root);
# fall back to the plain browser download if that isn't permitted.
if ! { npx playwright install --with-deps chromium || npx playwright install chromium; }; then
  echo "[setup] Playwright Chromium install FAILED"; exit 1
fi
# Confirm a chromium build actually landed in the browser cache (the install can
# "succeed" yet skip the download in odd states).
if ! ls "${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"/chromium-* >/dev/null 2>&1; then
  echo "[setup] FATAL: Playwright reported success but no chromium build is cached"
  exit 1
fi

echo "[setup] OK — toolchain verified. Check with: node test/smoke.mjs ; node test/render-check.mjs"
