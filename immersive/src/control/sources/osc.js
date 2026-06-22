// OSC control source — a FLAGGED adapter (off by default; enabled via useControls flags.osc).
//
// ── BRIDGE REQUIREMENT ────────────────────────────────────────────────────────────────────────
// Browsers cannot speak raw OSC: OSC normally rides on UDP, and a web page has no UDP socket. So
// this source is a WebSocket CLIENT that connects to a small, USER-RUN OSC<->WebSocket bridge on
// the performer's own machine/LAN. The bridge listens for OSC over UDP from a controller app
// (TouchOSC, Lemur, a Max/Pd patch, etc.) and forwards each packet to this page over WS; nothing
// here works without that bridge running. Common bridges: `osc-js` in a Node relay, or
// `python-osc` + `websockets`. The bridge URL defaults to ws://127.0.0.1:8080 and is overridable.
//
// Wire format accepted (kept deliberately simple so any bridge can target it): the bridge sends
// each OSC message to the WS as JSON  { address: "/...", args: [number, ...] }. We map the OSC
// address to a TARGETS targetId and take the first numeric arg as the 0..1 value (clamped). This
// avoids shipping a binary OSC packet decoder in the client — the bridge already parsed OSC, so
// it can serialize to JSON trivially. (If a bridge can only send raw OSC binary, point it at a
// JSON-relaying bridge instead; we keep the client tiny per the mobile budget.)
//
// Like every source it maps onto TARGETS only (never the splats), and a missing/closed bridge is
// a silent no-op — the keyboard baseline keeps working.
//
// Default address scheme: "/<targetId>" e.g. "/sway", "/tint.R". A caller can pass an explicit
// { addrMap: { "/x": targetId } } to remap a controller's native addresses.

import { TARGETS, TARGETS_BY_ID } from '../targets.js'

const clamp01 = (v) => (v <= 0 ? 0 : v >= 1 ? 1 : v)

// Default address->targetId map: "/<targetId>" for every target.
function defaultAddrMap() {
  const map = {}
  for (const t of TARGETS) map[`/${t.targetId}`] = t.targetId
  return map
}

// createOscSource(store, { url, addrMap, getEnabled, reconnectMs }) -> { dispose() }
//   store       : createStore() instance.
//   url         : bridge WebSocket URL (default 'ws://127.0.0.1:8080').
//   addrMap     : optional { oscAddress -> targetId } override.
//   getEnabled  : optional ()->boolean gate.
//   reconnectMs : retry delay when the bridge is down/drops (default 3000; 0 disables retry).
export function createOscSource(store, opts = {}) {
  let disposed = false
  let ws = null
  let retryTimer = null

  if (!store || typeof store.setParam !== 'function') return { dispose() {} }
  if (typeof WebSocket === 'undefined') return { dispose() {} } // no WS env -> silent no-op

  const url = typeof opts.url === 'string' && opts.url ? opts.url : 'ws://127.0.0.1:8080'
  const getEnabled = typeof opts.getEnabled === 'function' ? opts.getEnabled : () => true
  const reconnectMs = Number.isFinite(opts.reconnectMs) ? opts.reconnectMs : 3000
  const addrMap = (opts.addrMap && typeof opts.addrMap === 'object') ? opts.addrMap : defaultAddrMap()

  function handlePacket(address, args) {
    if (!getEnabled()) return
    const targetId = addrMap[address]
    if (!targetId) return
    const target = TARGETS_BY_ID[targetId]
    if (!target) return
    // First numeric arg is the value (already 0..1 by convention; clamp defensively).
    const raw = Array.isArray(args) ? args.find((a) => typeof a === 'number' && Number.isFinite(a)) : undefined
    if (typeof raw !== 'number') return
    target.apply(clamp01(raw), store)
  }

  function onMessage(ev) {
    if (disposed) return
    let msg
    try {
      msg = JSON.parse(typeof ev.data === 'string' ? ev.data : '')
    } catch {
      return // non-JSON frame from a misconfigured bridge — ignore, don't throw.
    }
    if (!msg || typeof msg.address !== 'string') return
    handlePacket(msg.address, msg.args)
  }

  function scheduleReconnect() {
    if (disposed || reconnectMs <= 0 || retryTimer) return
    retryTimer = setTimeout(() => {
      retryTimer = null
      connect()
    }, reconnectMs)
  }

  function connect() {
    if (disposed) return
    try {
      ws = new WebSocket(url)
    } catch {
      // Construction can throw on a malformed URL — treat as bridge-absent.
      scheduleReconnect()
      return
    }
    ws.addEventListener('message', onMessage)
    ws.addEventListener('close', () => { if (!disposed) scheduleReconnect() })
    ws.addEventListener('error', () => {
      // Error precedes close in browsers; close handler does the retry. Swallow so it
      // doesn't surface as an unhandled error when the bridge isn't running.
    })
  }

  connect()

  return {
    dispose() {
      disposed = true
      if (retryTimer) { clearTimeout(retryTimer); retryTimer = null }
      if (ws) {
        try { ws.removeEventListener('message', onMessage) } catch { /* ignore */ }
        try { ws.close() } catch { /* already closed */ }
        ws = null
      }
    },
  }
}
