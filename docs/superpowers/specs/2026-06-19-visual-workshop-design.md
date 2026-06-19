# Visual Workshop — design spec

**Date:** 2026-06-19
**Status:** approved (design); pending implementation plan
**Branch:** `claude/review-claude-md-di5jvm`

## Problem

There is no lightweight way to *discuss and creatively workshop visuals and
design* without going through the full build/deploy cycle. Today, trying a
visual idea means editing the shipped shader/app in `src/` and (to see it)
deploying to `/Test/`. That is heavyweight, risks the live instrument, and the
operator drives everything from a **phone** — so there is no fast feedback loop
for exploring art direction. The "real" `/Test/` visual is still TBD, so this
gap directly blocks finding the look.

## Goal

A **throwaway sandbox loop**, separate from the shipped app, that supports the
full creative lifecycle — **mood/reference → (optional) research & trend scan →
new directions from scratch → refining a look** — with a phone-native feedback
loop: I author an experimental visual, render it to a short audio-driven
**clip**, and send it to the operator in chat; we react and iterate; a winner is
promoted ("graduated") into the real app only on explicit approval.

### Success criteria

- I can spin up a new experimental visual without touching `src/`.
- I can render it to a `~5s` looping `.webm` clip (and stills) and deliver it to
  the phone via `SendUserFile` — **no deploy, no mic**.
- The clip *moves and reacts* (driven by a synthetic "fake song"), so motion and
  audio-reactivity are judgeable, not frozen.
- Experiments are durable (survive a cloud-container wipe) and comparable over
  time.
- A favorite can be graduated into a real `src/looks/` look or `src/shaders/`
  shader through the existing perf + licensing + `visual-qa` gates.

## Non-goals

- **Not** live-mic preview, and **not** a deployed sandbox URL (the operator
  chose clips-in-chat; live/deploy paths are explicitly out of scope here).
- **Not** a GUI shader editor or node graph — authoring is plain GLSL files.
- **Not** changing the shipped instrument's behavior. The workshop is additive
  tooling under `workshop/` + `tools/workshop/` + a skill; it never ships.
- **Not** enforcing the mobile perf budget *during* exploration — only at
  graduation (see Decisions).

## Architecture

Four components. The data flow is: **discussion → sketch (GLSL+params) →
sandbox render (synthetic audio) → clip → chat → iterate → graduate.**

### 1. `workshop/sketches/` — durable experiments

Each sketch is self-contained and **committed to git** (tiny text files; they
are the creative history and must survive cloud wipes):

```
workshop/sketches/<name>/
├── <name>.frag.js     # experimental GLSL ES 3.00, authored from a blank file
└── <name>.json        # { name, note, params, bpm? }  (params + workshop notes)
```

- The fragment shader is written against the **same uniform contract** the
  shipped slime uses, so graduation is a move, not a rewrite (see §Uniform
  contract).
- Authored from scratch per the write-our-own licensing rule
  (`.claude/rules/shaders.md`) — techniques learned anywhere, code from blank.
- Lives outside `src/` → the live instrument is never at risk.

### 2. `workshop/sandbox.html` — the mount point

A minimal page (analogous to `index.html` but disposable) that:

- Reads `?sketch=<name>` and loads that sketch's fragment shader.
- Reuses the **real** `src/gl/renderer.js`, `src/gl/passes.js`, and
  `src/gl/uniforms.js` plumbing (fullscreen triangle, FBO, post chain) so what
  is seen ports straight into the app. The post pass (`src/shaders/post.frag.js`)
  is applied by default so grunge/tonemap match the shipped look; a sketch may
  opt out.
- Drives the shader with a **synthetic "fake song"** instead of a mic (see
  §Synthetic audio) so the visual moves and reacts deterministically.
- Exposes `window.__primordial` (the existing render beacon: `glOk`, `frames`,
  `pause`) so the clip tool can confirm boot + freeze for stills, exactly like
  `test/render-check.mjs`.

### 3. `tools/workshop/clip.mjs` — the recorder (`npm run clip -- <name>`)

- Serves the repo and loads `workshop/sandbox.html?sketch=<name>` in headless
  Chromium via Playwright (already a devDep; reuses `tools/mcp/lib/browser.mjs`
  and the serving logic in `tools/mcp/lib/render.mjs`).
- Records the page with Playwright's **built-in video capture**
  (`recordVideo`) → a `.webm` (no ffmpeg dependency, which the container lacks).
