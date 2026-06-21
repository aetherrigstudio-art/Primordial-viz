# Refactor Phase 6 — Security / privacy / deploy

Concern: secrets/PII, the deployed-site privacy surface, the deploy pipeline. Several
items controller-verified directly this session; cite `file:line`.

## Problem
- **Operator email committed (PII, public repo)** — `research/claude-repo-comparison/BRIEF.md:4`
  and (chunked) `tools/rag/index.json:1474`. The repo is **public** (GitHub API
  `private:false`). Unconditional fix regardless of the ADR-005 posture. FACT (verified).
- **Auto-deploy is dead** — `.github/workflows/deploy.yml:15` triggers on
  `claude/review-claude-md-di5jvm`, **absent on remote** (`git branch -a`). Only manual
  `workflow_dispatch` fires. FACT (verified).
- **Public/private posture is contradictory** — docs/rules assume private; repo is public.
  Tracked by **ADR-005** (operator's call: go private+proprietary vs public+open). FACT.
- **`.htaccess` vestigial MIME** — `deploy/.htaccess:27-29` adds `.glsl/.frag/.vert`
  types for files that no longer exist (shaders are `.js`). Harmless but stale. FACT.
- **Deployed-site privacy** is otherwise OK (verified prior sessions): `Options -Indexes`
  + dotfile deny present; the only `fetch()` is same-origin look JSON; no AI endpoint.
- (Desktop CSP / Cargo license security items → phase 7; RAG/CI-red → phase 8.)

## Solution
1. **Redact the email** in both files (replace with a role label like "operator"); since
   the repo is public + history carries it, note that a true scrub needs history rewrite
   — decide scope under ADR-005.
2. **Fix the deploy trigger**: point `deploy.yml` `push.branches` at the real
   deploy branch (or `main`), or drop the push trigger and keep `workflow_dispatch` only.
3. **Resolve the posture** per ADR-005, then align the privacy rule wording (phase 2
   executes the rule edit; this phase owns the visibility/secret decision).
4. **Drop the vestigial `.htaccess` `.glsl` lines** (and the matching cache block).

## Commits (tiny, each green)
1. Redact email (both files) + rebuild RAG index (the index.json copy). 
2. Fix `deploy.yml` trigger. 3. Remove vestigial `.htaccess` MIME/cache lines.
4. (After ADR-005) flip visibility / license, or rewrite the privacy premise.

## Decision doc / ADRs
- **ADR-005** (exists, Proposed) — repo public-vs-private + MIT-vs-proprietary. This
  phase is blocked on the operator ratifying it for steps 3–4; steps 1–2 are unconditional.

## Testing
- `grep -rn 'events.bricem@gmail.com' .` → no hits (after redaction + index rebuild).
- `curl -sI https://primordial.video/Test/` → 200; `/.ftp-deploy-sync-state.json` and
  `/src/` dir listing → denied (privacy hardening still holds).
- Trigger a `deploy.yml` `workflow_dispatch` and confirm it runs to green.

## Out of scope
- Desktop (Tauri) CSP/license → phase 7. RAG index staleness root-cause → phase 8.
- History rewrite mechanics (heavy; only if ADR-005 chooses private + full scrub).
