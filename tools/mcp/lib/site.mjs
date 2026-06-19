// Live-site health for primordial.video (read-only — no credentials). Checks that
// the site is up over HTTPS and reports the TLS certificate's days-to-expiry: the
// free Sectigo SSL is 1-year and NON-renewing, and an HTTPS lapse silently kills
// the mic (getUserMedia needs a secure context). Optionally runs the live render
// check. Deploy stays manual (the deploy-cpanel skill) — no secrets in the repo.
//
//   node tools/mcp/lib/site.mjs            # status + SSL days remaining
//   node tools/mcp/lib/site.mjs --render    # also boot the live page in WebGL2

import tls from 'node:tls';
import { fileURLToPath } from 'node:url';
import { runRenderCheck } from './render.mjs';

const SITE = 'https://primordial.video/';
const HOST = 'primordial.video';
const SSL_WARN_DAYS = 30;

function certNotAfter(host, port = 443, timeoutMs = 8000) {
  return new Promise((resolve) => {
    const socket = tls.connect({ host, port, servername: host, timeout: timeoutMs }, () => {
      const cert = socket.getPeerCertificate();
      socket.end();
      resolve(cert && cert.valid_to ? new Date(cert.valid_to) : null);
    });
    socket.on('error', () => resolve(null));
    socket.on('timeout', () => { socket.destroy(); resolve(null); });
  });
}

// Returns { url, reachable, status, https, ssl:{validTo,daysToExpiry,warn}, render?, errors[] }.
export async function siteHealth({ render = false } = {}) {
  const errors = [];
  let status = null;
  let reachable = false;
  try {
    const r = await fetch(SITE, { method: 'GET', redirect: 'manual' });
    status = r.status;
    reachable = true;
  } catch (e) {
    errors.push('fetch: ' + (e && e.message ? e.message : String(e)));
  }

  const notAfter = await certNotAfter(HOST);
  const daysToExpiry = notAfter ? Math.round((notAfter.getTime() - Date.now()) / 86400000) : null;
  if (notAfter == null) errors.push('TLS: could not read certificate (host unreachable?)');
  else if (daysToExpiry < SSL_WARN_DAYS) errors.push(`SSL expires in ${daysToExpiry} days — re-issue the (non-renewing) Sectigo cert`);

  let renderResult = null;
  if (render && reachable) {
    const rr = await runRenderCheck({ target: 'live', screenshot: 'none' });
    renderResult = { pass: rr.pass, checks: rr.checks, consoleErrors: rr.consoleErrors };
    if (!rr.pass) errors.push('live render check failed');
  }

  return {
    url: SITE,
    reachable,
    status,
    https: SITE.startsWith('https://'),
    ssl: { validTo: notAfter ? notAfter.toISOString() : null, daysToExpiry, warn: daysToExpiry != null && daysToExpiry < SSL_WARN_DAYS },
    ok: reachable && status >= 200 && status < 400 && (daysToExpiry == null || daysToExpiry >= SSL_WARN_DAYS),
    render: renderResult,
    errors,
  };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const res = await siteHealth({ render: process.argv.includes('--render') });
  console.log(`${res.url}`);
  console.log(`  reachable: ${res.reachable}  status: ${res.status ?? 'n/a'}`);
  console.log(`  SSL valid to: ${res.ssl.validTo ?? 'n/a'}  (${res.ssl.daysToExpiry ?? '?'} days)`);
  if (res.errors.length) console.log('  notes:\n    - ' + res.errors.join('\n    - '));
  console.log(res.ok ? '\nsite OK' : '\nsite needs attention');
  process.exit(res.ok ? 0 : 1);
}
