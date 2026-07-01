# ADR-005: Repository visibility and license posture

## Status
**Accepted — Option A (private + proprietary).** Operator decided 2026-07-01.
(Numbered 005 to avoid colliding with ADR-002–004, which exist on the unmerged
`orient-va74sj` branch; renumber if those never merge.)

## Date
2026-06-20

## Context
The 2026-06-20 audit (`docs/audits/2026-06-20-audit-20pass.md`, passes 7 & 17)
found two facts that contradict load-bearing assumptions written throughout the
repo:

1. **The GitHub repo is public** (`"private": false`, GitHub API), but the
   privacy rule is written for a private repo: *"The repo is **private** … don't
   make it public without scrubbing history"* (`.claude/rules/deploy.md`), echoed
   in `progress.md`. Publicly exposed today: the 72 KB internal `progress.md`
   session log; `docs/prompts/*` (a full assistant **system prompt** + ingest
   map); all `.claude/` agent tooling; `Co-Authored-By: Claude` trailers across
   history; and **the operator's email in two files** —
   `research/claude-repo-comparison/BRIEF.md:4` and (chunked) `tools/rag/index.json:1474`.

2. **The license is MIT** (`LICENSE`, `README.md:88`, GitHub `license.key=mit`),
   but the shader rules treat the work as proprietary: *"This is paid work …
   a proprietary paid tool"* (`.claude/rules/shaders.md:10-14`). MIT grants anyone
   the right to use/modify/**sell** the code, including the from-scratch shaders
   the rules work hardest to protect. `src-tauri/Cargo.toml:6` separately has an
   empty `license` field.

These two are coupled: "public + MIT" is a coherent open-source posture;
"proprietary commercial instrument" is a coherent closed posture. The repo is
currently half-one, half-the-other, and the privacy rule's safety net ("it's
private") is simply void.

## Decision
**Option A — private + proprietary** (operator, 2026-07-01). The repo becomes a
closed, commercial-instrument posture, matching the "private/proprietary/commercial"
intent stated across the docs.

Applied in-repo this session:

- `LICENSE` → proprietary / all-rights-reserved (was MIT).
- `README.md` License section → proprietary (was "MIT").
- `src-tauri/Cargo.toml` `license` → `LicenseRef-Proprietary` (was empty).
- `research/claude-repo-comparison/BRIEF.md` owner email → redacted.
- `.claude/rules/deploy.md` ("repo is private") + `.claude/rules/shaders.md`
  ("paid/proprietary work") need **no rewrite** — they now hold as written.

Operator action (outside the repo): **flip the GitHub repo visibility to Private.**
Until that flip lands, treat the repo as public in practice.

Tracked follow-up (not history-rewriting): a full `grep`-clean of the
`events.bricem@gmail.com` string still present in `tools/rag/index.json` (clears on
the next off-device RAG reindex) and in two plan docs that cite it as example text —
see `docs/superpowers/plans/2026-06-21-stage1-decision-free-fixes.md`. Going private
contains the exposure; the scrub is defense-in-depth for any future re-open.

## Alternatives Considered

### Option A — Make it private + keep proprietary intent (recommended)
- Flip the GitHub repo to **private**; the existing privacy rule then holds as
  written, and the MIT `LICENSE` should change to proprietary/all-rights-reserved
  to match the "commercial paid tool" framing.
- Pros: matches the stated intent everywhere; restores the safety net the privacy
  rule depends on; protects the from-scratch shaders as the commercial asset.
- Cons: loses public-portfolio value; history still carries AI trailers (only
  matters if later re-opened).

### Option B — Stay public + embrace open-source
- Keep MIT + public; **delete the "repo is private" premise** from
  `.claude/rules/deploy.md` and `progress.md`, soften the "proprietary" language
  in `shaders.md`, and **scrub what shouldn't be public** regardless: redact the
  operator email (both copies), and decide whether `docs/prompts/*` (the ingested
  system prompt) and the verbose internal `progress.md` belong in a public repo.
- Pros: portfolio/credibility value; honest about being open.
- Cons: concedes the commercial-exclusivity stance; the system-prompt doc and
  internal narrative are awkward in public.

### Option C — Status quo (rejected)
- Leave the contradiction in place.
- Rejected: the privacy rule is actively relied on as a safety net while being
  false; the email PII is exposed; future agents will keep "relaxing for local"
  on a premise that no longer holds.

## Consequences
- **Either option requires fixing the email PII** (`BRIEF.md:4` +
  `tools/rag/index.json:1474`) — that is unconditional.
- Option A: update `LICENSE`; the privacy/shader rules need no rewrite.
- Option B: rewrite the privacy + shader-licensing rules to match; scrub
  `docs/prompts/` and audit `progress.md` for anything that shouldn't ship; fill
  `Cargo.toml` license to match MIT.
- Until decided, treat the repo as **public** in practice (don't commit anything
  you wouldn't publish), regardless of what the rules say.

## Related
- Audit: `docs/audits/2026-06-20-audit-20pass.md` (C2, I1) and
  `docs/audits/2026-06-20-audit.md`.
- `.claude/rules/deploy.md` (Client-side privacy), `.claude/rules/shaders.md`
  (write-our-own / commercial), `docs/decisions/001-backend-rule-scope.md`.
