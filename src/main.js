// Bootstrap: start gate -> mic + AudioContext resume, the rAF render loop,
// wiring audio features -> GL uniforms -> UI, and the dynamic-resolution
// controller (measures frame time and auto-drops render-scale / steps when it
// climbs). The visuals run even before mic is granted (silent fallback drives
// the slime gently); tap Start to feed it live audio.

import { Renderer } from './gl/renderer.js';
import { Pipeline } from './gl/passes.js';
import { AudioInput } from './audio/input.js';
import { Analyser } from './audio/analyser.js';
import { BeatTempo } from './audio/bpm.js';
import { ParamStore } from './params/store.js';
import { loadLooks, findLook } from './looks/registry.js';
import { Controls } from './ui/controls.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const canvas = document.getElementById('glcanvas');
const store = new ParamStore();
const beat = new BeatTempo();

let renderer, pipeline, controls;
let audioInput = null;
let analyser = null;
let micActive = false;

// Smoothed beat pulse exposed to shaders.
const features = { bass: 0, mid: 0, treble: 0, level: 0, flux: 0, beat: 0 };

// Internal render-state handle (frame count / GL status). Never affects rendering.
const health = { frames: 0, glOk: false, error: null, pause: false };
if (typeof window !== 'undefined') window.__primordial = health;

// DPR cap for mobile.
const MAX_DPR = 1.5;

// Accessibility: honor prefers-reduced-motion by slowing the visual clock
// (the background is the app, so we dampen rather than freeze).
let motionScale = 1;
function updateMotionPref() {
  motionScale =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0.15
      : 1;
}

// Dynamic-resolution controller state.
const dyn = {
  renderScale: store.perf.renderScale,
  steps: store.perf.steps,
  // user-set ceilings (the dynamic controller never exceeds these)
  maxScale: store.perf.renderScale,
  maxSteps: store.perf.steps,
  msAvg: 16.7,
  cooldown: 0,
};

let running = true;          // paused when document hidden
let rafId = 0;               // current requestAnimationFrame handle (for teardown)
let lastT = performance.now();
let simTime = 0;             // visual clock (slowed under prefers-reduced-motion)
let frameCount = 0;
let fpsAccumT = 0;
let fpsAccumFrames = 0;
let dispFps = 60;
let dispMs = 16.7;

// ---------------------------------------------------------------------------
// Canvas sizing
// ---------------------------------------------------------------------------
function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

// ---------------------------------------------------------------------------
// Param resolution: split the flat param object into slime + post param sets.
// ---------------------------------------------------------------------------
function resolveParams() {
  const p = store.params;
  return {
    slime: {
      colA: p.colA,
      colB: p.colB,
      blobCount: p.blobCount,
      sminK: p.sminK,
      warpAmt: p.warpAmt,
      glow: p.glow,
      sss: p.sss,
    },
    post: {
      grain: p.grain,
      scanline: p.scanline,
      chroma: p.chroma,
      vignette: p.vignette,
      bloom: p.bloom,
    },
  };
}

// ---------------------------------------------------------------------------
// Dynamic resolution: nudge scale/steps toward a 16.7ms (60fps) target.
// ---------------------------------------------------------------------------
function updateDynamicRes(ms) {
  // EMA of frame time.
  dyn.msAvg = dyn.msAvg * 0.9 + ms * 0.1;
  if (dyn.cooldown > 0) { dyn.cooldown--; return; }

  const SLOW = 22;   // ~45fps -> back off
  const FAST = 13;   // ~77fps -> we have headroom

  if (dyn.msAvg > SLOW) {
    // Drop steps first (cheaper visual hit), then scale.
    if (dyn.steps > 28) dyn.steps -= 4;
    else if (dyn.renderScale > 0.5) dyn.renderScale = Math.max(0.5, dyn.renderScale - 0.05);
    else return;
    dyn.cooldown = 30;
    syncPerfToUI();
  } else if (dyn.msAvg < FAST) {
    // Recover toward the user ceilings.
    if (dyn.renderScale < dyn.maxScale) dyn.renderScale = Math.min(dyn.maxScale, dyn.renderScale + 0.05);
    else if (dyn.steps < dyn.maxSteps) dyn.steps += 4;
    else return;
    dyn.cooldown = 45;
    syncPerfToUI();
  }
}

function syncPerfToUI() {
  if (!controls) return;
  controls.reflectPerf('renderScale', round2(dyn.renderScale));
  controls.reflectPerf('steps', dyn.steps);
}

function round2(x) { return Math.round(x * 100) / 100; }

