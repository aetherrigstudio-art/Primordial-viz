# WebGL / WebGPU creative technique notes (reference study)

Curated, **our-own-words** technique notes distilled from a set of standout
creative WebGL/WebGPU sites and libraries. Purpose: give future agents
retrievable, concrete craft when building **primordial** (the audio-reactive
raymarched-slime instrument) and the **artist landing page** — so a RAG query
like "audio-reactive particle field" or "scroll-driven scene transition" returns
real technique, not generic advice.

## How to read these (scope + licensing)

- **Reference study only.** Per `.claude/rules/shaders.md` (commercial work):
  learn the *technique*, author every shader/asset from a blank file. **Never
  copy** closed-site source. Only *reuse* code that is MIT/CC0/CC-BY, with
  attribution. Runtime-dependency decisions follow the re-platform ADRs
  (`docs/decisions/`) — kept lean for the mobile budget, and on the current
  static web path preferably replicated ourselves rather than pulled in as a lib.
- **The current renderer is WebGL2 + GLSL ES 3.00 + Web Audio AnalyserNode**
  (stack direction follows the re-platform ADRs, `docs/decisions/`). Most
  projects below use three.js / WebGPU / TSL; each note extracts the transferable
  *concept*, and is honest where it needs WebGPU compute the current renderer
  can't match. The **mobile budget** (0.5–0.75 FBO + upscale, raymarch steps ≤64,
  dynamic resolution, pause on hidden) constrains every transfer.
- **Provenance:** project list handed to us via the webgpu.com community
  showcase; each entry was verified against an independent authoritative source
  (author site / GitHub / Awwwards / Codrops). Two could not be confirmed and are
  marked **UNVERIFIED**. Ties to the parked landing-page-rag thread
  (`research/landing-page-rag/BRIEF.md`) and the frontpage brief
  (`workshop/sketches/frontpage/BRIEF.md`).

## Aurelia — fully procedural jellyfish

**What it is:** A jellyfish generated entirely on the GPU in real time (Three.js
WebGPURenderer + TSL), by Niklas Niehus. No baked textures.

**Core technique:** A hemisphere "bell" mesh contracts on a sinusoid to mimic the
swim-pulse; trailing tentacles are GPU verlet chains; translucency and the
iridescent shimmer come from thin-film-style shading plus an additive volumetric
glow.

**Transfer to our stack:** The bell becomes an SDF in our raymarch with a
sinusoidal radius term — and that pulse is trivially **audio-reactive** (drive
contraction rate by bass/BPM, glow by level). Verlet tentacles → either a small
ping-pong position/velocity float-texture sim (transform feedback in WebGL2) or,
cheaper and within the step cap, SDF tendrils displaced by domain-warped noise.
Iridescence is a cheap thin-film approximation in the fragment shader; glow rides
our existing post-chain bloom.

**Relevance:** high (instrument — a pulsing translucent organic mass *is* our
"slimy" identity); low–med (landing).

**Source / license:** holtsetio.com/lab/aurelia ; webgpu.com showcase. Closed —
study only.

## curtains.js / gpu-curtains — DOM-synced shader planes

**What it is:** Libraries by Martin Laxenaire that turn HTML elements
(images/video/canvas) into WebGL (curtains.js) or WebGPU (gpu-curtains) textured
planes positioned exactly where CSS places them. Both MIT.

**Core technique:** Each frame, read an element's bounding box and map its CSS
pixel rect into clip space, then render a shader plane there — so shader effects
scroll and resize with normal document flow instead of fighting it.

