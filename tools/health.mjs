#!/usr/bin/env node
// Consolidated repo health check - runs the local gates in one pass and prints a
// PASS/FAIL dashboard. The self-improvement loop's "sense" stage in one command
// (npm run health). Exit 1 if any gate fails. Render-check (needs Chromium) is
// excluded for speed - CI (verify.yml) runs that on every push. Use the `health`
// skill to also check the LIVE deploy and route a failure to its fix.

import { execFileSync } from 'node:child_process';

const run = (cmd, args) => execFileSync(cmd, args, { stdio: 'pipe' });

const checks = [
  ['JS syntax', () => {
    const files = execFileSync('git', ['ls-files', 'src', 'test', 'tools'], { encoding: 'utf8' })
      .split('\n').filter((f) => /\.(js|mjs|cjs)$/.test(f));
    for (const f of files) run('node', ['--check', f]);
  }],
  ['Smoke (params / looks / store)', () => run('node', ['test/smoke.mjs'])],
  ['Site audit (no AI tells / fingerprints)', () => run('node', ['tools/audit-site.mjs'])],
  ['Docs + drift gate', () => run('node', ['tools/gen-docs.mjs', '--check'])],
  // Soft (warn-only): the RAG embedder (onnxruntime) has no Android arm64 binary, so the index is
  // rebuilt off-device by the `rag-index` GitHub Actions workflow. Stale here is a heads-up, not a fail.
  ['RAG index drift gate', () => run('node', ['tools/rag/build-index.mjs', '--check']), { soft: true }],
  ['Config gate (CLAUDE.md cap / router / settings)', () => run('node', ['tools/check-config.mjs'])],
  ['Eval-skills (Tier-1 static gate)', () => run('node', ['tools/eval-skills.mjs'])],
];

let failed = 0;
for (const [name, fn, opts] of checks) {
  try {
    fn();
    console.log(`  PASS  ${name}`);
  } catch (e) {
    if (opts && opts.soft) {
      console.log(`  WARN  ${name} (rebuilt off-device by the rag-index CI workflow)`);
      continue;
    }
    failed++;
    console.log(`  FAIL  ${name}`);
    const out = ((e.stdout && e.stdout.toString()) || '') + ((e.stderr && e.stderr.toString()) || '');
    const tail = out.trim().split('\n').slice(-2).join(' | ');
    if (tail) console.log(`        ${tail}`);
  }
}
console.log(failed ? `\nHealth: ${failed} gate(s) FAILED - fix before claiming done.` : '\nHealth: all local gates pass.');
process.exit(failed ? 1 : 0);
