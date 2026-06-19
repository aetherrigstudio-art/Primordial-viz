---
name: deploy-check
area: deploy
description: Diagnose the deploy pipeline in one pass — check the latest GitHub Actions deploy run, pull failing job logs, confirm the required FTP_PASSWORD secret, and verify the live site. Use when a deploy fails, after pushing, or to confirm the site is healthy ("is the deploy ok?", "why did the deploy fail?", "check the live site").
---

# deploy-check — one-pass deploy health + root-cause

Packages the deploy diagnostic flow so a failing pipeline is diagnosed in one go
instead of re-derived each time. Report **concisely**: status + root cause + the
exact fix.

## Context (this repo)
- Web deploy = **GitHub Actions FTPS** (`.github/workflows/deploy.yml`) → cPanel,
  served at `https://primordial.video/Test/`. CI = `.github/workflows/verify.yml`.
- The **only** required secret is **`FTP_PASSWORD`** (host + user are inlined in
  the workflow). Its classic failure is `Error: Input required and not supplied:
  password` → the secret is missing/misnamed.
- This container can't FTP or reach cPanel (HTTPS-only; FTP/21 + cPanel/2083
  blocked) — drive Actions via the **GitHub MCP**, verify the site via **curl**.

## Procedure
1. **Latest deploy run.** GitHub MCP `actions_list` (method `list_workflow_runs`,
   `deploy.yml`) → newest run's `status` + `conclusion`. (Load the MCP tools via
   ToolSearch first if needed.)
2. **If it failed**, `get_job_logs` (`failed_only: true`, `return_content: true`)
   → find the error. If it's `Input required and not supplied: password`, the root
   cause is a missing/misnamed **`FTP_PASSWORD`** repo secret → tell the user to
   add it (Settings → Secrets and variables → Actions). Secret *values* aren't
   readable — confirm the workflow *references* it (`grep FTP_PASSWORD
   .github/workflows/deploy.yml`) and infer presence from whether auth succeeded.
3. **Verify the live site** (independent of CI) with curl over HTTPS:
   - `https://primordial.video/Test/` → expect **200**
   - `https://primordial.video/Test/src/main.js` → expect **200**
   - `https://primordial.video/Test/src/` → expect **403** (directory listing off)
   - `https://primordial.video/Test/.ftp-deploy-sync-state.json` → expect **403**
4. **Audit the source** for AI tells: `npm run audit` (`node tools/audit-site.mjs`)
   - flags em/en dashes + AI/tooling fingerprints in `index.html` + `src/`. CI gates
   it too (`verify.yml`).
5. **Report**: one line of status (CI conclusion + live HTTP codes + audit result),
   the root cause if anything's red, and the exact next action. Don't dump logs.

## Re-trigger / loop (optional)
- After the user fixes a secret, re-run via MCP `actions_run_trigger`
  (`run_workflow`, `deploy.yml`) and re-check — loop until green.
- Never `sleep`-poll for events; trigger, then check the run's conclusion.

## Out of scope
- Don't try to FTP or open cPanel from here (blocked). Manual cPanel steps live in
  the `deploy-cpanel` skill; host facts in `.claude/rules/deploy.md`.
