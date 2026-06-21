# Refactor plans — per-phase index

Per-phase refactor plans for the codebase, one per concern-area (the 10-phase
decomposition). Each plan uses the refactor template (Problem → Solution → tiny
always-green commits → Decision-doc/ADRs → Testing → Out-of-scope), grounded in
**fresh `file:line` evidence** (`verification-before-completion`), with ADRs for
expensive-to-reverse calls (`documentation-and-adrs`, numbered from 006).

Scope note: the eventual re-platform **target stack is still undecided** (see the
prior `docs/plans/studio-refactor/` plan). So each plan addresses the **current-state
refactor** (fix the real problems, remove cruft, modernize) that holds regardless of
the target, and **flags re-platform-dependent calls as decisions** for the operator
rather than assuming a stack.

Cross-cutting decision already made: **ADR-006** softens the phone-based-development
constraints (the *operator-on-a-phone* ergonomics — NOT the mobile-GPU *playback* perf
budget, which stays).

| # | Phase (concern) | Plan file | Status |
|---|-----------------|-----------|--------|
| 0 | Soften phone-dev rules | `docs/decisions/006-soften-phone-based-development.md` | ✅ ADR + mobile-ergonomics softened |
| 1 | Docs / context | `phase-01-docs-context.md` | ✅ drafted |
| 2 | Rules / drift (incl. phone-dev softening) | `phase-02-rules-drift.md` | ✅ drafted |
| 3 | Automation / hooks | `phase-03-automation.md` | ✅ drafted |
| 4 | Shaders / renderer | `phase-04-shaders.md` | ✅ drafted |
| 5 | Audio path | `phase-05-audio.md` | ✅ drafted |
| 6 | Security / privacy / deploy | `phase-06-security-deploy.md` | ✅ drafted |
| 7 | Deps / build / tooling | `phase-07-deps-build.md` | ✅ drafted |
| 8 | RAG / skills | `phase-08-rag-skills.md` | ✅ drafted |
| 9 | Tests / perf / dead-weight | `phase-09-tests-deadweight.md` | ✅ drafted |
| 10 | Synthesis (sequencing + cross-phase) | `phase-10-synthesis.md` | ✅ drafted |
