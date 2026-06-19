# File Tree — Primordial-viz

> **Auto-generated — do not edit by hand.** The directory layout of every
> tracked file. Regenerate with `node tools/gen-docs.mjs`; it also refreshes
> via the PostToolUse hook and is gated in CI. For per-file descriptions see
> [`ENCYCLOPEDIA.md`](ENCYCLOPEDIA.md).
>
> 156 files in 54 directories.

```
Primordial-viz/
├── .claude/
│   ├── agents/
│   │   ├── audio-dsp.md
│   │   └── visual-qa.md
│   ├── hooks/
│   │   ├── check-data.sh
│   │   ├── check-syntax.sh
│   │   ├── gen-docs.sh
│   │   ├── inject-rules.sh
│   │   └── orient.sh
│   ├── rules/
│   │   ├── audio.md
│   │   ├── deploy.md
│   │   └── shaders.md
│   ├── skills/
│   │   ├── accessibility/
│   │   │   ├── references/
│   │   │   │   ├── A11Y-PATTERNS.md
│   │   │   │   └── WCAG.md
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
│   │   ├── debugging-and-error-recovery/
│   │   │   └── SKILL.md
│   │   ├── deploy-cpanel/
│   │   │   └── SKILL.md
│   │   ├── dispatching-parallel-agents/
│   │   │   └── SKILL.md
│   │   ├── documentation-and-adrs/
│   │   │   └── SKILL.md
│   │   ├── executing-plans/
│   │   │   └── SKILL.md
│   │   ├── finishing-a-development-branch/
│   │   │   └── SKILL.md
│   │   ├── frontend-design/
│   │   │   ├── LICENSE.txt
│   │   │   └── SKILL.md
│   │   ├── new-preset/
│   │   │   └── SKILL.md
│   │   ├── perf-budget/
│   │   │   └── SKILL.md
│   │   ├── performance/
│   │   │   └── SKILL.md
│   │   ├── receiving-code-review/
│   │   │   └── SKILL.md
│   │   ├── requesting-code-review/
│   │   │   ├── code-reviewer.md
│   │   │   └── SKILL.md
│   │   ├── skill-router/
│   │   │   └── SKILL.md
│   │   ├── spec-driven-implementation/
│   │   │   └── SKILL.md
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
│   └── TODO.md
├── .github/
│   └── workflows/
│       ├── deploy.yml
│       └── verify.yml
├── deploy/
│   ├── .htaccess
│   └── DEPLOY.md
├── docs/
│   ├── BUILD-SPEC.md
│   └── STANDALONE.md
├── research/
│   ├── corpus/
│   │   ├── claude-code-auto-memory-guide.md
│   │   ├── claude-code-best-practices.md
│   │   ├── claude-code-workflows-10x-productivity.md
│   │   ├── claude-md-guide.md
│   │   ├── context-engineering-claude-code.md
│   │   └── mcp-servers-guide.md
│   ├── findings/
│   │   ├── fmhy-tooling.md
│   │   ├── mcp-adoption.md
│   │   └── mcp-build-our-own.md
│   ├── scripts/
│   │   ├── crawl-site.py
│   │   └── scrape-blog.py
│   ├── README.md
│   └── TODO.md
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
│   └── gen-docs.mjs
├── .cpanel.yml
├── .gitignore
├── .mcp.json
├── CLAUDE.md
├── ENCYCLOPEDIA.md
├── findings.md
├── index.html
├── LICENSE
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
