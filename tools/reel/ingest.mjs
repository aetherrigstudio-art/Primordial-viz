// Reel ingest — turn a video URL (Instagram / YouTube / etc.) OR a local mp4
// into something an agent can actually "see": download it, then extract a frame
// montage (+ optional stills) and a metadata summary for design review. Dev-only
// tooling; output is gitignored. Reference-study only (see the licensing note in
// the `reel-ingest` skill — study technique, never copy assets/code).
//
//   npm run reel -- <url|file>                  # download + auto montage + meta
//   npm run reel -- <url> --grid 5x4            # explicit montage grid
//   npm run reel -- <url> --stills 2,8,15       # full-res stills at these seconds
//   npm run reel -- ./clip.mp4 --keep-video     # local file; keep the copy
//
// Self-bootstraps in a fresh container: installs yt-dlp (pip --user) and resolves
// the ffmpeg binary via the ffmpeg-static devDep, and teaches yt-dlp to trust the
// container's TLS-inspecting proxy CA (append the already-trusted system bundle to
// certifi — a trust addition, never a verification bypass).

import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, basename, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..'); // tools/reel -> repo root

// ---- arg parsing (pure) --------------------------------------------------
export function parseArgs(argv) {
  const a = { input: null, grid: null, stills: null, secsCap: null, out: null, keepVideo: false, noBootstrap: false };
  const rest = argv.slice();
  a.input = rest.shift() || null;
  for (let i = 0; i < rest.length; i++) {
    const f = rest[i];
    if (f === '--grid') a.grid = rest[++i];
    else if (f === '--stills') a.stills = rest[++i];
    else if (f === '--secs-cap') a.secsCap = Number(rest[++i]);
    else if (f === '--out') a.out = rest[++i];
    else if (f === '--keep-video') a.keepVideo = true;
    else if (f === '--no-bootstrap') a.noBootstrap = true;
  }
  return a;
}

// Pick an auto montage grid from a clip duration (seconds). ~1 frame / 2.5s,
// clamped to a readable 6..20 cells, 4 columns.
export function autoGrid(durationSec) {
  const n = Math.max(6, Math.min(20, Math.round((durationSec || 12) / 2.5)));
  const cols = 4;
  const rows = Math.ceil(n / cols);
  return { cols, rows, cells: cols * rows };
}

export function parseGrid(s) {
  const m = /^(\d+)x(\d+)$/.exec((s || '').trim());
  if (!m) return null;
  return { cols: +m[1], rows: +m[2], cells: +m[1] * +m[2] };
}

export function isUrl(s) {
  return /^https?:\/\//i.test(s || '');
}

// Slug for the output directory: reel/video id when we can spot one, else hash-ish.
export function slugFor(input) {
  if (isUrl(input)) {
    const m = input.match(/\/(reel|reels|p|shorts|watch|video)\/([A-Za-z0-9_-]+)/) ||
              input.match(/[?&]v=([A-Za-z0-9_-]+)/);
    if (m) return (m[2] || m[1]).slice(0, 24);
    return 'url-' + Buffer.from(input).toString('hex').slice(0, 10);
  }
  return basename(input).replace(/\.[^.]+$/, '').replace(/\W+/g, '_').slice(0, 32) || 'clip';
}

// ---- bootstrap (effectful) ----------------------------------------------
function ffmpegBin() {
  // ffmpeg-static exports the absolute path to a bundled binary.
  return execFileSync(process.execPath, ['-e', "process.stdout.write(require('ffmpeg-static')||'')"],
    { cwd: root, encoding: 'utf8' }).trim();
}

function ytdlpReady() {
  return spawnSync('python3', ['-m', 'yt_dlp', '--version'], { encoding: 'utf8' }).status === 0;
}

function ensureProxyCa() {
  // Make yt-dlp's certifi store trust the same CA curl/pip already trust.
  try {
    const certifi = execFileSync('python3', ['-c', 'import certifi;print(certifi.where())'], { encoding: 'utf8' }).trim();
    const sys = '/etc/ssl/certs/ca-certificates.crt';
    if (certifi && existsSync(certifi) && existsSync(sys)) {
      const marker = '# --- proxy CA appended (reel ingest) ---';
      if (!readFileSync(certifi, 'utf8').includes(marker)) {
        appendFileSync(certifi, '\n' + marker + '\n' + readFileSync(sys, 'utf8'));
      }
    }
  } catch { /* best-effort; download will surface a clear error if it still fails */ }
}

function bootstrap(noBootstrap) {
  let ff;
  try { ff = ffmpegBin(); } catch { ff = ''; }
  if (!ff || !existsSync(ff)) {
    if (noBootstrap) throw new Error('ffmpeg-static missing. Run: npm install');
    console.log('• installing ffmpeg-static (devDep)…');
    spawnSync('npm', ['install', 'ffmpeg-static', '--no-save'], { cwd: root, stdio: 'inherit' });
    ff = ffmpegBin();
  }
  if (!ytdlpReady() && !noBootstrap) {
    console.log('• installing yt-dlp (pip --user)…');
    spawnSync('pip3', ['install', '--user', '--quiet', 'yt-dlp'], { stdio: 'inherit' });
  }
  ensureProxyCa();
  return ff;
}

