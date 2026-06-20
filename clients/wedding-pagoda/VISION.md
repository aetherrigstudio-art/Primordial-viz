# Wedding-planner landing page — vision (discussion capture)

> Captured from a discussion session (2026-06-20), paused mid-dream. This is the
> **creative vision**, not a spec or plan yet. Client: a wedding planner (the
> studio's next client). Distinct from the primordial gig instrument, but reuses
> its tech + the dynamic-canvas research. **Nothing here is built.**

## The concept in one line

A fully interactive, scroll-through WebGL landing page that walks a visitor down a
candlelit, ivory-draped **pagoda hallway** that slowly dissolves from fabric into a
living flower garden — breathing to soft cinematic music, with the planner's words
drifting on the air the whole way.

## The aesthetic (locked by reference)

Reference image the operator supplied: an Instagram post "pagoda wedding drapery"
(curated_byhritika; track: Piero Piccioni). Soft **ivory drapes** cascading from a
high ceiling — swagged overhead like a canopy and falling in long vertical panels
along the columns; hundreds of **floating candles/votives** on strings glowing warm
gold; **greenery/ivy climbing the columns**; tall, cathedral-intimate, candlelit-
dusk, "like a dream." Lush, romantic, cinematic — **no grunge** (opposite of the
primordial palette). Palette: ivory / cream / warm gold candlelight / soft green.

## The structure — a two-act journey

**Act 1 — the morphing draped hallway.** You arrive *inside* the candlelit draped
pagoda. You scroll (mousewheel) to move forward down the hallway. As you travel,
the space **transforms continuously**: drapes thin out and turn **sheer**, the
**ivy grows more abundant**, until the fabric is gone — **replaced by ivy and
flowers**. One smooth scroll-driven morph (constructed elegance surrendering to
living nature), not separate rooms.

**Act 2 — the flower garden.** The drapes are gone; the visitor stands in ivy and
flowers, and **a second interactive experience** opens there. Deliberately left
**TBD** ("we'll work on it later") — it's its own act, not just a destination card.

## Mechanics / feel

- **Scroll = travel** forward through the hallway (the spine of the experience).
- **Click = part a drape** — a tactile moment, pulling/sweeping an ivory panel aside
  as you pass.
- **Audio = breathing, not pulsing.** The fabric sways and the candle-light flickers
  as the music *swells* — lush cinematic strings (Piero-Piccioni energy), not a club
  beat. Reuses the primordial audio engine (FFT → bands → onset), tuned gentle.
- **Words drift through the WHOLE journey** — the planner's voice on the air:
  phrases catching the candlelight, passing the sheer drapes, settling among the
  flowers. The copy is woven through the experience, not a sign at the end. (They
  must be **real readable text** under the hood — findability + a guest knowing
  whose dream this is — without breaking the spell.)

## The emotional arc (why it works)

Drapery you part to reveal a garden = the **lifting of the veil**; a prepared,
draped ceremony space *becoming* a living, blooming garden = love taking root. A
hallway = the processional / the aisle. The visitor doesn't *read* the feeling —
they walk through it. No template vendor can hand a planner this.

## Open threads (resume from here — NOT decided)

- **Act 2 — what the flower experience actually is** (interaction, payoff). The
  operator paused before defining it.
- **The words — voice + content.** Planner's own invitation ("manifesting… let's
  create yours") vs drifting poetry / vow-fragments. Tone TBD. (We have
  `research/landing-page-rag/copy-and-voice.md` to draw on.)
- **Where the planner's brand + contact/inquiry lives** — likely inside Act 2's
  garden; the page still has a job (turn a dreamy visitor into an inquiry).
- **The audio source** — a curated track (starts on the first scroll/click, since
  browsers block autoplay-with-sound) vs ambient. The reference's track suggests
  cinematic strings.
- **Scope / where it's built** — its own repo + brand + deploy, or here? Likely its
  own surface (it can carry a 3D/cloth lib; see the dynamic-canvas stack decision).
  Undecided.

## What it reuses (we're well-positioned)

- **primordial audio engine** (`src/audio/*`) — beat/band/onset analysis, retuned
  for gentle "breathing" reactivity.
- **Dynamic-canvas research** — `research/landing-page-rag/dynamic-canvas-deep-
  research.md` (persistent canvas behind DOM, Lenis/GSAP scroll, real-text-over-
  canvas for SEO, ogl-vs-three.js, mobile budget).
- **Volumetric vocabulary** — the flowers/greenery (Act 2) are a candidate for
  point clouds / captured 3D (`workshop/sketches/frontpage/dynamic-canvas-and-
  volumetric.md`); drapery is shader-driven flowing cloth (mobile-friendly, not
  heavy physics).
- **reference-gather method** (`docs/superpowers/specs+plans/2026-06-20-reference-
  gather-method*`) to collect drapery/cloth/garden references when we resume.

## Direction update (2026-06-20): boho (supersedes a briefly-floated "book feel" — dropped)

Operator set the art direction to **boho**. The candlelit ivory-drapes-greenery
world holds (a 2nd `curated_byhritika` reel — "soft ivory drapes… warm candlelight…
delicate greens" — confirms it), pulled **warmer, earthier, handcrafted**: pampas
grass + dried florals + wildflower greenery (not manicured roses), woven/macramé/
rattan + gauzy linen texture, warm earth tones layered over the ivory base, relaxed
and free-spirited. NOT luxe-formal, NOT grunge, NOT a "book". Token refinements
(palette/type/foliage) are in `TECH.md §Boho refinement`; boho CC0 asset sources in
`references.md`.

## Status

Discussion paused here. Next session: pick up an Open thread above (likely Act 2 or
the words), or move to brainstorming → spec → plan for Act 1 once the vision is
settled. Do **not** start building until the operator says go.