- Runs a fixed duration (default `~5s`) so the synthetic song completes a couple
  of bars, then closes the context to flush the video to
  `workshop/artifacts/<name>.webm`.
- **Stills mode** (`--stills [n]`): captures `n` frames at spread timestamps via
  `runRenderCheck`-style screenshots for side-by-side comparison →
  `workshop/artifacts/<name>-NN.png`.
- `workshop/artifacts/` is **gitignored** (binary, regenerable).
- I then deliver the artifact with `SendUserFile` (status `normal` when replying,
  `proactive` if surfacing unprompted).

### 4. `/workshop` skill — drives the loop

A new skill (`.claude/skills/visual-workshop/SKILL.md`, area `design`) that
encodes the method so it is repeatable:

1. **Mood/reference** — discuss in chat; collect references/palette/vibe words.
   Render reference-style stills if it helps; the brainstorming visual companion
   may be used for mood boards (optional, not required).
2. **Research & trend scan** *(optional, operator opt-in)* — once the vision is
   clear, scan both for similar + **newest/trending** work in that direction
   (creative) and for the **best-practice way to implement** the chosen technique
   on a mobile GPU (technical), and report back concisely (see §Research step).
   Reference-only; nothing is copied.
3. **Author** — scaffold or edit a sketch (`workshop/sketches/<name>/`).
4. **Render** — `npm run clip -- <name>`; deliver the webm/stills to the phone.
5. **React + iterate** — operator reacts in chat; revise the sketch; re-render.
   Keep prior versions for comparison (`<name>` vs `<name>-v2`).
6. **Graduate** (only on explicit approval) — either:
   - promote params into a real look via the `new-preset` skill /
     `create_look` MCP tool, or
   - promote the shader into `src/shaders/` — at which point the **mobile budget
     (≤64 steps, 0.5–0.75 render-scale), licensing note, and `visual-qa` +
     `audio-dsp` review** apply, and the change runs the normal verify gates.

The skill is auto-registered into the router by `gen-docs.mjs` via its
`area:` frontmatter (no manual wiring).

## Uniform contract (sketch ↔ app parity)

The sandbox provides a sketch the exact uniforms the shipped slime pass receives
(from `src/gl/uniforms.js`), so a sketch is "just a fragment shader" against our
contract and graduation needs no rewiring:

- `uResolution` (vec2), `uTime` (float)
- `uAudioTex` (sampler2D, 512×2 R8: row 0 FFT, row 1 waveform)
- bands: `uBass`, `uMid`, `uTreble`, `uLevel`, `uFlux`, `uBeat` (all float)
- `uSteps` (int) for any raymarch budget

Look params are passed from the sketch's `<name>.json` (the sandbox uploads them
as additional uniforms by name, matching the shipped param→uniform convention).

## Synthetic audio model

The sandbox synthesizes a deterministic "fake song" each frame instead of a mic
feed, producing both the band scalars and the 512×2 audio texture so audio
shaders behave as they would live:

