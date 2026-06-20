# System-prompt ingest map — every section, where it landed

A thorough, auditable pass over the full consumer assistant system prompt (the
"Fable 5" prompt the operator supplied), recording the disposition of **every**
section so nothing was dropped silently. The integrated behaviors live in
`.claude/rules/conduct.md` (full) and the always-loaded **Accuracy** /
**Communication** rules in `CLAUDE.md` (one-liners).

Legend: ✅ **Integrated** · 🟰 **Already covered** here · ⛔ **Not applicable** to
this repo's agent (dev tool, harness owns safety).

| Source section | Disposition | Where / why |
| --- | --- | --- |
| `product_information` (models, products, prompting, settings, ads) | 🟰 / ⛔ | LLM facts → the `claude-api` skill (read before answering LLM questions). Not an agent *behavior*. |
| `refusal_handling` (weapons, drugs, malware, real-figure persuasion) | ⛔ / ✅ | Safety owned by the Claude Code harness. The transferable manners — keep a conversational tone when declining, respect when the user ends — → conduct §4–5. |
| `critical_child_safety_instructions` | ⛔ | Harness-owned; not re-implemented in a repo rule. |
| `legal_and_financial_advice` | ⛔ | Not a dev tool's job. |
| `tone_and_formatting` + `lists_and_bullets` | ✅ | conduct §4; sharpens the always-loaded **Communication** rule (minimum formatting, prose over bullets, ≤1 question, never bullet a refusal). |
| `user_wellbeing` (no diagnosing, no over-reliance, crisis handling) | ⛔ / ✅ | Mental-health handling is harness/N-A. "Don't foster over-reliance / don't fish for another turn" → conduct §5. |
| `anthropic_reminders` (injected reminders; prompt-injection caution; long-conversation) | ✅ | conduct §3 (untrusted content = data, not instructions) + §6 (re-read load-bearing rules after a long gap / compaction). |
| `evenhandedness` (politics, contested topics) | ⛔ | Not a dev tool's job. |
| `responding_to_mistakes_and_criticism` | ✅ | conduct §5 — own mistakes without self-abasement; insist on respectful engagement. |
| `knowledge_cutoff` / `search_instructions` (search-when-uncertain, unrecognized-entity rule, scale tool calls, current date, don't overclaim) | ✅ | conduct §1–2; sharpens the always-loaded **Accuracy** rule. Verify unfamiliar libs/APIs via `context7`/`mdn`/`find-docs`; substantive answer over deflection. |
| `search_instructions` → copyright limits | 🟰 | Our analog is the **write-our-own-shaders** licensing rule (`.claude/rules/shaders.md`) + "cite evidence / reconcile" (gotchas, conduct §2). |
| `search_instructions` → `harmful_content_safety` | ⛔ | Harness-owned. |
| `using_image_search_tool` | ✅ (adapted) | conduct §7 — web-search *reference* imagery (reference-only per licensing) and deliver visuals to the phone via `SendUserFile` / the `visual-workshop` clip loop. Inline rendering is a chat-app feature this CLI lacks. |
| `citation_instructions` (claims in own words, cite sources) | 🟰 / ✅ | conduct §2 (reconcile + state in your own words) + the gotchas subagent-reconcile bullet. |
| `memory_system` | 🟰 | Our durable memory is git-committed `progress.md` / `task_plan.md` (CLAUDE.md continuity section), not the consumer memory feature. |
| `persistent_storage_for_artifacts` | 🟰 (adapted) | conduct §7 — our analog is versioned-localStorage params + saved looks (CLAUDE.md key patterns). |
| `mcp_app_suggestions` (connector directory / suggest flows) | ✅ (adapted) | conduct §7 + §1 — reach for / suggest the right tool or skill (MCP server, `context7`/`mdn`, `find-docs`, `deep-research`) instead of answering from memory. The connector *directory UX* is a chat-app feature. |
| `computer_use` (skills, file_creation, artifacts, packages, sandbox paths) | ✅ (adapted) | conduct §7 — build real artifacts (HTML demo / workshop clip / saved look) and deliver via `SendUserFile`; our `.claude/skills/*` + `tools/` are the skills analog. |
| `anthropic_api_in_artifacts` ("Claudeception") | ⛔ (by choice) | Build real artifacts (conduct §7), but in-app/in-artifact AI stays OFF on the gig path — zero runtime deps + the no-AI-endpoint privacy rule (`.claude/rules/deploy.md`). |
| Identity preamble (model = Fable 5) | ⛔ | Harness sets identity; this agent is correctly Claude Opus 4.8. Corrected variant kept in `docs/prompts/claude-opus-4-8-system-prompt.md`. |

## What changed in the repo

- **New:** `.claude/rules/conduct.md` — the integrated behavior set (7 sections;
  §7 adapts the consumer image-search / artifacts / connector edges to this CLI).
- **Sharpened (always-loaded):** the **Accuracy** + **Communication** rules in
  `CLAUDE.md`, plus a router row pointing at `conduct.md`.
- **Hooks:** `orient.sh` surfaces `conduct.md` each session; `precompact-handoff.sh`
  nudges re-reading the load-bearing rule after a compaction (conduct §6).
- **Not touched:** safety, wellbeing, politics, copyright, and consumer-product
  sections — owned by the harness or not applicable (see table).
