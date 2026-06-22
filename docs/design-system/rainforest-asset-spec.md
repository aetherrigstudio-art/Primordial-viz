# Rainforest asset spec — realistic, dense, blooming Appalachian rainforest splat

Art direction + video-generation prompt library + acceptance criteria for the enclosing
rainforest Gaussian-splat scene. The **pipeline** (how to run it) lives in
`colab/forest-video-splat.md`; **this** file is *what good looks like* and *how to prompt for it*.

## What we're making
The photoreal, **dense, in-bloom Appalachian temperate rainforest** the visitor lands in at the
end of the journey — masses of native blooms along a mossy stone path, generated (not captured)
via AI video → COLMAP → Splatfacto, composited behind the drapery in `immersive/`. The live
audio-reactive instrument is the visualizer layered at the very end; this splat is the *world*
it lives in.

## Art direction (botanically accurate — from `WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md` Part B)
Native Southern-Appalachian planting in masses — **NOT tropical, NOT florist roses** — in peak bloom:
- **Signature blooms:** mountain laurel (clustered pink/white), Catawba & rosebay rhododendron
  (blush/magenta trusses), flame azalea (orange/coral), oakleaf + wild hydrangea (white/blue
  mopheads), great white trillium (white groundflowers), flowering dogwood; lady's-slipper
  orchid as a rare accent.
- **Green structure:** cinnamon & Christmas ferns, galax, partridgeberry, deep moss.
- **Ground plane:** living moss + wet fieldstone path + leaf litter + exposed roots — humid, dewy.
- **Light:** dappled, backlit, golden-hour → midday; soft god-rays down the path.
- **Air:** faint volumetric haze.
- **North-star mood:** reference still `fad002c3` ("a wedding that feels exactly like this"); the
  master motion is the **forward dolly through the mossy fern corridor** — the page literally moves
  like that clip. Landing beat references: `3093785b` + the centered corridor stills.

## The core tension — read before prompting
The video serves **two masters that pull apart**, and reconstructability wins ties:
- **Beauty:** dense, blooming, cinematic, photoreal.
- **Reconstructability (3DGS):** ONE continuous slow camera move; **deep focus** (no shallow DOF /
  rack focus); **no motion blur**; **steady, consistent lighting** (no flicker / sun change);
  **minimal scene motion** (heavy wind / flowing water → ghosting); **strong parallax** (close
  foreground); **even coverage**; no cuts, zooms, people, text, or watermarks.

A clean, dense splat from a slightly less cinematic video beats a gorgeous clip that won't
reconstruct. Every prompt below encodes both.

