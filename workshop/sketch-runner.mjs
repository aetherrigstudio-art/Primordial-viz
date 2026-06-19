// Boots the workshop sandbox: loads one sketch (?sketch=<name>) using the real
// renderer plumbing, drives it with synthetic audio, and exposes the
// window.__primordial beacon (glOk / frames / pause / error) the clip recorder
// waits on. Dev-only tooling; never deployed.

import { Renderer } from '../src/gl/renderer.js';
import { POST_FRAG } from '../src/shaders/post.frag.js';
import { buildAudioTextureData } from '../src/gl/uniforms.js';
import { synthAudio } from './synth-audio.mjs';

const SAFE = /^[a-z0-9_-]+$/i;
const qs = new URLSearchParams(location.search);
const name = qs.get('sketch') || '_demo';

const canvas = document.getElementById('glcanvas');
const health = { frames: 0, glOk: false, error: null, pause: false };
window.__primordial = health;

function fail(msg) {
  health.error = msg;
  document.body.insertAdjacentHTML(
    'beforeend',
    '<pre style="color:#f55;position:fixed;top:0;left:0;margin:0;padding:8px;' +
      'font:12px monospace;white-space:pre-wrap">' + msg + '</pre>',
  );
}

async function boot() {
  if (!SAFE.test(name)) return fail('bad sketch name: ' + name);

  let frag;
  try {
    ({ SKETCH_FRAG: frag } = await import(`./sketches/${name}/${name}.frag.js`));
  } catch (e) { return fail('cannot load sketch shader: ' + e.message); }
  if (typeof frag !== 'string') return fail('sketch must export SKETCH_FRAG string');

  let sketch = { params: {} };
  try { sketch = await (await fetch(`./sketches/${name}/${name}.json`)).json(); }
  catch { /* params optional */ }
  const P = sketch.params || {};
  const bpm = Number(qs.get('bpm')) || sketch.bpm || 120;

  let renderer;
  try {
    renderer = new Renderer(canvas, { slimeFrag: frag, postFrag: POST_FRAG });
  } catch (e) { return fail('shader compile error:\n' + e.message); }
  health.glOk = true;

  const scratch = new Uint8Array(1024);
  const MAX_DPR = 1.5;
  const renderScale = 0.7;
  const steps = 64;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, MAX_DPR);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Generic uniform setter: standard audio + time/res + every json param by
  // name. uName = 'u' + Capitalized(key). Setting an undeclared uniform is a
  // safe no-op (getUniformLocation returns null).
  function setUniforms(gl, U, a, resW, resH, t) {
    gl.uniform2f(U.loc('uResolution'), resW, resH);
    gl.uniform1f(U.loc('uTime'), t);
    gl.uniform1f(U.loc('uBass'), a.bass);
    gl.uniform1f(U.loc('uMid'), a.mid);
    gl.uniform1f(U.loc('uTreble'), a.treble);
    gl.uniform1f(U.loc('uLevel'), a.level);
    gl.uniform1f(U.loc('uFlux'), a.flux);
    gl.uniform1f(U.loc('uBeat'), a.beat);
    gl.uniform1i(U.loc('uSteps'), steps);
    for (const k in P) {
      const v = P[k];
      const uname = 'u' + k.charAt(0).toUpperCase() + k.slice(1);
      if (Array.isArray(v) && v.length === 3) gl.uniform3f(U.loc(uname), v[0], v[1], v[2]);
      else if (typeof v === 'number') gl.uniform1f(U.loc(uname), v);
    }
  }

  const start = performance.now();
  function frame() {
    if (health.pause) return;
    requestAnimationFrame(frame);
    if (renderer.contextLost) return;
    const t = (performance.now() - start) / 1000;
    const a = synthAudio(t, { bpm });
    buildAudioTextureData(a.fft, a.wave, scratch);
    renderer.uploadAudioTexture(scratch);
    const rw = Math.max(1, Math.floor(canvas.width * renderScale));
    const rh = Math.max(1, Math.floor(canvas.height * renderScale));
    try {
      renderer.resizeFbo(rw, rh);
      renderer.renderSlime((gl, U) => setUniforms(gl, U, a, rw, rh, t));
      renderer.renderPost((gl, U) => setUniforms(gl, U, a, canvas.width, canvas.height, t),
        canvas.width, canvas.height);
    } catch (e) { return fail('render error: ' + e.message); }
    health.frames++;
  }
  requestAnimationFrame(frame);
}

boot();
