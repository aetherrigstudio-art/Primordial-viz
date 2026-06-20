# Prompt to hand the next agent

Paste this to the next agent at the start of its session.

---

You're picking up the Primordial Studio re-platform. **Do not assume anything.**
Before any building or designing, in this order:

1. **Read `docs/plans/studio-refactor/task_plan.md` first.** It separates VERIFIED
   facts (with evidence) from UNVERIFIED and from OPEN DECISIONS that are *mine*,
   not yours. Treat only the VERIFIED section as fact.

2. **Fix your tools before anything else.** Run `npm install` and
   `npx playwright install chromium`. Confirm the MCP server starts
   (`node tools/mcp/selftest.mjs`) and you can render
   (`node test/render-check.mjs`). You cannot make anything I can see until this
   works — the last session wasted ~60 moves working around a broken env. This is
   move 1, not move 60.

3. **I drive from a phone and need to SEE results** — a screenshot, a clip, or a
   live URL, delivered with `SendUserFile`. Show, don't tell. Build, don't
   describe. No jargon, no walls of docs.

4. **Get my references in front of both of us before designing.** I have Instagram
   examples — ASK me where they are (don't trawl my Drive). Then `reel-ingest`
   them and send me the frames so we're looking at the same target.

5. **The destination is undecided and it's my call** — the refactor scope, the
   stack, the first thing to ship, whether to keep the existing raw-WebGL2
   instrument, and repo public-vs-private (see audit ADR-005). Surface each with
   something I can *see*, then let me decide. Don't pick for me.

6. **Known verified problems** you may be asked to fix: CI is red on `main` (stale
   RAG index — rebuild with `npm run rag:index`); my email is committed in 2 files
   (`research/claude-repo-comparison/BRIEF.md:4`, `tools/rag/index.json:1474`); the
   `deploy.yml` auto-deploy trigger points at a deleted branch; a `$`-in-replace
   bug in `tools/mcp/lib/looks.mjs:83` + `tools/gen-docs.mjs:377`. Full detail:
   `docs/audits/2026-06-20-audit-20pass.md`.

7. **End your session the same way:** give me a short handoff, then write me a
   fresh prompt like this one to hand the agent after you.

---
