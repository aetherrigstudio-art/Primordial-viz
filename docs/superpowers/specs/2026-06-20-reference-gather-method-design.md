# Design — reference-gathering method ("refgather")

> Brainstorming/design output (the chain: deep-research → **brainstorming** →
> writing-plans). Companion plan: `docs/superpowers/plans/2026-06-20-reference-
> gather-method.md`. Grounded in `research/landing-page-rag/dynamic-canvas-deep-
> research.md` (the cited research) and the existing `reverse-engineering-
> targets.md` / `references.md`.

## Problem

We're building primordial's frontpage as a dynamic, full-page WebGL canvas using
point clouds, Gaussian splats, and depth maps. To do that well we need to
**reverse-engineer** (study-and-rebuild, never copy) top-tier reference pages and
the technique behind them. Today that gathering is ad-hoc: reels come in, an agent
eyeballs them, notes land in scattered files. We want a **repeatable method** that
turns "here's a reference" into durable, retrievable, license-tagged craft
knowledge an agent can pull when building.

## Goals / non-goals

**Goals.** A small, mostly-reuse pipeline that: (1) discovers reference pages/
demos/videos; (2) captures them (visual + archival) without shipping third-party
assets; (3) extracts an **our-own-words recipe** (the technique + stack + license)
per reference; (4) stores those notes in the existing RAG so retrieval is rich and
provenance-tagged; (5) keeps a human-readable swipe-file catalog.

**Non-goals.** No splat training. No copying bundles/GLSL/assets into the product.
No heavy archive infrastructure (no ArchiveBox/Zotero server). No new runtime deps
on the web path — this is dev-tooling only. Not an automated "study a live site for
you" bot — the deep Spector.js/DevTools study is a guided manual step.

## The pipeline (Discover → Capture → Extract → Store/Index)

Reuse first; one small new tool at most.

**1. Discover** → a committed `research/landing-page-rag/references.json` catalog,
each entry `{ id, url, title, type, tags[], license, status, note }` where
`type ∈ {page, demo, tutorial, repo, video, gallery}`. Seeded from: the existing
link harvester (`tools/harvest-links.mjs`), targeted `WebSearch`, the curated
galleries (Awwwards /webgl, FWA, Godly, Codrops, Httpster, Land-book), and reels
the operator shares.

**2. Capture** (branch by `type`, output **gitignored** under
`research/landing-page-rag/corpus/`):
- `video` → **reel-ingest** (existing) → frame montage.
- `page`/`demo`/`gallery` → **Playwright** (already a devDep) full-page screenshot
  → `corpus/shots/<id>.png`; optional rendered-DOM save via `page.content()`.
- `tutorial`/`repo` (mostly static text) → **WebFetch**→markdown, or **monolith**
  (CC0) for an offline self-contained HTML if we want archival.
- optional permanence → **Wayback SPN2** (record the returned snapshot URL back
  into the catalog).

**3. Extract** → a committed **our-own-words note** `research/landing-page-rag/
notes/<id>.md` per reference: 1–3-sentence summary, the **reverse-engineered
recipe** (pass count / technique / render scale / scroll-or-audio coupling /
detected stack), `source_url`, `license`, `tags`, capture date. The note — never
the saved HTML/asset — is the durable artifact (same precedent as reel montages
being gitignored while takeaways are committed).

**4. Store/Index** → the `notes/*.md` join the existing **chunk → MiniLM →
`tools/rag/index.json`** RAG automatically (they're tracked `.md` in the corpus);
rebuild the index after committing. `references.json` stays the human swipe-file.
Each chunk keeps the `{scope, project}` seam; we add `source_url, license, tags` to
the note front-matter so provenance is retrievable.

## The reverse-engineering playbook (the manual study step)

Captured per `research/landing-page-rag/dynamic-canvas-deep-research.md §4`:
stack-ID (Wappalyzer → confirm `THREE.REVISION`/`gsap`/Lenis/ogl in DevTools) →
confirm WebGL2 context → Network sweep for asset formats/sizes → **Spector.js**
frame capture (read pass structure + beautified GLSL) → scene-graph inspect →
read de-minified source for the *technique*, then **rebuild from a blank file** →
write the recipe in our own words. The load-bearing rule: study the recipe; never
copy bundle text, GLSL, `.glb`/textures/video into the product.

## Key decisions

1. **Reuse over new tooling.** Playwright (have it), reel-ingest (have it), link
   harvester (have it), markdown RAG (have it), WebSearch/WebFetch (have them).
   The only candidate new tool is **monolith (CC0)** for offline static-page
   archival — and even that is optional. **No AGPL/GPL code vendored** (SingleFile/
   gowitness/Zotero run as external tools only, if ever).
2. **Committed = notes + catalog; gitignored = raw captures.** Keeps the repo lean
   (inode budget), dodges third-party-asset licensing, and matches the reel-ingest
   precedent. The RAG indexes *our words*, not scraped HTML.
3. **License is a first-class field** on every entry and note. Given the research's
   licensing traps (Inria 3DGS non-commercial; Depth-Anything-V2 split; Shadertoy
   CC-BY-NC-SA; per-model CC on galleries), an un-licensed reference is "study-only
   until verified."
4. **Mobile/cloud-friendly.** Everything runs from the HTTPS-only container or a
   phone-driven Codespace; deliver visuals with `SendUserFile`, not `file://`.
5. **Scope seam preserved** so this corpus can later join the global RAG layer.

## Open questions (surface, don't block)

- **Auto vs guided capture.** Should an orchestrator script batch-capture the whole
  `references.json` (screenshots + note stubs), or stay one-at-a-time on demand?
  (Lean: a thin batch script for screenshots + note *stubs*; the recipe is written
  by hand/agent after the manual Spector study.)
- **monolith yes/no.** Install it for archival, or rely on Playwright + Wayback?
  (Lean: skip until a real need; Playwright + WebFetch cover study.)
- **Catalog vs reuse `links.json`.** New `references.json`, or extend the harvester's
  existing `links.json` shape? (Lean: a focused `references.json` for this corpus;
  the harvester can feed it.)

## Definition of done (for the method itself)

A documented, partly-scripted pipeline: a `references.json` schema + seed, a note
template, a thin Playwright capture helper, the playbook doc in the corpus, and a
worked example (one reference taken end-to-end into a committed note that the RAG
retrieves). Then any future "here's a reference" reliably becomes retrievable craft.
