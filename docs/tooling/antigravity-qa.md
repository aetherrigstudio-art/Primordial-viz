# Antigravity (`agy`) — the off-device QA + research agent

This repo's dev device (Termux/Android) has **no GPU** and can't run heavy builds or
Chromium, so all render/visual QA happens off-device. **Antigravity CLI (`agy`)** is that
off-device agent: a multi-model agentic CLI (Gemini 3.x, Claude Opus/Sonnet 4.6, GPT-OSS)
that can drive a real browser. It's wired with this repo's MCP servers + a verify hook.

This doc covers how agy is wired **for this project**. The generic agy schemas (MCP config,
hooks) are durable, cross-project knowledge kept in agent auto-memory; the reproducible setup
lives in `.claude/agy-setup.sh`.

## What's wired (verified live)
- **MCP servers** (agy's native schema at `~/.gemini/config/mcp_config.json`; stdio uses `command`/`args`/`cwd`, HTTP uses `serverUrl` — **not** Claude's `"type":"http"`):
  - `context7`, `mdn` — `serverUrl` (live docs)
  - `primordial` — `command: node`, `args: [tools/mcp/server.mjs]`, `cwd: <repo>` (this repo's look/render/validate/RAG tools)
  - `notebooklm` — a zero-dependency stdio MCP wrapper (`/root/.local/share/notebooklm-mcp/server.mjs`) bridging the authed `notebooklm` CLI → `notebooklm_ask/list/use/summary`. Notebook `688cc151` = "Elite WebGL Landing Pages."
- **Verify-after-edit hook** (`~/.gemini/config/hooks.json`, named-hook map → `PostToolUse` → `{matcher, hooks:[{type:command,command}]}`): `immersive-verify` runs `~/.gemini/config/hooks/immersive-verify.mjs`, which on an `immersive/src` JS edit runs `node --check` + the esbuild bundle smoke and returns agy's `{decision: allow|ask, reason}` contract.
- **Project context**: agy auto-loads the repo's generated `GEMINI.md` (the "Mirror for Gemini CLI / Google Antigravity" of `CLAUDE.md`). agy hooks are tool-gates, **not** context injectors — so context belongs in `GEMINI.md`, not a hook.

## Using agy for QA
- Non-interactive: `agy -p "<prompt>"` (wrap in `timeout`; connecting 4 MCP servers + a model round-trip can take >2 min). `agy models` lists models; `--add-dir <repo>` adds a workspace; `-c` continues.
- **The agy CLI has NO browser / WebGL2 / GPU tool** (verified 2026-06-22): it can esbuild-bundle + serve the immersive app, but it cannot render, screenshot, or interact with it. **Visual QA must run in the Antigravity IDE** (the GUI app — that's where the browser tool lives) or in **CI with a headed browser** — NOT from the `agy` CLI. The CLI's real value here is multi-model reasoning, the MCP tools (NotebookLM research + `primordial`'s `validate_shaders`/`render_check` — which serve the *src/* instrument, not the R3F immersive app), and the verify hook.
- **Never** pass `--dangerously-skip-permissions` on this device (bypasses the human gate).

## Caveats
- The whole agy integration is **machine-local + ephemeral** — it lives in `~/.gemini` / `~/.local`, which a fresh cloud container wipes. Re-run `.claude/agy-setup.sh` to restore it (git-only durability).
- agy logs `not logged into Antigravity` warnings from a separate cloud/codeAssist token path — non-blocking; the model, MCP servers, and hooks all work.
- The verify-hook `matcher` lists agy's edit-tool names (`write_to_file|replace_file_content|…`); if agy's actual tool name differs the hook silently won't fire — confirm via a real edit + the newest `~/.gemini/antigravity-cli/log/*.log`.