// ---------------------------------------------------------------------------
// Render loop
// ---------------------------------------------------------------------------
function frame(now) {
  if (health.pause) return;          // hard freeze (headless screenshots / teardown)
  rafId = requestAnimationFrame(frame);
  if (!running) { lastT = now; return; }

  // Guard dt: a paused/backgrounded tab or a bad clock can yield NaN/negative/
  // huge deltas; clamp to a sane frame step so the sim clock never jumps.
  let dt = (now - lastT) / 1000;
  if (!Number.isFinite(dt) || dt < 0) dt = 0;
  dt = Math.min(0.1, dt);
  lastT = now;
  simTime += dt * motionScale;
  const t = simTime;

  // --- Audio update ---
  if (micActive && analyser) {
    analyser.update();
    const f = analyser.features;
    features.bass = f.bass;
    features.mid = f.mid;
    features.treble = f.treble;
    features.level = f.level;
    features.flux = f.flux;
    beat.update(analyser.rawBassEnergy(), dt);
  } else {
    // Silent fallback: gentle synthetic motion so there's life pre-mic.
    features.bass = 0.18 + 0.12 * Math.sin(t * 0.7);
    features.mid = 0.14 + 0.1 * Math.sin(t * 1.1 + 1.0);
    features.treble = 0.1 + 0.08 * Math.sin(t * 1.7 + 2.0);
    features.level = 0.12 + 0.08 * Math.sin(t * 0.5);
    features.flux = 0.06 + 0.06 * Math.max(0, Math.sin(t * 2.3));
    beat.update(features.bass, dt);
  }
  features.beat = beat.pulse;

  // --- Render ---
  // Skip drawing while the GL context is lost (calls would no-op); the browser
  // fires webglcontextrestored to recreate resources and clear the flag.
  if (renderer.contextLost) { lastT = now; return; }
  resize();
  const params = resolveParams();
  try {
    pipeline.render({
      time: t,
      canvasW: canvas.width,
      canvasH: canvas.height,
      renderScale: dyn.renderScale,
      steps: dyn.steps,
      features,
      slimeParams: params.slime,
      postParams: params.post,
      fft: micActive && analyser ? analyser.freq : null,
      wave: micActive && analyser ? analyser.wave : null,
    });
  } catch (err) {
    // An unrecoverable GL error (e.g. an incomplete render target on this
    // device) would otherwise throw every frame. Stop the loop and surface it.
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    health.error = String(err && err.message ? err.message : err);
    const gate = document.getElementById('gate');
    if (gate) {
      gate.classList.remove('hidden');
      gate.innerHTML = '<h1>Rendering stopped</h1><p>' + health.error + '</p>';
    }
    return;
  }

  // --- Perf accounting ---
  const ms = performance.now() - now;
  updateDynamicRes(ms);

  fpsAccumT += dt;
  fpsAccumFrames++;
  if (fpsAccumT >= 0.5) {
    dispFps = fpsAccumFrames / fpsAccumT;
    dispMs = (fpsAccumT * 1000) / fpsAccumFrames;
    fpsAccumT = 0;
    fpsAccumFrames = 0;
    if (controls) {
      const rw = Math.floor(canvas.width * dyn.renderScale);
      const rh = Math.floor(canvas.height * dyn.renderScale);
      controls.setReadout(dispFps, dispMs, rw, rh, dyn.renderScale);
      controls.setBpm(beat.bpm);
    }
  }
  frameCount++;
  health.frames = frameCount;
}

// ---------------------------------------------------------------------------
// Mic start (from the Start gate gesture)
// ---------------------------------------------------------------------------
function micErrorMessage(err) {
  const name = err && err.name;
  if (name === 'NotAllowedError' || name === 'SecurityError') return 'Microphone permission denied.';
  if (name === 'NotFoundError' || name === 'OverconstrainedError') return 'No audio input device found.';
  if (name === 'NotReadableError') return 'The input device is in use by another app.';
  return 'Could not start the microphone.';
}

