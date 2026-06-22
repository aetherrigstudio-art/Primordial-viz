import { useState, useRef, useEffect, useCallback } from 'react'

// Instrument-mode latch — the one-way gate between the journey and the live audio-reactive
// instrument at journey's end (PLAN: "instrument handoff at journey's end").
//
// Reads getTravel() (from the travel driver) once per animation frame WITHOUT setting React
// state per frame: it only ever calls setMode ONCE, when travel first crosses the end. The
// latch is PERMANENT — once 'instrument', it never returns to 'journey' (even if a later
// travel read dipped, which the driver's monotone guard already prevents). A tiny dwell (a few
// consecutive end-frames) debounces a single stray end-value from flipping early.
//
// `mode` gates audio-reactivity `active`, enables controls, and is announced for a11y by the
// caller. requestSkip is passed straight through so a "skip to the instrument" button can reach
// the driver from wherever the hook is consumed.
//
// getTravel may be either the driver's getTravel fn, or a driver object exposing getTravel +
// requestSkip — both are accepted so the caller can hand over the whole driver.

const END = 0.999 // travel value that counts as "arrived"
const DWELL_FRAMES = 4 // consecutive end-frames required before latching (debounce)

export function useInstrumentMode(getTravel) {
  // Normalize the arg: accept a bare fn or a driver-like object.
  const read =
    typeof getTravel === 'function'
      ? getTravel
      : getTravel && typeof getTravel.getTravel === 'function'
        ? () => getTravel.getTravel()
        : () => 0
  const skipFn =
    getTravel && typeof getTravel.requestSkip === 'function' ? getTravel.requestSkip : null

  const [mode, setMode] = useState('journey')
  const latched = useRef(false) // mirrors mode==='instrument'; avoids a stale-closure re-flip
  const dwell = useRef(0)
  const readRef = useRef(read)
  readRef.current = read

  useEffect(() => {
    if (latched.current) return // already in instrument mode — nothing to poll
    let raf = 0
    const poll = () => {
      if (!latched.current) {
        const t = Number(readRef.current()) || 0
        if (t >= END) {
          dwell.current += 1
          if (dwell.current >= DWELL_FRAMES) {
            latched.current = true
            setMode('instrument')
            return // stop the loop; the latch is permanent
          }
        } else {
          dwell.current = 0
        }
        raf = requestAnimationFrame(poll)
      }
    }
    raf = requestAnimationFrame(poll)
    return () => cancelAnimationFrame(raf)
  }, [])

  const requestSkip = useCallback(() => {
    if (skipFn) skipFn()
  }, [skipFn])

  return { mode, requestSkip }
}
