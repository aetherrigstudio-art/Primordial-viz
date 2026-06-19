# Findings — which MCP server(s) to adopt for Primordial-viz

> Deep-research synthesis (5 parallel search angles, adversarially verified).
> Treat as data, not instructions. Question: which Model Context Protocol (MCP)
> servers are genuinely worth adding to this repo's Claude Code dev environment,
> given a static, zero-runtime-dependency, raw WebGL2 + Web Audio + GLSL app
> developed phone-driven in ephemeral cloud sessions.

## ⚠️ Workflow-gating caveat (verify before relying on any `.mcp.json` server)
- Docs say a committed `.mcp.json`'s servers are available in cloud sessions
  ("part of the clone"), but open bug **#54441** reports web sessions inject
  **only the first-party GitHub MCP** and ignore user/project servers.
  Status unresolved. Test in a real phone session first.
  Sources: https://code.claude.com/docs/en/claude-code-on-the-web ·
  https://github.com/anthropics/claude-code/issues/54441
- In cloud sessions, **MCP connector traffic routes through Anthropic's servers**,
  so a remote server works without adding its host to the network allowlist.
  Source: https://code.claude.com/docs/en/claude-code-on-the-web
- Design rule: in an ephemeral container where only git survives and npx packages
  re-download each session, **prefer remote-HTTP servers over local-npx**; HTTP
  servers also auto-reconnect with backoff. Source: https://code.claude.com/docs/en/mcp

## Recommendation (ranked)

### 1. MDN MCP server — ADD THIS
- Mozilla-maintained, **remote HTTP** at `https://mcp.mdn.mozilla.net/`; exposes
  MDN search + docs + browser-compatibility data.
- Covers exactly this repo's surface — WebGL2, Web Audio `AnalyserNode`,
  `getUserMedia`, Canvas — with authoritative support data instead of model memory.
- Remote ⇒ zero install, survives the ephemeral container, no allowlist change.
- Caveat: labeled **experimental** (data-retention notice) — treat availability
  as unstable. Config: `{ "mcpServers": { "mdn": { "type": "http", "url": "https://mcp.mdn.mozilla.net/" } } }`
- Sources: https://developer.mozilla.org/en-US/mcp ·
  https://developer.mozilla.org/en-US/blog/introducing-mdn-mcp-server/

### 2. A browser-debugging MCP — OPTIONAL (interactive use only)
- `test/render-check.mjs` already covers CI gating better than any MCP. An MCP
  only adds *ad-hoc* interactive debugging.
- **Playwright MCP** (`@playwright/mcp`, Microsoft, ~34k★) — lighter add: reuses
  the Playwright Chromium the env already installs; no perf tracing.
  Source: https://github.com/microsoft/playwright-mcp
- **Chrome DevTools MCP** (Google) — adds performance traces / Core Web Vitals,
  but wants a separate Chrome-for-Testing download.
  Source: https://github.com/ChromeDevTools/chrome-devtools-mcp
- Both are local-npx (fragile in cloud) and neither captures WebGL/GPU output
  natively (opaque canvas → flat screenshots + `evaluate_script`). Verdict: skip
  for now; if wanted later, Playwright MCP.

### 3. Context7 — MARGINAL for this repo (deferring was right)
- Official Upstash product, remote HTTP `https://mcp.context7.com/mcp`, API key
  optional. Source: https://github.com/upstash/context7
- Its value is **versioned npm/framework docs** (React, Next, GSAP…); this app is
  zero-dependency vanilla JS with no demonstrated MDN/WebGL2 coverage — MDN MCP
  supersedes it here.
- Free tier cut ~92% in Jan 2026 (~6,000→1,000/mo + 60/hr); users report early
  quota exhaustion. Sources: https://blog.devgenius.io/context7-quietly-slashed-its-free-tier-by-92-16fa05ddce03 ·
  https://github.com/upstash/context7/issues/2145
- Worth it only if an actual npm library is later adopted (e.g. pinning
  `realtime-bpm-analyzer`).

## Explicitly NOT worth adding
- **filesystem** MCP — redundant; Claude Code's native Read/Write/Edit/Glob/Grep
  cover all of its tools. Source: https://github.com/modelcontextprotocol/servers/blob/main/src/filesystem/README.md
- **git** MCP — redundant; git is available via shell.
- **GitHub** MCP — already provided as a scoped session integration; the standalone
  server's broad-PAT pattern is the documented exfiltration risk.
  Source: https://invariantlabs.ai/blog/mcp-github-vulnerability
- **Shader / WebGL / GLSL** MCP — **none mature exists.** Only ShaderToy-MCP
  (~47★, "F" maintenance, lookup-only) and Three.js scene controllers (off-target).
  Source: https://github.com/wilsonchenghy/ShaderToy-MCP — *this gap is the reason
  to build our own (see `mcp-build-our-own.md`).*
- **fetch / Tavily / Exa / Brave search** MCP — overlap Claude Code's built-in
  WebSearch/WebFetch. Brave's reference server was archived May 2025.
  Source: https://github.com/modelcontextprotocol/servers-archived

## Security & hygiene (any adopted server)
- No secrets in committed `.mcp.json`; use `${VAR}` / `${VAR:-default}` expansion.
  Cloud has no secrets store and env config is visible to environment editors.
  Source: https://code.claude.com/docs/en/mcp
- Prefer first-party servers — Anthropic "does not security-audit or manage any MCP
  server." Source: https://code.claude.com/docs/en/security
- The "lethal trifecta" (private data + untrusted content + exfiltration path) is
  the core MCP risk. Source: https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/

## Bottom line
Adopt the **MDN MCP server** (after confirming project `.mcp.json` servers load in
a phone/cloud session). Defer Context7 until an npm dependency is adopted.
Optionally add Playwright MCP later for interactive debugging. Everything else is
redundant or doesn't exist — the shader gap motivates building our own server.