// Returns { ok, message }. On failure the caller can show `message` and fall
// back to the visuals-only path.
async function startMic(deviceId) {
  try {
    if (!audioInput) {
      audioInput = new AudioInput();
      audioInput.onDevicesChanged = (devices, id) => controls.setDevices(devices, id);
    }
    const source = await audioInput.start(deviceId || null);
    // iOS/Safari can leave the context suspended even after resume() if not
    // driven by a trusted gesture; surface it rather than running silently.
    if (audioInput.ctx && audioInput.ctx.state === 'suspended') {
      return { ok: false, message: 'Audio is blocked by the browser. Tap again to allow sound.' };
    }
    if (!analyser) analyser = new Analyser(audioInput.ctx);
    analyser.connect(source);
    micActive = true;
    controls.setDevices(audioInput.devices, audioInput.deviceId);
    return { ok: true, message: '' };
  } catch (err) {
    console.warn('Mic start failed:', err);
    return { ok: false, message: micErrorMessage(err) };
  }
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------
async function boot() {
  updateMotionPref();
  if (typeof matchMedia === 'function') {
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateMotionPref);
  }
  resize();
  renderer = new Renderer(canvas);
  pipeline = new Pipeline(renderer);
  health.glOk = true;

  controls = new Controls(store, {
    onParam: () => { /* store already updated; loop reads live */ },
    onPerf: (key, value) => {
      if (key === 'renderScale') { dyn.maxScale = value; dyn.renderScale = value; }
      if (key === 'steps') { dyn.maxSteps = value; dyn.steps = value; }
    },
    onLook: (id) => applyLook(id),
    onDevice: async (deviceId) => {
      if (micActive) {
        const res = await startMic(deviceId);
        if (!res.ok) console.warn('Device switch failed:', res.message);
      }
    },
    onTap: () => {
      beat.tap();
      controls.setBpm(beat.bpm);
    },
    onReset: () => {
      store.reset();
      dyn.renderScale = dyn.maxScale = store.perf.renderScale;
      dyn.steps = dyn.maxSteps = store.perf.steps;
      controls.mount();
      finishControlsSetup();
    },
  });
  controls.mount();

  // Load looks (data), populate the switcher, apply the persisted/default look.
  const looks = await loadLooks();
  window.__looks = looks;
  let activeId = store.lookId && findLook(looks, store.lookId) ? store.lookId : looks[0].id;
  controls.setLooks(looks, activeId);
  // Only apply the look's params if we don't already have user-tuned values
  // for this look persisted. On first run, lookId is null -> apply default look.
  if (!store.lookId) applyLook(activeId, /*silent*/ false);

  finishControlsSetup();

  // Start gate.
  const gate = document.getElementById('gate');
  const startBtn = document.getElementById('startBtn');
  const skipBtn = document.getElementById('skipBtn');

  // Inline, screen-reader-announced error on the gate (mic failures stay
  // visible here instead of vanishing into the console).
  function showGateError(msg) {
    let p = document.getElementById('gateError');
    if (!p) {
      p = document.createElement('p');
      p.id = 'gateError';
      p.setAttribute('role', 'alert');
      p.className = 'gate-error';
      skipBtn.parentNode.insertBefore(p, skipBtn);
    }
    p.textContent = msg + ' You can continue with Visuals Only.';
  }

  startBtn.addEventListener('click', async () => {
    startBtn.disabled = true;
    const res = await startMic(null);
    startBtn.disabled = false;
    if (res.ok) {
      gate.classList.add('hidden');
    } else {
      // Keep the gate up so the operator sees why and can pick Visuals Only.
      showGateError(res.message);
    }
  });
  skipBtn.addEventListener('click', () => {
    gate.classList.add('hidden');
  });

  // Pause on tab hidden (mobile battery + correctness).
  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
    if (running) lastT = performance.now();
  });

  window.addEventListener('resize', resize, { passive: true });

  // Teardown on navigation away: stop the loop and release the mic so we don't
  // leave the capture indicator on or burn battery on a backgrounded page.
  window.addEventListener('pagehide', () => {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = 0;
    if (audioInput) audioInput.stop();
    micActive = false;
  });

  rafId = requestAnimationFrame(frame);
}

function finishControlsSetup() {
  // Devices may already be known if mic started; otherwise show Default.
  controls.setDevices(audioInput ? audioInput.devices : [], audioInput ? audioInput.deviceId : '');
  controls.setBpm(beat.bpm);
}

function applyLook(id) {
  const looks = window.__looks || [];
  const lk = findLook(looks, id);
  if (!lk) return;
  store.applyLook(id, lk.params);
  // Reflect new slider values into the UI.
  for (const key in store.params) controls.reflectParam(key, store.params[key]);
}

boot().catch((err) => {
  console.error('Boot failed:', err);
  health.error = String(err && err.message ? err.message : err);
  const gate = document.getElementById('gate');
  if (gate) {
    gate.innerHTML = '<h1>WebGL2 unavailable</h1><p>' +
      String(err && err.message ? err.message : err) + '</p>';
  }
});
