---
name: reel-ingest
area: research
description: Download a video reference (Instagram reel / YouTube short / any URL) or an uploaded mp4, then extract a frame montage + metadata so it can actually be reviewed. Use when the user shares a reel/short/video link or clip as a design reference, asks "look at this video", or wants visual references gathered for the landing page / visual workshop. Reference-study only (commercial licensing).
allowed-tools: Read, Bash(npm run reel:*), Bash(node tools/reel/ingest.mjs:*)
---

# reel-ingest — turn a video link into something I can see

An agent can't watch an mp4. This tool downloads a video (Instagram, YouTube,
TikTok, etc. via `yt-dlp`, or a local file) and renders a **frame montage** plus a
metadata summary (author, caption, duration) — so the visuals can be reviewed and
reacted to. Dev-only tooling; output is **gitignored**.

## The loop

1. **Ingest.** One command, URL or local file:
   ```
   npm run reel -- <url|file>
   ```
   It self-bootstraps in a fresh container (installs `yt-dlp` via pip, resolves the
   `ffmpeg-static` devDep, and teaches `yt-dlp` to trust the container's TLS proxy
   CA — a trust addition, never a `--no-check-certificate` bypass).
2. **Review.** `Read` the printed `montage.png` (a grid of frames across the clip)
   to see the whole thing at a glance; the caption/metadata print to the console.
3. **Zoom in (optional).** Full-res stills at chosen seconds, or a custom grid:
   ```
   npm run reel -- <url> --stills 2,8,15      # stills at those seconds
   npm run reel -- <url> --grid 5x4           # explicit montage grid
   npm run reel -- ./clip.mp4 --keep-video    # local mp4; keep a copy
   ```
4. **Capture what matters.** Write the takeaways (palette, motion, technique) into
   the relevant `workshop/sketches/<name>/references.md` — the montage media itself
   is gitignored and won't survive a wipe; the notes should.

Output lands in `workshop/artifacts/reels/<id>/` (`video.*`, `montage.png`,
`meta.json`). Flags: `--secs-cap S` (montage only the first S seconds),
`--out DIR`, `--no-bootstrap` (fail instead of auto-installing).

## Licensing guardrail (load-bearing)

This is **reference study only**. These clips are other people's commercial work —
study *technique and direction* (palette, motion, shader approach), then author
everything from a blank file per `.claude/rules/shaders.md`. **Never** copy their
code or assets, and don't redistribute the downloaded media (it stays in the
gitignored artifacts dir).

## Notes

- Public reels/shorts download without login; private/age-gated ones need cookies
  (not wired up — keep it to public references).
- `yt-dlp` is Python (pip), not an npm dep; `ffmpeg-static` is a devDep. Both are
  dev-only and never deployed (deploy stages only `index.html src`).
- Pure arg/slug/grid helpers in `tools/reel/ingest.mjs` are unit-tested in
  `test/reel-ingest.test.mjs`.
