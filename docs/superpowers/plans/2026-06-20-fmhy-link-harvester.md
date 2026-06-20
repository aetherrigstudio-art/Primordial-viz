# FMHY Link Harvester Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harvest the FMHY Developer-Tools index into a structured, safety-gated catalog and derive a full reference + a Primordial-relevant shortlist.

**Architecture:** A pure markdown parser (`tools/harvest-links.mjs`) turns the FMHY dev-tools markdown source into `links.json` (with safety-exclusion + project-relevance tags) and renders `CATALOG.md`; a curation step derives `SHORTLIST.md`. Network is isolated to one fetch of the source markdown, so the parser is unit-testable with a fixture.

**Tech Stack:** Node ESM (`tools/*.mjs`), `node:assert` test (`test/*.mjs`, run directly), markdown, JSON. No new deps.

## Global Constraints

- **No app/runtime code** — research artifact + one `tools/` script. Output under `research/fmhy-dev-tools/`.
- **Safety gate is mandatory:** mark `excluded:true` + reason for piracy/warez/crack/keygen/nsfw/torrent entries — never present them in CATALOG/SHORTLIST.
- **Bounded:** harvest = the FMHY source only; enrichment (Task 4) is depth-1, capped ≤25, skips excluded entries.
- **No backticked nonexistent repo paths** in committed docs (the drift gate scans `.claude/**` + `deploy/DEPLOY.md` only, but keep research docs clean).
- `npm run health` green except the pre-existing `test/artifacts/render.png` drift.
- Branch `claude/onboarding-hxwhw6`; commit per task. Trailers (exact):
  `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`
  `Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P`

---

### Task 1: Scaffold dir + fetch the FMHY dev-tools markdown source

**Files:**
- Create: `research/fmhy-dev-tools/source.md` (raw FMHY markdown — the input data)

**Interfaces:**
- Produces: `research/fmhy-dev-tools/source.md`, a markdown file with `##`/`###` category headings and `- [Name](url) - blurb` list items, consumed by Task 3.

- [ ] **Step 1: Make the directory**

```bash
mkdir -p research/fmhy-dev-tools
```

- [ ] **Step 2: Resolve the raw markdown URL**

The FMHY site is a VitePress SPA; content is markdown in the `fmhy/edit` GitHub repo. Find the dev-tools markdown raw URL. Try these in order with WebFetch (or `curl -sSL`), and use the first that returns markdown containing `[` `](http` link items:
- `https://raw.githubusercontent.com/fmhy/edit/main/docs/developer-tools.md`
- `https://raw.githubusercontent.com/fmhy/edit/master/docs/developer-tools.md`
- `https://raw.githubusercontent.com/fmhy/FMHYedit/main/docs/developer-tools.md`

If none resolve, WebFetch `https://fmhy.net/developer-tools`, and from its rendered content find the "Edit this page" / GitHub source link to get the real raw URL.

- [ ] **Step 3: Save the markdown to disk**

