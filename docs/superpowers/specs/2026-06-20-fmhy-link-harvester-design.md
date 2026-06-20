# Spec — FMHY Developer-Tools link harvester + catalog

**Date:** 2026-06-20 · **Status:** approved, ready for plan.
**Source:** `https://fmhy.net/developer-tools` (FreeMediaHeckYeah "Developer Tools"
index — resolved from the operator's `share.google` link).

## Problem / goal

Turn the FMHY Developer-Tools index into a **structured, reusable catalog**, then
derive useful outputs from it — without an unbounded recursive crawl. End use is
"broad," so build the **catalog substrate once** and derive every use from it.

## Constraints (load-bearing)

- **No crawler infra.** WebFetch is one-URL-at-a-time, small-model extraction,
  15-min cache. Feasible: the index source + a *capped* set of tool pages. Not
  feasible: crawling every linked site recursively.
- **Commercial-safety / write-our-own posture.** FMHY *broadly* is
  piracy-adjacent. The dev-tools section is mostly legit, but harvesting must
  **flag + exclude** any piracy / warez / NSFW / cracked-software entries (by
  keyword + domain denylist) — never ingest them. This is a hard rule.
- **HTTPS-443 only** container (web fetch works; no other egress).
- **No app/runtime code** changes — this is a research artifact + one `tools/`
  script. Lives in `research/fmhy-dev-tools/`.
- `npm run health` stays green (render.png drift excepted).

## Architecture — 3 layers, substrate-first

### 1. Harvest (the engine) — deterministic, 1 fetch
The FMHY site is a client-rendered SPA; its real content is **markdown on GitHub**.
So the harvester targets the **raw markdown source** of the dev-tools page (resolve
the exact `raw.githubusercontent.com/fmhy/...developer-tools.md` URL during
implementation step 1), not the SPA HTML.

`tools/harvest-links.mjs` (reusable; takes any markdown index URL):
- Fetch the raw markdown (Node `fetch`, HTTPS).
- Parse deterministically: `##`/`###` headings → `category`; list items
  `- [Name](url) - blurb` → entries `{name, url, category, blurb}`.
- Normalize + dedup by URL.
- **Safety gate:** mark `excluded:true` + `reason` for any entry whose blurb/URL
  matches a denylist (piracy/warez/crack/keygen/nsfw/torrent-of-content, etc.).
- Tag `relevant_to_primordial:true` for entries in project-relevant categories
  (hosting/CDN/static, graphics/WebGL/GLSL, audio, assets/textures/fonts, CI,
  performance, image/video tooling, deploy).
- Emit `research/fmhy-dev-tools/links.json` (the structured catalog).

### 2. Enrich (bounded, gated) — optional, capped, follow-on
For a **capped subset** (the project-relevant picks, ≤ ~25), an agent WebFetches
each tool's homepage for a 1–2 line "what it is" + cost/license, **depth-1 only**,
skipping `excluded` entries. NOT part of the first deliverable beyond the
shortlist picks — kept small so it can't explode.

### 3. Derive uses (from `links.json`)
- **(a) Full reference:** `research/fmhy-dev-tools/CATALOG.md` — all non-excluded
  entries grouped by category, with FMHY's blurb + link.
- **(b) Project shortlist:** `research/fmhy-dev-tools/SHORTLIST.md` — the
  `relevant_to_primordial` entries, ranked, each with cost/license note + one line
  "why it helps Primordial." The immediately-useful output.
- **(c) RAG-ready:** `links.json` schema is documented so the parked non-local RAG
  thread can ingest it later without rework.

## Data schema (`links.json`)

```json
{
  "source": "fmhy-dev-tools",
  "source_url": "https://fmhy.net/developer-tools",
  "fetched_at": "2026-06-20",
  "entries": [
    {
      "name": "string",
      "url": "string",
      "category": "string",
      "blurb": "string (FMHY's own description)",
      "tags": ["string"],
      "relevant_to_primordial": true,
      "excluded": false,
      "exclude_reason": null
    }
  ]
}
```

## Deliverables (first slice)

- `tools/harvest-links.mjs` — reusable markdown-index parser (input: md URL).
- `research/fmhy-dev-tools/links.json` — structured catalog.
- `research/fmhy-dev-tools/CATALOG.md` — full reference (non-excluded, by category).
- `research/fmhy-dev-tools/SHORTLIST.md` — ranked project-relevant picks.
- `research/fmhy-dev-tools/README.md` — json schema, how to re-run, RAG-readiness,
  the safety-gate policy, and an excluded-count summary.

## Definition of done

- Harvester runs, produces valid `links.json` (parses; entry count > 0).
- `CATALOG.md` lists the non-excluded entries by category; `SHORTLIST.md` has the
  project-relevant picks with why-relevant + cost/license.
- Safety gate demonstrably excludes flagged entries (excluded count reported in
  the README; spot-check a couple).
- Committed + pushed to `claude/onboarding-hxwhw6`; `npm run health` green
  (render.png excepted). `SHORTLIST.md` delivered to the operator via SendUserFile.

## Out of scope (follow-on)

- Deep recursive crawl of every external site (depth > 1, uncapped).
- Actual RAG ingestion (separate parked thread; this only shapes the data for it).
- Enrichment beyond the shortlist picks.
- Harvesting FMHY sections other than Developer-Tools.
