# Product-domain comparison — Primordial-viz vs. the audio-visual web field

**Date:** 2026-06-19 · **Axis:** the **product** — raw-WebGL2 / GLSL-shader /
audio-reactive visual web apps — regardless of whether the peer uses Claude.
(The separate Claude-tooling axis lives in
`research/claude-repo-comparison/REPORT.md`.)

**Method:** every peer profiled from **primary sources** (its own `README`,
`package.json`, `src/` renderer + audio modules, `LICENSE`), via parallel research
agents — not blog summaries. Baseline row verified from this working tree
(`src/audio/analyser.js`, `src/gl/*`, `src/shaders/*`, `src/looks/*`). Star counts
are GitHub's reported figures (approximate).

**Why these five.** They span the real design space we sit in: two **Milkdrop
engines** (butterchurn = JS/WebGL2, projectM = C++/WASM) that define the "preset
program" model; one **live-coding synth** (hydra) for the DSL-as-look model; one
**Shadertoy-style GLSL VJ runtime** (VEDA) — architecturally our closest cousin;
and one **audio-analysis library** (audioMotion-analyzer) that is the state of the
art on the *audio->features* axis even though it draws to Canvas 2D, not shaders.

**`Kind` legend:** `baseline` (us) · `product` (a deployable app/engine) ·
`library` (a module you build a product on top of).

## Dimensions

1. **Renderer architecture** — raw WebGL2 vs library; FBO / ping-pong / post chain.
2. **Audio->features** — FFT / AnalyserNode, audio texture (Shadertoy-style?),
   beat/BPM.
3. **Mobile perf budget** — render-scale/FBO downscale, raymarch step cap, dynamic
   resolution, pause-on-hidden.
4. **Looks / preset system** — how visuals are parameterized and switched.
5. **Deploy + license** — static? build step? commercial-safe license?

## Master comparison table (6 rows)

