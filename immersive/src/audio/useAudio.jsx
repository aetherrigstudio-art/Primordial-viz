import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Analyser } from './analyser.js';
import { AudioInput } from './input.js';
import { makeAudioTexture, writeAudioTexture } from './audioTexture.js';
import { BeatClock } from './bpm.js';

// Audio subsystem provider + hook for the immersive app.
//
// Contract (honored exactly so the separately-authored reactive-splat + mode modules compose):
//   useAudio() -> { start, status, featuresRef, audioTexture, pickDevice, devices }
//     start():  async, idempotent (2nd call is a no-op), creates+resumes the AudioContext and
//               getUserMedia INSIDE the caller's user gesture; returns { ok, message }. On
//               deny/fail sets status='visuals-only'.
//     status:   'idle' | 'live' | 'visuals-only'
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

const AudioContextReact = createContext(null);

export function AudioProvider({ children }) {
  // Hot, per-frame state — refs only (never triggers React renders).
  const inputRef = useRef(null);     // AudioInput
  const analyserRef = useRef(null);  // Analyser
  const featuresRef = useRef({ ...ZERO_FEATURES });
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
    try {
      const input = new AudioInput();
      input.onDevicesChanged = (devs) => setDevices(devs);
      const source = await input.start(null); // resumes ctx + getUserMedia in-gesture
      const analyser = new Analyser(input.ctx);
      analyser.connect(source);

      inputRef.current = input;
      analyserRef.current = analyser;
      beatClockRef.current = new BeatClock();
      lastUpdateMsRef.current = (typeof performance !== 'undefined' ? performance.now() : Date.now());

      // Wire the single per-frame update now that the graph is live.
      updateRef.current = () => {
        const a = analyserRef.current;
        if (!a) return;
        a.update();                                   // refresh bands + raw arrays
        featuresRef.current = a.features;             // EMA-smoothed scalars
        writeAudioTexture(audioTexture, audioTex.data, a.freq, a.wave); // rows 0/1 + needsUpdate

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

      setDevices(input.devices);
      setStatus('live');
      return { ok: true, message: 'live' };
    } catch (err) {
      // Deny / no device / in-use / suspended -> visuals-only. Keep zeros in featuresRef and a
      // zeroed (already-zero) texture so the visuals stay deterministic.
      setStatus('visuals-only');
      const message = (err && err.name === 'NotAllowedError')
        ? 'Microphone permission denied — running visuals only.'
        : (err && err.message) ? err.message
        : 'Audio unavailable — running visuals only.';
      return { ok: false, message };
    } finally {
      startingRef.current = false;
    }
  }, [status, audioTexture, audioTex.data, featuresRef]);

  // ---- pickDevice(): switch input, keeping the AudioContext/graph alive. ----
  const pickDevice = useMemo(() => async (deviceId) => {
    const input = inputRef.current;
    const analyser = analyserRef.current;
    if (!input || !analyser) return { ok: false, message: 'audio not started' };
    try {
      const source = await input.setDevice(deviceId); // stops old stream, opens the new one
      analyser.connect(source);
      setDevices(input.devices);
      return { ok: true, message: 'switched' };
    } catch (err) {
      return { ok: false, message: (err && err.message) || 'could not switch device' };
    }
  }, []);

  // Cleanup on unmount: stop capture + free the texture.
  useEffect(() => {
    return () => {
      inputRef.current?.stop();
      try { inputRef.current?.ctx?.close(); } catch (_) { /* ignore */ }
      audioTexture.dispose?.();
      inputRef.current = null;
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
    // Internal seam for the in-Canvas pump: ONE per-frame update, hidden-tab-skippable.
    updateRef,
  }), [start, status, audioTexture, pickDevice, devices]);

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
