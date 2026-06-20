#!/usr/bin/env bash
# UserPromptSubmit hook: when the prompt looks like a substantial build/feature or
# a new visual-look task, inject a NON-BLOCKING nudge toward the matching named
# workflow (`.claude/workflows.md`, driven by the `workflow` skill). It only
# suggests — never forces invocation (deliberately unlike `using-superpowers`).
# Robust: no-op if jq is missing, the prompt is empty, or no intent matches.

set -u
# Need jq OR node to read the prompt and emit valid JSON (node is always present
# here; jq may be absent pre-cloud-setup). Without both, no-op.
command -v jq >/dev/null 2>&1 || command -v node >/dev/null 2>&1 || exit 0

emit_ctx() {  # emit_ctx <eventName> <text>
  if command -v jq >/dev/null 2>&1; then
    jq -cn --arg e "$1" --arg c "$2" '{hookSpecificOutput:{hookEventName:$e,additionalContext:$c}}'
  else
    node -e 'process.stdout.write(JSON.stringify({hookSpecificOutput:{hookEventName:process.argv[1],additionalContext:process.argv[2]}})+"\n")' "$1" "$2"
  fi
}

payload="$(cat 2>/dev/null || true)"
if command -v jq >/dev/null 2>&1; then
  prompt="$(printf '%s' "$payload" | jq -r '.prompt // empty' 2>/dev/null || true)"
else
  prompt="$(printf '%s' "$payload" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>{try{process.stdout.write(String(JSON.parse(s).prompt||""))}catch{}})' 2>/dev/null || true)"
fi
[ -n "$prompt" ] || exit 0
low="$(printf '%s' "$prompt" | tr '[:upper:]' '[:lower:]')"

# Look intent is more specific → checked first.
wf=""
case "$low" in
  *preset*|*palette*|*"new look"*|*"a new look"*|*"another look"*|*"color scheme"*|*"visual look"*|*"new visual"*)
    wf="new-look" ;;
esac
if [ -z "$wf" ]; then
  case "$low" in
    *"build a"*|*implement*|*"add a feature"*|*"new feature"*|*"create a feature"*|*"add support"*|*refactor*|*scaffold*)
      wf="feature" ;;
  esac
fi
[ -n "$wf" ] || exit 0

ctx="[suggest-workflow] This looks like a '${wf}' task. Consider driving it with the \`workflow\` skill (chain in .claude/workflows.md) — it runs the right skill sequence with its gates (design → plan → implement → verify → review). Non-binding; skip if it's a trivial one-off."

emit_ctx "UserPromptSubmit" "$ctx"
exit 0
