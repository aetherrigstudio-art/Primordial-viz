# Reuse libraries & tools — vetted catalog (mapped to the roadmap)

Open-source libraries/repos we can genuinely pull from (code or technique) for Primordial-viz,
mapped to the roadmap gaps. Provenance: grounded in the NotebookLM "Elite WebGL Landing Pages"
corpus (notebook `688cc151`) for the graphics/audio/motion stack, plus agent knowledge for the
audio-feature / MIDI-OSC / tooling rows (those are flagged **[verify]** — confirm license +
current state before adopting). Roadmap item numbers refer to the consolidated roadmap.

## Licensing rule (this is commercial work)
Adopt only **MIT / Apache-2.0 / BSD / ISC / CC0**. Exclude **GPL / AGPL / LGPL / CC-NC / CC-SA /
Commons-Clause / custom-restrictive**. The **write-our-own-shaders** rule bans copying NC/Shadertoy
GLSL — but using an **MIT library's** built-in effects (e.g. postprocessing's bloom/god-rays) is
fine: that's MIT code, not copied NC shaders. Author bespoke looks from blank GLSL.

## Atmospherics post-pass (1.7)
- **`pmndrs/postprocessing`** + **`@react-three/postprocessing`** (MIT) — `GodRaysEffect`,
  `BloomEffect`, depth-of-field, merged into few passes (mobile-conscious vs. raw `EffectComposer`).
  The clearest fit for the god-rays/haze/bloom atmospherics. Caveat: GPU cost — gate behind the
  `makeFrameMonitor` regress hook (drop it first under load), keep DPR ≤ 1.5.

## Splat compositing, tuning & animation (1.3 / 1.4 / 1.8)
- **`terminusfilms/splatalign`** (MIT [verify]) — ICP alignment of splat captures → outputs a 4×4
  three.js transform. Helps tune the `*_TRANSFORM` knobs and accurately composite drapery + rainforest.
- **`naruya/gaussian-vrm`** (MIT [verify]) — skinned splat animation via **Linear Blend Skinning** —
  a working reference for the LBS-based drapery flutter/gather subset animation (1.4).
- **`mkkellogg/GaussianSplats3D`** (MIT) and **`antimatter15/splat`** (MIT) — reference renderers
  (we render with Spark, so these inform sorting / LOD / culling technique, not adoption).
- **`playcanvas/supersplat`** (MIT) — already our asset cleanup/compression tool; confirmed correct.
- **`KeKsBoTer/web-splat`** (Rust/WebGPU [verify]) — GPU radix-sort reference; WebGPU, off our current
  WebGL2 path — reference only.

## Journey choreography & camera (1.2)
- **Theatre.js** (`@theatre/core` + `@theatre/r3f`, Apache-2.0) — our planned choreography tool; the
  corpus confirms the custom `rafDriver` sync (ticks with R3F), JSON state export, and native
  audio-track sync (useful for the beat-synced camera).
- **GSAP** — now **100% free for commercial use** (the old licensing concern is gone); core tweening
  can complement Theatre for eased moves. We deliberately skip **ScrollTrigger** and **Lenis**
  (`darkroomengineering/lenis`, MIT smooth-scroll) — our nav is arrow/`travel`-driven, not scroll.
- **`pmndrs/maath`** (MIT) — `damp` / `damp3` framerate-independent easing; the canonical, tested
  version of the hand-rolled exponential damp in `immersive/src/mode/instrumentCamera.js`.

## Performer control UI (1.6 / control layer)
- **Leva** (MIT) — React-Three-Fiber GUI panels bound to state; a natural tuning surface over the
  control schema (movement / bloom / lighting params). **lil-gui** (MIT) — vanilla equivalent for the
  `src/` instrument.

## Audio features & beat (4.1) — [verify]
- **Meyda** (MIT [verify]) — bark / mel / MFCC / spectral perceptual features: the targeted fit for
  the "perceptual bands" gap. Lean, browser-friendly (the corpus suggested Tone.js, which is heavier).
- **`Tonejs/Tone.js`** (MIT) — only if scheduling/sequencing is needed; overkill for the lean gig path.

## MIDI / OSC (1.6) — [verify]
- **webmidi.js** (`djipco/webmidi`, Apache-2.0 [verify]) — robust Web MIDI wrapper handling the
  capability-gating + cross-browser quirks our raw `requestMIDIAccess` adapter does by hand.
- **osc-js** (`adzialocha/osc-js`, MIT [verify]) — browser OSC parsing **and** the UDP↔WebSocket
  **bridge** the roadmap says the operator must run (it is that relay + the browser-side parser).

## RAG / tooling (2.2 global layer) — [verify], agent knowledge
- **sqlite-vec** (MIT [verify]) — vector search that compiles to **WASM** (works where native arm64
  binaries don't, e.g. this Termux device), or **libSQL/Turso** (MIT core [verify]) for a synced store.
  Right-sized for a solo, git-only, phone-driven project — skip heavy pgvector / hosted infra.

## Excluded — license blockers
- **Hydra** (AGPL) — live-coding video synth; AGPL is incompatible with commercial use.
- **LYGIA** shader library — restrictive/custom license; reference-study only, do not import.
- **audioMotion-analyzer** (AGPL, per prior product-domain research) — blocker.

## Verify-before-adopt
The **[verify]** rows are from agent knowledge or vague corpus license labels — confirm the exact
license (repo `LICENSE`/`package.json`) and current maintenance before adding any as a dependency.
Prefer small, tree-shakeable, browser-friendly packages (the gig path aims for minimal runtime deps).
