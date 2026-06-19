// three.js bootstrap — same instrument as src/main.js, rendered through three.js
// (ThreePipeline) instead of raw WebGL2. All non-GL logic (audio, loop,
// dynamic-resolution, looks, controls) is reused unchanged; only the renderer
// swapped. This is the framework version of the app, served at three.html.

import { ThreePipeline } from './pipeline.js';
import { AudioInput } from '../audio/input.js';
import { Analyser } from '../audio/analyser.js';
import { BeatTempo } from '../audio/bpm.js';
import { ParamStore } from '../params/store.js';
import { loadLooks, findLook } from '../looks/registry.js';
import { Controls } from '../ui/controls.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
const canvas = document.getElementById('glcanvas');
const store = new ParamStore();
const beat = new BeatTempo();

let pipeline, controls;
let audioInput = null;
let analyser = null;
let micActive = false;

const features = { bass: 0, mid: 0, treble: 0, level: 0, beat: 0 };

const health = { frames: 0, glOk: false, error: null, pause: false };
if (typeof window !== 'undefined') window.__primordial = health;

const MAX_DPR = 1.5;

let motionScale = 1;
function updateMotionPref() {
  motionScale =
    typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
      ? 0.15
      : 1;
}

const dyn = {
  renderScale: store.perf.renderScale,
  steps: store.perf.steps,
  maxScale: store.perf.renderScale,
  maxSteps: store.perf.steps,
  msAvg: 16.7,
  cooldown: 0,
};

let running = true;
let lastT = performance.now();
let simTime = 0;
let frameCount = 0;
let fpsAccumT = 0;
let fpsAccumFrames = 0;
let dispFps = 60;
let dispMs = 16.7;

function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
  const w = Math.floor(window.innerWidth * dpr);
  const h = Math.floor(window.innerHeight * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
}

function resolveParams() {
  const p = store.params;
  return {
    slime: {
      colA: p.colA, colB: p.colB, blobCount: p.blobCount, sminK: p.sminK,
      warpAmt: p.warpAmt, glow: p.glow, sss: p.sss,
    },
    post: {
      grain: p.grain, scanline: p.scanline, chroma: p.chroma,
      vignette: p.vignette, bloom: p.bloom,
    },
  };
}

function updateDynamicRes(ms) {
  dyn.msAvg = dyn.msAvg * 0.9 + ms * 0.1;
  if (dyn.cooldown > 0) { dyn.cooldown--; return; }
  const SLOW = 22;
  const FAST = 13;
  if (dyn.msAvg > SLOW) {
    if (dyn.steps > 28) dyn.steps -= 4;
    else if (dyn.renderScale > 0.4) dyn.renderScale = Math.max(0.4, dyn.renderScale - 0.05);
    else return;
    dyn.cooldown = 30;
    syncPerfToUI();
  } else if (dyn.msAvg < FAST) {
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

function frame(now) {
  if (health.pause) return;
  requestAnimationFrame(frame);
  if (!running) { lastT = now; return; }

  const dt = Math.min(0.1, (now - lastT) / 1000);
  lastT = now;
  simTime += dt * motionScale;
  const t = simTime;

  if (micActive && analyser) {
    analyser.update();
    const f = analyser.features;
    features.bass = f.bass;
    features.mid = f.mid;
    features.treble = f.treble;
    features.level = f.level;
    beat.update(analyser.rawBassEnergy(), dt);
  } else {
    features.bass = 0.18 + 0.12 * Math.sin(t * 0.7);
    features.mid = 0.14 + 0.1 * Math.sin(t * 1.1 + 1.0);
    features.treble = 0.1 + 0.08 * Math.sin(t * 1.7 + 2.0);
    features.level = 0.12 + 0.08 * Math.sin(t * 0.5);
    beat.update(features.bass, dt);
  }
  features.beat = beat.pulse;

  resize();
  const params = resolveParams();
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

async function startMic(deviceId) {
  try {
    if (!audioInput) audioInput = new AudioInput();
    const source = await audioInput.start(deviceId || null);
    if (!analyser) analyser = new Analyser(audioInput.ctx);
    analyser.connect(source);
    micActive = true;
    controls.setDevices(audioInput.devices, audioInput.deviceId);
    return true;
  } catch (err) {
    console.warn('Mic start failed:', err);
    return false;
  }
}

async function boot() {
  updateMotionPref();
  if (typeof matchMedia === 'function') {
    matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', updateMotionPref);
  }
  resize();
  pipeline = new ThreePipeline(canvas);
  health.glOk = true;

  controls = new Controls(store, {
    onParam: () => {},
    onPerf: (key, value) => {
      if (key === 'renderScale') { dyn.maxScale = value; dyn.renderScale = value; }
      if (key === 'steps') { dyn.maxSteps = value; dyn.steps = value; }
    },
    onLook: (id) => applyLook(id),
    onDevice: async (deviceId) => { if (micActive) await startMic(deviceId); },
    onTap: () => { beat.tap(); controls.setBpm(beat.bpm); },
    onReset: () => {
      store.reset();
      dyn.renderScale = dyn.maxScale = store.perf.renderScale;
      dyn.steps = dyn.maxSteps = store.perf.steps;
      controls.mount();
      finishControlsSetup();
    },
  });
  controls.mount();

  const looks = await loadLooks();
  window.__looks = looks;
  let activeId = store.lookId && findLook(looks, store.lookId) ? store.lookId : looks[0].id;
  controls.setLooks(looks, activeId);
  if (!store.lookId) applyLook(activeId, false);

  finishControlsSetup();

  const gate = document.getElementById('gate');
  const startBtn = document.getElementById('startBtn');
  const skipBtn = document.getElementById('skipBtn');
  startBtn.addEventListener('click', async () => {
    const ok = await startMic(null);
    gate.classList.add('hidden');
    if (!ok) console.info('Running without mic (permission denied or unavailable).');
  });
  skipBtn.addEventListener('click', () => { gate.classList.add('hidden'); });

  document.addEventListener('visibilitychange', () => {
    running = document.visibilityState === 'visible';
    if (running) lastT = performance.now();
  });

  window.addEventListener('resize', resize, { passive: true });

  requestAnimationFrame(frame);
}

function finishControlsSetup() {
  controls.setDevices(audioInput ? audioInput.devices : [], audioInput ? audioInput.deviceId : '');
  controls.setBpm(beat.bpm);
}

function applyLook(id) {
  const looks = window.__looks || [];
  const lk = findLook(looks, id);
  if (!lk) return;
  store.applyLook(id, lk.params);
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