## Video model — use Veo 3.1 (verified June 2026)
**Google Veo 3.1** is the pick: best photorealism + filmic camera/light (reads as *filmed*, which is
exactly what clean 3DGS reconstruction needs), and the operator's **Google AI subscription unlocks
it** (Plus = Veo 3.1 Fast for cheap iteration · Pro = Lite · Ultra = full quality for the final
keeper). Access via the Gemini app / Google Flow / Google AI Studio. **Caveat:** Veo clips cap
~8 s, so cover a slow orbit with **2–3 stitched clips**. **Kling 3.0** is the alternate when you
want one longer continuous shot. **Do NOT use Sora** — OpenAI deprecated Sora 2 (April 2026; API
ends 2026-09-24). Discard the generated audio (we don't use it).

## Prompt library (paste into Veo 3.1, or Kling 3.0)

### Variant 1 — forward dolly through the corridor (primary; matches the master clip)
> A slow, smooth, continuous forward dolly traveling down a mossy stone path through a dense
> Appalachian temperate rainforest in peak spring bloom. Lining the path in masses: mountain
> laurel and rosebay rhododendron in blush-pink and magenta clusters, flame azalea in coral,
> white oakleaf hydrangea, great white trillium at the ground, flowering dogwood overhead,
> cinnamon and Christmas ferns, deep green moss on wet fieldstone and exposed roots. Dappled
> golden-hour light and soft god-rays through the canopy; faint volumetric haze. Photoreal,
> ultra-detailed, deep focus throughout (everything sharp, no shallow depth of field), no motion
> blur, locked exposure and white balance, perfectly steady gimbal motion, one continuous shot
> with no cuts, still air with minimal leaf movement, eye-level, strong close foreground foliage.

### Variant 2 — slow orbit around a focal grouping (reconstructs best)
> A slow, smooth 360-degree orbit at constant radius and height around a focal grouping — blooming
> mountain laurel and rhododendron beside a moss-covered fieldstone on the forest path — in a dense
> Appalachian temperate rainforest in peak bloom. Surrounding masses of flame azalea, white
> hydrangea, trillium, ferns, galax and deep moss; flowering dogwood above. Golden-hour dappled
> light, soft god-rays, faint haze. Photoreal, ultra-detailed, deep focus (all sharp), no motion
> blur, constant lighting and exposure, one continuous steady orbit, no cuts, still air, focal
> grouping centered with strong parallax against the background.

### Variant 3 — low dolly + gentle rise (atmospheric)
> A slow, continuous low camera dolly moving forward and gently rising through dense blooming
> Appalachian rainforest underbrush — ferns, moss, trillium and laurel close to the lens — opening
> to a sunlit corridor of rhododendron and dogwood. Golden dappled light, god-rays, faint haze.
> Photoreal, deep focus, no motion blur, steady consistent motion and lighting, single unbroken
> shot, minimal foliage movement, strong foreground parallax.

### Negative prompt / avoid
> cuts, scene changes, fast or jerky camera motion, zoom, rack focus, shallow depth of field,
> bokeh, motion blur, flickering or changing light, strong wind, flowing water, people, hands,
> moving animals, text, captions, watermarks, logos, UI overlays, fisheye distortion, tropical
> or palm plants, roses.

**Tip:** aim for ≥ ~15–25 s so COLMAP gets enough well-separated frames. If the model supports a
reference image, feed it the north-star still (`fad002c3`) for palette/density.

## Acceptance checklist
**Judge the video before training:** one continuous slow move · sharp deep focus · no motion blur ·
steady exposure & light · minimal foliage motion · dense blooming botany that reads as Appalachian
(right species, not tropical) · strong foreground parallax · long enough for frames.

**Judge the splat after training + cleanup:** dense (no sparse gaps/holes along the path) · blooms
and moss read clearly · few floaters · within the mobile budget (~200–500K splats combined with the
drapery, after compression) · encloses the path correctly once `RAINFOREST_TRANSFORM` is tuned.

## Iteration loop — failure → fix
- **Sparse / holey** → more frames (`--num-frames-target` up), longer/slower move, more parallax; train `splatfacto-big`.
- **Floaters / sky junk** → frame to avoid open sky, mask the background, SuperSplat cleanup; lower `cull_alpha_thresh`.
- **Blurry / ghosted** → slower, steadier video; deep focus; less wind; no motion blur.
- **Flat / dull** → golden-hour light + god-rays; author a brighter "midday" relight variant and cross-fade it in-app.
- **Wrong plants** → name the species explicitly (the prompts do); add a reference image if supported.

## Reconstruction settings
The hardened pipeline in `colab/forest-video-splat.md` uses **`splatfacto-big`** (denser) with the
verified density flags `--pipeline.model.cull_alpha_thresh=0.005`,
`--pipeline.model.continue_cull_post_densification=False`,
`--pipeline.model.use_scale_regularization=True`, a higher frame target, then SuperSplat cleanup +
decimate-to-budget. Compressed output → `immersive/public/assets/rainforest.spz` (loads + composites
automatically via `loadRainforest.js` / `SparkScene.jsx`).

## Research queries (run in NotebookLM `688cc151`, off-device)
Draft these for the operator's grounded research brain (or ask me for a bounded in-session check):
1. "Best 2026 AI video model + settings for a slow orbit/dolly that reconstructs cleanly in 3D
   Gaussian Splatting — deep focus, no motion blur, consistent light, strong parallax?"
2. "Tips to densify and remove floaters from an outdoor Nerfstudio Splatfacto scene built from
   AI-generated video."
3. "How to mask sky/background for outdoor 3DGS so it doesn't generate floaters (ns-process-data /
   training masks)?"
