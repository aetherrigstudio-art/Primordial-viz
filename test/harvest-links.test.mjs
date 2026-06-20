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
