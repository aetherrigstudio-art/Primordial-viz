# ADR-006: Retire phone-based-development constraints

## Status
**Accepted** — operator-directed 2026-06-20 ("we no longer will be using rules that
are to allow for phone based development"). The decision is made; the file cleanup it
implies is the consequence (tracked below), not yet executed.

## Date
2026-06-20

## Context
A large share of this repo's conventions exist because the operator drove it from an
**Android phone**, with no laptop. That premise is written into:
- the dedicated rule `.claude/rules/mobile-ergonomics.md` ("if a step needs a laptop,
  it's the wrong step"; one value per code block; `SendUserFile` over `file://`;
  deploy via GitHub state, never local FTP);
- `.claude/rules/conduct.md` §4 (phone ergonomics) and the Communication rule in
  `CLAUDE.md`;
- device-aware branches in `.claude/hooks/orient.sh` and `.claude/hooks/inject-rules.sh`
  (they branch on `CLAUDE_CODE_ENTRYPOINT` containing `mobile`);
- phone framing in `.claude/ROADMAP.md`, `.claude/TODO.md`, `.claude/rules/gotchas.md`,
  and skills `deploy-cpanel`, `visual-workshop`, `skill-router`, `perf-budget`,
  `send-report`, `thought-based-reasoning`; and the `visual-qa` agent.

The operator is moving to a **server / PC** workflow, so the "operator is on a phone"
premise no longer holds and must stop shaping decisions (hand-offs, formatting, deploy
mechanics, tool choices).

**Critical distinction — two different devices.** "Mobile" means two unrelated things
here, and only one is being retired:
- **Operator dev device** (the phone the operator *worked from*) → the premise behind
  the ergonomics rules. **This is what's retired.**
- **Playback device** (the gig audience's phone GPU that *runs the visuals*) → the
  premise behind the **mobile-GPU performance budget** in `.claude/rules/shaders.md`
  (FBO render-scale, raymarch step cap ≤64, dynamic resolution, pause-on-hidden).
  **This STAYS** — the visuals still play on phones. The `inject-rules.sh` hook already
  encodes this split ("operator-device vs playback-device"); do not collapse them.

## Decision
Retire the **operator-on-a-phone** constraints. Concretely:
- **Drop** `.claude/rules/mobile-ergonomics.md` and the phone-ergonomics content it
  anchors (conduct §4 phone bits; the device-aware phone branches in `orient.sh` /
  `inject-rules.sh`; phone framing in `CLAUDE.md` / ROADMAP / TODO / gotchas / the six
  skills / the `visual-qa` agent).
- **Keep** the mobile-GPU **playback** perf budget in `shaders.md`, re-labelled to make
  the playback-device scope explicit so it is never mistaken for a dev-device rule.
- **Keep** `SendUserFile` as a general capability for delivering artifacts; drop only
  its *mandate* ("always, because `file://` is unreachable on the phone").
- **Keep** GitHub-Actions-driven deploy (it's the right design regardless of device);
  drop only the "because you can't FTP from a phone" justification.

## Alternatives Considered
### Option A — Retire fully now, in one cleanup pass (recommended)
- Delete `mobile-ergonomics.md`; scrub the ~15 referencing files in a single tracked
  commit; relabel the `shaders.md` budget as playback-scoped.
- Pros: clean, no half-state; the distinction above is captured once.
- Cons: touches many files at once (mitigated: it's mechanical + reviewable).

### Option B — Deprecate-in-place
- Mark `mobile-ergonomics.md` "RETIRED, see ADR-006" but leave the references.
- Rejected for the end state; acceptable as an interim if the full scrub must wait.

### Option C — Status quo
- Rejected: the operator has explicitly retired the premise.

## Consequences
- A cleanup work-item (its own refactor phase — see the **rules/drift** phase plan)
  edits ~15 files; until done, treat the phone-ergonomics rules as **void** (don't
  format for a phone, don't gate steps on "phone can't do X").
- The `shaders.md` perf budget must be **preserved and re-scoped** in the same pass, or
  a future agent may "retire" it too by mistake — that would break mobile playback.
- The `orient.sh` / `inject-rules.sh` device branches simplify (drop the mobile arm).
- `.claude/rules/conduct.md`, `CLAUDE.md` Communication rule: keep "concise, plain
  language" (good practice anywhere); drop the phone-specific mechanics.

## Related
- `.claude/rules/mobile-ergonomics.md` (retired), `.claude/rules/shaders.md`
  (playback perf budget — kept), `.claude/rules/conduct.md` §4, `.claude/hooks/inject-rules.sh`
  (operator-vs-playback split), `docs/decisions/005-public-repo-and-license-posture.md`.
