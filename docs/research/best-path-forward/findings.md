# Deep-research — the best path forward (iterative)

Accumulating findings across compounding rounds (target: up to 15). Each round drills
into the top open question the prior round surfaced. Cited; claims labelled
FACT(source) vs UNSURE. Stop early if the question is conclusively answered.

## Scoped question (from the brainstorm)
**Both, sequenced:** first stabilize the current codebase (the 10 refactor phases), then
re-platform into a modern, maintainable, **multi-page "studio" website**. The current app
is a hand-built, **zero-dependency raw-WebGL2 + Web Audio (AnalyserNode)** audio-reactive
instrument on one static page (Namecheap). Operator is **solo**, moving from phone → PC/server.

Open decisions the research must inform:
1. **Stack** for the multi-page studio site (content-strong, can host a heavy WebGL canvas).
2. **Embed-vs-rebuild** the existing raw-WebGL2 instrument ("let research decide").
3. **Migration strategy** (single static page → multi-page framework site, low-risk).
4. **Hosting** (static host vs VPS/server) for a solo operator.

## Round log
| Round | Focus | Status |
|-------|-------|--------|
| 1 | Stack landscape + embed/rebuild + hosting (broad) | in progress |

---

## Round 1 — broad landscape (3 agents, ~20 sources) — STRONG CONVERGENCE
- **Stack = Astro** (FACT, multi-source): static-by-default, per-island JS, a plain
  `<script>` auto-bundles ES modules so the existing raw-WebGL2 `src/main.js` drops in
  nearly verbatim; `client:only` escape hatch; content collections for the studio pages;
  lowest learning curve; builds to a static `dist/` (no server). Longevity boost:
  Cloudflare acquired Astro Jan 2026 (kept OSS). Runner-up = vanilla+Vite MPA (max control,
  few pages); 3rd = Eleventy. Avoid Next/SvelteKit/Nuxt (app-first, overkill for a content
  site + one island).
- **Instrument = EMBED as a client-only island; do NOT rebuild in R3F** (FACT, multi-source):
  the app is RAW WebGL2, not three.js → R3F is a full rewrite onto a new dep, discarding a
  working imperative renderer + hand shader control. Optional middle path: wrap as a Web
  Component (`connectedCallback`/`disconnectedCallback`) for framework-agnostic reuse.
  Embedding gotchas + fixes: SSR/hydration → `client:only`; StrictMode double-init →
  idempotent init + cleanup (cancel rAF, delete GL resources, close AudioContext);
  AudioContext starts suspended → `resume()` on the start-gate gesture; `getUserMedia` +
  track.stop() on teardown; ResizeObserver for viewport.
- **Hosting = no server needed; Cloudflare Pages top pick** (FACT, multi-source): unlimited
  bandwidth, free, auto-HTTPS, commercial-OK, can add Workers later; deploys the same static
  tree from GitHub on push (replaces the FTPS→cPanel chain). VPS premature (only when a real
  backend lands, and that goes on its own infra per ADR-001). Leave Namecheap (manual SSL,
  inode cap).
- **Migration = strangler-fig** (FACT, Fowler/MS/AWS + GOV.UK precedent): freeze the working
  app as an isolated route; stand Astro up *alongside* (app stays a passthrough static asset);
  route new URLs to the new build; migrate pages smallest-first; convert interactivity to
  islands; migrate the WebGL app LAST (or never). De-risks the high-value asset.

**Round-1 take:** the four decisions converged cleanly (Astro · embed-as-island · Cloudflare
Pages · strangler-fig) across independent sources. Remaining risk = whether this holds under
scrutiny + the concrete integration reality + how it couples to the stabilization phase.

## Round 2 — stress-test + concrete recipe + stage-1↔stage-2 coupling (in progress)
Focus: (a) counter-evidence/risks to Astro-for-a-canvas-app + the Cloudflare-acquisition
implications; (b) exact Astro + raw-WebGL2 + Web-Audio integration recipe; (c) should the
*stabilization* phase already introduce the Vite/Astro build so the 10 refactor phases don't
produce throwaway no-build work?

### (b) Astro + raw-WebGL2 + Web-Audio recipe (FACT, Astro docs) — actionable
- Mount via a plain Astro **`<script>`** tag on a **dedicated full-page route**, importing the
  existing `src/main.js` (export a `boot()`). **NOT `client:only`** — that's for framework
  islands; a processed `<script>` bundles your local imports + JSON, no framework/dep needed.
- Frontmatter runs at BUILD time (Node) → keep ALL browser APIs (canvas/AudioContext/
  getUserMedia) in the `<script>`. Start-gate gesture works unchanged. Static build → `dist/`.
- **Asset gotcha:** literal `/looks/*.json` URLs break under a `base` sub-route (pass in dev,
  404 in build). Fix: `fetch(\`${import.meta.env.BASE_URL}looks/${id}.json\`)` or `import` the
  JSON so Astro rewrites it. Existing `import.meta.url` resolution survives IF the literal is static.
