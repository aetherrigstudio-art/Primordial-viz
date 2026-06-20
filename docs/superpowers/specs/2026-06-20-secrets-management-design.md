# Design — Secrets Management (Proton Pass) — sub-project 2 of 4

> Date: 2026-06-20 · Branch: `claude/init-r8ukva` · Status: design (for review) ·
> Method: brainstorming (done, parked) → this spec → writing-plans → SDD.

## Why this exists

The operator's words: *"a better way for us to share secrets than the GitHub."*
Secrets now sprawl across three subsystems (~11 keys), and the portfolio pipeline
(sub-project #1) can't run until its secrets are present in CI. This sub-project
gives: **one secure home** for secrets, a **safe way to share** a single value,
and a **preflight check** that fails fast when CI is missing something — all
without the AI ever handling raw secret values.

## Locked decisions (from the brainstorm + deep-research, 2026-06-20)

- **Vault + sharing = Proton Pass** (chosen over NordPass). Proton Pass holds the
  master copies; its **Secure Links** (end-to-end-encrypted, expiring,
  view-count-capped) are the "better than GitHub" way to share one key to a new
  field/device. NordPass has no real CI story; no reason to leave Proton.
- **CI secret source = GitHub Actions secrets, pasted once.** For ~11
  rarely-rotated keys this is genuinely fine; a dev secrets manager (Bitwarden
  Secrets Manager / Infisical) is a documented *future* upgrade if full automation
  is ever wanted. The Proton `pass-cli` CI path is **out of scope** (its headless
  GitHub-runner auth was unconfirmed in research).
- **The AI never receives raw secret values in chat** — it consumes them only via
  GitHub Actions `env`, and this cloud session cannot reach Proton directly.
- **Backend-rule note (ADR-001):** any future secrets-manager service runs on its
  own infra, never coupled into the Namecheap web path.

## Registry scope (the one open question — resolved)

The **secrets registry covers all three subsystems**, with the unbuilt ones marked
`planned` so the preflight never fails on a server that doesn't exist yet:

| Subsystem | Secrets | Status |
| --- | --- | --- |
| **deploy** | `FTP_PASSWORD` | active |
| **portfolio** (#1) | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GEMINI_API_KEY`, `DRIVE_FOLDER_ID` | active |
| **opus8-rag** (skeleton) | `PINECONE_API_KEY`, `PINECONE_ENV`, `PINECONE_INDEX_NAME`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY` | planned |

(`DRIVE_FOLDER_ID` is not secret — a folder id — but lives in the registry as a
required CI input. `ANTHROPIC_EMBEDDING_KEY` from the old `.env.example` is dropped:
Anthropic has no embeddings API.)

## Architecture

Two small, focused units of dev-tooling under `tools/secrets/` (web path stays
dependency-free), plus a registry and a runbook.

```
 Proton Pass (your phone) ──Secure Link / manual paste──▶ GitHub Actions secrets
        master copies                                            │
                                                                 ▼
 secrets registry (source of truth) ──read by──▶ preflight verifier (CI step + CLI)
   name · purpose · subsystem ·                     checks each ACTIVE secret is set
   proton item · github secret · status             in env; reports MISSING names
                                                     ONLY (never values); exits 1 if any
```

### Components (each one job, testable in isolation)

1. **`secrets/registry.json`** — the single source of truth. An array of entries:
   `{ name, purpose, subsystem, secret: boolean, github_secret: string,
   proton_item: string, status: "active"|"planned" }`. Committed; contains **no
   values**. This is what makes the sprawl legible.

2. **`tools/secrets/preflight.mjs`** — pure core + CLI.
   - `missingSecrets(registry, env, { subsystem })` → `string[]` of the
     `github_secret` names that are `status:"active"`, in the given subsystem (or
     all), and absent/empty in `env`. **Never returns or logs values.**
   - `formatReport(missing)` → a human line list ("missing: X, Y") — names only.
   - CLI: `node tools/secrets/preflight.mjs [subsystem]` reads
     `secrets/registry.json` + `process.env`, prints the report, exits `1` if any
     active secret is missing, `0` otherwise. Used as the **first step** of a
     workflow so a run fails in seconds with a clear cause instead of 5 minutes in.

3. **`secrets/README.md`** — the phone-only runbook: store each key in Proton Pass;
   create a **Secure Link** to move one value to a GitHub secret field (expiring,
   view-capped); the list of which `github_secret` each maps to; and the rule that
   secrets are pasted into GitHub once, never into chat. One value per code block
   (mobile-ergonomics).

4. **Workflow wiring** — add the preflight as the first step of
   `.github/workflows/portfolio.yml` (and optionally `deploy.yml`), so each run
   gates on its own subsystem's secrets being present.

## Data flow

`Proton Pass` → (Secure Link / paste) → `GitHub Actions secrets` → workflow `env`
→ **preflight** reads `registry.json` + `env`, fails fast if an active secret is
missing → the real job runs.

## Out of scope

- `pass-cli`-in-CI automation (unproven headless auth) and dev secrets managers
  (Bitwarden/Infisical) — documented as future options only.
- Rotating or generating any secret; the registry references them, never stores
  values.
- The Opus-8 RAG server itself (separate, and its premise is under review).

## Risks / open items

- **R1 — `planned` keys.** Listed for completeness; preflight skips them so it
  can't fail on the unbuilt RAG server. When/if that server is built, flip status
  to `active`.
- **R2 — value leakage.** The single hard requirement: preflight must never print
  a value. Enforced by design (it only ever reads *presence* of `env[name]`) and
  by a unit test that asserts no value appears in output.
- **R3 — Proton CLI temptation.** If a future agent wires `pass-cli` into CI,
  re-verify the headless auth flow first (research couldn't confirm it).

## Success criteria

1. `secrets/registry.json` lists every secret across the three subsystems with its
   GitHub-secret name and Proton item, no values.
2. `node tools/secrets/preflight.mjs portfolio` exits non-zero and names the
   missing secrets (only names) when any active portfolio secret is unset; exits 0
   when all are present.
3. The portfolio workflow gates on preflight as its first step.
4. The runbook lets the operator, from a phone, store keys in Proton and move them
   into GitHub secrets via Secure Links — with secrets never entering chat.
