# Claude Setup TODO — Primordial-viz

Claude-environment checklist **only** (the app's task list is the repo-root `TODO.md`).
Legend: 📱 = you (app/web) · 🤖 = me (repo). Full context: `.claude/ROADMAP.md`.

## 📱 You — phone control plane (do these to unlock laptop-free flow)
- [x] Enable phone **push**: "input needed" + "task done" (Claude mobile app → settings)
- [x] Turn on **Auto mode** as default permission (user-level settings)
- [x] Add **`Primordial-viz`** to the **Claude GitHub App** repo access
- [x] Cloud **Environment → Setup script**: pasted `.claude/cloud-setup.sh`; Network = Full; no secrets
- [ ] (optional) Delete the empty **`Primordial.viz`** (dot) repo to avoid confusion

## 🤖 Me — done (committed to git)
- [x] Migrate app into `Primordial-viz` (canonical, dash)
- [x] Reconcile docs to shipped code (shaders = `.js`; looks = params-only)
- [x] Verification backbone: `test/smoke.mjs` + `test/render-check.mjs` + CI
- [x] Accessibility pass (labels, aria-live, focus, contrast, reduced-motion)
- [x] Hooks: `check-syntax`, `check-data`, SessionStart `orient`
- [x] Cross-session handoff: `progress.md` / `task_plan.md` + `CLAUDE.md` `@imports`
- [x] Claude roadmap + TODO + cloud setup script (`.claude/ROADMAP.md`, `.claude/TODO.md`, `.claude/cloud-setup.sh`)
- [x] Handoff written (latest entry in `progress.md`, per the template)

## 🤖 Me — pending app hardening (needs your "go")
- [ ] **WS1** code fixes — NEAREST audio texture, step cap 64, renderScale floor, `devicechange` listener, implement `flux`; WebGL context-loss + FBO-complete checks; getUserMedia/resume error surfacing; dt/FPS NaN guards; dynamic-res hysteresis
- [ ] **WS3** docs/research honesty — write real research into `research/findings/`
- [ ] **WS4** repo hygiene — prune vestigial `.glsl` rules in `deploy/.htaccess`
- [ ] **WS5** finish CLAUDE.md / skills / agents tuning

## 🤖 Me — knowledge & context system (detail in `.claude/ROADMAP.md`)
- [x] Knowledge router table in `CLAUDE.md` (work area → required reading)
- [x] `thought-based-reasoning` skill (structured design/planning reasoning)
- [x] Rule-injector PreToolUse hook (surface scoped rules on shader/gl/audio edits; device-aware via `CLAUDE_CODE_ENTRYPOINT`)
- [x] Skills auto-registration (`area:` field + gen-docs `@generated skills:router` block + `/find-skill` skill)
- [ ] Drift gate + fix the stale `deploy-cpanel` skill (single source of truth)
- [ ] PreCompact hook: remind to update `progress.md` before compaction
- [ ] `list_skills`/`get_skill` MCP tool (deferred — only worth it past ~20 skills)

## 🤖 Me — optional polish (needs OK)
- [ ] Terse output style (phone-friendly)
- [ ] Context7 MCP (`.mcp.json` + `enabledMcpjsonServers`)
- [ ] New `verify` / `deploy` skills (adding skills needs your OK)

## Handoff rule (every session)
Before ending: append a Session entry to `progress.md` (template in
`.claude/ROADMAP.md`), then commit + push. **Cloud keeps only git.**
