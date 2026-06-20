# Landing-page structure & conversion

How to lay out a landing page so a first-time visitor understands it, believes
it, and acts — in that order. Written for primordial's frontpage: a phone-first
audience meeting an electronic-music visual artist for the first time.

## The job of the page

A landing page answers three questions in sequence, fast: **What is this? Why
should I care? What do I do next?** Every section earns its place by advancing
one of those. If a block doesn't move the visitor toward the answer or the
action, cut it. On a phone the whole arc has seconds to land, so lead with the
strongest version of each answer rather than warming up to it.

## Hero / above-the-fold anatomy

The hero is the only part most visitors fully see. Give it one job: communicate
the identity instantly and offer one clear next step. A strong hero has four
parts and no more:

- **A signature visual** that *is* the product. For primordial the hero should
  be the live visual itself (visuals-only path, mic opt-in) — the work sells the
  work. Avoid stock imagery or a generic gradient; the differentiator is the
  thing on screen.
- **A headline** that names what this is in plain, confident language — not a
  tagline so abstract it could belong to any brand. One line, readable in a
  glance.
- **A subline** (one sentence) that adds the "why" the headline can't carry —
  the audience, the use, or the feeling.
- **One primary call to action.** A single button with a verb. Everything else
  in the hero is secondary at most.

Resist the urge to stack three CTAs, a nav of ten links, and a paragraph in the
hero. Clutter reads as uncertainty. Whitespace and a single confident statement
read as intent.

## Narrative order below the fold

After the hero, structure the page as a short argument, each section a beat:

1. **Show, don't tell.** A second proof of the visual — a reel, a clip, stills —
   before any words about it. For a visual artist the portfolio *is* the pitch.
2. **What it does / who it's for.** Concrete, not feature-listy: "room audio
   drives generative visuals you operate live," not "leverages advanced FFT."
3. **Proof.** Social proof: a gig, a collaborator, a venue, a quote. One real
   signal beats five vague claims (see below).
4. **The ask, again.** Repeat the single CTA at the natural decision point — a
   visitor convinced halfway down shouldn't have to scroll back up to act.

Keep it short. A landing page is not a manual. Depth lives behind links
(progressive disclosure), not stacked on the first screen.

## The single clear CTA

Decide the *one* action this page exists to produce — book a collab, watch the
live demo, get in touch — and make every CTA on the page that same action with
the same words. Competing CTAs split attention and lower the odds of any of
them. The button copy is a verb the visitor wants to do ("See it live," "Start
a collab"), not a label about the system ("Submit," "Learn more"). Make it
visually unmistakable: the highest-contrast, most obvious interactive element on
the screen, comfortably tappable on a phone (a large hit target, not a thin
text link).

## Social proof that's actually persuasive

Proof works when it's specific and verifiable. A named venue, a real
collaborator, a dated gig, a short genuine quote with attribution — these carry
weight. Vague badges ("trusted by many," anonymous five-star rows) read as
filler and can lower trust. If proof is thin early on, lean on the work itself
as proof (the visuals) rather than manufacturing credibility. One true signal,
shown plainly, beats a wall of decoration.

## Performance is UX (and conversion)

On a phone over mobile data, slow *is* broken — a visitor leaves before the
hero resolves. Treat speed as a design requirement, measured by Core Web Vitals
(75th-percentile field targets):

- **LCP (Largest Contentful Paint) under 2.5s** — the hero's main element should
  paint fast. A heavy WebGL hero must show a meaningful first frame quickly
  (poster/first-frame, then animate) rather than blocking on a long shader warm-
  up.
- **CLS (Cumulative Layout Shift) under 0.1** — reserve space for media and
  fonts so nothing jumps as the page loads. Set explicit dimensions; avoid
  late-injected banners that shove content.
- **INP (Interaction to Next Paint) under 200ms** — taps feel instant. Don't let
  the render loop or heavy JS starve the main thread when the visitor interacts.
  (INP replaced FID as the responsiveness metric in 2024.)

These pair directly with the repo's existing mobile perf budget (dynamic
resolution, step cap, pause-on-hidden in `.claude/rules/shaders.md`): the same
discipline that keeps the instrument smooth keeps the landing page fast.

## Progressive disclosure

Show the minimum that lets a visitor decide; reveal depth on demand. Long-form
detail (full case studies, technical notes, the press kit) sits behind a click,
an expander, or a deeper page — not piled onto the first screen. This keeps the
hero clean, the page fast, and the cognitive load low, while still serving the
visitor who wants more. The art is choosing what's essential to the decision and
deferring the rest without hiding it.
