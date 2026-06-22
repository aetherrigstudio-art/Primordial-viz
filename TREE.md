# File Tree — Primordial-viz

> **Auto-generated — do not edit by hand.** The directory layout of every
> tracked file. Regenerate with `node tools/gen-docs.mjs`; it also refreshes
> via the PostToolUse hook and is gated in CI. For per-file descriptions see
> [`ENCYCLOPEDIA.md`](ENCYCLOPEDIA.md).
>
> 428 files in 134 directories.

```
Primordial-viz/
├── .agents/
│   └── skills/
│       ├── astro-framework/
│       │   ├── references/
│       │   │   ├── actions.md
│       │   │   ├── client-directives.md
│       │   │   ├── components.md
│       │   │   ├── configuration.md
│       │   │   ├── content-collections.md
│       │   │   ├── environment-variables.md
│       │   │   ├── i18n-routing.md
│       │   │   ├── images.md
│       │   │   ├── middleware.md
│       │   │   ├── routing.md
│       │   │   ├── server-islands.md
│       │   │   ├── sessions.md
│       │   │   ├── ssr-adapters.md
│       │   │   ├── styling.md
│       │   │   └── view-transitions.md
│       │   ├── rules/
│       │   │   ├── astro-components.rule.md
│       │   │   ├── astro-images.rule.md
│       │   │   ├── astro-routing.rule.md
│       │   │   ├── astro-ssr.rule.md
│       │   │   ├── astro-typescript.rule.md
│       │   │   ├── client-hydration.rule.md
│       │   │   ├── content-collections.rule.md
│       │   │   ├── server-islands.rule.md
│       │   │   └── sessions.rule.md
│       │   ├── AGENTS.md
│       │   └── SKILL.md
│       ├── codebase-design/
│       │   ├── DEEPENING.md
│       │   ├── DESIGN-IT-TWICE.md
│       │   └── SKILL.md
│       ├── domain-modeling/
│       │   ├── ADR-FORMAT.md
│       │   ├── CONTEXT-FORMAT.md
│       │   └── SKILL.md
│       ├── grill-with-docs/
│       │   └── SKILL.md
│       ├── improve-codebase-architecture/
│       │   ├── HTML-REPORT.md
│       │   └── SKILL.md
│       ├── legacy-modernizer/
│       │   ├── references/
│       │   │   ├── legacy-testing.md
│       │   │   ├── migration-strategies.md
│       │   │   ├── refactoring-patterns.md
│       │   │   ├── strangler-fig-pattern.md
│       │   │   └── system-assessment.md
│       │   └── SKILL.md
│       ├── planning-with-files/
│       │   └── SKILL.md
│       ├── r3f-shaders/
│       │   └── SKILL.md
│       └── setup-matt-pocock-skills/
│           ├── domain.md
│           ├── issue-tracker-github.md
│           ├── issue-tracker-gitlab.md
│           ├── issue-tracker-local.md
│           ├── SKILL.md
│           └── triage-labels.md
├── .claude/
│   ├── agents/
│   │   ├── audio-dsp.md
│   │   ├── design-reviewer.md
│   │   ├── interface-design.md
│   │   ├── motion-choreography.md
│   │   ├── perf-a11y-reviewer.md
│   │   ├── splat-asset.md
│   │   ├── splat-graphics.md
│   │   └── visual-qa.md
│   ├── hooks/
│   │   ├── lib/
│   │   │   └── triage.mjs
│   │   ├── check-data.sh
│   │   ├── check-syntax.sh
│   │   ├── detect-correction.sh
│   │   ├── gen-docs.sh
│   │   ├── guard.mjs
│   │   ├── inject-rules.sh
│   │   ├── mcp-http.sh
│   │   ├── orient.sh
│   │   ├── precompact-handoff.sh
│   │   ├── route-request.mjs
│   │   ├── session-start.sh
│   │   ├── subagent-context.sh
│   │   ├── subagent-route.mjs
│   │   └── suggest-workflow.sh
│   ├── rules/
│   │   ├── audio.md
│   │   ├── conduct.md
│   │   ├── deploy.md
│   │   ├── gotchas.md
│   │   ├── immersive.md
│   │   ├── mobile-ergonomics.md
│   │   └── shaders.md
│   ├── skills/
│   │   ├── accessibility/
│   │   │   ├── references/
│   │   │   │   ├── A11Y-PATTERNS.md
│   │   │   │   └── WCAG.md
│   │   │   └── SKILL.md
│   │   ├── astro-framework/
│   │   │   ├── references/
│   │   │   │   ├── actions.md
│   │   │   │   ├── client-directives.md
│   │   │   │   ├── components.md
│   │   │   │   ├── configuration.md
│   │   │   │   ├── content-collections.md
│   │   │   │   ├── environment-variables.md
│   │   │   │   ├── i18n-routing.md
│   │   │   │   ├── images.md
│   │   │   │   ├── middleware.md
│   │   │   │   ├── routing.md
│   │   │   │   ├── server-islands.md
│   │   │   │   ├── sessions.md
│   │   │   │   ├── ssr-adapters.md
│   │   │   │   ├── styling.md
│   │   │   │   └── view-transitions.md
│   │   │   ├── rules/
│   │   │   │   ├── astro-components.rule.md
│   │   │   │   ├── astro-images.rule.md
│   │   │   │   ├── astro-routing.rule.md
│   │   │   │   ├── astro-ssr.rule.md
│   │   │   │   ├── astro-typescript.rule.md
│   │   │   │   ├── client-hydration.rule.md
│   │   │   │   ├── content-collections.rule.md
│   │   │   │   ├── server-islands.rule.md
│   │   │   │   └── sessions.rule.md
│   │   │   ├── AGENTS.md
│   │   │   └── SKILL.md
│   │   ├── brainstorming/
│   │   │   ├── scripts/
│   │   │   │   ├── frame-template.html
│   │   │   │   ├── helper.js
│   │   │   │   ├── server.cjs
│   │   │   │   ├── start-server.sh
│   │   │   │   └── stop-server.sh
│   │   │   ├── SKILL.md
│   │   │   ├── spec-document-reviewer-prompt.md
│   │   │   └── visual-companion.md
│   │   ├── codebase-design/
│   │   │   ├── DEEPENING.md
│   │   │   ├── DESIGN-IT-TWICE.md
│   │   │   └── SKILL.md
│   │   ├── debugging-and-error-recovery/
│   │   │   └── SKILL.md
│   │   ├── deploy-check/
│   │   │   └── SKILL.md
│   │   ├── deploy-cpanel/
│   │   │   └── SKILL.md
│   │   ├── dispatching-parallel-agents/
│   │   │   └── SKILL.md
│   │   ├── documentation-and-adrs/
│   │   │   └── SKILL.md
│   │   ├── domain-modeling/
│   │   │   ├── ADR-FORMAT.md
│   │   │   ├── CONTEXT-FORMAT.md
│   │   │   └── SKILL.md
│   │   ├── executing-plans/
│   │   │   └── SKILL.md
│   │   ├── find-docs/
│   │   │   └── SKILL.md
│   │   ├── finishing-a-development-branch/
│   │   │   └── SKILL.md
│   │   ├── frontend-design/
│   │   │   ├── LICENSE.txt
│   │   │   └── SKILL.md
│   │   ├── grill-with-docs/
│   │   │   └── SKILL.md
│   │   ├── health/
│   │   │   └── SKILL.md
│   │   ├── improve-codebase-architecture/
│   │   │   ├── HTML-REPORT.md
│   │   │   └── SKILL.md
│   │   ├── legacy-modernizer/
│   │   │   ├── references/
│   │   │   │   ├── legacy-testing.md
│   │   │   │   ├── migration-strategies.md
│   │   │   │   ├── refactoring-patterns.md
│   │   │   │   ├── strangler-fig-pattern.md
│   │   │   │   └── system-assessment.md
│   │   │   └── SKILL.md
│   │   ├── lesson/
│   │   │   └── SKILL.md
│   │   ├── new-preset/
│   │   │   └── SKILL.md
│   │   ├── park/
│   │   │   └── SKILL.md
│   │   ├── perf-budget/
│   │   │   └── SKILL.md
│   │   ├── performance/
│   │   │   └── SKILL.md
│   │   ├── planning-with-files/
│   │   │   └── SKILL.md
│   │   ├── r3f-shaders/
│   │   │   └── SKILL.md
│   │   ├── receiving-code-review/
│   │   │   └── SKILL.md
│   │   ├── reel-ingest/
│   │   │   └── SKILL.md
│   │   ├── reorient/
│   │   │   └── SKILL.md
│   │   ├── requesting-code-review/
│   │   │   ├── code-reviewer.md
│   │   │   └── SKILL.md
│   │   ├── send-report/
│   │   │   └── SKILL.md
│   │   ├── setup-matt-pocock-skills/
│   │   │   ├── domain.md
│   │   │   ├── issue-tracker-github.md
│   │   │   ├── issue-tracker-gitlab.md
│   │   │   ├── issue-tracker-local.md
│   │   │   ├── SKILL.md
│   │   │   └── triage-labels.md
│   │   ├── skill-router/
│   │   │   └── SKILL.md
│   │   ├── spec-driven-implementation/
│   │   │   └── SKILL.md
│   │   ├── subagent-driven-development/
│   │   │   ├── scripts/
│   │   │   │   ├── review-package
│   │   │   │   ├── sdd-workspace
│   │   │   │   └── task-brief
│   │   │   ├── implementer-prompt.md
│   │   │   ├── SKILL.md
│   │   │   └── task-reviewer-prompt.md
│   │   ├── systematic-debugging/
│   │   │   ├── condition-based-waiting-example.ts
│   │   │   ├── condition-based-waiting.md
│   │   │   ├── CREATION-LOG.md
│   │   │   ├── defense-in-depth.md
│   │   │   ├── find-polluter.sh
│   │   │   ├── root-cause-tracing.md
│   │   │   ├── SKILL.md
│   │   │   ├── test-academic.md
│   │   │   ├── test-pressure-1.md
│   │   │   ├── test-pressure-2.md
│   │   │   └── test-pressure-3.md
│   │   ├── task-management/
│   │   │   └── SKILL.md
│   │   ├── test-driven-development/
│   │   │   ├── SKILL.md
│   │   │   └── testing-anti-patterns.md
│   │   ├── thought-based-reasoning/
│   │   │   └── SKILL.md
│   │   ├── verification-before-completion/
│   │   │   └── SKILL.md
│   │   ├── visual-workshop/
│   │   │   └── SKILL.md
│   │   ├── workflow/
│   │   │   └── SKILL.md
│   │   ├── writing-plans/
│   │   │   ├── plan-document-reviewer-prompt.md
│   │   │   └── SKILL.md
│   │   └── writing-skills/
│   │       ├── examples/
│   │       │   └── CLAUDE_MD_TESTING.md
│   │       ├── anthropic-best-practices.md
│   │       ├── graphviz-conventions.dot
│   │       ├── persuasion-principles.md
│   │       ├── render-graphs.js
│   │       ├── SKILL.md
│   │       └── testing-skills-with-subagents.md
│   ├── cloud-setup.sh
│   ├── ROADMAP.md
│   ├── settings.json
│   ├── skills-router.md
│   ├── TODO.md
│   └── workflows.md
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       ├── eval-skills.yml
│       ├── immersive.yml
│       ├── portfolio.yml
│       ├── rag-index.yml
│       └── verify.yml
├── android/
│   └── README.md
├── deploy/
│   ├── .htaccess
│   └── DEPLOY.md
├── docs/
│   ├── ANTHROPIC/
│   │   └── OPUS8-SETUP-PLAN.md
│   ├── audits/
│   │   ├── 2026-06-20-audit-20pass.md
│   │   └── 2026-06-20-audit.md
│   ├── decisions/
│   │   ├── 001-backend-rule-scope.md
│   │   ├── 005-public-repo-and-license-posture.md
│   │   ├── 006-soften-phone-based-development.md
│   │   ├── 012-replatform-target.md
│   │   └── README.md
│   ├── design-system/
│   │   ├── colab/
│   │   │   ├── drapery-trellis.md
│   │   │   └── forest-video-splat.md
│   │   ├── BUILD-WORKFLOW.md
│   │   ├── HANDOFF.md
│   │   ├── IMPLEMENTATION.md
│   │   ├── PLAN.md
│   │   ├── rainforest-asset-spec.md
│   │   └── WEDDING-PAGE-EXPERIENCE-AND-REFERENCES.md
│   ├── plans/
│   │   ├── refactor/
│   │   │   ├── phase-01-docs-context.md
│   │   │   ├── phase-02-rules-drift.md
│   │   │   ├── phase-03-automation.md
│   │   │   ├── phase-04-shaders.md
│   │   │   ├── phase-05-audio.md
│   │   │   ├── phase-06-security-deploy.md
│   │   │   ├── phase-07-deps-build.md
│   │   │   ├── phase-08-rag-skills.md
│   │   │   ├── phase-09-tests-deadweight.md
│   │   │   ├── phase-10-synthesis.md
│   │   │   └── README.md
│   │   └── studio-refactor/
│   │       ├── NEXT-AGENT-PROMPT.md
│   │       └── task_plan.md
│   ├── prompts/
│   │   ├── claude-opus-4-8-system-prompt.md
│   │   └── system-prompt-ingest.md
│   ├── research/
│   │   └── best-path-forward/
│   │       └── findings.md
│   ├── superpowers/
│   │   ├── plans/
│   │   │   ├── 2026-06-19-adopt-ideas-phase1.md
│   │   │   ├── 2026-06-19-automatic-skill-workflows.md
│   │   │   ├── 2026-06-19-full-repo-comparison.md
│   │   │   ├── 2026-06-19-learn-from-corrections.md
│   │   │   ├── 2026-06-19-visual-workshop.md
│   │   │   ├── 2026-06-20-eval-harness.md
│   │   │   ├── 2026-06-20-fmhy-link-harvester.md
│   │   │   ├── 2026-06-20-portfolio-media-gathering.md
│   │   │   ├── 2026-06-20-rag-downweight-structural.md
│   │   │   ├── 2026-06-20-rag-retrieval-polish.md
│   │   │   ├── 2026-06-20-rag-semantic-recall.md
│   │   │   └── 2026-06-21-stage1-decision-free-fixes.md
│   │   └── specs/
│   │       ├── 2026-06-19-adopt-ideas-roadmap-design.md
│   │       ├── 2026-06-19-agent-onboarding-design.md
│   │       ├── 2026-06-19-full-repo-comparison-design.md
│   │       ├── 2026-06-19-visual-workshop-design.md
│   │       ├── 2026-06-20-fmhy-link-harvester-design.md
│   │       ├── 2026-06-20-portfolio-media-gathering-design.md
│   │       ├── 2026-06-20-rag-downweight-structural-design.md
│   │       ├── 2026-06-20-rag-retrieval-polish-design.md
│   │       ├── 2026-06-20-rag-semantic-recall-design.md
│   │       ├── 2026-06-20-secrets-management-design.md
│   │       └── 2026-06-21-best-path-forward-design.md
│   ├── BUILD-SPEC.md
│   └── STANDALONE.md
├── immersive/
│   ├── public/
│   │   └── assets/
│   │       └── README.md
│   ├── src/
│   │   ├── camera/
│   │   │   ├── CameraRig.jsx
│   │   │   └── offAxisFrustum.js
│   │   ├── perf/
│   │   │   └── mobileBudget.js
│   │   ├── splat/
│   │   │   ├── loadDrapery.js
│   │   │   ├── loadRainforest.js
│   │   │   ├── placeholderRainforest.js
│   │   │   ├── placeholderSplats.js
│   │   │   ├── SparkScene.jsx
│   │   │   ├── transform.js
│   │   │   └── useSplatLayer.js
│   │   ├── viewpoint/
│   │   │   └── useViewpoint.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package-lock.json
│   ├── package.json
│   ├── README.md
│   └── vite.config.js
├── portfolio/
│   ├── Gather-PortfolioMedia.ps1
│   └── README.md
├── research/
│   ├── claude-repo-comparison/
│   │   ├── BRIEF.md
│   │   └── REPORT.md
│   ├── corpus/
│   │   ├── claude-code-auto-memory-guide.md
│   │   ├── claude-code-best-practices.md
│   │   ├── claude-code-workflows-10x-productivity.md
│   │   ├── claude-md-guide.md
│   │   ├── context-engineering-claude-code.md
│   │   └── mcp-servers-guide.md
│   ├── eval-harness/
│   │   └── BRIEF.md
│   ├── findings/
│   │   ├── fmhy-tooling.md
│   │   ├── mcp-adoption.md
│   │   └── mcp-build-our-own.md
│   ├── fmhy-dev-tools/
│   │   ├── CATALOG.md
│   │   ├── links.json
│   │   ├── README.md
│   │   ├── SHORTLIST.md
│   │   └── source.md
│   ├── landing-page-rag/
│   │   └── BRIEF.md
│   ├── product-domain-comparison/
│   │   └── REPORT.md
│   ├── rag-system/
│   │   └── BRIEF.md
│   ├── scripts/
│   │   ├── crawl-site.py
│   │   └── scrape-blog.py
│   ├── visual-references/
│   │   └── webgl-creative-technique-notes.md
│   ├── README.md
│   └── TODO.md
├── server/
│   └── README.md
├── src/
│   ├── audio/
│   │   ├── analyser.js
│   │   ├── bpm.js
│   │   └── input.js
│   ├── gl/
│   │   ├── passes.js
│   │   ├── renderer.js
│   │   └── uniforms.js
│   ├── looks/
│   │   ├── hud-amber.json
│   │   ├── registry.js
│   │   └── slime-green.json
│   ├── params/
│   │   ├── schema.js
│   │   └── store.js
│   ├── shaders/
│   │   ├── common.glsl.js
│   │   ├── fullscreen.vert.js
│   │   ├── post.frag.js
│   │   └── slime.frag.js
│   ├── ui/
│   │   ├── controls.js
│   │   └── styles.css
│   └── main.js
├── src-tauri/
│   ├── capabilities/
│   │   └── default.json
│   ├── icons/
│   │   ├── 128x128.png
│   │   ├── 128x128@2x.png
│   │   ├── 32x32.png
│   │   ├── icon.icns
│   │   ├── icon.ico
│   │   ├── icon.png
│   │   ├── Square107x107Logo.png
│   │   ├── Square142x142Logo.png
│   │   ├── Square150x150Logo.png
│   │   ├── Square284x284Logo.png
│   │   ├── Square30x30Logo.png
│   │   ├── Square310x310Logo.png
│   │   ├── Square44x44Logo.png
│   │   ├── Square71x71Logo.png
│   │   ├── Square89x89Logo.png
│   │   └── StoreLogo.png
│   ├── src/
│   │   ├── lib.rs
│   │   └── main.rs
│   ├── .gitignore
│   ├── build.rs
│   ├── Cargo.toml
│   ├── Info.plist
│   └── tauri.conf.json
├── test/
│   ├── eval/
│   │   ├── outcomes.json
│   │   └── triggers.json
│   ├── eval-skills.test.mjs
│   ├── guard.test.mjs
│   ├── harvest-links.test.mjs
│   ├── portfolio.test.mjs
│   ├── rag.test.mjs
│   ├── reel-ingest.test.mjs
│   ├── render-check.mjs
│   └── smoke.mjs
├── tools/
│   ├── mcp/
│   │   ├── lib/
│   │   │   ├── browser.mjs
│   │   │   ├── docs.mjs
│   │   │   ├── looks.mjs
│   │   │   ├── render.mjs
│   │   │   ├── site.mjs
│   │   │   └── validate.mjs
│   │   ├── selftest.mjs
│   │   └── server.mjs
│   ├── portfolio/
│   │   ├── build-sheet.mjs
│   │   ├── normalize-takeout.mjs
│   │   ├── pull-drive.mjs
│   │   ├── schema.mjs
│   │   ├── sort-vision.mjs
│   │   └── stage-finals.mjs
│   ├── rag/
│   │   ├── ab-model.mjs
│   │   ├── build-index.mjs
│   │   ├── chunk.mjs
│   │   ├── embed.mjs
│   │   ├── index.json
│   │   ├── model.mjs
│   │   ├── probes.mjs
│   │   ├── quantize.mjs
│   │   ├── README.md
│   │   └── retrieve.mjs
│   ├── reel/
│   │   └── ingest.mjs
│   ├── workshop/
│   │   └── clip.mjs
│   ├── audit-site.mjs
│   ├── check-config.mjs
│   ├── eval-skills.mjs
│   ├── gen-docs.mjs
│   ├── harvest-links.mjs
│   └── health.mjs
├── workshop/
│   ├── sketches/
│   │   ├── _demo/
│   │   │   ├── _demo.frag.js
│   │   │   └── _demo.json
│   │   └── frontpage/
│   │       └── BRIEF.md
│   ├── sandbox.html
│   ├── sketch-runner.mjs
│   └── synth-audio.mjs
├── .cpanel.yml
├── .env.example
├── .gitignore
├── .mcp.json
├── AGENTS.md
├── AUDIT-BRIEF.md
├── CLAUDE.md
├── ENCYCLOPEDIA.md
├── findings.md
├── GEMINI.md
├── index.html
├── LICENSE
├── ONBOARDING.md
├── package-lock.json
├── package.json
├── progress.md
├── README.md
├── ROADMAP.md
├── skills-lock.json
├── task_plan.md
├── TODO.md
├── TREE.md
└── vite.config.js
```
