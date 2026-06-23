import { DEFAULTS, coerceParams, coerceValue } from './schema.js'

// Versioned params store for the control core. Mirrors the instrument's versioned-localStorage
// pattern (key 'primordialV1' → here 'immersiveV1'): persist the performer's tuned params and
// coerce-on-load so a schema bump or another tool writing the same origin can never corrupt or
// throw. Framework-agnostic (no React) so it is unit-testable and reusable by the library build.
//
// createStore() → { getParams(), getParam(key), setParam(key, value), subscribe(fn) → unsub }
//   getParams()  : a fresh shallow-cloned snapshot (colors are copied — callers can't mutate state).
//   getParam(key): the current value for one key.
//   setParam(k,v): coerce against the schema, store, persist (best-effort), notify subscribers.
//   subscribe(fn): fn(params) is called on every change; returns an unsubscribe function.

export const STORAGE_KEY = 'immersiveV1'

function safeStorage() {
  try {
    return typeof localStorage !== 'undefined' ? localStorage : null
  } catch {
    // Accessing localStorage can throw (privacy mode / sandboxed iframe).
    return null
  }
}

function load() {
  const store = safeStorage()
  if (!store) return { ...DEFAULTS }
  try {
    const raw = store.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    const parsed = JSON.parse(raw)
    // Tolerate either a bare params map or a { version, params } envelope.
    const params = parsed && typeof parsed === 'object' && parsed.params ? parsed.params : parsed
    return coerceParams(params) // never throws; fills/clamps every key
  } catch {
    return { ...DEFAULTS }
  }
}

function persist(params) {
  const store = safeStorage()
  if (!store) return
  try {
    store.setItem(STORAGE_KEY, JSON.stringify({ version: 1, params }))
  } catch {
    // Quota / disabled storage — in-memory state still works, just not persisted.
  }
}

function snapshot(params) {
  // Shallow clone, copying array (color) values so external mutation can't reach into state.
  const out = {}
  for (const k in params) {
    const v = params[k]
    out[k] = Array.isArray(v) ? v.slice() : v
  }
  return out
}

const PERSIST_DEBOUNCE_MS = 150 // trailing window — coalesce a MIDI/keyboard sweep into one write

export function createStore() {
  let params = load()
  const subs = new Set()

  // Debounce the localStorage write: a knob sweep fires many setParam() calls per second, and a
  // synchronous JSON.stringify + setItem on each one hitches frames. The in-memory update + notify
  // stay synchronous; only the disk write is coalesced to one trailing flush.
  let persistTimer = null
  function schedulePersist() {
    if (persistTimer !== null) return
    const flush = () => { persistTimer = null; persist(params) }
    if (typeof setTimeout === 'function') {
      persistTimer = setTimeout(flush, PERSIST_DEBOUNCE_MS)
    } else {
      flush() // no timer available (exotic env) — write through synchronously.
    }
  }

  function notify() {
    const snap = snapshot(params)
    for (const fn of subs) {
      try { fn(snap) } catch { /* a bad subscriber must not break the others */ }
    }
  }

  return {
    getParams() {
      return snapshot(params)
    },
    getParam(key) {
      const v = params[key]
      return Array.isArray(v) ? v.slice() : v
    },
    setParam(key, value) {
      const coerced = coerceValue(key, value)
      const prev = params[key]
      // No-op if unchanged (cheap equality incl. color arrays) — avoids churn + redundant notifies.
      if (sameValue(prev, coerced)) return
      params = { ...params, [key]: coerced }
      schedulePersist() // coalesced disk write; in-memory state + notify stay synchronous
      notify()
    },
    subscribe(fn) {
      if (typeof fn !== 'function') return () => {}
      subs.add(fn)
      return () => subs.delete(fn)
    },
  }
}

function sameValue(a, b) {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => x === b[i])
  }
  return a === b
}
