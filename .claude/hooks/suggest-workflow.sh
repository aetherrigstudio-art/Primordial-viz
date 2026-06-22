#!/usr/bin/env bash
# UserPromptSubmit hook: when the prompt looks like a substantial build/feature or
# a new visual-look task, inject a NON-BLOCKING nudge toward the matching named
# workflow (`.claude/workflows.md`, driven by the `workflow` skill). It only
# suggests — never forces invocation (deliberately unlike `using-superpowers`).
# Robust: no-op if jq is missing, the prompt is empty, or no intent matches.

set -u
command -v jq >/dev/null 2>&1 || exit 0

payload="$(cat 2>/dev/null || true)"
prompt="$(printf '%s' "$payload" | jq -r '.prompt // empty' 2>/dev/null || true)"
[ -n "$prompt" ] || exit 0
low="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"

# Look intent is more specific → checked first.
wf=""
# Immersive page intent is the most specific → checked first.
case "$low" in
  *immersive*|*splat*|*drapery*|*rainforest*|*"point-cloud"*|*"point cloud"*|*journey*|*theatre*|*"landing page"*)
    wf="immersive-page" ;;
esac
if [ -z "$wf" ]; then
  case "$low" in
    *preset*|*palette*|*"new look"*|*"a new look"*|*"another look"*|*"color scheme"*|*"visual look"*|*"new visual"*)
      wf="new-look" ;;
  esac
fi
if [ -z "$wf" ]; then
  case "$low" in
    *"build a"*|*implement*|*"add a feature"*|*"new feature"*|*"create a feature"*|*"add support"*|*refactor*|*scaffold*)
      wf="feature" ;;
  esac
fi
[ -n "$wf" ] || exit 0

ctx="[suggest-workflow] This looks like a '${wf}' task. Consider driving it with the \`workflow\` skill (chain in .claude/workflows.md) — it runs the right skill sequence with its gates (design → plan → implement → verify → review). Non-binding; skip if it's a trivial one-off."

jq -cn --arg c "$ctx" '{hookSpecificOutput:{hookEventName:"UserPromptSubmit",additionalContext:$c}}'
exit 0
