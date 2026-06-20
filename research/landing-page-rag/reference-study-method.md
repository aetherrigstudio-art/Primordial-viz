# Landing-page reference-study method

How to gather landing-page references the right way for primordial — to *learn*
from award-quality work without copying it, and to turn what you see into
durable notes the RAG can serve later.

## The hard rule: reference-only / write-our-own

This is commercial work. You may study any source, but you **author every asset
and every line from scratch**. Reuse only **MIT / CC0 / CC-BY** material, with
attribution. Never copy a competitor's markup, art, copy, fonts (check the
license), or a CC BY-NC-SA / all-rights-reserved design. A reference is a thing
to learn a *principle* from, not a thing to lift. (Same posture as the shader
rule in `.claude/rules/shaders.md`, applied to landing-page craft.) When you
record a reference, record the **takeaway** — the principle, the pattern, the
move — not the asset.

## Tools for gathering references

- **`reel-ingest`** (skill + `tools/reel/ingest.mjs`) — turn a reference video
  (an Instagram reel, a YouTube short, a screen-recording of a site, any URL or
  uploaded mp4) into a **frame montage + metadata** an agent can actually see and
  review. Use it when the reference is motion: a hero animation, a scroll
  experience, a launch trailer. Study the montage, write down what works, discard
  the frames.
- **Web reference search** (`WebSearch` / `WebFetch`) — find award-site galleries
  and exemplary pages (e.g. Awwwards, FWA, Godly, Land-book and similar curators)
  to study current top-tier patterns in structure, motion, type, and copy. Fetch
  to read the *approach*; don't scrape assets.
- **`SendUserFile`** — when a reference (a montage, a still) is worth the
  operator's eyes, deliver the file to the phone rather than describing it or
  pasting a `file://` link (which won't open on mobile — see
  `.claude/rules/mobile-ergonomics.md`).

## What to look for (so notes are useful, not vague)

When you study a great landing page, extract *transferable principles*, not
surface decoration. Ask:

- **Structure** — what's in the hero and what's deliberately left out? In what
  order does the page make its argument? Where does the CTA repeat?
- **Motion** — what actually moves, and what's its job (guide / explain /
  express)? How restrained is it? How does it feel on a phone?
- **Type & layout** — the pairing, the scale, the spacing rhythm, the grid, how
  the dark/accent palette is rationed.
- **Copy** — the headline's shape, the CTA's verb, the voice. What makes it feel
  authored by a person, not a template?
- **Performance & access** — does it load fast, reserve space (no layout shift),
  respect reduced-motion, degrade gracefully?

The goal is to name the *why behind the move* so it can be re-applied originally
to primordial — not to reproduce the move.

## Recording takeaways as notes (feeding the RAG)

Turn what you learn into our-own-words notes, not stored assets:

- **Notes, not assets.** Write the principle and how it applies to primordial.
  Don't commit downloaded images, video, or copied markup (also keeps the inode
  budget and repo lean).
- **Focused chunks.** One topic per heading/section so the RAG retrieves it
  cleanly (the corpus chunks by heading — see `tools/rag/chunk.mjs`). A tight,
  well-titled section is a good chunk; a sprawling catch-all is not.
- **Attribute when you borrow anything reusable.** If you do reuse a CC-BY snippet
  or asset, record the source and license alongside it.
- **Commit, then rebuild the index.** New `.md` here enters the corpus, but
  `docFiles()` only sees git-*tracked* files — so commit the note first, then run
  `npm run rag:index`, then commit the updated index. (Rebuilding before
  committing the note silently excludes it and fails CI later — see
  `.claude/rules/gotchas.md`.)

## Privacy reminder

Whatever ships to the deployed page must carry **no AI/tooling fingerprints**
(`.claude/rules/deploy.md`) — that constraint is about the served `index.html` +
`src/`, not these local research notes (which are never deployed). Study freely
here; keep the shipped page clean.