- A `bpm` (default ~120, overridable per sketch) drives a bass envelope: a sharp
  attack + exponential decay on each beat → `uBass` and a `uBeat` pulse
  (reusing `src/audio/bpm.js`'s pulse semantics).
- Mid/treble evolve as slow LFOs plus per-beat hats; `uFlux` spikes on the
  synthetic onsets; `uLevel` tracks an overall RMS-like envelope.
- The 512×2 texture is filled to match (a synthetic spectrum + waveform) so
  `texture(uAudioTex, …)` reads are meaningful.

This is deterministic (reproducible clips) and asset-free. A bundled CC0 sample
track is a **possible later upgrade** if the synthetic feel proves insufficient —
out of scope for v1.

## Research step (optional, opt-in)

After the vision is articulated, the operator can opt into a research pass that
finds **similar examples and the newest/trending designs** in that direction, so
we explore from an informed starting point instead of a blank page. It is a step
in the `/workshop` skill (process), not new infrastructure — it reuses existing
research tooling.

It has **two facets**, run together so we know both *what* to make and *how* to
build it well:

1. **Creative / visual** — similar examples and the newest/trending work in the
   chosen direction (motion/VJ design, generative/shader art, neon/grunge
   aesthetics, color/texture trends): *what* to make.
2. **Implementation best-practice** — once a direction/technique is picked,
   research the current best way to implement it for *our* constraints: the right
   algorithm/approach, mobile-GPU perf patterns, and WebGL2/GLSL ES 3.00
   gotchas. Cross-checked against the repo's own `.claude/rules/shaders.md`
   (mobile budget, technique list) and live docs. This is *how* to make it —
   surfaced **before** authoring so the first sketch starts from a sound approach
   instead of being rewritten after a perf/quality dead-end.

- **Tools:** `WebSearch` / `WebFetch` for current/trending work and the
  `deep-research` skill for a deeper multi-source pass; `find-docs` / Context7 +
  the project MCP `search_docs` for technique + API/implementation references.
  Recency matters (trends and library APIs move faster than any training
  cutoff), so this leans on live search. Sources are noted with their licenses.
- **Deliverable (phone-native):** a concise, scannable summary — a few named
  directions/trends, what makes each work, and concrete techniques to try —
  with source links and any license flags. Reference *stills* may be sent via
  `SendUserFile`; large dumps are avoided (output-token cap + small screen).
- **Capture:** if the operator wants it kept, the chosen references + sources +
  license notes are written to an optional
  `workshop/sketches/<name>/references.md` (committed) so the inspiration trail
  is durable and auditable at graduation.

### ⚖️ Licensing guardrail (load-bearing)

This is commercial work. Research is **reference-only**: we study trending work
and *techniques*, then **author every shader from a blank file**
(`.claude/rules/shaders.md`). We do **not** copy CC BY-NC-SA Shadertoy/GLSL code
(NC forbids commercial use; SA forces copyleft). If a specific reference is
reused at all, it must be MIT/CC0/CC-BY with attribution recorded in
`references.md`. The research step explicitly surfaces the license of anything it
finds so this line is never crossed by accident.

## File layout (new)

```
workshop/
├── sandbox.html               # disposable mount page (?sketch=name)
├── synth-audio.mjs            # browser-side fake-song generator (imported by sandbox.html)
├── sketches/
│   └── <name>/
│       ├── <name>.frag.js
│       ├── <name>.json
│       └── references.md       # optional: research/trend sources + licenses
└── artifacts/                 # gitignored: *.webm, *.png
tools/workshop/
└── clip.mjs                   # node recorder: npm run clip -- <name> [--stills n]
.claude/skills/visual-workshop/SKILL.md
```

`package.json` gains a `"clip"` script. `.gitignore` gains
`workshop/artifacts/`.

## Decisions (and why)

| Decision | Choice | Why |
| --- | --- | --- |
| Preview medium | Clips (`.webm`) + stills in chat | Operator on a phone; no deploy lag, no mic; Playwright records webm with zero extra deps. |
| Audio source | Synthetic scripted "fake song" | Deterministic, asset-free; real sample is a later upgrade. |
| Research step | Optional, opt-in; reuses web search + `deep-research` | Explore from an informed start; recency needs live search; reference-only keeps licensing safe. |
| Sketch durability | Committed to git | Cloud wipes everything but git; the history is the creative value. |
| Artifacts | Gitignored | Binary, regenerable from sketches. |
| Perf budget | Enforced only at graduation | Explore lush ideas freely; the ≤64/0.5 budget is a *shipping* constraint. |
| Licensing | Write-our-own applies to sketches too | Commercial work; sketches may graduate into shipped code. |
| Authoring | I write the GLSL; operator steers via clip reactions | Matches "discuss + workshop" from a phone. |
| Reuse | Sandbox reuses `src/gl/*` + `uniforms.js` contract | What we see ports 1:1 into the app; graduation is a move, not a rewrite. |
| Surfacing | `npm run clip` + `/workshop` skill | Phone-runnable; skill makes the loop repeatable + router-registered. |

## Testing / verification

- A `workshop/sketches/_demo/` reference sketch ships so the loop is provable:
  `npm run clip -- _demo` produces a non-empty `.webm`, and `--stills` produces
  PNGs.
- A smoke assertion (extend `test/smoke.mjs` or a small `workshop` check) that
  every sketch's `<name>.json` is valid and its `.frag.js` begins with
  `#version 300 es` (byte one) — mirrors the shader-format rule.
- `node --check` covers `clip.mjs` / `synth-audio.mjs`.
- The shipped app and its `verify.yml`/`render-check` are untouched, so the live
  instrument's gates are unaffected.

## Open items (defer to plan/iteration)

- Exact clip duration/size/loop polish and whether to also emit an animated GIF
  (only if webm playback on the phone disappoints — webm is expected to work).
- Whether the synthetic song needs per-genre presets (house/dnb/ambient) for
  more representative reactivity.
- Whether to expose `clip` as an MCP tool in addition to the npm script (defer
  until the npm path proves out).
