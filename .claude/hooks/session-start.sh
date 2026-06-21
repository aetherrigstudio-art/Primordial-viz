#!/bin/bash
# SessionStart deps hook — installs the dev/test toolchain so `npm run health`,
# `npm run smoke`, and `node test/render-check.mjs` work in a fresh Claude Code on
# the web container. Web/remote sessions only; idempotent; the container snapshot-
# caches the result, so this is near-instant once warm. Synchronous (no async): it
# guarantees deps are ready before the agent loop starts.
#
# NOTE: the cloud Environment setup script (.claude/cloud-setup.sh, pasted into the
# env config) also does this and is snapshot-cached — so on a configured environment
# this hook is a fast no-op. It exists so a session works even without that config.
set -uo pipefail

# Web/remote sessions only — local sessions manage their own environment.
[ "${CLAUDE_CODE_REMOTE:-}" = "true" ] || exit 0

cd "${CLAUDE_PROJECT_DIR:-$PWD}" 2>/dev/null || exit 0
[ -f package.json ] || exit 0

# 1) Dev/test dependencies (the runtime app stays zero-dependency). `npm install`
#    is idempotent and reuses the snapshot cache (preferred over the stricter `npm ci`).
npm install --no-audit --no-fund >/tmp/session-start-npm.log 2>&1 \
  || echo "[session-start] npm install had issues — see /tmp/session-start-npm.log" >&2

# 2) Playwright Chromium — required by test/render-check.mjs. Honors
#    PLAYWRIGHT_BROWSERS_PATH if the env sets it; else installs to the default cache.
#    Try system libs (needs root); fall back to the plain browser download.
if ! npx playwright install --with-deps chromium >/tmp/session-start-pw.log 2>&1; then
  npx playwright install chromium >>/tmp/session-start-pw.log 2>&1 \
    || echo "[session-start] Chromium install issue — see /tmp/session-start-pw.log" >&2
fi

exit 0
