# Portfolio Media Gathering Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the dev-tooling pipeline that turns a large, messy Google Drive/Photos pile into a ranked, phone-triageable shortlist of portfolio candidates — runnable from a phone-only workflow.

**Architecture:** A funnel split phone↔CI. The operator hand-culls candidates into one Google Drive folder (and, for Photos, via Gemini `@Google Photos` → Takeout → that same Drive folder). A `workflow_dispatch` GitHub Action pulls the folder (Drive OAuth refresh token), normalizes Takeout metadata, scores every item with Gemini 2.x (free tier) into a ranked `manifest.json`, builds a static contact-sheet page, and deploys it. The operator taps keepers on the phone; a "Save keepers" button opens a pre-filled GitHub issue; an `issues`-triggered job parses it and stages the finals for the next sub-project (touch-up).

**Tech Stack:** Node 22 ESM (native `fetch`, `node:test`/`node:assert`), Google Drive REST API, Google Generative Language (Gemini) REST API, GitHub Actions, the repo's existing FTPS deploy. No new runtime deps; all dev-tooling under `tools/portfolio/` (never shipped to the web path).

## Global Constraints

- **Zero web-path runtime deps.** All code lives in `tools/portfolio/` (dev-tooling, like `tools/rag/`); never imported by `index.html`/`src/`. Use native `fetch` — add NO npm dependencies. [CLAUDE.md "Zero runtime dependencies"]
- **Pure-core + injected-boundary + CLI** per existing tools (`tools/eval-skills.mjs`, `tools/harvest-links.mjs`): export pure functions; inject network boundaries (`driveClient`, `callModel`) so tests run **tokenless** and offline.
- **Tests:** `test/portfolio.test.mjs`, `import assert from 'node:assert'` + `node:test`, run via `node test/portfolio.test.mjs`. No network in tests.
- **Commercial-safe + privacy:** Gemini free tier is OK for portfolio art but **free-tier inputs may be used by Google for training** — document it. No non-commercial models. Secrets come from GitHub Actions secrets (sourced from Proton Pass, sub-project #2) — never hard-coded, never committed.
- **Mobile-ergonomics:** operator steps are phone-only; no desktop/Windows/Mac steps; deliver via GitHub state, not local FTP; one value per code block in the runbook.
- **Node version:** match `.github/workflows/verify.yml` (Node 22).
- **Scope:** gathering only. Touch-up, depth, the page, and the secrets-manager wiring are separate sub-projects. Do not build them here.

---

### Task 1: Manifest schema (shared data contract)

**Files:**
- Create: `tools/portfolio/schema.mjs`
- Test: `test/portfolio.test.mjs`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `makeItem({id, path, type, score, tags, reason, dupGroup, bestOfGroup, takenAt})` → a normalized manifest item object (fills defaults: `tags=[]`, `score=0`, `reason=''`, `dupGroup=null`, `bestOfGroup=true`, `takenAt=null`).
  - `validateManifest(obj)` → `{ok:boolean, errors:string[]}`. A valid manifest is `{generatedAt:string, count:number, items:Item[]}` with `count===items.length`, each item having string `id`/`path`, `type` ∈ `{'image','video'}`, numeric `score` in `0..100`, array `tags`.
  - `IMAGE_EXT` / `VIDEO_EXT` (lowercase, dot-prefixed arrays) and `classifyType(filename)` → `'image'|'video'|null`.

- [ ] **Step 1: Write the failing test**

```js
// in test/portfolio.test.mjs
import assert from 'node:assert';
import { test } from 'node:test';
import { makeItem, validateManifest, classifyType } from '../tools/portfolio/schema.mjs';

test('makeItem fills defaults', () => {
  const it = makeItem({ id: 'a', path: 'a.jpg', type: 'image' });
  assert.equal(it.score, 0);
  assert.deepEqual(it.tags, []);
  assert.equal(it.dupGroup, null);
  assert.equal(it.bestOfGroup, true);
});

test('classifyType maps extensions', () => {
  assert.equal(classifyType('Shot.JPG'), 'image');
  assert.equal(classifyType('clip.mov'), 'video');
  assert.equal(classifyType('notes.txt'), null);
});

test('validateManifest catches bad score and count', () => {
  const bad = { generatedAt: 'x', count: 2, items: [makeItem({ id: 'a', path: 'a.jpg', type: 'image', score: 200 })] };
  const r = validateManifest(bad);
  assert.equal(r.ok, false);
  assert.ok(r.errors.some(e => /count/.test(e)));
  assert.ok(r.errors.some(e => /score/.test(e)));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/portfolio.test.mjs`
Expected: FAIL — `Cannot find module '../tools/portfolio/schema.mjs'`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/portfolio/schema.mjs
// Shared manifest contract for the portfolio gathering pipeline. Pure, no I/O.

export const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.heic', '.bmp'];
export const VIDEO_EXT = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.mpg', '.mpeg'];

export function classifyType(filename) {
  const lower = String(filename).toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = lower.slice(dot);
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return null;
}

export function makeItem({ id, path, type, score = 0, tags = [], reason = '', dupGroup = null, bestOfGroup = true, takenAt = null }) {
  return { id, path, type, score, tags: [...tags], reason, dupGroup, bestOfGroup, takenAt };
}

export function validateManifest(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['manifest is not an object'] };
  if (typeof obj.generatedAt !== 'string') errors.push('generatedAt must be a string');
  if (!Array.isArray(obj.items)) { errors.push('items must be an array'); return { ok: false, errors }; }
  if (obj.count !== obj.items.length) errors.push(`count (${obj.count}) !== items.length (${obj.items.length})`);
  obj.items.forEach((it, i) => {
    if (typeof it.id !== 'string') errors.push(`item[${i}].id must be a string`);
    if (typeof it.path !== 'string') errors.push(`item[${i}].path must be a string`);
    if (it.type !== 'image' && it.type !== 'video') errors.push(`item[${i}].type must be image|video`);
    if (typeof it.score !== 'number' || it.score < 0 || it.score > 100) errors.push(`item[${i}].score out of range`);
    if (!Array.isArray(it.tags)) errors.push(`item[${i}].tags must be an array`);
  });
  return { ok: errors.length === 0, errors };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/portfolio.test.mjs`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add tools/portfolio/schema.mjs test/portfolio.test.mjs
git commit -m "feat(portfolio): manifest schema + type classifier"
```

---

### Task 2: Takeout normalizer

**Files:**
- Create: `tools/portfolio/normalize-takeout.mjs`
- Test: `test/portfolio.test.mjs` (append)

**Interfaces:**
- Consumes: `classifyType` from Task 1.
- Produces:
  - `mergeSidecar(mediaName, sidecarJson)` → `{ takenAt: string|null }`. Reads Google Takeout's `photoTakenTime.timestamp` (epoch seconds, string) and returns an ISO string, else `null`.
  - `normalizeTree(rootDir, { fs })` → `Array<{ name, absPath, takenAt }>` for every media file under `rootDir`, pairing each with its `*.supplemental-metadata.json` (or legacy `<name>.json`) sidecar when present. `fs` is injected (`{ readdirTree, readJson }`) so it's testable without a real disk.

- [ ] **Step 1: Write the failing test**

```js
// append to test/portfolio.test.mjs
import { mergeSidecar, normalizeTree } from '../tools/portfolio/normalize-takeout.mjs';

test('mergeSidecar reads photoTakenTime', () => {
  const r = mergeSidecar('IMG_1.jpg', { photoTakenTime: { timestamp: '1700000000' } });
  assert.equal(r.takenAt, new Date(1700000000 * 1000).toISOString());
});

test('normalizeTree pairs media with supplemental sidecar', () => {
  const fakeFs = {
    readdirTree: () => [
      { name: 'IMG_1.jpg', absPath: '/t/IMG_1.jpg' },
      { name: 'IMG_1.jpg.supplemental-metadata.json', absPath: '/t/IMG_1.jpg.supplemental-metadata.json' },
      { name: 'clip.mov', absPath: '/t/clip.mov' },
      { name: 'metadata.json', absPath: '/t/metadata.json' }, // album-level, ignored
    ],
    readJson: (p) => p.includes('IMG_1') ? { photoTakenTime: { timestamp: '1700000000' } } : {},
  };
  const out = normalizeTree('/t', { fs: fakeFs });
  assert.equal(out.length, 2); // IMG_1.jpg + clip.mov (media only)
  const img = out.find(o => o.name === 'IMG_1.jpg');
  assert.equal(img.takenAt, new Date(1700000000 * 1000).toISOString());
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/portfolio.test.mjs`
Expected: FAIL — cannot find `normalize-takeout.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/portfolio/normalize-takeout.mjs
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/portfolio.test.mjs`
Expected: PASS (5 tests total).

- [ ] **Step 5: Commit**

```bash
git add tools/portfolio/normalize-takeout.mjs test/portfolio.test.mjs
git commit -m "feat(portfolio): Takeout sidecar normalizer"
```

---

### Task 3: Drive puller (injected client)

**Files:**
- Create: `tools/portfolio/pull-drive.mjs`
- Test: `test/portfolio.test.mjs` (append)

**Interfaces:**
- Consumes: `classifyType` (Task 1).
- Produces:
  - `pullFolder({ driveClient, folderId, write })` → `Promise<Array<{id,name,destPath,type}>>` — lists the folder, filters to media via `classifyType`, downloads each via `driveClient.download`, returns the manifest of pulled files. `write(name, bytes)→destPath` is injected.
  - `driveClient` shape: `{ list(folderId) → Promise<[{id,name,mimeType,size}]>, download(fileId) → Promise<Uint8Array> }`.
  - `makeDriveClient({ accessToken })` → a real client using `fetch` against `https://www.googleapis.com/drive/v3`. (Adapter; not unit-tested.)
  - `accessTokenFromRefresh({ clientId, clientSecret, refreshToken })` → `Promise<string>` via Google's OAuth token endpoint. (Adapter; not unit-tested.)

- [ ] **Step 1: Write the failing test**

```js
// append to test/portfolio.test.mjs
import { pullFolder } from '../tools/portfolio/pull-drive.mjs';

test('pullFolder downloads only media and records destPaths', async () => {
  const fakeClient = {
    async list() {
      return [
        { id: '1', name: 'hero.jpg', mimeType: 'image/jpeg', size: '10' },
        { id: '2', name: 'notes.txt', mimeType: 'text/plain', size: '5' },
        { id: '3', name: 'reel.mp4', mimeType: 'video/mp4', size: '20' },
      ];
    },
    async download(id) { return new Uint8Array([id.charCodeAt(0)]); },
  };
  const written = [];
  const out = await pullFolder({
    driveClient: fakeClient,
    folderId: 'F',
    write: (name) => { written.push(name); return `/work/${name}`; },
  });
  assert.equal(out.length, 2); // jpg + mp4, not txt
  assert.deepEqual(written.sort(), ['hero.jpg', 'reel.mp4']);
  assert.equal(out.find(o => o.name === 'hero.jpg').type, 'image');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/portfolio.test.mjs`
Expected: FAIL — cannot find `pull-drive.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/portfolio/pull-drive.mjs
// Pull media from one Google Drive folder. Pure core (injected driveClient +
// write) + real fetch-based adapters for the CLI/CI.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { classifyType } from './schema.mjs';

export async function pullFolder({ driveClient, folderId, write }) {
  const entries = await driveClient.list(folderId);
  const out = [];
  for (const e of entries) {
    const type = classifyType(e.name);
    if (!type) continue;
    const bytes = await driveClient.download(e.id);
    const destPath = write(e.name, bytes);
    out.push({ id: e.id, name: e.name, destPath, type });
  }
  return out;
}

export async function accessTokenFromRefresh({ clientId, clientSecret, refreshToken }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

export function makeDriveClient({ accessToken }) {
  const auth = { authorization: `Bearer ${accessToken}` };
  return {
    async list(folderId) {
      const files = [];
      let pageToken;
      do {
        const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const res = await fetch(url, { headers: auth });
        if (!res.ok) throw new Error(`drive list failed: ${res.status} ${await res.text()}`);
        const json = await res.json();
        files.push(...(json.files || []));
        pageToken = json.nextPageToken;
      } while (pageToken);
      return files;
    },
    async download(fileId) {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, { headers: auth });
      if (!res.ok) throw new Error(`drive download failed: ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    },
  };
}

