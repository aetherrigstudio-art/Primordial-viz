// Reference sketch: audio-reactive warped plasma with neon rings. Authored from
// a blank file (technique only, commercial-safe). Demonstrates the sketch
// shader contract - it is NOT the target art direction, just a canary.
import { COMMON_GLSL } from '../../../src/shaders/common.glsl.js';

export const SKETCH_FRAG = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform vec2  uResolution;
uniform float uTime;
uniform sampler2D uAudioTex;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform float uLevel;
uniform float uFlux;
uniform float uBeat;
uniform vec3  uColA;
uniform vec3  uColB;
uniform float uWarpAmt;
uniform float uGlow;

${COMMON_GLSL}

void main() {
  vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / uResolution.y;

  // Warp the plane with fbm; bass pumps the warp, the beat kicks it.
  float w = uWarpAmt * (0.5 + 1.2 * uBass + 0.8 * uBeat);
  vec3 p = vec3(uv * 2.0, uTime * 0.3);
  p = domainWarp(p, uTime, w, 2);
  float n = fbm(p * 1.5, 3);

  float bands = 0.5 + 0.5 * sin(n * 6.2831 + uTime + uMid * 6.0);
  vec3 col = mix(uColA, uColB, bands);

  // Neon rings riding flux + treble.
  float r = length(uv);
  float rings = 0.5 + 0.5 * sin(r * 18.0 - uTime * 3.0);
  col += uColB * rings * (0.15 + 0.6 * uTreble + 0.5 * uFlux);

  col *= uGlow * (0.7 + 0.6 * uLevel);
  col *= 1.0 - 0.4 * r;  // vignette

  fragColor = vec4(max(col, 0.0), 1.0);
}
`;
