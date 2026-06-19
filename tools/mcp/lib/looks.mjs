// Looks/preset management: list, validate, and create/update the params-only JSON
// "looks" in src/looks/, keeping src/looks/registry.js's generated INLINE_LOOKS
// mirror + LOOK_FILES list in sync (so test/smoke.mjs's drift check stays green).
// The JSON files are the single source of truth; registry.js's two arrays are
// regenerated from them between @generated markers. Validation reuses the param
// schema in src/params/schema.js — no rules duplicated.
//
//   node tools/mcp/lib/looks.mjs list
//   node tools/mcp/lib/looks.mjs sync                 # regenerate registry.js arrays
//   node tools/mcp/lib/looks.mjs validate <file.json>

import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PARAM_SCHEMA, DEFAULTS, coerceValue } from '../../../src/params/schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..', '..', '..');
const LOOKS_DIR = join(root, 'src', 'looks');
const REGISTRY = join(LOOKS_DIR, 'registry.js');

const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

function lookFilenames() {
  return readdirSync(LOOKS_DIR).filter((f) => f.endsWith('.json')).sort();
}

export function listLooks() {
  return lookFilenames().map((f) => JSON.parse(readFileSync(join(LOOKS_DIR, f), 'utf8')));
}

export function getLook(id) {
  return listLooks().find((l) => l.id === id) || null;
}

// Strict validation: fill missing params from defaults, but report any unknown
// or out-of-range value. Returns { ok, errors:[], look }.
export function buildLook(input) {
  const errors = [];
  const id = String(input.id || '');
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) errors.push(`id '${id}' must be kebab-case (a-z, 0-9, hyphens)`);
  if (!input.name) errors.push('name is required');
  if (!input.description) errors.push('description is required');
  if (input && 'shader' in input) errors.push("looks are params-only — remove the 'shader' field");

  const params = { ...DEFAULTS };
  for (const [k, v] of Object.entries(input.params || {})) {
    const entry = PARAM_SCHEMA.find((e) => e.key === k);
    if (!entry) { errors.push(`unknown param '${k}'`); continue; }
    const coerced = coerceValue(entry, v);
    if (!same(coerced, v)) {
      errors.push(
        entry.type === 'color'
          ? `param '${k}'=${JSON.stringify(v)} must be 3 floats in [0,1]`
          : `param '${k}'=${JSON.stringify(v)} out of range [${entry.min}, ${entry.max}]`,
      );
    }
    params[k] = coerced;
  }
  return {
    ok: errors.length === 0,
    errors,
    look: { id, name: String(input.name || ''), description: String(input.description || ''), params },
  };
}

// Create or update a look. mode = 'create' | 'update'.
export function saveLook(input, mode) {
  const { ok, errors, look } = buildLook(input);
  const exists = !!getLook(look.id);
  if (mode === 'create' && exists) errors.push(`look '${look.id}' already exists — use update_look`);
  if (mode === 'update' && !exists) errors.push(`look '${look.id}' not found — use create_look`);
  if (errors.length) return { ok: false, errors };

  writeFileSync(join(LOOKS_DIR, `${look.id}.json`), JSON.stringify(look, null, 2) + '\n');
  syncRegistry();
  return { ok: true, look, path: `src/looks/${look.id}.json` };
}

function replaceRegion(text, name, body) {
  const re = new RegExp(`(// @generated-start ${name}[^\\n]*\\n)[\\s\\S]*?(// @generated-end ${name})`);
  if (!re.test(text)) throw new Error(`@generated marker '${name}' not found in registry.js`);
  return text.replace(re, `$1${body}\n$2`);
}

// Regenerate registry.js's INLINE_LOOKS + LOOK_FILES from the JSON files,
// preserving the existing order and appending any new looks.
export function syncRegistry() {
  let text = readFileSync(REGISTRY, 'utf8');
  const prevOrder = [...text.matchAll(/"id":\s*"([^"]+)"|id:\s*'([^']+)'/g)].map((m) => m[1] || m[2]);
  const byId = new Map(listLooks().map((l) => [l.id, l]));
  const orderedIds = [
    ...prevOrder.filter((id) => byId.has(id)),
    ...[...byId.keys()].filter((id) => !prevOrder.includes(id)).sort(),
  ];
  const looks = orderedIds.map((id) => byId.get(id));
  const files = orderedIds.map((id) => `${id}.json`);

  text = replaceRegion(text, 'looks:inline', `const INLINE_LOOKS = ${JSON.stringify(looks, null, 2)};`);
  text = replaceRegion(
    text,
    'looks:files',
    `const LOOK_FILES = ${JSON.stringify(files)}.map(\n  (f) => new URL('./' + f, import.meta.url),\n);`,
  );
  writeFileSync(REGISTRY, text);
  return { ok: true, order: orderedIds };
}

// --- CLI -------------------------------------------------------------------
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [cmd, arg] = process.argv.slice(2);
  if (cmd === 'list') {
    for (const l of listLooks()) console.log(`${l.id}\t${l.name}`);
  } else if (cmd === 'sync') {
    const r = syncRegistry();
    console.log('synced registry.js order:', r.order.join(', '));
  } else if (cmd === 'validate' && arg) {
    const { ok, errors } = buildLook(JSON.parse(readFileSync(arg, 'utf8')));
    console.log(ok ? 'valid' : 'INVALID:\n  ' + errors.join('\n  '));
    process.exit(ok ? 0 : 1);
  } else {
    console.error('usage: looks.mjs list | sync | validate <file.json>');
    process.exit(1);
  }
}
