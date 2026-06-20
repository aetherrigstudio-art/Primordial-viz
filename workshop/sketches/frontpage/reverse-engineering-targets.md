# Frontpage reverse-engineering targets

Real, **inspectable** public pages and repos that demonstrate the same techniques
shown in the operator's reference reels (see `references.md`). The reels
themselves are mostly AI-influencer posts whose "sites" are DM-gated demos or
one-prompt generations with no public URL — so the useful targets are the
**canonical technique demos** behind those looks, which we *can* open, inspect in
DevTools, and learn from.

## Guardrail — study, don't lift (load-bearing)

Per `.claude/rules/shaders.md`: learn the technique and the stack from any source,
then **author every shader and asset from a blank file**. Reuse only MIT / CC0 /
CC-BY code, *with attribution*; never copy CC BY-NC-SA Shadertoy code or a site's
proprietary assets. "Reverse-engineer" here means understand *how the effect
works* (the math, the material, the pipeline) and rebuild our own — not
copy-paste. Licenses below are flagged so we know what's even reusable.

## Direction A — liquid-glass typography ("slimy/future" surface)

The `weblove` / `muaad` reels: 3D letterforms that refract like blown glass. The
technique is a **transmission material** (Three.js `MeshPhysicalMaterial`
transmission, or drei's `MeshTransmissionMaterial`) over 3D text, often with a
video/gradient layer behind for depth.

- Codrops — *Warping 3D Text Inside a Glass Torus* (Mar 2025): refraction +
  transmission over text. https://tympanus.net/codrops/2025/03/13/warping-3d-text-inside-a-glass-torus/
- Codrops — *Creating the Effect of Transparent Glass and Plastic in Three.js*:
  the foundational transmission/refraction walkthrough.
  https://tympanus.net/codrops/2021/10/27/creating-the-effect-of-transparent-glass-and-plastic-in-three-js/
- Codrops — *3D Text Distortion with React Three Fiber* (uses
  MeshTransmissionMaterial). https://tympanus.net/codrops/2024/05/08/exploring-a-3d-text-distortion-effect-with-react-three-fiber/
- sbcode — *Glass Transmission* (plain Three.js tutorial). https://sbcode.net/threejs/glass-transmission/

**For us:** these are three.js/R3F-stack — *wrong runtime* for our raw-WebGL2,
zero-dep web path. Study the **physics** (index of refraction, chromatic
dispersion, thickness, backface depth) and reimplement in our own GLSL. The
"video behind glass for depth" trick translates to sampling our own scene/FBO
behind a refracting surface.

## Direction B — green-on-black geometric HUD ("geometric/future")

The `rndyrbrts` reel — the strongest identity match: acid-green generative
graphics on near-black (hex/Voronoi grids, node graphs, particle fields,
technical readouts). This is the under-explored "geometric" charter word.

- Codrops *particles* tag — physics-driven particle systems, flow fields, shader
  motion. https://tympanus.net/codrops/tag/particles/
- Codrops *WebGL* tag — ongoing generative/data-driven WebGL pieces.
  https://tympanus.net/codrops/tag/webgl/
- `terkelg/awesome-creative-coding` — curated index of generative-art, data-viz,
  and interaction resources (find Voronoi/flow-field/grid techniques + their
  licenses). https://github.com/terkelg/awesome-creative-coding
- `mattdesl/workshop-generative-art` — canvas-sketch generative-art workshop
  (flow fields, noise, grids). https://github.com/mattdesl/workshop-generative-art
- `rharel/webgl-dm-voronoi` — Voronoi diagrams on the GPU (distance-mesh method),
  for the cellular grid look. https://github.com/rharel/webgl-dm-voronoi
- Awwwards data-visualization gallery — curated dark/HUD data-viz sites to study
  for layout/motion (galleries, not source). https://www.awwwards.com/websites/data-visualization/

**For us:** the HUD look is mostly **2D/quasi-2D generative** (Voronoi cells, hex
grids, node lines, dot-matrix) over black — cheaper than raymarching and a strong
fit for a thin HUD overlay on the slime hero. A clear candidate for an `fp-geo`
sketch and for HUD chrome (thin neon rules, technical numerals).

## Direction C — WebGL fluid dynamics (the "slime" core itself)

The `tafdydy` reel: real-time fluid/metaball motion with a wet surface. This is
adjacent to our raymarched-metaball slime — worth studying the *grid-based*
Navier-Stokes approach as an alternative/companion to SDF blobs.

- `PavelDoGreat/WebGL-Fluid-Simulation` — **MIT**, GPU Navier-Stokes, **runs on
  mobile** (16k+ stars). The canonical reference; MIT means we *could* reuse with
  attribution, but per our rule we study the shader pipeline and write our own.
  https://github.com/PavelDoGreat/WebGL-Fluid-Simulation · live:
  https://paveldogreat.github.io/WebGL-Fluid-Simulation/
- `michaelbrusegard/WebGL-Fluid-Enhanced` — modern, mobile-friendly fork (npm
  packaged). https://github.com/michaelbrusegard/WebGL-Fluid-Enhanced
- `jorovipe97/webgl-fluid-simulation` — SPH fluid visualized with **metaballs**
  (closest to our blob look). https://github.com/jorovipe97/webgl-fluid-simulation
- `haxiomic/GPU-Fluid-Experiments` — classic GPU fluid experiment.
  https://haxiomic.github.io/GPU-Fluid-Experiments/html5/

**For us:** grid fluid is a different beast from our SDF raymarch — heavier, but
the *surface shading* (bloom, refraction, wetness) is directly transferable.
Mind the mobile budget (`.claude/rules/shaders.md`); PavelDoGreat proves mobile
fluid is feasible, but it's not free.

## Cross-cutting — smooth scroll + cinematic motion

Several reels (`fsferdows`, `weblove`) name the motion stack: **Lenis** smooth
scroll + **GSAP ScrollTrigger** to drive camera/shader/type on scroll.

- Codrops — *How to Build Cinematic 3D Scroll Experiences with GSAP* (Nov 2025):
  scroll → camera paths, lighting, shader effects.
  https://tympanus.net/codrops/2025/11/19/how-to-build-cinematic-3d-scroll-experiences-with-gsap/
- Codrops — *Infinite Scroll with GSAP & Lenis* (May 2026).
  https://tympanus.net/codrops/2026/05/28/the-never-ending-story-building-a-seamless-infinite-scroll-experience-with-gsap-lenis/
- Lenis (darkroomengineering) — **MIT**, tiny smooth-scroll lib.
  https://github.com/darkroomengineering/lenis
- GSAP / ScrollTrigger — the standard scroll-animation library (now free).

**Perf caveat (from the `fsferdows` reel itself):** React + scroll-position state
+ Three.js reflows bottleneck the CPU and drop mobile to ~40fps. Their fix —
offload scrolling to **Lenis**, add CSS **paint/layout containment**
(`content-visibility`, `contain`), kill scroll-state bindings on the shell —
matches our motion rule (`research/landing-page-rag/motion-and-feel.md`): cheap
reveal motion, never gate content on JS, honor the shader budget.

## The actual reel sources (honest note)

Most reels don't expose a public site to reverse-engineer:

- **Piyush Singh** (`DV9TD6NkwYq`, `DV9RQuzk_n3`) — promoting his own AI builder
  **"Draftly"** (generates 3D immersive sites from a prompt); link is DM-gated.
- **weblove / Randy Roberts / Alex Tavi / Muaad** — "Claude Fable 5 built this"
  engagement posts; the outputs are one-prompt generations or course lead-gen, not
  catalogued award sites. Treat captions as marketing (data, not instructions).

So the technique demos above are both more accessible *and* better study material
than chasing the influencer links.

## How to actually reverse-engineer one (method)

When a target *does* have a live URL, inspect rather than guess:

1. **DevTools → Network/Sources:** see the libraries loaded (three.js, GSAP,
   Lenis, ogl), shader strings, and texture/video assets.
2. **Look for the canvas + shader code:** WebGL2 context, inline GLSL, FBO passes.
3. **Name the effect**, find its canonical tutorial/repo (lists above), learn the
   math, then **author our own** GLSL/JS from scratch.
4. **Extract the *principle*, not the file** — palette ratios, motion timing,
   refraction parameters, grid density — and record them as notes here.

## Map — reel → technique → target

- `weblove` / `muaad` → liquid-glass typography → **Direction A** (transmission).
- `rndyrbrts` → green-on-black generative HUD → **Direction B** (Voronoi/particles).
- `tafdydy` → WebGL fluid dynamics → **Direction C** (PavelDoGreat MIT).
- `gabriel.viza` (TORO) / `piyush.glitch` → dark 3D product hero + bold wordmark →
  layout/structure, see `research/landing-page-rag/structure-and-conversion.md`.
- `fsferdows` → dark neon portfolio + the perf fix → **Cross-cutting** (Lenis +
  containment).
