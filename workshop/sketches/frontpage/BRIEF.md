# Front-page visual — workshop brief

> Durable launch point for a **visual-workshop** session (run after a `/clear`).
> Goal: design the **real signature visual** for `primordial.video/Test/`, replacing
> the disposable placeholder slime. Use the `visual-workshop` skill + the
> `workshop/` rig (sandbox → `npm run clip` → `SendUserFile` → react → graduate).

## The charter

**"grungy-future-geometric-slimy."** Success test: on a **phone**, in the first
~3 seconds, it reads as that descriptor, looks **intentional** (not a default
template), and holds the mobile frame budget.

The shipped looks today (`slime-green`, `hud-amber`) deliver *slimy + neon-future*
but under-explore the **geometric** word. That gap is the main thing to resolve.

## Hard constraints (non-negotiable — see `.claude/rules/shaders.md`)

- **Mobile budget:** raymarch steps **≤ 64**, render-scale **0.5–0.75**, dynamic
  resolution, pause on hidden. Graduation is gated by `perf-budget` + `visual-qa`.
- **Write-our-own shaders** (commercial). Reference/learn only from MIT / CC0 /
  CC-BY; never copy CC BY-NC-SA Shadertoy code.
- **Static, zero-runtime-dep web path.** Sketches are dev-only until graduated.
- **Front-page behavior:** a visitor should see something great **without granting
  mic** first — drive the hero from the **visuals-only** path by default, mic as
  opt-in. (Confirm the visuals-only mode covers this in session 1.)

## Architecture reminder (how a winner ships)

One shared raymarch shader; **looks = params-only JSON** (`colA/B`, `blobCount`,
`sminK`, `warpAmt`, `glow`, `sss`, `bloom`, `grain`, `scanline`, `chroma`,
`vignette`). A winner graduates **either** as a new params-only look (`new-preset`
/ `create_look`) **or**, for a new form language, a new `src/shaders/` shader.
Once in `src/`, it auto-deploys to `/Test/` on push.

Sketch uniforms always provided: `uResolution`, `uTime`, `uAudioTex`,
`uBass/uMid/uTreble/uLevel/uFlux/uBeat`, `uSteps`. Sketch params upload by name
(len-3 array → `vec3 u<Key>`, number → `float u<Key>`).

## First batch — three sketches to render & react (session 1)

Render all three to short clips, deliver to the phone, and let the operator react.
This converges the **how-geometric** question fast (clips > text for visuals):

1. **`fp-slime`** — refined wet metaball slime (the current shader, retuned).
   Fastest baseline; a params-only look. Anchors "slimy + future."
2. **`fp-hybrid`** — slime goo flowing **through/over a hard geometric structure**
   (faceted lattice / fractured crystal / grid the blobs cling to). New sketch
   shader. Aims to hit all four charter words.
3. **`fp-geo`** — **geometric-first**: raymarched faceted / crystalline SDF forms,
   fractured + grungy, with a thin slimy wet coating. New sketch shader. A harder
   "future-tech" read.

## Open questions for session 1 (discuss before authoring)

- **Palette / mood + references.** Current is neon-on-black. Acid? Chrome? Oily
  iridescent? Bio-luminescent? Gather refs (reference-only) first.
- **Passive hero vs live instrument** framing for the landing.
- **How geometric** — which of the three directions (or a blend) wins.

## The loop (from the `visual-workshop` skill)

mood/refs → (optional research: creative + mobile-GPU best-practice, license-
flagged) → author `workshop/sketches/<name>/` → `npm run clip -- <name>` →
`SendUserFile` the `.webm` → react → iterate → **graduate on explicit approval**
(budget-gated) → push → live at `/Test/`.
