import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Analyser } from './analyser.js';
import { AudioInput } from './input.js';
import { makeAudioTexture, writeAudioTexture } from './audioTexture.js';
import { BeatClock } from './bpm.js';

// Audio subsystem provider + hook for the immersive app.
//
// Contract (honored exactly so the separately-authored reactive-splat + mode modules compose):
//   useAudio() -> { start, status, featuresRef, audioTexture, pickDevice, devices,
//                   getContext, connectAmbient, disconnectAmbient, levelRef }
//     start():  async, idempotent (2nd call is a no-op), creates+resumes the AudioContext and
//               getUserMedia INSIDE the caller's user gesture; returns { ok, message }. On
//               deny/fail sets status='visuals-only' BUT still leaves an AudioContext + Analyser +
//               per-frame update() in place, so the ambient playlist can feed the SAME analyser the
//               bands read.
//     status:   'idle' | 'live' | 'visuals-only'
//
//   Ambient-playlist seam (used by useAmbientPlaylist):
//     getContext():  returns the live AudioContext (created lazily even on the deny path), or null
//                    if start() hasn't run. Resumed in start() inside the user gesture.
//     connectAmbient(node):    connect a source node into the EXISTING Analyser (the same node the
//                    bands + 512x2 texture read), so a synthesized ambient bed drives the visuals.
//     disconnectAmbient(node): detach it again.
//     levelRef:      ref; .current = the live (mic) RMS level — the playlist watches it to decide
//                    "no live music". Equals featuresRef.current.level while live; 0 otherwise.
//     featuresRef: ref; .current = { bass, mid, treble, level, flux } (EMA-smoothed). Zeros when
//                  not live.
//     beatRef: ref; .current = { bpm, beat, bar, beatPhase, downbeat } — musical time from the
//              BeatClock (bpm null until enough beats; beat/bar running counts; downbeat true the
//              frame a bar starts). Updated in the SAME per-frame update() as the bands. Holds at
//              { bpm:null, beat:0, bar:0, beatPhase:0, downbeat:false } when not live.
//     audioTexture: a THREE.DataTexture (512x2 R8, NEAREST, .needsUpdate each frame).
//     pickDevice(deviceId): switch input. devices: [{deviceId,label}].
//
// The single per-frame update() lives on a ref (updateRef.current). A pump component inside the
// Canvas calls it exactly once per frame and skips it while the tab is hidden (status stays live
// but the texture/bands simply hold their last values — getUserMedia keeps running). Everything
// hot lives in refs: React state is used ONLY for the surface that the UI re-renders on (status,
// devices), never per-frame.

const ZERO_FEATURES = Object.freeze({ bass: 0, mid: 0, treble: 0, level: 0, flux: 0 });
const ZERO_BEAT = Object.freeze({ bpm: null, beat: 0, bar: 0, beatPhase: 0, downbeat: false });

// Mic-ONLY RMS (separate from the combined bands analyser, which also carries the ambient bed).
// The playlist's silence detector reads this so the ambient can't mask whether real mic audio is
// present. Reuses one module buffer (no per-frame alloc).
const MIC_RMS_BUF = new Uint8Array(256);
function micRms(node) {
  if (!node) return 0;
  node.getByteTimeDomainData(MIC_RMS_BUF);
  let sum = 0;
  for (let i = 0; i < MIC_RMS_BUF.length; i++) { const v = (MIC_RMS_BUF[i] - 128) / 128; sum += v * v; }
  return Math.sqrt(sum / MIC_RMS_BUF.length);
}

const AudioContextReact = createContext(null);

