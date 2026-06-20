---
name: thought-based-reasoning
area: design
description: Structured reasoning harness for design, architecture, and planning decisions in Primordial-viz. Frame the problem, pull the right project knowledge via the CLAUDE.md router, weigh options against the load-bearing constraints (mobile budget, commercial licensing, cloud/phone continuity), then recommend and surface the real decision before building. Use when asked to design or architect a system, weigh approaches, or "reason/think through" a non-trivial choice.
allowed-tools: Read
---

# thought-based-reasoning — reason it through before building

A disciplined thinking pass for non-trivial design / architecture / planning
questions in this repo. The goal is a **specific, grounded recommendation with
the real decision surfaced** — not a generic options dump, and not code written
before the direction is agreed. **Reason → recommend → ask → build.**

## When to use
- "Design / architect / set up a system for …", "how should we …", "weigh X vs
  Y", "think/reason through …" — anything where jumping straight to edits is
  premature.
- NOT for mechanical tasks with an obvious path — just do those.

## The method (work the steps; show the work)

1. **Frame.** Restate the goal in a line or two. Name which layer it touches —
   the **product** (the live audio-reactive visual instrument) or the
   **agent-workshop** (the repo / continuity / knowledge system that lets a
   phone-driven agent build it), or both. State what "good" looks like (the
   success test).

2. **Ground — pull the right knowledge (use the router).** Load what already
   exists so the proposal fits reality (docs here have drifted before — read,
   don't assume):
   - Current state: `progress.md` (latest handoff) + `task_plan.md`.
   - Domain knowledge via the **Knowledge router** in `CLAUDE.md` (shaders →
     `.claude/rules/shaders.md`; audio → `.claude/rules/audio.md`; deploy →
     `.claude/rules/deploy.md`; etc.).
   - Relevant agents (`audio-dsp`, `visual-qa`) and skills (`new-preset`,
     `perf-budget`, `deploy-cpanel`).

3. **Reason — options with tradeoffs.** Lay out the real candidate approaches and
   judge each against the project's **load-bearing constraints**:
   - **Mobile performance budget** (raymarch steps ≤ 64, 0.5–0.75 render-scale,
     dynamic resolution).
   - **Commercial licensing** (write-our-own shaders; reuse only MIT / CC0 / CC-BY).
   - **Cloud/phone continuity** (durable state = git only — does it survive a
     fresh container?).
   - **Static-first, zero-runtime-dep web path**; HTTPS-for-mic.
   Prefer the smallest change that delivers. Judge **delivery and drift**, not
   just the idea.

4. **Stress-test.** Where does it break? Run the **fresh-agent test** — could a
   zero-memory agent act on this alone? What goes stale, what's the failure mode,
   what did I not verify?

5. **Recommend.** One clear recommendation (not a survey), with the **exact next
   step**. Separate build-now from roadmap-later.

6. **Decide.** Surface the genuine decision points to the operator with
   `AskUserQuestion` (mobile-friendly) before building. Don't write code until the
   direction is chosen.

## Output shape (keep it phone-scannable)
- **Frame** — goal + layer + success test (2–3 lines).
- **What I found** — grounding: current state + the relevant rules (brief).
- **Options** — with tradeoffs (tight).
- **Recommendation** — + the exact next step.
- **Decision point(s)** — the question(s) for the operator.

## Guardrails
- Reason → recommend → **ask** → build. Never the reverse.
- Durable outcomes go to **committed files** (a fresh container keeps only git):
  roadmap items → `.claude/ROADMAP.md`; plan/state → `task_plan.md` / `progress.md`.
- Keep proposals minimal, MIT/permissive, and mobile-safe. No secrets in artifacts.
