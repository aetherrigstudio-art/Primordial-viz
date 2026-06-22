# Runbook — Rainforest splat via AI video → frames → COLMAP → Splatfacto

Turn an **AI-generated slow 360° pan video** into a 3D Gaussian-splat *scene* (the enclosing
Appalachian rainforest). This is a **scene capture**, much heavier than the drapery object —
and unlike TRELLIS there is **no one-tap Space**: it needs COLMAP poses + Nerfstudio training
on a real CUDA GPU. Commands/install verified against docs.nerf.studio (2026-06-22).

> **Reality check:** the full pipeline (COLMAP + ~15k Splatfacto iters) can exceed a free Colab
> T4 session. The reliable path for scenes is a **rented GPU** (open decision D-COMPUTE) or the
> official Nerfstudio Colab. Drapery (object) is the fast asset; the rainforest is the slow one.

## Step 0 — the video
Generate the source clip from the **engineered prompt library + art direction in
[`../rainforest-asset-spec.md`](../rainforest-asset-spec.md)** (paste a variant into Sora / Kling /
Veo). Those prompts are tuned for BOTH a dense, blooming, photoreal Appalachian forest AND clean
3DGS reconstruction (one continuous slow move, deep focus, no motion blur, steady light, strong
parallax). Smooth, densely-sampled motion reconstructs well; **jittery/teleporting or
motion-blurred video fails COLMAP**. Save as `forest.mp4`. Use a commercially-usable generator.

## Path A — official Nerfstudio Colab (recommended) ✅
Nerfstudio ships a maintained Colab that handles the fragile CUDA install for you — open the
**"Run Nerfstudio in Colab"** notebook linked from https://docs.nerf.studio (and their GitHub
README). Upload `forest.mp4`, then run the dataset → train → export cells (the commands are the
same as Path B cells 4–6 below).

## Path B — manual cells (rented GPU / fresh CUDA box)

```bash
# 1 — confirm a GPU
nvidia-smi
```

```bash
# 2 — install (verified recipe; tiny-cuda-nn + nerfstudio need a matched torch/CUDA).
#     gsplat (the splat backend) installs as a nerfstudio dependency.
pip install torch==2.1.2+cu118 torchvision==0.16.2+cu118 --extra-index-url https://download.pytorch.org/whl/cu118
pip install ninja git+https://github.com/NVlabs/tiny-cuda-nn/#subdirectory=bindings/torch
pip install nerfstudio
apt-get -y install colmap          # poses from video frames
```

```bash
# 3 — frames + camera poses (runs COLMAP under the hood). More frames = denser coverage.
#     Frame to AVOID large open sky (sky has no parallax → floaters); mask it if unavoidable
#     (provide masks to ns-train, or crop the framing). See `ns-process-data video --help`.
ns-process-data video --data forest.mp4 --output-dir proc --num-frames-target 300
```

```bash
# 4 — train a DENSE splat. splatfacto-big = "more Gaussians, higher quality" (~12GB VRAM, slower —
#     a 16GB T4 fits it but is slow; a rented GPU is more reliable). The density flags keep more
#     (and more translucent) Gaussians and reduce spiky artifacts (verified vs docs.nerf.studio).
ns-train splatfacto-big --data proc --max-num-iterations 30000 \
  --pipeline.model.cull_alpha_thresh=0.005 \
  --pipeline.model.continue_cull_post_densification=False \
  --pipeline.model.use_scale_regularization=True
```

```bash
# 5 — export the trained splat to .ply (point --load-config at this run's config.yml)
ns-export gaussian-splat --load-config outputs/proc/splatfacto-big/*/config.yml --output-dir export
```

## After you have `export/*.ply` — compress, then drop into the app
1. **Clean + compress** in PlayCanvas **SuperSplat** (free, browser):
   https://supersplat.playcanvas.com — open the `.ply`, **delete floaters / stray sky Gaussians**
   (box-select + delete), then **decimate** toward the mobile budget (combined drapery + rainforest
   ≈ 200–500K splats) and **export compressed** `.spz`/`.sog`. Check it against the acceptance
   checklist in [`../rainforest-asset-spec.md`](../rainforest-asset-spec.md) before shipping.
2. **Place it** at `immersive/public/assets/rainforest.spz` (gitignored; delivered via host/CDN).
3. **It loads automatically** — `immersive/src/splat/loadRainforest.js` reads `/assets/rainforest.spz`
   and `SparkScene.jsx` composites it with the drapery (global-buffer merge). When the asset is
   absent, the scene falls back to the procedural placeholder, so the app + CI always render.
4. **Tune** `RAINFOREST_TRANSFORM` (position/scale/quaternion) in `loadRainforest.js` during
   Antigravity QA so the rainforest encloses the path correctly.

**Drapery uses the other runbook** (`drapery-trellis.md`) — object-centric, one-tap via TRELLIS.
