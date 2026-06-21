#!/bin/bash
# Primordial-viz — SessionStart dependency-install hook (Claude Code on the web).
#
# Self-healing complement to .claude/cloud-setup.sh: the cloud setup script runs
# ONCE and is snapshot-cached, but a STALE snapshot (the recurring failure the
# orient hook warns about — "ENV INCOMPLETE … missing: node_modules / chromium")
# leaves node_modules / Playwright absent, which breaks `node test/render-check.mjs`
# and the RAG drift gate (`npm run rag:index`). This hook makes those deps present
# at session start.
#
# Idempotent + fast: when the snapshot is fresh it's just existence checks (~instant
# no-op); when it's stale it installs. Synchronous so deps are guaranteed before the
# session uses them. Web-only; non-blocking (always exits 0 so it can never wedge a
# session — a failed install just leaves the same red gate the operator already sees).

set -uo pipefail

# Web (Claude Code on the web) only — local dev manages its own toolchain.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Locate the checkout (CLAUDE_PROJECT_DIR may be unset; this env can clone several repos).
repo=""
for d in "${CLAUDE_PROJECT_DIR:-}" "$PWD" "$PWD/Primordial-viz" "$HOME/Primordial-viz" "/workspace/Primordial-viz"; do
  [ -n "$d" ] || continue
  if [ -f "$d/package.json" ] && [ -f "$d/test/render-check.mjs" ]; then repo="$d"; break; fi
done
if [ -z "$repo" ]; then
  echo "[session-start] Primordial-viz checkout not found — skipping dep install."
  exit 0
fi
cd "$repo" || exit 0

# 1. Dev/test toolchain (the app RUNTIME stays zero-dependency; these are dev-only).
#    npm install (not ci) to take advantage of any partial snapshot cache.
need_install=0
for pkg in @huggingface/transformers playwright zod @modelcontextprotocol/sdk; do
  [ -e "node_modules/$pkg/package.json" ] || need_install=1
done
if [ "$need_install" = "1" ]; then
  echo "[session-start] installing dev/test toolchain (stale/empty node_modules)…"
  npm install --no-audit --no-fund || echo "[session-start] npm install FAILED (gates needing node_modules will be red)"
fi

# 2. Playwright Chromium for the headless render check.
browsers_dir="${PLAYWRIGHT_BROWSERS_PATH:-$HOME/.cache/ms-playwright}"
if ! ls "$browsers_dir"/chromium-*/ >/dev/null 2>&1; then
  echo "[session-start] installing Playwright Chromium…"
  npx playwright install --with-deps chromium || npx playwright install chromium \
    || echo "[session-start] Chromium install FAILED (test/render-check.mjs will be unavailable)"
fi

echo "[session-start] dependency check complete."
exit 0
