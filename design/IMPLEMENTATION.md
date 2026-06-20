# Implementation Brief — Primordial Studio LLC · Weddings landing page

## ⭐ START HERE — getting this built from Android (least tapping)

You're on Android and just want the page built into your repo. Do this once:

1. **Connect GitHub to Claude Code** (one time): open **claude.ai/code**; when prompted,
   authorize the **Claude GitHub App** for the account/org that owns your repo — grant it
   that repo (or "All repositories"). Org repos may need an org admin to approve.
2. **Start a new session on _your_ repo**: at claude.ai/code, tap **New session** and pick
   **your repository** — not this design bundle.
3. **Attach the design + give one instruction.** Attach `project/Primordial Studio -
   Weddings.html` (it's fully self-contained — the entire page in one file) and this
   `IMPLEMENTATION.md`, then paste:

   > Implement the attached "Primordial Studio — Weddings" landing page into this repo,
   > following our existing stack and conventions. Use IMPLEMENTATION.md as the spec and
   > the .html as the pixel-perfect visual reference. Wire in the design tokens; make it
   > responsive, AA-accessible, and reduced-motion safe; then run our linter/tests and open a PR.

That session has your code **and** the design on disk, so it can build the page and open
the PR. That's the whole job.

> **Why not "just connect via MCP"?** MCP adds *tools*, not your source code. Your repo
> only reaches the agent when the session is **launched against it** (step 2). No MCP
> server mounts your repo — so there's nothing to configure there.

The `.claude/` folder in this bundle is an **optional bonus**: copy it into your repo to
make future web sessions auto-install dependencies on startup (see §8 at the bottom).

---

This is the build target for a coding agent (or developer) working **inside the real
product repo**. The pixel-perfect reference is the prototype already in this bundle:

> **Canonical reference:** `project/Primordial Studio - Weddings.html`
> Open it and match its visual output exactly. This brief summarizes intent, tokens,
> structure, and the rules to preserve — but the HTML/CSS in that file is the source
> of truth for spacing, color, and layout.

The design medium is HTML/CSS/JS, but it's a **prototype, not production code**.
Recreate the *visual result* in whatever stack the target repo uses (React, Vue,
Svelte, Astro, plain HTML — whatever fits). Don't copy the prototype's internal
structure unless it happens to fit the codebase.

---

## 1. What this page is

A marketing landing page for **Primordial Studio LLC — Weddings**, a studio that makes
cinematic wedding films and immersive in-room visuals (projection, ambient gobo
lighting, video walls).

- **Audience:** engaged couples and their wedding planners.
- **Primary goal:** visitor watches the reel, then submits an inquiry with their event date.
- **Vibe:** clean, minimal, warm, premium — editorial and romantic, understated luxury.
  Never flashy or templated.

---

## 2. Design tokens (single source of truth)

Mirror of `project/uploads/wedding-design-system/` (`tokens.json` / `theme.css`).
Wire these into the repo's existing token/theme system if it has one; otherwise add
them as CSS custom properties at the app root.

### Color
| Token | Value | Use |
| --- | --- | --- |
| `bg` | `#FBF7F1` | Page background — warm cream |
| `surface` | `#FFFFFF` | Cards, raised surfaces |
| `sand` / `surfaceAlt` | `#F2E9DD` | Soft-sand alt sections (testimonials) |
| `ink` | `#2A2521` | Primary text — warm charcoal; also footer bg |
| `taupe` / `inkSoft` | `#6E645B` | Secondary text |
| `line` | `#E6DBCC` | Hairline borders |
| `gold` / `primary` | `#B79363` | Champagne-gold accent, primary buttons |
| `gold-text` / `primaryStrong` | `#9A7A4F` | Gold for text/hover (passes AA on cream) |
| `blush` | `#E9D2CB` | Soft accent (hero italic, quote marks) |
| `sage` | `#9FB0A0` | Optional accent — used for focus outlines |

**Rule:** white text only over photography. Use `gold-text` (`#9A7A4F`), not `gold`,
for any gold-colored *text* on cream so it passes AA contrast.

### Type
- **Headings:** Cormorant Garamond (serif), weights 400–600, line-height ~1.08–1.1,
  letter-spacing ~ -0.015em.
- **Body / UI:** Mulish (humanist sans).
- **Eyebrow labels:** Mulish, uppercase, letter-spacing `0.18em`, small (~0.72rem),
  weight 700, color `gold-text`.
- Base body size 17px (16px under 560px).
- Google Fonts import (already in the prototype):
  `Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400` + `Mulish:wght@400;500;600;700`.

### Spacing & shape
- Section vertical padding: `clamp(4rem, 9vw, 6.5rem)` (~6rem).
- Max content width: **1120px**, with `0 24px` horizontal gutter.
- Radius: cards/large `20px`, default `14px`, inputs `10px`, buttons pill `999px`.
- Shadows (soft): `sm 0 1px 2px / 0 2px 8px`, `md 0 6px 22px`, `lg 0 18px 48px`
  (all `rgba(42,37,33, …)`). See the `:root` block in the reference for exact values.
- Buttons: pill, uppercase labels, letter-spacing `.1em`, ~`15px 32px` padding.

---

## 3. Page structure (in order)

Match the reference file section-for-section.

1. **Sticky nav** — brand wordmark (`Primordial` + small `Studio · Weddings`), links
   (The Films / What We Create / How It Works / Couples), primary CTA "Check your date".
   Translucent cream background w/ blur + bottom hairline. Links collapse on mobile
   (≤900px), CTA stays.
2. **Hero** — full-viewport (`min-height: 92vh`) cinematic image with a soft dark
   left-to-right scrim. Eyebrow "Weddings"; large serif headline (with one italic blush
   phrase); one-line subhead; primary CTA "Check your date" + light secondary "Watch the
   reel". **White text over the image.** Scroll cue at bottom.
3. **Intro** — centered: gold hairline rule, eyebrow, serif H2, one warm paragraph on
   what the studio creates (a keepsake film + atmosphere).
4. **Services** — 4 cards: Wedding Films · Projection & Ambience · Lighting & Gobos ·
   Video Walls. Each: small icon tile (sand bg, gold-text stroke icon) + serif title +
   one-line description. Grid 4→2 (≤900px)→1 (≤560px). Subtle hover lift.
5. **Film & Gallery** — featured 16:9 film embed *placeholder* (treated-photo background,
   centered play button, label "Signature Reel 2026"). Below: responsive masonry-ish
   grid of past-wedding photos (tall / wide / square spans). Clicking the frame is a
   placeholder action (real embed goes here).
6. **Process** — 3 numbered steps on a white panel (top/bottom hairlines): 01 Inquire,
   02 Plan, 03 Celebrate. Serif numerals in gold, hairline divider, title + copy.
   3→1 column on mobile.
7. **Testimonials** — soft-sand section, 3 short couple/planner quotes in white cards
   with a blush serif quote mark. Serif quote text, gold-text attribution. 3→1 column.
8. **Inquiry CTA** — two-column: left = eyebrow + serif H2 + lead + contact detail rows
   (calendar / email / location icons); right = form card with **name, email, event
   date, venue, message** and a prominent "Request your date" button. Collapses to one
   column ≤900px. Live status line under the button (`aria-live="polite"`).
9. **Footer** — `ink` background, light text. Brand + tagline, link columns
   (Studio / Connect / Visit), bottom row with "© Primordial Studio LLC".

### Treated photo placeholders
The prototype renders photo slots as CSS gradient + SVG-noise "treated" panels with a
small uppercase caption. These are **stand-ins for real photography and the reel embed**.
In the real build, replace them with `<img>` / `<video>` / an embed, keeping:
- the dark overlay/scrim on the hero (for white-text contrast),
- `alt` text on every image,
- the same aspect ratios and grid spans.

---

## 4. Requirements to preserve

- **Mobile-first, fully responsive.** Breakpoints in the reference: `≤900px` and
  `≤560px`. Couples/planners browse mostly on phones — verify the phone layout.
- **Accessibility (AA):**
  - Semantic headings (one `h1` in the hero, `h2` per section).
  - Visible focus states — `3px solid sage` outline, `3px` offset (see reference).
  - `alt` text on all imagery; `role`/`aria-label` on the decorative photo panels and
    the play button; `aria-live` status on the form.
  - Form inputs have associated `<label>`s; required fields marked; client-side
    validation with a friendly message.
  - Maintain AA contrast (that's why gold *text* uses `#9A7A4F`, not `#B79363`).
- **Motion — tasteful only:** gentle fade/rise on scroll via IntersectionObserver.
  **Must** respect `prefers-reduced-motion: reduce` (disable reveals, hover transforms,
  and smooth-scroll). Reference implements this.
- **Copy:** confident, warm, concise, written for couples — no industry jargon. The
  reference copy is good; keep its tone if you rewrite.
- **Avoid stock-template feel:** distinctive serif/sans pairing, generous whitespace,
  gold used sparingly as an accent.

---

## 5. Behavior / JS

Three small behaviors in the prototype (re-implement idiomatically per stack):

1. **Scroll reveal** — add a `reveal` class to section children, flip to `in` on
   intersection. Skip entirely when reduced motion is requested or `IntersectionObserver`
   is unavailable (show everything).
2. **Inquiry form** — prevent default submit; if invalid, show a prompt to complete
   name/email/date/venue and trigger native validation; on success show a thank-you
   message addressed to the first name and reset. (Wire to a real endpoint in the build.)
3. **Reel frame** — placeholder click/keydown (Enter/Space) action; replace with the
   real film embed.

---

## 6. Integration checklist for the target repo

- [ ] Confirm the repo's framework, component conventions, and styling approach
      (CSS modules / Tailwind / styled-components / tokens) and map the tokens above onto it.
- [ ] Decide the route/path for the page (e.g. `/weddings` or a standalone landing route).
- [ ] Add the Cormorant Garamond + Mulish fonts (self-host or Google Fonts) if not present.
- [ ] Build the 9 blocks above as components matching the repo's patterns.
- [ ] Swap treated placeholders for real media slots (`img`/`video`/embed) with `alt`.
- [ ] Wire the inquiry form to the real submission endpoint.
- [ ] Verify responsive (≤900 / ≤560), AA contrast, focus states, and reduced-motion.
- [ ] Run the repo's linter/formatter/tests.

---

## 7. Files in this bundle

- `project/Primordial Studio - Weddings.html` — **the pixel-perfect reference.**
- `project/uploads/wedding-design-system/tokens.json` — DTCG design tokens.
- `project/uploads/wedding-design-system/src/theme.css` — tokens as CSS custom properties.
- `project/uploads/wedding-design-system/src/theme.ts` — tokens as a typed JS object.
- `project/uploads/wedding-design-system/src/components.tsx` — dependency-free React
  components (Hero/Section/Heading/Text/Eyebrow/Button/Card) reading the CSS vars; useful
  if the target repo is React.
- `chats/chat1.md` — the design conversation (intent + where the user landed).

---

## 8. Optional: auto-prep web sessions (the `.claude/` hook kit)

This bundle includes a portable **SessionStart hook** so that when you run Claude Code on
the web against your repo, dependencies install automatically before the session starts —
no manual `npm install` each time.

**To enable it in your repo:**
1. Copy the `.claude/` folder from this bundle into your repo root.
2. Rename `.claude/settings.json.example` → `.claude/settings.json` (merge into an
   existing `settings.json` if you already have one).
3. Commit to your default branch. All future web sessions will run the hook.

**What the hook does** (`.claude/hooks/session-start.sh`): detects your stack from its
manifest files and installs deps — npm/pnpm/yarn (`package.json`), pip/poetry/uv (Python),
bundler, go, cargo. It is idempotent, non-interactive, **web-only** (gated on
`CLAUDE_CODE_REMOTE`), and best-effort (never blocks the session; always exits 0). It runs
**synchronously**, so deps are guaranteed ready before the agent starts. If you'd rather
have a faster start and can tolerate a brief race, switch it to async mode per the
[Claude Code hooks docs](https://code.claude.com/docs/en/claude-code-on-the-web#setup-scripts).
