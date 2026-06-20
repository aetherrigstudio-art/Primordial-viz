// tools/portfolio/sort-vision.mjs
// Score each candidate with a vision model and produce a ranked manifest.
// Pure core (injected callModel) + a Gemini adapter for the CLI/CI.
import { readFileSync, writeFileSync } from 'node:fs';
import { makeItem } from './schema.mjs';

export function groupBursts(items, { windowSec = 3 } = {}) {
  const withTime = items.filter(i => i.takenAt).sort((a, b) => a.takenAt.localeCompare(b.takenAt));
  let g = 0, prev = null;
  const groups = new Map(); // groupId -> items[]
  for (const it of withTime) {
    const ts = Date.parse(it.takenAt);
    if (prev && (ts - prev) <= windowSec * 1000) {
      it.dupGroup = `g${g}`;
    } else {
      g += 1;
      it.dupGroup = `g${g}`;
    }
    prev = ts;
    if (!groups.has(it.dupGroup)) groups.set(it.dupGroup, []);
    groups.get(it.dupGroup).push(it);
  }
  for (const members of groups.values()) {
    if (members.length < 2) { members[0].dupGroup = null; members[0].bestOfGroup = true; continue; }
    let best = members[0];
    for (const m of members) if (m.score > best.score) best = m;
    for (const m of members) m.bestOfGroup = (m === best);
  }
  return items;
}

export async function sortManifest({ files, callModel, now }) {
  const items = [];
  for (const f of files) {
    let score = 0, tags = [], reason = '';
    try {
      const r = await callModel({ path: f.destPath, type: f.type, name: f.name });
      score = Math.max(0, Math.min(100, Number(r.score) || 0));
      tags = Array.isArray(r.tags) ? r.tags : [];
      reason = String(r.reason || '');
    } catch (e) {
      reason = `model error: ${e.message}`;
    }
    items.push(makeItem({ id: f.id || f.name, path: f.destPath, type: f.type, score, tags, reason, takenAt: f.takenAt || null }));
  }
  groupBursts(items);
  items.sort((a, b) => b.score - a.score);
  return { generatedAt: now, count: items.length, items };
}

const RUBRIC = `You are curating a professional visual artist's portfolio. Rate this image 0-100 for portfolio-worthiness (composition, sharpness, lighting, uniqueness; penalize screenshots, blurry, duplicates, memes, documents). Respond ONLY with compact JSON: {"score":<0-100>,"tags":["..."],"reason":"<=12 words"}.`;

export function makeGeminiModel({ apiKey, model = 'gemini-2.0-flash' }) {
  return async function callModel({ path, type }) {
    if (type !== 'image') return { score: 0, tags: ['video'], reason: 'video not scored in v1' };
    const b64 = readFileSync(path).toString('base64');
    const mime = path.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg';
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: RUBRIC }, { inline_data: { mime_type: mime, data: b64 } }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0 },
      }),
    });
    if (!res.ok) throw new Error(`gemini ${res.status}: ${await res.text()}`);
    const json = await res.json();
    const text = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';
    return JSON.parse(text);
  };
}

// CLI: node tools/portfolio/sort-vision.mjs <files.json> <out manifest.json>
// <files.json> = array of {name,destPath,type,takenAt}. Needs GEMINI_API_KEY.
if (import.meta.url === `file://${process.argv[1]}`) {
  const [filesPath, outPath = 'work/manifest.json'] = process.argv.slice(2);
  const files = JSON.parse(readFileSync(filesPath, 'utf8'));
  const callModel = makeGeminiModel({ apiKey: process.env.GEMINI_API_KEY });
  const manifest = await sortManifest({ files, callModel, now: new Date().toISOString() });
  writeFileSync(outPath, JSON.stringify(manifest, null, 2));
  console.log(`wrote ${outPath} (${manifest.count} items)`);
}
