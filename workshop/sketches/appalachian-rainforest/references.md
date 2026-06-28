# Appalachian Rainforest - Visual References & Implementation Context

## Creative Direction (Visual Characteristics)
The Appalachian temperate rainforest (or "cloud forest") is defined by high moisture, extreme biodiversity, and elevation-specific zones. The vibe we want to hit is:
- **Atmosphere & Mist:** Perpetual fog drip and "tattered shawls" of low-hanging clouds. Glistening wet surfaces.
- **Deep Greens & Moss:** Monochromatic, moody deep greens from high-elevation spruce-fir forests, blending into vibrant cove hardwoods. Thick, fuzzy carpets of moss and ferns covering rocks and ground.
- **Water Elements:** Rocky streams, small waterfalls, and high ambient humidity.

## Implementation Best Practices (Mobile WebGL)
To achieve this lush, dense, and misty aesthetic within our strict mobile budget (≤ 64 ray steps, `0.5 - 0.75` scale), we must use:

1. **Mist & Fog Volumetrics:** 
   - Integrate with the depth buffer for early ray-termination.
   - Use adaptive step sizes or early-out opacity accumulation.
   - For volumetric density, rely on precomputed/baked 3D texture noise rather than expensive procedural fractal noise loops inside the march.
   
2. **Moss & Foliage Geometry:**
   - **Shell Texturing:** Instead of raymarching complex displacement for moss, consider cheap shell texturing for fuzzy surfaces.
   - **Distance Field Caching:** If using SDFs, keep the bounding volumes simple (e.g. smooth-blended spheres/blobs for rocks and foliage) and rely on color mapping and surface noise rather than heavy structural displacement.
   
3. **General Mobile Rules (`.claude/rules/shaders.md`):**
   - Keep precision to `mediump` where possible.
   - Strictly avoid divergent branching (`if` statements) inside the main raymarch loop.
   - Heavy reliance on the resolution downscaling (already built into Primordial's renderer hysteresis).

## Workflow Next Steps
This file serves as our reference board for the `visual-workshop` loop. When ready, we can proceed to **Step 3 (Author)** by creating:
- `appalachian-rainforest.frag.js`
- `appalachian-rainforest.json` 
