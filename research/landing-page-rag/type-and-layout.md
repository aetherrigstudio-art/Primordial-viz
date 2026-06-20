# Landing-page type & layout

How to make a page look intentional rather than templated through typography,
spacing, and grid — tuned to primordial's dark neon-HUD aesthetic. Pairs with
the `frontend-design` skill (which covers distinctive visual direction in
general); this note is the landing-page-specific slice.

## Type sets the tone before a word is read

Typography is the fastest signal of whether a page is crafted or default. The
generic-system-font, evenly-gray look reads as "unfinished template." A
distinctive, well-set type system reads as intent. For primordial that means
type that fits a future-tech, slightly grungy, instrument-like identity — not a
safe corporate sans used at one size everywhere.

### Pairing

Use a deliberate pairing, usually two families with a clear job each:

- **A display face for headlines** with character — geometric, technical, or
  subtly distorted to echo the grungy-future identity. This carries the brand.
- **A clean, highly legible face for body and UI** — readability wins for copy;
  save the personality for the display face. A monospace or technical face can
  reinforce the HUD/instrument feel for labels, captions, and small UI text.

Two families is usually enough; three is a risk. Make sure the pairing has
genuine contrast (don't pair two similar sans faces — it looks like a mistake,
not a choice). Verify weights and the character set you need actually ship in
the chosen webfonts.

### Scale and hierarchy

Establish a clear type scale (a small set of sizes with real jumps between
them), not a dozen near-identical sizes. Hierarchy should be obvious at a glance:
the headline dominates, sublines and body sit clearly below, captions and labels
are clearly smallest. Strong hierarchy lets a phone visitor skim and still get
the message. Set generous line-height for body (readability) and tighter
line-height for large display text (so headlines hold together).

### Loading type without breaking layout

Webfonts must not cause layout shift (CLS) or invisible text. Use
`font-display: swap` (or a tuned fallback) and size-match the fallback so text
doesn't reflow when the webfont loads. Keep the font payload lean — subset to
the characters and weights you use; every extra weight is bytes against the LCP
budget on mobile.

## Spacing rhythm

Consistent spacing is most of what makes a layout feel designed. Use a spacing
scale (a base unit and multiples) so gaps relate to each other instead of being
ad-hoc. Be generous with whitespace — crowding everything together reads as
cheap; deliberate breathing room reads as premium and focuses attention. Group
related elements tightly and separate unrelated groups clearly (proximity is how
the eye parses structure). Vertical rhythm between sections should feel even and
intentional, giving each beat of the narrative room to land.

## Grid and alignment

A grid gives the page an invisible backbone. Align elements to shared edges and
a consistent content width so nothing looks dropped-in. Misalignment is one of
the loudest "untidy/template" tells, and it's free to fix. On a phone the grid
is essentially one column — so prioritize a clean, comfortable single-column
flow with confident margins, and let multi-column layouts be a desktop
enhancement, not the basis of the design. Design mobile-first: the phone layout
is the real product here, not an afterthought.

## The dark neon-HUD aesthetic (primordial-specific)

The instrument's identity is neon-on-black with an instrument/HUD feel. Carry it
into the landing page deliberately:

- **Deep, near-black backgrounds** let the visual and the neon accents glow. Use
  a true dark base, not muddy gray.
- **Restrained neon accent palette** — one or two signature glow colors used
  sparingly for emphasis (CTA, key labels, the visual's light), not splashed
  everywhere. Neon is powerful precisely because it's rationed.
- **Contrast for readability** — neon-on-black can fail accessibility contrast
  for body text. Keep body copy at a comfortably high contrast (don't set
  paragraphs in a dim glow color); reserve saturated neon for large text,
  accents, and non-text emphasis. Meet WCAG AA contrast for anything a visitor
  must read.
- **HUD cues, used lightly** — thin rules, monospace labels, subtle grid or
  scanline texture, technical numerals can reinforce the instrument feel. A
  little goes a long way; overdone, it becomes a costume.

## Avoiding the "template" look — a checklist

- Distinctive type pairing with real contrast, not default system fonts.
- A clear type scale and obvious hierarchy, not a flat wall of similar sizes.
- Consistent spacing from a scale; generous, intentional whitespace.
- Everything aligned to a grid; no stray, dropped-in elements.
- A deliberate, rationed accent palette, not a rainbow or a stock gradient.
- Mobile-first single-column flow that feels designed, not squeezed.
