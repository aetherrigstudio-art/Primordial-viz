# ADR-012: Re-platform target — Astro studio site + Cloudflare Pages, instrument embedded

## Status
**Accepted** — operator-directed 2026-06-21, research-backed
(`docs/research/best-path-forward/findings.md`). Forward-looking: governs Stage 2; execution
follows Stage 1 stabilization.

## Date
2026-06-21

## Context
The operator is re-platforming the single-page, phone-driven, raw-WebGL2 instrument into a
modern, maintainable **multi-page "studio" website** (server/PC workflow), **sequenced** after
stabilizing the current codebase. Two deep research rounds (6 agents, ~45 cross-checked sources)
investigated the stack, the instrument's fate, hosting, and migration strategy, and were
stress-tested adversarially.

## Decision
- **Framework = Astro** for the content-heavy studio site (static-by-default + per-island JS;
  the existing raw-WebGL2 `src/main.js` mounts via a plain `<script>` with no framework dep;
  content collections/MDX for portfolio/case-study/per-collaboration/weddings pages).
- **Instrument = embedded as-is** as a `<script>` island on a **standalone full-page route**
  (NOT under Astro's `<ClientRouter>`); **not** rebuilt in React-Three-Fiber.
- **Hosting = Cloudflare Pages**, static deploy from GitHub on push.
- **Migration = strangler-fig**, instrument migrated last; **stabilize no-build first** (Stage 1).

## Alternatives Considered
- **vanilla + Vite** — best if the site is *thin*; rejected because the operator confirmed the
  site is content-heavy (Astro's content tooling earns its keep). Strong fallback if scope shrinks.
- **Next.js / SvelteKit / Nuxt** — app-first frameworks; overkill/friction for a content site +
  one heavy island. Rejected.
- **Rebuild instrument in R3F** — the app is *raw* WebGL2 (not three.js), so R3F is a full
  rewrite onto a new dependency, discarding a working renderer + hand shader control. Rejected.
- **Stay on Namecheap cPanel** — manual SSL, inode cap, FTP deploy; weakest for a solo dev.
  Rejected once we move.

## Consequences
- A build step (Vite, via Astro) is introduced **only at Stage 2** — Stage 1 stays no-build
  (the 10 refactor phases must add no build scaffolding).
- The deploy chain changes from GitHub-Actions-FTPS→cPanel to Cloudflare Pages native Git.
- **Bridge gotchas to honor in Stage 1** so the migration is friction-free: keep
  `new URL(asset, import.meta.url)` literals static; no CDN import maps; avoid bare specifiers.
- **View-transitions caveat:** never put the instrument under `<ClientRouter>` (breaks long-lived
  WebGL2/AudioContext); keep it a standalone route, or `transition:persist` the canvas.
- **Lock-in watch:** Cloudflare acquired Astro (Jan 2026); a static `astro build` is maximally
  portable, so lock-in is low for our use — revisit only if we adopt SSR/edge features.

## Related
- `docs/research/best-path-forward/findings.md`,
  `docs/superpowers/specs/2026-06-21-best-path-forward-design.md`,
  `docs/plans/refactor/` (Stage 1), ADR-006 (phone-dev softened), ADR-005 (visibility/license),
  ADR-001 (backend on separate infra).
