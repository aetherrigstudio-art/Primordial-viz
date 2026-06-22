import { useFrame, useThree } from '@react-three/fiber'
import { offAxisFromViewpoint } from './offAxisFrustum.js'
import { makeFrameMonitor, clampDpr } from '../perf/mobileBudget.js'
import { useMemo, useRef } from 'react'

// Forward dolly + off-axis frustum, driven by the smoothed viewpoint. The journey position
// (dawn → tent → flutter → visualizer) will later come from Theatre.js/GSAP scroll; for the
// proving ground we map viewpoint.scroll straight to dolly Z so the camera move is visible.
export function CameraRig({ viewpoint }) {
  const { camera, gl, size } = useThree()
  const dolly = useRef(0)
  const monitor = useMemo(
    () => makeFrameMonitor({ lowFps: 30, onRegress: () => gl.setPixelRatio(clampDpr(window.devicePixelRatio) * 0.75) }),
    [gl],
  )

  useFrame((_, dt) => {
    const vp = viewpoint.step()
    // Forward dolly along the journey; scroll 0→1 pulls the camera through the drapery.
    dolly.current = -vp.scroll * 6
    camera.position.set(vp.x * 0.4, vp.y * 0.3, 4 + dolly.current)
    camera.lookAt(0, 0, -3)
    offAxisFromViewpoint(camera, vp, { w: size.width, h: size.height })
    monitor(dt)
  })

  return null
}
