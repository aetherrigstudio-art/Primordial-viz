#!/usr/bin/env node
// Marble (World Labs) World API — automated splat generation for the immersive app.
// Generates an explorable 3D world and downloads its Gaussian-splat (.spz). No deps (Node 18+ fetch).
//
// Auth: WLT_API_KEY env var, or a key file at ~/.config/worldlabs/key.
// Usage:
//   node gen-world.mjs --prompt "an Appalachian rainforest glade ..." --out ../public/assets/rainforest.spz
//   node gen-world.mjs --image https://host/start.jpg --out ../public/assets/rainforest.spz --res 500k
// Flags: --model marble-1.1-plus|marble-1.1  --res 100k|500k|full_res  --name <label>

import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

// Auto-load a .env (Node 20.12+: process.loadEnvFile) from common locations so the CLI just works.
const here = dirname(fileURLToPath(import.meta.url))
const ENV_CANDIDATES = [
  '/sdcard/Documents/Primordial/keys.env', // phone-editable (visible in the Files app)
  join(here, '..', '.env'),                // immersive/.env (in-repo, gitignored)
  join(process.cwd(), '.env'),
  join(here, '.env'),
]
for (const p of ENV_CANDIDATES) {
  if (existsSync(p)) { try { process.loadEnvFile(p) } catch {} break }
}

const API = 'https://api.worldlabs.ai/marble/v1'

function getKey() {
  if (process.env.WLT_API_KEY) return process.env.WLT_API_KEY.trim()
  try { return readFileSync(join(homedir(), '.config/worldlabs/key'), 'utf8').trim() } catch {}
  console.error('No API key. Set WLT_API_KEY or write it to ~/.config/worldlabs/key'); process.exit(1)
}
function arg(name, def) { const i = process.argv.indexOf('--' + name); return i > -1 ? process.argv[i + 1] : def }

const KEY = getKey()
const H = { 'Content-Type': 'application/json', 'WLT-Api-Key': KEY }
const out = arg('out', 'world.spz')
const model = arg('model', 'marble-1.1-plus')
const res = arg('res', '500k')
const prompt = arg('prompt')
const image = arg('image')
const imageFile = arg('image-file')
const videoFile = arg('video-file')
const imagesArg = arg('images') // comma-separated LOCAL image paths -> multi-image (up to 8, same WxH)

// Upload a LOCAL file (image or video), return its media_asset_id. prepare_upload + PUT are FREE.
async function uploadLocal(path, kind) {
  const ext = path.split('.').pop().toLowerCase()
  console.log(`[0] uploading ${kind}:`, path)
  const pu = await fetch(`${API}/media-assets:prepare_upload`, {
    method: 'POST', headers: H,
    body: JSON.stringify({ file_name: path.split('/').pop(), kind, extension: ext }),
  })
  if (!pu.ok) { console.error('prepare_upload failed', pu.status, await pu.text()); process.exit(1) }
  const { media_asset, upload_info } = await pu.json()
  const id = media_asset.media_asset_id ?? media_asset.id
  const up = await fetch(upload_info.upload_url, {
    method: upload_info.upload_method || 'PUT',
    headers: upload_info.required_headers || {},
    body: readFileSync(path),
  })
  if (!up.ok) { console.error('upload PUT failed', up.status, await up.text()); process.exit(1) }
  console.log('    uploaded, asset id:', id)
  return id
}

let world_prompt
if (imagesArg) {
  // Multi-image: upload each, spread evenly by azimuth so Marble lays out a fuller world.
  const paths = imagesArg.split(',').map((s) => s.trim()).filter(Boolean)
  const items = []
  for (let i = 0; i < paths.length; i++) {
    const id = await uploadLocal(paths[i], 'image')
    items.push({ azimuth: Math.round((i * 360) / paths.length), content: { source: 'media_asset', media_asset_id: id } })
  }
  world_prompt = { type: 'multi-image', multi_image_prompt: items }
} else if (videoFile) {
  const id = await uploadLocal(videoFile, 'video')
  world_prompt = { type: 'video', video_prompt: { source: 'media_asset', media_asset_id: id } }
} else if (imageFile) {
  const id = await uploadLocal(imageFile, 'image')
  world_prompt = { type: 'image', image_prompt: { source: 'media_asset', media_asset_id: id } }
} else if (image) {
  world_prompt = { type: 'image', image_prompt: { source: 'uri', uri: image } }
} else if (prompt) {
  world_prompt = { type: 'text', text_prompt: prompt }
} else { console.error('Provide --video-file, --image-file, --image, or --prompt'); process.exit(1) }

console.log(`[1] generate (${model}, ${res}) ...`)
let r = await fetch(`${API}/worlds:generate`, {
  method: 'POST', headers: H,
  body: JSON.stringify({ display_name: arg('name', 'rainforest'), model, world_prompt }),
})
if (!r.ok) { console.error('generate failed', r.status, await r.text()); process.exit(1) }
let op = await r.json()
const opId = op.name?.split('/').pop() || op.operation_id || op.id
if (!opId) { console.error('no operation id in response:', JSON.stringify(op).slice(0, 400)); process.exit(1) }
console.log('    operation:', opId)

console.log('[2] poll (~5 min, checking every 20s) ...')
let done = op
while (!done.done) {
  await new Promise((s) => setTimeout(s, 20000))
  const p = await fetch(`${API}/operations/${opId}`, { headers: H })
  if (!p.ok) { console.error('\npoll failed', p.status, await p.text()); process.exit(1) }
  done = await p.json()
  process.stdout.write('.')
}
console.log('\n    done')
if (done.error) { console.error('generation error:', JSON.stringify(done.error)); process.exit(1) }

// Locate the .spz asset at the requested resolution (defensive: print assets, then match).
const assets = done.response?.assets ?? done.assets ?? done.response ?? {}
console.log('[3] assets:', JSON.stringify(assets).slice(0, 700))
const urls = []
JSON.stringify(assets, (k, v) => { if (typeof v === 'string' && v.includes('.spz')) urls.push(v); return v })
const url = urls.find((u) => u.includes(res)) || urls[0]
if (!url) { console.error('no .spz url in assets — inspect the printed assets above and adjust the matcher'); process.exit(1) }

console.log('[4] download', url.slice(0, 90), '...')
const dl = await fetch(url)
if (!dl.ok) { console.error('download failed', dl.status); process.exit(1) }
const buf = Buffer.from(await dl.arrayBuffer())
writeFileSync(out, buf)
console.log(`saved ${(buf.length / 1e6).toFixed(1)} MB -> ${out}`)
