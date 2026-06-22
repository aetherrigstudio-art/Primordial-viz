#!/usr/bin/env bash
# SubagentStop hook: a subagent just finished. Inject a NON-BLOCKING reminder to reconcile its
# report against the REAL artifact (diff / files / command output) before recording or acting on
# it — subagents confabulate (see .claude/rules/conduct.md §2 + .claude/rules/gotchas.md). Stdout
# is injected as context. Robust: never errors; always exits 0.
set -u
echo "[verify] A subagent just reported. Before recording or acting on it: reconcile its claims against the REAL artifact — read the actual diff / files / command output, don't trust the summary. Subagents confabulate (conduct.md §2 · gotchas.md). State findings in your own words; for high-stakes results, run an independent check."
exit 0
