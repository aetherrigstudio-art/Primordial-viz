import { useRef, useEffect, useCallback } from 'react'

// Viewpoint = a smoothed vector driven by gyro + scroll + pointer (NO webcam — D3 dropped).
// It writes to a ref and is read inside useFrame; it NEVER sets React state per frame.
// iOS gyro requires a user gesture: call enableGyro() from a tap (the start gate does this).
export function useViewpoint({ smoothing = 0.12 } = {}) {
  const target = useRef({ x: 0, y: 0, scroll: 0 })
  const smoothed = useRef({ x: 0, y: 0, scroll: 0 })

  // Advance the smoothing one step; call once per frame from useFrame.
  const step = useCallback(() => {
    const t = target.current, s = smoothed.current
    s.x += (t.x - s.x) * smoothing
    s.y += (t.y - s.y) * smoothing
    s.scroll += (t.scroll - s.scroll) * smoothing
    return s
  }, [smoothing])

  useEffect(() => {
    const onPointer = (e) => {
      target.current.x = (e.clientX / window.innerWidth) * 2 - 1
      target.current.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    const onScroll = () => {
      const max = Math.max(1, document.body.scrollHeight - window.innerHeight)
      target.current.scroll = window.scrollY / max
    }
    window.addEventListener('pointermove', onPointer, { passive: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('pointermove', onPointer)
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  const onOrientation = useCallback((e) => {
    // gamma = left/right tilt, beta = front/back. Normalize to ~[-1,1].
    if (e.gamma != null) target.current.x = Math.max(-1, Math.min(1, e.gamma / 45))
    if (e.beta != null) target.current.y = Math.max(-1, Math.min(1, (e.beta - 45) / 45))
  }, [])

  const enableGyro = useCallback(async () => {
    const DOE = window.DeviceOrientationEvent
    if (DOE && typeof DOE.requestPermission === 'function') {
      try {
        if ((await DOE.requestPermission()) !== 'granted') return false
      } catch { return false }
    }
    window.addEventListener('deviceorientation', onOrientation, true)
    return true
  }, [onOrientation])

  return { smoothed, step, enableGyro }
}
