# Front-page visual references — reel study

Reference-study notes from 8 Instagram reels the operator shared as direction for
the primordial frontpage (ingested via the `reel-ingest` tool, 2026-06-20). The
montage media is gitignored and won't survive a wipe — **these notes are the
durable record**, so they capture technique/palette/motion, not assets.

## Licensing guardrail (load-bearing)

**Reference study only.** These clips are other people's commercial work — many
are AI-influencer "Claude/Fable 5 built this" engagement posts ("comment X for the
link"), so treat the captions as marketing, and study the *design technique and
direction* (palette, motion, shader approach, layout), then author everything from
a blank file per `.claude/rules/shaders.md`. Never copy their code or assets; don't
redistribute the downloaded media.

## What the reels show (per clip)

- **rndyrbrts — green-on-black scientific HUD** (`DZcRoIEi4hB`). The strongest
  identity match. Near-black dashboards layered with **acid-green** generative
  graphics: hexagonal/Voronoi cell grids, dot-matrix forms, node graphs, flowing
  particle waves, technical readouts. This is exactly primordial's
  **neon-HUD + geometric + future** territory — controlled, dense, instrument-like.
- **tafdydy.pro.ai — WebGL fluid dynamics** (`DZqUSAAoTID`). Liquid-glass blobs,
  procedural water (NASA-style), and 3D models (mountains, a 747). The **"slimy"**
  reference: real-time fluid/metaball motion rendered with a wet, glassy surface.
- **weblove — liquid-glass typography** (`DZdHeceOL8J`). Big 3D glass letterforms
  over a sky/clouds video loop. Caption names the stack: Three.js **transmission
  shaders** (text looks like blown/refracting glass), a video layer behind the
  glass for depth, **GSAP ScrollTrigger** for scroll-linked motion. Technique-rich.
- **gabriel.viza — "TORO" 3D product hero** (`DZdCq4TRpyu`). Dark site, a single
  **neon-green** sports-car render as the hero, bold uppercase wordmark. Clean
  example of *dark base + one rationed accent + a 3D hero that is the product*.
- **piyush.glitch — "3D immersive site"** (`DV9TD6NkwYq`). Black automotive 3D
  showcase, huge bold type ("THE LEGEND"), cinematic product lighting. Reinforces
  the dark-immersive-hero pattern.
- **piyush.glitch — "DESIGN" editorial** (`DV9RQuzk_n3`). Bold serif/display type
  as the hero element on a designer-portfolio layout. Type-as-hero.
- **fsferdows — dark neon portfolio** (`DYkSEHnpATn`). Dark, neon-accented
  portfolio with a code-editor aesthetic and grungy graffiti-style wordmarks.
  Notably the caption is a **performance** note (React/Three.js scroll reflows
  bottleneck the CPU) — a useful cautionary tale, not just eye-candy.
- **muaad.ai — liquid glass + fiery render** (`DZeM7Jdsdtn`). Glass typography plus
  a fiery phoenix 3D render; "one-prompt website" engagement post.

## Synthesis — what to study (technique) for primordial

The set converges hard on primordial's charter. Recurring moves worth learning
(then authoring our own versions of):

- **Dark base, one rationed accent.** Near-black everywhere; a single neon
  (acid-green dominates this set) reserved for the hero light, key type, and the
  CTA. Matches our neon-HUD rule (`research/landing-page-rag/type-and-layout.md`).
- **The hero IS the product.** Every strong example leads with a live/3D visual,
  not stock imagery — exactly the visuals-only WebGL hero in
  `workshop/sketches/frontpage/BRIEF.md`.
- **Two distinct visual languages to hit our four charter words:**
  - *Slimy/future* → the **fluid-dynamics + liquid-glass** look (tafdydy, weblove,
    muaad): metaballs with a wet, refracting glass surface (transmission/SSS).
  - *Geometric/future* → the **green-on-black HUD** look (rndyrbrts): hex/Voronoi
    grids, node graphs, particle fields. This is the under-explored "geometric"
    word the frontpage BRIEF flags — a clear direction to prototype.
  A hybrid (slime flowing over/through a hard geometric HUD lattice) is the
  `fp-hybrid` sketch the BRIEF already proposes.
- **Bold display type as a co-star** with the visual (TORO, DESIGN, THE LEGEND) —
  a single confident wordmark, not a paragraph (`copy-and-voice.md`).
- **Scroll-linked motion (GSAP ScrollTrigger)** drives the polish in several — but
  watch the perf tell from fsferdows: scroll-reflow + heavy WebGL can bottleneck
  the CPU. On our phone-first budget that means reveal motion stays cheap and the
  shader hero honors the step-cap / dynamic-res / pause-on-hidden rules
  (`.claude/rules/shaders.md`, `research/landing-page-rag/motion-and-feel.md`).

## Suggested next step

Workshop two hero directions as clips (`visual-workshop` → `npm run clip`): a
**green-on-black geometric HUD** and the existing **wet slime**, then react. The
references make the case for finally prototyping the geometric direction the
frontpage BRIEF says is under-explored.
