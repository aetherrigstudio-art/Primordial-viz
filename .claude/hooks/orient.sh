#!/usr/bin/env bash
# SessionStart hook: orient a fresh agent (especially cloud/phone sessions) with
# zero typing — repo state, current branch + recent commits, the verify commands,
# and the load-bearing rules. Stdout is injected into the session as context.
# Robust: never errors out the session start.

set -u

root="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)" || exit 0
cd "$root" 2>/dev/null || exit 0

echo "PRIMORDIAL — session orientation"
echo "Canonical repo: Primordial-viz (dash). Full state + active plan: task_plan.md + progress.md (imported by CLAUDE.md)."

if command -v git >/dev/null 2>&1; then
  echo "Branch: $(git branch --show-current 2>/dev/null || echo '?')"
  echo "Recent commits:"
  git log --oneline -5 2>/dev/null | sed 's/^/  /'
fi

echo "Verify (laptop-free): 'node test/smoke.mjs' ; 'node test/render-check.mjs' (needs Playwright Chromium) ; CI = .github/workflows/verify.yml"
echo "Rules: mic needs a secure context (HTTPS or localhost). Shaders ship as src/shaders/*.js (no .glsl files). Looks are params-only JSON."
exit 0
