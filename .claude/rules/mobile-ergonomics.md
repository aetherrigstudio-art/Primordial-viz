# Mobile-ergonomics rule — the operator drives mostly from a phone

The operator runs this project largely from an **Android phone**, now with a
**server / CI to help with the heavy lifting** (builds, bundlers, headless tooling).
So this rule is **softened** (ADR-006): the hard *"a phone can't do X"* constraints
relax — anything needing a build or heavy tooling just runs on the server/CI — but
**hand-offs *to* the operator stay phone-friendly**, because the operator is still on a
phone. (Scope: how I hand work *to the operator* — not the mobile-GPU *playback* budget,
which lives in `.claude/rules/shaders.md`.)

Device is detectable: `CLAUDE_CODE_ENTRYPOINT` contains `mobile` for a phone session.

## Keep operator-facing handoffs phone-friendly (still true)

- **Prefer small copy-paste.** Long blocks are awkward on Android. When the operator
  must paste a value (a GitHub secret, a form field), give **one value per fenced code
  block**, short and labelled — not one big blob to split by hand.
- **Prefer actions I can take from the container** (GitHub MCP, commits/pushes) over
  "do X in the desktop / GitHub web UI" steps. If a step needs the operator, make it the
  smallest possible tap.
- **Deliver files with `SendUserFile`**, not `file://` paths (those don't open on a
  phone). See the `send-report` skill.
- **Deploy via GitHub state**, not local FTP — the container is HTTPS-443-only and the
  phone can't FTP; push → GitHub Actions FTPS uploads; verify by `curl`-ing the live URL.

## What the server/CI now unlocks (the softening)

- **Builds & bundlers are fine** — a build step (e.g. Vite/Astro for the re-platform)
  runs on CI/the server; the operator never builds on the phone. Don't avoid a build
  just because "the phone can't."
- **Heavy/local tooling** (headless Chromium, the MCP server, embedders) runs in the
  container/CI, not on the phone.

## Communication on a phone

- **Concise, scannable, plain language.** Lead with the result; offer depth rather than
  dumping it (long replies also hit the output-token cap). Short paragraphs read better
  on a small screen.
- **Minimal jargon.** Explain infra plainly or link the doc.

Rule of thumb (softened): **builds & heavy tooling → the server; operator-facing
handoffs → phone-friendly.** Don't gate *capabilities* on the phone — but do keep what
you hand the operator easy to act on from one.
