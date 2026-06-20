# Landing-page motion & feel

How to make a landing page feel alive and intentional without it feeling busy,
janky, or slow — and how to do that on primordial's phone-first, perf-budgeted
web path.

## Motion has a job, or it's noise

Animation should do one of three things: **guide attention** (draw the eye to
the next beat or the CTA), **explain** (show a relationship or a state change),
or **express identity** (reinforce the grungy-future-geometric-slimy feel).
Motion that does none of these is decoration that costs performance and
attention. When in doubt, cut it. The most premium-feeling sites are
*restrained* — a few deliberate moves, not everything sliding in at once.

## Scroll-reveal, done with taste

Reveal-on-scroll (content fading/rising in as it enters the viewport) adds
polish when it's subtle and fast. Keep it understated:

- **Short and quick** — small offsets (a few px of rise), ~150–300ms, gentle
  easing. Big, slow, bouncy entrances feel cheap and delay the reader.
- **Once, not on every scroll** — reveal an element the first time it enters,
  then leave it; re-animating on every pass is distracting.
- **Never gate content on motion** — the text must be present and readable even
  if the animation never runs (no-JS, reduced-motion, or a slow device). Animate
  *from* a visible resting state, don't animate *into existence*.
- **Don't hijack the scroll** — scroll-jacking (overriding native scrolling to
  force a pace) frustrates phone users and breaks expectations. Let the visitor
  drive.

## Respect reduced-motion — always

Some visitors set `prefers-reduced-motion: reduce` (vestibular sensitivity, or
preference). Honor it: gate non-essential animation behind a media query and
provide a calm fallback (instant state, or a much-reduced version). This repo
already does the analog in the instrument — reduced-motion slows the visual
clock (`src/main.js`) — so the landing page must match that ethic. Reduced-
motion is an accessibility requirement, not a nice-to-have; skipping it excludes
people and reads as careless.

## WebGL / canvas hero accents within the budget

A live shader hero is primordial's strongest differentiator — it *is* the
product on the page. But the same constraints that govern the instrument govern
the hero, because the audience is the same phone GPU:

- **Honor the mobile perf budget** (`.claude/rules/shaders.md`): render the heavy
  pass to a 0.5–0.75 FBO and upscale, cap raymarch steps ≤ 64, use dynamic
  resolution (auto-drop as frame-time climbs), and **pause on
  `visibilitychange`** so a backgrounded tab burns no battery.
- **First frame fast, then animate** — don't block LCP on a long shader warm-up.
  Show a meaningful first frame (or a lightweight poster) quickly, then bring the
  motion in. A hero that costs 4s to appear has already lost.
- **Visuals-only by default** — the hero must look great before the visitor
  grants the mic (mic is opt-in). Drive it from the visuals-only path so there's
  no permission wall between arrival and the wow (`workshop/sketches/frontpage/
  BRIEF.md`).
- **Degrade gracefully** — if WebGL2 is unavailable or the device is weak, fall
  back to a poster image or a cheap canvas effect rather than a broken or
  stuttering hero.
- **Battery and heat are real** — a full-screen raymarch running forever drains a
  phone. Pause when off-screen, throttle when idle, and don't run the hero loop
  on sections the visitor has scrolled past.

## Micro-interactions and feedback

Small, instant responses make a page feel crafted: a button that subtly
acknowledges a tap, a hover/active state that confirms an element is
interactive, a smooth state transition. Keep them quick (feedback should feel
immediate — well under the 200ms INP target) and consistent. They're the
difference between a page that feels inert and one that feels responsive — but
like all motion, they serve clarity, not spectacle.

## The overall feel for primordial

Aim for **controlled intensity**: dark, neon, a little grungy and organic, with
motion that feels like the visual instrument breathing rather than a slideshow
of effects. One hero that genuinely moves, a few restrained reveals, instant
feedback on taps — and nothing fighting the reader. Intentional restraint is
what reads as high-end; maximalism reads as a template with every plugin turned
on.
