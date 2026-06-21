# Refactor Phase 5 — Audio path

Concern: `src/audio/*` (input.js, analyser.js, bpm.js) vs `.claude/rules/audio.md`.
Controller-read directly this session; cite `file:line`.

## Problem (clean subsystem — matches the rule)
- **Conforms to audio.md** (verified by reading): main-thread `AnalyserNode`
  (`analyser.js:11`, fftSize 1024 → 512 bins, smoothing 0.8); features
  `{bass,mid,treble,level,flux}` (`analyser.js:96-104`); raw getUserMedia constraints
  (`input.js:27-35`); resume-on-gesture (`input.js:46-48`); `devicechange` refresh
  (`input.js:17-23`); mic never connected to destination = no feedback
  (`analyser.js:43-44`). FACT.
- **Tunables are hardcoded magic numbers**: band ranges `analyser.js:33-35`
  (`_bassRange=[1,6]` etc.), flux gain `×12` `analyser.js:69`, smoothing `0.6`
  `analyser.js:38`. Comments say these need tuning "against a real track at the venue"
  — but they're buried in code, not in `src/params` where the operator can adjust. FACT.
- **Zero unit tests** for the audio math (flux, RMS, band averaging) — coverage is
  integration-only. (→ phase 9 owns the test gap; noted here as the seam.) FACT.
- **Live-music reactivity is unverified** (task_plan "verify vs real music live") — a
  venue/real-track concern, not a code defect.

## Solution
Light-touch: make the audio tunables adjustable + testable without changing behavior.
1. Extract the band ranges / flux gain / smoothing into named constants (or, better, into
   `src/params/schema.js` so they're operator-tunable like the visual params).
2. Add pure unit tests for `_avg`, flux, and RMS (they're pure functions over typed
   arrays — trivially testable) — coordinate with phase 9.
3. Leave the DSP design as-is; it's correct and rule-compliant.

## Commits (tiny, each green)
1. Name the audio magic numbers (no behavior change). 2. (Optional) promote tunables to
   params + wire a control. 3. Add `test/audio.test.mjs` (pure-function unit tests).

## Decision doc / ADRs
- **Optional decision**: expose audio tunables in the operator UI (params) vs keep them
  code-level constants. Minor; an ADR only if it changes the params schema contract.

## Testing
- `npm run smoke` + the new `test/audio.test.mjs` green (deterministic, no audio device).
- `node test/render-check.mjs` green (the audio→uniform path still feeds the shader).
- `audio-dsp` agent review before done.

## Out of scope
- Live-music tuning (needs a real track + venue — can't verify in-container).
- BPM algorithm choice (realtime-bpm-analyzer) — that's a feature decision, not refactor.
