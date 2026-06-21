# Refactor Phase 3 — Automation / hooks / CI

Concern: `.claude/hooks/*`, `.claude/settings.json`, `.github/workflows/*`. Evidence
read-only this session (agent-gathered, controller spot-checked).

## Problem
- **Device-aware phone branches** still live: `orient.sh:103-110` and
  `inject-rules.sh:37-44` branch on `CLAUDE_CODE_ENTRYPOINT` `*mobile*`. ADR-006 softens
  the mobile arm; the `inject-rules.sh:33-34` playback-budget note **stays**. FACT.
- **CI ↔ local health asymmetry**: `tools/health.mjs:22` runs `check-config.mjs` but
  `verify.yml` does **not**; conversely `verify.yml` runs unit-tests, render-check,
  shader-validate, mcp-selftest, rag-tests that `health` skips. So "green locally" and
  "green in CI" check different things. FACT.
- **`deploy.yml:15` dead trigger** (`claude/review-claude-md-di5jvm`, absent on remote)
  → auto-deploy never fires (exec owned by phase 6, flagged here as the hook/CI cause). FACT.
- **`orient.sh:43-44` fetch fragility**: 15s `timeout` only if `timeout` exists; the
  fallback `git fetch` is unbounded (can stall the SessionStart). FACT, low-rate.
- Confirmed healthy (no action): every hook is registered and its behavior matches its
  header; all `jq` uses degrade gracefully; `gen-docs.sh` wholesale-regens but is cheap.
- **Gap (opportunity)**: no `session-start.sh` deps hook exists, so fresh web containers
  boot without Chromium (this session hit exactly that). A deps hook was drafted but not
  adopted — revisit here or in phase 7.

## Solution
1. **Strip the mobile arm** from `orient.sh` + `inject-rules.sh` (keep web/default;
   keep the playback-budget note). Coordinate wording with phase 2.
2. **Converge the gates**: make `verify.yml` and `health.mjs` run the same core set
   (add `check-config.mjs` to CI; decide which of render/shader/mcp/rag belong in local
   `health` vs CI-only-for-speed and document the split in `health.mjs`'s header).
3. **Harden `orient.sh` fetch**: background it or guarantee a bound even without
   `timeout` (e.g. `git -c ... fetch` with a config timeout, or skip when offline).
4. **(Decide) add `session-start.sh`** deps hook (npm install + Chromium) for web
   sessions — the env-durability fix.

## Commits (tiny, each green)
1. Remove mobile branch from `inject-rules.sh`; 2. from `orient.sh`.
3. Add `check-config` to `verify.yml`; document the health/CI split.
4. `orient.sh` fetch bound.
5. (if approved) `session-start.sh` + register in `settings.json`.

## Decision doc / ADRs
- ADR-006 governs the device-branch removal.
- **Proposed ADR-008: env-durability hook** (synchronous deps `session-start.sh` vs
  rely on the cloud-setup paste vs async) — affects every web session's startup time.

## Testing
- `grep -rn 'CLAUDE_CODE_ENTRYPOINT\|mobile' .claude/hooks/` → only non-phone use (or
  none). 
- Run each touched hook with a fake payload (`echo '{...}' | .claude/hooks/<h>.sh`) →
  exits 0, emits valid JSON. 
- `node tools/check-config.mjs` and `node tools/gen-docs.mjs --check` green.
- CI run on the branch goes green (separate from the pre-existing RAG-stale issue → phase 8).

## Out of scope
- The RAG-index-stale CI failure (phase 8). The `deploy.yml` deploy redesign (phase 6).
