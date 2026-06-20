# BRIEF — buff the RAG with landing-page craft context (for the next container)

> Self-contained task for a fresh agent. Goal: give future agents strong,
> retrievable reference knowledge for building a **top-tier ("Fable-5-level")
> landing page** for primordial / the artist, so that asking the RAG "how do I
> build a great landing page" returns rich, actionable craft — not generic advice.

## Why

The repo already has the seeds: a `workshop/sketches/frontpage/BRIEF.md`
(landing-page visual brief), the `reel-ingest` tool (turn a reference video into a
frame montage an agent can see), and the in-repo semantic RAG (`tools/rag/`,
surfaced via the MCP `semantic_search`). What's missing is **curated craft
knowledge** in the corpus: the patterns, structure, motion, and copy that separate
a default-looking page from a top-tier one. Today an agent building the frontpage
has the visual instrument's knowledge but little landing-page-specific reference.

## Scope (what to add)

Curate concise, **our-own-words** reference notes under `research/landing-page-rag/`
(committed `.md`, so they enter the RAG corpus) covering:

- **Structure & conversion:** hero/above-the-fold anatomy, narrative order, single
  clear CTA, social proof, performance-as-UX (LCP/CLS), progressive disclosure.
- **Motion & feel:** tasteful scroll/reveal, reduced-motion respect, WebGL/canvas
  accents that fit the "grungy-future-geometric-slimy" identity without wrecking
  the mobile perf budget (reuse `.claude/rules/shaders.md`).
- **Type & layout:** distinctive type pairing, spacing rhythm, grid, dark-mode
  neon-HUD aesthetic (tie to the existing `frontend-design` skill).
- **Copy:** voice for an electronic-music visual artist; concise, confident.
- **Reference gathering:** use `reel-ingest` + web reference search (reference-only
  per the **write-our-own / commercial-licensing** rule — study, never copy) to
  pull award-site examples into frame montages for study; record takeaways as notes,
  not assets.

## Approach

1. Brainstorm → spec → plan (the standard chain). Decide the note taxonomy + how
   chunks should be tagged (reuse the `{scope, project}` chunk seam).
2. Write the curated notes (`.md`), keeping each focused (good RAG chunks).
3. Rebuild the index **after committing** the new docs (`npm run rag:index`; see
   the gotcha — `docFiles()` lists git-tracked `.md`, and rebuild must run *after*
   `gen-docs` so corpus `.md` are final).
4. Verify retrieval: probe queries ("hero section", "landing page motion",
   "frontpage copy") should surface the new notes in the top results
   (`tools/rag/retrieve.mjs` / `probes.mjs`).

## Guardrails

- **Reference-only / write-our-own** (commercial work): learn from any source,
  author every asset + line from scratch; only reuse MIT/CC0/CC-BY with attribution.
- **Mobile perf budget** still applies to any landing-page WebGL/canvas.
- **Privacy:** nothing AI/tooling-fingerprinted ships in the deployed page
  (`.claude/rules/deploy.md`).

## Definition of done

Curated landing-page craft notes committed under `research/landing-page-rag/`, in
the RAG index, and verified to surface for landing-page probe queries — so the next
agent building the frontpage gets strong, specific context on demand.
