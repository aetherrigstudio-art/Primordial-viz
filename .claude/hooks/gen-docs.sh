#!/usr/bin/env bash
# PostToolUse hook (matcher: Edit|Write).
# Regenerates ENCYCLOPEDIA.md + TREE.md so the file index and directory tree stay
# current as files are added, renamed, or have their header descriptions edited.
# Wholesale regen (cheap, idempotent) — doesn't need the edited path, ignores stdin.
# Robust by design: never blocks an edit if tooling is missing.

set -u

command -v node >/dev/null 2>&1 || exit 0

here="$(cd "$(dirname "$0")" && pwd)"
root="$(cd "$here/../.." && pwd)"
[ -f "$root/tools/gen-docs.mjs" ] || exit 0

(cd "$root" && node tools/gen-docs.mjs >/dev/null 2>&1) || true
exit 0
