#!/usr/bin/env bash
# PreToolUse hook (matcher: Edit|Write).
# Rule-injector: when an edit targets load-bearing code (shaders/renderer or
# audio), inject the scoped rule + the mobile-playback budget + a DEVICE-AWARE
# verification note into context BEFORE the edit lands — so the mobile budget and
# write-our-own licensing can't be silently skipped. Non-blocking: emits
# hookSpecificOutput.additionalContext and exits 0.
# Robust by design: degrades to a no-op if jq/tooling is missing (never blocks).

set -u

payload="$(cat 2>/dev/null || true)"

# Need jq to read the path and to emit valid JSON; without it, no-op.
command -v jq >/dev/null 2>&1 || exit 0

file="$(printf '%s' "$payload" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)"
[ -n "$file" ] || exit 0

# Classify the edited area → which scoped rule + reviewer agent applies.
area=""; rule=""; agent=""; what=""
case "$file" in
  */src/shaders/*|src/shaders/*|*/src/gl/*|src/gl/*)
    area="shaders/renderer"; rule=".claude/rules/shaders.md"; agent="visual-qa"
    what="MOBILE BUDGET (raymarch steps <=64; heavy SDF pass at 0.5-0.75 render-scale + upscale; sparse FBM <=3 octaves; 4-tap tetrahedron normals; dynamic resolution; pause on visibilitychange) and WRITE-OUR-OWN LICENSING (author every shader from a blank file; reuse only MIT/CC0/CC-BY with attribution; never copy CC BY-NC-SA Shadertoy code)" ;;
  */src/audio/*|src/audio/*)
    area="audio"; rule=".claude/rules/audio.md"; agent="audio-dsp"
    what="AnalyserNode (NOT AudioWorklet) for the visual feed; fftSize 1024 -> 512 bins; smoothingTimeConstant 0.8; the 512x2 R8 audio texture (NEAREST, no mipmaps, re-uploaded per frame); raw-audio capture (echoCancellation/noiseSuppression/autoGainControl off); resume the AudioContext on a user gesture" ;;
  *) exit 0 ;;
esac

# Playback target: the visuals always run on a phone GPU at the gig, regardless of
# who is editing — that is why the mobile budget is load-bearing.
note="Playback target = a phone GPU at a live gig; the mobile budget is non-negotiable."

# Operator device (who is driving THIS session) → tailor the verification path.
case "${CLAUDE_CODE_ENTRYPOINT:-}" in
  *mobile*)
    verify="Operator device: PHONE (laptop-free). You cannot run the desktop perf rig or a Tauri build from here — rely on CI (node test/render-check.mjs + node tools/mcp/lib/validate.mjs) and the static budget; defer real-device FPS to a venue/phone test (perf-budget skill)." ;;
  *web*)
    verify="Operator device: WEB app (no local GPU/profiler in-container). Verify via CI render-check + shader validate; real-device FPS still needs the perf-budget rig on an actual phone." ;;
  *)
    verify="Operator device: laptop/CLI. You can serve locally (python3 -m http.server) to eyeball it, but mobile FPS still needs the perf-budget rig on a real phone." ;;
esac

ctx="[rule-injector] Editing ${area} (${file##*/}). READ ${rule} FIRST — load-bearing: ${what}. ${note} ${verify} After the change, have the ${agent} agent review."

jq -cn --arg c "$ctx" '{hookSpecificOutput:{hookEventName:"PreToolUse",additionalContext:$c}}'
exit 0
