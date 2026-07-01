// Cheap in-shader "flower-region" mask — authored from blank (write-our-own rule).
//
// The placeholder rainforest (placeholderRainforest.js) and the real Splatfacto capture both put
// the blooms in a narrow palette: pink laurel/rhododendron (0.82,0.52,0.64), white hydrangea
// (0.90,0.88,0.82), coral azalea (0.92,0.52,0.30) — against mossy fern greens. The bloom + flowerColor
// reactive groups must touch ONLY those bloom splats, so we need a per-splat selector that runs inside
// the dyno modifier on `gsplat.rgba` with no texture lookup and no branches that cost much.
//
// Strategy (deliberately tiny): derive a hue + saturation + value from the splat's linear rgb and
// score "is this a warm/near-white bloom, not green foliage." Greens have G as the dominant channel;
// blooms are either red-dominant (pink/coral) or near-neutral-bright (white). One smoothstep band on a
// cheap hue proxy + a foliage-rejection term gives a 0..1 mask. This is a HEURISTIC palette test, not a
// true segmentation — good enough to gate emissive lift + tint without per-splat metadata.
//
// Exported as a GLSL source string so the modifier can drop it into a dyno `globals()` block. The
// function signature is `float flowerMask(vec3 rgb)` returning 0 (foliage/other) .. 1 (bloom).

export const SEMANTIC_MASK_GLSL = /* glsl */ `
  // Max/min channel — cheap chroma + value without a full RGB->HSV conversion.
  float fm_maxc(vec3 c) { return max(c.r, max(c.g, c.b)); }
  float fm_minc(vec3 c) { return min(c.r, min(c.g, c.b)); }

  // flowerMask: 1.0 on pink / white / coral bloom splats, 0.0 on mossy greens and dark splats.
  float flowerMask(vec3 rgb) {
    float mx = fm_maxc(rgb);
    float mn = fm_minc(rgb);
    float chroma = mx - mn;                 // 0 for neutral/white, larger for saturated hues
    float value  = mx;                      // brightness proxy

    // Foliage rejection: ferns/moss have green as the clear maximum channel. Reject when green
    // leads red AND blue by a margin (so a pink with incidental green doesn't get nuked).
    float greenLead = rgb.g - max(rgb.r, rgb.b);
    float foliage = smoothstep(0.02, 0.14, greenLead);   // 1.0 = clearly green foliage

    // Warm-bloom term: pink/coral read as red >= the other channels with real chroma.
    float redLead = rgb.r - max(rgb.g, rgb.b);
    float warm = smoothstep(-0.02, 0.10, redLead) * smoothstep(0.04, 0.16, chroma);

    // White-bloom term: bright and near-neutral (low chroma, high value) — hydrangea/trillium.
    float white = smoothstep(0.70, 0.86, value) * (1.0 - smoothstep(0.10, 0.22, chroma));

    // Combine the two bloom families, then knock out anything that read as foliage. Reject very
    // dark splats (shadowed understory) so the mask never lifts near-black points.
    float bloom = clamp(max(warm, white), 0.0, 1.0);
    bloom *= (1.0 - foliage);
    bloom *= smoothstep(0.12, 0.30, value);
    return clamp(bloom, 0.0, 1.0);
  }

  // foliageMask: the near-inverse of flowerMask — 1.0 on mossy/fern GREENS, 0.0 on blooms and
  // very dark splats. Used by the ivy effect to creep ONLY the foliage (leaves/vines), never the
  // flowers or the dark understory. Green is the clear maximum channel for foliage; require a
  // little brightness so deep shadow isn't swept up, but allow mid-tones (moss reads dim-green).
  float foliageMask(vec3 rgb) {
    float greenLead = rgb.g - max(rgb.r, rgb.b);
    float fol = smoothstep(0.02, 0.14, greenLead);   // 1.0 = clearly green
    fol *= smoothstep(0.06, 0.20, fm_maxc(rgb));      // reject near-black understory
    return clamp(fol, 0.0, 1.0);
  }
`

// Default export mirror so callers can `import mask from './semanticMask.js'` or the named const.
export default SEMANTIC_MASK_GLSL
