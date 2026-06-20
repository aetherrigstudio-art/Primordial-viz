# Primordial-Relevant Tool Shortlist

Filtered from the FMHY dev-tools catalog (124 candidates, safety-gated per task-3 CATALOG.md).
Picks are the most directly useful to **primordial**: raw-WebGL2 audio-reactive static site,
commercial/write-our-own posture, mobile perf budget, deployed via GitHub Actions FTPS.
Each entry was homepage-fetched (depth-1 only); license noted where confirmed.

---

## Hosting / Deploy

**[Sevalla Static Site Hosting](https://sevalla.com/static-site-hosting/)** — Git-integrated static deployment with global edge; free tier: 100 sites, 600 build-min/mo, 100 GB bandwidth. _Backup deploy option if Namecheap FTPS ever needs replacing; edge CDN improves load time for visitors outside the EU._

**[Render](https://render.com/)** — Cloud platform for deploying web apps, static sites, and APIs; has a free static-site tier. _Drop-in upgrade path if primordial ever needs a small PHP/serverless backend alongside the static front-end._

**[Stormkit](https://www.stormkit.io/)** — Self-hostable Git-integrated CI/CD deploy platform; free for self-hosted. _Alternative deploy pipeline with zero vendor lock-in — useful if GitHub Actions FTPS becomes a pain point._

**[GetDeploying](https://getdeploying.com/)** — Side-by-side comparison of cloud providers (compute, storage, GPU pricing). _Research aid when evaluating a CDN or compute upgrade for primordial.video._

**[Pingbreak](https://pingbreak.com/)** — Free, permanently-free uptime monitor with Slack/Discord/email alerts. _Alerts when primordial.video/Test/ goes down between gigs — no credit card, no expiry._

**[Uptime Kuma](https://github.com/louislam/uptime-kuma)** — Self-hosted uptime monitor; MIT license; 90+ notification channels. _Self-hosted alternative to Pingbreak; MIT means it can be adapted freely._

**[Kener](https://kener.ing/)** — Open-source self-hosted status page; Docker-ready. _Public status page for primordial.video so collaborators/musicians can see if the link is live before a gig._

---

## Graphics / WebGL / Motion

**[Theatre.js](https://www.theatrejs.com/)** — Professional browser-based motion-design toolset; `@theatre/core` = Apache-2.0, `@theatre/studio` (dev only) = AGPL-3.0. _Visual timeline editor for animating look-transition sequences; Apache-2.0 core is commercial-safe; AGPL studio never ships to users._

**[GSAP](https://gsap.com/)** — High-performance JavaScript animation library; free (Webflow-sponsored). _Useful for the neon HUD control surface animations (CSS/DOM layer) — not for the WebGL render path, but the performer UI benefits from smooth easing._

**[HUDSxGUIS](https://www.hudsandguis.com/)** — Reference catalog of HUD/GUI designs from film, games, and products; free to browse. _Visual reference for the performer UI and HUD aesthetics — sci-fi/cyberpunk genre overlap with primordial's "grungy-future-geometric-slimy" direction._

---

## Audio

**[Game Sounds (gamesounds.xyz)](https://gamesounds.xyz/)** — Archive of royalty-free audio bundles (Kenney Sound Pack, Sonniss GDC bundles); free to browse and download. _Royalty-free SFX and ambience for live performance and look prototyping; confirm per-bundle license before commercial use (Kenney = CC0; Sonniss bundles = royalty-free for commercial)._

**[jfxr](https://jfxr.frozenfractal.com/)** — Browser-based procedural sound effect synthesizer; open source; free to use. _Quickly generate bespoke SFX for the HUD (blips, transitions) without grabbing a DAW — output is WAV you own._

---

## Assets

**[HUDSxGUIS](https://www.hudsandguis.com/)** — _(Listed above under Graphics — dual use as a visual-reference asset source.)_

---

## CI / Perf / Quality

**[Lighthouse](https://github.com/GoogleChrome/lighthouse)** — Google's open-source web performance and quality auditing tool; Apache-2.0. _Run against primordial.video/Test/ in CI to gate on load time, a11y score, and best-practices before a gig — complementary to the in-HUD FPS verdict._

**[Pa11y](https://pa11y.org/)** — Free, open-source CLI accessibility testing suite; runs headless. _CI accessibility gate — slot into `verify.yml` alongside `render-check.mjs` to catch contrast/ARIA regressions before deploy._

**[Accessibility Insights](https://accessibilityinsights.io/)** — Free, open-source browser extension and Windows tool for accessibility testing by Microsoft. _Fast manual a11y sweep of the performer UI from the browser — complements Pa11y's automated CI pass._

**[Responsively](https://responsively.app/)** — Free, open-source multi-device preview browser; 20k+ GitHub stars. _Test the performer control surface across phone/tablet viewports simultaneously — relevant since the operator drives primordial from a phone._

**[GoatCounter](https://www.goatcounter.com/)** — Privacy-respecting open-source web analytics; free hosted (donation) or self-hosted. _Track which looks/sessions get the most plays at gigs without any GDPR cookie consent overhead — no personal data stored._

---

## Other

**[Val Town](https://www.val.town/)** — Browser-based serverless scripting platform (SQLite, cron, email webhooks); free tier available. _Lightweight option for a future BPM-sync webhook or "set the look remotely from your phone" endpoint — without running a full server._

**[Astro](https://astro.build/)** — MIT, free, open-source JS framework for static and content-driven sites; zero JS by default. _Not needed for the current no-build gig path, but a clean upgrade target if primordial ever grows docs, a portfolio page, or a collab-brief landing page._

---

_Fetched: 25 homepages (depth-1 only, no excluded entries). Fleek dropped (site currently offline/rebuild). wsrv.nl and websitecarbon.com dropped (403). Web Vitals Leaderboard dropped (empty response). AppWrite dropped (backend-as-a-service, wrong fit). Final picks: 17 tools across 5 groups._
