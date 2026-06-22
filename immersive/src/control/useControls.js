// useControls(store, flags) — React hook that wires the enabled control SOURCES to the store.
//
// The control core is: SCHEMA (params) -> store (state+persist) -> TARGETS (normalized seam) ->
// SOURCES (input devices). This hook owns the SOURCES lifecycle: it instantiates each enabled
// source, hands it the store (every source maps onto TARGETS only, never the splats), and disposes
// them on unmount or when flags change. Adding an input device = adding a source under
// control/sources/ and a flag here — nothing else in the app changes.
//
// flags = { keyboard:true, midi:false, osc:false } (defaults: keyboard on, the rest off — MIDI/OSC
// are opt-in because they need hardware/a bridge). Each source self-detects capability and degrades
// to a silent no-op when its transport is unavailable (no Web MIDI on iOS; no OSC bridge running),
// so enabling a flag can never break the instrument.
//
// Returns {} — the contract is the side effect (sources attached) + cleanup; there is nothing for
// the caller to read. Re-runs (and re-creates sources) only when the store identity or the
// individual flag booleans change.

import { useEffect } from 'react'
import { createKeyboardSource } from './sources/keyboard.js'
import { createMidiSource } from './sources/midi.js'
import { createOscSource } from './sources/osc.js'

const DEFAULT_FLAGS = { keyboard: true, midi: false, osc: false }

export function useControls(store, flags = {}) {
  // Read individual booleans so the effect deps are primitives (a fresh `flags` object each render
  // wouldn't otherwise re-run, and wouldn't tear down a disabled source).
  const keyboard = flags.keyboard ?? DEFAULT_FLAGS.keyboard
  const midi = flags.midi ?? DEFAULT_FLAGS.midi
  const osc = flags.osc ?? DEFAULT_FLAGS.osc
  // Optional pass-throughs for sources (gate + bridge URL). Pulled out so a stable identity isn't
  // required from the caller for the common case.
  const getEnabled = typeof flags.getEnabled === 'function' ? flags.getEnabled : undefined
  const oscUrl = typeof flags.oscUrl === 'string' ? flags.oscUrl : undefined

  useEffect(() => {
    if (!store || typeof store.setParam !== 'function') return undefined

    const sources = []
    if (keyboard) sources.push(createKeyboardSource(store, { getEnabled }))
    if (midi) sources.push(createMidiSource(store, { getEnabled }))
    if (osc) sources.push(createOscSource(store, { getEnabled, url: oscUrl }))

    return () => {
      for (const s of sources) {
        if (s && typeof s.dispose === 'function') {
          try { s.dispose() } catch { /* a bad disposer must not block the others */ }
        }
      }
    }
  }, [store, keyboard, midi, osc, getEnabled, oscUrl])

  return {}
}
