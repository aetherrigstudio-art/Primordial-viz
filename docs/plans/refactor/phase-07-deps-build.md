# Refactor Phase 7 — Deps / build / tooling

Concern: `package.json`, lockfile, `vite.config.js`, `src-tauri/*`, `tools/*` build/gen
tooling. Agent-gathered + controller-confirmed; cite `file:line`.

## Problem
- **`$`-in-replace LATENT footgun** — `tools/gen-docs.mjs:377` and
  `tools/mcp/lib/looks.mjs:83` use `text.replace(re, \`$1${body}\n$2\`)`. The `$1/$2`
  are valid backrefs; the hazard is only if `body` (skills-router text / `JSON.stringify`
  of look data) ever contains `$&`/`$1`/`$\``. Current kebab-case naming prevents it →
  **NOT an active bug** (this corrects the prior audit's "corruption bug" over-claim).
  Cheap to harden: switch to the **callback form** `replace(re, (_,g1,g2)=>g1+body+'\n'+g2)`
  which never interprets `$`. FACT (controller + agent agree).
- **Tauri desktop config gaps** — `src-tauri/Cargo.toml:6` `license = ""` (empty, not a
  valid SPDX); `src-tauri/tauri.conf.json:26` `"csp": null` (no Content-Security-Policy
  on the webview — a real desktop-app security gap). FACT.
- **Web path is clean** (verified): `index.html` + `src/` import only local modules;
  `package.json` is **devDeps-only**; all 8 devDeps are actually imported/used. KEEP. FACT.
- `vite.config.js` + `tauri.conf.json` paths/ports are correct and in-use (no dead config).

## Solution
1. **Harden the `$`-replace** in both files → callback form (removes the footgun for
   good; behavior-identical for current data).
2. **Tauri config**: set `Cargo.toml` `license` to match the ADR-005 license decision
   (MIT or proprietary); set a real `csp` in `tauri.conf.json` (lock the webview to
   `'self'` + the local dev URL) instead of `null`.
3. Leave the web build + devDeps as-is (healthy).

## Commits (tiny, each green)
1. `$`-replace → callback form in `gen-docs.mjs`; 2. same in `looks.mjs` (run
   `gen-docs --check` + MCP selftest after each). 3. Tauri `csp` policy.
4. (After ADR-005) `Cargo.toml` license value.

## Decision doc / ADRs
- **Proposed ADR-009: Tauri webview CSP policy** (what origins the desktop app allows) —
  security-relevant, worth recording.
- `Cargo.toml` license value is gated on **ADR-005**.

## Testing
- `node tools/gen-docs.mjs --check` + `node tools/mcp/selftest.mjs` green after the
  replace-hardening (prove the regen still produces identical output).
- Add a unit test feeding a `$`-containing body to the replace helper → asserts it's
  emitted literally (regression test for the footgun).
- (Desktop) `npm run tauri build` is laptop-only — verify CSP on a real machine, not here.

## Out of scope
- The web app code (phases 4/5). The RAG tooling internals (phase 8).
