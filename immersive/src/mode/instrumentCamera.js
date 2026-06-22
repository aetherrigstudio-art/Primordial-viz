import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { CAMERA_WAYPOINTS } from './cameraWaypoints.js'

// Beat-synced movable instrument camera.
//
// When `active` (mode === 'instrument'), this hook OWNS the three.js camera: it advances to the
// next waypoint every ADVANCE_BARS bars on a bar boundary (read from beatRef's running bar count),
// easing position + lookAt toward the target over ~EASE_SECONDS. Each waypoint's `animation`
// biases are applied while dwelling there (nudged onto the control store, if one is supplied, and
// exposed via biasRef for the reactive splat). When NOT active, the hook is inert — the journey
// CameraRig owns the camera.
//
// Manual override: any camera input the user provides (keyboard/pointer/the existing viewpoint)
// suspends the autonomous beat path for OVERRIDE_SECONDS, then resumes from the camera's current
// pose. The host signals input by calling the returned notifyManualInput() (or by flipping a ref).
//
// Refs, not per-frame React state (the refs-not-state rule): the camera, eased pose, target index,
// bar bookkeeping, and override timer all live in refs; nothing here triggers a React render.

const ADVANCE_BARS = 8 // advance to the next waypoint every N bars (8 or 16; default 8)
const EASE_SECONDS = 1.6 // wall-clock time to ease into a new waypoint (~1-2s)
const OVERRIDE_SECONDS = 4 // suspend auto-advance this long after the last manual input

// Frame-rate-independent damp toward a target. Returns the lerp factor for this dt given a time
// constant `tau` (seconds): higher tau = slower ease. Authored from blank (exponential smoothing).
function dampFactor(tau, dt) {
  if (!(dt > 0)) return 0
  return 1 - Math.exp(-dt / Math.max(0.0001, tau))
}

export function useInstrumentCamera({ active, beatRef, paramsStore = null } = {}) {
  const { camera } = useThree()

  // Eased pose the camera tracks. position is the camera location; look is the aim point.
  const posRef = useRef(new Vector3())
  const lookRef = useRef(new Vector3())
  const targetPosRef = useRef(new Vector3())
  const targetLookRef = useRef(new Vector3())
  const initedRef = useRef(false)

  const idxRef = useRef(0) // current waypoint index
  const lastAdvanceBarRef = useRef(0) // bar count at the last advance (for the every-N-bars gate)
  const prevBarRef = useRef(0) // last-seen bar count (to detect a bar boundary crossing)

  // Manual-override timer: > 0 means auto-advance is suspended (counts down in seconds).
  const overrideRef = useRef(0)
  const notifyManualInput = useMemo(
    () => () => { overrideRef.current = OVERRIDE_SECONDS },
    [],
  )

  // The active waypoint's param biases, exposed for the reactive splat (a sparse {key: delta} map).
  const biasRef = useRef({})

  // Reset bar bookkeeping each time we (re)enter instrument mode so the first window starts fresh.
  useEffect(() => {
    if (!active) return
    initedRef.current = false
    idxRef.current = 0
    const b = beatRef?.current?.bar || 0
    lastAdvanceBarRef.current = b
    prevBarRef.current = b
  }, [active, beatRef])

  // Apply a waypoint's animation biases: stash them on biasRef (for the splat) and, if a control
  // store is supplied, nudge those params by the bias (clamped by the schema in setParam). Called
  // once per waypoint advance — NOT per frame — so the store isn't churned.
  const applyBias = useMemo(
    () => (waypoint) => {
      const anim = waypoint?.animation || {}
      biasRef.current = anim
      if (!paramsStore || typeof paramsStore.setParam !== 'function') return
      for (const key in anim) {
        const base = Number(paramsStore.getParam?.(key))
        if (Number.isFinite(base)) paramsStore.setParam(key, base + anim[key])
      }
    },
    [paramsStore],
  )

  useFrame((_, dt) => {
    if (!active) return // journey mode: CameraRig owns the camera; stay inert.
    const wps = CAMERA_WAYPOINTS
    if (!wps.length) return

    // First active frame: seed eased pose + targets from the current waypoint and the live camera,
    // so we ease ON from wherever the journey left the camera rather than snapping.
    if (!initedRef.current) {
      initedRef.current = true
      posRef.current.copy(camera.position)
      const wp = wps[idxRef.current]
      targetPosRef.current.fromArray(wp.position)
      targetLookRef.current.fromArray(wp.lookAt)
      lookRef.current.copy(targetLookRef.current)
      applyBias(wp)
    }

    // Tick the override timer; auto-advance only resumes once it hits 0.
    if (overrideRef.current > 0) {
      overrideRef.current = Math.max(0, overrideRef.current - dt)
      // While overridden, keep tracking the bar count so we don't fire a backlog of advances on
      // resume — treat "now" as the advance baseline.
      const barNow = beatRef?.current?.bar || 0
      prevBarRef.current = barNow
      lastAdvanceBarRef.current = barNow
      return // hands off — the host's manual control drives the camera this frame.
    }

    // Bar-boundary advance: when the running bar count ticks up AND we've dwelled ADVANCE_BARS bars
    // since the last advance, step to the next waypoint on that downbeat.
    const bar = beatRef?.current?.bar || 0
    if (bar > prevBarRef.current) {
      if (bar - lastAdvanceBarRef.current >= ADVANCE_BARS) {
        idxRef.current = (idxRef.current + 1) % wps.length
        const wp = wps[idxRef.current]
        targetPosRef.current.fromArray(wp.position)
        targetLookRef.current.fromArray(wp.lookAt)
        applyBias(wp)
        lastAdvanceBarRef.current = bar
      }
      prevBarRef.current = bar
    }

    // Ease the pose toward the target and write the camera.
    const k = dampFactor(EASE_SECONDS, dt)
    posRef.current.lerp(targetPosRef.current, k)
    lookRef.current.lerp(targetLookRef.current, k)
    camera.position.copy(posRef.current)
    camera.lookAt(lookRef.current)
  })

  return { notifyManualInput, biasRef, overrideRef }
}
