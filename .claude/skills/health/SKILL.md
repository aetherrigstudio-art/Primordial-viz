---
name: health
area: meta
description: One-pass repo + deploy health check, then route any failure to its fix. Runs the local gates (npm run health - JS syntax, smoke, site audit, docs+drift gate) and, when it matters, the live deploy (deploy-check). Use to answer "is everything ok?", before claiming a batch of work done, or after a round of changes.
allowed-tools: Read, Bash(npm run health), Bash(node tools/health.mjs), Bash(node tools/gen-docs.mjs *), Bash(curl *)
---

# health - sense the whole repo in one pass, then route to the fix

The self-improvement loop's **sense** stage in one move. Run it; on red, hand off
to the right fix - that handoff is the tightening between sense -> diagnose -> fix.

## Steps
1. **Local gates:** `npm run health` (= `node tools/health.mjs`) - JS syntax,
   smoke, site audit (AI tells / fingerprints), docs + drift gate. One PASS/FAIL
   dashboard, exit 1 on any failure.
2. **Live deploy (when relevant):** run the `deploy-check` skill - latest Actions
   run + curl the live `/Test/` URLs.
3. **On any FAIL, route to the fix (don't just report):**
   - Docs / drift stale -> `node tools/gen-docs.mjs` (regenerates), or fix the
     dangling path the drift gate names.
   - Site audit (em/en dash or fingerprint) -> fix the flagged line in `index.html`/`src/`.
   - Smoke fail -> the `systematic-debugging` skill.
   - Deploy red -> the `deploy-check` skill (usually a missing `FTP_PASSWORD` secret).
4. Report concisely: overall verdict + any red + the exact fix. Don't dump output.

## Notes
- Render-check (needs Chromium) is excluded from `npm run health` for speed; CI
  (`.github/workflows/verify.yml`) runs it on every push.
- A green run is the evidence the `verification-before-completion` skill wants
  before any "done" claim.
- There is no standing scheduler (the container is ephemeral) - health runs on
  demand here and automatically in CI on every push.
