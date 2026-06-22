#!/usr/bin/env bash
# SubagentStart hook: give every spawned subagent the page-build orientation the main
# session gets from orient.sh — so a dispatched implementer / explorer / planner starts
# with the canonical state + docs + env constraints instead of blank. Stdout is injected
# as context into the subagent. Robust: never errors out the subagent start.
set -u
root="$(cd "$(dirname "$0")/../.." 2>/dev/null && pwd)" || exit 0
cd "$root" 2>/dev/null || exit 0

echo "PRIMORDIAL — page-build context for this subagent (immersive point-cloud wedding landing page)."
echo "STATE/PLAN (newest handoff is at the TOP of progress.md): progress.md · docs/design-system/PLAN.md · docs/design-system/WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md (arc: dawn → drapery tent → flutter → land in the rainforest visualizer)."
echo "BUILD REFERENCE: docs/design-system/IMPLEMENTATION.md — Spark (SparkRenderer / SplatMesh / SplatLoader; multi-splat composite via useSplatLayer), R3F + Theatre.js (journey scrubbed by 'travel'), the asset pipeline. The app is immersive/ (standalone Vite + R3F + Spark; NOT the no-build src/ instrument)."
echo "ASSETS (generated off-device): docs/design-system/rainforest-asset-spec.md + colab/{drapery-trellis,forest-video-splat}.md. Drapery=TRELLIS; rainforest=Veo 3.1 → COLMAP → splatfacto-big. Compressed .spz live in immersive/public/assets/ (gitignored, host/CDN-delivered)."
echo "ENV (critical): heavy builds run OFF-DEVICE (GitHub Actions) — Termux can't dlopen native Rollup/onnxruntime. On-device verify = 'node --check' + 'node_modules/.bin/esbuild immersive/src/main.jsx --bundle --format=esm --jsx=automatic --outfile=/dev/null'. Render/visual QA = Antigravity's browser (no Chromium here). HTTPS-443 only; only COMMITTED files survive a wipe."
echo "RETRIEVE MORE: the repo's RAG via MCP tools — search_docs (lexical, works on-device) / semantic_search (vector, off-device only). Verify unfamiliar library APIs via context7 / mdn before coding."
exit 0
