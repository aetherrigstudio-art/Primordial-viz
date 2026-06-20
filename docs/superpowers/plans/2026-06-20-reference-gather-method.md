# Plan — build the reference-gathering method ("refgather")

> writing-plans output (chain: deep-research → brainstorming → **writing-plans**).
> Spec: `docs/superpowers/specs/2026-06-20-reference-gather-method-design.md`.
> Research: `research/landing-page-rag/dynamic-canvas-deep-research.md`.
> Execute via subagent-driven-development (fresh implementer + reviewer per task);
> **awaits operator "go"** — this plan is the deliverable of the current chain.

## Scope

Build a small, mostly-reuse pipeline that turns a reference (page/demo/video/repo)
into a committed, license-tagged, our-own-words note the RAG can retrieve. Dev-
tooling only; zero new runtime deps on the web path. No splat training; no copying
third-party assets/code.

## Constraints / guardrails (carry into every task)

- **Committed = notes + catalog; gitignored = raw captures** (screenshots, saved
  HTML, montages) under `research/landing-page-rag/corpus/`.
- **License is a required field**; un-licensed → "study-only until verified."
- **Reuse** Playwright, reel-ingest, link harvester, markdown RAG, WebSearch/Fetch.
  **No AGPL/GPL code vendored.** monolith (CC0) only if a real archival need.
- **RAG index hygiene** (gotcha): commit new `.md` first, then `npm run rag:index`,
  then commit the index; run `gen-docs` before the index rebuild.
- Verify with `npm run health` after each task; keep `references.json` valid JSON.

## Tasks

### Task 1 — Catalog schema + seed
- Add `research/landing-page-rag/references.json`: array of
  `{ id, url, title, type, tags[], license, status, note, snapshot? }`
  (`type ∈ page|demo|tutorial|repo|video|gallery`; `status ∈ seed|captured|noted`).
- Seed it from the references already gathered this chain: the 8 reels
  (`references.md`), the reverse-engineering targets, and the galleries + key repos
  from the deep-research report (Spark, r3f-scroll-rig, akella/fake3d, Potree,
  Codrops tutorials, Awwwards/FWA/Godly/Codrops/Httpster/Land-book).
- **Verify:** valid JSON; every entry has a `license` (or `unverified`); `node`
  parses it.

### Task 2 — Note template + one worked example
- Add `research/landing-page-rag/notes/_TEMPLATE.md` (front-matter: `source_url`,
  `license`, `tags`, `captured`; body: Summary / Recipe / Stack / Takeaways).
- Take **one** reference end-to-end (recommend `14islands/r3f-scroll-rig` or
  akella/fake3d) into `notes/<id>.md` using the playbook — our own words only.
- **Verify:** note committed, then `npm run rag:index`; probe query retrieves it
  in the top results (`tools/rag/retrieve.mjs`).

### Task 3 — Thin Playwright capture helper
- Add `tools/refgather/capture.mjs` (dev-tooling): given a `references.json` id (or
  `--all`), open the URL in the existing Playwright Chromium, save a full-page
  screenshot to `corpus/shots/<id>.png` (gitignored), and emit a `notes/<id>.md`
  **stub** from the template with metadata pre-filled. Reuses the render-check
  Playwright setup; no new dep. Skips `type: video` (→ reel-ingest) and dead URLs
  gracefully.
- Add `corpus/` to `.gitignore` (mirror `workshop/artifacts/`).
- **Verify:** runs headless in-container on 1–2 seed entries; produces a PNG + a
  stub; `node --check`; unit-test the pure arg/slug/stub helpers
  (`test/refgather.test.mjs`).

### Task 4 — Playbook + README in the corpus
- Add `research/landing-page-rag/GATHER.md`: the end-to-end method (Discover →
  Capture → Extract → Store/Index) + the reverse-engineering playbook (DevTools /
  Spector.js / stack-ID / "rebuild from blank") + the licensing decision rules,
  cross-linking the deep-research report. Concise, focused headings (good chunks).
- Update `research/landing-page-rag/README.md` index to list the new pieces.
- **Verify:** `gen-docs --check`; backtick paths exist (drift gate); links resolve.

### Task 5 — Wire into discovery + index, close the loop
- Optional: a tiny `npm run refgather:seed` that runs the link harvester over a
  galleries list and merges new `{url,title}` into `references.json` as `status:
  seed` (dedupe by URL). (Defer if it adds churn — note as parked.)
- Final: `npm run docs` → commit notes → `npm run rag:index` → commit index →
  `npm run health` green.
- **Verify:** `npm run health` all gates; 2–3 probe queries ("scroll-rig DOM
  proxy", "depth parallax fake 3D", "gaussian splat renderer mobile") surface the
  new notes.

## Verification gates (whole-branch)

- `npm run health` green (syntax, smoke, audit, docs+drift, RAG drift, config,
  eval-skills).
- `node --test test/refgather.test.mjs` (+ existing `test/rag.test.mjs` probes).
- A worked example note retrievable via `semantic_search` / `retrieve.mjs`.
- Whole-branch review (opus) before merge; no third-party assets committed; no
  AGPL/GPL vendored.

## Out of scope (parked)

- monolith install + offline archival (add only on real need).
- Wayback SPN2 automation (needs an archive.org account).
- A batch "auto-study a live site" agent (the Spector.js study stays guided).
- Global/cross-project RAG layer (separate parked thread).

## Rollout

Subagent-driven-development, Tasks 1→5, fresh implementer + reviewer each, verify
per task, whole-branch review at the end. Net new surface: `references.json`,
`notes/`, `tools/refgather/capture.mjs`, `GATHER.md`, one test — everything else is
reuse.
