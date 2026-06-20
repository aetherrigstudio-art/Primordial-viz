# Portfolio media gathering

Two ways to pull image/video candidates into one place so you can pick the best
for the portfolio. Neither is part of the web app and neither ships to the site.

- **Path A — Local PowerShell (on your own Windows PC).** Fast, no cloud, no
  secrets. Best when your media already lives on your machine or a Google Drive
  sync folder. See **Path A** below.
- **Path B — Cloud pipeline (Drive + Gemini, driven from your phone).** Pulls
  from a Google Drive folder, scores/tags with Gemini, builds a phone contact
  sheet, lands a finals artifact. Needs one-time OAuth + a Gemini key (store them
  in Proton Pass → GitHub secrets — that's sub-project #2). See **Path B** below.

They compose: use Path A to coarse-gather onto your PC, upload to a Drive folder,
then Path B to score + triage. Or just use whichever fits.

---

# Path A — Local gather (run on YOUR Windows PC)

A helper to pull image/video candidates off your own machine + Google Drive sync
folder into one folder.

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
scan paths** before approving so it doesn't walk your whole rig. If it runs long,
press **Esc** to interrupt and narrow it to one drive.

---

# Path B — Cloud pipeline (phone-only runbook)

Gather raw shots from Google Drive and Google Photos, have Gemini score and tag
them, get a contact sheet to tap through on your phone, pick keepers, and land
the final files as a downloadable artifact — all driven from your Android phone
with no laptop required.

## One-time setup

### 1. Google OAuth refresh token

You need a long-lived refresh token so the pipeline can pull your Drive folder
without you being there.

1. Open in your phone browser: `https://developers.google.com/oauthplayground`
2. In the top-right gear icon, tick **"Use your own OAuth credentials"** and
   paste your Client ID and Client Secret (from Google Cloud Console →
   Credentials).
3. In the left panel, find **"Drive API v3"** and select:
   ```
   https://www.googleapis.com/auth/drive.readonly
   ```
4. Tap **Authorize APIs** → sign in → **Exchange authorization code for tokens**.
5. Copy the **Refresh token** value.

**Important — Testing mode expiry:** if your Google Cloud project is in
**Testing** status (not verified/published), refresh tokens expire after
**7 days**. You will need to repeat this step when they expire. To avoid it,
publish the app or add your account as a test user in the OAuth consent screen.

### 2. Gemini API key

1. Go to `https://aistudio.google.com/app/apikey` on your phone.
2. Tap **Create API key** → copy the value.

**Privacy note:** the Gemini free tier may use your inputs to improve Google
models. This pipeline sends photo file names and (optionally) image data for
scoring. For portfolio artwork this is generally acceptable; if it is not,
upgrade to a paid Gemini tier which opts out of training.

### 3. Add secrets to GitHub

Go to your repo on the GitHub mobile app: **Settings → Secrets and variables →
Actions → New repository secret**. Add each one separately — one value per
block below so you can paste without splitting:

Secret name:
```
GOOGLE_CLIENT_ID
```

Secret name:
```
GOOGLE_CLIENT_SECRET
```

Secret name:
```
GOOGLE_REFRESH_TOKEN
```

Secret name:
```
GEMINI_API_KEY
```

Secret name:
```
DRIVE_FOLDER_ID
```
(Paste the Google Drive folder ID here — the long alphanumeric string from the
folder's share URL, e.g. `1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms`.)

## Coarse cull — Drive

In the **Google Drive** app:

1. Browse to the folder(s) with your gig/event shots.
2. Long-press to select, then move your candidates into **one new folder**.
3. Open that folder → tap the three-dot menu → **Folder details** →
   copy the folder ID from the share link.

Paste it as the `DRIVE_FOLDER_ID` secret (or supply it as the workflow input at
run time to override the secret).

## Coarse cull — Google Photos via Gemini

Use the **Gemini app** on your phone with the `@Google Photos` integration to
surface batches by description.

**R1 test (do this first):** before relying on Gemini for your real shoot,
spend 5 minutes verifying it can actually find your photos:

1. Open Gemini → type: `@Google Photos show me photos from [venue name] last
   weekend`
2. Confirm it returns real results from your library. If it returns nothing or
   wrong photos, the integration is not connected — check Gemini Extensions
   settings.

Once verified:

1. Prompt Gemini with descriptive terms (`@Google Photos neon lights gig dark
   atmosphere`, etc.) to surface batches.
2. Tap candidates into a **new Photos album**.
3. Go to `https://takeout.google.com` → select **Google Photos** → choose that
   album only → export.
4. When the Takeout zip arrives, unzip it and upload the media files into the
   same Drive folder you created above.

## Run the pipeline

In the **GitHub mobile app**:

1. Go to your repo → **Actions** → **portfolio-gather**.
2. Tap **Run workflow**.
3. Optionally paste a folder ID to override the secret for this run.
4. Tap **Run workflow** to confirm.

The workflow will:
- Pull media from your Drive folder.
- Score and tag each file with Gemini vision.
- Build an HTML contact sheet.
- Upload the sheet as the **contact-sheet** artifact.

## Triage — pick your keepers

1. Download the **contact-sheet** artifact from the completed Actions run.
2. Open `index.html` in the artifact on your phone.
3. Tap each image you want to keep — selected items highlight.
4. Tap **Save keepers** — this opens a pre-filled GitHub issue titled
   `portfolio-keepers` with a `keepers:` line listing the IDs you selected.
5. Submit the issue.

The `stage` job in the same workflow triggers automatically on that issue.

## Keeper hand-back (manifest persistence)

The `stage` job reads `work/manifest.json` from the repo. After a gather run,
commit the manifest so it is available when the stage job runs:

```
work/manifest.json
```

Download it from the gather run's artifact, add it to the repo under `work/`,
and push before or after submitting the keepers issue.

Fast-follow option: automate this by having the gather job commit the manifest
to a `portfolio-work` branch — noted for a future iteration.

## Finals artifact

After the `stage` job completes, download the **portfolio-finals** artifact.
It contains only your selected keepers, ready for sub-project #3 (touch-up /
delivery).

## Secrets reference

| Secret | Where it comes from |
|--------|---------------------|
| `GOOGLE_CLIENT_ID` | Google Cloud Console → Credentials |
| `GOOGLE_CLIENT_SECRET` | Google Cloud Console → Credentials |
| `GOOGLE_REFRESH_TOKEN` | OAuth 2.0 Playground (7-day expiry in Testing mode) |
| `GEMINI_API_KEY` | Google AI Studio |
| `DRIVE_FOLDER_ID` | Drive folder share URL |

Store all values in **Proton Pass** (sub-project #2) before pasting into GitHub.
