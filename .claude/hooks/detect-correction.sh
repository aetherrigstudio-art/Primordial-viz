#!/usr/bin/env bash
# UserPromptSubmit hook: when the prompt reads like the user CORRECTING me, inject
# a NON-BLOCKING nudge to capture the lesson durably via the `/lesson` skill, so
# the same mistake doesn't recur. Specific phrases only (never bare "no"), to keep
# false fires low. Robust: no-op if jq is missing, prompt empty, or no match.

set -u
command -v jq >/dev/null 2>&1 || exit 0

payload="$(cat 2>/dev/null || true)"
prompt="$(printf '%s' "$payload" | jq -r '.prompt // empty' 2>/dev/null || true)"
[ -n "$prompt" ] || exit 0
low="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"

match=""
case "$low" in
  *"that's wrong"*|*"thats wrong"*|*"that's not right"*|*"thats not right"*|\
  *"that's not"*|*"not accurate"*|*"is inaccurate"*|*"incorrect"*|\
  *"you're wrong"*|*"youre wrong"*|*"you assumed"*|*"you assume"*|\
  *"don't assume"*|*"dont assume"*|*"that's false"*|*"is false"*|*"not true"*|\
  *"you misunderstood"*|*"wrong about"*|*"you made that up"*|*"that's a mistake"*|\
  *"isn't right"*|*"isnt right"*|*"no i meant"*|*"no, i meant"*|*"not what i"*|\
  *"you got that wrong"*|*"that's not what i"*)
    match="1" ;;
esac
[ -n "$match" ] || exit 0

ctx="[detect-correction] That reads like a correction. Once it's resolved, run the \`/lesson\` skill to capture it durably - route it to the always-loaded \`accuracy\` rule, the source-of-truth doc, or a progress note - so the same mistake doesn't recur."

jq -cn --arg c "$ctx" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$c}}'
exit 0
