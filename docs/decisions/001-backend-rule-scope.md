# ADR-001: "PHP-8-only backend" is scoped to the Namecheap host + web path

## Status
Accepted

## Date
2026-06-20

## Context

The repo carries a load-bearing rule (`CLAUDE.md`, `.claude/rules/deploy.md`):
**"Backend = PHP 8 only — never Node/Python; zero runtime dependencies on the web
path."**

A second subsystem then appeared — commit `41454da7` ("Add Claude Opus 8 + setup
plan and skeleton", on `claude-opus8-setup`, merged to `main`): a RAG retrieval
server (FastAPI + Pinecone + cloud embeddings) that an Android client calls, with
its own `.env.example`. Its Python/Pinecone stack appears to violate the
"PHP-8-only / zero-dep" rule, which raised the question: **should we amend (loosen)
the rule?**

The rule exists for three specific reasons:
1. **Host limits:** Namecheap Stellar Plus (cPanel/LiteSpeed) runs Python/Node only
   via Phusion Passenger, which fights the **EP=30 / 2 GB** cap. Non-PHP backends
   genuinely break *on that host*.
2. **The gig web path** (`index.html` → `src/`, raw WebGL2) must stay
   dependency-free and mobile-fast.
3. **Commercial-licensing** cleanliness of the shaders.

None of those three are about a *separate* backend service hosted elsewhere.

## Decision

**Do not loosen the rule. Clarify its scope.**

The "PHP-8-only / zero-dep" rule **governs the Namecheap-hosted web path + the
static deploy** — what runs on Stellar Plus and what ships to `primordial.video`.

A **separate service** (e.g. the Opus-8 AI/RAG backend) **may** use its own stack
(Python/FastAPI/etc.) on its **own infrastructure** (Render / Fly / Cloudflare /
a VPS — *not* Namecheap), under two hard conditions:
1. It is **never coupled into the gig web path** or the static deploy.
2. It **adds no runtime dependency** to `index.html` / `src/`.

## Consequences

- The rule stays strong where it matters (the host + the web path); it no longer
  reads as a blanket ban that a separate service would "violate."
- The Opus-8 server, **if built**, needs its own host regardless — putting it on
  Namecheap would hit the exact Passenger limits the rule warns about.
- A separate, larger architecture question remains open (NOT decided here):
  **Pinecone + cloud embeddings vs the existing local `tools/rag/`.** The Opus-8
  plan sends document text to a cloud vector DB + embedding API, which contradicts
  the **local-embedder, zero-egress** privacy posture already established for
  `tools/rag/`, and partially duplicates it. Reuse-local-RAG should be evaluated
  before committing to Pinecone. Track as a follow-up.

## Alternatives considered

- **Amend/loosen the rule to allow Python/Pinecone backends generally** — rejected:
  it would weaken a rule that correctly protects the host and the web path, to
  accommodate a service that shouldn't run on that host anyway.
- **Forbid the Opus-8 server outright** — rejected: out of scope; the stack/host
  choice for a separate service is a product decision, not a web-path rule.
