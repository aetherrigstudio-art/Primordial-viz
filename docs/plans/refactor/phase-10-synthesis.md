# Refactor Phase 10 — Synthesis (sequencing + cross-phase)

Pulls phases 1–9 into one prioritized, dependency-ordered picture. Severity uses the
audit convention (Critical / Important / Nit). Every item links its phase + `file:line`.

## The one thing above all: the target is undecided
The big "refactor the entire codebase" / re-platform is **blocked on an operator
decision** — target stack, scope (rewrite vs alongside), host (see `docs/plans/studio-refactor/`).
These 10 phase plans are deliberately **current-state refactors** that hold *regardless*
of that target: fix what's broken, remove cruft, modernize, decide the reversible calls.
Do these; they make any future re-platform start from a healthy base.

## Priority order (do top-down)
### Critical — broken now, cheap to fix, no decision needed
1. **Rebuild the RAG index** → unblocks **CI-red-on-`main`** (phase 8; `build-index.mjs --check`).
2. **Redact the operator email** PII in `BRIEF.md:4` + `tools/rag/index.json:1474` (phase 6).
3. **Fix the dead deploy trigger** `deploy.yml:15` (phase 6).

### Important — real problems / accepted decisions to execute
4. **Apply ADR-006 softening** — soften absolute phone phrasings; KEEP the rules (operator still on a phone), phases 1, 2 — keep
   the *playback* GPU budget).
5. **Ratify ADR-005** (public/private + license) → then phases 2/6/7 license+privacy edits.
6. **Converge CI ↔ local `health` gates** (phase 3; add `check-config` to CI).
7. **Wire or archive the 4 unrun test files** + add core unit tests (phases 9, 5).

### Nit — polish, low risk
8. Shader magic-number constants + shaders.md render-scale doc (phase 4).
9. Audio tunables → named/params + pure unit tests (phase 5).
10. `$`-replace → callback form (phase 7); Tauri `csp`/license (phases 7/6); `.htaccess`
    vestigial MIME (phase 6); dead-weight decisions (phase 9).

## DISPUTED — verify BEFORE acting (do not "fix" on an agent's word)
These were flagged by evidence agents but **conflict with other evidence**; the verification
gate says resolve them from primary sources first (this is the discipline the whole task
is about):
- **eval-skills.mjs API params** (`output_config`/`effort`/`format`) — agent says invalid
  & "Critical"; prior `progress.md` says "verified valid vs claude-api." → check the
  `claude-api` skill / SDK. (phase 8)
- **skills-lock "all 11 hashes stale"** — includes skills untouched this session → likely a
  different hash method. → check how `npx skills` computes `computedHash`. (phase 8)
- **4 skills missing `area:` = router drift** — may just be the `general` default. → check
  `gen-docs`. (phase 8)

## Cross-phase dependencies / ownership
- **ADR-005** gates: phase 2 (deploy-rule wording), phase 6 (visibility/license), phase 7
  (`Cargo.toml` license). Don't execute those commits until it's ratified.
- **ADR-006** spans phases 1 (docs), 2 (rules), 3 (hooks). Do the `shaders.md` budget
  re-scope (phase 2, commit 1) FIRST so the playback budget is never mistaken for a
  dev-device rule and scrubbed by accident.
- **RAG index** must be rebuilt **after** doc commits land (tracked-file hash; `gotchas.md`).
- Audio unit tests are shared between phase 5 (author) and phase 9 (CI wiring).

## ADRs this session
| ADR | Topic | Status |
|-----|-------|--------|
| 005 | Public/private + license | **Proposed — needs operator** (pre-existing) |
| 006 | Retire phone-based-dev | **Accepted** (operator-directed) — cleanup pending |
| 007 | progress.md archival strategy | Proposed (phase 1) |
| 008 | Env-durability SessionStart deps hook | Proposed (phase 3) |
| 009 | Tauri webview CSP policy | Proposed (phase 7) |
| 010 | `.agents/` mirror + skills-lock policy | Proposed (phases 8/9) |
| 011 | Fate of `server/`+`android/`+`src-tauri/` | Proposed (phase 9) |

## What I will NOT claim
No phase is "done" — these are **plans**, verified against current evidence, not executed
refactors. Per the verification gate, execution of each commit re-runs its own gate before
any "fixed/passing" claim.
