// Off-axis / anamorphic frustum — the "window into recessed depth" (PLAN §4). three's
// setViewOffset reframes the projection asymmetrically without moving the camera, so the
// vanishing point can sit off-centre as the viewpoint shifts (gyro/pointer) — the parallax
// that sells "looking through a window into the scene." Pure helpers (no R3F dependency).

// offsetX/offsetY are in the same units as fullW/fullH (the virtual oversized frame).
export function applyOffAxis(camera, { fullW, fullH, offsetX, offsetY, viewW, viewH }) {
  camera.setViewOffset(fullW, fullH, offsetX, offsetY, viewW, viewH)
  camera.updateProjectionMatrix()
}

export function clearOffAxis(camera) {
  camera.clearViewOffset()
  camera.updateProjectionMatrix()
}

// Map a smoothed viewpoint vec (x,y in roughly [-1,1]) to a subtle off-axis shift. `amount`
// is the fraction of the frame the vanishing point may travel; keep small (≈0.15) or it reads
// as a tilt rather than depth.
export function offAxisFromViewpoint(camera, vp, { w, h, amount = 0.15 } = {}) {
  const fullW = w / (1 - amount)
  const fullH = h / (1 - amount)
  const offsetX = (fullW - w) * (0.5 + vp.x * 0.5)
  const offsetY = (fullH - h) * (0.5 - vp.y * 0.5)
  applyOffAxis(camera, { fullW, fullH, offsetX, offsetY, viewW: w, viewH: h })
}
