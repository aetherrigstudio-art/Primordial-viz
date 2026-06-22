// MIDI control source — a FLAGGED adapter (off by default; enabled via useControls flags.midi).
//
// Maps Web MIDI continuous-controller (CC) messages onto the TARGETS seam. A CC value is 0..127,
// which we normalize to 0..1 and hand to target.apply() — so a hardware knob/fader drives a
// schema param without the source knowing units or ranges (same contract as keyboard.js / osc.js).
//
// Capability detection is mandatory: Web MIDI does NOT exist on Safari / iOS (no
// navigator.requestMIDIAccess), and on supporting browsers the user can deny access. In every
// such case this source must be a SILENT no-op — never throw, never block the instrument. It is
// purely additive: absent MIDI just means no MIDI knobs, the keyboard baseline still works.
//
// Binding: CC number -> targetId. We bind in TARGETS registry order to the first N CCs starting
// at a base (default CC 1), which gives a deterministic default mapping any 8+-knob controller can
// reach. A caller can override with an explicit { ccMap: { [ccNumber]: targetId } }.

import { TARGETS, TARGETS_BY_ID } from '../targets.js'

const STATUS_CC = 0xb0 // Control Change, lower nibble = channel; we accept any channel.

// Build the default CC->targetId map: CCs base, base+1, ... over the TARGETS list in order.
function defaultCcMap(base) {
  const map = {}
  let cc = base
  for (const t of TARGETS) {
    if (cc > 119) break // 120..127 are channel-mode messages, not knobs
    map[cc] = t.targetId
    cc += 1
  }
  return map
}

// createMidiSource(store, { ccMap, baseCc, getEnabled }) -> { dispose() }  (async-internally)
//   store     : createStore() instance.
//   ccMap     : optional explicit { ccNumber:int -> targetId:string } override.
//   baseCc    : first CC for the default sequential map (default 1).
//   getEnabled : optional ()->boolean gate.
// Returns synchronously with a dispose(); MIDI access is requested asynchronously and wired in
// once granted. dispose() is safe to call before or after access resolves.
export function createMidiSource(store, opts = {}) {
  let disposed = false
  let access = null
  const inputHandlers = [] // [{ input, handler }] so we can detach cleanly

  if (!store || typeof store.setParam !== 'function') return { dispose() {} }

  // Capability gate: no Web MIDI -> silent no-op (Safari/iOS, older browsers).
  const nav = typeof navigator !== 'undefined' ? navigator : null
  if (!nav || typeof nav.requestMIDIAccess !== 'function') {
    return { dispose() {} }
  }

  const getEnabled = typeof opts.getEnabled === 'function' ? opts.getEnabled : () => true
  const baseCc = Number.isFinite(opts.baseCc) ? opts.baseCc : 1
  const ccMap = (opts.ccMap && typeof opts.ccMap === 'object') ? opts.ccMap : defaultCcMap(baseCc)

  function onMidiMessage(e) {
    if (disposed || !getEnabled()) return
    const data = e && e.data
    if (!data || data.length < 3) return
    const status = data[0] & 0xf0
    if (status !== STATUS_CC) return // only Control Change
    const cc = data[1]
    const value = data[2] // 0..127
    const targetId = ccMap[cc]
    if (!targetId) return
    const target = TARGETS_BY_ID[targetId]
    if (!target) return
    target.apply(value / 127, store)
  }

  function attach(input) {
    if (!input || input.type !== 'input') return
    input.addEventListener('midimessage', onMidiMessage)
    inputHandlers.push({ input })
  }

  function bindAllInputs() {
    if (!access || disposed) return
    // access.inputs is a Map-like; iterate values.
    const inputs = access.inputs
    if (inputs && typeof inputs.forEach === 'function') {
      inputs.forEach((input) => attach(input))
    }
    // Hot-plug: re-bind when devices connect.
    access.onstatechange = (ev) => {
      if (disposed) return
      const port = ev && ev.port
      if (port && port.type === 'input' && port.state === 'connected') {
        // Avoid double-binding the same input.
        if (!inputHandlers.some((h) => h.input === port)) attach(port)
      }
    }
  }

  // Request access asynchronously; deny/fail -> stay a no-op.
  nav.requestMIDIAccess({ sysex: false }).then(
    (granted) => {
      if (disposed) return
      access = granted
      bindAllInputs()
    },
    () => { /* denied / unsupported at runtime — silent no-op */ },
  )

  return {
    dispose() {
      disposed = true
      for (const { input } of inputHandlers) {
        try { input.removeEventListener('midimessage', onMidiMessage) } catch { /* port gone */ }
      }
      inputHandlers.length = 0
      if (access) { try { access.onstatechange = null } catch { /* ignore */ } }
      access = null
    },
  }
}
