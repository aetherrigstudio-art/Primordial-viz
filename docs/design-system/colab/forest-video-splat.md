# Runbook — Rainforest splat via AI video → frames → COLMAP → Splatfacto

Turn an **AI-generated slow 360° pan video** into a 3D Gaussian-splat *scene* (the enclosing
Appalachian rainforest). This is a **scene capture**, much heavier than the drapery object —
and unlike TRELLIS there is **no one-tap Space**: it needs COLMAP poses + Nerfstudio training
on a real CUDA GPU. Commands/install verified against docs.nerf.studio (2026-06-22).

> **Reality check:** the full pipeline (COLMAP + ~15k Splatfacto iters) can exceed a free Colab
> T4 session. The reliable path for scenes is a **rented GPU** (open decision D-COMPUTE) or the
> official Nerfstudio Colab. Drapery (object) is the fast asset; the rainforest is the slow one.

## Step 0 — the video
Prompt **Sora / Kling / Veo** for a **slow, steady 360° pan or drone orbit** through an
Appalachian rainforest (mossy stone path, mountain laurel, rhododendron, ferns, dappled
golden light). Smooth, densely-sampled motion reconstructs well; **jittery or teleporting
AI video fails COLMAP**. Save as `forest.mp4`. Use a commercially-usable generator (paid work).

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
# 3 — frames + camera poses (runs COLMAP under the hood)
ns-process-data video --data forest.mp4 --output-dir proc --num-frames-target 200
```

```bash
# 4 — train the Gaussian splat (Splatfacto = Nerfstudio's 3DGS method).
#     ~15k iters ≈ 20–40+ min on a T4; bump iters for quality if the GPU/time allows.
ns-train splatfacto --data proc --max-num-iterations 15000
```

```bash
# 5 — export the trained splat to .ply (point --load-config at this run's config.yml)
ns-export gaussian-splat --load-config outputs/proc/splatfacto/*/config.yml --output-dir export
```

## After you have `export/*.ply` — compress, then drop into the app
1. **Compress** `.ply` → `.spz`/`.sog` in PlayCanvas **SuperSplat** (free, browser):
   https://supersplat.playcanvas.com — open the `.ply`, export compressed. Scenes are large →
   keep the splat count toward the mobile budget (combined drapery + rainforest ≈ 200–500K).
2. **Place it** at `immersive/public/assets/rainforest.spz` (gitignored; delivered via host/CDN).
3. **It loads automatically** — `immersive/src/splat/loadRainforest.js` reads `/assets/rainforest.spz`
   and `SparkScene.jsx` composites it with the drapery (global-buffer merge). When the asset is
   absent, the scene falls back to the procedural placeholder, so the app + CI always render.
4. **Tune** `RAINFOREST_TRANSFORM` (position/scale/quaternion) in `loadRainforest.js` during
   Antigravity QA so the rainforest encloses the path correctly.

**Drapery uses the other runbook** (`drapery-trellis.md`) — object-centric, one-tap via TRELLIS.
