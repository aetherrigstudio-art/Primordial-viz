# TECH spec — wedding-pagoda (locked technical recipe)

> The technical contract for the build, distilled from the research (wide pass +
> focused passes 1 & 2). Reference-only sources, **write-our-own** (author every
> shader/asset from blank; reuse only MIT/CC0/CC-BY with attribution). Confidence
> + "tune-live" flags carried from the research. Pairs with `VISION.md` (intent),
> `WORKFLOW.md` (process), and the Act-1 plan. **No code/assets copied.**

## Engine (raw WebGL2, no rendering library)

- WebGL2 context; **own `mat4`** (perspective/lookAt/multiply); geometry generated
  **procedurally in JS** (zero load weight, trivially LOD-able — no DCC/glTF on the
  gig path). Render the scene to a **0.5–0.75 render-scale FBO**, then upscale-blit.
- **Instancing** for repeats: one base mesh + per-instance buffer (`mat4` across 4
  attribute slots, stride 64, `vertexAttribDivisor(…,1)`), `drawElementsInstanced` →
  one draw call per mesh type. [WebGL2 Fundamentals — MIT; ref-only]
- **Scroll → camera**: hand-rolled eased lerp (`cur += (target-cur)*k`) → progress
  0..1 → camera Z down the hall. Lenis (MIT) optional later; zero-dep first.
- **DOM text over geometry**: per-frame **world→screen projection** (MVP × anchor →
  perspective divide → pixels) sets a CSS `transform` on real DOM spans. Keeps text
  crisp/selectable/SEO/a11y. [WebGL Fundamentals "Text using HTML" — MIT; ref-only]
- **Debug**: Spector.js (MIT, dev-only) — frame capture, GL calls, shaders, FBOs.

## Drapery (the make-or-break — focused pass 1)

**Vertex motion (anchored curtain, not ocean):**
- **Top-pinned amplitude envelope** `env(v) = v^p`, `v∈[0,1]` top→bottom, **p≈1.3–1.8**
  (still at the header, swinging at the hem); optional `smoothstep(0,topHold,v)`.
- **Folds**: displace Z by a directional **sum-of-sines across the WIDTH** `u`,
  **3–4 octaves** (`A_k=A0·0.5^k`, `freqU_k=f0·2^k`) → a few big folds + small
  wrinkles. **Sway**: low-freq lateral X `S·env(v)·sin(swayFreq·t + 0.3u)`. Add a
  per-column phase offset ∝ `u` + slow per-octave phase drift so columns aren't in
  lockstep (decorrelation = "fabric" not "flag").
- **Analytic normals** — accumulate the **derivatives** of each wave into tangent
  `T` (∂/∂u) and bitangent `B` (∂/∂v; note `env'(v)=p·v^(p-1)`), `N=normalize(cross(B,T))`.
  No finite differencing. [Gerstner-normal method: Catlike Coding (ref-only) /
  madblade/waves-gerstner MIT (ref-only)] Confidence high (textbook calculus).

**Sheer-fabric fragment (one pass, mobile-cheap):**
- **Wrap/half-Lambert** diffuse `max(0,(dot(N,L)+w))/(1+w)`, **w≈0.5–1.0** (soft,
  waxy, no hard terminator) [Self Shadow "Righting Wrap" — ref-only].