**Transfer to our stack:** Directly useful for the **landing page** — add shader
accents (hover ripple, displacement, a slime hero plane) while keeping real,
accessible HTML layout. MIT means we *may* reuse with attribution, but rather
than add a runtime dep we'd likely **replicate the bbox→clip-space mapping
ourselves** (it's small) to honor the zero-dep web path.

**Relevance:** high (landing — cleanest way to marry our WebGL look to an
accessible DOM); low (instrument).

**Source / license:** github.com/martinlaxenaire/gpu-curtains (MIT, confirmed);
curtainsjs.com.

## Igloo Inc — procedural ice + particle swarm

**What it is:** Awwwards Site-of-the-Day corporate site (Abeto + Bureaux) where
portfolio items sit encased in procedurally grown ice blocks.

**Core technique:** A custom growth algorithm grows detailed crystal structure
inside a base primitive (cube/cylinder); scenes cut with chromatic aberration +
frost dissolves; a footer particle swarm coalesces into different 3D shapes per
hovered link, colored by particle velocity.

**Transfer to our stack:** The crystal *growth* is heavy/precompute — skip for
realtime — but the **refraction + chromatic aberration + frost** look is cheap
post FX. Particle-coalesce-to-shape = ping-pong particles pulled toward target
positions, and we can **swap targets on the beat**. A noise-thresholded **frost
dissolve** is a great cheap transition for look switches.

**Relevance:** med (instrument — transitions + particles); high (landing —
gold-standard structure and transition craft).

**Source / license:** awwwards.com/igloo-inc-case-study.html ; webgpu.com. Closed.

## DRIFT — a million GPGPU particles

**What it is:** 1M+ GPGPU particles forming a lost-astronaut void scene whose
behaviour tracks an AI-generated diary's mood (Ming Jyun Hung; Three.js + custom
shaders + OpenAI). Sequel "False Earth" moves to WebGPU.

**Core technique:** A GPGPU particle system — positions/velocities held in
textures, integrated on the GPU each frame — with a force field / noise driver
modulated by narrative state.

**Transfer to our stack:** The sim ports cleanly to **WebGL2 via ping-pong float
textures or transform feedback** (no WebGPU compute required; scale the count
down for mobile). The big win: replace the "AI mood" driver with **audio** — our
band scalars + flux become the force-field modulator. This is an ideal
audio-reactive companion to the raymarched slime. Keep any AI **off** the gig
path (privacy + zero-dep rules).

**Relevance:** high (instrument — audio-driven particle fields); med (landing).

**Source / license:** webgpu.com/showcase/drift… ; Codrops "False Earth". Closed.

## Troika (troika-three-text) — runtime SDF text

**What it is:** High-quality text for Three.js that builds a signed-distance-field
glyph atlas on the fly from font files, in a web worker (protectwise). MIT.

**Core technique:** Parse .ttf/.otf/.woff (via Typr), generate a per-glyph SDF
atlas at runtime, render glyphs as quads sampling the SDF with `fwidth`-based
antialiasing; do kerning/ligatures/bidi layout in a worker to avoid frame drops.

**Transfer to our stack:** The **SDF-text technique is pure WebGL2**. If the neon
HUD ever needs crisp scalable or warped/animated type, an SDF (or MSDF, baked
with msdfgen) atlas gives near-free outlines and glow that fit the HUD aesthetic.
We'd bake our own MSDF rather than vendor troika, but the README is a good
reference.

**Relevance:** med (instrument HUD typography); med (landing type accents).

**Source / license:** github.com/protectwise/troika (MIT, confirmed).

## Motion GPU — minimal multi-pass render graph

**What it is:** A deliberately narrow WebGPU framework (Marek Jóźwiak) for
fullscreen shaders + multi-pass pipelines + frame scheduling — no scene graph,
mesh loaders, or cameras. (The handoff list mislabeled it "Motion CPU".)

**Core technique:** A DAG-based render-graph scheduler with named render targets
and ping-pong slots; you declare passes, explicit ordering, and invalidation, and
it runs the fullscreen-shader pipeline deterministically.

**Transfer to our stack:** This is essentially a generalized version of what
`src/gl/` already does (ping-pong post chain). Useful as an **architecture
reference** for structuring multi-pass FBO graphs cleanly (named targets, explicit
ordering, invalidation) if our pass list grows. The WGSL/WebGPU API doesn't port;
the render-graph *design* does.

**Relevance:** med (instrument architecture); low (landing).

**Source / license:** motion-gpu.dev ; github.com/motion-core/motion-gpu. Confirm
license before any reuse.

## Gemini (Lusion) — one model, two cross-faded looks

**What it is:** A WebGL car demo (Three.js, Lusion, 2021) that shows one vehicle
through two treatments — "motion" vs "style"; click-and-hold drops to slow motion
with a cinematic HUD.

**Core technique:** A single subject rendered through two lighting/post
treatments and cross-faded; GSAP-driven state transitions; cinematic HUD vignette
and post.

