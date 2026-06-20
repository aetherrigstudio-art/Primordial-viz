// Parse the keeper ids from the GitHub issue body and stage the chosen finals.
import { readFileSync, mkdirSync, copyFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';

export function parseKeepers(issueBody) {
  const m = String(issueBody || '').match(/keepers:\s*([^\n]*)/i);
  if (!m) return [];
  return m[1].split(',').map(s => s.trim()).filter(Boolean);
}

export function selectFinals(manifest, keeperIds) {
  const set = new Set(keeperIds);
  return manifest.items.filter(it => set.has(it.id));
}

// CLI: env KEEPERS_BODY + arg <manifest.json> [outDir]
if (import.meta.url === `file://${process.argv[1]}`) {
  const [manifestPath, outDir = 'out/finals'] = process.argv.slice(2);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const ids = parseKeepers(process.env.KEEPERS_BODY || '');
  const finals = selectFinals(manifest, ids);
  mkdirSync(outDir, { recursive: true });
  for (const it of finals) { try { copyFileSync(it.path, join(outDir, basename(it.path))); } catch (e) { console.error(`skip ${it.path}: ${e.message}`); } }
  writeFileSync(join(outDir, 'keepers-manifest.json'), JSON.stringify({ count: finals.length, items: finals }, null, 2));
  console.log(`staged ${finals.length} finals -> ${outDir}`);
}
