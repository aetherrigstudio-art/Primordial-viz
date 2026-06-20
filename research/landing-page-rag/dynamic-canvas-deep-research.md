# Deep research — dynamic-canvas volumetric landing page

A multi-source, license-flagged research synthesis (5 parallel search angles,
adversarially verified) for building primordial's frontpage as a **dynamic,
full-page WebGL canvas you scroll through** — using **point clouds, Gaussian
splats, and depth maps** — under our commercial / write-our-own / mobile-budget
constraints. Hard constraint from the operator: **we will NOT train Gaussian
splats** (we acquire ready-made files). Confidence flags: **[H]** high (multi-
source / primary), **[M]** medium (single or vendor source), **[L]** low.
Dropped/shaky claims are listed at the end (the verification step).

## 1. Full-page WebGL canvas architecture

The pattern is one persistent `<canvas>` set `position: fixed` *behind* all HTML,
always full-viewport, with scroll progress (0→1) driving camera moves and shader
uniforms. **[H]**
([gridonic](https://gridonic.ch/en/blog/creating-immersive-web-experiences-with-gsap-webgl-and-three-js))

- Keep the canvas alive across "pages" by placing it **outside** the swapped DOM
  container (e.g. outside the Barba.js wrapper) so the 3D scene never reloads;
  only the overlaid HTML refreshes. **[H]**
  ([Codrops](https://tympanus.net/codrops/2026/03/18/building-seamless-3d-transitions-with-webflow-gsap-and-three-js/))
- DOM overlays sync to 3D via **proxy elements**: invisible HTML is laid out by
  CSS, a render loop reads each `getBoundingClientRect`, and WebGL meshes mirror
  those positions every frame. `14islands/r3f-scroll-rig` (**MIT**) is the
  cleanest open implementation (one shared `<GlobalCanvas/>`). **[H]**
  ([r3f-scroll-rig](https://github.com/14islands/r3f-scroll-rig))
- **Lenis** (darkroomengineering, **MIT**) is the de-facto smooth-scroll glue —
  it runs *on* native scroll (so `sticky`, anchors, a11y still work) and drives
  WebGL + GSAP ScrollTrigger off one rAF loop, keeping DOM and WebGL pixel-locked.
  **[H]** ([Lenis](https://github.com/darkroomengineering/lenis))
- **SEO/accessibility reality (load-bearing):** a canvas holds zero indexable
  text, so ship the page as real **server-rendered DOM** (headlines/CTAs/copy) and
  hydrate the canvas as an **enhancement layer**; add `<noscript>` + visible
  fallback text. **[H]**
  ([Utsubo SEO guide](https://www.utsubo.com/blog/webgl-three-js-site-seo-rankable-guide))
- **LCP**: don't let an empty canvas be the LCP element — make a real image/
  headline paint first, or guarantee a fast first canvas frame. **CLS**: reserve
  canvas dimensions (`width`/`height` + CSS `aspect-ratio`). **[H]** (Utsubo)
- **Mobile strategy** among these sites is often *not the same 3D on phones* — a
  high-quality static WebP/AVIF poster at mobile breakpoints. Standard levers: cap
  `devicePixelRatio` ≈ 2, `ResizeObserver` over `resize`, DRACO/Meshopt
  compression, `prefers-reduced-motion`. **[M]** (Utsubo, Codrops)
- **Renderer choice:** award sites overwhelmingly use **three.js (MIT, heavy)**;
  the lean, write-our-own-shaders alternative is **ogl** (**Unlicense / public
  domain**, zero-dep, far smaller — but not literally "8 KB"; that figure is just
  its math module). **[H]** ([ogl](https://github.com/oframe/ogl))
- **GSAP** is near-universal for scroll motion but its licence is **its own (not
  MIT/OSS)** — flag before committing to it commercially. **[M]**

Top inspectable references: `14islands/r3f-scroll-rig` (MIT code), the Codrops
[seamless-3D-transitions](https://tympanus.net/codrops/2026/03/18/building-seamless-3d-transitions-with-webflow-gsap-and-three-js/)
and [reactive-depth image-tube](https://tympanus.net/codrops/2026/02/17/reactive-depth-building-a-scroll-driven-3d-image-tube-with-react-three-fiber/)
tutorials, and the [Vide Infra "ERA" teardown](https://videinfra.com/blog/case-study-a-triple-site-of-the-day-winner-powered-by-webgl)
(three.js + custom shaders, written up). Studio homepages (Lusion, Active Theory,
Resn, Unseen) are reputational — their current canvases couldn't be byte-confirmed
this pass (JS-rendered shells).

## 2. Acquiring Gaussian splats without training them

The constraint "no splat training" is the *clean* path: never run Inria's
non-commercial research code. A consumer capture app trains in its cloud and hands
you a finished file; you license the **data** via the app's ToS and display it
with an **MIT renderer**, so the non-commercial code is nowhere in your stack.
**[H]** ([gsplat.js README separates renderer-MIT vs data-licence](https://github.com/huggingface/gsplat.js))

The renderer-vs-data-vs-training distinction that keeps us clean:
- **Renderer** = MIT (Spark / PlayCanvas / gsplat.js) — safe to ship.
- **Data** = governed by the capture app's ToS (use a commercial-OK tier/app, not
  a community CC-NC file).
- **Training** = we never touch it (the app does it). The Inria LICENSE restricts
  the *Software* and is silent on outputs — but "silent ≠ granted," so the robust
  mitigation is simply to not run their code. **[H]**
  ([Inria LICENSE](https://github.com/graphdeco-inria/gaussian-splatting/blob/main/LICENSE.md))

Where to get a commercially-clean, self-hostable splat file:

| Source | Downloadable file? | Commercial + self-host? |
| --- | --- | --- |
| **KIRI Engine** (capture) | PLY, unlimited | **Yes, even free/Basic** — "personal or commercial." Best low-friction option. **[M]** |
| **Luma AI** (capture) | PLY | **Paid tier only**; free = personal. You own the output. **[H]** |
| **Polycam** (capture) | PLY (+15 formats) | You own scans; **splat/PLY export is paid-tier** (free = GLTF). **[M]** |
| **Scaniverse** (Niantic, free) | PLY + SPZ | Exports fine; **commercial clause not verified** — check Niantic ToS. **[L]** |
| **Polycam Explore / Sketchfab** (others' files) | Yes | **Per-model CC** — attribution; CC-NC forbids commercial. Not yours to relicense. **[M]** |

**Renderer recommendation: Spark** (`sparkjsdev`, World Labs) — **MIT**, three.js +
**WebGL2**, targets 98%+ devices incl. **iOS/Android**, v2 adds **LOD streaming**
(100M+ splats, GPU paging) built for mobile memory limits; loads PLY/SPZ/SPLAT/
KSPLAT/SOG. **[H]** ([Spark](https://github.com/sparkjsdev/spark),
[Spark 2.0](https://www.worldlabs.ai/blog/spark-2.0)). Alternatives: PlayCanvas
engine/SuperSplat (MIT, home of the highly-compressed **SOG** format);
mkkellogg/GaussianSplats3D (MIT but CPU-sort artifacts on mobile); gsplat.js (MIT,
"may not work on all devices").

**Delivery format:** PLY is huge (~118 MB / 500K splats); **SPZ** (MIT format,
~10% of PLY, keeps spherical harmonics), **KSPLAT** (progressive streaming), and
**SOG** (≈15–20× smaller) are the right phone-delivery formats. **[H]**
([SPZ](https://github.com/nianticlabs/spz),
[PlayCanvas SOG](https://blog.playcanvas.com/playcanvas-open-sources-sog-format-for-gaussian-splatting/))

## 3. Point clouds & depth maps (the cheaper, mobile-first layers)

**Mobile-cost ranking: depth-parallax ≪ point clouds < Gaussian splats.** **[H]**

- **Depth-parallax ("fake 3D")** is the cheapest and most on-charter: displace a
  textured quad by a grayscale depth map and follow the pointer/scroll in a
  fragment shader — one quad + two textures, **raw WebGL2, no library, no third-
  party data**. Canonical: Codrops 2019 (akella), which itself uses native WebGL.
  **[H]** ([Codrops fake-3D](https://tympanus.net/codrops/2019/02/20/how-to-create-a-fake-3d-image-effect-with-webgl/),
  [akella/fake3d](https://github.com/akella/fake3d))
- **Depth maps are generated offline** from any artwork/photo — a one-time art
  step that ships a static grayscale PNG, so **no AI runs on the page** (satisfies
  our no-AI-endpoint privacy rule). **[H]**
- **Depth-model licensing (critical):** **Depth-Anything V2 is split** — only the
  **Small** model is **Apache-2.0** (commercial-OK); Base/Large/Giant are
  **CC-BY-NC** (blocked). **MiDaS is MIT** (clean fallback). **Marigold is
  Apache-2.0** (best detail, slow/offline). **[H]**
  ([DA-V2 license issue](https://github.com/DepthAnything/Depth-Anything-V2/issues/320),
  [MiDaS](https://github.com/isl-org/MiDaS),
  [Marigold](https://huggingface.co/prs-eth/marigold-depth-v1-0))
- **Point clouds**: render with **raw WebGL2 `gl.POINTS`** (a VBO + `gl_PointSize`/
  `gl_PointCoord` — small, dependency-free, on-charter) and **cap the point count**
  (decimate offline + LOD); cost scales with point count (vertex/overdraw-bound).
  **Potree** (**BSD-2**, but built on three.js) is the streaming/LOD reference, not
  a thing to ship. **[H]**
  ([three.js Points](https://threejs.org/docs/pages/Points.html),
  [Potree LICENSE](https://raw.githubusercontent.com/potree/potree/develop/LICENSE))
- **Free point-cloud data** exists (OpenTopography, USGS 3DEP LiDAR — open;
  Sketchfab/Artec — varies) so we needn't capture; **verify each dataset's
  licence**. **[H]/[M]**

## 4. Reverse-engineering a live WebGL site (study-only)

The legal line: **copyright protects the expression (the code), not the technique
/idea** — learning a method and rebuilding from scratch is clean; copying or
*translating* a bundle/shader is a derivative work carrying the original license.
**[M]** Nothing inspected (bundle text, GLSL, `.glb`/textures/video) goes into the
product. Shadertoy defaults to **CC BY-NC-SA 3.0** → reference-only. **[H]**

**The playbook (study one site):**
1. **Stack ID** (cheap): Wappalyzer/BuiltWith, then confirm in DevTools console —
   `window.THREE` (+ `THREE.REVISION` for version), `gsap`/`ScrollTrigger`, Lenis,
   ogl. Detectors are unreliable → confirm. **[H]/[M]**
2. **Confirm renderer:** `canvas.getContext('webgl2')` to know the API tier.
3. **Network sweep:** which model formats (`.glb/.gltf/.ply/.splat`), textures,
   videos, JS chunks load + their sizes → infers the pipeline + budget. *Note
   assets, never download them into the product.* **[M]**
4. **Frame-capture with Spector.js** (**MIT**, BabylonJS): see every GL call, the
   pass/FBO structure, blend modes, and each program's **beautified GLSL** — read
   the actual technique without digging bundles. **[H]**
   ([Spector.js](https://github.com/BabylonJS/Spector.js))
5. **Scene-graph** (three.js sites): Needle Inspector / three-devtools show live
   materials/uniforms/hierarchy. **[H]/[M]**
6. **Read the de-minified source for the *technique*, not the text**, then close it
   and rebuild from a blank file.
7. **Write the recipe in your own words** (pass count, render scale, noise type,
   lighting, scroll/audio coupling) — the recipe is the asset, the source is not.

**Galleries to harvest:** [Awwwards /websites/webgl](https://www.awwwards.com/websites/webgl/),
[FWA](https://thefwa.com), [Godly](https://godly.website) (animated thumbnails),
[Codrops/Tympanus](https://tympanus.net/codrops/tag/webgl/) (teaching feed —
technique-first), [Httpster](https://httpster.net), [Land-book](https://land-book.com),
[three.js showcase](https://discourse.threejs.org/c/showcase). Shadertoy/glsl-
sandbox/CodePen = algorithm reference only.

## 5. Tooling to gather & organize a reference corpus

- **Save a static page:** **monolith** (Rust CLI, **CC0/public-domain**) embeds all
  assets into one HTML, no browser — most permissive. Misses JS-rendered content
  (plain HTTP fetch). **[H]** ([monolith](https://github.com/y2z/monolith))
- **Save a JS-rendered DOM:** **SingleFile-CLI** (**AGPL-3.0** → run as an external
  *tool*, don't vendor) — or just reuse our **Playwright** devDep
  (`page.content()` + screenshots), zero new deps and better for WebGL pages. **[H]**
- **Batch screenshots:** **shot-scraper** (Simon Willison, **Apache-2.0**,
  Playwright-based, YAML URL list) — or call our existing Playwright directly. **[H]**
  ([shot-scraper](https://github.com/simonw/shot-scraper))
- **Permanent snapshot / dedupe:** **Wayback SPN2 + Availability/CDX APIs** (likely
  needs a free archive.org account). **archive.today has no usable API** (Memento
  ended Sept 2025, CAPTCHA-walled) — skip it. **[H]**
- **Video reference:** **yt-dlp → frame montage** — already our `reel-ingest` tool;
  reuse as-is. **[H]**
- **Organize/index:** feed **our-own-words notes** (not raw HTML) into our existing
  **chunk → MiniLM → `index.json`** RAG; keep a **`references.json`** swipe-file
  catalog (`url + license + tags`). RAG best practice: one topic per chunk
  (~256–512 tokens for facts), store per-chunk provenance (`source_url, license,
  tags`), **dedupe before chunking**. **ArchiveBox** (MIT) only if we later want a
  heavy self-hosted archive UI; **avoid Zotero** (AGPL desktop GUI). **[H]/[M]**

**End-to-end pipeline:** Discover (link-harvester / WebSearch / galleries / shared
reels → `references.json`) → Capture (page→monolith or Playwright; visual→
Playwright/shot-scraper; video→reel-ingest; snapshot→Wayback) → Extract (clean
text + our-own-words note with summary/recipe/URL/license/tags/date) → Store/Index
(notes → RAG with `{scope, project, source_url, license, tags}`; `references.json`
as the human catalog). **Net new tooling: one lightweight tool (monolith); maybe
shot-scraper** — everything else reuses reel-ingest, the link harvester, Playwright,
and the markdown RAG.

## Verification — claims dropped or down-graded

- **"ogl is 8 KB"** — that's only its math module; cite "much smaller than three.js,
  public-domain," not a whole-lib byte count.
- **Studio homepages (Lusion/Active Theory/Resn/Unseen) as verified full-canvas
  exemplars** — reputational only; current canvases not byte-confirmed (JS shells).
- **Absolute splat/point FPS numbers** ("116 FPS Snapdragon", ">200 FPS RTX 3090")
  — device/scene-specific research figures; keep the *ranking*, drop the numbers.
- **"Depth-Anything V2 is commercial-safe"** — ONLY the Small (Apache-2.0) variant;
  Base/Large/Giant are CC-BY-NC.
- **Scaniverse / Postshot / Spline commercial-splat terms** — not verified; do not
  assert. Verify ToS before shipping any of these.
- **"Inria output is unrestricted"** — a license-text *inference*, not advice; rely
  on not running their code + a commercial app's pipeline + an MIT renderer.
- **archive.today API** — no longer usable; drop from any automated path.
- **Wappalyzer counts / per-site stack guesses from thumbnails** — colour only;
  confirm a stack in DevTools, never from a gallery listing.
- **Morton-sort → 5× gl.POINTS throughput** — directional, single-source.
- **Free point-cloud datasets** — open but per-dataset licensed; verify each.
