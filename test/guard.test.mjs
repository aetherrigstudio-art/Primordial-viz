import assert from 'node:assert';
import { decide, isBranchCreate, isGateCommand, branchOrderDecision } from '../.claude/hooks/guard.mjs';

const d = (c) => { const r = decide(c); return r ? r[0] : 'allow'; };

// DENY — irreversible
for (const c of [
  'rm -rf /', 'sudo rm -rf /', 'rm -rf ~', 'rm -rf $HOME', 'rm -rf /*',
  'env FOO=bar rm -rf /', 'dd if=/dev/zero of=/dev/sda', 'mkfs.ext4 /dev/sdb',
  'shred -u secret', 'git push --force origin main', 'chmod -R 777 /', ':(){ :|:& };:',
]) assert.equal(d(c), 'deny', `should DENY: ${c}`);

// ASK — recoverable / sometimes-legit
for (const c of [
  'git reset --hard HEAD~2', 'git clean -fdx', 'git push --force origin claude/x',
  'rm -rf /tmp/build', 'chmod -R 755 somedir',
]) assert.equal(d(c), 'ask', `should ASK: ${c}`);

// ALLOW — our normal workflow + quoted text (must NOT be blocked)
for (const c of [
  'git push -u origin claude/onboarding-hxwhw6',
  'git commit -m "fix rm -rf / handling"',
  'npm run health', 'node test/smoke.mjs', 'rm -rf ./node_modules', 'rm -rf dist',
  'git add -A && git commit -m x', 'curl -sSL https://example.com',
  // data, not commands: a commit message / heredoc that mentions dangerous patterns
  'git commit -m "feat: guard blocks rm -rf / and force-push to main"',
  "git commit -q -m \"$(cat <<'EOF'\nfeat: deny rm -rf of / ~ $HOME /* and mkfs\nEOF\n)\"",
  // apostrophe inside a double-quoted string must not desync quote-stripping
  'echo "it didn\'t run rm -rf / thankfully" && npm test',
]) assert.equal(d(c), 'allow', `should ALLOW: ${c}`);

// ── Onboarding / branch-ordering gate ────────────────────────────────────────
// Branch CREATION is detected...
for (const c of [
  'git checkout -b claude/foo', 'git switch -c claude/foo', 'git checkout -B main',
  'git branch claude/foo', 'cd repo && git checkout -b x',
]) assert.equal(isBranchCreate(c), true, `should be branch-create: ${c}`);
// ...but switching/listing existing branches is NOT creation (must stay allowed).
for (const c of [
  'git checkout main', 'git switch claude/foo', 'git branch', 'git branch -a',
  'git branch -d old', 'git branch --show-current', 'git commit -m "git checkout -b x"',
]) assert.equal(isBranchCreate(c), false, `should NOT be branch-create: ${c}`);

// The gate-engaging command is the health verify step.
for (const c of ['npm run health', 'node tools/health.mjs', 'cd x && npm run health'])
  assert.equal(isGateCommand(c), true, `should engage gate: ${c}`);
for (const c of ['npm run smoke', 'node test/render-check.mjs'])
  assert.equal(isGateCommand(c), false, `should NOT engage gate: ${c}`);

// Branch creation is DENIED before the gate, ALLOWED after.
assert.equal(branchOrderDecision('git checkout -b claude/x', false)?.[0], 'deny',
  'branch-create before gate must DENY');
assert.equal(branchOrderDecision('git checkout -b claude/x', true), null,
  'branch-create after gate must ALLOW');
assert.equal(branchOrderDecision('git checkout main', false), null,
  'switching an existing branch is never gated');

console.log('guard: all assertions passed');
