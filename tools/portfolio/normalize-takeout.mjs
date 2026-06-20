// Flatten an unzipped Google Takeout tree to media files, re-merging the
// per-file JSON sidecars (renamed to *.supplemental-metadata.json in late 2024).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { classifyType } from './schema.mjs';

export function mergeSidecar(mediaName, sidecarJson) {
  const ts = sidecarJson?.photoTakenTime?.timestamp ?? sidecarJson?.creationTime?.timestamp;
  if (!ts) return { takenAt: null };
  const n = Number(ts);
  if (!Number.isFinite(n)) return { takenAt: null };
  return { takenAt: new Date(n * 1000).toISOString() };
}

function sidecarFor(name, files) {
  const cands = [`${name}.supplemental-metadata.json`, `${name}.json`];
  return files.find(f => cands.includes(f.name));
}

export function normalizeTree(rootDir, { fs }) {
  const files = fs.readdirTree(rootDir);
  const out = [];
  for (const f of files) {
    if (!classifyType(f.name)) continue; // media only; skips .json + others
    const sc = sidecarFor(f.name, files);
    const meta = sc ? mergeSidecar(f.name, fs.readJson(sc.absPath)) : { takenAt: null };
    out.push({ name: f.name, absPath: f.absPath, takenAt: meta.takenAt });
  }
  return out;
}

// Real filesystem adapter for the CLI.
export function realFs() {
  return {
    readdirTree(root) {
      const acc = [];
      (function walk(dir) {
        for (const ent of readdirSync(dir, { withFileTypes: true })) {
          const abs = join(dir, ent.name);
          if (ent.isDirectory()) walk(abs);
          else acc.push({ name: ent.name, absPath: abs });
        }
      })(root);
      return acc;
    },
    readJson(p) { try { return JSON.parse(readFileSync(p, 'utf8')); } catch { return {}; } },
  };
}

// CLI: node tools/portfolio/normalize-takeout.mjs <unzipped-takeout-dir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2];
  if (!root) { console.error('usage: normalize-takeout.mjs <dir>'); process.exit(1); }
  const out = normalizeTree(root, { fs: realFs() });
  console.log(JSON.stringify(out, null, 2));
}
