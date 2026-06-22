# Colab runbook — Rainforest splat via AI video → frames → Splatfacto

Turn an **AI-generated 360° pan video** into a 3DGS scene. Free Colab T4 works. Copy
each cell into a fresh Colab.

> Nerfstudio's Colab setup can be finicky — if a cell fails, use the official
> "Run in Colab": https://docs.nerf.studio . `splatfacto` is Nerfstudio's 3DGS method.

```python
# 1. GPU check
!nvidia-smi
```

```python
# 2. Install Nerfstudio (+ COLMAP for poses)
!pip install nerfstudio
!apt-get -y install colmap
```

```python
# 3. Upload your AI video — prompt Sora/Kling/Veo for a SLOW, steady 360° pan /
#    drone orbit through the forest (consistent motion = better reconstruction).
from google.colab import files
files.upload()   # -> forest.mp4
```

```python
# 4. Extract frames + estimate camera poses (this runs COLMAP under the hood)
!ns-process-data video --data forest.mp4 --output-dir proc --num-frames-target 200
```

```python
# 5. Train the Gaussian splat
!ns-train splatfacto --data proc --max-num-iterations 15000
```

```python
# 6. Export the splat (.ply)  — point --load-config at the run's config.yml
!ns-export gaussian-splat --load-config outputs/proc/splatfacto/*/config.yml \
  --output-dir export
```

**Next:** compress `export/*.ply` → `.SPZ`/`.SOG` for the web (PlayCanvas **SuperSplat**
editor, free, browser — import the `.ply`, export compressed), then composite with the
drapery splat in-app via **global-buffer merge**. Densely-sampled, smoothly-moving video
reconstructs best; jittery/teleporting AI video will fail COLMAP.
