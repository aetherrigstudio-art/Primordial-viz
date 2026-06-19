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
// The mechanics live in tools/mcp/lib/render.mjs (shared with the render_check
// MCP tool); this file is the CI gate that runs it against the local app.
//
// Requires Playwright Chromium. CI installs it; locally:
//   PLAYWRIGHT_BROWSERS_PATH=$HOME/.cache/ms-playwright npx -y playwright install chromium
// Exit 0 = all green, 1 = a check failed, 2 = Playwright missing.

import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { runRenderCheck } from '../tools/mcp/lib/render.mjs';

const here = dirname(fileURLToPath(import.meta.url));

try {
  const res = await runRenderCheck({ target: 'local', screenshotPath: join(here, 'artifacts', 'render.png') });
  for (const c of res.checks) {
    if (c.ok) console.log('  ok   ' + c.name);
    else console.error('FAIL   ' + c.name + (c.detail ? ` (${c.detail})` : ''));
  }
  if (res.screenshot) console.log('  ->   screenshot: test/artifacts/render.png');
  const failed = res.checks.filter((c) => !c.ok).length;
  console.log(`\n${failed ? failed + ' checks FAILED' : 'all render checks passed'}`);
  process.exit(failed ? 1 : 0);
} catch (err) {
  const msg = err && err.message ? err.message : String(err);
  if (msg.includes('Playwright not installed')) {
    console.error(msg + '\nSkipping render check.');
    process.exit(2);
  }
  console.error(msg);
  process.exit(1);
}
