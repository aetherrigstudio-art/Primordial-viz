// Shared request-triage / router logic. Used by both route-request.mjs (UserPromptSubmit, on
// YOUR prompt) and subagent-route.mjs (SubagentStart, on a spawned subagent's task). Heuristic +
// escalate: classify domain + intent, recommend persona/skills/tools/docs + a context-gap note +
// a thinking-effort hint; on an ambiguous/complex input, inject a self-triage directive. Returns
// the routing block string, or null when there's no useful signal (stay silent on trivial input).
//
// HONEST LIMIT: a hook can only INJECT CONTEXT — it cannot set the model's effort or bind tools.
// It recommends; the model acts. Personas = the immersive specialists (pending) + visual-qa/audio-dsp.

import { existsSync } from 'node:fs';

export function triage(text) {
  if (!text || text.trim().length < 3) return null;
  const low = text.toLowerCase();
  const has = (...ws) => ws.some((w) => low.includes(w));

  const domains = [];
  if (has('splat', 'spark', 'gaussian', 'r3f', 'three.js', 'webgl', 'render', 'frustum', 'shader', 'glsl', 'splatmesh', 'camera'))
    domains.push({ persona: 'splat-graphics', area: 'splat/render',
      use: 'skill r3f-shaders · rules immersive.md + shaders.md · docs IMPLEMENTATION.md · verify R3F/three/Spark APIs via context7' });
  if (has('theatre', 'gsap', 'journey', 'animat', 'choreograph', 'scrub', 'timeline', 'scrolltrigger'))
    domains.push({ persona: 'motion-choreography', area: 'motion/journey',
      use: 'docs IMPLEMENTATION.md (journey) + PLAN.md · verify Theatre.js/GSAP via context7' });
  if (has('palette', 'typograph', 'font', 'frontend', 'diegetic', 'aesthetic', 'layout', ' hud', 'design system', 'look ', ' ui'))
    domains.push({ persona: 'interface-design', area: 'ui/design',
      use: 'skills frontend-design + accessibility · docs WEDDING-PAGE-EXPERIENCE + PLAN.md (tokens)' });
  if (has('trellis', 'veo', 'splatfacto', 'colmap', 'drapery', 'rainforest', 'supersplat', '.spz', '.sog', 'capture', 'asset gen', 'generate the'))
    domains.push({ persona: 'splat-asset', area: 'asset pipeline',
      use: 'docs rainforest-asset-spec.md + colab/*.md · write-our-own/commercial-license posture' });
  if (has('audio', 'fft', 'bpm', 'beat', 'analyser', 'analyzer', 'frequency', ' mic', 'sound'))
    domains.push({ persona: 'audio-dsp (exists)', area: 'audio', use: 'rule .claude/rules/audio.md' });
  if (has('perf', 'fps', 'budget', 'thermal', 'frame', 'dpr', 'optimi', 'jank'))
    domains.push({ persona: 'perf-a11y-reviewer / visual-qa', area: 'performance', use: 'skills perf-budget + performance' });
  if (has('a11y', 'accessib', 'wcag', 'screen reader', 'keyboard', 'reduced motion', 'aria'))
    domains.push({ persona: 'perf-a11y-reviewer', area: 'accessibility', use: 'skill accessibility' });
  if (has('deploy', 'ci ', 'actions', 'ftps', 'gh run', 'gh workflow', 'primordial.video', 'publish'))
    domains.push({ persona: 'deploy', area: 'deploy/CI', use: 'rule .claude/rules/deploy.md · skill deploy-check · gh' });
  if (has('review', 'audit', 'critique', 'qa '))
    domains.push({ persona: 'design-reviewer / perf-a11y-reviewer', area: 'review', use: 'skill requesting-code-review or /code-review' });

  const complex = has('architect', 'orchestrat', 'refactor', 'design system', 'build out', 'the whole',
    'overhaul', 'migrate', 'redesign', 'pipeline', 'end to end', 'multi') || text.length > 320 || domains.length >= 2;
  const libAsk = has('how do i', ' api', 'version', 'install', 'config') ||
    has('react', 'three', 'vite', 'theatre', 'spark', 'gsap', 'nerfstudio', 'trellis', 'tauri');

  const paths = (text.match(/[\w.@/-]*\/[\w.@/-]+\.[a-z0-9]{1,6}/gi) || [])
    .filter((p) => !/^https?:/i.test(p)).slice(0, 5);
  const missing = paths.filter((p) => !existsSync(p));

  if (!domains.length && !complex && !missing.length && !libAsk) return null;

  const L = ['[route] Triage — craft the response deliberately:'];
  if (domains.length) {
    L.push('• Persona: ' + domains.map((d) => d.persona).join(' + ') + '  (' + domains.map((d) => d.area).join(', ') + ')');
    domains.forEach((d) => L.push('  → ' + d.use));
  }
  L.push('• Effort: ' + (complex
    ? 'HIGH/xhigh + extended thinking — multi-step/architectural; consider EnterPlanMode or the `workflow` skill'
    : (domains.length ? 'medium–high' : 'medium')));
  if (libAsk) L.push('• Unfamiliar lib/API/version → verify via context7 / mdn / find-docs before answering (don\'t assert from memory).');
  L.push('• Repo knowledge: search_docs (lexical) / semantic_search before assuming — the RAG holds IMPLEMENTATION.md + the specs.');
  if (missing.length) L.push('• Context gap — referenced path(s) not found locally: ' + missing.join(', ') + ' (confirm the path / fetch the file first).');
  if (complex && !domains.length) L.push('• AMBIGUOUS + non-trivial → self-triage FIRST: classify the real intent, confirm the deliverable/referent, gather missing context, then pick persona + skills + effort.');

  return L.join('\n');
}
