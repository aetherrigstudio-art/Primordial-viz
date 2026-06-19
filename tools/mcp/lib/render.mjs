// Reusable headless render check: load the app in headless Chromium (WebGL2 via
// SwiftShader), confirm it boots and renders, and capture a screenshot + health
// beacon. Shared by test/render-check.mjs (local CI gate) and the render_check
// MCP tool (local or live against primordial.video).
//
//   node tools/mcp/lib/render.mjs            # CLI: local check, exits 1 on fail
//   node tools/mcp/lib/render.mjs --live      # check the deployed site

import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import net from 'node:net';
import { launchBrowser } from './browser.mjs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..'); // tools/mcp/lib -> repo root
const LIVE_URL = 'https://primordial.video/';

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, () => { const { port } = s.address(); s.close(() => res(port)); });
    s.on('error', rej);
  });
}

// Run the render check. opts:
//   target: 'local' (serve the repo) | 'live' (primordial.video)
//   url: explicit URL (overrides target)
//   screenshotPath: if set, also write the image to disk
//   screenshot: 'png' (default, for the disk artifact) | 'jpeg' (small, for MCP) | 'none'
//   screenshotQuality: JPEG quality (1-100, default 60)
//   viewport: page size (default 900x600)
// Returns { pass, target, url, checks:[{name,ok,detail}], frames, beacon,
//           consoleErrors, a11y, screenshot:Buffer|null, screenshotMime }.
export async function runRenderCheck({
  target = 'local',
  url = null,
  screenshotPath = null,
  screenshot = 'png',
  screenshotQuality = 60,
  viewport = { width: 900, height: 600 },
} = {}) {
  let server = null;
  let pageUrl = url;
  if (!pageUrl) {
    if (target === 'live') {
      pageUrl = LIVE_URL;
    } else {
      const port = await freePort();
      server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
      await new Promise((r) => setTimeout(r, 800)); // let the server bind
      pageUrl = `http://localhost:${port}/index.html`;
    }
  }

  const checks = [];
  const add = (name, ok, detail = '') => checks.push({ name, ok, detail });
  const consoleErrors = [];
  let shot = null;
  const shotMime = screenshot === 'jpeg' ? 'image/jpeg' : 'image/png';
  let beacon = {};
  let frames = { before: 0, after: 0 };
  let a11y = { unlabeled: [], readoutLive: false };

  const browser = await launchBrowser();
  try {
    const page = await browser.newPage({ viewport });
    page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
    page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

    await page.goto(pageUrl, { waitUntil: 'load', timeout: 20000 });

    const webgl2 = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
    add('WebGL2 available', webgl2);

    await page.waitForFunction(() => window.__primordial && window.__primordial.glOk, { timeout: 10000 }).catch(() => {});
    const h1 = await page.evaluate(() => ({ ...(window.__primordial || {}) }));
    await new Promise((r) => setTimeout(r, 1200));
    const h2 = await page.evaluate(() => ({ ...(window.__primordial || {}) }));
    beacon = h2;
    frames = { before: h1.frames || 0, after: h2.frames || 0 };
    add('renderer initialised (glOk)', h1.glOk === true, h1.glOk ? '' : 'glOk not true');
    add('no boot error', !h1.error, h1.error || '');
    add('render loop advancing', h2.frames > h1.frames && h2.frames > 1, `frames ${h1.frames} -> ${h2.frames}`);
    add('no console errors', consoleErrors.length === 0, consoleErrors.join(' | '));

    a11y = await page.evaluate(() => {
      const out = { unlabeled: [], readoutLive: false };
      for (const el of document.querySelectorAll('select, input, button')) {
        const hasAria = el.getAttribute('aria-label');
        const hasLabelFor = el.id && document.querySelector(`label[for="${el.id}"]`);
        const wrapped = el.closest('label');
        const text = el.tagName === 'BUTTON' && el.textContent.trim();
        if (!hasAria && !hasLabelFor && !wrapped && !text) out.unlabeled.push(el.outerHTML.slice(0, 80));
      }
      const r = document.getElementById('readout');
      out.readoutLive = !!(r && (r.getAttribute('aria-live') || r.getAttribute('role') === 'status'));
      return out;
    });
    add('all controls labelled', a11y.unlabeled.length === 0, a11y.unlabeled.join(' | '));
    add('#readout is an aria-live region', a11y.readoutLive);

    // Freeze the loop so the screenshot isn't starved by the rAF raymarch on
    // software-GL runners; the screenshot is a bonus artifact, never a gate.
    await page.evaluate(() => { if (window.__primordial) window.__primordial.pause = true; });
    await page.waitForTimeout(150);
    if (screenshot !== 'none') {
      const opts = screenshot === 'jpeg'
        ? { type: 'jpeg', quality: screenshotQuality }
        : { type: 'png' };
      shot = await page.screenshot({ ...opts, timeout: 15000, animations: 'disabled' }).catch(() => null);
      if (shot && screenshotPath) {
        mkdirSync(dirname(screenshotPath), { recursive: true });
        writeFileSync(screenshotPath, shot);
      }
    }
  } finally {
    await browser.close().catch(() => {});
    if (server) server.kill();
  }

  return { pass: checks.every((c) => c.ok), target: url ? 'url' : target, url: pageUrl, checks, frames, beacon, consoleErrors, a11y, screenshot: shot, screenshotMime: shotMime };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv.includes('--live') ? 'live' : 'local';
  try {
    const res = await runRenderCheck({ target, screenshotPath: join(root, 'test', 'artifacts', 'render.png') });
    for (const c of res.checks) console.log(`  ${c.ok ? 'ok  ' : 'FAIL'} ${c.name}${c.detail ? ` (${c.detail})` : ''}`);
    if (res.screenshot) console.log('  ->   screenshot: test/artifacts/render.png');
    console.log(res.pass ? '\nall render checks passed' : '\nrender check FAILED');
    process.exit(res.pass ? 0 : 1);
  } catch (err) {
    const msg = err && err.message ? err.message : String(err);
    console.error(msg);
    process.exit(msg.includes('Playwright not installed') ? 2 : 1);
  }
}
