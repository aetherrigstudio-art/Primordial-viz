// three.js port of the render pipeline. Same two passes as the raw WebGL2
// version (slime → post), same shaders, same audio texture — but driven through
// three.js so the instrument can grow with the framework (post-FX, WebGPU/TSL,
// loaders) later. Exposes the SAME interface as gl/passes.js Pipeline:
//   new ThreePipeline(canvas);  pipeline.render(frame)
// so src/three/main.js stays a near-copy of the raw bootstrap.
//
// three is resolved via the import map in three.html → ./vendor/three.module.js
// (no build step; static-deployable).

import * as THREE from 'three';
import { SLIME_FRAG } from '../shaders/slime.frag.js';
import { POST_FRAG } from '../shaders/post.frag.js';
import { buildAudioTextureData } from '../gl/uniforms.js';

// three (RawShaderMaterial + GLSL3) prepends its own "#version 300 es", so strip
// the one the shader strings carry on byte one.
const stripVersion = (s) => s.replace(/^#version 300 es\s*/, '');

// Fullscreen-triangle-ish vertex shader for a PlaneGeometry(2,2) in clip space.
const FS_VERT = `precision highp float;
in vec3 position;
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`;

export class ThreePipeline {
  constructor(canvas) {
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: false,
      alpha: false,
      depth: false,
      stencil: false,
      powerPreference: 'high-performance',
    });
    renderer.autoClear = false;
    this.renderer = renderer;
    this.camera = new THREE.Camera(); // clip-space draw, no projection needed
    this.geo = new THREE.PlaneGeometry(2, 2);

    // 512×2 R8 audio texture (row0 = FFT, row1 = waveform).
    this.audioScratch = new Uint8Array(1024);
    this.audioTex = new THREE.DataTexture(this.audioScratch, 512, 2, THREE.RedFormat, THREE.UnsignedByteType);
    this.audioTex.minFilter = THREE.NearestFilter;
    this.audioTex.magFilter = THREE.NearestFilter;
    this.audioTex.wrapS = THREE.ClampToEdgeWrapping;
    this.audioTex.wrapT = THREE.ClampToEdgeWrapping;
    this.audioTex.needsUpdate = true;

    // Half-res-friendly HDR target for the slime pass.
    this.rt = new THREE.WebGLRenderTarget(1, 1, {
      type: THREE.HalfFloatType,
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      depthBuffer: false,
    });

    this.slimeMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FS_VERT,
      fragmentShader: stripVersion(SLIME_FRAG),
      uniforms: {
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uAudioTex: { value: this.audioTex },
        uBass: { value: 0 }, uMid: { value: 0 }, uTreble: { value: 0 },
        uLevel: { value: 0 }, uBeat: { value: 0 },
        uColA: { value: new THREE.Vector3(0.05, 0.9, 0.35) },
        uColB: { value: new THREE.Vector3(0.2, 1.0, 0.5) },
        uBlobCount: { value: 5 }, uSminK: { value: 0.55 }, uWarpAmt: { value: 0.5 },
        uGlow: { value: 1.0 }, uSSS: { value: 1.5 }, uSteps: { value: 64 },
      },
    });
    this.postMat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FS_VERT,
      fragmentShader: stripVersion(POST_FRAG),
      uniforms: {
        uScene: { value: this.rt.texture },
        uResolution: { value: new THREE.Vector2(1, 1) },
        uTime: { value: 0 },
        uGrain: { value: 0.12 }, uScanline: { value: 0.18 }, uChroma: { value: 0.006 },
        uVignette: { value: 0.7 }, uBloom: { value: 1.0 }, uBeat: { value: 0 },
      },
    });

    this.slimeScene = new THREE.Scene().add(new THREE.Mesh(this.geo, this.slimeMat));
    this.postScene = new THREE.Scene().add(new THREE.Mesh(this.geo, this.postMat));
  }

  // frame = { time, canvasW, canvasH, renderScale, steps, features, slimeParams,
  //           postParams, fft, wave } — identical to gl/passes.js.
  render(frame) {
    const r = this.renderer;
    const su = this.slimeMat.uniforms;
    const pu = this.postMat.uniforms;

    // Audio texture upload.
    buildAudioTextureData(frame.fft, frame.wave, this.audioScratch);
    this.audioTex.needsUpdate = true;

    // Size the offscreen buffer to the render-scale.
    const rw = Math.max(1, Math.floor(frame.canvasW * frame.renderScale));
    const rh = Math.max(1, Math.floor(frame.canvasH * frame.renderScale));
    this.rt.setSize(rw, rh);

    // Slime uniforms.
    su.uResolution.value.set(rw, rh);
    su.uTime.value = frame.time;
    su.uBass.value = frame.features.bass;
    su.uMid.value = frame.features.mid;
    su.uTreble.value = frame.features.treble;
    su.uLevel.value = frame.features.level;
    su.uBeat.value = frame.features.beat;
    const sp = frame.slimeParams;
    su.uColA.value.set(sp.colA[0], sp.colA[1], sp.colA[2]);
    su.uColB.value.set(sp.colB[0], sp.colB[1], sp.colB[2]);
    su.uBlobCount.value = sp.blobCount;
    su.uSminK.value = sp.sminK;
    su.uWarpAmt.value = sp.warpAmt;
    su.uGlow.value = sp.glow;
    su.uSSS.value = sp.sss;
    su.uSteps.value = frame.steps;

    // Post uniforms.
    pu.uResolution.value.set(frame.canvasW, frame.canvasH);
    pu.uTime.value = frame.time;
    const pp = frame.postParams;
    pu.uGrain.value = pp.grain;
    pu.uScanline.value = pp.scanline;
    pu.uChroma.value = pp.chroma;
    pu.uVignette.value = pp.vignette;
    pu.uBloom.value = pp.bloom;
    pu.uBeat.value = frame.features.beat;

    // Pass 1 → render target.
    r.setRenderTarget(this.rt);
    r.setViewport(0, 0, rw, rh);
    r.render(this.slimeScene, this.camera);

    // Pass 2 → canvas.
    r.setRenderTarget(null);
    r.setViewport(0, 0, frame.canvasW, frame.canvasH);
    r.render(this.postScene, this.camera);
  }
}
