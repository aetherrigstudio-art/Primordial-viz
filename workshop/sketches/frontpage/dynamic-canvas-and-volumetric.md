# Dynamic-canvas landing page + volumetric techniques

Direction note (2026-06-20): the operator wants the frontpage to be a **dynamic,
full-page canvas** — a living WebGL experience you move *through* — **not** a
generated hero visual sitting on top of a normal page. And to build its vocabulary
from **point clouds, Gaussian splats, and depth maps** (captured/volumetric 3D),
alongside or instead of the raymarched slime. This note captures the techniques,
the web libraries, their licenses, and the mobile/architecture reality so the
build doesn't start blind.

## "Dynamic canvas, not a hero generation" — what that means

A hero is a block at the top; a dynamic canvas is the *whole page*. The pattern:
one persistent full-viewport WebGL2 canvas that spans the document, with **scroll
and pointer driving the camera and transitions** between scenes/layers (a splat or
point-cloud world, a depth-parallax artwork, the slime), and DOM text/CTAs
floating over it. This is the award-site approach (Awwwards "scrolling" /
"data-visualization" galleries). It raises the stakes on performance and on the
zero-dependency rule (see the architecture decision below) — the canvas is no
longer a contained widget, it's the experience.

## Technique 1 — Depth maps (cheapest, mobile-safe, do-it-ourselves)

A depth map is a grayscale image encoding distance; a shader displaces a textured
plane's UVs/vertices by it to fake parallax/3D from a flat image, following the
pointer or scroll. Cheap, runs in **raw WebGL2 with no library**, mobile-friendly,
and **no third-party licensing** if we make our own art + depth. Depth maps can be
authored or **AI-generated from any 2D image** (MiDaS / Depth-Anything, run
offline) — so any artwork, photo, or frame becomes a parallax layer.

- Codrops — *How to Create a Fake 3D Image Effect with WebGL* (the canonical
  depth-parallax tutorial). https://tympanus.net/codrops/2019/02/20/how-to-create-a-fake-3d-image-effect-with-webgl/
- Codrops — *WebGPU Scanning Effect with Depth Maps* (2025).
  https://tympanus.net/codrops/2025/03/31/webgpu-scanning-effect-with-depth-maps/
- Codrops — *WebGL for Designers* (2026), depth-parallax overview.
  https://tympanus.net/codrops/2026/03/04/webgl-for-designers-creating-interactive-shader-driven-graphics-directly-in-the-browser/

**Verdict:** the safest first move for a dynamic canvas — on-budget, no new deps,
no licensing risk, and it fits the grungy-future identity (depth-displaced grungy
textures, scanline/depth reveals).

## Technique 2 — Point clouds (mid cost, permissive libs exist)

Render a captured scene/object as a cloud of 3D points (from photogrammetry or
LiDAR). We can render our own captures with **raw WebGL2 `gl.POINTS`** (a capped
point budget keeps it mobile-safe) for full control and zero deps, or use a
library for massive datasets:

- **Potree** — **BSD-2-Clause** (permissive, commercial-OK), WebGL, streams
  billions of points via an octree. Heavy/viewer-oriented but the reference for
  scale. https://github.com/potree/potree
- CesiumJS — Apache-2.0, but geospatial-focused (overkill for us).

**Verdict:** a capped, self-rendered point cloud in raw WebGL2 is very on-brand
(geometric, future-tech, "constellation of the captured world") and budget-tunable
by point count + size. Potree only if we ever need massive streamed scans.

## Technique 3 — Gaussian splats (highest fidelity + highest cost + a licensing trap)

3D Gaussian Splatting (3DGS) renders a captured scene as millions of anisotropic
"splats" — photoreal, volumetric, and very "future." Real-time browser splatting
**crossed the viability line in 2025** (e.g. Utsubo's live-splat installation at
Expo 2025 Osaka, FWA/Awwwards studio). Web renderers, with licenses:

- **Spark** (`sparkjsdev/spark`, World Labs) — **MIT**, THREE.js + **WebGL2**, runs
  on **desktop / iOS / Android / VR**; **Spark 2.0** (2026-04) adds streaming, LOD,
  and GPU virtual memory (streams 100M+ splats). The strongest current, mobile-
  capable, commercial-safe *renderer*. https://github.com/sparkjsdev/spark ·
  https://sparkjs.dev/
- `mkkellogg/GaussianSplats3D` — **MIT**, three.js, but **sub-optimal mobile**
  (CPU-based sorting → artifacts). https://github.com/mkkellogg/GaussianSplats3D
- `gsplat.js` (Hugging Face) — open-source, three.js-like for splats.

### ⚠️ The licensing trap (load-bearing — this is commercial work)

