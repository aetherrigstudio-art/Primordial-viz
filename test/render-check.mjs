// test/render-check.mjs — headless-Chromium render check (laptop-free).
//
//   node test/render-check.mjs
//
// Serves the repo, loads index.html in headless Chromium (SwiftShader GL), and
// asserts the instrument actually boots and renders:
//   - WebGL2 is available
//   - no console errors / pageerrors (a shader compile/link failure surfaces here)
//   - window.__primordial.glOk === true and frames advance over time
//   - accessibility DOM: every control is labelled and #readout is a live region
// Saves a screenshot to test/artifacts/render.png for human/agent review.
//
// Requires Playwright Chromium. CI installs it; locally:
//   PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx -y playwright install chromium
// Exit 0 = all green.

import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import net from 'node:net';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const artifacts = join(here, 'artifacts');

function freePort() {
  return new Promise((res, rej) => {
    const s = net.createServer();
    s.listen(0, () => {
      const { port } = s.address();
      s.close(() => res(port));
    });
    s.on('error', rej);
  });
}

const fails = [];
const check = (cond, msg) => (cond ? console.log('  ok   ' + msg) : (fails.push(msg), console.error('FAIL   ' + msg)));

let server, browser;
try {
  // Playwright is optional locally; give a clear message if it's missing.
  let chromium;
  try {
    ({ chromium } = await import('playwright'));
  } catch {
    console.error('Playwright not installed. Run:\n  PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx -y playwright install chromium\nand `npm i -D playwright` (or use npx). Skipping render check.');
    process.exit(2);
  }

  const port = await freePort();
  server = spawn('python3', ['-m', 'http.server', String(port)], { cwd: root, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 800)); // let the server bind

  browser = await chromium.launch({
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
  const page = await browser.newPage({ viewport: { width: 900, height: 600 } });

  const consoleErrors = [];
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('pageerror', (e) => consoleErrors.push('pageerror: ' + e.message));

  await page.goto(`http://localhost:${port}/index.html`, { waitUntil: 'load', timeout: 20000 });

  // WebGL2 availability (fresh context — the page already owns the canvas one).
  const webgl2 = await page.evaluate(() => !!document.createElement('canvas').getContext('webgl2'));
  check(webgl2, 'WebGL2 is available in the browser');

  // Let the render loop spin, then read the health beacon twice to confirm frames advance.
  await page.waitForFunction(() => window.__primordial && window.__primordial.glOk, { timeout: 10000 }).catch(() => {});
  const h1 = await page.evaluate(() => ({ ...(window.__primordial || {}) }));
  await new Promise((r) => setTimeout(r, 1200));
  const h2 = await page.evaluate(() => ({ ...(window.__primordial || {}) }));

  check(h1.glOk === true, 'renderer initialised (window.__primordial.glOk)');
  check(!h1.error, 'no boot error' + (h1.error ? ` (${h1.error})` : ''));
  check(h2.frames > h1.frames && h2.frames > 1, `render loop advancing (frames ${h1.frames} -> ${h2.frames})`);
  check(consoleErrors.length === 0, 'no console errors / pageerrors' + (consoleErrors.length ? `:\n       - ${consoleErrors.join('\n       - ')}` : ''));

  // Accessibility DOM assertions (assertable headless, no human needed).
  const a11y = await page.evaluate(() => {
    const out = { unlabeled: [], readoutLive: false };
    const controls = [...document.querySelectorAll('select, input, button')];
    for (const el of controls) {
      const hasAria = el.getAttribute('aria-label');
      const id = el.id;
      const hasLabelFor = id && document.querySelector(`label[for="${id}"]`);
      const wrapped = el.closest('label');
      const text = el.tagName === 'BUTTON' && el.textContent.trim();
      if (!hasAria && !hasLabelFor && !wrapped && !text) out.unlabeled.push(el.outerHTML.slice(0, 80));
    }
    const r = document.getElementById('readout');
    out.readoutLive = !!(r && (r.getAttribute('aria-live') || r.getAttribute('role') === 'status'));
    return out;
  });
  check(a11y.unlabeled.length === 0, 'all interactive controls are labelled' + (a11y.unlabeled.length ? `:\n       - ${a11y.unlabeled.join('\n       - ')}` : ''));
  check(a11y.readoutLive, '#readout is an aria-live region');

  mkdirSync(artifacts, { recursive: true });
  await page.screenshot({ path: join(artifacts, 'render.png') });
  console.log('  ->   screenshot: test/artifacts/render.png');
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) server.kill();
}

console.log(`\n${fails.length ? fails.length + ' checks FAILED' : 'all render checks passed'}`);
process.exit(fails.length ? 1 : 0);
