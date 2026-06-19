#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write).
# Regenerates ENCYCLOPEDIA.md so the categorized file index stays current as
# files are added, renamed, or have their header descriptions edited. Wholesale
# regen (cheap, idempotent) — doesn't need the edited path, so it ignores stdin.
# Robust by design: never blocks an edit if tooling is missing.

set -u

command -v node >/dev/null 2>&1 || exit 0

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
[ -f "$root/tools/gen-encyclopedia.mjs" ] || exit 0

(cd "$root" && node tools/gen-encyclopedia.mjs >/dev/null 2>&1) || true
exit 0
