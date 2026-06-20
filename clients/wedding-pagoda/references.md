# Wedding-pagoda — references & helpful repos (study-only)

Curated, **license-tagged** references for the build, drawn from the research
(wide + focused passes), a fresh GitHub sweep, and the FMHY tool catalog
(`research/fmhy-dev-tools/`, which is excluded from the RAG, so the useful subset
is surfaced here). This note feeds the RAG; the structured catalog is
`references.json`.

## Guardrail (load-bearing — `.claude/rules/shaders.md` + `conduct.md`)

**Reference-only / write-our-own.** Learn the *technique*; author every shader and
asset from a blank file. Reuse code only when **MIT / CC0 / CC-BY** (with
attribution); **never** copy CC-BY-NC-SA / Shadertoy / unknown-license code, and
**any leaf/petal/flower/fabric texture must be ours or CC0** (license-checked).
Licenses below are flagged; **"unverified" = study-only until confirmed**.

## Drapery & cloth (technique)

- **madblade/waves-gerstner** — MIT — reference for **analytic normals from wave
  derivatives** (our drape lighting). https://github.com/madblade/waves-gerstner
- **Catlike Coding — Waves** — license unstated (technique-only) — Gerstner
  displacement + analytic tangent/normal. https://catlikecoding.com/unity/tutorials/flow/waves/
- **zammiez/CIS565-Final-WebGL-Cloth-Simulation** — license unverified — WebGL2
  **transform-feedback cloth in the vertex shader**; a sim alternative to our
  analytic sum-of-sines. https://github.com/zammiez/CIS565-Final-WebGL-Cloth-Simulation
- **logancool/curtainEffect** — license unverified — a WebGL **curtain** sim;
  direct subject reference. https://github.com/logancool/curtainEffect
- **Self Shadow — "Righting Wrap"** — blog, technique-only — energy-conserving
  **wrap/half-Lambert** diffuse for soft fabric. https://blog.selfshadow.com/2011/12/31/righting-wrap-part-1/
