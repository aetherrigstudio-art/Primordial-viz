# Refactor Phase 2 — Rules / drift

Concern: `.claude/rules/*` + the rules section of `CLAUDE.md`. This phase **owns the
rule-file execution of ADR-006** (phone-dev retirement). Evidence read-only this
session; re-verified where load-bearing (cited).

## Problem
- **Phone-operator premise in the rules** — the dedicated rule
  `.claude/rules/mobile-ergonomics.md` (39 lines, `wc -l` confirmed) plus
  `.claude/rules/conduct.md:4,60-61` (§4 phone ergonomics) and `.claude/rules/gotchas.md:49`
  (cross-ref). Retired by **ADR-006**, not yet executed. FACT.
- **The playback budget must NOT be caught in the scrub.** `.claude/rules/shaders.md:6,44-71`
  is the mobile-GPU **playback** budget (FBO scale, step cap ≤64, dynamic res,
  pause-on-hidden) — a *different device* than the operator. ADR-006 keeps it; it must be
  **re-scoped/relabelled** so a future agent can't mistake it for a dev-device rule. FACT.
- **Vestigial drift**: `.claude/rules/deploy.md:61` correctly notes the `.glsl` MIME line
  in `deploy/.htaccess:27` is vestigial — but it's still in the htaccess (exec lives in
  phase 6). FACT.
- **Public/private rule contradiction**: `.claude/rules/deploy.md` ("repo is private")
  vs the public repo — tracked by **ADR-005**. FACT.
- Confirmed *not* a problem: `conduct.md` vs `CLAUDE.md` overlap is **intentional
  layering** (summary → full guide), not redundancy. (agent-verified)

## Solution
Execute ADR-006 at the rule layer, keep the playback budget, reconcile drift.
1. **Delete `.claude/rules/mobile-ergonomics.md`**; drop the §4 phone-ergonomics bits in
   `conduct.md` and the `gotchas.md:49` cross-ref; keep "concise, plain language" (good
   anywhere).
2. **Re-scope `shaders.md`** budget section with an explicit "PLAYBACK DEVICE (gig phone
   GPU), not the operator's machine" header so it survives future phone-dev scrubs.
3. **Update the `CLAUDE.md` rules section** Communication bullet to drop phone mechanics,
   keep answer-first/plain-language; keep the perf-budget bullet (playback).
4. **Deploy rule**: align with ADR-005 once ratified (private→hold, public→rewrite the
   "it's private" safety-net premise). Note the htaccess `.glsl` exec is phase 6.

## Commits (tiny, each green)
1. Re-scope `shaders.md` budget header (do FIRST so the budget is unmistakable). 
2. Delete `mobile-ergonomics.md` + remove `gotchas.md:49` ref.
3. Trim `conduct.md` §4 phone bits; update `CLAUDE.md` Communication bullet.
4. (After ADR-005) reconcile `deploy.md` public/private wording.

## Decision doc / ADRs
- **ADR-006** (done) governs this phase; **ADR-005** gates the deploy-rule wording.
- No new ADR needed unless re-scoping the budget reveals a real policy change.

## Testing
- `grep -rinE 'mobile-ergonomics|operator.*phone|one value per (code )?block|laptop-free' .claude/rules CLAUDE.md`
  → returns nothing (operator-device framing gone).
- `grep -in 'playback' .claude/rules/shaders.md` → budget clearly playback-scoped.
- `node tools/check-config.mjs` (CLAUDE.md ≤200 line cap, router markers, settings valid).
- `node tools/gen-docs.mjs --check` green (drift gate; the deleted rule isn't referenced).

## Out of scope
- Hook device-branch removal in `orient.sh`/`inject-rules.sh` → **phase 3** (coordinate
  wording). Skill phone-refs → phase 3/8. The `.htaccess` exec → phase 6.
