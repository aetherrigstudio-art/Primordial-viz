import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'

// Post-process bloom for the immersive scene. Authored from blank (write-our-own rule; the lib is the
// standard MIT @react-three/postprocessing — we author the wiring/look, not copy a shader).
//
// WHY this exists on top of the per-splat emissive: reactiveModifier's `bloom` group brightens flower
// splats IN PLACE, but a per-splat pass can't bleed glow into neighbouring pixels. This adds the soft
// halo/bleed around bright regions — the central light-clearing and the lit blooms — which is what reads
// as "lighting" in the reference look. Mobile-budget-conscious: ONE mipmap-blur bloom, no god-rays
// (Gaussian splats don't write reliable depth, so sun-occlusion god-rays need off-device GPU QA first —
// deferred, see docs). DPR is already clamped on the Canvas.
//
// Integration note (verified via Spark's renderer docs): Spark renders its splats into the normal
// three.js scene render (autoUpdate sorts them in preUpdate), so EffectComposer captures the splats
// before applying bloom. Visual/GPU QA is OFF-DEVICE (no GPU here) — this file is import-graph-verified.
//
// Determinism: bloom holds a constant resting strength during the journey (active === false) so the
// scrubbed journey frames stay reproducible; it only audio-pumps once the instrument latch flips on.

const BASE = 0.55   // resting bloom strength (gentle constant glow)
const PUNCH = 0.9   // extra strength driven by onset energy (flux) + loudness (level)

export function PostEffects({ featuresRef, active = false, intensity = 1 }) {
  const bloomRef = useRef(null)

  useFrame(() => {
    const b = bloomRef.current
    if (!b) return
    if (!active) { b.intensity = BASE * intensity; return }
    const f = featuresRef?.current || {}
    const flux = Math.min(1, Math.max(0, f.flux || 0))
    const level = Math.min(1, Math.max(0, f.level || 0))
    b.intensity = (BASE + PUNCH * (flux * 0.7 + level * 0.3)) * intensity
  })

  return (
    <EffectComposer>
      <Bloom
        ref={bloomRef}
        mipmapBlur
        intensity={BASE}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.3}
      />
    </EffectComposer>
  )
}

export default PostEffects
