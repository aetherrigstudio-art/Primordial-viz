import * as THREE from 'three'
import { PackedSplats } from '@sparkjsdev/spark'

// Procedural placeholder "drapery" — a hanging sheet of gaussians with gentle folds, so the
// render + camera pipeline has something to show BEFORE the real TRELLIS drapery splat exists
// (PLAN §7 step 1: prove the pipeline against a placeholder, in parallel with asset capture).
// Swap this for `new SplatMesh({ url })` once a compressed .spz/.sog lands in the asset store.
export function makePlaceholderSplats({ count = 80000, width = 4, height = 6, folds = 5 } = {}) {
  const packed = new PackedSplats({ maxSplats: count })
  const center = new THREE.Vector3()
  const scales = new THREE.Vector3()
  const quat = new THREE.Quaternion(0, 0, 0, 1)
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    const u = Math.random()            // across the sheet
    const v = Math.random()            // down the sheet
    const x = (u - 0.5) * width
    const y = (0.5 - v) * height
    // Folds: a sinusoidal Z displacement gives the sheer-cloth ripple; jitter softens banding.
    const z = Math.sin(u * Math.PI * folds) * 0.35 + (Math.random() - 0.5) * 0.05
    center.set(x, y, z)
    scales.set(0.02 + Math.random() * 0.02, 0.02 + Math.random() * 0.02, 0.01)
    // Dusk palette drift: champagne highlights on verdigris cloth (PLAN §5 dark theme).
    const t = v + Math.sin(u * Math.PI * folds) * 0.1
    color.setRGB(0.30 + t * 0.5, 0.48 + t * 0.35, 0.41 + t * 0.25)
    const opacity = 0.5 + 0.4 * (1 - v)
    packed.pushSplat(center, scales, quat, opacity, color)
  }
  return packed
}