**Transfer to our stack:** The **two-looks-cross-faded** idea maps straight onto
our look system — crossfade between two param sets / post treatments (this is the
parked "preset cross-fade" technique). The cinematic HUD framing is a cheap,
high-impact overlay; "slow-mo" is just scaling the visual clock (we already do
this for reduced-motion).

**Relevance:** med (instrument — look crossfade + HUD); med (landing — cinematic
interaction).

**Source / license:** exp-gemini.lusion.co ; awwwards. Closed.

## Pixel Vault — rendering as the interface

**What it is:** A WebGL "creative marketplace from 2047" (Karan Chouhan + Harshit
Kumar Sahu; Awwwards Honorable Mention) with a lo-fi sci-fi, retro-terminal look —
the WebGL layer *is* the UI, not a backdrop.

**Core technique:** Rendering-as-interface: the storefront UI lives inside the
WebGL scene rather than as HTML overlaid on it; retro-terminal post (scanlines,
CRT curvature, phosphor glow).

**Transfer to our stack:** The **CRT / terminal post FX** are cheap and on-theme
for "grungy-future". But "render is the interface" fights our **accessibility
rule** — better as an accent layer than the whole UI. A CRT/scanline overlay is
strong for a landing hero.

**Relevance:** low–med (instrument post FX); high (landing — grungy-future
aesthetic reference).

**Source / license:** pixelvault.fit ; awwwards.com/sites/pixel-vault. Closed.

## Find Your Way to Oz — audio-coupled WebGL world (2013)

**What it is:** A Disney + UNIT9 Chrome Experiment: a WebGL 3D world with a
GLSL tornado, Web Audio adaptive/positional sound, and a WebRTC photo booth.
Source is public (`unit9/oz`).

**Core technique:** A GLSL-shaded volumetric tornado (animated noise on a swept
mesh) with particle debris; the Web Audio API drives adaptive sound and a
music-composing toy; Google published a case study on the wind and grass.

**Transfer to our stack:** Old (WebGL1-era) but squarely on-thesis — **tornado =
swirling animated noise** and an **audio-driven scene** are exactly our domain
(audio drives visuals). Good historical reference for tight audio↔visual
coupling. Source is public, but **check the license before copying** anything;
treat as study.

**Relevance:** med (instrument — audio coupling + noise vortex); low (landing).

**Source / license:** experiments.withgoogle.com/find-your-way-to-oz ; github
unit9/oz ; Google Developers case study.

## Mapillary (mapillary-js) — interpolated camera between keyframes

**What it is:** Open-source WebGL viewer for crowdsourced street imagery, blended
into a navigable 3D world. MIT.

**Core technique:** Reconstructs a navigable space from photos using spatial +
semantic + texture data; renders image planes/meshes with smooth interpolated
camera transitions between shots; pluggable data providers.

**Transfer to our stack:** Mostly off-domain (geospatial), but the **smooth
camera interpolation between keyframes** and the data-provider architecture are
worth knowing if the landing ever does a guided fly-through. MIT → reusable, but
heavy and niche for us.

**Relevance:** low (instrument); low–med (landing fly-through idea).

**Source / license:** github.com/mapillary/mapillary-js (MIT, confirmed).

## Shader.se — scroll-driven scene transitions + VHS post

**What it is:** A Swedish studio site styled as an "80s corporate training tape"
(Three.js WebGPU + TSL + React-Three-Fiber + @pmndrs/uikit), with seamless
scroll-driven scene transitions. Codrops published a pipeline writeup.

**Core technique:** Scroll position drives a multi-scene pipeline with seamless
GPU transitions; analog/VHS post (chroma shift, scanlines, tracking jitter,
grain); UI is composed in-pipeline (uikit) so it shares the GPU pass.

**Transfer to our stack:** The **scroll → transition-uniform** pattern is a strong
spine for the landing page (map scroll to a blend uniform that crossfades
scenes/looks). VHS post is cheap GLSL and fits "grungy". TSL/R3F/WebGPU don't
port; the GLSL post + scroll-uniform pattern do.

**Relevance:** med (instrument — VHS post + look transitions); high (landing —
scroll-driven narrative, directly the frontpage thread).

**Source / license:** webgpu.com/showcase/shader-se… ; Codrops 2026-05-19 ;
three.js forum thread. Closed studio site.

## Patina — cavity/AO-masked procedural weathering

