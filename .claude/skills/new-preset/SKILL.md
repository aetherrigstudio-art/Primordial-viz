---
name: new-preset
description: Scaffold a new visual "look" for primordial — a params-only JSON preset in src/looks/, wired into the look registry (all looks share the slime shader). Use when asked to add, create, scaffold, or start a new look / preset / visual variation.
---

# new-preset — scaffold a visual "look"

A "look" is **data**: a JSON preset of parameter values. In the shipped renderer
**all looks share the single slime shader** (`src/shaders/slime.frag.js` + the
post chain) — a look only varies the params (palette, blob count, smin k, warp,
glow, SSS, and the post intensities). This skill creates the preset and wires it
into the registry. It does **not** create a new shader (that would need renderer
multi-program support, which doesn't exist yet — see "Authoring a new shader").

## Inputs to gather

1. **Slug** — kebab-case id, e.g. `wet-chrome`, `acid-fog`. Used for the filename
   and the registry key.
2. **Display name** — human label shown in the UI (e.g. "Wet Chrome").
3. **Description** — one line shown in the look list.
4. (optional) **Param overrides** — any of the keys in `src/params/schema.js`
   (`colA`, `colB`, `blobCount`, `sminK`, `warpAmt`, `glow`, `sss`, `bloom`,
   `grain`, `scanline`, `chroma`, `vignette`). Anything omitted falls back to the
   schema default.

## Steps

1. **Create the preset** at `src/looks/<slug>.json` — shape
   `{ id, name, description, params }` (mirror `src/looks/slime-green.json`):

   ```json
   {
     "id": "<slug>",
     "name": "<Display Name>",
     "description": "<one-line description>",
     "params": {
       "colA": [0.05, 0.9, 0.35],
       "colB": [0.2, 1.0, 0.5],
       "blobCount": 5,
       "sminK": 0.55,
       "warpAmt": 0.5,
       "glow": 1.0,
       "sss": 1.5,
       "bloom": 1.0,
       "grain": 0.12,
       "scanline": 0.18,
       "chroma": 0.006,
       "vignette": 0.7
     }
   }
   ```

   There is **no `shader` field** — looks are params only.

2. **Register it** in `src/looks/registry.js` (two edits, keep them in sync):
   - Add the slug's filename to the `LOOK_FILES` array (so it's fetched on a real
     server).
   - Add a **byte-for-byte mirror** of the JSON object to the `INLINE_LOOKS`
     array (the `file://` fallback — registry loads from here when `fetch()` is
     unavailable). Keep both lists in the same order.

3. **Remind the author** of the rules that apply (don't enforce — the hook/rules
   do that):
   - Params here are just defaults; the live values come from the param store and
     the UI sliders.
   - Keep colors in `[0,1]` floats; respect the slider ranges in `schema.js`
     (out-of-range values are clamped by `coerceParams` on load).

## Authoring a *new shader* (out of scope for this skill)

The renderer currently compiles one slime program. To add a genuinely different
visual you must extend `src/gl/renderer.js` / `src/gl/passes.js` to compile and
select multiple fragment programs, then add a `src/shaders/<slug>.frag.js` ES
module (GLSL exported as a `/* glsl */` template string, `#version 300 es` on
byte one — mirror `slime.frag.js`) and a way for a look to name its program.
That's a code change governed by `.claude/rules/shaders.md` (mobile budget,
write-our-own licensing), not a preset scaffold.

## Output

Report the touched paths (`src/looks/<slug>.json` and the two `registry.js`
edits) and the one-line check to verify it loads: switch to the new look in the
UI look-switcher. Do not run a build — there is none.
