<#
.SYNOPSIS
  Gather portfolio image/video candidates from local + Google Drive folders.

.DESCRIPTION
  Scans the source folders you list (below, in CONFIG) for images and videos
  that match your project keywords and/or a date range, then copies the matches
  into one destination folder organised by type.

  SAFE BY DEFAULT: it runs as a DRY RUN unless you add -Execute. The dry run
  only LISTS what it found and the total size -- it copies nothing. This is the
  "review before the drive dump" guard: check the count + GB total + the folders
  it scanned, and only then re-run with -Execute to actually copy.

  Guards against accidentally duplicating hundreds of GB:
    - skips files bigger than the per-type size caps (CONFIG)
    - skips noise folders/files (VJ loops, Unreal textures, caches -- CONFIG)
    - never touches the source files; it only copies

.EXAMPLE
  # 1) DRY RUN -- see what would be gathered, copies nothing:
  powershell -ExecutionPolicy Bypass -File .\Gather-PortfolioMedia.ps1

  # 2) Looks right? Actually copy the files:
  powershell -ExecutionPolicy Bypass -File .\Gather-PortfolioMedia.ps1 -Execute

.NOTES
  Edit the CONFIG block below first. On Windows, your Google Drive usually syncs
  to a local folder (e.g. G:\My Drive or C:\Users\<you>\My Drive) -- point a
  source at that. Google PHOTOS does not sync to a folder; use Google Takeout to
  export the albums you want, then point a source at the unzipped Takeout folder.
#>

[CmdletBinding()]
param(
  # Add this switch to actually copy. Without it the script is a dry run.
  [switch]$Execute
)

# ============================== CONFIG =====================================
# Edit these, then run. Keep the @( ... ) brackets; one quoted item per line.

# Folders to SCAN. Be specific -- do NOT put a bare drive root like 'C:\' here
# unless you mean it. Point these at your Google Drive sync folder and/or the
# specific project folders you care about.
$SourceFolders = @(
  'G:\My Drive'
  # 'C:\Users\you\Pictures'
  # 'D:\Projects'
  # 'C:\Users\you\Downloads\Takeout'   # unzipped Google Photos Takeout
)

# Project name keywords. A file matches if its full path or name contains ANY of
# these (case-insensitive). LEAVE EMPTY (@()) to match every file in range.
$ProjectKeywords = @(
  # 'aether'
  # 'primordial'
  # 'gig-2025'
)

# Date window on the file's last-modified time. Use '' (empty) to skip a bound.
$After  = ''   # e.g. '2024-01-01'  -> only files modified on/after this date
$Before = ''   # e.g. '2025-12-31'  -> only files modified on/before this date

# Where to COPY the keepers. Created if missing. Type subfolders added inside.
$Destination = 'C:\PortfolioMedia'

# File types to collect.
$ImageExt = @('.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.heic', '.bmp')
$VideoExt = @('.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.mpg', '.mpeg')

# Size caps (MB). Files larger than the cap for their type are SKIPPED -- this is
# what stops a 500 GB VJ-loop / Unreal-texture dump. Raise if you have legit big
# hero videos.
$MaxImageMB = 75
$MaxVideoMB = 3000

# Skip any file whose FULL PATH contains one of these (case-insensitive). This
# excludes render caches, engine assets, and bulk loop libraries.
$ExcludePathPatterns = @(
  '\node_modules\', '\.git\', '\AppData\', '\Library\Caches\',
  'vjloop', 'vj_loop', 'vj-loop', '\loops\', '\unreal\', '\ue4\', '\ue5\',
  'derivedDataCache', '\textures\', 'lightmap', '\proxy\', '\cache\', '\temp\',
  '\thumbnails\', '.thumb', 'screenshot' # drop 'screenshot' if you want screenshots
)
# ===========================================================================


function Format-Size([long]$bytes) {
  if ($bytes -ge 1GB) { return ('{0:N2} GB' -f ($bytes / 1GB)) }
  if ($bytes -ge 1MB) { return ('{0:N1} MB' -f ($bytes / 1MB)) }
  return ('{0:N0} KB' -f ($bytes / 1KB))
}

$ErrorActionPreference = 'Stop'
$allExt = $ImageExt + $VideoExt

# Parse date bounds.
$afterDate  = if ($After)  { [datetime]::Parse($After) }  else { $null }
$beforeDate = if ($Before) { ([datetime]::Parse($Before)).AddDays(1).AddSeconds(-1) } else { $null }

Write-Host ''
Write-Host '=== Portfolio media gather ===' -ForegroundColor Cyan
Write-Host ("Mode      : {0}" -f $(if ($Execute) { 'EXECUTE (will copy)' } else { 'DRY RUN (no copy)' })) -ForegroundColor $(if ($Execute) { 'Yellow' } else { 'Green' })
Write-Host ("Keywords  : {0}" -f $(if ($ProjectKeywords.Count) { $ProjectKeywords -join ', ' } else { '(any)' }))
Write-Host ("Date      : {0} .. {1}" -f $(if ($afterDate) { $After } else { 'any' }), $(if ($beforeDate) { $Before } else { 'any' }))
Write-Host ("Dest      : {0}" -f $Destination)
Write-Host ''

# Validate sources up front so a typo fails loudly instead of silently.
$validSources = @()
foreach ($s in $SourceFolders) {
  if (Test-Path -LiteralPath $s) { $validSources += $s }
  else { Write-Host ("  ! source not found, skipping: {0}" -f $s) -ForegroundColor Red }
}
if (-not $validSources) { Write-Host 'No valid source folders. Edit $SourceFolders in CONFIG.' -ForegroundColor Red; return }