**What it is:** A real-time procedural-PBR playground (Three.js + TSL on WebGPU)
where bronze oxidizes live, oxidation pooling in cavities.

**Core technique:** Material albedo/roughness/normal are driven procedurally —
oxidation accumulates via an ambient-occlusion / cavity mask (recessed, occluded
areas weather first); highlights shift mirror→milk as roughness rises. The node
graph compiles to GLSL (WebGL) and WGSL (WebGPU).

**Transfer to our stack:** **Cavity/AO-masked aging is a cheap, high-value GLSL
technique** — weather a surface by a curvature/AO term entirely in the fragment
shader, and optionally drive the corrosion amount by **audio** (rust pulses with
the track) or time. Pure GLSL, fits the budget, and strongly serves the "grungy"
material identity.

**Relevance:** high (instrument — grungy material weathering); med (landing).

**Source / license:** webgpu.com/showcase/patina-preview… ; threejs.org TSL docs.
Closed playground — study only.

## Ameen Abdullah — DOM-synced WebGL portfolio

**What it is:** Creative-developer portfolio (ameen-abdullah.dev) where a WebGPU
sakura scene takes over the screen, petals drifting with physically-honest
slowness; Vue + GSAP, with small interactive beats per section.

**Core technique:** A second WebGL layer renders mini-scenes into textures and
pastes them onto planes aligned to DOM elements, so the canvas and the page share
one coordinate system; GSAP ties motion to scroll; subtitles arrive via VTT.

**Transfer to our stack:** The DOM-aligned render-to-texture-plane pattern is the
same idea as curtains.js and directly useful for the **landing page** — WebGL
accents that ride real, accessible HTML layout, replicable in WebGL2 via the
bbox→clip-space mapping. The sakura drift is cheap instanced quads / a particle
field, optionally audio-reactive. Vue/WebGPU don't port; the technique does.

**Relevance:** low (instrument); high (landing — DOM-synced WebGL accents +
tasteful scroll motion).

**Source / license:** ameen-abdullah.dev ; webgpu.com showcase. Closed — study only.

## Drage Studio — UNVERIFIED

Could **not** independently confirm a "Drage Studio — modular WebGL grid / visual
operating system." Searches surfaced an unrelated "Anders Drage" Awwwards designer
portfolio, not the described project. Flagged so we don't fabricate technique. If
it turns out to be the Anders Drage portfolio, the transferable idea would be a
**modular grid/panel UI driven by WebGL** — but this is unconfirmed; get a real
URL before treating it as reference.

## Banati & Co — UNVERIFIED

Could **not** confirm a "Banati & Co — 300KB site holding 60fps on modest
hardware" from independent sources. The *principle* — a tiny-payload, locked-60fps
creative site — is a worthy north star and matches our mobile-perf-as-craft ethos,
but treat this specific project as unverified until a real source surfaces.

## Cross-cutting techniques worth stealing (as technique, authored from scratch)

- **GPU particle fields via ping-pong float textures / transform feedback**
  (DRIFT, Igloo footer) — WebGL2-native, no WebGPU compute needed; drive the
  force field by our audio bands → strong audio-reactive companion to the slime.
- **SDF / procedural geometry pulsed by a sinusoid** (Aurelia) — organic motion
  with a single cheap term that maps perfectly to bass/BPM.
- **Cavity/AO-masked procedural aging** (Patina) — fragment-shader weathering for
  the "grungy" identity; cheap, optionally audio-driven.
- **Analog/VHS + CRT post** (Shader.se, Pixel Vault) — chroma shift, scanlines,
  tracking jitter, grain, phosphor; cheap GLSL, on-theme for "grungy-future".
- **Scroll → transition-uniform scene blending** (Shader.se) — the landing-page
  spine: one uniform crossfades scenes/looks as you scroll.
- **DOM-synced shader planes via bbox→clip-space mapping** (curtains.js) — add
  WebGL accents to an accessible HTML landing page without abandoning layout.
- **Two-treatments cross-fade of one subject** (Gemini) — our preset cross-fade,
  plus cinematic HUD framing and visual-clock slow-mo.
- **Noise-thresholded dissolve transitions** (Igloo frost) — cheap, good-looking
  look-switch transitions.
- **Runtime/baked (M)SDF text** (Troika) — crisp scalable HUD type with near-free
  outlines/glow.
</content>
