import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { makeReactiveModifier } from './reactiveModifier.js'

// useReactiveSplat(mesh, { featuresRef, paramsRef, audioTexture, active })
//
// Attaches the reactive dyno modifier (reactiveModifier.js) to a SplatMesh and drives its uniforms.
// Contract (honored exactly so the journey scrub stays deterministic):
//   - on attach / mesh-change: assign mesh.worldModifier and call mesh.updateGenerator() ONCE.
//   - each frame, ONLY when active === true: write featuresRef.current + paramsRef.current into the
//     dyno uniforms' .value, advance a clock, and call mesh.updateVersion().
//   - when active === false: hold every audio band + the clock at NEUTRAL/zero so the splats look
//     static (a scrubbed journey frame is reproducible). Control params are still applied once so the
//     captured look respects the performer's lighting/tint, but nothing animates.
//   - clean up (detach modifier) on unmount / mesh-change.
//
// featuresRef.current = { bass, mid, treble, level, flux } (floats; zeros when not live).
// paramsRef.current   = flat schema key -> value (range floats; color = [r,g,b]).
// audioTexture        = optional THREE.DataTexture (512x2); wired to the uAudioTex uniform if present.

export function useReactiveSplat(mesh, { featuresRef, paramsRef, audioTexture, active } = {}) {
  // One modifier+uniforms object per hook instance; survives across mesh swaps.
  const rigRef = useRef(null)
  if (rigRef.current === null) rigRef.current = makeReactiveModifier()

  // Monotonic clock advanced only while active, so a held (inactive) frame is deterministic.
  const clockRef = useRef(0)

  // Keep the active flag in a ref so useFrame reads the latest without re-subscribing.
  const activeRef = useRef(!!active)
  activeRef.current = !!active

  // Attach on mount / whenever the mesh changes. updateGenerator() runs exactly once here.
  useEffect(() => {
    if (!mesh) return undefined
    const { modifier, uniforms } = rigRef.current
    mesh.worldModifier = modifier
    if (audioTexture) uniforms.uAudioTex.value = audioTexture
    mesh.updateGenerator?.()
    // Push the current control params + neutral audio once so the freshly-attached mesh isn't blank.
    writeParams(uniforms, paramsRef?.current)
    writeNeutralAudio(uniforms)
    mesh.updateVersion?.()

    return () => {
      // Detach so a disposed/swapped mesh stops referencing our modifier.
      if (mesh.worldModifier === modifier) {
        mesh.worldModifier = undefined
        mesh.updateGenerator?.()
      }
    }
  }, [mesh, audioTexture, paramsRef])

  useFrame((_, dt) => {
    if (!mesh) return
    const { uniforms } = rigRef.current

    if (!activeRef.current) {
      // Inactive: neutralize audio + freeze the clock so the splats hold a static, reproducible pose.
      // (We do NOT re-push params every frame here — they were set on attach / will be set when active.)
      return
    }

    // Advance the animation clock (guard against tab-switch dt spikes).
    const step = dt > 0 && dt < 0.25 ? dt : 0
    clockRef.current += step
    uniforms.uTime.value = clockRef.current

    writeAudio(uniforms, featuresRef?.current)
    writeParams(uniforms, paramsRef?.current)

    mesh.updateVersion?.()
  })
}

// --- uniform writers (kept tiny + allocation-free) ---------------------------------------------

function num(v, fallback = 0) {
  return Number.isFinite(v) ? v : fallback
}

function writeAudio(u, f) {
  const s = f || {}
  u.uBass.value = num(s.bass)
  u.uMid.value = num(s.mid)
  u.uTreble.value = num(s.treble)
  u.uLevel.value = num(s.level)
  u.uFlux.value = num(s.flux)
}

function writeNeutralAudio(u) {
  u.uBass.value = 0
  u.uMid.value = 0
  u.uTreble.value = 0
  u.uLevel.value = 0
  u.uFlux.value = 0
  u.uTime.value = 0
}

function writeParams(u, p) {
  if (!p) return
  // movement
  u.uSway.value = num(p.sway)
  u.uSwaySpeed.value = num(p.swaySpeed)
  u.uTurbulence.value = num(p.turbulence)
  // growth
  u.uGrowth.value = num(p.amount)
  u.uGrowthSpeed.value = num(p.growthSpeed)
  // lighting
  u.uAzimuth.value = num(p.azimuth)
  u.uElevation.value = num(p.elevation)
  u.uLightGain.value = num(p.lightGain, 1)
  // shadow
  u.uShadowDepth.value = num(p.depth)
  u.uShadowSoftness.value = num(p.softness)
  // bloom
  u.uBloomIntensity.value = num(p.intensity)
  u.uBloomThreshold.value = num(p.threshold)
  // flowerColor
  const tint = Array.isArray(p.tint) && p.tint.length === 3 ? p.tint : [1, 1, 1]
  const tv = u.uTint.value
  if (Array.isArray(tv)) {
    tv[0] = num(tint[0], 1)
    tv[1] = num(tint[1], 1)
    tv[2] = num(tint[2], 1)
  }
  u.uTintMix.value = num(p.tintMix)
}

export default useReactiveSplat
