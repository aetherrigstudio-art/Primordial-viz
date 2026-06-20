# Task Plan — re-platform (assumption-free rebuild)

> Rewritten under the rule **"do not assume anything."** The earlier draft baked
> in a stack (Astro/R3F), a "first deliverable," and a phase order that the
> operator never confirmed — those were my assumptions, now removed. This file
> separates **VERIFIED** (confirmed from primary sources this session, with
> evidence) from **UNVERIFIED** (things I was treating as known but haven't
> confirmed) and **OPEN DECISIONS** (the operator's to make). The only thing
> asserted as method is the process: acquire tools + ground truth, **show**, then
> decide each thing from evidence — not from my guesses.

## Goal (as stated by the operator, not inferred)
- "We honestly need to refactor the entire codebase." (verbatim)
- The no-build / raw-WebGL2 / phone-only constraints are being lifted ("I'm going
  to use a server til I have my PC"). (verbatim)
- Wants: "real multi-page studio site" + "modern dev workflow." (selected options)
- Repeated pain: **0 deliverables / "trash" results / too much process.** (verbatim)
- **Anything beyond the above is UNVERIFIED — do not assume the rest.**

## VERIFIED this session (with evidence)
| Fact | Evidence |
|------|----------|
| Env was broken: no `node_modules`, no Chromium | `ls node_modules` empty; orient env-check |
| `npm install` fixed deps; MCP server starts | `selftest OK`, exit 0; lists 10 tools |
| CI `verify` RED on `main` since `10f2462` (stale RAG index) | GitHub Actions runs = failure; `npm run health` exit 1 |
| `deploy.yml` push trigger = a deleted branch | `deploy.yml:15`; branch absent in `git branch -a` |
| Repo is PUBLIC; license is MIT | GitHub API `private:false`; `LICENSE`, `README.md:88` |
| Operator email committed in 2 files | `research/claude-repo-comparison/BRIEF.md:4`; `tools/rag/index.json:1474` |
| `$`-in-replace corruption bug | `tools/mcp/lib/looks.mjs:83`, `tools/gen-docs.mjs:377` (read) |
| Skills installed | `legacy-modernizer`, `astro-framework`, `r3f-shaders`, `planning-with-files` (`skills ls`) |
| R3F + drei `MeshTransmissionMaterial` are real/current | ctx7 docs (`/pmndrs/react-three-fiber`, `/pmndrs/drei`) |

## UNVERIFIED — I must confirm before treating as fact (DO NOT ASSUME)
- **What the operator's reference reels actually look like.** I have only a prior
  session's *notes* (`workshop/sketches/frontpage/references.md` on the unmerged
  `orient-va74sj`). The montages were wiped. I have **not** viewed them this session.
- **What "examples … downloaded from Instagram" the operator means** and where they are.
- **The target stack.** Astro / R3F / GSAP is my proposal, **not** an operator
  decision. The operator said "show me … I have no idea what these terms mean."
- **The first deliverable.** Wedding landing page vs instrument vs portfolio vs
  the broader "Aether Platform" — not decided.
- **Whether the existing instrument is kept, ported, or discarded.** Not decided.
- **Whether the Drive design Q&A / v1 weddings HTML is still the intended direction.**
- **The host/deploy target** for anything new.

## OPEN DECISIONS (operator's call — surface, don't pre-answer)
- Refactor scope: rewrite-all vs new-app-alongside vs add-build-only.
- Target stack + framework + host.
- First thing to ship and look at.
- Repo public-vs-private + MIT-vs-proprietary (audit ADR-005).

## Phase 0 — ACQUIRE TOOLS + GROUND TRUTH, then SHOW (the only thing I can act on now)
- Status: in_progress
- Tasks (none of these assume a destination):
  - [x] Install toolchain (`npm install`); MCP works (selftest OK).
  - [ ] Install Playwright Chromium so I can render/clip/screenshot at all.
  - [ ] Make the env durable (SessionStart deps hook) so it never silently breaks again.
  - [ ] **Get the real references in front of both of us** — confirm WHERE the
        Instagram examples are (ask, don't trawl), `reel-ingest` them, `SendUserFile`
        the frames. Verify the actual target by looking, not from old notes.
  - [ ] Prove a "see-it" path works (render current app → screenshot to phone, or a live URL).
  - [ ] Bring the OPEN DECISIONS above to the operator, each backed by something
        seen — and let them decide. Only then write Phase 1+.

## Phases 1+ — INTENTIONALLY EMPTY
Not written yet, on purpose. They depend on the OPEN DECISIONS. Filling them in now
would be assuming. They get written **after** the operator decides, from evidence.

## Errors Encountered (logged so they don't recur)
| Error | Attempt | Resolution |
|-------|---------|------------|
| ~60 moves with a broken env → 0 deliverables | accepted "ENV INCOMPLETE" | fix tools FIRST; `npm install` done |
| Asked instead of showing | AskUserQuestion volleys | show-don't-tell |
| Explained the stack in jargon | text answer | build a tiny demo, send the image |
| Wrote a plan full of assumptions | inferred stack/phases/deliverable | this rewrite: VERIFIED vs UNVERIFIED vs OPEN |
| Trawled Drive, hit personal files | broad listing | ask for the exact folder/links instead |

## Decisions Made (only what's actually settled)
| Decision | Status |
|----------|--------|
| Adopt the 4 skills above | done (installed) |
| Everything about the destination | OPEN — not decided |
