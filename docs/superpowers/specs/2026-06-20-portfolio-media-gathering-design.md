# Design — Portfolio Media Gathering (sub-project 1 of 4)

> Date: 2026-06-20 · Branch: `claude/init-r8ukva` · Status: design (awaiting user
> review) · Method: brainstorming → (next) writing-plans.

## Why this exists

The operator needs to build a **portfolio website** and must first pull the best
**image/video candidates** out of a large, messy personal media collection
(Google Drive + Google Photos), so they can be touched-up and published. The
operator is **mobile-only (Android)**; there is **no Windows PC or Mac**.

This supersedes the earlier `portfolio/Gather-PortfolioMedia.ps1` helper (on
branch `claude/portfolio-media-gathering-m15twg`), which assumed a Windows PC the
operator does not have. That PowerShell approach is **dead on arrival** and is
replaced by the design below.

## Scope: this is 1 of 4 sub-projects

The operator's full request decomposes into four independent pieces, each getting
its own spec → plan → build cycle:

1. **Media gathering** ← *this spec*. Get keeper candidates out of Drive/Photos
   into a place they can be processed, on a phone.
2. **Secrets sharing** — Proton Pass as vault + Secure Links; feed keys to CI.
   *(Own spec. Decision locked: Proton Pass over NordPass — see Research §5.)*
3. **AI processing pipeline** — touch-ups + depth maps. *(Own spec.)*
4. **Portfolio page** — depth-driven WebGL parallax treatment. *(Own spec.)*

This spec covers **only #1**. It defines the seams (#2 provides the secrets #1's
CI needs; #3 consumes #1's output) but does not design #2–#4.

## Verified constraints (research, 2026-06-20)

Five-angle deep-research pass; full citations kept here so the plan doesn't
re-litigate them. Confidence noted per claim.

- **Google Photos API cannot read an existing library (high).** The
  `photoslibrary.readonly` / `.sharing` / broad scopes were removed; calls return
  `403 PERMISSION_DENIED` after 2025-03-31. The Library API now sees only
  app-created media. → No script can walk or re-sort the operator's existing
  photos via API.
  [developers.googleblog.com Picker-launch post, 2024-09-18;
  developers.google.com/photos/overview/authorization].
- **Google Photos Picker API is interactive-only (high).** The user tap-selects
  items in the Photos UI; the app then downloads only those via `baseUrl`. No
  unattended bulk pulls.
- **Google Takeout is the realistic Photos bulk path (high)** but is **manual**
  (no API): album-scoped `.zip` export, with EXIF/date in **separate JSON sidecar
  files** (`*.supplemental-metadata.json`) the pipeline must re-merge.
- **Gemini's `@Google Photos` extension is the one way to query existing Photos
  by content (medium).** It uses Google's **first-party internal access**, not the
  locked-down public API, so semantic search over the existing library works in
  the Gemini Android app. It cannot programmatically create albums/move files —
  the user taps the surfaced results into an album by hand. (Depth of reach
  varies; verify with a 5-minute real test before relying on it.)
- **Google Drive IS pullable from CI (high)** — but via an **OAuth refresh
  token**, NOT a service account (service accounts created after 2025-04-15 have
  no "My Drive" quota). The token can be generated from a **phone browser** via
  the OAuth 2.0 Playground.
  - Trap (high): the `drive.readonly` **restricted** scope's token **expires
    every 7 days** in OAuth "Testing" publishing status; going "Production" needs
    Google's CASA verification (months + cost). → Acceptable for a one-off gather
    *burst*; re-auth if a gather spans >1 week.
- **The Claude Google connector cannot do media triage (high).** The official
  Google Workspace connector reads **text** from Drive **documents** (Docs-first),
  works on mobile, but has **no Google Photos connector** and cannot fetch or
  operate on binary images. → The **AI vision sort is a CI pipeline job**, not a
  connector trick. (An official Google **Drive remote MCP server** exists but
  needs a paid Claude tier and is Developer Preview — not required here.)
- **Vision engine can be free + commercial-OK (medium-high).** A free Google AI
  Studio key (current **Gemini 2.x**, not the retiring 1.5) gives generous
  rate-limited vision calls returning JSON. Caveat: **free-tier inputs may be used
  by Google for training** — acceptable for portfolio art; documented for the
  operator.

## Architecture — the funnel

Thousands (messy) → hundreds (machine-culled) → finals (human-triaged). Three
stages, with a hard phone↔CI split:

```
                 PHONE (must be on-device)          │  CLOUD / GitHub Actions (the grind)
 ───────────────────────────────────────────────────┼──────────────────────────────────────
 Stage 1  COARSE CULL                                │
   Drive:  in Drive app, select by folder + date →   │
           drop candidates into ONE Drive folder     │
           "PortfolioPicks-raw"                       │
   Photos: in Gemini app, @Google Photos "find …" →   │
           tap results into a Photos album →          │
           Takeout that album → upload zip to Drive   │
           "PortfolioPicks-raw" (or a controlled spot)│
 ───────────────────────────────────────────────────┼──────────────────────────────────────
 Stage 2  AI VISION SORT                              │  CI pulls PortfolioPicks-raw (Drive
   (nothing — runs in CI)                             │  OAuth refresh token), unzips any
                                                      │  Takeout, re-merges JSON sidecars,
                                                      │  scores each item with Gemini 2.x
                                                      │  (portfolio-worthiness + tags +
                                                      │  near-dup/burst grouping) → ranked
                                                      │  manifest + a static CONTACT-SHEET
                                                      │  page, uploaded as a GitHub Actions
                                                      │  artifact (downloadable on the phone)
 ───────────────────────────────────────────────────┼──────────────────────────────────────
 Stage 3  HUMAN TRIAGE                                │
   Open the ranked contact-sheet artifact on phone,  │
   swipe top-down, tap keepers → writes a small       │
   "keepers" list back (see Triage hand-back)         │  CI pulls the keepers → hands the
                                                      │  finals to sub-project #3 (touch-up)
```

