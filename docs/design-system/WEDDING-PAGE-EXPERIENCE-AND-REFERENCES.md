# Primordial Studio — Wedding Page: Experience + Reference Catalog

**What this file is:** the single source for the wedding-page (Botanical Hero)
**client-side experience** plus **all image and video references** gathered for it.
Authoritative experience direction comes from the operator (2026-06-22); the
visual references come from the operator's 17 stills + 1 motion clip cataloged in
the Drive design-handoff "STORYBOARD" doc.

> **Placeholder note:** all wording, fonts, and exact text placement are
> placeholder. The durable content is the **experience structure** and the
> **reference material**, not specific copy or typefaces.

---

# Part A — Client-side experience (authoritative)

## The one-sentence experience
A visitor opens at **dawn**, and as they move forward, sheer drapery sweeps in
with high-end, almost cinematic (Harry-Potter-grade) visual effects and forms a
**tent around them**; they look around that enclosed space, then move further
forward to leave — the drapery and everything in it flutter away — revealing an
**interactive music visualizer of an Appalachian rainforest**.

## Opening
The experience opens on a held, quiet **dawn** and a soft invitation to step
inside. It begins as a welcome, never a demand.

## The journey (in order)
1. **Open at dawn.** Soft early-morning light, an Appalachian setting, calm and
   atmospheric. Minimal at first.
2. **Move forward → the drapery arrives.** Sheer drapery animates in with
   extremely high-quality, magical visual effects — sweeping, billowing, and
   assembling around the visitor until it encloses the space into **almost a tent**.
3. **Look around the tent.** Inside the draped enclosure the visitor looks around
   freely. **Placeholder content sits only where it makes visual sense** —
   composed into the space, never clogging the view.
4. **Move further forward → leave.** Continuing forward to exit, the **drapery
   flutters away — along with any placeholders** — dissolving the tent.
5. **Arrive in the music visualizer.** What remains is an **interactive music
   visualizer of an Appalachian rainforest** — the audio-reactive instrument
   itself. (Many adjustments and richer scenes come later; this initial reveal is
   the focus for now.)

Emotional shape: **dawn → drapery gathers you in → a moment inside → drapery
releases → you land in the living, sound-reactive world.**

## Rendering approach — multiple point-cloud / Gaussian splats
The scene is built from **photoreal point-cloud / 3D Gaussian-splat captures**,
not modelled geometry — so the drapery and the rainforest read as real, with true
volumetric depth. It uses **several splats together (not one)**: separate,
layered/composited captures (e.g. drapery vs. rainforest, and variants authored
for different light) **cross-faded and combined** to achieve each effect correctly
— the dawn lighting, the drapery forming the tent, and the reveal. Because each
splat carries its own position/scale/opacity, a labelled set (the drapes) can
genuinely **move, billow, and flutter away** at runtime while the viewpoint moves
*through* the volume.

## The end state — the interactive music visualizer
The page resolves *into* Primordial's core: a live, **audio-reactive Appalachian
rainforest** the visitor interacts with — the same instrument the rest of the
project is built around. The wedding hero is the on-ramp that delivers the visitor
into the living visualizer.

## Accessibility, as experienced
- **Reduced motion:** a composed, calm version of the scene instead of the full
  sweeping animation.
- **Meaningful without the scene:** the page still conveys who the studio is and
  what it offers even when the immersive scene can't run.

---

# Part B — Image & video reference catalog

The operator supplied **17 reference stills + 1 motion clip**. The raw files live
in the Drive design-handoff workspace / design session (dropped by the operator);
they are cataloged here by the operator's upload IDs and mapped to the storyboard
beats from the handoff "STORYBOARD" doc. The storyboard frames a dusk→dawn→noon
corridor; the operator's authoritative arc (Part A) starts at dawn and ends in the
rainforest visualizer — so use these as **look/material references**, not as the
literal beat order.

## Motion clip (master reference)
- **Forward-dolly through the corridor** — the viewpoint travels forward through
  green, ferny drape-arches over a mossy stone path in midday light. *The hero
  literally moves the way this video moves.* (1 video.)

## Stills by beat (operator upload IDs)
- **Beat 1 — drapes appear from the trees (dusk / entrance):** `d8ad3632`,
  `700fcacf`, `791d6056` — rosy-dusk enclosed canopy.
