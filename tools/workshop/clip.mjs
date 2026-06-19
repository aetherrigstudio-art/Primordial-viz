// Record a workshop sketch to a webm clip (and optional stills) for phone
// review. Serves the repo, loads workshop/sandbox.html?sketch=<name> in
// headless Chromium (SwiftShader), and records with Playwright's built-in
// video capture (no ffmpeg). Reuses tools/mcp/lib/browser.mjs. Dev-only.
//
//   npm run clip -- <name>             # ~5s webm  -> workshop/artifacts/<name>.webm
//   npm run clip -- <name> --stills 4  # 4 PNG keyframes for side-by-side
//   npm run clip -- <name> --secs 8    # longer capture

import { spawn } from 'node:child_process';
import { mkdirSync, renameSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import net from 'node:net';
import { launchBrowser } from '../mcp/lib/browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..'); // tools/workshop -> repo root
const artifacts = join(root, 'workshop', 'artifacts');

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, () => { const { port } = s.address(); s.close(() => res(port)); });
    s.on('error', rej);
  });
}
function flagVal(flag, def) {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : def;
}

const name = process.argv[2];
if (!name || name.startsWith('--') || !/^[a-z0-9_-]+$/i.test(name)) {
  console.error('usage: npm run clip -- <sketch-name> [--stills N] [--secs S]');
  process.exit(1);
}
const stills = process.argv.includes('--stills') ? Number(flagVal('--stills', 4)) : 0;
const secs = Number(flagVal('--secs', 5));
const size = { width: 800, height: 450 };

mkdirSync(artifacts, { recursive: true });
const port = await freePort();
const server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
try {
  await new Promise((r) => setTimeout(r, 800));
  const url = `http://localhost:${port}/workshop/sandbox.html?sketch=${encodeURIComponent(name)}`;

  const browser = await launchBrowser();
  try {
    if (stills > 0) {
      const ctx = await browser.newContext({ viewport: size });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForFunction(() => window.__primordial && (window.__primordial.glOk || window.__primordial.error), { timeout: 10000 });
      const err = await page.evaluate(() => window.__primordial.error);
      if (err) throw new Error('sketch failed to boot: ' + err);
      const out = [];
      for (let i = 0; i < stills; i++) {
        await page.waitForTimeout((secs * 1000) / stills);
        const p = join(artifacts, `${name}-${String(i + 1).padStart(2, '0')}.png`);
        await page.screenshot({ path: p, timeout: 15000 });
        out.push(p);
      }
      await ctx.close();
      console.log('stills:\n  ' + out.join('\n  '));
    } else {
      const ctx = await browser.newContext({ viewport: size, recordVideo: { dir: artifacts, size } });
      const page = await ctx.newPage();
      await page.goto(url, { waitUntil: 'load', timeout: 20000 });
      await page.waitForFunction(() => window.__primordial && (window.__primordial.glOk || window.__primordial.error), { timeout: 10000 });
      const err = await page.evaluate(() => window.__primordial.error);
      if (err) throw new Error('sketch failed to boot: ' + err);
      await page.waitForTimeout(secs * 1000);
      // Re-check after the capture window: a render error mid-clip halts the
      // loop and is recorded into the webm, so surface it rather than reporting
      // a clean success.
      const midErr = await page.evaluate(() => window.__primordial.error);
      if (midErr) throw new Error('sketch errored mid-clip: ' + midErr);
      const video = page.video();
      await ctx.close(); // flushes the webm to disk
      const tmp = await video.path();
      const dest = join(artifacts, `${name}.webm`);
      renameSync(tmp, dest);
      console.log('clip: ' + dest);
    }
  } finally {
    await browser.close().catch(() => {});
  }
} finally {
  server.kill();
}