### Components (each one job, testable in isolation)

1. **`portfolio/README.md` (rewrite).** Replaces the Windows-PC instructions with
   the phone-only workflow: the Drive-folder cull, the Gemini `@Google Photos`
   recipe, and the Takeout steps. Pure docs; no code.

2. **Drive puller** (`tools/portfolio/pull-drive.mjs`, runs in CI). Input: OAuth
   refresh token + client id/secret (from sub-project #2 / GitHub secrets) + the
   `PortfolioPicks-raw` folder id. Output: raw media downloaded to a CI work dir.
   Uses Drive `files.list` + `files.get?alt=media`, readonly scope, exponential
   backoff on 403/429. Depends on: Google Drive API. Used by: the sort step.

3. **Takeout normalizer** (`tools/portfolio/normalize-takeout.mjs`). Input: an
   unzipped Takeout tree. Output: flat media files with EXIF/date re-merged from
   the `*.supplemental-metadata.json` sidecars. Depends on: nothing networked.
   Used by: the sort step. (Pure function + CLI → unit-testable with a fixture.)

4. **Vision sorter** (`tools/portfolio/sort-vision.mjs`). Input: a dir of media +
   a Gemini API key. Output: `manifest.json` — per item `{path, score, tags,
   dupGroup, reason}` ranked best-first. One injected `callModel(image)→json`
   boundary (mirrors `tools/eval-skills.mjs` / `tools/rag` style) so the core is
   testable with a fake model and tokenless in CI. Depends on: Gemini 2.x (free
   tier). Used by: the contact-sheet builder.

5. **Contact-sheet builder** (`tools/portfolio/build-sheet.mjs`). Input:
   `manifest.json` + thumbnails. Output: a self-contained static
   `contact-sheet/index.html` — a phone-friendly ranked grid with a tap-to-keep
   toggle per item. Deployed via the existing Actions→FTPS pipeline to a private
   path (e.g. `primordial.video/Test/picks/`). Depends on: nothing networked.

6. **Triage hand-back** (the keepers list). The contact sheet records keeper ids;
   the operator's selection must return to CI. *Mechanism = open question Q1.*

7. **Orchestration** (`.github/workflows/portfolio.yml`, `workflow_dispatch`).
   Chains puller/normalizer → sorter → sheet-builder; a second job pulls keepers
   → stages finals for sub-project #3.

## Data flow (one line)

`Drive folder / Takeout zip` → **CI pull + normalize** → **Gemini vision score** →
`manifest.json` → **static ranked contact sheet (phone)** → **tap keepers** →
`keepers.json` → **finals staged** → *(hand-off to #3 touch-up)*.

## Decisions locked

- Crossing = **Drive OAuth pull** (operator chose); accept 7-day token re-auth for
  a gather burst.
- Vision sort runs **in CI**, not on-phone Termux (reliability + free compute);
  engine = **Gemini 2.x free tier** (commercial-OK; training caveat noted).
- Photos coarse-cull = **Gemini `@Google Photos` (manual album build) → Takeout**.
- Android-native for everything that must touch the operator's account
  (auth, cull, triage); CI for the batch grind.
- Defaults carried from research: Proton Pass (secrets, #2), DepthAnything-V2
  Small / Apache-2.0 (depth, #3) — recorded here as seams, designed in their specs.

## Out of scope (own specs)

Touch-up model choices, depth maps, the portfolio page treatment, and the secrets
manager wiring. The Tasker real-time idea (sorts *future* captures, not the
backlog) is **parked** as a possible later "auto-organize new media" add-on.

## Open questions / risks

- **Q1 — triage hand-back mechanism.** How keepers chosen on the static contact
  sheet return to CI without a backend (the host is static PHP-only). Candidates:
  (a) the sheet builds a `keepers.txt` the operator copies into a GitHub
  issue/commit; (b) a tiny PHP endpoint writes the list; (c) re-run the workflow
  with a pasted keeper-id list. **Decide in the plan.**
- **R1 — Gemini Photos extension depth (medium).** Needs a real 5-min test before
  the Photos path is trusted; fallback is pure-Takeout + the CI vision sort doing
  the content filtering.
- **R2 — Drive token 7-day expiry.** Fine for bursts; if the operator wants a
  standing pipeline, revisit (CASA verification or a narrower flow).
- **R3 — Takeout size on a phone.** Album-scope the export to keep zips small;
  large multi-GB exports are painful on mobile.
- **R4 — video candidates.** Vision scoring of video = score a sampled frame;
  full video understanding is out of scope for v1.

## Success criteria

1. Operator can, from the phone alone, cull Drive + Photos candidates into one
   place without any desktop step.
2. A `workflow_dispatch` run produces a ranked contact-sheet delivered as a
   downloadable GitHub Actions artifact, openable on the phone, with near-dups
   grouped and obvious junk ranked last.
3. Operator taps keepers; the finals are staged for sub-project #3.
4. No commercial-licensing or privacy landmine: vision engine terms documented;
   no non-commercial model used; secrets via #2, never hard-coded.