# --- Scan -----------------------------------------------------------------
$matches = New-Object System.Collections.Generic.List[object]
foreach ($src in $validSources) {
  Write-Host ("Scanning {0} ..." -f $src) -ForegroundColor DarkCyan
  Get-ChildItem -LiteralPath $src -Recurse -File -Force -ErrorAction SilentlyContinue |
    ForEach-Object {
      $f = $_
      $ext = $f.Extension.ToLowerInvariant()
      if ($allExt -notcontains $ext) { return }

      $path = $f.FullName
      $lower = $path.ToLowerInvariant()

      foreach ($pat in $ExcludePathPatterns) { if ($lower.Contains($pat.ToLowerInvariant())) { return } }

      if ($afterDate  -and $f.LastWriteTime -lt $afterDate)  { return }
      if ($beforeDate -and $f.LastWriteTime -gt $beforeDate) { return }

      if ($ProjectKeywords.Count) {
        $hit = $false
        foreach ($kw in $ProjectKeywords) { if ($lower.Contains($kw.ToLowerInvariant())) { $hit = $true; break } }
        if (-not $hit) { return }
      }

      $isVideo = $VideoExt -contains $ext
      $capMB = if ($isVideo) { $MaxVideoMB } else { $MaxImageMB }
      if ($f.Length -gt ($capMB * 1MB)) { return }

      $matches.Add([pscustomobject]@{
        Path     = $path
        Name     = $f.Name
        Ext      = $ext
        Bytes    = $f.Length
        Modified = $f.LastWriteTime
        Type     = if ($isVideo) { 'videos' } else { 'images' }
      })
    }
}

if ($matches.Count -eq 0) {
  Write-Host ''
  Write-Host 'No matching files. Widen the keywords / dates / size caps in CONFIG.' -ForegroundColor Yellow
  return
}

# --- Report ---------------------------------------------------------------
$totalBytes = ($matches | Measure-Object Bytes -Sum).Sum
Write-Host ''
Write-Host ('Found {0} files, {1} total:' -f $matches.Count, (Format-Size $totalBytes)) -ForegroundColor Green
$matches | Group-Object Type | ForEach-Object {
  $b = ($_.Group | Measure-Object Bytes -Sum).Sum
  Write-Host ('  {0,-7} {1,5} files  {2}' -f $_.Name, $_.Count, (Format-Size $b))
}
Write-Host ''
Write-Host 'Largest 10:' -ForegroundColor DarkGray
$matches | Sort-Object Bytes -Descending | Select-Object -First 10 |
  ForEach-Object { Write-Host ('  {0,8}  {1}' -f (Format-Size $_.Bytes), $_.Path) -ForegroundColor DarkGray }

if (-not $Execute) {
  Write-Host ''
  Write-Host 'DRY RUN -- nothing copied. If the count + size + folders look right,' -ForegroundColor Green
  Write-Host 're-run with  -Execute  to copy into the destination.' -ForegroundColor Green
  return
}

# --- Copy -----------------------------------------------------------------
Write-Host ''
Write-Host ('Copying {0} files to {1} ...' -f $matches.Count, $Destination) -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $Destination | Out-Null
$manifest = New-Object System.Collections.Generic.List[object]
$copied = 0; $skipped = 0; $i = 0

foreach ($m in $matches) {
  $i++
  Write-Progress -Activity 'Copying portfolio media' -Status ('{0}/{1}' -f $i, $matches.Count) -PercentComplete ($i / $matches.Count * 100)
  $typeDir = Join-Path $Destination $m.Type
  New-Item -ItemType Directory -Force -Path $typeDir | Out-Null

  $dest = Join-Path $typeDir $m.Name
  # Collision handling: identical size => treat as dup and skip; else add a counter.
  if (Test-Path -LiteralPath $dest) {
    if ((Get-Item -LiteralPath $dest).Length -eq $m.Bytes) {
      $skipped++
      $manifest.Add([pscustomobject]@{ Source = $m.Path; Dest = $dest; Status = 'dup-skipped'; Bytes = $m.Bytes })
      continue
    }
    $base = [IO.Path]::GetFileNameWithoutExtension($m.Name)
    $n = 1
    do { $dest = Join-Path $typeDir ('{0}_{1}{2}' -f $base, $n, $m.Ext); $n++ } while (Test-Path -LiteralPath $dest)
  }

  try {
    Copy-Item -LiteralPath $m.Path -Destination $dest -ErrorAction Stop
    $copied++
    $manifest.Add([pscustomobject]@{ Source = $m.Path; Dest = $dest; Status = 'copied'; Bytes = $m.Bytes })
  } catch {
    $skipped++
    Write-Host ('  ! failed: {0} ({1})' -f $m.Path, $_.Exception.Message) -ForegroundColor Red
    $manifest.Add([pscustomobject]@{ Source = $m.Path; Dest = $dest; Status = 'failed'; Bytes = $m.Bytes })
  }
}
Write-Progress -Activity 'Copying portfolio media' -Completed

$manifestPath = Join-Path $Destination ('manifest_{0:yyyyMMdd_HHmmss}.csv' -f (Get-Date))
$manifest | Export-Csv -LiteralPath $manifestPath -NoTypeInformation -Encoding UTF8

Write-Host ''
Write-Host ('Done. Copied {0}, skipped {1}. Manifest: {2}' -f $copied, $skipped, $manifestPath) -ForegroundColor Green
