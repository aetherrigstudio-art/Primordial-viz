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

## Motion
- [A](https://a.example.com), [B](https://b.example.com) or [C](https://c.example.com) - shared desc
`;

const data = parseIndex(md, { sourceUrl: 'https://fmhy.net/developer-tools', fetchedAt: '2026-06-20' });

// multi-link: all three links on one list-item line are extracted
const entryA = data.entries.find(e => e.name === 'A');
const entryB = data.entries.find(e => e.name === 'B');
const entryC = data.entries.find(e => e.name === 'C');
assert.ok(entryA, 'A parsed from multi-link line');
assert.ok(entryB, 'B parsed from multi-link line');
assert.ok(entryC, 'C parsed from multi-link line');
assert.equal(entryA.category, 'Motion', 'A has correct category');
assert.equal(entryB.category, 'Motion', 'B has correct category');
assert.equal(entryC.category, 'Motion', 'C has correct category');
assert.ok(entryA.blurb.includes('shared desc'), 'A blurb contains shared desc');
assert.ok(entryB.blurb.includes('shared desc'), 'B blurb contains shared desc');
assert.ok(entryC.blurb.includes('shared desc'), 'C blurb contains shared desc');

// dedup by url — now 6 entries: Netlify(deduped to 1) + SomeShaderLib + CrackedApp + A + B + C
assert.equal(data.entries.length, 6, 'dedups the repeated Netlify line; 6 total entries');
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
