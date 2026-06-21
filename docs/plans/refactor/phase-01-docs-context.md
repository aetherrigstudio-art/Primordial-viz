# Refactor Phase 1 — Docs / context

Concern: the narrative/handoff docs (not the rules or hooks — those are phases 2/3).
Evidence gathered read-only this session; load-bearing claims re-verified (cited).

## Problem
- **`progress.md` is an append-only 1079-line log** (`wc -l progress.md` → 1079) used
  as the durable handoff. It grows ~100–200 lines/session and its **top entry is stale
  vs git** (top = "Drive handoff" milestone; newest commits `aa75254`/`3b9ed66` have no
  entry). A fresh agent can't quickly find the real "next step." FACT.
- **Two `task_plan.md` files** — root (active, project-wide) and
  `docs/plans/studio-refactor/task_plan.md` (a different sub-project plan). `CLAUDE.md`
  `@import`s only the root, but the duality confuses newcomers. FACT.
- **`docs/BUILD-SPEC.md` self-contradicts**: a top "BUILT DIFFERENTLY" banner says
  shaders ship as `src/shaders/*.js`, but the body (`:84`, `:133`) still describes
  `*.glsl` fetched at runtime. FACT.
- **Phone-operator framing throughout** (`ONBOARDING.md:58` lists "Phone-driven
  operator" as a *non-negotiable*; `ROADMAP.md:4,8`, `TODO.md:6`, `CLAUDE.md:115,150`,
  `task_plan.md:75-78`) — contradicts **ADR-006** (phone-dev retired). FACT.
- **Public/private contradiction** in narrative docs (`progress.md` says "repo is
  private") while the repo is public — tracked by **ADR-005**; the email PII in
  `research/claude-repo-comparison/BRIEF.md:4` is the unconditional fix. FACT.

## Solution
Make the docs small, current, and consistent with reality + ADR-005/006.
1. **Split `progress.md`** → a short rolling `HANDOFF.md` (latest state + next step,
   capped) + an append-only `docs/progress-archive/` for old entries. Update the
   `precompact-handoff` hook + `CLAUDE.md` `@import` to point at the capped file.
2. **Clarify the two plans**: rename `docs/plans/studio-refactor/task_plan.md` intent in
   its header, and add a one-line pointer in the root `task_plan.md` so the relationship
   is explicit.
3. **Resolve `BUILD-SPEC.md`**: convert it to a clearly-labelled *historical* doc (move
   to `docs/history/`) OR rewrite the body to as-shipped — pick one, no half-state.
4. **Scrub phone framing** from these narrative docs per ADR-006 (coordinate wording
   with phase 2 so it's consistent).
5. **Reconcile public/private** wording once ADR-005 is ratified; redact the email now
   regardless (the redaction itself lives in phase 6/security, referenced here).

## Commits (tiny, each leaves repo green)
1. Add `docs/progress-archive/` + move all but the newest N entries; leave a pointer. 
2. Repoint `@import` + `precompact-handoff` hook to the capped handoff file.
3. Header note linking root ↔ studio-refactor `task_plan.md`.
4. Relocate/relabel `BUILD-SPEC.md` (single commit).
5. Phone-framing scrub in ONBOARDING/ROADMAP/TODO/CLAUDE narrative lines.

## Decision doc / ADRs
- **Proposed ADR-007: progress.md archival strategy** (rolling-cap vs full-archive vs
  status-quo) — expensive-ish to reverse (touches the hook + import contract).
- Defers to **ADR-005** (public/private) and **ADR-006** (phone-dev) — no new decision
  there, just execution.

## Testing
- `node tools/gen-docs.mjs --check` green (drift gate; refs resolve).
- `grep -rinE 'phone|laptop-free|one value per' ONBOARDING.md ROADMAP.md TODO.md` → only
  intentional (e.g. "build on a real machine, not a phone" about Tauri) remains.
- A fresh-agent read test: the capped handoff answers "what's the next step" in <30 lines.

## Out of scope
- The `.htaccess` `.glsl` MIME drift (phase 6/deploy). The RAG index rebuild (phase 8).
- The actual re-platform/target-stack (still undecided; not this phase).
