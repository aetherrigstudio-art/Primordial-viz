#!/usr/bin/env bash
# PreCompact hook: before the session compacts, remind to capture continuity in
# progress.md so mid-session state isn't lost. Non-blocking; never errors the session.
set -u
msg="PreCompact: before context is compacted, update progress.md — append/refresh the newest session entry (what changed, decisions+why, the exact next step) so a fresh agent can resume. Durable state = git only."
if command -v jq >/dev/null 2>&1; then
  jq -nc --arg m "$msg" '{hookSpecificOutput:{hookEventName:"PreCompact",additionalContext:$m}}'
else
  # NOTE: keep $msg free of " and \\ — the no-jq fallback does not JSON-escape.
  printf '{"hookSpecificOutput":{"hookEventName":"PreCompact","additionalContext":"%s"}}\n' "$msg"
fi
exit 0
