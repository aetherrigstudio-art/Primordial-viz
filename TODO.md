# TODO

The app is **built and running** — scaffold, audio core, visual core, and
instrument controls are done. Current focus: **hardening → hosting → first
collab**. Live detail lives in `task_plan.md` (status table) and the latest
**handoff** entry in `progress.md`; phases are in `ROADMAP.md`. (Claude-environment
tasks are in `.claude/TODO.md`.)

## Done
- [x] Scaffold: docs, `.claude/`, `deploy/`, `.gitignore`
- [x] App: `index.html` + `src/` (audio, gl, shaders, looks, params, ui)
- [x] Audio core (AnalyserNode FFT + 512×2 texture + bands + tap/energy beat)
- [x] Visual core (raymarched slime + HUD, params-only looks, mobile budget)
- [x] Instrument controls (sliders, look switch, device picker, tap tempo, reset)
- [x] Verification: `test/smoke.mjs` + `test/render-check.mjs` + CI; accessibility pass

- [x] WS1 hardening: NEAREST audio-texture; `flux`; `devicechange` listener; ray-step
      cap ≤64; render-scale floor 0.5; WebGL context-loss + FBO-complete checks;
      `getUserMedia` error surfacing; `dt`/FPS NaN guards; dynamic-res hysteresis
- [x] Phase 2 hosting: live over **HTTPS** at `primordial.video/Test/` (auto-deploy via Actions FTPS)

## Now — the real visual + first collab
- [ ] Build the real `/Test/` visual — the current one is a disposable placeholder (the headline item)
- [ ] Verify audio reactivity against real music on a phone
- [ ] Phase 6 — first artist collaboration

## Backlog
- [ ] Pin `realtime-bpm-analyzer` into `vendor/`/import map (currently a custom energy detector)
- [ ] More "look" presets — params-only, via the `new-preset` skill
- [ ] WS3 docs/research honesty (`research/findings/`), WS4 hygiene, WS5 polish
