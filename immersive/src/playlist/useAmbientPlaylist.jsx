import { useEffect, useMemo, useRef, useState } from 'react';
import { createAmbientGenerator } from './ambientGenerator.js';
import { PLAYLIST } from './playlist.js';

// Ambient "autonomous vibe" playlist hook for the immersive app.
//
// Given the audio provider (useAudio()), it:
//   (a) DETECTS "no live music" — status==='visuals-only' (mic denied), OR the live mic level stays
//       below a small threshold for ~SILENCE_MS (~6s);
//   (b) FADES IN the current entry — the procedural generator (ambientGenerator.js) or, for a
//       kind:'file' entry, an <audio> element via MediaElementAudioSourceNode — routed INTO the
//       EXISTING AnalyserNode (audio.connectAmbient) so featuresRef + the 512x2 texture react to it;
//   (c) CROSSFADES / auto-advances between entries on a timer;
//   (d) FADES OUT when real audio returns (mic level climbs back above threshold);
//   (e) exposes { playing, current, play, pause, skip, toggleMute, muted } for a control layer.
//
// Everything hot lives in refs (no per-frame React state). Fades are Web Audio GainNode ramps. The
// hook must activate only AFTER the start-gate tap (the autoplay gesture) — pass `enabled`.

const SILENCE_MS = 6000;     // how long the mic must stay quiet before the ambient fades in
const LEVEL_THRESHOLD = 0.02; // RMS below this counts as "no live music"
const FADE_IN_S = 4.0;
const FADE_OUT_S = 2.5;
const CROSSFADE_S = 6.0;
const ENTRY_MS = 90_000;     // auto-advance ~every 90s