| Repo | Kind | 1. Renderer architecture | 2. Audio->features | 3. Mobile perf budget | 4. Looks / preset system | 5. Deploy + license |
|---|---|---|---|---|---|---|
| **Primordial-viz** (this repo) | baseline | **Raw WebGL2**, no library; fullscreen-triangle raymarched SDF; **FBO ping-pong post chain** (bloom/feedback/grade) at 0.5-0.75 render-scale | **Web Audio `AnalyserNode`**, fftSize 1024->512 bins; **512x2 R8 audio texture** (row0 `getByteFrequencyData`, row1 `getByteTimeDomainData`, Shadertoy-iChannel-matched); band scalars `{bass,mid,treble,level,flux}`; realtime-bpm + tap-tempo | **Day-one budget:** FBO render-scale, **raymarch steps <=64**, **dynamic resolution** (auto-drop on frame-time), **pause on `visibilitychange`** | **Params-only JSON** `{id,name,description,params}` over **one shared slime shader**; `registry.js`; switching looks = data, not code | **Static, zero-runtime-deps**, no build step on the web path (Vite/Tauri additive); **own LICENSE, write-our-own shaders (commercial-safe)** |
| jberg/butterchurn | product | **WebGL2-required**; classic **ping-pong FBO** (prev/target swap) + 3-level blur pyramid + optional FXAA; faithful Milkdrop **warp + comp** two-pass | **Web Audio `AnalyserNode`**, fftSize 1024; **bass/mid/treble** (dual-EMA, `val`+`att` flavors); no discrete beat detector; **no audio texture** (features stay CPU-side as equation vars) | **Minimal** — manual `setRendererSize`/`pixelRatio`/mesh size only; **no auto dynamic-res, no pause-on-hidden** (caller's job) | **Converted Milkdrop `.milk` presets** -> JS modules (per-frame/per-pixel **EEL** equations + warp/comp shaders); `eel-wasm` compiles EEL->WASM; **`blendTime` cross-fade** between presets | npm + Rollup UMD bundle, statically embeddable; **engine MIT** — but **bundled presets are converted community content with their own unclear terms** |
| hydra-synth/hydra | product | **regl** (functional WebGL), not raw/three; **4 output framebuffers** `o0`-`o3` with `src(oN)` **feedback**; chained-function DSL compiles to one fragment shader per output | **Meyda** FFT; bins as JS scalars `a.fft[]` (0-1), `setBins/setCutoff/setScale/setSmooth`; audio-reactive by default; **no audio texture** (reference `a.fft[i]` in JS) | **None documented** — no render-scale, dynamic-res, step cap, or pause-on-hidden; only `precision` + custom loop. Targets desktop Chromium | **Look = live-coded JavaScript** (the chained DSL itself); a "patch" is a code snippet/URL, **not** a JSON preset; maximally expressive, unconstrained (no schema) | npm + standalone editor (Vite); runtime deps (regl/meyda). **AGPL-3.0 — strong network copyleft; hard blocker for a closed commercial product** |
| projectM-visualizer/projectm | product | **C++/OpenGL ES**; Milkdrop warp(per-pixel mesh)+comp over FBOs; shaders generated at build, HLSL->GLSL transpile; **web = Emscripten->WebGL2** (`MIN/MAX_WEBGL_VERSION=2`, full-ES3 emulation) | **Own DSP** (no AnalyserNode): PCM in -> `MilkdropFFT`, `Loudness`, `WaveformAligner`, **built-in beat detection**; host must supply PCM | Tunable **mesh size** + target FBO size as quality dials; **no built-in adaptive/dynamic quality**; WASM Milkdrop on mobile is marginal | **Milkdrop `.milk`** format (per-frame/per-pixel eqns + warp/comp); thousands of community presets in **separate repos**; `playlist` API for switching/shuffle | C++/CMake; web = (large) WASM bundle. **LGPL-2.1** (closed use only via dynamic link — **WASM static link likely triggers copyleft**); `.milk` presets carry **own community licenses** |
| fand/veda (vedajs) | product | **three.js** `WebGLRenderer`; fragment-shader-centric; real **backbuffer ping-pong** (swap two render targets -> `uniform sampler2D backbuffer`) + **multipass `PASSES`** (per-pass TARGET/FLOAT/size) | **Web Audio `AnalyserNode`** (fftSize 2048) -> **two `DataTexture`s** `spectrum` (`getByteFrequencyData`) + `samples` (`getByteTimeDomainData`) + a `float volume` (RMS) — **Shadertoy-iChannel-style**, same intent as our 512x2 texture | **Minimal** — `pixelRatio` rc + per-pass WIDTH/HEIGHT (render-scale *possible*); **no dynamic-res, step cap, or pause-on-hidden**; desktop Atom tool | **Look = a `.frag` file** + layered config (file-header > project `.vedarc` JSON5 > global); multipass/IMPORTED textures declared in rc; switch = open another shader file | Atom package (**Atom deprecated 2022**) + `vedajs` npm engine (Rollup/TS). **MIT — the most commercial-friendly product peer; safe to learn from** |
| hvianna/audioMotion-analyzer | library | **Canvas 2D** (`getContext('2d')`) — **no WebGL/GLSL**; draws bars via `fillRect`/`arc` + canvas gradients. Not a shader engine | **Web Audio `AnalyserNode`** (stereo, `getFloatFrequencyData`, fftSize up to 32768, default 8192); **log/linear/bark/mel** scales; **ANSI S1.11 octave bands**; `getEnergy(range)`; **peak-hold w/ gravity+fade** | `maxFPS` cap, `pixelRatio`, **`loRes`** half-resolution mode; no adaptive raymarch budget (2D draw is cheap) | "Look" = options config: 5 built-in gradients + `registerGradient`, display/color modes, effects (LED/mirror/reflex/radial); options-as-look | npm ESM/CJS, ~30 kB, **zero runtime deps**. **AGPL-3.0-or-later — strong network copyleft; hard NO for closed commercial use** (reference only) |

## Per-repo notes

**jberg/butterchurn** ([link](https://github.com/jberg/butterchurn), **MIT**
engine, ~1.9k stars — `product`) — the most directly comparable *renderer*: WebGL2
with a real ping-pong FBO chain + blur pyramid + FXAA, faithfully implementing
Milkdrop's warp/comp two-pass. Audio is a clean `AnalyserNode` -> bass/mid/treble
path with two useful flavors per band (**`val` normalized vs `att` attenuated/
long-EMA**). Borrowable for us: **preset cross-fade blending** (`blendTime`) — we
swap params instantly; compiling expression-language presets to **WASM** (`eel-wasm`)
if we ever want richer data-driven looks. **Licensing trap to note:** the engine is
MIT but the **bundled presets are converted Milkdrop community art** with their own
(often unclear) terms — exactly the "engine != visuals" distinction our write-our-own
rule exists to enforce. No mobile budget to speak of (caller's responsibility).

**hydra-synth/hydra** ([link](https://github.com/hydra-synth/hydra), **AGPL-3.0**,
~2.6k stars — `product`) — Olivia Jack's live-coding synth, built on **regl** with
four feedback-capable outputs (`o0`-`o3`, `src(oN)`). Its "look" is **live-coded JS**
(the chained `osc().rotate().modulate()` DSL), the opposite of our params-only-JSON
model: maximally expressive, but no schema/validation/safe coercion. Borrowable
ideas: the **multi-output + feedback mental model** for FBO design; **`modulate()`**
(warp coords by a texture's R/G) as a cheap distortion primitive; and the tiny
performer-facing **`setSmooth`/`setCutoff`/`setScale`** audio-shaping API. No mobile
budget. **License is the headline:** AGPL-3.0's network copyleft means we **cannot
vendor or fork** it into a closed commercial instrument — reference/inspiration only,
fully consistent with our write-our-own rule.

**projectM-visualizer/projectm**
([link](https://github.com/projectM-visualizer/projectm), **LGPL-2.1**, ~4.3k stars
— `product`) — the C++ Milkdrop engine; its **web build is Emscripten->WebGL2**, so
it lands on the same GL target as us but as a compiled WASM blob rather than hand-
written JS. It owns the **entire DSP in C++** (its own FFT + **built-in beat
detection** + a `WaveformAligner` that stabilizes the waveform so visuals don't
jitter — a nice trick). Borrowable: the **warp-mesh** distortion primitive, a
**playlist/transition** layer for sequencing looks across a set, and host-tunable
**mesh size** as a single quality knob (pairs well with our auto dynamic-res).
**Licensing caution:** LGPL-2.1 permits closed use only via *dynamic* linking — a
WASM static link likely triggers copyleft — and the `.milk` presets carry their own
community licenses. A heavy, large-WASM option vs our zero-dep ESM; best as
reference.

**fand/veda (vedajs)** ([link](https://github.com/fand/veda), **MIT**, ~531 stars /
engine ~163 stars — `product`) — **architecturally our closest cousin.** A
fragment-shader-centric GLSL runtime (on three.js) with real **backbuffer
ping-pong** and a declarative **multipass `PASSES`** spec — the same shape as our
post chain. Critically, its audio model is **Shadertoy-iChannel-style**: an
`AnalyserNode` feeds a **`spectrum` texture + a `samples` texture + a `volume`
scalar** — the same design intent as our **512x2 R8 audio texture** (row 0 freq,
row 1 time). This independently **validates our layout choice**; their two-texture
split (vs our single 2-row texture) is an alternative if we ever want independent
sizing. Borrowable: the **layered rc config** precedence (file-header > project
`.vedarc` > global) for per-look overrides, and the **named-`TARGET` multipass spec**
if our chain grows. **MIT** = the most commercial-friendly product peer to learn
from. *Caveat:* the Atom package side is legacy (Atom sunset 2022); the `vedajs`
npm engine is the living artifact, maintenance recency unverified.

**hvianna/audioMotion-analyzer**
([link](https://github.com/hvianna/audioMotion-analyzer), **AGPL-3.0**, ~922 stars
— `library`) — included for the **audio->features axis**, where it's state of the
art, even though it renders to **Canvas 2D** (so its render layer teaches us nothing
— we're raymarched WebGL2). On audio it is materially richer than our reduction:
**perceptual frequency scales (bark/mel)**, **ANSI S1.11 octave-band tables**,
`getEnergy(range)` for arbitrary/named bands, and **peak-hold with gravity + fade**.
Borrowable (technique only): perceptual band-splitting so our `bass/mid/treble`
track how humans hear rather than raw linear bins; an on-demand `getEnergy(range)`
API; and a decaying **peak envelope** to drive shader flashes beyond raw `flux`.
**License:** AGPL-3.0 — a hard NO to copy/link for our closed commercial product;
reference for technique only.

## Synthesis — where Primordial sits in the field

### The big finding: we are the only one purpose-built for the mobile gig path
Across all five peers, **mobile performance is an afterthought** — and that is our
single clearest differentiator on the product axis. butterchurn, hydra, VEDA, and
projectM all leave render-scale/quality to the caller and ship **no dynamic
resolution, no raymarch step cap, and no pause-on-hidden**; hydra and VEDA target
the desktop outright. audioMotion has a `loRes` + `maxFPS` cap but it's a cheap 2D
draw that never needed a raymarch budget. Primordial bakes the **mobile budget in
from day one** (FBO render-scale, steps <=64, auto dynamic-res, visibilitychange
pause) because the *playback device is always a phone GPU at a venue*. None of the
field is designed for that constraint.

### Where the field is ahead of us (adopt — technique only, license-safe)
1. **Preset cross-fade blending** (butterchurn's `blendTime`). We swap look params
   instantly; a timed cross-fade between looks is a cheap, high-impact polish for a
   live set. Pure technique — no code to copy.
2. **Perceptual audio bands + richer features** (audioMotion: bark/mel scales, ANSI
   octave tables, `getEnergy(range)`, peak-hold-with-gravity). Our `{bass,mid,
   treble,level,flux}` is serviceable but linear-bin and coarse; perceptual
   splitting and a decaying peak envelope would make reactivity more musical. Learn
   the math, write our own (audioMotion is AGPL — do **not** copy/link).
3. **A look playlist / transition layer** (projectM's playlist API). For sequencing
   looks across a performance, not just manual switching.
4. **A waveform aligner** (projectM) — stabilizing the time-domain row so visuals
   don't jitter on transients; a small DSP win on our 512x2 texture's row 1.

### Where we're ahead (keep)
- **The mobile budget** (above) — unmatched in the set.
- **Params-only JSON over one shared shader** — the most *constrained, validated,
  safe-to-switch* look model here. butterchurn/projectM presets are whole programs;
  hydra patches are arbitrary code; VEDA looks are whole `.frag` files. Ours is the
  only one with a schema + safe coercion + versioned localStorage, which is what an
  operator on a phone actually needs (no way to break the instrument by switching).
- **A commercial-safe, zero-dependency, no-build static web path.** This is the
  licensing punchline: **of the five, only VEDA (MIT) is even safe to *learn* from
  freely; hydra and audioMotion are AGPL (network copyleft — hard blockers), and
  projectM (LGPL) + the Milkdrop `.milk`/preset corpus carry copyleft + unclear
  community terms.** Every Milkdrop-derived path also drags **preset art with its
  own licensing**. Our **write-our-own-shaders** rule is not paranoia — it's the
  only posture that keeps a commercial product clean against exactly this field.

### The audio-texture validation
Our most deliberate technical choice — packing FFT + waveform into a **512x2,
Shadertoy-iChannel-compatible audio texture** — is **independently corroborated by
VEDA**, which does the same thing (spectrum + samples textures + volume) for the
same reason (port shaders prototyped on Shadertoy with zero rewiring). butterchurn,
hydra, and projectM all keep audio features CPU-side instead; VEDA and Primordial
are the two that put audio *on the GPU* the Shadertoy way. Good company, and a sign
the choice is sound.

---
*5 parallel research agents (butterchurn, hydra, projectM, VEDA, audioMotion-
analyzer), each reading primary sources (README / package.json / renderer + audio
src / LICENSE). Baseline verified from this working tree. Unverifiable items flagged
per-profile; star counts approximate.*