// CLI: env GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN + arg <folderId> <destDir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [folderId, destDir = 'work/raw'] = process.argv.slice(2);
  if (!folderId) { console.error('usage: pull-drive.mjs <folderId> [destDir]'); process.exit(1); }
  const accessToken = await accessTokenFromRefresh({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  });
  mkdirSync(destDir, { recursive: true });
  const out = await pullFolder({
    driveClient: makeDriveClient({ accessToken }),
    folderId,
    write: (name, bytes) => { const p = join(destDir, name); writeFileSync(p, bytes); return p; },
  });
  console.log(JSON.stringify(out, null, 2));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/portfolio.test.mjs`
Expected: PASS (6 tests total).

- [ ] **Step 5: Commit**

```bash
git add tools/portfolio/pull-drive.mjs test/portfolio.test.mjs
git commit -m "feat(portfolio): Drive folder puller with OAuth refresh adapter"
```

---

### Task 4: Vision sorter (injected model) + burst dedup

**Files:**
- Create: `tools/portfolio/sort-vision.mjs`
- Test: `test/portfolio.test.mjs` (append)

**Interfaces:**
- Consumes: `makeItem` (Task 1).
- Produces:
  - `groupBursts(items, { windowSec = 3 })` → mutates/returns items with `dupGroup` set for items whose `takenAt` are within `windowSec`, and `bestOfGroup` true only on the highest-`score` member of each group.
  - `sortManifest({ files, callModel, now })` → `Promise<manifest>` where `files` is `[{id?,name,destPath,type,takenAt?}]`. Calls `callModel({path,type,name})→{score,tags,reason}` per file, builds items, runs `groupBursts`, sorts by `score` desc, returns `{generatedAt: now, count, items}`.
  - `makeGeminiModel({ apiKey, model = 'gemini-2.0-flash' })` → a `callModel` using the Generative Language REST API with an inline base64 image and a strict JSON-only prompt. (Adapter; not unit-tested.)

- [ ] **Step 1: Write the failing test**

```js
// append to test/portfolio.test.mjs
import { sortManifest, groupBursts } from '../tools/portfolio/sort-vision.mjs';
import { makeItem } from '../tools/portfolio/schema.mjs';

