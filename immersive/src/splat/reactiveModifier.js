import { dyno } from '@sparkjsdev/spark'
import { SEMANTIC_MASK_GLSL } from './semanticMask.js'

// Reactive splat modifier — the audio + control reactivity layer, authored as a single dyno block so
// every per-splat effect runs in ONE GLSL pass over the merged splat buffer (mobile budget: keep the
// per-splat GLSL tiny). Write-our-own rule: every GLSL line below is authored from blank.
//
// What it does, cheapest groups first (PLAN: movement + growth + bloom + flowerColor + fake lighting):
//   movement   — displace gsplat.center by a cheap audio-driven flow/noise sway.
//   growth     — scale gsplat.scales by an audio-driven "bloom opening" pop on flower splats.
//   bloom      — emissive lift (rgb gain) on flower-masked splats, beat-pumped by treble/flux.
//   flowerColor— mix a performer tint onto flower-masked splats.
//   lighting/shadow — a cheap fake directional darkening (no real normals): a soft top-down key plus
//                     a depth-ish ambient occlusion darkening, both performer-tunable.
//
// The Gsplat struct (verified against the package): center(vec3), flags(uint), scales(vec3),
// index(int), quaternion(vec4), rgba(vec4). We only touch center, scales, rgba.
//
// makeReactiveModifier() returns { modifier, uniforms }:
//   modifier  — a dyno.dynoBlock to assign to splatMesh.worldModifier.
//   uniforms  — dyno uniform handles whose .value useReactiveSplat writes each frame. Audio bands are
//               dynoFloat; per-group control params are dynoFloat / dynoVec3 (colors). All default to
//               NEUTRAL (zeros / pass-through) so an un-driven mesh renders exactly as captured.

