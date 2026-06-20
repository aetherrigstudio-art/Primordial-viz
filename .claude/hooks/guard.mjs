#!/usr/bin/env node
// PreToolUse hook (matcher: Bash) — destructive-command guard.
// DENY irreversible commands; ASK on recoverable-risky ones; else no-op (exit 0).
// Emits hookSpecificOutput.permissionDecision JSON. Deny/ask patterns are anchored to
// command boundaries (start / ; / && / || / | / ( / newline) so quoted text — e.g. a
// commit message containing "rm -rf /" — is NOT matched. Native JSON parse of the
// PreToolUse stdin payload (no jq). Never throws → never blocks the session by error.
// Limitation: unwraps leading sudo/nohup/time/env wrappers, NOT ssh/docker-exec inner cmds.
import { readFileSync } from 'node:fs';

const B = '(?:^|[;&|(]|&&|\\|\\||\\n)\\s*'; // command-boundary prefix

// Remove heredoc bodies + quoted spans: their contents are DATA (e.g. a commit
// message that mentions "rm -rf /"), not executed commands, so they must not trip
// the guard. Uses a shell-quote-state scanner (not regex) so an apostrophe inside a
// double-quoted string can't desync quote pairing. (Accepted gap: a payload hidden
// in `bash -c "..."` is also stripped — rare in our workflow.)
function stripData(cmd) {
  cmd = cmd.replace(/<<-?\s*['"]?(\w+)['"]?[\s\S]*?\n\1\b/g, ' '); // heredoc bodies
  let out = '', q = null;
  for (const ch of cmd) {
    if (q) { if (ch === q) q = null; continue; }       // inside quotes → drop content
    if (ch === "'" || ch === '"') { q = ch; out += ' '; continue; }
    out += ch;
  }
  return out;
}

// Returns ['deny'|'ask', reason] or null (=allow / no-op).
export function decide(cmd) {
  let s = stripData(cmd);
  // strip leading wrappers (bounded depth) so "sudo rm -rf /" is evaluated as "rm -rf /"
  for (let i = 0; i < 5; i++) {
    const n = s.replace(/^\s*(?:sudo|nohup|time|command|builtin|env)\s+/, '')
               .replace(/^\s*[A-Za-z_][A-Za-z0-9_]*=[^\s]*\s+/, '');
    if (n === s) break;
    s = n;
  }
  const has = (re) => new RegExp(re, 'i').test(s);
  const rmRecursive = has(`${B}rm\\s+(?:-[A-Za-z]*r[A-Za-z]*\\b|--recursive\\b)`);

  // ---- DENY (irreversible) ----
  if (rmRecursive && (/\s(\/|~|\$HOME)(\s|$)/.test(s) || /\s\/\*/.test(s) || /--no-preserve-root/.test(s)))
    return ['deny', 'rm -r targeting / ~ $HOME or /* is irreversible — refused. Use a project-relative path.'];
  if (has(`${B}dd\\b[^\\n]*\\bof=/dev/`)) return ['deny', 'dd writing to a /dev/ device is refused.'];
  if (has(`${B}mkfs(?:\\.|\\b)`)) return ['deny', 'mkfs (format filesystem) is refused.'];
  if (has(`${B}shred\\b`)) return ['deny', 'shred is refused.'];
  if (has(`${B}:\\(\\)\\s*\\{`)) return ['deny', 'fork-bomb pattern refused.'];
  if (has(`${B}chmod\\s+-[A-Za-z]*R[A-Za-z]*\\s+777\\s+/`)) return ['deny', 'chmod -R 777 / is refused.'];
  if (/>\s*\/dev\/sd[a-z]/.test(s)) return ['deny', 'redirect to a raw disk device is refused.'];
  const forcePush = has(`${B}git\\s+push\\b[^\\n]*(?:--force\\b|--force-with-lease\\b|\\s-f\\b)`);
  if (forcePush && /\b(?:main|master)\b/.test(s))
    return ['deny', 'Force-push to main/master is refused. Push to a feature branch.'];

  // ---- ASK (recoverable / sometimes-legit) ----
  if (forcePush) return ['ask', 'Force-push detected (non-main). Confirm this is intended.'];
  if (has(`${B}git\\s+reset\\s+--hard\\b`)) return ['ask', 'git reset --hard discards uncommitted work. Confirm.'];
  if (has(`${B}git\\s+clean\\s+-[A-Za-z]*f`)) return ['ask', 'git clean -f deletes untracked files (incl. the SDD ledger). Confirm.'];
  if (rmRecursive && /\s\/[^\s*]/.test(s)) return ['ask', 'Recursive rm of an absolute path. Confirm the target.'];
  if (has(`${B}chmod\\s+-[A-Za-z]*R`)) return ['ask', 'Recursive chmod. Confirm.'];

  return null;
}

// hook entrypoint
if (import.meta.url === `file://${process.argv[1]}`) {
  let payload;
  try { payload = JSON.parse(readFileSync(0, 'utf8')); } catch { process.exit(0); }
  if (!payload || payload.tool_name !== 'Bash') process.exit(0);
  const cmd = payload.tool_input && payload.tool_input.command;
  if (typeof cmd !== 'string' || !cmd.trim()) process.exit(0);
  const d = decide(cmd);
  if (!d) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: d[0], permissionDecisionReason: d[1] },
  }) + '\n');
  process.exit(0);
}
