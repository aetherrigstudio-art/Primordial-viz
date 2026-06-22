#!/usr/bin/env node
// UserPromptSubmit hook — request triage / router (thin wrapper around lib/triage.mjs).
// Reads YOUR prompt and injects a routing block: persona/specialist + skills/tools/docs to reach
// for, a context-gap note, and a thinking-effort hint; escalates to a self-triage directive on
// ambiguous/complex prompts. Silent on trivial input. Robust: never throws, always exits 0, no jq.
import { readFileSync } from 'node:fs';
import { triage } from './lib/triage.mjs';

let prompt = '';
try { prompt = JSON.parse(readFileSync(0, 'utf8')).prompt || ''; } catch { process.exit(0); }
const ctx = triage(prompt);
if (ctx) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } }));
process.exit(0);
