// Mobile perf budget — mirrors .claude/rules/shaders.md and PLAN §4. Framework-agnostic so it
// is unit-testable and reusable by the eventual library build. Splats are VRAM-heavy: DPR cap,
// regress on sustained low FPS, and pause on visibilitychange or phones thermal-throttle.

export const DPR_CAP = 1.5

export function clampDpr(devicePixelRatio = 1) {
  return Math.min(devicePixelRatio, DPR_CAP)
}

// Rolling frame-time monitor. Feed it dt (seconds) each frame; when the trailing average FPS
// stays under `lowFps` for a full window it calls onRegress(fps) ONCE per crossing (hysteresis
// prevents flapping). Drive DPR/splat-LOD down in onRegress.
export function makeFrameMonitor({ lowFps = 30, window = 90, onRegress } = {}) {
  let acc = 0, n = 0, regressed = false
  return function sample(dt) {
    if (!(dt > 0) || dt > 0.25) return // ignore tab-switch spikes / bad dt
    acc += dt; n += 1
    if (n < window) return
    const fps = n / acc
    acc = 0; n = 0
    if (fps < lowFps && !regressed) { regressed = true; onRegress && onRegress(fps) }
    else if (fps > lowFps + 8) { regressed = false } // recovered with margin
  }
}

// Calls setActive(false) when the tab/page is hidden, setActive(true) when visible — so the
// rAF loop and audio can pause. Returns a disposer.
export function pauseOnHidden(setActive) {
  const onVis = () => setActive(!document.hidden)
  document.addEventListener('visibilitychange', onVis)
  return () => document.removeEventListener('visibilitychange', onVis)
}

export function prefersReducedMotion() {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
}
