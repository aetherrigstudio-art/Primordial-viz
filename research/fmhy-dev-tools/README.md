# FMHY Developer-Tools harvest

A structured, safety-gated catalog of the **FMHY "Developer Tools"** index
(`https://fmhy.net/developer-tools`), plus a Primordial-relevant shortlist.
Spec: `docs/superpowers/specs/2026-06-20-fmhy-link-harvester-design.md`.

## Files

- `source.md` — the raw FMHY developer-tools markdown (snapshot; the input data).
- `links.json` — the structured catalog (see schema below).
- `CATALOG.md` — human-readable catalog, grouped by category (excluded entries omitted).
- `SHORTLIST.md` — the curated, enriched **Primordial-relevant** picks (the deliverable).

## Current numbers (2026-06-20)

- **1576** entries across **52** categories.
- **6 excluded** by the safety gate (piracy / nulled / warez etc.) — never shown in
  `CATALOG.md`/`SHORTLIST.md`.
- **268** tagged `relevant_to_primordial`; the shortlist distils these to **18** vetted picks.

## How to re-run

```bash
# 1. refresh the source snapshot (when FMHY updates)
curl -sSL https://raw.githubusercontent.com/fmhy/edit/main/docs/developer-tools.md \
  -o research/fmhy-dev-tools/source.md
# 2. regenerate links.json + CATALOG.md
node tools/harvest-links.mjs research/fmhy-dev-tools/source.md research/fmhy-dev-tools
```

The harvester (`tools/harvest-links.mjs`) is **reusable** on any markdown link-index
(`node tools/harvest-links.mjs <source.md> <outDir>`). It extracts **every**
`[name](url)` on each list-item line (FMHY puts several tools per line), assigns the
line's heading as `category` and its trailing prose as `blurb`, dedups by URL, and
tags each entry. Unit test: `node test/harvest-links.test.mjs`.

## `links.json` schema

```json
{
  "source": "fmhy-dev-tools",
  "source_url": "https://fmhy.net/developer-tools",
  "fetched_at": "YYYY-MM-DD",
  "entries": [
    {
      "name": "string",
      "url": "string",
      "category": "string (from the nearest heading)",
      "blurb": "string (FMHY's own trailing description)",
      "tags": ["string"],
      "relevant_to_primordial": true,
      "excluded": false,
      "exclude_reason": "string|null"
    }
  ]
}
```

## Safety-gate policy (mandatory)

FMHY *broadly* is piracy-adjacent; the dev-tools section is mostly legit. The
harvester flags any entry whose name/url/blurb/category matches a denylist
(`piracy|pirated|warez|crack|keygen|nulled|torrent|nsfw|porn|xxx|adult`) as
`excluded:true` with a reason. Excluded entries are **never** surfaced in the
catalog or shortlist — consistent with the repo's commercial / write-our-own
posture. A piracy-*named category* therefore excludes its whole section (intended).

## Scope / boundaries

- **Enrichment is bounded:** the shortlist's "what it is / license" notes came from a
  **capped (≤25), depth-1** WebFetch of each pick's homepage — no deeper crawl.
- **Out of scope (parked follow-ons):** a deep recursive crawl of every linked site;
  actual RAG ingestion. `links.json` is shaped so the parked non-local RAG thread can
  ingest it later without rework.