export function AudioProvider({ children }) {
  // Hot, per-frame state — refs only (never triggers React renders).
  const inputRef = useRef(null);     // AudioInput (null on the visuals-only/deny path)
  const ctxRef = useRef(null);       // AudioContext (exists even on the deny path, for the ambient)
  const analyserRef = useRef(null);  // Analyser (always created after start(), mic or not)
  const featuresRef = useRef({ ...ZERO_FEATURES });
  const levelRef = useRef(0);                 // live MIC level only (ambient is NOT counted here)
  const liveRef = useRef(false);              // is a real mic source connected to the analyser?
  const micLevelRef = useRef(null);           // raw AnalyserNode on the MIC source only (silence detector)
  const beatRef = useRef({ ...ZERO_BEAT });   // musical time, updated in the per-frame update()
  const beatClockRef = useRef(null);          // BeatClock instance (created when audio goes live)
  const lastUpdateMsRef = useRef(0);          // for the clock's own dt (the pump passes no dt)

  // The 512x2 R8 DataTexture is created once and is a stable reference for the lifetime of the
  // provider (the reactive-splat module binds it as a uniform).
  const audioTex = useMemo(() => makeAudioTexture(), []);
  const audioTexture = audioTex.texture;

  // UI-facing state (re-renders the control surface; NOT touched per frame).
  const [status, setStatus] = useState('idle');
  const [devices, setDevices] = useState([]);

  // start() must be idempotent: guard with a ref so a 2nd call (or a double-tap) is a no-op while
  // the first is still resolving.
  const startingRef = useRef(false);

  // The single per-frame update. Held on a ref so the pump can call it without re-subscribing and
  // so it can be swapped in atomically once audio goes live.
  const updateRef = useRef(() => {});

  // Wire the single per-frame update. Runs whether or not a mic source is connected: the analyser
  // reads whatever is fed into it (a real mic, OR the ambient playlist via connectAmbient), so the
  // bands + 512x2 texture react to the ambient on the visuals-only path. `level` is split: the
  // analyser's RMS always drives featuresRef.level (so visuals react to ambient), but levelRef
  // (which the playlist watches to detect "no live music") only tracks the level while a real mic
  // source is connected — otherwise the ambient would mask its own silence detector.
  const wireUpdate = useMemo(() => () => {
    updateRef.current = () => {
      const a = analyserRef.current;
      if (!a) return;
      a.update();                                   // refresh bands + raw arrays
      featuresRef.current = a.features;             // EMA-smoothed scalars (mic OR ambient)
      writeAudioTexture(audioTexture, audioTex.data, a.freq, a.wave); // rows 0/1 + needsUpdate
      levelRef.current = liveRef.current ? micRms(micLevelRef.current) : 0;

      // Musical time, in the SAME update so beat tracking shares the bands' cadence. The pump
      // passes no dt, so derive it from a wall-clock delta (guarded against tab-switch spikes by
      // the clock itself). Feed the RAW (unsmoothed) bass energy the energy-spike detector wants.
      const clock = beatClockRef.current;
      if (clock) {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        const dt = (now - lastUpdateMsRef.current) / 1000;
        lastUpdateMsRef.current = now;
        clock.update(a.rawBassEnergy(), dt);
        beatRef.current = clock.musical;
      }
    };
  }, [audioTexture, audioTex.data]);

  // ---- start(): create+resume AudioContext and capture, inside the user gesture. ----
  const start = useMemo(() => async () => {
    // Idempotent: already live, or a start is in flight -> no-op success.
    if (status === 'live' || analyserRef.current) {
      return { ok: true, message: 'already running' };
    }
    if (startingRef.current) {
      return { ok: true, message: 'starting' };
    }
    startingRef.current = true;
    let input;
    try {
      input = new AudioInput();
      input.onDevicesChanged = (devs) => setDevices(devs);
      const source = await input.start(null); // resumes ctx + getUserMedia in-gesture
      const analyser = new Analyser(input.ctx);
      analyser.connect(source);
      // A separate mic-ONLY analyser feeds the silence detector (the combined analyser also carries
      // the ambient bed, so on its own it can't tell mic-presence from the ambient itself).
      const micLevel = input.ctx.createAnalyser();
      micLevel.fftSize = 256;
      source.connect(micLevel);
      micLevelRef.current = micLevel;

      inputRef.current = input;
      ctxRef.current = input.ctx;
      analyserRef.current = analyser;
      liveRef.current = true;
      beatClockRef.current = new BeatClock();
      lastUpdateMsRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());

      // Wire the single per-frame update now that the graph is live.
      wireUpdate();

      setDevices(input.devices);
      setStatus('live');
      return { ok: true, message: 'live' };
    } catch (err) {
      // Deny / no device / in-use / suspended -> visuals-only. CRUCIAL CHANGE: we still stand up an
      // AudioContext + Analyser + per-frame update() here, so the ambient playlist has a real graph
      // to feed into the SAME analyser the bands read. No mic source is connected (liveRef stays
      // false) — featuresRef holds zeros until the ambient is connected via connectAmbient().
      // Reuse the input's AudioContext if it got created before the failure; else make a fresh one
      // (so a deny that never built a ctx still yields a graph). Tear down only the mic capture.
      try {
        input?.stop?.();           // stops any media stream + removes the devicechange listener
        if (input) input.onDevicesChanged = null;
      } catch {}
      try {
        let ctx = input?.ctx || null;
        if (!ctx) {
          const AC = window.AudioContext || window.webkitAudioContext;
          ctx = new AC({ latencyHint: 'interactive' });
        }
        // Resume inside the (still-active) user gesture so the ambient can play (autoplay policy).
        if (ctx.state === 'suspended') { try { await ctx.resume(); } catch (_) {} }
        ctxRef.current = ctx;
        analyserRef.current = new Analyser(ctx);
        liveRef.current = false;
        beatClockRef.current = new BeatClock();
        lastUpdateMsRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        wireUpdate();
      } catch (_) { /* if even this fails, the ambient simply has no graph (visuals stay zeroed) */ }

      setStatus('visuals-only');
      const message = (err && err.name === 'NotAllowedError')
        ? 'Microphone permission denied — running visuals only.'
        : (err && err.message) ? err.message
        : 'Audio unavailable — running visuals only.';
      return { ok: false, message };
    } finally {
      startingRef.current = false;
    }
  }, [status, wireUpdate]);

  // ---- pickDevice(): switch input, keeping the AudioContext/graph alive. ----
  const pickDevice = useMemo(() => async (deviceId) => {
    const input = inputRef.current;
    const analyser = analyserRef.current;
    if (!input || !analyser) return { ok: false, message: 'audio not started' };
    try {
      const source = await input.setDevice(deviceId); // stops old stream, opens the new one
      analyser.connect(source);
      if (micLevelRef.current) { try { source.connect(micLevelRef.current); } catch (_) { /* ignore */ } }
      analyser.reset(); // zero prevFreq + band/flux EMAs so the switch doesn't fire a phantom onset
      setDevices(input.devices);
      return { ok: true, message: 'switched' };
    } catch (err) {
      return { ok: false, message: (err && err.message) || 'could not switch device' };
    }
  }, []);

  // ---- ambient-playlist seam: hand the playlist the live context + the existing analyser. ----
  const getContext = useMemo(() => () => ctxRef.current, []);

  // Connect/disconnect a source node into the SAME Analyser the bands + texture read, so the
  // synthesized ambient bed drives the visuals (do NOT create a second analyser). No-op if the
  // graph hasn't been created yet (start() not called / both paths failed).
  const connectAmbient = useMemo(() => (node) => {
    const a = analyserRef.current;
    if (a && node) { try { node.connect(a.node); } catch (_) { /* ignore */ } }
  }, []);
  const disconnectAmbient = useMemo(() => (node) => {
    const a = analyserRef.current;
    if (a && node) { try { node.disconnect(a.node); } catch (_) { /* already detached */ } }
  }, []);

  // Cleanup on unmount: stop capture + close the context (mic path uses input.ctx; the visuals-only
  // path's standalone ctx lives on ctxRef) + free the texture.
  useEffect(() => {
    return () => {
      inputRef.current?.stop();
      try { ctxRef.current?.close(); } catch (_) { /* ignore */ }
      audioTexture.dispose?.();
      inputRef.current = null;
      ctxRef.current = null;
      analyserRef.current = null;
      beatClockRef.current = null;
    };
  }, [audioTexture]);

  const value = useMemo(() => ({
    start,
    status,
    featuresRef,
    beatRef,
    audioTexture,
    pickDevice,
    devices,
    // Ambient-playlist seam (see header): live context + route a node into the existing analyser +
    // the live mic level the playlist watches to detect "no live music".
    getContext,
    connectAmbient,
    disconnectAmbient,
    levelRef,
    // Internal seam for the in-Canvas pump: ONE per-frame update, hidden-tab-skippable.
    updateRef,
  }), [start, status, audioTexture, pickDevice, devices, getContext, connectAmbient, disconnectAmbient]);

  return (
    <AudioContextReact.Provider value={value}>
      {children}
    </AudioContextReact.Provider>
  );
}

export function useAudio() {
  const ctx = useContext(AudioContextReact);
  if (!ctx) {
    throw new Error('useAudio() must be used inside <AudioProvider>');
  }
  return ctx;
}