- **View Transitions:** do NOT add `<ClientRouter />` to the visualizer — keep it a standalone
  full-page route (inits once, no teardown bug). If used elsewhere, `transition:persist` on the
  canvas keeps the GL context + AudioContext alive across nav.

### (c) Stage-1↔Stage-2 coupling (FACT, multi-source) — VALIDATES the refactor plans
**Stay no-build through Stage 1; do NOT introduce Vite/Astro during stabilization.**
Stabilize-then-migrate is the established legacy pattern (characterization tests first, THEN
swap substrate). Astro's migration redoes routing/asset-paths/build anyway, so a standalone
Vite config now is throwaway.
- **Do-now (reusable in Astro):** dead-code removal, module boundaries/decomposition,
  tests + CI + doc hygiene, bug fixes/correctness, CSS cleanup, data-as-data (looks JSON).
  → **This is exactly what refactor phases 1–9 already are.** The plan is correctly scoped.
- **Defer (throwaway if done now):** standalone Vite build, hand-rolled routing/index.html
  structure, manual asset-path/import-map schemes, head/layout dedup.
- **Bridge gotchas to honor NOW so migration stays easy:** keep `new URL(asset, import.meta.url)`
  literals STATIC (Vite only rewrites static literals — `registry.js` already does this, keep
  it); avoid CDN import maps (we're zero-dep already, good); avoid bare specifiers in `new URL`.

### (a) Risks / devil's advocate (FACT, incl. critical sources) — sharpens, doesn't overturn
1. **View Transitions break canvas+audio** (serious IF used): Astro's `<ClientRouter>` caused
   Safari WebGL2 context loss on nav (fixed PR #15728, Mar 2026) and runs page scripts only
   once. **Mitigation = don't use ClientRouter on the visualizer; keep it a standalone full-page
   route.** Both other round-2 agents independently said the same. → de-risked by design.
2. **"Wrong tool" if the site is THIN** (the real fork): islands suit content-heavy sites; for a
   single always-on canvas, vanilla+Vite is simpler with no hydration tax. **If the studio site
   is actually thin → vanilla+Vite; if genuinely content-heavy (portfolio, MDX case studies,
   per-collab/weddings pages) → Astro earns its keep.** This is the one open decision research
   can't make — it's the operator's (how many real content pages?).
3. **Cloudflare/Astro lock-in** (minor): real future-tense concern (roadmap → "edge"), but a
   STATIC `astro build` is the most portable output → lowest lock-in exactly for our use. Watch,
   don't block.
4. **Cloudflare Pages limits** (minor now): 20k-file Free cap + 25 MiB/file — only bites with a
   large sample/video library; community-only support. Fine for a small static site.

---

## SYNTHESIS — the best path forward (after 2 deep rounds; 6 agents, ~45 cross-checked sources)
**The research converged hard and held under adversarial stress. Stopping early at round 2
(not padding to 15 — same "don't manufacture" discipline as the audit). The remaining fork is an
operator decision, not a research gap.**

**Recommended path (Both, sequenced):**
- **Stage 1 — Stabilize, NO build.** Execute refactor phases 1–9 exactly as scoped: behavior,
  tests, module boundaries, dead-code, doc/CI hygiene. Add NO build tooling. Honor the bridge
  gotchas now (keep `new URL(..., import.meta.url)` literals static; no CDN import maps) so the
  later migration is friction-free. *Research validated the refactor plans are correctly scoped.*
- **Stage 2 — Re-platform via strangler-fig**, instrument **embedded as a `<script>` island on a
  standalone full-page route** (NOT rebuilt in R3F — it's raw WebGL2; NOT under ClientRouter),
  migrating content pages smallest-first, app last. Host **static on Cloudflare Pages**.
- **The one decision left for the operator:** is the studio site **content-heavy → Astro**, or
  **thin → vanilla + Vite**? (Everything else — embed, Cloudflare, strangler-fig, stabilize-first —
  is the same either way.)

## Round log (final)
| Round | Focus | Status |
|-------|-------|--------|
| 1 | Stack landscape + embed/rebuild + hosting | ✅ done — strong convergence |
| 2 | Risks + Astro recipe + stage-coupling | ✅ done — held; recipe + plan-validation captured |
| 3–15 | (not run) | **stopped early — conclusively answered; the remaining fork is the operator's, not researchable** |


---

## Operator decision (post-research) — Next.js, not Astro
The research *recommended* Astro for a static-content + one-island shape. On clarification the
"content-heavy" question had been answered on a crossed wire ("content" read as graphics-rich,
not many text/media pages); the site is **graphics/video/picture-heavy** and the operator chose
**full React (Next.js)**. A throwaway **`spike/next-embed`** (Next 16 + React 19, `output:'export'`)
**validated** it: the raw-WebGL2 instrument renders inside the static export — `glOk:true`, frames
advancing, **0 console errors** (cleaner than the parallel Astro spike). So Next.js is a proven,
deliberate override of the research lean. Tradeoff: Next is heavier than Astro — watch bundle/media
perf. Canonical decision: **ADR-012**.
