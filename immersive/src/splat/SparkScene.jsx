import { useMemo } from 'react'
import { useThree } from '@react-three/fiber'
import { SparkRenderer } from '@sparkjsdev/spark'
import { useSplatLayer } from './useSplatLayer.js'
import { loadDraperyMesh, makeDraperyPlaceholder } from './loadDrapery.js'
import { loadRainforestMesh, makeRainforestPlaceholder } from './loadRainforest.js'

// Multi-splat scene. One SparkRenderer composites every SplatMesh added under it via global-buffer
// merge, so the layers sort correctly together (per the experience doc: "several splats together
// — captured drapery AND a captured Appalachian rainforest"). Each layer renders its placeholder
// on the first frame and swaps in its real splat when that asset loads, falling back otherwise —
// so the composite always renders. The rainforest is the enclosing environment; the drapery is
// the foreground tent. (The flutter/reveal choreography between them is a later increment.)
export function SparkScene() {
  const { gl } = useThree()
  const spark = useMemo(() => new SparkRenderer({ renderer: gl }), [gl])
  const rainforest = useSplatLayer(loadRainforestMesh, makeRainforestPlaceholder, 'rainforest.spz')
  const drapery = useSplatLayer(loadDraperyMesh, makeDraperyPlaceholder, 'drapery.spz')

  return (
    <>
      <primitive object={spark} />
      <primitive object={rainforest} />
      <primitive object={drapery} />
    </>
  )
}
