# Refactor Phase 4 — Shaders / renderer

Concern: `src/shaders/*`, `src/gl/*` vs the playback budget + write-our-own licensing.
Evidence agent-gathered + controller spot-checked; cite `file:line`.

## Problem (mostly healthy — this is the cleanest area)
- **Budget compliance is GOOD** (verified): step cap `slime.frag.js:113` hard `< 64`;
  dynamic res `main.js:110-133`; pause-on-visibility `main.js:358-361`; context-loss
  `renderer.js:76-85`; DPR cap `main.js:36`. No correctness gap. FACT.
- **Licensing is clean**: all GLSL authored in-repo as template strings with
  "100% original" headers (`common.glsl.js:1-6`, `slime.frag.js:1-7`); no copied
  Shadertoy/external code; no `.glsl` files on disk. Commercial-safe. FACT.
- **Doc↔code divergence (Nit)**: `.claude/rules/shaders.md` says render-scale "0.5–0.75",
  but `schema.js:29` allows 0.5–1.0 (default 0.7). Not a bug — doc lags the design. FACT.
- **Polish (Nit)**: magic numbers in `slime.frag.js` (0.04/0.6/0.8/0.5 repeated, e.g.
  `:49,:76,:145,:166`) lack named consts; `renderer.js:151/162` duplicate the
  `texImage2D` HDR/RGBA8 fallback. Readable but not DRY. FACT.

## Solution
This area needs **polish, not a rewrite** — keep scope tight to avoid destabilizing the
one solid subsystem.
1. Reconcile `shaders.md` render-scale wording with `schema.js` (pick the real range).
2. Name the repeated magic numbers in `slime.frag.js` as `const float` with intent.
3. Extract the `renderer.js` FBO texture-setup fallback into one helper.

## Commits (tiny, each green)
1. shaders.md render-scale doc fix. 2. slime.frag.js named constants (one logical group
   per commit, re-render-check after each). 3. renderer.js texSetup helper.

## Decision doc / ADRs
- None needed — no expensive-to-reverse calls. (Re-platform target, if it changes the
  renderer, is a future decision, not this phase.)

## Testing
- `node test/render-check.mjs` green after EACH commit (shaders still compile, loop
  advances, no console errors) — this is the load-bearing gate for shader edits.
- Visual diff: `test/artifacts/render.png` unchanged in intent (named-constants commit
  must be a no-op refactor — verify the render looks identical).
- `visual-qa` agent review before marking done.

## Out of scope
- Any new look/art-direction (that's `new-preset`/`visual-workshop`, not a refactor).
- The audio uniforms feeding the shader (phase 5).