- **Beat 2 — into the corridor, light beginning (dawn):** `2130b4f8`, `d2266cd6`,
  `5355d211`, `c332f907` — warm golden corridor.
- **Beat 3 — end of corridor, toward noon (brightest):** `b29dc416` (green ferny
  noon), `82ff1c00`, `b7745604`, `911b0c44`, `c0fa0438` — brightest golden
  corridor; this is the motion clip's palette.
- **Beat 4 — the center, after the corridor (landing):** `3093785b` (photo +
  lantern hall — NOTE: re-skin, the palms must become Appalachian botanicals) +
  whichever centered corridor still reads most "you are here."
- **Beat 5 — drapes swoop away, flowers bloom (finale):** `7de60a5c`, `6eab6690`,
  `0d648566` — drape recedes, dense bloom.
- **North-star mood (overall feeling, not a beat):** `fad002c3` — captioned
  "Manifesting a wedding that feels exactly like this." Tonal target for the whole
  hero.

Total: 17 stills + 1 motion clip.

## Setting — Appalachian temperate rainforest (botanical accuracy)
Native Southern-Appalachian planting (NOT tropical, NOT florist roses), in masses
lining a mossy stone path and framing the drapes:
- Mountain laurel (Kalmia latifolia) — signature clustered pink/white
- Catawba & rosebay rhododendron — big blush/magenta trusses
- Oakleaf + wild (smooth) hydrangea — white/blue mophead masses
- Flame azalea — warm orange/coral accents
- Great white trillium — white groundflowers (seen in the clip)
- Ferns (cinnamon, Christmas), galax, partridgeberry, deep moss
- Flowering dogwood; lady's-slipper orchid as a rare accent
- Ground plane: living moss + wet fieldstone + leaf litter + exposed roots
  (humid, dewy). Light: dappled, backlit, golden-hour → midday. Air: faint
  volumetric haze / god-rays down the path.

## Drive source documents (design handoff)
Folder: **Primordial Studio — Design Handoff**
- STORYBOARD — Botanical Hero journey (2026-06-21) — the 17-still + clip mapping.
- STORYBOARD v2 — Hero cinematic sequence (authoritative, 2026-06-21).
- CORRECTION — project identity (VFX portfolio; diegetic in-scene UI).
- BRIEF — Botanical hand-tracked hero (2026-06-21).
- NOTES — Botanical Hero v2 (DESIGN → CODE).
- Designs: "Primordial Studio - Weddings.html" (v1), "Primordial Studio -
  Botanical Hero v2.html" (v2, newest).

> The raw still/video files are dropped by the operator into the Drive handoff
> workspace / design session. If the actual image/video files should also live in
> the repo, drop them under `docs/design-system/references/` and link them here by
> filename.

---

# Part C — Candidate copy (drawn from the handoff docs)

Still placeholder, but stronger than generic filler — these are the best on-voice
lines pulled from the v2 HTML, the CORRECTION doc, and the storyboard, adapted to
the authoritative dawn → tent → visualizer arc. Voice = poetic, benefit-led,
never technical.

**Keep almost as-is (voice already fits):**
- *"Step inside a room that moves with you."* — opening line; the tent moves with them.
- *"A beautiful, magic experience, tailored to your palette, theme, and setting."* — core pitch.
- *"…drapery, greenery, and bloom that move as you do."* — intro line.
- *"Manifesting a wedding that feels exactly like this."* — north-star; emotional closing line.

**Adapted to the new arc (dawn → tent → flutter away → rainforest visualizer):**
- Arrival / tent-forming: *"The drapes gather like feathers."*
- Dawn open tied to the tent: *"Morning breaks, and the room gathers around you."*
- Chapter labels: **Dawn → The drapes gather → Inside the room → The drapes lift away → Into the living forest.**
- Ending (was "Released" / "the bloom clearing"): *"Step into the living forest."*

---

## Prototype vs. planned (one honest note)
The Drive prototypes faithfully demonstrate the *techniques* (drapery, dawn light,
in-scene text, forward travel). The production build keeps this exact journey and
feeling but deepens the realism via **point-cloud / Gaussian-splat scenes** —
captured drapery and a captured Appalachian rainforest, the viewpoint travelling
forward through the splat volume, and the real audio-reactive visualizer at the
end. **What the visitor feels is the target; the upgrade is fidelity, not
direction.**
