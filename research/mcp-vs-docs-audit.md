# MCP ↔ knowledge/docs audit (main branch)

Deep comparison of the **MCP layer** (configured servers + the in-repo
`primordial` server) against the **knowledge/docs layer** (CLAUDE.md, generated
docs, `.claude/rules` + skills, `research/findings`, `docs/**`). Anchored to
`main` (`04f8ef5`); the working tree equals main for all MCP/docs content (the
branch is 2 commits ahead only for the new `session-start.sh` hook). Every claim
below was checked against source — server tool list via `selftest.mjs`, not memory.

## TL;DR

The MCP layer and the docs are **mostly consistent** and unusually well-wired
(one shared definition of "which docs count"; both MCP entry points gated in CI).
Four issues worth fixing, one of them live:

1. **LIVE — `semantic_search` is serving a STALE index.** `rag/build-index.mjs
   --check` reports `index.json` stale vs current docs. (Fixable now — the
   embedder is installed this session.)
2. **DRIFT — `mcp-build-our-own.md` predates `semantic_search`.** It says *"plain
   full-text, no embeddings… No vector DB needed at this scale"* and lists only
   `search_docs`; the server now also exposes a vector `semantic_search`.
3. **Stale skeleton comments in `server.mjs`** — the `about` tool + the header
   comment still say tool groups "are registered in later phases"; they all are.
4. **`selftest.mjs` can't catch a dropped tool** — it lists tools dynamically and
   only fails on *zero* tools, so a renamed/removed single tool passes CI.

Nothing here is a correctness bug in the server; the server itself is healthy
(`selftest OK`, all 10 tools + 3 resources + 1 prompt present).

---

## A. Configured servers (`.mcp.json`) vs the adoption findings

`.mcp.json` configures three servers; all three match `research/findings/mcp-adoption.md`:

| Server | Type | Doc verdict | Consistent? |
| --- | --- | --- | --- |
| `mdn` | remote http `https://mcp.mdn.mozilla.net/` | "ADD THIS" (#1) | ✅ URL matches doc exactly |
| `context7` | remote http `https://mcp.context7.com/mcp` | "NOW ADOPTED ON TRIAL" (#3, updated 2026-06-19) | ✅ matches the updated note |
| `primordial` | local stdio `node tools/mcp/server.mjs` | "build our own" (the shader-gap motivation) | ✅ |

- **Playwright MCP** is recommended only as *optional/later* and is correctly
  **absent** from `.mcp.json`. ✅
- The doc's **workflow-gating caveat** (bug #54441 — cloud sessions may load only
  the first-party GitHub MCP and ignore project servers) is the stated reason the
  `primordial` tools are all **CLI/CI-runnable**, not MCP-only. The codebase honors
  this: every `lib/*.mjs` runs standalone. ✅

## B. `primordial` server tools (source) vs what the docs claim

**Ground truth** (from `selftest.mjs`, live):
`about, validate_shaders, render_check, list_looks, create_look, update_look,
search_docs, semantic_search, get_doc, site_health` (10 tools) + resources
`doc://readme, doc://roadmap, look://{id}` + prompt `scaffold_new_look`.

| Doc | Claim | Verdict |
| --- | --- | --- |
| `CLAUDE.md` / `AGENTS.md` | "exposes look/render/validate helpers" | ⚠️ accurate but **partial** — omits docs Q&A (`search_docs`/`semantic_search`/`get_doc`) and `site_health`. Fine as a one-liner; understates the server. |
| `ENCYCLOPEDIA.md` | per-file rows for all 8 `tools/mcp/**` files | ✅ accurate and complete |
| `mcp-build-our-own.md` | designs validate_shaders, render_check, looks CRUD, docs Q&A, site_health | ✅ all built — **except** it predates `semantic_search` (see issue #2) |

**Issue #2 (DRIFT).** `mcp-build-our-own.md` → "docs Q&A" section explicitly says
*"plain full-text, no embeddings… No vector DB needed at this scale,"* and lists
only `search_docs`. Since then, RAG slice-1 added `semantic_search` (vector
similarity over `tools/rag/index.json`). The design doc now contradicts the
implementation. Fix: add a `semantic_search` paragraph noting the later vector
addition and why (conceptual/paraphrase queries).

## C. Knowledge coverage: what the doc tools actually index

This is the strongest part of the design. There is **one** definition of "which
docs count" — `docFiles()` in `tools/mcp/lib/docs.mjs` — and `tools/rag/chunk.mjs`
**reuses it**. So `search_docs`, `semantic_search`, `get_doc`, and the RAG index
all cover the same set:

- **123 of 133** tracked markdown files are indexed.
- **10 excluded**, intentionally: `research/corpus/**` + `research/fmhy-dev-tools/**`
  (external scrapes, not project knowledge) — documented in `docs.mjs:23` and the
  findings.
- All real knowledge folders are covered: `docs/**` (ANTHROPIC, decisions, prompts,
  superpowers), `.claude/rules/**`, `.claude/skills/**`, `research/findings`, the
  comparison reports, root docs. ✅ **No knowledge gap** in coverage.

## D. Is the MCP knowledge in sync with the docs?

**No — `semantic_search` is stale (issue #1).** `node tools/rag/build-index.mjs
--check` → `STALE — run: npm run rag:index`. The 1595-chunk `index.json` lags the
current doc set, so `semantic_search` can miss or mis-rank recent docs.
`search_docs` (live `git ls-files` scan, no prebuilt index) is **always current**,
so the keyword path is unaffected. Rebuild fixes it; the embedder is now installed.

## E. CI / gating consistency

- `verify.yml` gates **both** MCP entry points: `validate.mjs` (shader compile) and
  `selftest.mjs` (server boots + exposes tools). ✅
- **Issue #4:** `selftest.mjs` maps `tools.map(t => t.name)` and only fails on an
  empty list — a renamed or dropped single tool still passes. A cheap hardening is
  to assert the expected tool names are a subset of what's listed.
- The RAG drift gate (`build-index.mjs --check`) exists and is wired into health/CI,
  but the index is **currently stale** (issue #1) — i.e. the gate is doing its job
  and is red.

## F. Smaller staleness notes

- **Issue #3:** `server.mjs` header comment + the `about` tool text say real tool
  groups "are registered in later phases" / "Tools are added per phase." All phases
  are done; reword to present tense.
- `render_check` doc mentions PNG in one line and JPEG in another; the impl uses
  JPEG, which the doc's own "prefer JPEG/downscaled inline" note already endorses —
  consistent, just two phrasings.
- `mcp-build-our-own.md:93` ("dev-deps install via `npm ci` in `cloud-setup.sh`")
  becomes incomplete once this branch's `session-start.sh` hook (a second installer)
  merges — update it then.

## Suggested fix order (cheap → done)

1. `npm run rag:index` + commit → clears issue #1 (live).
2. Reword the two stale comments in `server.mjs` → issue #3.
3. Add a `semantic_search` paragraph to `mcp-build-our-own.md` → issue #2.
4. (Optional) Assert expected tool names in `selftest.mjs` → issue #4.