test('groupBursts groups by time and flags best-of-group', () => {
  const t = '2024-01-01T00:00:00.000Z';
  const t2 = '2024-01-01T00:00:02.000Z';
  const far = '2024-01-01T01:00:00.000Z';
  const items = [
    makeItem({ id: 'a', path: 'a', type: 'image', score: 40, takenAt: t }),
    makeItem({ id: 'b', path: 'b', type: 'image', score: 70, takenAt: t2 }),
    makeItem({ id: 'c', path: 'c', type: 'image', score: 90, takenAt: far }),
  ];
  groupBursts(items, { windowSec: 3 });
  const a = items.find(i => i.id === 'a'), b = items.find(i => i.id === 'b'), c = items.find(i => i.id === 'c');
  assert.equal(a.dupGroup, b.dupGroup); // same burst
  assert.notEqual(a.dupGroup, c.dupGroup);
  assert.equal(b.bestOfGroup, true);  // higher score in the burst
  assert.equal(a.bestOfGroup, false);
});

test('sortManifest ranks by model score', async () => {
  const callModel = async ({ name }) => ({ score: name === 'good.jpg' ? 95 : 10, tags: ['t'], reason: 'r' });
  const m = await sortManifest({
    files: [{ name: 'meh.jpg', destPath: 'meh.jpg', type: 'image' }, { name: 'good.jpg', destPath: 'good.jpg', type: 'image' }],
    callModel,
    now: 'NOW',
  });
  assert.equal(m.generatedAt, 'NOW');
  assert.equal(m.count, 2);
  assert.equal(m.items[0].path, 'good.jpg'); // highest score first
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/portfolio.test.mjs`
Expected: FAIL — cannot find `sort-vision.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/portfolio.test.mjs`
Expected: PASS (8 tests total).

- [ ] **Step 5: Commit**

```bash
git add tools/portfolio/sort-vision.mjs test/portfolio.test.mjs
git commit -m "feat(portfolio): Gemini vision sorter + burst dedup"
```

---

### Task 5: Contact-sheet builder (ranked grid + keeper deep-link)

**Files:**
- Create: `tools/portfolio/build-sheet.mjs`
- Test: `test/portfolio.test.mjs` (append)

**Interfaces:**
- Consumes: `validateManifest` (Task 1).
- Produces:
  - `renderSheet(manifest, { issueBase, thumbBase = '' })` → an HTML string: a responsive grid (one cell per item, best-first), each cell showing the thumbnail (`thumbBase + item.path`), score, tags, a tap-to-keep checkbox carrying `data-id`, and a "Save keepers" button whose JS collects checked ids and navigates to `issueBase + '?title=portfolio-keepers&body=' + encodeURIComponent('keepers: ' + ids.join(','))`. HTML-escapes all text. `issueBase` defaults to the repo's `/issues/new` URL.
  - CLI writes `out/index.html`.

- [ ] **Step 1: Write the failing test**

```js
// append to test/portfolio.test.mjs
import { renderSheet } from '../tools/portfolio/build-sheet.mjs';

test('renderSheet emits a cell per item and a keeper deep-link', () => {
  const manifest = { generatedAt: 'x', count: 1, items: [
    { id: 'a&b', path: 'a.jpg', type: 'image', score: 88, tags: ['neon'], reason: 'sharp', dupGroup: null, bestOfGroup: true, takenAt: null },
  ] };
  const html = renderSheet(manifest, { issueBase: 'https://github.com/o/r/issues/new' });
  assert.ok(html.includes('data-id="a&amp;b"'), 'escapes + carries id');
  assert.ok(html.includes('a.jpg'));
  assert.ok(html.includes('88'));
  assert.ok(/issues\/new/.test(html));
  assert.ok(html.includes('portfolio-keepers'));
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/portfolio.test.mjs`
Expected: FAIL — cannot find `build-sheet.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/portfolio/build-sheet.mjs
// Render a phone-friendly ranked contact sheet from a manifest. The "Save
// keepers" button opens a pre-filled GitHub issue (no backend needed).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const esc = (s) => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function renderSheet(manifest, { issueBase = 'https://github.com/aetherrigstudio-art/Primordial-viz/issues/new', thumbBase = '' } = {}) {
  const cells = manifest.items.map(it => `
    <figure class="cell${it.bestOfGroup ? '' : ' dup'}">
      <label><input type="checkbox" data-id="${esc(it.id)}">
      ${it.type === 'image'
        ? `<img loading="lazy" src="${esc(thumbBase + it.path)}" alt="">`
        : `<video src="${esc(thumbBase + it.path)}" muted preload="metadata"></video>`}
      <figcaption><b>${esc(it.score)}</b> ${esc(it.tags.join(' · '))}<br><small>${esc(it.reason)}</small></figcaption>
      </label>
    </figure>`).join('');
  return `<!doctype html><html lang="en"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Portfolio picks</title>
<style>
  body{margin:0;background:#0b0b0f;color:#e8e8ef;font:14px/1.4 system-ui,sans-serif}
  header{position:sticky;top:0;background:#111;padding:.6rem;display:flex;gap:.6rem;align-items:center;z-index:2}
  button{font:inherit;padding:.6rem 1rem;border:0;border-radius:.5rem;background:#5b8cff;color:#fff}
  .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px;padding:6px}
  .cell{margin:0;background:#15151c;border-radius:.4rem;overflow:hidden}
  .cell.dup{opacity:.45}
  .cell img,.cell video{width:100%;aspect-ratio:1;object-fit:cover;display:block}
  figcaption{padding:.4rem}
  input{transform:scale(1.4);margin:.4rem}
  :checked ~ img,:checked ~ video{outline:3px solid #5bff9b}
</style>
<header><button id="save">Save keepers</button><span id="n">0 selected · ${esc(manifest.count)} shown</span></header>
<main class="grid">${cells}</main>
<script>
  const boxes = [...document.querySelectorAll('input[type=checkbox]')];
  const n = document.getElementById('n');
  const upd = () => n.textContent = boxes.filter(b=>b.checked).length + ' selected · ${esc(manifest.count)} shown';
  boxes.forEach(b => b.addEventListener('change', upd));
  document.getElementById('save').addEventListener('click', () => {
    const ids = boxes.filter(b=>b.checked).map(b=>b.dataset.id);
    const body = 'keepers: ' + ids.join(',');
    location.href = ${JSON.stringify(issueBase)} + '?title=portfolio-keepers&body=' + encodeURIComponent(body);
  });
</script></html>`;
}

// CLI: node tools/portfolio/build-sheet.mjs <manifest.json> <outDir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [manifestPath, outDir = 'work/sheet'] = process.argv.slice(2);
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, 'index.html'), renderSheet(manifest, { thumbBase: 'media/' }));
  console.log(`wrote ${join(outDir, 'index.html')}`);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/portfolio.test.mjs`
Expected: PASS (9 tests total).

- [ ] **Step 5: Commit**

```bash
git add tools/portfolio/build-sheet.mjs test/portfolio.test.mjs
git commit -m "feat(portfolio): ranked contact-sheet builder with keeper deep-link"
```

---

### Task 6: Keeper-issue parser + finals stager

**Files:**
- Create: `tools/portfolio/stage-finals.mjs`
- Test: `test/portfolio.test.mjs` (append)

**Interfaces:**
- Consumes: a manifest (Task 1 shape).
- Produces:
  - `parseKeepers(issueBody)` → `string[]` — extracts ids from a `keepers: id1,id2,...` line (tolerates whitespace, trailing text, and the ids appearing anywhere in the body). Returns `[]` if none.
  - `selectFinals(manifest, keeperIds)` → `Array<Item>` — the manifest items whose `id` ∈ `keeperIds`, preserving manifest order.
  - CLI: reads `KEEPERS_BODY` env + a manifest path, copies each final's `path` into `out/finals/` (for hand-off to sub-project #3) and writes `out/finals/keepers-manifest.json`.

- [ ] **Step 1: Write the failing test**

```js
// append to test/portfolio.test.mjs
import { parseKeepers, selectFinals } from '../tools/portfolio/stage-finals.mjs';

test('parseKeepers extracts comma list from a body', () => {
  assert.deepEqual(parseKeepers('thanks\nkeepers: a, b ,c\n--'), ['a', 'b', 'c']);
  assert.deepEqual(parseKeepers('no list here'), []);
});

test('selectFinals returns matching items in manifest order', () => {
  const manifest = { items: [
    { id: 'a', path: 'a.jpg' }, { id: 'b', path: 'b.jpg' }, { id: 'c', path: 'c.jpg' },
  ] };
  const out = selectFinals(manifest, ['c', 'a']);
  assert.deepEqual(out.map(i => i.id), ['a', 'c']); // manifest order, not keeper order
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --test test/portfolio.test.mjs`
Expected: FAIL — cannot find `stage-finals.mjs`.

- [ ] **Step 3: Write minimal implementation**

```js
// tools/portfolio/stage-finals.mjs
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --test test/portfolio.test.mjs`
Expected: PASS (11 tests total).

- [ ] **Step 5: Commit**

```bash
git add tools/portfolio/stage-finals.mjs test/portfolio.test.mjs
git commit -m "feat(portfolio): keeper-issue parser + finals stager"
```

---

### Task 7: Orchestration workflow + operator runbook + npm scripts

**Files:**
- Create: `.github/workflows/portfolio.yml`
- Rewrite: `portfolio/README.md` (replaces the Windows-PowerShell helper text)
- Delete: `portfolio/Gather-PortfolioMedia.ps1` (dead — Windows-only)
- Modify: `package.json` (add convenience scripts)

**Interfaces:**
- Consumes: all CLIs from Tasks 2–6 and the secrets `GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN`, `GEMINI_API_KEY`, `DRIVE_FOLDER_ID` (GitHub Actions secrets/vars, sourced from Proton Pass — sub-project #2).
- Produces: a `workflow_dispatch` "gather" run (pull → sort → build sheet → deploy under the existing FTPS flow to a protected path) and an `issues` "stage" run (on a `portfolio-keepers` issue → parse → stage finals as an artifact).

- [ ] **Step 1: Add npm convenience scripts**

Add to `package.json` `scripts` (keep alphabetical neighborhood with existing `portfolio`-free entries):

```json
"portfolio:test": "node --test test/portfolio.test.mjs",
"portfolio:normalize": "node tools/portfolio/normalize-takeout.mjs",
"portfolio:sort": "node tools/portfolio/sort-vision.mjs",
"portfolio:sheet": "node tools/portfolio/build-sheet.mjs"
```

- [ ] **Step 2: Write the gather + stage workflow**

```yaml
# .github/workflows/portfolio.yml
name: portfolio-gather
on:
  workflow_dispatch:
    inputs:
      folder_id:
        description: Drive folder id (overrides DRIVE_FOLDER_ID secret)
        required: false
  issues:
    types: [opened]

jobs:
  gather:
    if: github.event_name == 'workflow_dispatch'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - name: Pull Drive folder
        env:
          GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
          GOOGLE_CLIENT_SECRET: ${{ secrets.GOOGLE_CLIENT_SECRET }}
          GOOGLE_REFRESH_TOKEN: ${{ secrets.GOOGLE_REFRESH_TOKEN }}
        run: node tools/portfolio/pull-drive.mjs "${{ github.event.inputs.folder_id || secrets.DRIVE_FOLDER_ID }}" work/raw > work/files.json
      - name: Vision sort
        env: { GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }} }
        run: node tools/portfolio/sort-vision.mjs work/files.json work/manifest.json
      - name: Build contact sheet
        run: |
          node tools/portfolio/build-sheet.mjs work/manifest.json work/sheet
          mkdir -p work/sheet/media && cp work/raw/* work/sheet/media/ || true
      - name: Upload sheet artifact
        uses: actions/upload-artifact@v4
        with: { name: contact-sheet, path: work/sheet }
      # Deploy to a Basic-Auth-protected path is documented in portfolio/README.md
      # (reuse the existing FTPS deploy action; server-dir = Test/picks).

  stage:
    if: github.event_name == 'issues' && github.event.issue.title == 'portfolio-keepers'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      # NOTE: the manifest from the gather run must be available. v1: gather job
      # also commits work/manifest.json as an artifact the operator attaches, OR
      # store it in the repo under work/. See README "Keeper hand-back".
      - name: Stage finals
        env: { KEEPERS_BODY: ${{ github.event.issue.body }} }
        run: node tools/portfolio/stage-finals.mjs work/manifest.json out/finals
      - name: Upload finals
        uses: actions/upload-artifact@v4
        with: { name: portfolio-finals, path: out/finals }
```

- [ ] **Step 3: Rewrite `portfolio/README.md` as the phone-only runbook**

Replace the entire file with phone-only operator steps. It MUST contain, each as its own short fenced block where a value is pasted (mobile-ergonomics):

1. **One-time setup** — (a) generate a Google OAuth refresh token from the phone browser via the OAuth 2.0 Playground (`drive.readonly` scope; note the 7-day Testing-mode expiry); (b) create a free Gemini API key in Google AI Studio; (c) store all keys in Proton Pass and paste each into a GitHub Actions secret: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, `GEMINI_API_KEY`, `DRIVE_FOLDER_ID`.
2. **Coarse cull (Drive)** — in the Drive app, select by folder + date, move candidates into ONE folder; copy its folder id.
3. **Coarse cull (Photos)** — in the Gemini app, use `@Google Photos` with descriptive prompts to surface batches; tap them into a new Photos album; **R1 test:** first verify Gemini actually finds your photos (5-min check) before trusting it. Then Google Takeout that album → upload the unzipped media into the same Drive folder.
4. **Run** — trigger the `portfolio-gather` workflow (GitHub mobile → Actions → Run workflow).
5. **Triage** — open the deployed contact-sheet URL, tap keepers, press **Save keepers** (opens a pre-filled GitHub issue → Submit).
6. **Finals** — the `stage` job produces the `portfolio-finals` artifact for sub-project #3.
7. **Privacy note** — Gemini free-tier inputs may be used by Google for training; fine for portfolio art, documented here.

- [ ] **Step 4: Remove the dead Windows helper**

```bash
git rm portfolio/Gather-PortfolioMedia.ps1
```

- [ ] **Step 5: Verify gates + commit**

```bash
node --test test/portfolio.test.mjs   # all portfolio tests pass
node tools/check-config.mjs           # settings/CLAUDE.md gates still green
git add .github/workflows/portfolio.yml portfolio/README.md package.json
git commit -m "feat(portfolio): gather/stage workflow + phone-only runbook; drop PS1 helper"
```

---

## Self-Review

**Spec coverage:**
- Funnel stages 1–3 → Tasks 2–6 + workflow (Task 7). ✓
- Drive-OAuth pull → Task 3. ✓
- Gemini-free vision sort in CI → Task 4. ✓
- Photos via Gemini `@Google Photos` + Takeout → runbook (Task 7 Step 3) + normalizer (Task 2). ✓
- Phone↔CI split, contact sheet, keeper hand-back (Q1) → Tasks 5–7. ✓
- Replaces dead PS1 helper → Task 7 Step 4. ✓
- Out-of-scope items (touch-up/depth/page/secrets-manager) → not built. ✓
- Open risks R1–R4 → R1 is a runbook test step; R2 (token expiry) documented in runbook; R3 (Takeout size) → album-scope in runbook; R4 (video) → v1 scores a video as `score:0`/tagged (Task 4 adapter), full video understanding deferred. ✓

**Known v1 limitation (flagged, not a placeholder):** the `stage` job needs the gather run's `manifest.json`. v1 keeps it simple by having the operator re-run with the manifest committed/available under `work/`; a cleaner persistence (commit manifest to a branch, or fetch the gather artifact) is a fast-follow noted in the README. This is an explicit, bounded decision — not a TODO.

**Placeholder scan:** no "TBD"/"add error handling"/"similar to Task N" — every code step has complete code. ✓

**Type consistency:** `callModel({path,type,name})→{score,tags,reason}`, `driveClient.{list,download}`, manifest item fields (`id,path,type,score,tags,reason,dupGroup,bestOfGroup,takenAt`), and `parseKeepers→string[]` are used identically across Tasks 1–7. ✓
