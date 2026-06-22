#!/usr/bin/env node
// SubagentStart hook — apply the SAME request triage to a spawned subagent's TASK, so it starts
// routed to the right persona/skills/tools/docs (complements subagent-context.sh's static page
// context). Tries the likely task fields in the hook payload. Robust: never throws, exits 0.
import { readFileSync } from 'node:fs';
import { triage } from './lib/triage.mjs';

let task = '';
try {
  const j = JSON.parse(readFileSync(0, 'utf8'));
  task = j.prompt || j.task || j.description
    || (j.tool_input && (j.tool_input.prompt || j.tool_input.description))
    || j.agent_prompt || '';
} catch { process.exit(0); }
const ctx = triage(task);
if (ctx) process.stdout.write(JSON.stringify({ hookSpecificOutput: { hookEventName: 'SubagentStart', additionalContext: '[route] for this subagent task —\n' + ctx } }));
process.exit(0);