export function makeReactiveModifier() {
  // ---- audio band uniforms (featuresRef.current → these) -------------------------------------
  const uBass = dyno.dynoFloat(0)
  const uMid = dyno.dynoFloat(0)
  const uTreble = dyno.dynoFloat(0)
  const uLevel = dyno.dynoFloat(0)
  const uFlux = dyno.dynoFloat(0)

  // Optional audio texture (512x2 R8) — kept as a uniform so a later effect can sample it; the cheap
  // groups below run off the scalar bands, so this can stay null without breaking the shader.
  const uAudioTex = dyno.dynoSampler2D(null)

  // ---- control-param uniforms, grouped by schema group (paramsRef.current → these) -----------
  // movement
  const uSway = dyno.dynoFloat(0)
  const uSwaySpeed = dyno.dynoFloat(0)
  const uTurbulence = dyno.dynoFloat(0)
  // growth
  const uGrowth = dyno.dynoFloat(0)
  const uGrowthSpeed = dyno.dynoFloat(0)
  // lighting
  const uAzimuth = dyno.dynoFloat(0)
  const uElevation = dyno.dynoFloat(0)
  const uLightGain = dyno.dynoFloat(1)
  // shadow
  const uShadowDepth = dyno.dynoFloat(0)
  const uShadowSoftness = dyno.dynoFloat(0)
  // bloom
  const uBloomIntensity = dyno.dynoFloat(0)
  const uBloomThreshold = dyno.dynoFloat(0)
  // flowerColor
  const uTint = dyno.dynoVec3([1, 1, 1])
  const uTintMix = dyno.dynoFloat(0)
  // a monotonic clock so the sway animates even on a held audio frame (driven from useReactiveSplat).
  const uTime = dyno.dynoFloat(0)

  const uniforms = {
    uBass, uMid, uTreble, uLevel, uFlux, uAudioTex,
    uSway, uSwaySpeed, uTurbulence,
    uGrowth, uGrowthSpeed,
    uAzimuth, uElevation, uLightGain,
    uShadowDepth, uShadowSoftness,
    uBloomIntensity, uBloomThreshold,
    uTint, uTintMix,
    uTime,
  }

  const modifier = dyno.dynoBlock(
    { gsplat: dyno.Gsplat },
    { gsplat: dyno.Gsplat },
    ({ gsplat }) => {
      const d = new dyno.Dyno({
        inTypes: {
          gsplat: dyno.Gsplat,
          bass: 'float', mid: 'float', treble: 'float', level: 'float', flux: 'float',
          sway: 'float', swaySpeed: 'float', turbulence: 'float',
          growth: 'float', growthSpeed: 'float',
          azimuth: 'float', elevation: 'float', lightGain: 'float',
          shadowDepth: 'float', shadowSoftness: 'float',
          bloomIntensity: 'float', bloomThreshold: 'float',
          tint: 'vec3', tintMix: 'float',
          time: 'float',
        },
        outTypes: { gsplat: dyno.Gsplat },
        globals: () => [
          dyno.unindent(SEMANTIC_MASK_GLSL),
          dyno.unindent(/* glsl */ `
            // Cheap hash noise (no texture) — value noise from a vec3 seed. Authored from blank.
            float rm_hash(vec3 p) {
              p = fract(p * 0.3183099 + vec3(0.1, 0.2, 0.3));
              p *= 17.0;
              return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
            }
            // Smooth 1D-ish flow from a seed + time, in [-1,1].
            float rm_flow(vec3 seed, float t) {
              float a = rm_hash(floor(seed));
              float b = rm_hash(floor(seed) + 1.0);
              float f = fract(seed.x + seed.y + seed.z);
              f = f * f * (3.0 - 2.0 * f);
              return mix(a, b, f) * 2.0 - 1.0 + sin(t + (a + b) * 6.2831) * 0.5;
            }
          `),
        ],
        statements: ({ inputs, outputs }) => dyno.unindentLines(/* glsl */ `
          ${outputs.gsplat} = ${inputs.gsplat};

          vec3  center = ${inputs.gsplat}.center;
          vec3  scales = ${inputs.gsplat}.scales;
          vec4  rgba   = ${inputs.gsplat}.rgba;

          float bass   = ${inputs.bass};
          float mid    = ${inputs.mid};
          float treble = ${inputs.treble};
          float level  = ${inputs.level};
          float flux   = ${inputs.flux};
          float t      = ${inputs.time};

          // Per-splat seed from its position so neighbours move coherently but not identically.
          vec3 seed = center * 1.7;
          float mask = flowerMask(rgba.rgb);   // 1.0 on bloom splats, 0.0 on foliage

          // ---- MOVEMENT: audio-driven sway/drift of the splat center -----------------------------
          // Low end drives a broad sway; turbulence adds high-frequency jitter scaled by mid/treble.
          float phase = t * ${inputs.swaySpeed} * 1.5;
          vec3 flow = vec3(
            rm_flow(seed + vec3(0.0, 0.0, t * 0.3), phase),
            rm_flow(seed + vec3(5.2, 1.3, t * 0.2), phase * 1.1),
            rm_flow(seed + vec3(9.1, 7.7, t * 0.4), phase * 0.9)
          );
          float swayAmt = ${inputs.sway} * (0.04 + bass * 0.20 + level * 0.06);
          float turbAmt = ${inputs.turbulence} * (mid * 0.10 + treble * 0.08);
          center += flow * swayAmt;
          center += vec3(rm_hash(seed + t), rm_hash(seed.yzx + t), rm_hash(seed.zxy + t)) * (2.0 * turbAmt) - turbAmt;

          // ---- GROWTH: audio "bloom opening" pop, focused on flower splats ----------------------
          // Mid/treble open the blooms; growthSpeed shapes the per-splat pulse so they don't pop in
          // lockstep. Foliage still breathes a little (the *0.25 floor) so the canopy feels alive.
          float gPulse = 0.5 + 0.5 * sin(t * ${inputs.growthSpeed} * 3.0 + rm_hash(seed) * 6.2831);
          float grow = ${inputs.growth} * (mid * 0.6 + treble * 0.4) * gPulse;
          float growScale = 1.0 + grow * (0.25 + 0.75 * mask);
          scales *= growScale;

          // ---- LIGHTING / SHADOW: directional shading from the splat's own surface normal -------
          // A flattened Gaussian's SHORTEST scale axis approximates the local surface normal. Rotate
          // that axis by the splat's quaternion to get a real per-splat normal, then do a soft
          // (wrapped) Lambert key + an away-from-light ambient-occlusion darkening. Authored from
          // blank. quaternion is xyzw; if off-device QA shows the light inverted, negate q.xyz.
          vec4  qrot   = ${inputs.gsplat}.quaternion;
          vec3  absSc  = abs(${inputs.gsplat}.scales);
          vec3  nAxis  = (absSc.x <= absSc.y && absSc.x <= absSc.z) ? vec3(1.0, 0.0, 0.0)
                       : (absSc.y <= absSc.z)                       ? vec3(0.0, 1.0, 0.0)
                                                                    : vec3(0.0, 0.0, 1.0);
          // Rotate nAxis by qrot: v + 2*cross(q.xyz, cross(q.xyz, v) + q.w*v).
          vec3  nrm    = normalize(nAxis + 2.0 * cross(qrot.xyz, cross(qrot.xyz, nAxis) + qrot.w * nAxis));
          vec3 lightDir = normalize(vec3(
            cos(${inputs.azimuth}) * cos(${inputs.elevation}),
            sin(${inputs.elevation}),
            sin(${inputs.azimuth}) * cos(${inputs.elevation})
          ));
          float ndl  = dot(nrm, lightDir);            // real facing in [-1,1]
          float diff = 0.5 + 0.5 * ndl;               // wrapped Lambert — soft terminator, no hard edge
          float key  = mix(1.0, 0.65 + 0.7 * diff, clamp(${inputs.lightGain} * 0.5, 0.0, 1.0));
          // Shadow/AO: darken the side facing away from the light; softness lifts the dark floor.
          float occ  = 1.0 - ${inputs.shadowDepth} * (1.0 - diff) * (0.5 + 0.5 * (1.0 - ${inputs.shadowSoftness}));
          rgba.rgb *= key * clamp(occ, 0.0, 1.0);

          // ---- BLOOM: emissive lift on flower-masked splats, beat-pumped ------------------------
          // Lift above a threshold so only the brighter blooms glow; treble + flux give the beat punch.
          float beat = treble * 0.6 + flux * 0.8 + level * 0.2;
          float bloomLift = ${inputs.bloomIntensity} * mask * smoothstep(min(${inputs.bloomThreshold}, 0.999), 1.0, rgba.r * 0.5 + 0.5) * (0.4 + beat);
          rgba.rgb += rgba.rgb * bloomLift;

          // ---- FLOWERCOLOR: performer tint mixed onto bloom splats -------------------------------
          rgba.rgb = mix(rgba.rgb, rgba.rgb * ${inputs.tint} * 1.6, ${inputs.tintMix} * mask);

          rgba.rgb = clamp(rgba.rgb, 0.0, 4.0);

          ${outputs.gsplat}.center = center;
          ${outputs.gsplat}.scales = scales;
          ${outputs.gsplat}.rgba   = rgba;
        `),
      })

      gsplat = d.apply({
        gsplat,
        bass: uBass, mid: uMid, treble: uTreble, level: uLevel, flux: uFlux,
        sway: uSway, swaySpeed: uSwaySpeed, turbulence: uTurbulence,
        growth: uGrowth, growthSpeed: uGrowthSpeed,
        azimuth: uAzimuth, elevation: uElevation, lightGain: uLightGain,
        shadowDepth: uShadowDepth, shadowSoftness: uShadowSoftness,
        bloomIntensity: uBloomIntensity, bloomThreshold: uBloomThreshold,
        tint: uTint, tintMix: uTintMix,
        time: uTime,
      }).gsplat
      return { gsplat }
    },
  )

  return { modifier, uniforms }
}

export default makeReactiveModifier
