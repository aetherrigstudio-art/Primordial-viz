// Travel driver — owns the single 0..1 `travel` scalar the journey is scrubbed by.
//
// Two ways travel advances:
//  1. NORMAL: an external source fn (set via setSource) reports where the journey wants to be
//     — e.g. the arrow-nav forward control, or later Theatre.js position/length. The source
//     may hold at a "station" (return the same value for a while) so a beat lands; normal
//     advance simply mirrors the source and respects those holds.
//  2. SKIP: requestSkip() starts an eased, monotonic ramp travel -> 1 that IGNORES station
//     holds and OVERRIDES the source until it reaches 1. Once skipping, travel only ever moves
//     toward 1 (never backward), so the instrument-mode latch can't un-flip.
//
// Framework-light: a plain factory, no React, no deps. tick(dt) is called once per frame by a
// pump in the Canvas; getTravel() is read wherever travel is needed (camera, journey, latch).
// Skip duration is fixed so the ramp is deterministic regardless of source behaviour.

const SKIP_SECONDS = 2.2 // wall-clock length of the skip-to-end ramp

// Smootherstep (C2-continuous ease) — gentler in/out than smoothstep, authored from blank.
function ease(t) {
  const x = t < 0 ? 0 : t > 1 ? 1 : t
  return x * x * x * (x * (x * 6 - 15) + 10)
}

export function createTravelDriver() {
  let source = () => 0 // external 0..1 reporter; stub until setSource wires the real one
  let travel = 0 // last value returned by getTravel(); monotone once skipping
  let skipping = false
  let skipFrom = 0 // travel value when the skip ramp began
  let skipT = 0 // 0..1 progress along the skip ramp (advanced by tick(dt))

  function clamp01(v) {
    return v < 0 ? 0 : v > 1 ? 1 : v
  }

  return {
    // Current travel, 0..1. While skipping this follows the eased ramp and ignores the source.
    getTravel() {
      if (skipping) {
        const r = skipFrom + (1 - skipFrom) * ease(skipT)
        // Monotone guard: never let the reported value retreat below what we've shown.
        travel = r > travel ? r : travel
        return travel
      }
      let v = clamp01(Number(source()) || 0)
      // Even in normal mode travel never moves backward once it has advanced — keeps the
      // journey scrub deterministic and the latch one-way. (Stations hold; they don't rewind.)
      if (v < travel) v = travel
      travel = v
      return travel
    },

    // Advance the skip ramp. No-op when not skipping. dt is seconds.
    tick(dt) {
      if (!skipping) return
      const step = dt > 0 && dt < 1 ? dt : 0 // ignore bad/huge dt (tab-switch spikes)
      skipT = clamp01(skipT + step / SKIP_SECONDS)
    },

    // Begin (or restart toward end) an eased monotonic ramp travel -> 1. Idempotent while
    // already skipping (won't reset the ramp backward). Captures the current travel as the
    // ramp origin so the skip eases on from wherever the journey currently sits.
    requestSkip() {
      if (skipping) return
      skipping = true
      skipFrom = travel
      skipT = 0
    },

    // Wire the external 0..1 source (arrow-nav now, Theatre.js position later).
    setSource(fn) {
      source = typeof fn === 'function' ? fn : () => 0
    },
  }
}
