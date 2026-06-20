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
const HEADING = /^(#{1,4})\s+(.*?)\s*#*$/;

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