export function useAmbientPlaylist(audio, { enabled = true } = {}) {
  // UI-facing state — set rarely (activation / advance / mute), never per frame.
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(PLAYLIST[0] || null);
  const [muted, setMuted] = useState(false);

  // Hot refs.
  const activeRef = useRef(null);     // { entry, node, output, kind, el? } — the live source
  const fadingRef = useRef(false);    // a fade/crossfade is mid-ramp
  const indexRef = useRef(0);         // current playlist index
  const belowSinceRef = useRef(0);    // wall-clock ms the level first dropped below threshold (0 = above)
  const rafRef = useRef(0);
  const advanceTimerRef = useRef(null);
  const mutedRef = useRef(false);
  const playingRef = useRef(false);
  const masterRef = useRef(null);     // a master GainNode (mute) the per-entry outputs route through

  // ---- build / tear down one entry's source, routed into the existing analyser ------------------
  const buildSource = useMemo(() => (entry) => {
    const ctx = audio.getContext?.();
    if (!ctx || !entry) return null;
    if (!masterRef.current) {
      masterRef.current = ctx.createGain();
      masterRef.current.gain.value = mutedRef.current ? 0 : 1;
      audio.connectAmbient(masterRef.current); // master -> analyser (the SAME node the bands read)
    }
    const output = ctx.createGain();
    output.gain.value = 0.0001; // start silent; the caller ramps it up
    output.connect(masterRef.current);

    if (entry.kind === 'file' && entry.src) {
      const el = new Audio();
      el.src = entry.src;
      el.loop = true;
      el.crossOrigin = 'anonymous';
      const node = ctx.createMediaElementSource(el);
      node.connect(output);
      el.play().catch(() => { /* autoplay gate not satisfied; silently no source */ });
      return { entry, kind: 'file', output, node, el, gen: null };
    }
    // procedural
    const gen = createAmbientGenerator(ctx, { mood: entry.mood });
    gen.output.connect(output);
    gen.start();
    return { entry, kind: 'procedural', output, node: gen.output, el: null, gen };
  }, [audio]);

  const fadeOutAndStop = useMemo(() => (src, seconds) => {
    if (!src) return;
    const ctx = audio.getContext?.();
    const now = ctx ? ctx.currentTime : 0;
    try {
      src.output.gain.cancelScheduledValues(now);
      src.output.gain.setValueAtTime(Math.max(0.0001, src.output.gain.value), now);
      src.output.gain.exponentialRampToValueAtTime(0.0001, now + seconds);
    } catch (_) {}
    // After the fade, stop + disconnect so nothing lingers in the graph.
    setTimeout(() => {
      try { src.gen?.stop(); } catch (_) {}
      try { src.el?.pause(); } catch (_) {}
      try { src.output.disconnect(); } catch (_) {}
    }, seconds * 1000 + 120);
  }, [audio]);

  const fadeIn = useMemo(() => (src, seconds, target = 0.9) => {
    if (!src) return;
    const ctx = audio.getContext?.();
    const now = ctx ? ctx.currentTime : 0;
    try {
      src.output.gain.cancelScheduledValues(now);
      src.output.gain.setValueAtTime(0.0001, now);
      src.output.gain.exponentialRampToValueAtTime(target, now + seconds);
    } catch (_) {}
  }, [audio]);

  // ---- activate (fade in current entry) ---------------------------------------------------------
  const activate = useMemo(() => () => {
    if (activeRef.current || !audio.getContext?.()) return;
    const entry = PLAYLIST[indexRef.current] || PLAYLIST[0];
    if (!entry) return;
    const src = buildSource(entry);
    if (!src) return;
    activeRef.current = src;
    fadeIn(src, FADE_IN_S);
    setCurrent(entry);
    setPlaying(true);
    playingRef.current = true;
    scheduleAdvance();
  }, [audio, buildSource, fadeIn]);

  // ---- deactivate (fade out — real audio returned, or user paused) ------------------------------
  const deactivate = useMemo(() => (seconds = FADE_OUT_S) => {
    const src = activeRef.current;
    activeRef.current = null;
    if (advanceTimerRef.current) { clearTimeout(advanceTimerRef.current); advanceTimerRef.current = null; }
    fadeOutAndStop(src, seconds);
    setPlaying(false);
    playingRef.current = false;
  }, [fadeOutAndStop]);

  // ---- crossfade to the next entry --------------------------------------------------------------
  const advance = useMemo(() => () => {
    if (!playingRef.current || fadingRef.current) return;
    if (PLAYLIST.length < 2) { scheduleAdvance(); return; } // nothing to advance to
    fadingRef.current = true;
    const old = activeRef.current;
    indexRef.current = (indexRef.current + 1) % PLAYLIST.length;
    const entry = PLAYLIST[indexRef.current];
    const next = buildSource(entry);
    if (!next) { fadingRef.current = false; scheduleAdvance(); return; }
    activeRef.current = next;
    fadeIn(next, CROSSFADE_S);
    fadeOutAndStop(old, CROSSFADE_S);
    setCurrent(entry);
    setTimeout(() => { fadingRef.current = false; }, CROSSFADE_S * 1000 + 150);
    scheduleAdvance();
  }, [buildSource, fadeIn, fadeOutAndStop]);

  // keep timers referencing the latest `advance` (recreated each render by useMemo)
  const advanceRef = useRef(advance);
  advanceRef.current = advance;
  function scheduleAdvance() {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    advanceTimerRef.current = setTimeout(() => advanceRef.current?.(), ENTRY_MS);
  }

  // ---- silence-detection loop (rAF-free; a light interval — no per-frame React state) -----------
  useEffect(() => {
    if (!enabled) return;
    // Poll the live mic level a few times a second (cheap; reads a ref). Decides when to fade the
    // ambient in (mic quiet for ~SILENCE_MS, or visuals-only) and out (mic level returns).
    const tick = () => {
      const ctxReady = !!audio.getContext?.();
      if (ctxReady) {
        const denied = audio.status === 'visuals-only';
        const level = audio.levelRef?.current ?? 0;
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());

        if (denied) {
          // No mic at all — the ambient is the only source. Activate as soon as the graph exists.
          if (!activeRef.current && !mutedRef.current) activate();
        } else {
          // Live mic path: track how long the level has been below threshold.
          if (level < LEVEL_THRESHOLD) {
            if (belowSinceRef.current === 0) belowSinceRef.current = now;
            const quietFor = now - belowSinceRef.current;
            if (quietFor >= SILENCE_MS && !activeRef.current && !mutedRef.current) activate();
          } else {
            belowSinceRef.current = 0;
            // Real audio is back — fade the ambient out if it was playing.
            if (activeRef.current) deactivate();
          }
        }
      }
      rafRef.current = setTimeout(tick, 250);
    };
    rafRef.current = setTimeout(tick, 250);
    return () => { if (rafRef.current) clearTimeout(rafRef.current); };
  }, [enabled, audio, activate, deactivate]);

  // Cleanup on unmount: stop any active source + the advance timer.
  useEffect(() => () => {
    if (advanceTimerRef.current) clearTimeout(advanceTimerRef.current);
    const src = activeRef.current;
    activeRef.current = null;
    try { src?.gen?.stop(); } catch (_) {}
    try { src?.el?.pause(); } catch (_) {}
    try { src?.output.disconnect(); } catch (_) {}
    try { masterRef.current?.disconnect(); } catch (_) {}
  }, []);

  // ---- control surface --------------------------------------------------------------------------
  const play = useMemo(() => () => { if (!activeRef.current) activate(); }, [activate]);
  const pause = useMemo(() => () => { if (activeRef.current) deactivate(); }, [deactivate]);
  const skip = useMemo(() => () => { if (activeRef.current) advanceRef.current(); }, []);
  const toggleMute = useMemo(() => () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
    const ctx = audio.getContext?.();
    if (masterRef.current && ctx) {
      const now = ctx.currentTime;
      try {
        masterRef.current.gain.cancelScheduledValues(now);
        masterRef.current.gain.linearRampToValueAtTime(next ? 0 : 1, now + 0.3);
      } catch (_) {}
    }
    // If muting while nothing is active, leave it; if unmuting and the mic is quiet, the loop
    // re-activates on its own next tick.
  }, [audio]);

  return { playing, current, muted, play, pause, skip, toggleMute };
}
