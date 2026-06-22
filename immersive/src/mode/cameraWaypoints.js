// Camera waypoint graph for the beat-synced instrument camera.
//
// At journey's end (mode === 'instrument') the camera stops being driven forward and instead
// drifts between a small set of "near areas" inside the rainforest splat — slow, tasteful moves
// that re-frame the live audio-reactive bloom on musical boundaries. The rainforest layer sits
// around z ≈ -8 at scale 3 (see splat/loadRainforest.js) and the journey camera arrives near
// [0, 0, 4] looking toward [0, 0, -3], so these waypoints keep the camera in the corridor mouth
// and nearby pockets — never inside or past the geometry.
//
// Each waypoint:
//   id        : stable string key (for logs / debugging).
//   position  : [x, y, z] camera position in world space.
//   lookAt    : [x, y, z] world point the camera aims at.
//   animation : a small set of param BIASES applied while the camera dwells here. Keys are
//               control-schema params (control/schema.js) added (clamped by the schema) on top of
//               the performer's params, so each near area has its own lighting/bloom/movement
//               emphasis. Sparse — only the keys a waypoint wants to push. Consumed by
//               instrumentCamera.js (nudges the control store) and exposed as a bias for the
//               reactive splat.
//
// Authored from blank; values are tasteful near-area framings, not captured data.

export const CAMERA_WAYPOINTS = [
  {
    // Corridor mouth — the arrival frame, centered, calm. A touch of haze for depth.
    id: 'mouth',
    position: [0, 0, 4],
    lookAt: [0, 0, -3],
    animation: { haze: 0.15, intensity: 0.2, sway: 0.05 },
  },
  {
    // Left pocket — slip toward a side of the corridor, warmer key light raking across the bloom.
    id: 'left-pocket',
    position: [-2.4, 0.3, 2.6],
    lookAt: [-0.6, -0.2, -4],
    animation: { azimuth: -0.5, lightGain: 0.4, intensity: 0.5, sway: 0.1 },
  },
  {
    // Right pocket — mirror side, cooler haze, a little more turbulence in the sway.
    id: 'right-pocket',
    position: [2.4, 0.2, 2.6],
    lookAt: [0.6, -0.1, -4],
    animation: { azimuth: 0.5, haze: 0.25, turbulence: 0.2, sway: 0.1 },
  },
  {
    // Low canopy — drop and look up into the blooming canopy; bloom + growth emphasis.
    id: 'low-canopy',
    position: [0, -1.4, 1.8],
    lookAt: [0, 1.2, -5],
    animation: { elevation: 0.4, intensity: 0.8, amount: 0.4, threshold: -0.15 },
  },
  {
    // High overlook — lift and angle down over the corridor; broad, airy, soft shadows.
    id: 'high-overlook',
    position: [0, 1.8, 3.0],
    lookAt: [0, -0.6, -5],
    animation: { elevation: 0.5, softness: 0.3, haze: 0.2, swaySpeed: 0.3 },
  },
  {
    // Deep approach — ease forward toward the throat of the corridor; intimate, dense bloom.
    id: 'deep-approach',
    position: [0.4, -0.2, 0.6],
    lookAt: [0, 0, -6],
    animation: { intensity: 0.6, amount: 0.5, tintMix: 0.25, haze: 0.1 },
  },
]
