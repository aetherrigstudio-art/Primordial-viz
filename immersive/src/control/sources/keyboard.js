// Keyboard control source — the BASELINE input adapter for the instrument.
//
// This is the always-available way to perform the visuals with no extra hardware: it maps
// keydown/keyup onto the TARGETS seam (control/targets.js), never touching the splats directly.
// Every other source (MIDI, OSC) mirrors this shape — instantiate, wire to TARGETS+store, dispose.
//
// Interaction model (chosen to stay learnable on a laptop, one hand):
//   - Number keys 1..7 select the active control GROUP (movement/lighting/growth/shadow/bloom/
//     flowerColor/atmos — in SCHEMA group order). The group's targets become the "row" you nudge.
//   - Left/Right arrows (or [ / ]) move the cursor between the targets WITHIN the active group.
//   - Up/Down arrows (or + / -) nudge the selected target's normalized 0..1 value by a step,
//     and apply() denormalizes into the schema range + writes through the store.
//   - Holding Shift makes a coarse nudge; the bare key is fine.
//   - '0' resets the selected target toward the middle (0.5) — a quick neutral.
//
// Focus respect: we ignore keystrokes while the user is typing into a form field or a
// contentEditable region (so a device-picker <select> or a text input keeps its own keys), and
// while a modifier that means "browser shortcut" (Ctrl/Meta/Alt) is held.

import { SCHEMA } from '../schema.js'
import { TARGETS } from '../targets.js'

// SCHEMA group order, de-duplicated, so number keys map to a stable group list.
function groupOrder() {
  const seen = new Set()
  const order = []
  for (const entry of SCHEMA) {
    if (!seen.has(entry.group)) { seen.add(entry.group); order.push(entry.group) }
  }
  return order
}

// Targets belonging to a group, in registry order. A color group expands to its R/G/B channel
// targets; a range group is its single target — so the cursor walks every tunable knob.
function targetsForGroup(group) {
  const keysInGroup = new Set(SCHEMA.filter((e) => e.group === group).map((e) => e.key))
  return TARGETS.filter((t) => keysInGroup.has(t.schemaKey))
}

const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v)

// Is the event target something that owns its own keystrokes? (inputs, selects, textareas,
// contentEditable). We must not steal keys from those.
function isEditableTarget(target) {
  if (!target || typeof target.tagName !== 'string') return false
  const tag = target.tagName.toUpperCase()
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
  if (target.isContentEditable) return true
  return false
}

// createKeyboardSource(store, { fineStep, coarseStep, getEnabled }) -> { dispose() }
//   store     : createStore() instance — apply() writes through it.
//   fineStep  : normalized nudge per keypress (default 0.05).
//   coarseStep: Shift-held nudge (default 0.2).
//   getEnabled: optional ()->boolean gate; when it returns false the source ignores input
//               (used to keep keyboard inert until the instrument mode is active).
export function createKeyboardSource(store, opts = {}) {
  if (!store || typeof store.setParam !== 'function') {
    // Defensive: a source with no store is a no-op rather than a crash at construction.
    return { dispose() {} }
  }
  if (typeof window === 'undefined' || typeof window.addEventListener !== 'function') {
    return { dispose() {} } // non-DOM env (SSR / tests) — silent no-op.
  }

  const fineStep = Number.isFinite(opts.fineStep) ? opts.fineStep : 0.05
  const coarseStep = Number.isFinite(opts.coarseStep) ? opts.coarseStep : 0.2
  const getEnabled = typeof opts.getEnabled === 'function' ? opts.getEnabled : () => true

  const groups = groupOrder()
  // Normalized 0..1 cursor value we hold per target, so repeated nudges accumulate. Seeded at
  // the schema midpoint (0.5) since the source only knows normalized space, not stored units.
  const valueByTarget = new Map()
  for (const t of TARGETS) valueByTarget.set(t.targetId, 0.5)

  let activeGroup = 0          // index into `groups`
  let cursor = 0               // index into the active group's targets

  function activeTargets() {
    return targetsForGroup(groups[activeGroup])
  }

  function selectGroup(i) {
    if (i < 0 || i >= groups.length) return
    activeGroup = i
    cursor = 0
  }

  function moveCursor(delta) {
    const list = activeTargets()
    if (list.length === 0) return
    cursor = (cursor + delta + list.length) % list.length
  }

  function nudge(delta) {
    const list = activeTargets()
    if (list.length === 0) return
    const target = list[cursor % list.length]
    const next = clamp01(valueByTarget.get(target.targetId) + delta)
    valueByTarget.set(target.targetId, next)
    target.apply(next, store)
  }

  function resetSelected() {
    const list = activeTargets()
    if (list.length === 0) return
    const target = list[cursor % list.length]
    valueByTarget.set(target.targetId, 0.5)
    target.apply(0.5, store)
  }

  function onKeyDown(e) {
    if (!getEnabled()) return
    if (e.ctrlKey || e.metaKey || e.altKey) return  // leave browser/OS shortcuts alone
    if (isEditableTarget(e.target)) return           // don't steal keys from form fields

    const step = e.shiftKey ? coarseStep : fineStep
    const k = e.key

    // Number keys 1..(N) select a group.
    if (k >= '1' && k <= '9') {
      const idx = k.charCodeAt(0) - '1'.charCodeAt(0)
      if (idx < groups.length) { selectGroup(idx); e.preventDefault() }
      return
    }
    if (k === '0') { resetSelected(); e.preventDefault(); return }

    switch (k) {
      case 'ArrowRight':
      case ']':
        moveCursor(1); e.preventDefault(); return
      case 'ArrowLeft':
      case '[':
        moveCursor(-1); e.preventDefault(); return
      case 'ArrowUp':
      case '+':
      case '=': // un-shifted '+' on most layouts
        nudge(step); e.preventDefault(); return
      case 'ArrowDown':
      case '-':
      case '_':
        nudge(-step); e.preventDefault(); return
      default:
        return
    }
  }

  window.addEventListener('keydown', onKeyDown)

  return {
    // Exposed for tests / a future on-screen HUD that wants to show the active group+cursor.
    getSelection() {
      const list = activeTargets()
      return {
        group: groups[activeGroup],
        targetId: list.length ? list[cursor % list.length].targetId : null,
      }
    },
    dispose() {
      window.removeEventListener('keydown', onKeyDown)
    },
  }
}