- **Wikibooks — GLSL Translucent Bodies** — CC-BY-SA (don't copy) — the
  **silhouetteness back-light** fake for sheer cloth. https://en.wikibooks.org/wiki/GLSL_Programming/Unity/Translucent_Bodies

## Foliage & garden (Act 2)

- **keaukraine/webgl-flowers** — **MIT code (ART ASSETS NOT OURS)** — the closest
  reference: instanced flower field, mobile-proven (741 KB, FP32-texture instance
  data, tile cull). https://github.com/keaukraine/webgl-flowers
- **keaukraine — "Efficient WebGL Vegetation"** — article — vertex-shader is the
  low-end bottleneck; instancing/LOD guidance. https://dev.to/keaukraine/efficient-webgl-vegetation-rendering-4g2g
- **GPU Gems 3, ch.16 (Crysis vegetation)** — NVIDIA, technique-only —
  **alpha-cutout** leaves + procedural vertex **wind**. https://developer.nvidia.com/gpugems/gpugems3/part-iii-rendering/chapter-16-vegetation-procedural-animation-and-shading-crysis

## Candlelit atmosphere

- **LearnOpenGL — Bloom / Particles** — technique-only — bright-pass + downsample +
  separable blur; **additive blending = glow** for candle sprites. https://learnopengl.com/Advanced-Lighting/Bloom
- **frost.kiwi — dual-Kawase blur** — repo license **unverified** — constant-tap
  blur (mobile-ideal) if a wider halo is wanted. https://blog.frost.kiwi/dual-kawase/
- **Matt DesLauriers — Filmic Effects for WebGL** — article — warm grade + vignette
  + film grain in one pass. https://medium.com/@mattdesl/filmic-effects-for-webgl-9dab4bc899dc
- **GPU Gems 3, ch.13 — Volumetric light scattering** — NVIDIA — screen-space
  god-rays (deferred/optional v2). https://developer.nvidia.com/gpugems/gpugems3/part-ii-light-and-shadows/chapter-13-volumetric-light-scattering-post-process

## Scroll + DOM-over-canvas

- **WebGL Fundamentals — "Text using HTML"** — MIT — the **world→screen DOM
  projection** we use for drifting words. https://webglfundamentals.org/webgl/lessons/webgl-text-html.html
- **lusionltd/WebGL-Scroll-Sync** — license **unverified** — Lusion's own
  canvas/DOM **scroll-sync** demo (the studio whose pipeline we studied). https://github.com/lusionltd/WebGL-Scroll-Sync
- **martinlaxenaire/curtainsjs** — MIT — DOM elements → WebGL textured planes +
  shaders; **concept** reference only (we're zero-dep raw WebGL2). https://github.com/martinlaxenaire/curtainsjs
- **14islands/r3f-scroll-rig** — MIT — the persistent-canvas + **DOM-proxy** pattern
  (concept; R3F stack). https://github.com/14islands/r3f-scroll-rig
- **darkroomengineering/lenis** — MIT — smooth scroll (optional; hand-rolled lerp
  is zero-dep). https://github.com/darkroomengineering/lenis

## Engine / instancing / debug / build

- **WebGL2 Fundamentals — Instanced Drawing** — MIT — the instancing recipe (one
  draw per mesh type). https://webgl2fundamentals.org/webgl/lessons/webgl-instanced-drawing.html
- **BabylonJS/Spector.js** — MIT (dev-only) — frame capture: GL calls, shaders,
  FBOs. https://github.com/BabylonJS/Spector.js
- **donmccurdy/glTF-Transform** — MIT — mesh/texture optim **if** we ever author
  glTF (adds a decoder dep → avoid on the gig path). https://github.com/donmccurdy/glTF-Transform
- **sjfricke/awesome-webgl** — curated list (meta-reference for more WebGL
  resources). https://github.com/sjfricke/awesome-webgl

## Volumetric / splats / depth (Act-2 later rungs — not v1)

- **sparkjsdev/spark** — MIT — Gaussian-splat renderer, mobile/iOS/Android (acquire
  splats, never train). https://github.com/sparkjsdev/spark
- **potree/potree** — BSD-2 — large point-cloud streaming (three.js-based; study
  LOD). https://github.com/potree/potree
- **isl-org/MiDaS** — MIT — offline depth maps (clean fallback). **Depth-Anything-V2
  Small** — Apache-2.0 (only the Small variant is commercial-OK). https://github.com/isl-org/MiDaS

## Fonts / palette / SVG / QA (design pass + FMHY catalog)

- **EB Garamond / Cormorant / Fraunces** — Google Fonts, **SIL OFL** (commercial).
  https://fonts.google.com/specimen/EB+Garamond
- **colorsandfonts.com**, **programmingfonts.org** — palette + font-pairing browsing
  (FMHY). https://www.colorsandfonts.com/
- **svg/svgo** + **SVGOMG** — MIT — SVG optimization for any vector assets (FMHY).
  https://github.com/svg/svgo · https://jakearchibald.github.io/svgomg/
- **GoogleChrome/lighthouse** — Apache-2.0 — load CWV gating (FMHY). https://github.com/GoogleChrome/lighthouse
- **playwright.dev** — Apache-2.0 — headless verify + the visual tripwire (already a
  devDep) (FMHY). https://playwright.dev/
- **dequelabs/axe-core** — MPL-2.0 — DOM accessibility checks. https://github.com/dequelabs/axe-core

## Boho assets & palette (CC0 / license-checked — art direction)

For the boho art (pampas, dried florals, wildflowers, woven/linen texture). **Use
CC0 / our own only** — verify per-asset; "free" sites mix CC0 with premium.

- **rawpixel — public-domain / CC0 collections** — botanical, pampas, wildflowers,
  pressed/vintage florals (incl. Library of Congress); **CC0 in the public-domain
  collections — verify per-image** (site also sells premium). https://www.rawpixel.com/search/flowers%20public%20domain
- **realtimecolors.com** + **color.review** + **colorhexa.com** — build/preview the
  boho earth palette and check AA contrast (FMHY). https://realtimecolors.com/
- **heropatterns.com** (CC BY 4.0 — attribution) / **pattern.monster** — subtle
  organic SVG patterns for woven/macramé motifs (license-check each). https://heropatterns.com/
- **Best path stays write-our-own/own-photography**: shoot or commission boho
  botanicals and cut alpha PNGs we own — sidesteps all asset-license risk (the
  drape/foliage *engine* is unchanged; only the textures are boho).

## Note on the FMHY catalog

`research/fmhy-dev-tools/links.json` (1576 entries) is an external scrape, kept
**out of the RAG** by design. 55 entries matched this build's needs (mostly SVG
tools, font/palette browsers, Lighthouse, Playwright); the genuinely useful subset
is curated above. Don't re-ingest the whole scrape — curate, per RAG best-practice.
