import assert from 'node:assert';
import { decide } from '../.claude/hooks/guard.mjs';

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

console.log('guard: all assertions passed');