Save the resolved raw markdown verbatim to `research/fmhy-dev-tools/source.md` (via `curl -sSL <url> -o research/fmhy-dev-tools/source.md`, or if curl is blocked, write the WebFetch'd content with the Write tool).

- [ ] **Step 4: Verify it's real list markdown**

Run: `wc -l research/fmhy-dev-tools/source.md ; grep -cE '\]\(https?://' research/fmhy-dev-tools/source.md`
Expected: a non-trivial line count and a link-count well above 20. If the link count is ~0, the SPA HTML was saved instead of markdown — go back to Step 2 and find the real raw markdown.

- [ ] **Step 5: Commit**

```bash
git add research/fmhy-dev-tools/source.md
git commit -m "data(fmhy): snapshot developer-tools markdown source

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 2: Build the parser + catalog renderer (TDD)

**Files:**
- Create: `tools/harvest-links.mjs`
- Create: `test/harvest-links.test.mjs`

**Interfaces:**
- Produces (imported by the test + the CLI):
  - `parseIndex(markdown: string, opts: {sourceUrl: string, fetchedAt: string}) => { source, source_url, fetched_at, entries }`
    where each entry = `{ name, url, category, blurb, tags: string[], relevant_to_primordial: boolean, excluded: boolean, exclude_reason: string|null }`.
  - `renderCatalog(data) => string` (markdown grouped by category, non-excluded only).
- CLI: `node tools/harvest-links.mjs <source.md> <outDir>` writes `<outDir>/links.json` + `<outDir>/CATALOG.md` and prints counts.

- [ ] **Step 1: Write the failing test**

Create `test/harvest-links.test.mjs`:

```javascript
import assert from 'node:assert';
import { parseIndex, renderCatalog } from '../tools/harvest-links.mjs';

const md = `# Developer Tools

## Hosting
- [Netlify](https://netlify.com) - free static site hosting / CDN
- [Netlify](https://netlify.com) - duplicate line

## Graphics
- [SomeShaderLib](https://example.com/shaders) - WebGL shader helpers

## Misc
- [CrackedApp](https://example.com/warez) - cracked software keygen downloads
`;

const data = parseIndex(md, { sourceUrl: 'https://fmhy.net/developer-tools', fetchedAt: '2026-06-20' });

// dedup by url
assert.equal(data.entries.length, 3, 'dedups the repeated Netlify line');
// category from heading
const netlify = data.entries.find(e => e.name === 'Netlify');
assert.equal(netlify.category, 'Hosting');
assert.equal(netlify.url, 'https://netlify.com');
assert.equal(netlify.relevant_to_primordial, true, 'hosting/cdn is relevant');
// graphics relevance
assert.equal(data.entries.find(e => e.name === 'SomeShaderLib').relevant_to_primordial, true);
// safety exclusion
const cracked = data.entries.find(e => e.name === 'CrackedApp');
assert.equal(cracked.excluded, true, 'cracked/keygen is excluded');
assert.ok(/crack|keygen|warez/i.test(cracked.exclude_reason));
// catalog omits excluded
const cat = renderCatalog(data);
assert.ok(cat.includes('Netlify') && cat.includes('## Hosting'));
assert.ok(!cat.includes('CrackedApp'), 'excluded entries never appear in CATALOG');

console.log('harvest-links: all assertions passed');
```

- [ ] **Step 2: Run the test — verify it fails**

Run: `node test/harvest-links.test.mjs`
Expected: FAIL — `Cannot find module '../tools/harvest-links.mjs'` (or import error).

- [ ] **Step 3: Implement `tools/harvest-links.mjs`**

```javascript
#!/usr/bin/env node
// Harvest a markdown "index of links" (e.g. an FMHY section) into a structured,
// safety-gated catalog. Pure parser (no network) + a catalog renderer + a CLI.

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

// Entries whose name/url/blurb match these are EXCLUDED (never surfaced).
const DENY = /\b(piracy|pirated?|warez|crack(ed|s)?|keygen|nulled|torrent|nsfw|porn|xxx|adult)\b/i;
// Entries relevant to Primordial (raw-WebGL2 audio-visual instrument + its hosting/CI).
const RELEVANT = /\b(host(ing)?|cdn|static\s*site|deploy|netlify|vercel|pages|cloudflare|webgl|web\s*gpu|glsl|shader|graphics?|canvas|render(ing|er)?|audio|sound|dsp|music|asset|texture|font|icon|sprite|image|video|ffmpeg|ci\b|continuous\s*integration|perf(ormance)?|benchmark)\b/i;

const LIST_ITEM = /^\s*[-*]\s+\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)\s*(.*)$/;
const HEADING = /^(#{2,4})\s+(.*?)\s*#*$/;

export function parseIndex(markdown, { sourceUrl, fetchedAt }) {
  const lines = markdown.split('\n');
  let category = 'Uncategorized';
  const byUrl = new Map();
  for (const line of lines) {
    const h = line.match(HEADING);
    if (h) { category = h[2].replace(/[`*]/g, '').trim() || category; continue; }
    const m = line.match(LIST_ITEM);
    if (!m) continue;
    const name = m[1].replace(/[`*]/g, '').trim();
    const url = m[2].trim();
    const blurb = m[3].replace(/^[\s\-—:|]+/, '').replace(/[`*]/g, '').trim();
    if (byUrl.has(url)) continue; // dedup by url
    const hay = `${name} ${url} ${blurb} ${category}`;
    const denyHit = hay.match(DENY);
    byUrl.set(url, {
      name, url, category, blurb,
      tags: [],
      relevant_to_primordial: RELEVANT.test(`${name} ${blurb} ${category}`),
      excluded: Boolean(denyHit),
      exclude_reason: denyHit ? `matched safety denylist: ${denyHit[0]}` : null,
    });
  }
  return { source: 'fmhy-dev-tools', source_url: sourceUrl, fetched_at: fetchedAt, entries: [...byUrl.values()] };
}

export function renderCatalog(data) {
  const live = data.entries.filter(e => !e.excluded);
  const cats = [...new Set(live.map(e => e.category))];
  let out = `# FMHY Developer Tools — catalog\n\n`;
  out += `Source: ${data.source_url} · fetched ${data.fetched_at} · `;
  out += `${live.length} entries (${data.entries.length - live.length} excluded by safety gate).\n`;
  for (const c of cats) {
    out += `\n## ${c}\n\n`;
    for (const e of live.filter(x => x.category === c)) {
      out += `- [${e.name}](${e.url})${e.blurb ? ` — ${e.blurb}` : ''}${e.relevant_to_primordial ? ' _(relevant)_' : ''}\n`;
    }
  }
  return out;
}

// CLI: node tools/harvest-links.mjs <source.md> <outDir>
const argv = process.argv.slice(2);
if (argv.length >= 2 && import.meta.url === `file://${process.argv[1]}`) {
  const [srcPath, outDir] = argv;
  const md = readFileSync(srcPath, 'utf8');
  const data = parseIndex(md, { sourceUrl: 'https://fmhy.net/developer-tools', fetchedAt: new Date().toISOString().slice(0, 10) });
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'links.json'), JSON.stringify(data, null, 2) + '\n');
  writeFileSync(join(outDir, 'CATALOG.md'), renderCatalog(data));
  const excluded = data.entries.filter(e => e.excluded).length;
  const relevant = data.entries.filter(e => e.relevant_to_primordial && !e.excluded).length;
  console.log(`harvested ${data.entries.length} entries → ${outDir}/links.json (+CATALOG.md); ${excluded} excluded, ${relevant} project-relevant.`);
}
```

- [ ] **Step 4: Run the test — verify it passes**

Run: `node test/harvest-links.test.mjs`
Expected: `harvest-links: all assertions passed`.

- [ ] **Step 5: Syntax-check + commit**

```bash
node --check tools/harvest-links.mjs && node --check test/harvest-links.test.mjs
git add tools/harvest-links.mjs test/harvest-links.test.mjs
git commit -m "feat(tools): markdown link-index harvester (parser + catalog renderer)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 3: Run the harvester on the real FMHY source

**Files:**
- Create: `research/fmhy-dev-tools/links.json`, `research/fmhy-dev-tools/CATALOG.md` (generated)

**Interfaces:**
- Consumes: `source.md` (Task 1), the CLI (Task 2).
- Produces: `links.json` + `CATALOG.md` for Task 4 + Task 5.

- [ ] **Step 1: Generate the catalog**

Run: `node tools/harvest-links.mjs research/fmhy-dev-tools/source.md research/fmhy-dev-tools`
Expected: a line like `harvested N entries … M excluded, K project-relevant.` with N well above 20.

- [ ] **Step 2: Sanity-check the output**

Run:
```bash
node -e 'const d=require("./research/fmhy-dev-tools/links.json"); console.log("entries",d.entries.length,"excluded",d.entries.filter(e=>e.excluded).length,"relevant",d.entries.filter(e=>e.relevant_to_primordial&&!e.excluded).length); console.log("sample",d.entries.slice(0,3).map(e=>e.name+" | "+e.category))'
head -20 research/fmhy-dev-tools/CATALOG.md
```
Expected: valid JSON parses; entries > 20; CATALOG.md has category headings + entries. If categories are all "Uncategorized", the source heading levels differ — adjust the `HEADING` regex in `tools/harvest-links.mjs` (e.g. allow `#{1,4}`), re-run Task 2 Step 4 test, then re-generate.

- [ ] **Step 3: Commit**

```bash
git add research/fmhy-dev-tools/links.json research/fmhy-dev-tools/CATALOG.md
git commit -m "data(fmhy): generate links.json + CATALOG.md from source

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 4: Curate the Primordial shortlist (bounded enrichment)

**Files:**
- Create: `research/fmhy-dev-tools/SHORTLIST.md`

**Interfaces:**
- Consumes: `links.json` (`relevant_to_primordial && !excluded` entries).

- [ ] **Step 1: List the relevant candidates**

Run: `node -e 'const d=require("./research/fmhy-dev-tools/links.json"); for(const e of d.entries.filter(x=>x.relevant_to_primordial&&!x.excluded)) console.log(e.category+" | "+e.name+" | "+e.url+" | "+e.blurb)'`
This is the candidate pool for the shortlist.

- [ ] **Step 2: Enrich the top picks (capped, depth-1, skip excluded)**

For up to **25** of the most Primordial-relevant candidates (prioritise: free static hosting/CDN, WebGL/GLSL/shader tools, audio/DSP libs, asset/texture/font sources, CI/perf/deploy), WebFetch each tool's homepage for a one-line "what it is" + whether it's free + license if stated. Do NOT exceed 25 fetches; do NOT fetch `excluded` entries.

- [ ] **Step 3: Write `research/fmhy-dev-tools/SHORTLIST.md`**

Group by use-to-Primordial (Hosting/Deploy · Graphics/WebGL · Audio · Assets · CI/Perf · Other), and for each pick a row: `**[Name](url)** — what it is · free?/license · _why it helps Primordial_`. Lead with a one-line intro noting it's filtered from the catalog and safety-gated. Keep it scannable (mobile).

- [ ] **Step 4: Verify + commit**

Run: `test -s research/fmhy-dev-tools/SHORTLIST.md && grep -c 'http' research/fmhy-dev-tools/SHORTLIST.md`
Expected: non-empty, several links.
```bash
git add research/fmhy-dev-tools/SHORTLIST.md
git commit -m "docs(fmhy): Primordial-relevant shortlist (curated + enriched)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
```

---

### Task 5: README, final verify, push, deliver

**Files:**
- Create: `research/fmhy-dev-tools/README.md`

- [ ] **Step 1: Write `research/fmhy-dev-tools/README.md`**

Document: what this dir is; the `links.json` schema (copy the field list from the spec); how to re-run (`node tools/harvest-links.mjs research/fmhy-dev-tools/source.md research/fmhy-dev-tools`); the **safety-gate policy** + the current excluded count (from Task 3 Step 2); the project-relevant count; and a "RAG-readiness" note (the JSON is shaped to feed the parked non-local RAG thread later). Mention enrichment is capped/depth-1 and a deep recursive crawl is intentionally out of scope.

- [ ] **Step 2: Health check**

Run: `npm run health 2>&1 | grep -E 'PASS|FAIL|Health:'`
Expected: all PASS except the pre-existing `Docs + drift gate` render.png FAIL.

- [ ] **Step 3: Commit + push**

```bash
git add research/fmhy-dev-tools/README.md
git commit -m "docs(fmhy): README — schema, re-run, safety policy, RAG-readiness

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01Pq3WdMHs3gg61UFwcwxk4P"
git push origin claude/onboarding-hxwhw6
```

- [ ] **Step 4: Deliver**

`SendUserFile` `research/fmhy-dev-tools/SHORTLIST.md` with a one-line summary (how many tools, top 2-3 picks). Then add a `progress.md` session entry summarizing the harvester + counts, and note the parked follow-ons (deep crawl, RAG ingestion).

## Self-Review

- **Spec coverage:** harvest engine (Task 2) ✓; source fetch (Task 1) ✓; safety gate + relevance tags in parser (Task 2 test asserts both) ✓; links.json schema (Task 2 impl + Task 5 README) ✓; CATALOG.md (Task 2/3) ✓; SHORTLIST.md curated+enriched, capped ≤25 depth-1 (Task 4) ✓; README w/ schema+re-run+safety+RAG note (Task 5) ✓; commit/push/SendUserFile + progress log (Task 5) ✓; reusable parser takes any md (CLI signature) ✓.
- **Placeholder scan:** Task 1 Step 2's URL list is "try in order," not a TBD; Task 4's picks are "apply this defined filter to the real data," not a placeholder. No "handle edge cases"/TODO left.
- **Type consistency:** `parseIndex`/`renderCatalog` signatures + the entry field names (`relevant_to_primordial`, `excluded`, `exclude_reason`, `blurb`, `category`) are identical across the test, the impl, the CLI, and the README schema.
