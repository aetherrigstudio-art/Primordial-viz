// AnalyserNode wrapper for the immersive app. Ported (math VERBATIM) from the instrument's
// src/audio/analyser.js — NOT imported (no cross-app imports), re-authored here.
//
// Produces, per frame:
//  - the raw 512-bin FFT byte array + 512-sample waveform byte array (for the 512x2 audio
//    texture the reactive splat shader reads), and
//  - smoothed band scalars { bass, mid, treble, level, flux } as plain floats.
//
// fftSize 1024 -> 512 frequency bins, AnalyserNode smoothingTimeConstant 0.8 — matches the
// Shadertoy iChannel audio layout so audio shaders prototyped elsewhere port unchanged.

export class Analyser {
  constructor(audioCtx) {
    this.ctx = audioCtx;
    this.node = audioCtx.createAnalyser();
    this.node.fftSize = 1024;            // -> 512 bins
    this.node.smoothingTimeConstant = 0.8;
    this.node.minDecibels = -90;
    this.node.maxDecibels = -10;

    this.bins = this.node.frequencyBinCount; // 512
    this.freq = new Uint8Array(this.bins);   // getByteFrequencyData
    this.wave = new Uint8Array(this.bins);   // getByteTimeDomainData
    this._prevFreq = new Uint8Array(this.bins); // last frame's FFT, for flux

    // Smoothed bands.
    this.bass = 0;
    this.mid = 0;
    this.treble = 0;
    this.level = 0;
    this.flux = 0;   // spectral flux: smoothed sum of positive bin-to-bin rises

    // Per-band bin ranges over a 1024-fftSize @ ~44.1k: bin width ~43 Hz.
    // bass ~20-250Hz, mid ~250-2k, treble ~2k-8k. Keep simple & musical.
    this._bassRange = [1, 6];
    this._midRange = [6, 46];
    this._trebleRange = [46, 186];

    // Smoothing factor for the scalar uniforms (frame-rate independent enough
    // for visuals; not sample-accurate, intentionally).
    this._smooth = 0.6;
  }

  connect(sourceNode) {
    sourceNode.connect(this.node);
    // Do NOT connect to destination: we only analyse, never play back the mic
    // (would cause feedback at a gig).
  }

  // Detach the upstream source (used when switching input devices).
  disconnect(sourceNode) {
    try { sourceNode.disconnect(this.node); } catch (_) { /* ignore */ }
  }

  _avg(arr, lo, hi) {
    let s = 0;
    for (let i = lo; i < hi; i++) s += arr[i];
    return s / Math.max(1, hi - lo) / 255; // -> 0..1
  }

  // Read the latest data. Call once per frame BEFORE reading scalars/texture.
  update() {
    this.node.getByteFrequencyData(this.freq);
    this.node.getByteTimeDomainData(this.wave);

    // Spectral flux: sum of positive frame-to-frame rises across all bins
    // (energy newly appearing = an onset). Normalize to 0..1 and apply a gain
    // so musical onsets read clearly; compute before overwriting prevFreq.
    let fl = 0;
    for (let i = 0; i < this.bins; i++) {
      const d = this.freq[i] - this._prevFreq[i];
      if (d > 0) fl += d;
    }
    this._prevFreq.set(this.freq);
    // Gain chosen so percussive onsets span a usable range; tune against a real
    // track at the venue test (the AnalyserNode's own 0.8 smoothing softens it).
    fl = Math.min(1, (fl / (this.bins * 255)) * 12);

    const b = this._avg(this.freq, this._bassRange[0], this._bassRange[1]);
    const m = this._avg(this.freq, this._midRange[0], this._midRange[1]);
    const t = this._avg(this.freq, this._trebleRange[0], this._trebleRange[1]);

    // Overall level from the waveform RMS (centered at 128).
    let sq = 0;
    for (let i = 0; i < this.bins; i++) {
      const v = (this.wave[i] - 128) / 128;
      sq += v * v;
    }
    const rms = Math.sqrt(sq / this.bins);

    const s = this._smooth;
    this.bass = this.bass * s + b * (1 - s);
    this.mid = this.mid * s + m * (1 - s);
    this.treble = this.treble * s + t * (1 - s);
    this.level = this.level * s + rms * (1 - s);
    this.flux = this.flux * s + fl * (1 - s);
  }

  // Raw instantaneous bass energy (unsmoothed) for a beat detector, if needed.
  rawBassEnergy() {
    return this._avg(this.freq, this._bassRange[0], this._bassRange[1]);
  }

  get features() {
    return {
      bass: this.bass,
      mid: this.mid,
      treble: this.treble,
      level: this.level,
      flux: this.flux,
    };
  }
}
