// 512x2 R8 audio DataTexture for the immersive app — the portability convention from
// .claude/rules/audio.md (matches Shadertoy's iChannel layout so audio shaders port unchanged):
//   row 0 = getByteFrequencyData (fftSize 1024 -> 512 bins)
//   row 1 = getByteTimeDomainData (waveform)
// Uploaded as RedFormat / R8 / UNSIGNED_BYTE with NEAREST min+mag filtering, no mipmaps —
// 512x2 maps 1:1 to texels, so any filtering would only blur the bins.
//
// three is a direct dep of the immersive app (package.json: "three": "^0.171.0").

import * as THREE from 'three';

const WIDTH = 512;
const HEIGHT = 2;

// Build the DataTexture + its backing buffer. The buffer is row-major:
//   bytes [0 .. 511]   = row 0 (frequency)
//   bytes [512 .. 1023] = row 1 (waveform)
export function makeAudioTexture() {
  const data = new Uint8Array(WIDTH * HEIGHT); // R8: one byte per texel
  const texture = new THREE.DataTexture(
    data,
    WIDTH,
    HEIGHT,
    THREE.RedFormat,
    THREE.UnsignedByteType
  );
  texture.minFilter = THREE.NearestFilter;
  texture.magFilter = THREE.NearestFilter;
  texture.wrapS = THREE.ClampToEdgeWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  texture.generateMipmaps = false;
  // R8 single-byte rows: unpack alignment of 1 avoids row-padding corruption.
  texture.unpackAlignment = 1;
  texture.needsUpdate = true;
  return { texture, data };
}

// Copy this frame's FFT (row 0) + waveform (row 1) into the texture buffer and flag it for
// re-upload. `freq` and `wave` are the analyser's 512-length Uint8Arrays. Call once per frame
// after analyser.update(). Zeros (the default buffer) when not live.
export function writeAudioTexture(texture, data, freq, wave) {
  data.set(freq, 0);          // row 0
  data.set(wave, WIDTH);      // row 1
  texture.needsUpdate = true;
}

export const AUDIO_TEXTURE_WIDTH = WIDTH;
export const AUDIO_TEXTURE_HEIGHT = HEIGHT;
