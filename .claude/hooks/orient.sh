#!/usr/bin/env bash
# SessionStart hook: orient a fresh agent (especially cloud/phone sessions) with
# zero typing — repo state, branch + recent commits, the latest handoff pointer,
# deploy + container-network facts, the verify commands, and the load-bearing
# rules. Stdout is injected into the session as context.
# Robust: never errors out the session start.

set -u

root="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)" || exit 0
cd "$root" 2>/dev/null || exit 0

echo "PRIMORDIAL — session orientation"
echo "Canonical repo: Primordial-viz (dash). Full state + active plan: task_plan.md + progress.md (imported by CLAUDE.md)."

if command -v git >/dev/null 2>&1; then
  echo "Branch: $(git branch --show-current 2>/dev/null || echo '?')"
  dirty="$(git status --porcelain 2>/dev/null | grep -c . || true)"
  if [ "${dirty:-0}" != "0" ]; then
    echo "Working tree: ${dirty} uncommitted change(s) — only COMMITTED files survive a new container; commit before the session ends."
  else
    echo "Working tree: clean."
  fi
  echo "Recent commits:"
  git log --oneline -5 2>/dev/null | sed 's/^/  /'
fi

# Latest handoff pointer — the source of truth for "what's next".
if [ -f progress.md ]; then
  last="$(grep '^## ' progress.md 2>/dev/null | tail -1)"
  [ -n "$last" ] && echo "Latest progress entry: ${last#\#\# }  → read the tail of progress.md for the handoff / next step."
fi

echo "Deploy: live preview at https://primordial.video/Test/ — AUTO-deploys on push (GitHub Actions FTPS; .github/workflows/deploy.yml; needs the FTP_PASSWORD repo secret, which lives in GitHub and survives wipes)."
echo "Container network: outbound HTTPS(443) ONLY — FTP/21 and cPanel/2083 are BLOCKED. Do NOT try to FTP or drive cPanel from here; deploy + re-run CI via GitHub Actions (GitHub MCP tools), and verify by curl-ing the live HTTPS URL."
echo "Verify (laptop-free): 'node test/smoke.mjs' ; 'node test/render-check.mjs' (needs Playwright Chromium) ; docs gate 'node tools/gen-docs.mjs --check' ; CI = .github/workflows/verify.yml"
echo "Rules: mic needs a secure context (HTTPS or localhost). One hand-built raw-WebGL2 app (index.html → src/main.js; NOT three.js). Shaders ship as src/shaders/*.js (no .glsl files). Looks are params-only JSON."
exit 0
