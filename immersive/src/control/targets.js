import { SCHEMA } from './schema.js'

// The control SEAM. TARGETS is a flat registry every control source (keyboard / MIDI / OSC,
// in control/sources/) maps onto: a source emits a normalized 0..1 value for a targetId, and
// the target denormalizes it into the schema's range and writes it through the store. Keeping
// this flat + value01-based means a new input device only has to bind targetId → 0..1; it never
// needs to know each param's units, range, or whether it's a color channel.
//
// Each entry: { targetId, schemaKey, apply(value01, store) }
//   value01 : 0..1 (clamped here defensively — sources may overshoot).
//   store   : the createStore() instance; apply() calls store.setParam(schemaKey, mapped).
// Range params map linearly into [min,max] and snap to `step`. Color params expand into three
// per-channel targets (…R/…G/…B) so a single 0..1 source can drive one channel; apply() reads
// the current color from the store, replaces the one channel, and writes the whole triple back.

const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v)

function mapRange(entry, value01) {
  const t = clamp01(value01)
  let v = entry.min + t * (entry.max - entry.min)
  if (entry.step > 0) {
    // Snap to the nearest step from min, then re-clamp (float error can nudge past max).
    v = entry.min + Math.round((v - entry.min) / entry.step) * entry.step
    if (v < entry.min) v = entry.min
    if (v > entry.max) v = entry.max
  }
  return v
}

const CHANNELS = ['R', 'G', 'B']

export const TARGETS = (() => {
  const list = []
  for (const entry of SCHEMA) {
    if (entry.type === 'color') {
      for (let c = 0; c < 3; c++) {
        list.push({
          targetId: `${entry.key}.${CHANNELS[c]}`,
          schemaKey: entry.key,
          apply(value01, store) {
            const cur = store.getParam(entry.key)
            const next = Array.isArray(cur) ? cur.slice() : [0, 0, 0]
            next[c] = clamp01(value01)
            store.setParam(entry.key, next)
          },
        })
      }
    } else {
      list.push({
        targetId: entry.key,
        schemaKey: entry.key,
        apply(value01, store) {
          store.setParam(entry.key, mapRange(entry, value01))
        },
      })
    }
  }
  return list
})()

// Fast lookup so a source can resolve a binding without scanning the array.
export const TARGETS_BY_ID = (() => {
  const m = {}
  for (const t of TARGETS) m[t.targetId] = t
  return m
})()
