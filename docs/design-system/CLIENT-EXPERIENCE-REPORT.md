# Primordial Studio — Wedding Page: Client-Side Experience Report

**Scope:** *only* what a visitor experiences — the felt, sensory, and interactive
journey, and how it behaves on their device. No build, architecture, or tooling
detail.

**Status:** describes the **intended initial experience** as directed by the
operator (2026-06-22). This supersedes the literal v1/v2 Drive prototypes where
they differ — the prototypes demonstrate techniques, but the arc below is the
target.

> **Placeholder note:** all **wording, fonts, and the exact placement of text**
> are placeholder — do **not** treat any specific line of copy or typeface as
> final. The durable content of this report is the **experience structure**: the
> dawn open, the drapery forming a tent, looking around, the forward exit where
> drapery and placeholders flutter away, and the reveal of the interactive music
> visualizer. Quoted lines (if any) only illustrate *where* copy appears, not
> *what* it says.

---

## 1. The one-sentence experience

A visitor opens at **dawn**, and as they move forward, sheer drapery sweeps in
with high-end, almost cinematic (Harry-Potter-grade) visual effects and forms a
**tent around them**; they look around that enclosed space, then move further
forward to leave — the drapery and everything in it flutter away — revealing an
**interactive music visualizer of an Appalachian rainforest**.

## 2. First moment — the entry gate

Before the journey begins, a calm invitation offers the visitor a way in:

- A welcoming headline and short line of intent (copy placeholder).
- **Two choices:** enter *with the camera* (offered as the most magical way in),
  or *continue without* — scroll/tilt works just as well.
- A clear **privacy reassurance** that the camera never leaves their device.

Entering is framed as a welcome, never a demand; opting out costs nothing.

## 3. The journey

The visitor's forward movement (scroll, or tilt/camera) drives the whole
sequence. The arc, in order:

1. **Open at dawn.** The scene begins in soft early-morning light — an
   Appalachian setting, calm and atmospheric. Minimal at first.
2. **Move forward → the drapery arrives.** As the visitor travels forward, sheer
   drapery animates in with **extremely high-quality, magical visual effects** —
   fabric sweeping, billowing, and assembling around them until it encloses the
   space into **almost a tent**.
3. **Look around the tent.** Inside the draped enclosure, the visitor can look
   around freely (mouse, tilt, or camera). **Placeholder content sits only in
   spots that make visual sense** — composed into the space, never clogging the
   screen or covering the view.
4. **Move further forward → leave.** Continuing forward to exit, the **drapery
   flutters away — along with any placeholders** — dissolving the tent and
   opening the space back up.
5. **Arrive in the music visualizer.** What remains is an **interactive music
   visualizer of an Appalachian rainforest** — the audio-reactive instrument
   itself. (Many adjustments and richer scenes come later; this initial reveal is
   the focus for now.)

The emotional shape: **dawn → drapery gathers you in → a moment inside → drapery
releases → you land in the living, sound-reactive world.**

## 4. Text and content inside the space

Any words or UI moments live **in** the scene, placed where they read naturally
against the drapery — positioned for visual balance, not as a flat overlay and
not crowding the view. The specific wording and placement are placeholder; the
principle is **sparse, well-composed, unobtrusive**.

## 5. How the visitor drives it (by device)

- **Any device — forward movement** (scroll) carries them through the dawn →
  tent → release → visualizer sequence.
- **Desktop — mouse** to look around inside the tented space.
- **Phone — tilt (gyro)** to look around, so the draped space reads as real depth
  that answers the hand.
- **Optional — camera** as the most immersive way to "be seen" by the space;
  opt-in only, requested from a tap, and never leaving the device.

## 6. The look and feel (brand atmosphere)

- **Quality bar:** the drapery effects should read as **premium and magical** —
  the visual-effects craft is the whole point of the page.
- **Rendering approach — multiple point-cloud / Gaussian splats.** The scene is
  built from **photoreal point-cloud / 3D Gaussian-splat captures**, not modelled
  geometry — so the drapery and the Appalachian rainforest read as real, with
  true volumetric depth. It uses **several splats together (not one)** —
  separate, layered/composited captures (e.g. drapery vs. rainforest, and
  variants authored for different light) **cross-faded and combined** to achieve
  each effect correctly: the dawn lighting, the drapery forming the tent, and the
  reveal. Because each splat carries its own position/scale/opacity, a labelled
  set (the drapes) can genuinely **move, billow, and flutter away** at runtime
  while the camera travels *through* the volume.
- **Palette / type (placeholder):** wedding-luxe and warm — soft, elegant, never
  brassy or clinical. Specific colours and typefaces are not final; only the
  high-end, romantic *intent* is the takeaway.
- **Atmosphere:** dawn light, fine haze/grain, gentle motion throughout —
  cinematic rather than brochure-like.

## 7. The end state — the interactive music visualizer

The page resolves *into* Primordial's core: a live, **audio-reactive Appalachian
rainforest** the visitor can interact with. This is the same instrument the rest
of the project is built around — so the wedding hero isn't a separate brochure,
it's the on-ramp that delivers the visitor into the living visualizer. Future
work layers in adjustments and additional tailorable scenes; the initial build is
just this first part: **dawn → drapery tent → release → rainforest visualizer.**

## 8. Accessibility & privacy, as the visitor experiences them

- **Reduced motion:** a visitor who prefers reduced motion is shown a composed,
  calm version rather than the full sweeping animation.
- **Screen reader / no-JS / SEO:** a hidden text layer carries the real heading
  and a one-line description, so the page is meaningful without the 3D scene.
- **Keyboard:** clear focus outlines on every control.
- **Camera privacy felt up front:** opt-in, tap-triggered, and promised to stay
  on the device.

---

## Prototype vs. planned (one honest note)

The Drive prototypes are faithful demonstrations of the *techniques* (projected
drapery, dawn lighting, diegetic text, forward travel), built to be felt now. The
production build keeps this exact journey and feeling but deepens the realism —
photoreal point-cloud / Gaussian-splat scenes (captured drapery and a captured
Appalachian rainforest), a true look-around camera travelling through the splat
volume, and the real audio-reactive visualizer at the end. **What the visitor
feels is the target; the upgrade is fidelity, not direction.**
