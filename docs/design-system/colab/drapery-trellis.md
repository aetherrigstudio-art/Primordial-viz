# Runbook — Drapery splat via TRELLIS (image → 3D Gaussian)

Generate a photoreal 3D Gaussian of sheer drapery from **one image** — no capture, no
COLMAP. TRELLIS is **MIT (commercial-safe)**; model `microsoft/TRELLIS-image-large` is MIT
and **not gated**. API verified against the repo 2026-06-22 (`example.py`, README).

There are two paths. **On a phone, use Path A** — it needs zero setup.

---

## Path A — Hugging Face Space (one-tap, phone-friendly) ✅ recommended first

Official Space (browser, free GPU queue, no install):

```
https://huggingface.co/spaces/Microsoft/TRELLIS
```

Steps: open it → upload your drapery image → **Generate** → use **Extract Gaussian** →
download the `.ply`. (The "Extract GLB" button is a mesh; we want the **Gaussian**.) If the
Space is busy/sleeping, either wait for the queue or use Path B.

## Path B — Colab (more control / batch). Paste each cell into a fresh T4 Colab

> The fragile part is the install, not the inference — TRELLIS pins CUDA wheels and the repo
> moves. If a cell fails, re-check the current README: https://github.com/microsoft/TRELLIS

```python
# 1 — confirm a GPU (free tier = Tesla T4)
!nvidia-smi
```

```python
# 2 — get TRELLIS + install (Gaussian-only, so we skip the mesh/GLB extensions).
#     T4 does NOT support flash-attn → we use the xformers backend at runtime (cell 3).
!git clone https://github.com/microsoft/TRELLIS
%cd TRELLIS
!. ./setup.sh --new-env --basic --xformers --spconv --mipgaussian
```

```python
# 3 — backend env vars MUST be set before importing trellis
import os
os.environ['ATTN_BACKEND'] = 'xformers'   # T4-compatible (flash-attn needs newer GPUs)
os.environ['SPCONV_ALGO']  = 'native'     # avoids per-run benchmarking
```

```python
# 4 — upload your drapery image (see the prompt below to generate one first)
from google.colab import files
up = files.upload()                        # → e.g. drapery.png
img_path = next(iter(up))
```

```python
# 5 — image → 3D Gaussian. formats=['gaussian'] skips the mesh so the light install is enough.
from PIL import Image
from trellis.pipelines import TrellisImageTo3DPipeline

pipeline = TrellisImageTo3DPipeline.from_pretrained("microsoft/TRELLIS-image-large")
pipeline.cuda()

image = Image.open(img_path)
outputs = pipeline.run(image, seed=1, formats=['gaussian'])
outputs['gaussian'][0].save_ply("drapery.ply")
print("saved drapery.ply")
```

```python
# 6 — download the splat
from google.colab import files
files.download('drapery.ply')
```

---

## The drapery image (Path A or B need one)

Generate with a **commercially-usable** generator (self-hosted SD/Flux, or Pollinations —
avoid sources whose license forbids commercial use; this is paid work). Prompt idea:

```
sheer ivory wedding drapery, soft vertical folds, backlit, studio, plain background
```

## After you have `drapery.ply` — compress, then drop into the app

1. **Compress** `.ply` → `.spz`/`.sog` in the browser with PlayCanvas **SuperSplat**
   (free, web): https://supersplat.playcanvas.com — open the `.ply`, export compressed.
2. **Place it** at `immersive/public/assets/drapery.spz` (Vite serves `public/` at the web root).
3. **Swap the placeholder:** in `immersive/src/splat/SparkScene.jsx`, replace the procedural
   `makePlaceholderSplats()` mesh with `new SplatMesh({ url: '/assets/drapery.spz' })`.

**Next:** the rainforest scene uses the other runbook (`forest-video-splat.md`) — AI video →
frames → COLMAP → Splatfacto (TRELLIS is object-centric, perfect for the drapes, not the scene).
