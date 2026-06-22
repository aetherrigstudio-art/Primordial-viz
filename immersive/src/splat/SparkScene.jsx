import { useMemo, useState } from 'react'
import { useThree } from '@react-three/fiber'
import { SparkRenderer } from '@sparkjsdev/spark'
import { useSplatLayer } from './useSplatLayer.js'
import { useReactiveSplat } from './useReactiveSplat.js'
import { loadDraperyMesh, makeDraperyPlaceholder } from './loadDrapery.js'
import { loadRainforestMesh, makeRainforestPlaceholder } from './loadRainforest.js'

// Multi-splat scene. One SparkRenderer composites every SplatMesh added under it via global-buffer
// merge, so the layers sort correctly together (per the experience doc: "several splats together
// — captured drapery AND a captured Appalachian rainforest"). Each layer renders its placeholder
// on the first frame and swaps in its real splat when that asset loads, falling back otherwise —
// so the composite always renders. The rainforest is the enclosing environment; the drapery is
// the foreground tent. (The flutter/reveal choreography between them is a later increment.)
//
// The rainforest is the audio-reactive surface: useSplatLayer's onMesh callback hands us the live
// SplatMesh (placeholder on mount, real splat after swap, null on dispose), which we thread into
// useReactiveSplat. Reactivity is gated by `active` (mode === 'instrument') so the journey scrub
// stays deterministic — the splats hold a static pose until the instrument latch flips. The
// drapery foreground stays NON-reactive (foreground tent, not the visualizer).
export function SparkScene({ featuresRef, paramsRef, audioTexture, active }) {
  const { gl } = useThree()
  const spark = useMemo(() => new SparkRenderer({ renderer: gl }), [gl])

  // Capture the live rainforest SplatMesh as it swaps (placeholder -> real -> null). useReactiveSplat
  // re-attaches its modifier whenever this identity changes (and on null detaches/cleans up).
  const [reactiveMesh, setReactiveMesh] = useState(null)

  const rainforest = useSplatLayer(
    loadRainforestMesh,
    makeRainforestPlaceholder,
    'rainforest.spz',
    setReactiveMesh,
  )
  const drapery = useSplatLayer(loadDraperyMesh, makeDraperyPlaceholder, 'drapery.spz')

  useReactiveSplat(reactiveMesh, { featuresRef, paramsRef, audioTexture, active })

  return (
    <>
      <primitive object={spark} />
      <primitive object={rainforest} />
      <primitive object={drapery} />
    </>
  )
}
