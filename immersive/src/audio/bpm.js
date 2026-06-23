// Dependency-free tempo + beat/bar tracking for the immersive instrument.
//
// The beat-DETECTION pattern is ported (re-authored, NOT imported) from the instrument's
// /root/Primordial-viz/src/audio/bpm.js: compare instantaneous bass energy against a rolling
// mean+variance threshold; a strong spike past it (with a debounce cooldown) => a beat. Detected
// beat intervals estimate auto-BPM (median-ish moving average over the plausible 30..240 BPM band).
//
// Extended here for MUSICAL TIME the camera can lock to. On each detected beat we advance a running
// `beat` count and (assuming 4/4) a running `bar` count, raising `downbeat` true on the single frame
// a new bar starts. `beatPhase` is a 0..1 fractional position within the current beat, advanced
// continuously between detected beats from the resolved BPM (so a tween can ease smoothly rather than
// only snapping on detections). All scalar — no allocations in the hot path beyond the existing
// instrument pattern; the consumer reads a plain object via getMusical().

const HIST_LEN = 60; // ~1s of bass energy @60fps
const COOLDOWN_FRAMES = 6; // ~100ms debounce -> caps detected tempo well above any real track
const BEATS_PER_BAR = 4; // 4/4 assumed (live time-signature detection is unsolved — rules/audio.md)

export class BeatClock {
  constructor() {
    this._hist = new Float32Array(HIST_LEN);
    this._histIdx = 0;
    this._histCount = 0;

    this._cooldown = 0;

    // Auto-BPM from detected beat intervals (the instrument's median-window approach).
    this._lastBeatMs = 0;
    this._beatIntervals = [];
    this.autoBpm = null;
    this.manualBpm = null; // optional explicit override (UI hook for later)

    // Running musical time.
    this.beat = 0; // running beat count (increments on each detected beat)
    this.bar = 0; // running bar count (4/4)
    this.beatPhase = 0; // 0..1 within the current beat (advances continuously)
    this.downbeat = false; // true the frame a new bar begins
    this._beatInBar = 0; // 0..BEATS_PER_BAR-1, which beat of the current bar we're on
  }

  _pushHist(v) {
    this._hist[this._histIdx] = v;
    this._histIdx = (this._histIdx + 1) % HIST_LEN;
    if (this._histCount < HIST_LEN) this._histCount++;
  }

  _mean() {
    let s = 0;
    const n = this._histCount || 1;
    for (let i = 0; i < n; i++) s += this._hist[i];
    return s / n;
  }

  _variance(mean) {
    let s = 0;
    const n = this._histCount || 1;
    for (let i = 0; i < n; i++) {
      const d = this._hist[i] - mean;
      s += d * d;
    }
    return s / n;
  }

  // Resolved BPM: manual override wins, then the auto estimate. Null until enough beats are seen.
  get bpm() {
    return this.manualBpm || this.autoBpm || null;
  }

  setManualBpm(bpm) {
    this.manualBpm = bpm ? Math.round(bpm) : null;
  }

  // Call once per frame with the raw (unsmoothed) bass energy (0..1) and dt seconds.
  // Returns the live musical-time object (also mirrored on this instance).
  update(bassEnergy, dt) {
    this.downbeat = false;

    // 1) Advance beatPhase continuously from the resolved BPM so the phase glides between
    //    detections (a tween easing on phase won't stutter when a beat is briefly missed).
    const bpm = this.bpm;
    if (bpm && dt > 0 && dt < 1) {
      const beatsPerSec = bpm / 60;
      this.beatPhase += beatsPerSec * dt;
      if (this.beatPhase >= 1) this.beatPhase -= Math.floor(this.beatPhase); // keep 0..1
    }

    // 2) Energy-spike beat detection (the instrument pattern).
    const mean = this._mean();
    const variance = this._variance(mean);
    const threshold = mean * (1.4 + 12.0 * variance) + 0.02;

    if (this._cooldown > 0) this._cooldown--;

    if (this._histCount > 10 && bassEnergy > threshold && this._cooldown === 0) {
      this._cooldown = COOLDOWN_FRAMES;
      this._onBeat();
    }

    this._pushHist(bassEnergy);
    return this.musical;
  }

  _onBeat() {
    this.beat += 1;
    this.beatPhase = 0; // re-anchor phase to the detected beat
    this._beatInBar += 1;
    if (this._beatInBar >= BEATS_PER_BAR) {
      this._beatInBar = 0;
      this.bar += 1;
      this.downbeat = true; // first beat of a new bar
    }
    this._registerBeatInterval();
  }

  _registerBeatInterval() {
    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    if (this._lastBeatMs > 0) {
      const iv = now - this._lastBeatMs;
      if (iv > 250 && iv < 2000) {
        // 30..240 BPM plausible band
        this._beatIntervals.push(iv);
        if (this._beatIntervals.length > 8) this._beatIntervals.shift();
        // MEDIAN of the (≤8-entry) interval window — robust to a single mis-detected beat that a
        // mean would smear into the tempo estimate.
        const sorted = this._beatIntervals.slice().sort((a, b) => a - b);
        const mid = sorted.length >> 1;
        const median = sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
        this.autoBpm = Math.round(60000 / median);
      }
    }
    this._lastBeatMs = now;
  }

  // Plain snapshot the consumer (camera) reads. Recomputed each get — cheap (6 fields).
  get musical() {
    return {
      bpm: this.bpm,
      beat: this.beat,
      bar: this.bar,
      beatPhase: this.beatPhase,
      downbeat: this.downbeat,
    };
  }
}
