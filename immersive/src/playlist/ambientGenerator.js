// Procedural Appalachian ambient source for the immersive app — FULLY SYNTHESIZED, license-clear,
// authored from a blank file (NO audio samples/files; the write-our-own / commercial-safe posture
// from .claude/rules/immersive.md applies to audio too).
//
// What it builds, given an AudioContext, is a gentle evolving "autonomous vibe" bed with an
// Appalachian / old-time feel:
//   - a low modal DRONE: open fifths + a Mixolydian flat-7 (a D root with A above and a flat-7 C),
//     a couple of detuned oscillators per note so it breathes;
//   - slow plucked-string-like tones: short filtered triangle/saw envelopes at pentatonic
//     intervals, scheduled on a randomized gentle timer (a dulcimer/banjo-ish suggestion, not a
//     sample);
//   - a soft filtered-noise "forest air" bed (a looping noise buffer through a gentle low-pass,
//     slowly swept) for room/wind/insects.
// Evolution is via a few slow LFOs + light randomization. CPU-light by design (a small fixed set of
// oscillators + ONE noise buffer source; mobile budget) and it allocates nothing per audio frame.
//
// Exposes { output: GainNode, start(), stop(), setMood(name) } and three subtle moods
// (dawn / forest / dusk) that nudge filter cutoffs, pluck rate, and brightness. The caller owns
// fades by ramping a gain on `output` (the playlist hook does this) — this module just produces the
// signal and never connects to the destination itself.

// ---- musical material -------------------------------------------------------------------------
// D Mixolydian-ish drone tonic. Frequencies in Hz (equal temperament, A4 = 440).
const D2 = 73.42;   // drone root (low D)
const A2 = 110.0;   // open fifth above
const C3 = 130.81;  // Mixolydian flat-7 (gives the old-time modal colour)
const DRONE_NOTES = [D2, A2, C3];

// D minor/major pentatonic-ish pool for the plucks (D E F# A B across two octaves), kept gentle and
// consonant against the drone. Old-time flavour leans on the open A and the flat-7, already in the
// drone, so the plucks stay pentatonic and sparse.
const PLUCK_NOTES = [
  146.83, // D3
  164.81, // E3
  185.00, // F#3
  220.00, // A3
  246.94, // B3
  293.66, // D4
  329.63, // E4
  440.00, // A4
];

// ---- moods ------------------------------------------------------------------------------------
// Each mood is a few scalar knobs. Subtle on purpose — the vibe stays cohesive across moods.
const MOODS = {
  dawn:   { droneCut: 700,  airCut: 1400, airGain: 0.05, pluckEvery: 5.5, pluckCut: 2200, bright: 0.9 },
  forest: { droneCut: 560,  airCut: 1100, airGain: 0.07, pluckEvery: 4.0, pluckCut: 1800, bright: 0.8 },
  dusk:   { droneCut: 440,  airCut: 850,  airGain: 0.06, pluckEvery: 6.5, pluckCut: 1400, bright: 0.65 },
};

