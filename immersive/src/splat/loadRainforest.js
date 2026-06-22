import { SplatLoader, SplatMesh } from '@sparkjsdev/spark'
import { makePlaceholderRainforest } from './placeholderRainforest.js'
import { applyTransform } from './transform.js'

// Real rainforest scene asset (Nerfstudio Splatfacto capture → compressed; NOT committed).
// Generated off-device via docs/design-system/colab/forest-video-splat.md.
export const RAINFOREST_URL = '/assets/rainforest.spz'

// Calibration knob. The rainforest is the ENCLOSING scene, so it sits further back and larger
// than the foreground drapery; tune live during Antigravity QA so the path reads correctly.
export const RAINFOREST_TRANSFORM = { position: [0, 0, -8], quaternion: [1, 0, 0, 0], scale: 3 }

// Real rainforest: resolves a configured SplatMesh, or REJECTS when the asset is missing (caller
// falls back to the placeholder).
export async function loadRainforestMesh() {
  const packedSplats = await new SplatLoader().loadAsync(RAINFOREST_URL)
  return applyTransform(new SplatMesh({ packedSplats }), RAINFOREST_TRANSFORM)
}

// Procedural placeholder rainforest, positioned with the same transform as the real splat.
export function makeRainforestPlaceholder() {
  return applyTransform(new SplatMesh({ packedSplats: makePlaceholderRainforest() }), RAINFOREST_TRANSFORM)
}