// ---- ffmpeg helpers ------------------------------------------------------
function probeDuration(ff, file) {
  const r = spawnSync(ff, ['-hide_banner', '-i', file], { encoding: 'utf8' });
  const out = (r.stderr || '') + (r.stdout || '');
  const m = out.match(/Duration:\s*(\d+):(\d+):([\d.]+)/);
  if (!m) return { dur: 0, info: out.match(/Stream.*Video:.*/)?.[0] || '' };
  const dur = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  return { dur, info: out.match(/Stream.*Video:.*/)?.[0] || '' };
}

function makeMontage(ff, file, outPng, grid, dur, secsCap) {
  const span = secsCap ? Math.min(dur, secsCap) : dur;
  const fps = grid.cells / Math.max(span, 0.1);
  const vf = `fps=${fps.toFixed(4)},scale=240:-1,tile=${grid.cols}x${grid.rows}`;
  const args = ['-hide_banner', '-loglevel', 'error'];
  if (secsCap) args.push('-t', String(secsCap));
  args.push('-i', file, '-vf', vf, '-frames:v', '1', outPng, '-y');
  const r = spawnSync(ff, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error('ffmpeg montage failed: ' + (r.stderr || ''));
}

function makeStill(ff, file, t, outPng) {
  spawnSync(ff, ['-hide_banner', '-loglevel', 'error', '-ss', String(t), '-i', file,
    '-vf', 'scale=480:-1', '-frames:v', '1', outPng, '-y'], { encoding: 'utf8' });
}

// ---- main ----------------------------------------------------------------
async function main() {
  const a = parseArgs(process.argv.slice(2));
  if (!a.input) {
    console.error('usage: npm run reel -- <url|file> [--grid CxR] [--stills t1,t2] [--secs-cap S] [--out DIR] [--keep-video] [--no-bootstrap]');
    process.exit(1);
  }
  const ff = bootstrap(a.noBootstrap);
  const slug = slugFor(a.input);
  const outDir = a.out ? resolve(a.out) : join(root, 'workshop', 'artifacts', 'reels', slug);
  mkdirSync(outDir, { recursive: true });

  let videoFile;
  let meta = {};
  if (isUrl(a.input)) {
    console.log(`• downloading ${a.input}`);
    const tmpl = join(outDir, 'video.%(ext)s');
    const r = spawnSync('python3', ['-m', 'yt_dlp', '--no-warnings', '--no-progress',
      '--write-info-json', '-f', 'mp4/best', '-o', tmpl, a.input],
      { encoding: 'utf8', stdio: ['ignore', 'inherit', 'inherit'] });
    if (r.status !== 0) { console.error('download failed (see above)'); process.exit(1); }
    videoFile = ['mp4', 'mkv', 'webm', 'mov'].map(e => join(outDir, 'video.' + e)).find(existsSync);
    const infoPath = join(outDir, 'video.info.json');
    if (existsSync(infoPath)) {
      try {
        const j = JSON.parse(readFileSync(infoPath, 'utf8'));
        meta = { title: j.title, uploader: j.uploader || j.channel, description: j.description,
          duration: j.duration, url: a.input, width: j.width, height: j.height };
      } catch { /* ignore */ }
    }
  } else {
    const src = resolve(a.input);
    if (!existsSync(src)) { console.error('no such file: ' + src); process.exit(1); }
    videoFile = a.keepVideo ? join(outDir, 'video' + (src.match(/\.[^.]+$/)?.[0] || '.mp4')) : src;
    if (a.keepVideo) copyFileSync(src, videoFile);
    meta = { url: src };
  }
  if (!videoFile) { console.error('no video produced'); process.exit(1); }

  const { dur, info } = probeDuration(ff, videoFile);
  const grid = parseGrid(a.grid) || autoGrid(dur || meta.duration);
  const montage = join(outDir, 'montage.png');
  makeMontage(ff, videoFile, montage, grid, dur || meta.duration || 12, a.secsCap);

  const stillPaths = [];
  if (a.stills) {
    for (const tRaw of a.stills.split(',')) {
      const t = Number(tRaw.trim());
      if (!Number.isFinite(t)) continue;
      const p = join(outDir, `still_${t}.png`);
      makeStill(ff, videoFile, t, p);
      if (existsSync(p)) stillPaths.push(p);
    }
  }

  const summary = { ...meta, durationSec: Math.round((dur || meta.duration || 0) * 10) / 10,
    stream: info, grid: `${grid.cols}x${grid.rows}`, montage, stills: stillPaths, dir: outDir };
  writeFileSync(join(outDir, 'meta.json'), JSON.stringify(summary, null, 2));

  console.log('\n— reel ingested —');
  if (meta.uploader) console.log('author   :', meta.uploader);
  if (meta.title) console.log('title    :', String(meta.title).slice(0, 120));
  console.log('duration :', summary.durationSec + 's', info ? '· ' + info.trim() : '');
  if (meta.description) console.log('caption  :', String(meta.description).replace(/\s+/g, ' ').slice(0, 240));
  console.log('montage  :', montage, `(${grid.cols}x${grid.rows})`);
  if (stillPaths.length) console.log('stills   :', stillPaths.join(', '));
  console.log('\nRead the montage to review:', montage);
}

// Only run when invoked directly (so the pure helpers can be unit-tested).
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(e => { console.error(e.message || e); process.exit(1); });
}
