// Control-core parameter schema for the immersive instrument. Mirrors the SHAPE of
// /root/Primordial-viz/src/params/schema.js (entries + coerceValue/coerceParams/DEFAULTS),
// ported — NOT imported — per the no-cross-app-imports rule.
//
// Each entry: { key, label, type, min, max, step, default, group }
//   type 'range' = single float; type 'color' = [r,g,b] each 0..1.
//   group ∈ 'movement' | 'lighting' | 'growth' | 'foliage' | 'shadow' | 'bloom' | 'flowerColor' | 'atmos'.
// These params drive the reactive splat modifier (splat/reactiveModifier.js); they are the
// performer-tunable knobs every control source (keyboard/MIDI/OSC) maps onto via targets.js.
// store.js validates/coerces against this on load (multiple tools share localStorage at one
// origin, and schemas bump over time — so never trust persisted data).

export const SCHEMA = [
  // movement — how much the splats sway/drift in response to audio + time.
  { key: 'sway', label: 'Sway', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.35, group: 'movement' },
  { key: 'swaySpeed', label: 'Sway Speed', type: 'range', min: 0.0, max: 3.0, step: 0.01, default: 1.0, group: 'movement' },
  { key: 'turbulence', label: 'Turbulence', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.25, group: 'movement' },

  // lighting — direction + strength of the diegetic key light over the bloom.
  { key: 'azimuth', label: 'Light Azimuth', type: 'range', min: 0.0, max: 6.2832, step: 0.01, default: 2.2, group: 'lighting' },
  { key: 'elevation', label: 'Light Elevation', type: 'range', min: 0.0, max: 1.5708, step: 0.01, default: 0.7, group: 'lighting' },
  { key: 'lightGain', label: 'Light Gain', type: 'range', min: 0.0, max: 2.0, step: 0.01, default: 1.0, group: 'lighting' },

  // growth — the audio-driven "bloom opening"/scale-pop of flower splats.
  { key: 'amount', label: 'Growth', type: 'range', min: 0.0, max: 1.5, step: 0.01, default: 0.5, group: 'growth' },
  { key: 'growthSpeed', label: 'Growth Speed', type: 'range', min: 0.0, max: 3.0, step: 0.01, default: 1.0, group: 'growth' },

  // foliage — slow creeping "ivy growing in" on the green (foliage-masked) splats.
  { key: 'ivy', label: 'Ivy Growth', type: 'range', min: 0.0, max: 1.5, step: 0.01, default: 0.3, group: 'foliage' },
  { key: 'ivySpeed', label: 'Ivy Speed', type: 'range', min: 0.0, max: 3.0, step: 0.01, default: 1.0, group: 'foliage' },

  // shadow — contact/ambient occlusion depth under the canopy.
  { key: 'depth', label: 'Shadow Depth', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.45, group: 'shadow' },
  { key: 'softness', label: 'Shadow Softness', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.6, group: 'shadow' },

  // bloom — emissive lift on the masked flower-region splats (semanticMask seam).
  { key: 'intensity', label: 'Bloom Intensity', type: 'range', min: 0.0, max: 3.0, step: 0.01, default: 1.0, group: 'bloom' },
  { key: 'threshold', label: 'Bloom Threshold', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.5, group: 'bloom' },

  // flowerColor — performer tint pushed onto the bloom-masked splats (pink/white/coral palette).
  { key: 'tint', label: 'Flower Tint', type: 'color', default: [0.90, 0.55, 0.66], group: 'flowerColor' },
  { key: 'tintMix', label: 'Tint Mix', type: 'range', min: 0.0, max: 1.0, step: 0.01, default: 0.4, group: 'flowerColor' },

  // atmos (haze, hazeColor) returns with the atmospherics post-pass (roadmap 1.7) — removed for now
  // since the modifier doesn't consume it; targets/keyboard/MIDI/OSC derive from SCHEMA so they drop it too.
]

export const DEFAULTS = (() => {
  const o = {}
  for (const p of SCHEMA) o[p.key] = clone(p.default)
  return o
})()

// Quick key -> entry lookup so coerceValue(key, v) can take a bare key.
const BY_KEY = (() => {
  const m = {}
  for (const p of SCHEMA) m[p.key] = p
  return m
})()

function clone(v) {
  return Array.isArray(v) ? v.slice() : v
}

// Coerce one value against its schema entry (looked up by key). Unknown key -> the raw value
// is returned untouched, so callers can store auxiliary state without it being clobbered.
export function coerceValue(key, value) {
  const entry = BY_KEY[key]
  if (!entry) return value
  if (entry.type === 'color') {
    if (!Array.isArray(value) || value.length !== 3) return clone(entry.default)
    return value.map((c) => {
      const n = Number(c)
      return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : 0
    })
  }
  // range
  let n = Number(value)
  if (!Number.isFinite(n)) n = entry.default
  n = Math.min(entry.max, Math.max(entry.min, n))
  return n
}

// Validate/coerce a whole params object against the schema, filling missing keys with defaults.
// Never throws on bad/old data — that is the contract store.js relies on for coerce-on-load.
export function coerceParams(obj) {
  const out = {}
  const src = obj && typeof obj === 'object' ? obj : {}
  for (const entry of SCHEMA) {
    out[entry.key] = coerceValue(entry.key, src[entry.key])
  }
  return out
}
