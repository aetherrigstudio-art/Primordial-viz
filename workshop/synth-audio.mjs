// Deterministic synthetic "fake song" for the Visual Workshop sandbox.
// Stateless: synthAudio(t, opts) -> { bass, mid, treble, level, flux, beat,
// fft, wave } so headless clips are reproducible. No mic, no assets. Safe to
// import in both the browser (sandbox) and node (tests). This is dev-only
// tooling; it never ships with the deployed app.

const TAU = Math.PI * 2;

function fract(x) { return x - Math.floor(x); }
function clamp01(x) { return x < 0 ? 0 : x > 1 ? 1 : x; }
// Cheap deterministic hash for per-bin spectral sparkle.
function hash(n) { return fract(Math.sin(n * 12.9898) * 43758.5453); }

export function synthAudio(t, { bpm = 120 } = {}) {
  const beatPeriod = 60 / bpm;            // seconds per beat
  const phase = fract(t / beatPeriod);    // 0..1 within the beat
  const kick = Math.exp(-phase * 9.0);    // sharp attack, fast decay
  const hatPhase = fract(t / beatPeriod + 0.5);
  const hat = Math.exp(-hatPhase * 16.0); // offbeat hat

  const bass = clamp01(0.18 + 0.72 * kick);
  const mid = clamp01(0.28 + 0.18 * Math.sin(t * 1.7) + 0.25 * hat);
  const treble = clamp01(0.20 + 0.15 * Math.sin(t * 3.1 + 1.0) + 0.5 * hat);
  const level = clamp01(0.25 + 0.5 * kick + 0.2 * hat);
  const flux = clamp01(0.85 * kick + 0.6 * hat); // onset energy
  const beat = kick;

  // 512-bin spectrum: bass weights low bins, mid the middle, treble the top,
  // plus a little per-bin sparkle so the audio texture is not flat.
  const fft = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    const f = i / 512;
    let band;
    if (f < 0.12) band = bass;
    else if (f < 0.5) band = mid * (1.0 - (f - 0.12) / 0.5);
    else band = treble * (1.0 - (f - 0.5) / 0.9);
    const sparkle = 0.15 * hash(i + Math.floor(t * 8));
    fft[i] = Math.round(clamp01(band + sparkle) * 255);
  }

  // 512-sample waveform from the band sines, centered at 128.
  const wave = new Uint8Array(512);
  for (let i = 0; i < 512; i++) {
    const x = i / 512;
    const s =
      bass * Math.sin(TAU * x * 2 + t * 4) +
      mid * 0.6 * Math.sin(TAU * x * 8 + t * 7) +
      treble * 0.3 * Math.sin(TAU * x * 24 + t * 11);
    wave[i] = Math.round(clamp01(0.5 + 0.45 * s) * 255);
  }

  return { bass, mid, treble, level, flux, beat, fft, wave };
}