- **Cheap back-light** (candle through cloth, no back-face pass): silhouetteness
  `s=1-abs(dot(V,N))` × a Schlick back-lobe `pow(max(0,dot(V,-L)),k)`, `k≈2–4`, warm
  tint [Wikibooks Translucent Bodies, CC-BY-SA — ref-only]. **⚠ tune live** (this is
  the #1 "get it on a phone with a warm key light behind").
- **Fresnel rim** `pow(1-max(0,dot(N,V)),5)` faint white sheen.
- **Sheerness via alpha** from `base + s·edgeSheer`; blend `SRC_ALPHA,ONE_MINUS_SRC_ALPHA`,
  **depth-write OFF (test on)**, draw **back-to-front**. Fold self-shading is ~free
  from the analytic normals.

**Part-on-click** — one per-instance `part` float (0→1), all in the vertex shader:
sweep X by `gatherDir·part·sweepDist·gatherProfile(u)`; **pleat** via `u'=pow(u, mix(1,gatherPow,part))`
(gatherPow≈2–3, crowds folds to the tie-back side); **lift** Y on the gathered side;
animate `part` over ~0.8–1.5 s with `smoothstep` (+ tiny overshoot). Zero physics,
one tween per panel.

**Audio "breathe" (not pulse)** — asymmetric **envelope follower on the bass/low
band**: `env = x>env ? mix(env,x,attack) : mix(env,x,release)`, **attack≈0.05–0.1,
release≈0.01–0.03** (release < attack). Map `env` to **sway/fold amplitude, NOT
phase**; keep a small idle sway at silence; gain ~0.3–0.6. **⚠ tune to track BPM.**
Reuses the repo `Analyser` (`src/audio/*`).

**Mesh/budget**: ~**24–48 columns × 32–64 rows** per panel (bias to columns —
folds run vertical), **2–8 panels**. The real cost is **overdraw** (translucent
blend), not verts → render into the scaled FBO, cap overlapping layers, sort
back-to-front, keep the fragment minimal.

## Candlelit atmosphere (focused pass 2)

- **Bloom**: bright-pass → **¼-size FBO** → **separable Gaussian (5–9 taps/axis)** →
  **additive** composite. (Move to **dual-Kawase** — constant taps regardless of
  radius — only if a wider soft halo is wanted; FrostKiwi repo license unverified →
  ref-only.) [LearnOpenGL Bloom — ref-only]
- **Hundreds of candles** = **additive instanced billboards** (`blend ONE,ONE`),
  procedural **radial-falloff alpha** in the fragment (no texture), warm-gold,
  per-instance **flicker** (random phase → sine/noise on brightness + tiny scale).
  Additive stacking *is* the glow. Cheap (4-vert quads; vertex shader is the only
  low-end bottleneck). [LearnOpenGL Particles / WebGL2 sprites — ref-only]
- **Grade + grain in ONE final pass**: warm tone curve toward candle-gold (lift
  shadows warm), **vignette** (radial darken), **animated film grain** = own
  hash(`uv*time`) luma noise, low amplitude. [Filmic Effects/DesLauriers — ref-only;
  **never copy** the Shadertoy grain snippet (CC-BY-NC-SA)].
- **God-rays**: screen-space radial blur from a light — **deferred/optional v2**
  only on the controlled hero (single on-screen warm light high in the hall); breaks
  off-screen, so not load-bearing. Bloom + additive candles carry the volumetric feel.

## The morph (drape → ivy → flower; continuous, scroll-driven)

Drive off one `progress` 0..1; combine (NOT a single opacity lerp):
- **Per-instance staggered reveal**: stable per-instance `seed`; reveal when
  `smoothstep(seed-w, seed, progress)`; **scale in from 0 (grow)**, not fade.
- **Offset overlapping curves**: drapes recede 0.0–0.6, ivy grows 0.3–0.8, flowers
  bloom 0.6–1.0 → continuous handoff, no hard cut.
- **Parallax depth layers** (foreground faster than background) so it reads as
  travelling *through* the hall into the garden, not a crossfade in place.

## Foliage + Act-2 garden (focused pass 2)

- **Instanced alpha-TESTED leaf/petal cards (billboards)** — the verdict for ivy on
  columns + the flower field. **Alpha-test (cutout)**, not blend (no depth-sort,
  cheaper, correct depth/parallax). **Wind** = reuse the drape sum-of-sines on card
  **tips** (base anchored). Thousands of cards in a few instanced draws; tile +
  frustum-cull; drop wind/instances on low-end. Closest real reference:
  **keaukraine/webgl-flowers** (MIT code, 741 KB, mobile-proven, instance data in
  FP32 textures, 4×4 tile cull ~1 ms) — **code reusable-as-reference w/ attribution;
  its ART ASSETS are NOT ours.**
- **⚠ Texture ownership**: every leaf/ivy/petal cutout must be **authored/owned by
  us or CC0** (license-checked). No unknown-license leaf atlases.
- **Act-2 FIRST technique** = **instanced alpha-cutout flower cards + sum-of-sines
  wind, lit by the shared candlelit post stack** (bloom + additive candles + warm
  grade). Same engine as the ivy (no new renderer), mobile-proven, palette-native,
  more legible than depth-parallax, **no training data**. Point-cloud = the "mid"
  upgrade; Gaussian splats stay gated (no training — acquire only; Spark MIT). See
  `research/landing-page-rag/dynamic-canvas-deep-research.md`.

## Design tokens (frontend-design — wide angle B)

- **Palette** (60/30/10; tune hexes to the real photography — candlelight shifts
  warm): `--ivory #F4EEE2` (~60%), `--cream-warm #E8DCC4` (~25%), `--espresso
  #1F1A14` (text/shadow anchor), `--candle-gold #C8A24B` (≤10% accent — **fill/rule
  only, never body text**: gold-on-ivory fails contrast), `--candle-glow #F3D9A0`
  (highlights), `--sage-muted #7E8770` (greenery). Body text ≥ **4.5:1**, large ≥
  **3:1**; drop an **espresso scrim** wherever text crosses the canvas.
- **Type** (all **SIL OFL**, commercial-safe): **EB Garamond** body; **Cormorant**
  (sharp glamour) **or Fraunces** (softer warmth) display — pick one, max 2–3 faces.
  Display at large sizes only (hairlines shatter small). **Open decision** — default
  Cormorant.
- **Motion**: candlelight, never snap — long ease-out (≈800–1500 ms), gentle drift,
  continuous faint canvas bloom over discrete UI animations; reveals fade-and-rise a
  few px; **all gated behind `prefers-reduced-motion: no-preference`** with a static
  fallback.
- **Avoid the AI-default tells**: Inter/system-sans, purple→blue gradients, frosted
  glass, perfect symmetry, dead hovers, snappy buttons.

## Verification stack (wide angle D)

- **Playwright render-check** (Apache-2.0, have it) = loose-tolerance **tripwire**:
  freeze a **deterministic frame** (`window.__weddingviz.pause` + fixed clock/seed +
  `synth-audio`), **mask** animated regions, `maxDiffPixelRatio` ~0.02+ (**tune up
  for software-GL CI**). NOT a golden-PNG art gate.
- **Lighthouse CI** (Apache-2.0) gates **load** CWV (LCP/CLS/INP) — **≠ frame-time**
  (that's `perf-budget`/FPS). Keep both.
- **axe-core** (MPL-2.0) on the DOM + `prefers-reduced-motion` + a **canvas text
  fallback** = the canvas-a11y triad. Automated tools catch ~40–57% → keep the
  `visual-qa`/operator manual pass.
- **Art + audio acceptance stays human/agent-judged** (`visual-qa`, `audio-dsp`,
  operator phone eyeball) — per "spec the contract, not the pixels."

## Tune-live flags (carried from the research)

Sheer back-light blend (#1), drape octave count/amplitudes, audio attack/release vs
track BPM, exact CI `maxDiffPixelRatio` on software-GL, bloom taps/downsample,
god-rays (deferred). All "get it on a phone and tune," not closed-form.

## Boho refinement (2026-06-20) — art direction only (engine recipe unchanged)

- **Palette**: keep the ivory/candlelight base; extend accents **earthier** — add
  `--terracotta #B06A4F`, `--clay-rose #C9A18A`, `--oat #DCCBB3`; warm the greenery
  to `--olive-sage #6E7355`. Earth tones layered + sun-warmed; espresso stays the
  text anchor; gold still accent-only. Tune to the real photography.
- **Type**: resolve the open display-face call → **Fraunces** (softer, wonky,
  warmer — better boho fit than sharp Cormorant); **EB Garamond** body stays. Both
  SIL OFL.
- **Foliage / Act-2 art**: pampas grass, dried florals, eucalyptus/ferns,
  wildflowers (not formal roses) — **same instanced alpha-cutout card engine**;
  **textures must be CC0 / our own** (boho asset sources in `references.md`).
- **Drapes**: gauzy/linen-textured ivory (more organic weave) — **same sheer
  shader**, just art/tint.
- **Feel**: organic, handcrafted, relaxed; avoid rigid symmetry (boho = eclectic
  layering, not formal balance).
