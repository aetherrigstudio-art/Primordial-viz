# immersive/public/assets/

Web-ready splat assets, served by Vite at the site root (`/assets/...`).

## `drapery.spz` — the drapery Gaussian splat (NOT committed)

- **Source:** generated off-device via `docs/design-system/colab/drapery-trellis.md`
  (HF Space or Colab TRELLIS → `.ply`), then compressed to `.spz` in PlayCanvas SuperSplat.
- **Why it's not in git:** compressed splats are large binaries; per the repo-lean / inode-cap
  rule they're delivered via the host/CDN, not committed. `*.spz/*.sog/*.ply/*.ksplat` here are
  gitignored.
- **Where it goes:** drop the compressed file at `immersive/public/assets/drapery.spz`. The app
  (`src/splat/loadDrapery.js`) loads it from `/assets/drapery.spz`; when it's absent the scene
  falls back to the procedural placeholder, so the app and CI always render.
- **Deploy:** upload the compressed splat to the host's `assets/` path (same FTPS flow); it is
  not part of the git build.
- **Orientation/scale:** real TRELLIS output comes in at arbitrary scale/orientation. Tune
  `DRAPERY_TRANSFORM` in `src/splat/loadDrapery.js` (position / quaternion / scale) during
  Antigravity QA so the drapery sits against the camera dolly (z 4 → -2).

## `rainforest.spz` — the enclosing rainforest scene (NOT committed)

- **Source:** generated off-device via `docs/design-system/colab/forest-video-splat.md`
  (AI 360° pan video → COLMAP → Nerfstudio Splatfacto → `.ply`), compressed to `.spz` in SuperSplat.
- Same git/deploy rules as `drapery.spz` (gitignored binary, host/CDN-delivered).
- **Where it goes:** `immersive/public/assets/rainforest.spz`. Loaded by `src/splat/loadRainforest.js`
  and composited with the drapery in `SparkScene.jsx` (global-buffer merge); falls back to the
  procedural placeholder when absent.
- **Orientation/scale:** the rainforest is the enclosing environment — tune `RAINFOREST_TRANSFORM`
  in `src/splat/loadRainforest.js` so it surrounds the path without crowding the dolly.
- **Budget:** keep combined drapery + rainforest splat count toward ~200–500K (mobile budget).
