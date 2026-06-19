#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write).
# If a params/looks data file (or the smoke test itself) changed, run the fast
# node smoke test so schema/look breakage surfaces immediately. Anything else is
# a no-op. Robust by design: never block an edit because tooling is missing.

set -u

payload="$(cat 2>/dev/null || true)"

file=""
if command -v jq >/dev/null 2>&1; then
  file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
fi
[ -n "$file" ] || exit 0

# Only react to the data layer the smoke test covers.
case "$file" in
  *src/params/*|*src/looks/*|*test/smoke.mjs) ;;
  *) exit 0 ;;
esac

command -v node >/dev/null 2>&1 || exit 0

# Resolve repo root from this script's location (robust to cwd).
here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
[ -f "$root/test/smoke.mjs" ] || exit 0

if ! (cd "$root" && node test/smoke.mjs >/tmp/smoke-hook.out 2>&1); then
  echo "check-data: smoke test FAILED after editing $file" >&2
  cat /tmp/smoke-hook.out >&2 2>/dev/null || true
  rm -f /tmp/smoke-hook.out 2>/dev/null || true
  exit 2
fi

rm -f /tmp/smoke-hook.out 2>/dev/null || true
exit 0
