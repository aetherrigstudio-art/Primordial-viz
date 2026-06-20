# Codespaces / dev container — and how NOT to waste free hours

This `.devcontainer/` makes a GitHub Codespace (or any dev-container host) boot
ready: Node 22 + the repo's dev/test toolchain (`npm ci`). It's **dev-tooling
only** — the web app stays zero runtime dependency.

## Why this exists

Codespaces bills by **wall-clock time the machine is running**, not by how hard
you use it. Without a dev container, every new Codespace burns interactive minutes
installing the toolchain by hand. With one, `npm ci` runs once at create time
(and is **prebuild-cacheable**, see below), so sessions start fast and you spend
hours on work, not setup.

## The free quota (personal account)

~**120 core-hours/month** = ~**60 real hours** on a **2-core** machine
(2 core-hours per real hour), plus **15 GB** storage. Compute is billed only while
the codespace is **running**; **storage is billed even when it's stopped** (until
you delete it).

## Not wasting hours — the rules

1. **Lower the idle timeout to 5 minutes.** Default is 30 (range 5–240). Set it at
   `github.com/settings/codespaces` → *Default idle timeout*. A codespace
   auto-stops (stops billing compute) after that much inactivity.
2. **Use the smallest (2-core) machine.** Bigger machines burn core-hours faster
   (4-core = 4 core-hours/real-hour → only ~30 real hours from the quota).
3. **Stop it yourself when you step away** — don't rely on closing the browser tab
   (that does NOT stop it; only the idle timer does). Command palette →
   *Codespaces: Stop Current Codespace*.
4. **Don't leave a dev server running.** Idle = "no user presence," and the docs
   are explicit that **terminal output resets the idle timer** — so a running
   `python3 -m http.server` that logs page requests can keep the machine awake and
   billing indefinitely. Start the server only while testing, then **Ctrl-C it**.
5. **Delete the codespace when a work block is fully done** to stop the 15 GB
   storage clock (`github.com/codespaces` → … → *Delete*). Your work is safe once
   it's committed + pushed.
6. **Watch usage** at `github.com/settings/billing` → Codespaces.

## Make startup (near-)free with prebuilds

Optional but recommended for short-term heavy use: enable a **prebuild** at
`Repo → Settings → Codespaces → Set up prebuild`. Prebuilds run the create step
(`onCreateCommand` = `npm ci`) on **GitHub Actions** (a separate minutes budget,
free for this private repo within the Actions allowance), so the Codespace starts
in seconds and the install doesn't eat your **compute** hours.

## Heavy extras (opt-in — not auto-installed, to keep create fast)

Only run these inside the Codespace if you actually need them (they're slow and
would otherwise burn create-time hours):

`npx playwright install chromium`

`node test/render-check.mjs`

The RAG embedding model downloads itself on the first `npm run rag:index` /
semantic query — no manual step. The full one-shot toolchain install lives in
`.claude/cloud-setup.sh` (written for the Claude cloud env, but its commands work
here too).

## Reminder

The repo's continuity + verify story is unchanged: `npm run health` is the gate,
only committed files survive, and `git push` is how work leaves the box. See
`CLAUDE.md` / `ONBOARDING.md`.
