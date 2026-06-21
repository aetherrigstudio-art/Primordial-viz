# ADR-006: Soften phone-based-development rules (operator still on a phone; server assists)

## Status
**Accepted** — operator-directed 2026-06-21. **Corrects** an initial over-broad framing
(2026-06-20) that read the operator's "we no longer use phone-based-development rules" as
*retire/delete*. The operator clarified: **they still develop from a phone**, now with a
**server/CI to help** — so the rules are **softened, not removed**. Never executed in the
over-broad form.

## Date
2026-06-21 (supersedes the 2026-06-20 "retire" framing)

## Context
Many repo conventions exist because the operator drives from an **Android phone**. The
operator now has a **server/CI** to do the heavy lifting (builds, bundlers, headless
tooling) — but **remains on the phone** as the operating interface
(`CLAUDE_CODE_ENTRYPOINT` = `remote_mobile`). So the phone premise is **still real**; only
its *hard constraints* relax.

Two different "mobile" concerns — keep them separate:
- **Operator dev device** (the phone the operator works from) → the ergonomics rules.
  **Softened, kept.**
- **Playback device** (the gig phone GPU running the visuals) → the mobile-GPU perf budget
  in `.claude/rules/shaders.md`. **Unchanged, kept.** Don't conflate.

## Decision
**Soften** the operator-on-a-phone rules; do **not** delete them.
- **Keep `.claude/rules/mobile-ergonomics.md`** (softened in place): operator-facing
  handoffs stay phone-friendly (one value per code block, `SendUserFile` over `file://`,
  deploy via GitHub state, concise/low-jargon replies) — because the operator is still on
  a phone.
- **Relax the hard "a phone can't do X" constraint**: builds and heavy tooling (Vite/Next
  build, headless Chromium, the MCP server, embedders) run on the **server/CI**, not the
  phone — so don't avoid a build step just because the phone can't run it.
- **Keep** the `shaders.md` mobile-GPU **playback** budget, scoped to the playback device.
- **Keep** the device-aware hook branches (`orient.sh`, `inject-rules.sh`) — they still
  correctly detect the phone operator and surface phone-friendly guidance.

## Alternatives Considered
- **Retire/delete entirely** (the original 2026-06-20 framing) — **rejected**: the operator
  still develops on a phone, so deleting the ergonomics would re-introduce the exact
  desktop-assuming friction the rule fixed.
- **Status quo (hard phone-only constraints)** — rejected: outdated now that a server/CI
  assists, and it would block the build the re-platform needs.

## Consequences
- `mobile-ergonomics.md` is softened in place (done) — NOT deleted. Any plan step that said
  "delete `mobile-ergonomics.md` / scrub the phone rules" is **superseded**: reword to "the
  phone rules are softened, not removed."
- The re-platform's build step is unblocked (builds run on CI/server) — consistent
  with ADR-012 and the no-build-Stage-1 research.
- No mass file-scrub needed; the hooks/conduct/CLAUDE phone guidance stays valid.

## Related
- `.claude/rules/mobile-ergonomics.md` (softened, kept), `.claude/rules/shaders.md`
  (playback budget — unchanged), `.claude/hooks/inject-rules.sh` (operator-vs-playback
  split), `docs/decisions/012-replatform-target.md`,
  `docs/decisions/005-public-repo-and-license-posture.md`.
</content>
