// Tests the shell hooks' payload parse/emit, on BOTH the jq path and a node
// fallback path (jq absent). The robustness refinement: the hooks must still
// fire when jq is missing (node is always present), and must emit valid JSON.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, symlinkSync, existsSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hook = (name) => join(root, '.claude', 'hooks', name);

// A PATH dir with the tools the hooks need but WITHOUT jq, to exercise the node
// fallback. Returns the dir, or null if the base tools can't be located.
function noJqPath() {
  const need = ['bash', 'env', 'node', 'cat', 'tr', 'sed', 'grep', 'mktemp', 'rm', 'dirname', 'pwd', 'head'];
  const dirs = ['/usr/bin', '/bin', '/usr/local/bin'];
  const sb = mkdtempSync(join(tmpdir(), 'nojq-'));
  for (const t of need) {
    const src = dirs.map((d) => join(d, t)).find((p) => existsSync(p));
    if (src) try { symlinkSync(src, join(sb, t)); } catch { /* ignore dup */ }
  }
  return existsSync(join(sb, 'node')) && existsSync(join(sb, 'cat')) ? sb : null;
}

function run(script, { input = '', env = {} } = {}) {
  const r = spawnSync('bash', [hook(script)], {
    input,
    encoding: 'utf8',
    env: { ...process.env, ...env },
  });
  return { status: r.status, stdout: (r.stdout || '').trim(), stderr: (r.stderr || '').trim() };
}

const sb = noJqPath();
// Each scenario runs with the normal env (jq if installed) and, when we could
// build a sandbox, with a PATH that has node but not jq.
const envs = [{ label: 'normal', env: {} }];
if (sb) envs.push({ label: 'no-jq', env: { PATH: sb } });

for (const { label, env } of envs) {
  test(`inject-rules emits the shaders rule (${label})`, () => {
    const { stdout } = run('inject-rules.sh', {
      input: JSON.stringify({ tool_input: { file_path: 'src/shaders/slime.frag.js' } }),
      env,
    });
    const out = JSON.parse(stdout); // must be valid JSON
    assert.equal(out.hookSpecificOutput.hookEventName, 'PreToolUse');
    assert.match(out.hookSpecificOutput.additionalContext, /shaders\.md/);
  });

  test(`suggest-workflow nudges on a feature prompt (${label})`, () => {
    const { stdout } = run('suggest-workflow.sh', {
      input: JSON.stringify({ prompt: 'please build a new feature here' }),
      env,
    });
    const out = JSON.parse(stdout);
    assert.match(out.hookSpecificOutput.additionalContext, /'feature' task/);
  });

  test(`detect-correction nudges on a correction (${label})`, () => {
    const { stdout } = run('detect-correction.sh', {
      input: JSON.stringify({ prompt: "no that's wrong" }),
      env,
    });
    const out = JSON.parse(stdout);
    assert.match(out.hookSpecificOutput.additionalContext, /lesson/);
  });

  test(`check-syntax blocks a broken .js with exit 2 (${label})`, () => {
    const dir = mkdtempSync(join(tmpdir(), 'cs-'));
    const bad = join(dir, 'bad.js');
    writeFileSync(bad, 'function ( {\n');
    const { status } = run('check-syntax.sh', {
      input: JSON.stringify({ tool_input: { file_path: bad } }),
      env,
    });
    assert.equal(status, 2);
    rmSync(dir, { recursive: true, force: true });
  });
}

test('suggest-workflow / detect-correction stay silent on unrelated prompts', () => {
  assert.equal(run('suggest-workflow.sh', { input: JSON.stringify({ prompt: 'take a look at this' }) }).stdout, '');
  assert.equal(run('detect-correction.sh', { input: JSON.stringify({ prompt: 'thanks, looks good' }) }).stdout, '');
});

test('check-syntax is a no-op for non-js and passes valid js (exit 0)', () => {
  assert.equal(run('check-syntax.sh', { input: JSON.stringify({ tool_input: { file_path: 'README.md' } }) }).status, 0);
  assert.equal(run('check-syntax.sh', { input: JSON.stringify({ tool_input: { file_path: join(root, 'src/main.js') } }) }).status, 0);
});
