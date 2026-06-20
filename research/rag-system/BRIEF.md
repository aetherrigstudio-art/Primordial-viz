# Onboarding BRIEF — non-local RAG system (for the brainstorm)

**Status:** prep for a brainstorm. This is NOT a design — it assembles the context,
constraints, corpus, and open questions so the RAG brainstorm starts grounded.
**Method when resumed:** run `/brainstorming` (reason via `thought-based-reasoning`)
using this brief; decide the architecture WITH the operator before building.
**Parked thread:** `progress.md` → Open threads → "non-local RAG system".

## The want (from the operator, verbatim-ish)

A **hosted (non-local) retrieval system** that serves **THIS project's knowledge**
AND a **shared/global layer across the operator's other projects** (workflows/info
overlap and could be reused). Needs **separation + access gates** between
per-project and global scopes. Best architecture is **TBD — the operator is
unsure**, which is exactly what the brainstorm resolves. Likely **lives outside
this repo** (cross-project infra); parked here only because this is where the work
has been happening.

## Why now / why it matters

- The agent-workshop has produced a lot of durable knowledge (rules, skills,
  research reports, specs/plans, handoffs). Today it's only retrievable by an agent
  that's already in this repo.
- The operator runs **multiple projects** with overlapping workflows; a global
  layer would let lessons/skills/patterns be reused across them.
- Several threads already point here: the FMHY `links.json` was deliberately
  **shaped to feed a RAG**; the comparison research flagged knowledge-reuse; the
  `/insights` report pushed toward a knowledge "guardian."

## Current state — what retrieval exists (build-on or replace?)

- **In-repo keyword search** (local MCP `primordial`, `tools/mcp/lib/docs.mjs`):
  `searchDocs()` + `getDoc()` over the repo's own markdown — **substring/keyword
  scoring, NO embeddings, no vector store** ("no vector store needed at this
  scale"). Lexical only; in-repo only; not hosted; no global layer.
- **Context7 MCP** — retrieval over *external library docs* (third-party hosted
  service). Useful precedent for "MCP-as-retrieval-surface," but it's not our KB.
  ⚠️ Privacy: queries leave the machine — public-doc only, never proprietary code.
- **mdn MCP** — same shape, web-platform docs.
- **No embeddings, vector DB, or RAG of our own anywhere** (verified: no
  vector/embed/RAG deps in `package.json`; no such files tracked).

## The corpus — what a per-project layer would ingest (this repo)

~40 markdown knowledge files already exist and are the natural corpus:
- **Always-on / routing:** `CLAUDE.md`, `AGENTS.md`, `ONBOARDING.md`,
  `.claude/skills-router.md`, `.claude/workflows.md`.
- **Generated indexes:** `ENCYCLOPEDIA.md` (per-file), `TREE.md` (layout).
- **Rules (load-bearing):** `.claude/rules/{shaders,audio,deploy,mobile-ergonomics,gotchas}.md`.
- **Skills:** 32 × `SKILL.md` (+ some reference docs).
- **State / handoffs:** `progress.md`, `task_plan.md`, `.claude/ROADMAP.md`,
  `.claude/TODO.md`, `findings.md`.
- **Specs/plans:** `docs/superpowers/{specs,plans}/*.md`, `docs/BUILD-SPEC.md`,
  `docs/STANDALONE.md`, `deploy/DEPLOY.md`.
- **Research deliverables:** `research/claude-repo-comparison/*`,
  `research/product-domain-comparison/REPORT.md`, `research/findings/*`,
  `research/fmhy-dev-tools/{links.json,CATALOG.md,SHORTLIST.md}`.
- (Exclude `research/corpus/` — external scrape, not our knowledge — as the MCP
  search already does.)

The **global layer** corpus is whatever overlaps across the operator's other
projects (TBD — the operator must enumerate which projects/knowledge are in scope).

## Load-bearing constraints (judge every option against these)

- **Cloud/phone continuity:** the dev container is ephemeral + **HTTPS-443 only**;
  durable in-repo state = **git only**. A hosted RAG therefore needs its **own
  persistence** (it can't live in the container) and must be reachable over 443.
- **Phone-driven operator:** setup/secrets steps must be phone-doable (one value
  per code block; prefer actions the agent can do from the container or via GitHub
  state) — see `.claude/rules/mobile-ergonomics.md`.
- **Commercial-safety / privacy:** Primordial is commercial; **proprietary shader
  code + secrets must not leak** to a third-party embedder/store. This strongly
  shapes hosted-vs-self-hosted and which embedder.
- **Cost + maintenance:** the operator favors lean, low-/zero-infra, low-upkeep
  (cf. the repo's git-only, zero-runtime-dep ethos). Avoid a heavy stack.
- **Secrets never in committed artifacts** (API keys live in GitHub/host secrets).

## Open architecture questions the brainstorm MUST resolve

1. **Scoping / namespaces** — how per-project vs global are separated (separate
   indexes? metadata-tagged namespaces in one store? collection-per-project?).
2. **Gate / permission model** — who/what can read each scope; how a project-scoped
   agent is prevented from reading another project's private knowledge; auth model.
3. **Store** — hosted vector DB vs self-hosted vs "no vector store" (keep lexical/
   hybrid). Candidates to weigh, NOT decide: pgvector (Supabase/Neon), Turso +
   sqlite-vec, Chroma Cloud, Pinecone, LanceDB, or a lexical/hybrid index (e.g.
   sqlite FTS) if embeddings are overkill.
4. **Embedder** — hosted (OpenAI/Voyage/Cohere) vs local; the privacy constraint
   (don't send proprietary code to a third party) is decisive here.
5. **Ingestion + sync** — how repo docs get in and stay fresh: a git/CI hook on
   push? a re-index command? chunking strategy (per-heading, like `getDoc`
   sections)? how the global layer is fed from multiple repos.
6. **Surface** — does it present as an **MCP server** (consistent with our existing
   MCP tools), a CLI, an HTTP endpoint, or several? How an agent queries it.
7. **Where it lives** — a separate repo / service (likely), and how this repo
   points at it without coupling.

## Success test (a good brainstorm outcome)

A chosen architecture that: (a) cleanly separates per-project vs global with a real
gate; (b) ingests this repo's corpus and stays in sync with low upkeep; (c) honors
the commercial/privacy + phone/cloud constraints; (d) has a clear query surface
(probably MCP); (e) is the **smallest thing that delivers** — and a spec written to
`docs/superpowers/specs/`. Decide build-now vs roadmap-later.

## Out of scope for the brainstorm

- Actually building it (that follows the spec/plan).
- Re-deciding the in-repo keyword search (it can remain the local fast path /
  fallback; the brainstorm decides whether the RAG supersedes or complements it).
