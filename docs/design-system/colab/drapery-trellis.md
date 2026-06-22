# Colab runbook — Drapery splat via TRELLIS 2 (image → 3D Gaussian)

Generate a photoreal 3DGS of sheer drapery from a **single image** — no capture, no
COLMAP. Runs on a free Colab T4. Copy each cell into a fresh Colab.

> **Exact install/inference is version-specific — confirm against the official repo:**
> https://github.com/microsoft/TRELLIS (the `image-to-3d` example). License: **MIT
> (commercial-safe).** This runbook is the scaffold; the repo pins the CUDA wheels.

```python
# 1. GPU check
!nvidia-smi
```

```python
# 2. Get TRELLIS (follow the repo's setup — it installs CUDA-specific deps)
!git clone https://github.com/microsoft/TRELLIS
%cd TRELLIS
!. ./setup.sh --new-env --basic   # or `pip install -e .` per the current README
```

```python
# 3. Your drapery image — generate one (Midjourney/SD/Flux/Pollinations) then upload.
#    Prompt idea: "sheer ivory wedding drapery, soft folds, backlit, studio, plain bg"
from google.colab import files
up = files.upload()   # -> drapery.png
```

```python
# 4. Image -> 3D Gaussian (.ply). Use the repo's image-to-3D example pipeline:
#    see TRELLIS/example_image_to_3d.py for the exact call (pipeline.run(image)).
#    Outputs a Gaussian .ply (+ optional .glb mesh) in seconds.
```

```python
# 5. Download the splat
from google.colab import files
files.download('outputs/drapery.ply')
```

**Next:** compress `.ply` → `.SPZ`/`.SOG` (PlayCanvas SuperSplat, web — free), then drop
into the app's assets. TRELLIS is object-centric — perfect for the drapes; use the
forest runbook for the scene.
