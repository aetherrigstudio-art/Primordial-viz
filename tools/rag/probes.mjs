// tools/rag/probes.mjs
// Canonical retrieval probe set: query → substring the #1 result's path must
// contain. Single source of truth for the regression test (test/rag.test.mjs) and
// the model A/B harness (ab-model.mjs). Dev-tooling only.
export const PROBES = [
  { q: 'how is the app deployed', expect: 'deploy/DEPLOY.md' },
  { q: 'how do looks and presets work', expect: 'new-preset' },
  { q: 'shader licensing write our own', expect: 'shaders.md' },
  { q: 'audio bands texture analysis', expect: 'audio.md' },
  { q: 'mobile performance budget step cap', expect: 'perf-budget' },
  { q: 'what survives a cloud session', expect: '.claude/ROADMAP.md' },
];
