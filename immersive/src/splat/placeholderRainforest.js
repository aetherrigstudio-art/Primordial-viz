import * as THREE from 'three'
import { PackedSplats } from '@sparkjsdev/spark'

// Procedural placeholder rainforest — a coarse mossy-green volume enclosing the path (a hollow
// corridor: dense at the sides, open down the middle where the viewpoint travels), so the
// drapery + rainforest composite renders before the real Splatfacto capture lands. Swap for
// `new SplatMesh({ url })`. Note the transform (scale/position) is applied by the caller
// (loadRainforest.js → RAINFOREST_TRANSFORM), so these are local-space coordinates.
export function makePlaceholderRainforest({ count = 120000, width = 16, height = 10, depth = 22 } = {}) {
  const packed = new PackedSplats({ maxSplats: count })
  const center = new THREE.Vector3()
  const scales = new THREE.Vector3()
  const quat = new THREE.Quaternion(0, 0, 0, 1)
  const color = new THREE.Color()

  for (let i = 0; i < count; i++) {
    // Hollow corridor: bias points to the sides so the centre stays open for the dolly path.
    const side = Math.random() < 0.5 ? -1 : 1
    const x = side * (2 + Math.random() * (width / 2 - 2))
    const y = (Math.random() - 0.5) * height
    const z = (Math.random() - 0.5) * depth
    center.set(x, y, z)
    const s = 0.04 + Math.random() * 0.06 // coarse — a placeholder, not the real capture
    scales.set(s, s, s)
    // Mostly mossy fern greens; ~12% blooms so the placeholder reads as an Appalachian forest
    // IN BLOOM (pink laurel/rhododendron, white hydrangea/trillium, coral azalea); rare god-ray fleck.
    const moss = Math.random()
    if (Math.random() < 0.12) {
      const pick = Math.random()
      if (pick < 0.5) color.setRGB(0.82, 0.52, 0.64)      // pink truss — mountain laurel / rhododendron
      else if (pick < 0.8) color.setRGB(0.90, 0.88, 0.82) // white mophead — hydrangea / trillium
      else color.setRGB(0.92, 0.52, 0.30)                 // coral — flame azalea
    } else {
      const r = 0.10 + moss * 0.16 + (Math.random() < 0.04 ? 0.35 : 0)
      const g = 0.30 + moss * 0.32
      const b = 0.14 + moss * 0.14
      color.setRGB(r, g, b)
    }
    const opacity = 0.35 + Math.random() * 0.35
    packed.pushSplat(center, scales, quat, opacity, color)
  }
  return packed
}