export function createAmbientGenerator(ctx, opts = {}) {
  let mood = MOODS[opts.mood] ? opts.mood : 'forest';
  let cfg = MOODS[mood];

  // Master output the caller fades. Starts silent; the generator's own internal mix sits below it.
  const output = ctx.createGain();
  output.gain.value = 1;

  // A modest internal trim so the summed drone + plucks + air sit at a comfortable analysis level
  // (the AnalyserNode wants signal, but we never play loud — the playlist ramps `output`).
  const mix = ctx.createGain();
  mix.gain.value = 0.5;
  mix.connect(output);

  // ---- the drone: open fifths + flat-7, lightly detuned, through a slow-swept low-pass ----------
  const droneFilter = ctx.createBiquadFilter();
  droneFilter.type = 'lowpass';
  droneFilter.frequency.value = cfg.droneCut;
  droneFilter.Q.value = 0.7;
  droneFilter.connect(mix);

  const droneGain = ctx.createGain();
  droneGain.gain.value = 0.32;
  droneGain.connect(droneFilter);

  // Two oscillators per note (one slightly detuned) → a gentle chorus/beat. Sine + triangle keep it
  // soft and CPU-cheap. These run for the lifetime of the generator (started in start()).
  const droneOscs = [];
  for (const f of DRONE_NOTES) {
    for (let k = 0; k < 2; k++) {
      const o = ctx.createOscillator();
      o.type = k === 0 ? 'sine' : 'triangle';
      o.frequency.value = f;
      o.detune.value = k === 0 ? -4 : 4; // a few cents apart → slow beating
      const g = ctx.createGain();
      g.gain.value = k === 0 ? 0.7 : 0.3;
      o.connect(g).connect(droneGain);
      droneOscs.push(o);
    }
  }

  // ---- LFOs: one breathes the drone amplitude, one slowly sweeps the drone filter cutoff. -------
  const ampLfo = ctx.createOscillator();
  ampLfo.type = 'sine';
  ampLfo.frequency.value = 0.05; // ~20s breath
  const ampLfoGain = ctx.createGain();
  ampLfoGain.gain.value = 0.06;  // ±0.06 around droneGain 0.32
  ampLfo.connect(ampLfoGain).connect(droneGain.gain);

  const cutLfo = ctx.createOscillator();
  cutLfo.type = 'sine';
  cutLfo.frequency.value = 0.03; // ~33s sweep
  const cutLfoGain = ctx.createGain();
  cutLfoGain.gain.value = 120;   // ±120 Hz around the mood cutoff
  cutLfo.connect(cutLfoGain).connect(droneFilter.frequency);

  // ---- forest air: one looping noise buffer through a gentle, slowly-swept low-pass. ------------
  const noiseBuf = makeNoiseBuffer(ctx, 2.0); // 2s loop, reused (no per-frame alloc)
  const air = ctx.createBufferSource();
  air.buffer = noiseBuf;
  air.loop = true;
  const airFilter = ctx.createBiquadFilter();
  airFilter.type = 'lowpass';
  airFilter.frequency.value = cfg.airCut;
  airFilter.Q.value = 0.5;
  const airGain = ctx.createGain();
  airGain.gain.value = cfg.airGain;
  air.connect(airFilter).connect(airGain).connect(mix);

  const airLfo = ctx.createOscillator();
  airLfo.type = 'sine';
  airLfo.frequency.value = 0.02; // ~50s — very slow wind swell
  const airLfoGain = ctx.createGain();
  airLfoGain.gain.value = 200;
  airLfo.connect(airLfoGain).connect(airFilter.frequency);

  // ---- plucks: scheduled, short filtered envelopes (created+torn down per note, gated cheap). ---
  // A single shared filter + gain bus the plucks route through, so per-note we only spin up one
  // oscillator with a short envelope (then it's GC'd when it stops).
  const pluckBus = ctx.createGain();
  pluckBus.gain.value = 0.5;
  pluckBus.connect(mix);

  let running = false;
  let pluckTimer = null;

  function scheduleNextPluck() {
    if (!running) return;
    // Randomized gentle timing around the mood's mean interval (±40%).
    const mean = cfg.pluckEvery;
    const wait = mean * (0.6 + Math.random() * 0.8);
    pluckTimer = setTimeout(() => {
      if (running) {
        try { triggerPluck(); } catch (_) { /* context may be closing */ }
        scheduleNextPluck();
      }
    }, wait * 1000);
  }

  function triggerPluck() {
    const now = ctx.currentTime;
    const note = PLUCK_NOTES[(Math.random() * PLUCK_NOTES.length) | 0];

    const osc = ctx.createOscillator();
    osc.type = Math.random() < 0.5 ? 'triangle' : 'sawtooth';
    osc.frequency.value = note;

    // A per-pluck low-pass with a quick downward sweep → a plucked-string "ping" that dulls as it
    // decays (cheap Karplus-ish suggestion without a delay line).
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    const startCut = cfg.pluckCut * cfg.bright;
    lp.frequency.setValueAtTime(startCut, now);
    lp.frequency.exponentialRampToValueAtTime(Math.max(220, startCut * 0.35), now + 0.5);
    lp.Q.value = 1.0;

    const env = ctx.createGain();
    const peak = 0.18 + Math.random() * 0.08;
    env.gain.setValueAtTime(0.0001, now);
    env.gain.exponentialRampToValueAtTime(peak, now + 0.008); // fast attack
    env.gain.exponentialRampToValueAtTime(0.0001, now + 1.6); // ~1.6s decay

    osc.connect(lp).connect(env).connect(pluckBus);
    osc.start(now);
    osc.stop(now + 1.7);
    // Let the nodes fall out of scope after stop; the WebAudio graph releases them.
  }

  // ---- lifecycle --------------------------------------------------------------------------------
  function start() {
    if (running) return;
    running = true;
    const t = ctx.currentTime;
    for (const o of droneOscs) o.start(t);
    ampLfo.start(t);
    cutLfo.start(t);
    airLfo.start(t);
    try { air.start(t); } catch (_) { /* already started */ }
    scheduleNextPluck();
  }

  function stop() {
    if (!running) return;
    running = false;
    if (pluckTimer) { clearTimeout(pluckTimer); pluckTimer = null; }
    const t = ctx.currentTime;
    const STOP = t + 0.05;
    for (const o of droneOscs) { try { o.stop(STOP); } catch (_) {} }
    try { ampLfo.stop(STOP); } catch (_) {}
    try { cutLfo.stop(STOP); } catch (_) {}
    try { airLfo.stop(STOP); } catch (_) {}
    try { air.stop(STOP); } catch (_) {}
    // After stop, this generator instance is spent (oscillators can't restart). The playlist hook
    // creates a fresh generator per activation, so this is fine.
    try { output.disconnect(); } catch (_) {}
  }

  function setMood(name) {
    if (!MOODS[name] || name === mood) return;
    mood = name;
    cfg = MOODS[mood];
    const now = ctx.currentTime;
    // Glide the mood knobs so the change is felt, not heard as a click.
    droneFilter.frequency.linearRampToValueAtTime(cfg.droneCut, now + 4);
    airFilter.frequency.linearRampToValueAtTime(cfg.airCut, now + 4);
    airGain.gain.linearRampToValueAtTime(cfg.airGain, now + 4);
    // pluckEvery / pluckCut / bright are read live by the scheduler + triggerPluck, no ramp needed.
  }

  return { output, start, stop, setMood, get mood() { return mood; } };
}

// One short white-noise buffer, reused as a loop source (no per-frame allocation). Stereo-mono
// agnostic: a single channel is enough for the forest-air bed.
function makeNoiseBuffer(ctx, seconds) {
  const len = Math.max(1, Math.floor(ctx.sampleRate * seconds));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < len; i++) ch[i] = Math.random() * 2 - 1;
  return buf;
}

export const AMBIENT_MOODS = Object.keys(MOODS);
