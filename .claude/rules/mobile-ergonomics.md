# Mobile-ergonomics rule — the operator drives this from a phone

The operator runs this project from an **Android phone**, not a laptop. Most of
the friction in this repo's history came from handing back steps that assume a
desktop. This rule is the durable fix. (Scope: how I hand work *to the operator*
— not the mobile-GPU *perf* budget, which lives in `.claude/rules/shaders.md`.)

Device is detectable: `CLAUDE_CODE_ENTRYPOINT` contains `mobile` for a phone
session (the `orient` and `inject-rules` hooks already branch on it).

## What breaks on a phone — design around it

- **No large copy-paste.** Copying long blocks fails on Android. When the operator
  must paste somewhere (a GitHub secret, a cPanel field), give **one value per
  fenced code block**, each short and self-contained — never one big blob to
  split by hand. Label which field each block is for (host / user / password).
- **No desktop / GitHub-web UI steps assumed.** The GitHub web UI and "do X on
  your desktop" are unreliable here. Prefer actions *I* can take from the
  container (GitHub MCP tools, commits/pushes) over steps the operator must click
  through. If a step truly needs the operator, make it the smallest possible tap.
- **The operator has the `gh` CLI on the phone (Termux).** It's the escape hatch
  for GitHub operations my container can't do — the GitHub MCP tools have **no**
  repo-settings surface (visibility, delete-branch, transfer), and the git proxy
  **403s on delete-push**. When you hit one of those, hand the operator a **single,
  complete `gh` line** to paste (one code block, no flags to assemble by hand).
  Known gotchas: `gh` is in Termux's repo (`pkg install gh`, not the binary
  download); `gh auth login` → GitHub.com → HTTPS → browser is the phone path; and
  **`gh repo edit --visibility` requires `--accept-visibility-change-consequences`**
  or it refuses. Verify the result yourself (e.g. anonymous `curl -o /dev/null -w
  '%{http_code}' <repo-url>` → 200 public / 404 private) rather than trusting "done".
- **`file://` links are unreachable.** Reports/artifacts under `/root/...` or
  `file:///...` don't open on the phone. Deliver the file itself with
  `SendUserFile` (see the `send-report` skill), not a path.
- **Deploy is driven by GitHub state, never local FTP.** The container is
  HTTPS-443-only (FTP/21 + cPanel/2083 blocked), and the operator can't FTP from
  the phone either. Push → GitHub Actions FTPS does the upload; verify by
  `curl`-ing the live HTTPS URL. See `.claude/rules/deploy.md` + the `deploy-check`
  skill. Don't propose headless-paste, "keep it on the desktop," or manual FTP.

## Communication on a phone

- **Concise, scannable, plain language.** Lead with the result; offer depth rather
  than dumping it (long replies also hit the output-token cap — a real failure
  mode here). Short paragraphs and tight lists read far better on a small screen.
- **Minimal jargon.** The operator is the artist/performer, not always deep in the
  stack — explain infra plainly or link the doc, don't assume.

Rule of thumb: **if a step needs a laptop, it's the wrong step.** Find the path
that works from a phone — or do it myself from the container.