The **renderers above are independently MIT**, BUT the **original Inria 3D
Gaussian Splatting research code** (the *optimization/training* pipeline) is under
a **non-commercial research license**. So the commercial risk moves from the
renderer to the **splat data source**: a `.ply`/`.spz` we ship must be trained
with a **permissively-licensed or commercially-cleared** pipeline (or be
self-captured with a tool whose terms allow commercial output), and must not
embed someone else's copyrighted scene. Per `.claude/rules/shaders.md`: study the
technique, use only permissive code, and own the assets. **Verify the training-
tool license before shipping any splat.**

**Verdict:** aspirational layer. Desktop-first with a mobile LOD/streaming path
(Spark) or a graceful fallback to point cloud / depth-parallax on weak devices.

## Mobile budget tiering (the order to build in)

Same phone-first budget as the instrument (`.claude/rules/shaders.md`). Cost order:

1. **Depth-parallax** — cheap, raw WebGL2, no deps, no licensing. Build first.
2. **Point clouds** — mid, capped count in raw WebGL2 (or Potree/BSD for scale).
3. **Gaussian splats** — expensive; library-dependent (Spark/MIT), LOD + fallback;
   gate behind device capability. Build last, behind a fallback.

Always: render heavy passes to a 0.5–0.75 FBO, cap work, dynamic resolution, pause
on `visibilitychange`, and degrade gracefully when WebGL2/perf is insufficient.

## ⚠️ Architecture decision (OPEN — surfaced to the operator)

This collides with a hard repo rule: **zero runtime dependencies on the gig web
path** (`index.html` + `src/` are raw WebGL2, no rendering library; CLAUDE.md). A
splat renderer (Spark) means **vendoring three.js + Spark** — a real departure.
The fork:

- **(A) Landing page = a separate surface** that *may* carry a vendored permissive
  3D lib (three.js + Spark/Potree), kept isolated from the zero-dep gig instrument.
  Unlocks splats; adds weight + a dependency to maintain.
- **(B) Landing page stays raw-WebGL2 zero-dep** like the instrument — depth-
  parallax + our own `gl.POINTS` clouds only; no splat library (or a tiny vendored
  one later). Leaner, fully on-charter, but no true 3DGS.

Either way the **mobile budget** and **write-our-own / asset-licensing** rules
hold. Also open: **where the captured content comes from** (self-captured scenes/
objects via phone photogrammetry or Luma; the artist; abstract/procedural). These
two decisions set what gets built next — see the operator Q&A.

## Compute offload — servers do the heavy lifting (operator decision, 2026-06-20)

The operator is phone-only until a laptop returns and asked to push heavy work to
servers. Split it in two — they have different answers:

**Dev-time heavy lifting (the operator's constraint) — yes, offload it.**
- This **cloud container** runs the non-GPU heavy work: builds, CI, depth-map
  generation (CPU ML), point-cloud processing, clip rendering (headless Chromium,
  software GL). It has **no GPU**, so it can't *train* Gaussian splats.
- **GitHub Actions** runs builds/CI (and could run a GPU job or the desktop/Tauri
  build on a real-OS runner).
- **Gaussian-splat creation is a hosted-GPU service**: phone capture → Luma /
  Polycam / similar trains the splat in their cloud → download `.ply`/`.spz` →
  ship. The phone only captures + receives; no local heavy compute. (Verify each
  service's **commercial output license** — the 3DGS data-licensing trap above.)

**Runtime heavy lifting (the visitor's phone) — only partially offloadable.**
A server can't render the live page on someone else's device unless we either
**pre-bake to streamed video** (zero visitor-GPU but not live-interactive) or
**cloud-stream frames** (real-time but costly, always-on, and fights the static
Namecheap host). Realistic model: **server pre-bakes + optimizes** (compress, LOD,
`.spz`), the visitor's phone renders the lean result, cheap depth-parallax on top.
The mobile budget still governs what ships — pushed toward near-zero by pre-baking.

**Consequence:** since *creation* is server-side either way, the stack fork
collapses to "what does the *shipped page* run." Resolved direction = **hybrid**:
pre-bake/optimize on servers, ship a lean canvas, gate live splats to capable
devices with a point-cloud / pre-baked-video fallback.

## Suggested build path (pending the decisions above)

Start budget-safe and library-free regardless of the fork: a **depth-parallax
dynamic canvas** sketch (grungy art + AI/own depth map, pointer/scroll-driven) and
a **capped raw-WebGL2 point-cloud** sketch — both in the `workshop/` rig, rendered
to clips and reacted to. Evaluate Spark/3DGS as a separate, gated decision once the
surface-scope and content-source questions are answered.
