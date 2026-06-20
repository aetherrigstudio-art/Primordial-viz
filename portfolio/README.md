# Portfolio media gathering (run on YOUR Windows PC)

This is **not** part of the web app and never ships to the site. It's a helper
to pull image/video candidates off your own machine + Google Drive into one
folder, so you can pick the best for the portfolio.

> The cloud Claude Code session **cannot** do this for you — it can't see your
> PC, drives, or Google account. Run the steps below on your own Windows rig
> (Claude Code desktop/CLI), where your files actually live.

## Quick start

1. Copy `Gather-PortfolioMedia.ps1` to your PC.
2. Open it and edit the **CONFIG** block at the top:
   - `$SourceFolders` — the folders to scan (your Google Drive sync folder, project folders).
   - `$ProjectKeywords` — project names to match (or leave empty for all).
   - `$After` / `$Before` — date window (or leave empty).
   - `$Destination` — where keepers get copied.
3. **Dry run first** (copies nothing — just shows the count + total GB + folders):

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Gather-PortfolioMedia.ps1
   ```

4. If the count, total size, and largest-files list look sane, **actually copy**:

   ```powershell
   powershell -ExecutionPolicy Bypass -File .\Gather-PortfolioMedia.ps1 -Execute
   ```

The dry run is the safety guard: review before any copy so you don't duplicate
hundreds of GB of VJ loops or engine textures. The script also skips oversized
files and noise folders automatically (see `$MaxVideoMB`, `$ExcludePathPatterns`).

## Google Drive vs Google Photos

- **Google Drive** syncs to a local folder on Windows (e.g. `G:\My Drive` or
  `C:\Users\<you>\My Drive`). Point a `$SourceFolders` entry at it.
- **Google Photos** does *not* sync to a folder. Export what you want via
  **Google Takeout** (photos.google.com → albums → Takeout), unzip it, and point
  a `$SourceFolders` entry at the unzipped Takeout folder.

## Prompt to paste into Claude Code on your PC (optional)

If you'd rather drive it conversationally with Claude Code running locally,
paste something like this (fill in YOUR specifics):

```
I want to gather portfolio image/video candidates into C:\PortfolioMedia.
Scan these folders only: G:\My Drive, D:\Projects.
Keep only files matching these project names: <name1>, <name2>.
Date range: modified between 2024-01-01 and 2025-12-31.
Images: jpg/png/webp/tif/heic under 75 MB. Videos: mp4/mov/webm under 3 GB.
Skip anything under \node_modules\, \cache\, vj-loop, \unreal\, \textures\.
FIRST do a dry run: list the count, total size, and the 10 largest matches —
copy nothing yet. Show me, and wait for my OK before copying.
```

When Claude proposes the `Get-ChildItem` / `Copy-Item` commands, **review the
scan paths** before approving (step 4 of the workflow) so it doesn't walk your
whole rig. If it runs long, press **Esc** to interrupt and narrow it to one
drive.
