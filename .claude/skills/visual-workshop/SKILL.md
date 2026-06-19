---
name: visual-workshop
description: Workshop visuals for primordial in a throwaway sandbox, separate from the shipped app - discuss a direction, optionally research similar/trending designs + implementation best-practice, author an experimental "sketch" shader, render it to a short audio-driven clip delivered to the phone, iterate, then graduate a winner into a real look or shader. Use when exploring art direction, trying a new visual idea, or refining a look without touching the live instrument.
area: design
---

# Visual Workshop

A sandbox loop for designing visuals without the full build. Sketches live under
`workshop/sketches/<name>/` (committed, durable); the shipped app in `src/` is
never touched until graduation. See `docs/superpowers/specs/2026-06-19-visual-workshop-design.md`.

## The loop

1. **Mood / reference.** Discuss the direction in chat - vibe, palette, motion,
   references. Keep it concise (the operator is on a phone).
2. **Research & trend scan (optional, ask first).** Two facets, run together:
   - *Creative:* similar + newest/trending work in that direction (use
     `WebSearch` / `WebFetch`, or the `deep-research` skill for depth).
   - *Implementation best-practice:* the best way to build the chosen technique
     on a mobile GPU (`find-docs` / Context7 + the project MCP `search_docs`,
     cross-checked against `.claude/rules/shaders.md`).
   Report back concisely with sources + license flags. Reference-only (see
   Licensing). Optionally capture sources to `workshop/sketches/<name>/references.md`.
3. **Author.** Create `workshop/sketches/<name>/<name>.frag.js` (export
   `SKETCH_FRAG`, `#version 300 es` byte one, may `import { COMMON_GLSL }` from
   `src/shaders/common.glsl.js`) and `<name>.json` (`{ name, note, bpm, params }`).
   Params upload by name: length-3 arrays -> `vec3 u<Key>`, numbers -> `float u<Key>`.
   Standard uniforms are always provided: `uResolution`, `uTime`, `uAudioTex`,
   `uBass`/`uMid`/`uTreble`/`uLevel`/`uFlux`/`uBeat`, `uSteps`.
4. **Render + deliver.** `npm run clip -- <name>` produces
   `workshop/artifacts/<name>.webm`; `--stills N` produces keyframes. Deliver the
   artifact to the operator with `SendUserFile` (file:// links do not open on the
   phone). Use `--secs S` for a longer capture.
5. **React + iterate.** Operator reacts in chat; revise the sketch; re-render.
   Keep prior versions for comparison (e.g. `<name>` vs `<name>-v2`).
6. **Graduate (only on explicit approval).** Either promote params into a real
   look via the `new-preset` skill / `create_look` MCP tool, or promote the
   shader into `src/shaders/`. Graduation is when the mobile budget (`<= 64`
   steps, `0.5`-`0.75` render-scale), the licensing note, and `visual-qa` +
   `audio-dsp` review apply, plus the normal verify gates
   (`node test/smoke.mjs`, `node test/render-check.mjs`).

## Licensing guardrail (load-bearing)

Commercial work. Research is reference-only: study trending work and technique,
then author every shader from a blank file (`.claude/rules/shaders.md`). Never
copy CC BY-NC-SA Shadertoy/GLSL code. Anything reused must be MIT/CC0/CC-BY with
attribution recorded in `references.md`.

## Notes

- The sandbox uses a deterministic synthetic "fake song" (`workshop/synth-audio.mjs`),
  not a mic - clips are reproducible. Real-track audio is a later upgrade.
- Workshop tooling is dev-only and never deployed (deploy stages only `index.html src`).
