import { SplatLoader, SplatMesh } from '@sparkjsdev/spark'
import { makePlaceholderSplats } from './placeholderSplats.js'
import { applyTransform } from './transform.js'

// Real drapery asset (served from public/, NOT committed — see public/assets/README.md).
// Generated off-device via docs/design-system/colab/drapery-trellis.md.
export const DRAPERY_URL = '/assets/drapery.spz'

// Calibration knob — real TRELLIS splats arrive at arbitrary scale/orientation. quaternion
// (1,0,0,0) re-orients OpenCV → OpenGL (Spark's convention). Tune live during Antigravity QA.
export const DRAPERY_TRANSFORM = { position: [0, 0, -3], quaternion: [1, 0, 0, 0], scale: 1 }

// Real drapery: resolves a configured SplatMesh, or REJECTS when the asset is missing (caller
// falls back to the placeholder).
export async function loadDraperyMesh() {
  const packedSplats = await new SplatLoader().loadAsync(DRAPERY_URL)
  return applyTransform(new SplatMesh({ packedSplats }), DRAPERY_TRANSFORM)
}

// Procedural placeholder drapery, positioned with the same transform as the real splat.
export function makeDraperyPlaceholder() {
  return applyTransform(new SplatMesh({ packedSplats: makePlaceholderSplats() }), DRAPERY_TRANSFORM)
}
