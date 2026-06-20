# ADR-004: The cinematic experience is the wedding LANDING page (its own surface); the full site is a separate workstream

## Status
Accepted

## Date
2026-06-20

## Context
The immersive drape→garden experience specced across `VISION.md`, `TECH.md`,
`WORKFLOW.md`, and the Act-1 plan could be mistaken for "the wedding site." The
operator clarified: **this is the wedding *landing page*, not the full site.** A
wedding planner needs the usual functional pages too (services/packages, gallery/
portfolio, about, testimonials, inquiry/booking). The experience also reuses
primordial's audio engine but is a **different brand, client, and aesthetic** (boho
wedding, not the gig instrument).

## Decision
Treat the cinematic experience as **the landing page only** — its own surface that
may carry its own raw-WebGL2 approach (ADR-002), whose job is to captivate and
**funnel into a larger wedding-planner site**. The **full site is a separate,
larger workstream**, scoped later, sharing the boho **design tokens / type /
palette** for brand continuity. It lives under `clients/wedding-pagoda/`, isolated
from the primordial gig path.

## Alternatives Considered

### Build the whole site as one immersive WebGL experience
- Pros: a single wow surface.
- Cons: most site content is **conventional functional pages**; immersive-everywhere
  hurts usability, SEO, and performance, and bloats scope.
- **Rejected** — the immersive piece is the entry/funnel, not the whole product.

### Fold the landing page into the primordial repo's gig path
- Pros: shares the audio engine directly.
- Cons: different client/brand/aesthetic; the gig path is zero-dep and tightly
  scoped; coupling them muddies both.
- **Rejected** — keep it its own surface (reuse `src/audio/*` by import, don't
  entangle).

## Consequences
- The landing page **funnels into the full site** via the end-of-journey CTA /
  garden hand-off (the "doorway").
- Design tokens, type, and palette are **shared** so the brand is continuous from
  landing page into the site.
- The **full-site structure is TBD** (an open thread); the landing-page design and
  recipe are unaffected by this scoping.
- Keeps the primordial gig instrument (`index.html` → `src/`) and the client work
  cleanly separated in one repo.
