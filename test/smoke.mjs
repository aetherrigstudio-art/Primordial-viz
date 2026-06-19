// test/smoke.mjs — laptop-free logic checks (no browser, no deps).
//
//   node test/smoke.mjs
//
// Asserts the param/look/store layer is internally consistent and import-safe:
//   - PARAM_SCHEMA / PERF_SCHEMA ranges are self-consistent
//   - coerceValue clamps and rejects bad input
//   - ParamStore round-trips through (faked) localStorage and is defensive
//   - every look JSON has the full param set, in range, with no stray `shader`
//   - registry's INLINE_LOOKS mirror matches the committed JSON byte-for-value
// Exit 0 = all green. Run by CI (.github/workflows/verify.yml) and the
// check-on-edit hook.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

let pass = 0;
let fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log('  ok   ' + name);
    pass++;
  } catch (e) {
    console.error('FAIL   ' + name + '\n       ' + (e && e.message ? e.message : e));
    fail++;
  }
}
async function atest(name, fn) {
  try {
    await fn();
    console.log('  ok   ' + name);
    pass++;
  } catch (e) {
    console.error('FAIL   ' + name + '\n       ' + (e && e.message ? e.message : e));
    fail++;
  }
}

// A minimal localStorage so store.js can be imported and exercised under node.
function fakeStorage() {
  const m = new Map();
  return {
    getItem: (k) => (m.has(k) ? m.get(k) : null),
    setItem: (k, v) => m.set(k, String(v)),
    removeItem: (k) => m.delete(k),
    clear: () => m.clear(),
    _map: m,
  };
}
globalThis.localStorage = fakeStorage();

const schema = await import('../src/params/schema.js');
const { PARAM_SCHEMA, PERF_SCHEMA, coerceValue, coerceParams, DEFAULTS, PERF_DEFAULTS } = schema;

// ---------------------------------------------------------------------------
// Schema self-consistency
// ---------------------------------------------------------------------------
for (const [label, S] of [['PARAM_SCHEMA', PARAM_SCHEMA], ['PERF_SCHEMA', PERF_SCHEMA]]) {
  test(`${label}: entries are well-formed`, () => {
    assert.ok(Array.isArray(S) && S.length > 0, 'schema is a non-empty array');
    for (const e of S) {
      assert.ok(e.key && e.label && e.type, `entry has key/label/type: ${JSON.stringify(e)}`);
      if (e.type === 'range') {
        assert.ok(Number.isFinite(e.min) && Number.isFinite(e.max), `${e.key} numeric min/max`);
        assert.ok(e.min < e.max, `${e.key} min < max`);
        assert.ok(e.step > 0, `${e.key} step > 0`);
        assert.ok(e.default >= e.min && e.default <= e.max, `${e.key} default in [min,max]`);
      } else if (e.type === 'color') {
        assert.ok(Array.isArray(e.default) && e.default.length === 3, `${e.key} color is [r,g,b]`);
        for (const c of e.default) assert.ok(c >= 0 && c <= 1, `${e.key} color in [0,1]`);
      } else {
        throw new Error(`${e.key} unknown type ${e.type}`);
      }
    }
  });
}

test('DEFAULTS / PERF_DEFAULTS cover every schema key', () => {
  for (const e of PARAM_SCHEMA) assert.ok(e.key in DEFAULTS, `DEFAULTS has ${e.key}`);
  for (const e of PERF_SCHEMA) assert.ok(e.key in PERF_DEFAULTS, `PERF_DEFAULTS has ${e.key}`);
});

// ---------------------------------------------------------------------------
// coerceValue / coerceParams
// ---------------------------------------------------------------------------
test('coerceValue clamps ranges and sanitizes colors', () => {
  const range = { key: 'x', type: 'range', min: 0, max: 1, step: 0.1, default: 0.5 };
  assert.equal(coerceValue(range, 9), 1, 'over-max clamps to max');
  assert.equal(coerceValue(range, -9), 0, 'under-min clamps to min');
  assert.equal(coerceValue(range, 'nope'), 0.5, 'non-number falls to default');
  const color = { key: 'c', type: 'color', default: [0, 0, 0] };
  assert.deepEqual(coerceValue(color, [2, -1, 0.5]), [1, 0, 0.5], 'color channels clamp to [0,1]');
  assert.deepEqual(coerceValue(color, 'bad'), [0, 0, 0], 'bad color falls to default');
});

test('coerceParams fills missing keys from schema', () => {
  const out = coerceParams(PARAM_SCHEMA, { blobCount: 999 });
  for (const e of PARAM_SCHEMA) assert.ok(e.key in out, `coerced has ${e.key}`);
  assert.equal(out.blobCount, PARAM_SCHEMA.find((p) => p.key === 'blobCount').max, 'clamped to max');
});

// ---------------------------------------------------------------------------
// ParamStore — versioned, defensive persistence
// ---------------------------------------------------------------------------
const { ParamStore } = await import('../src/params/store.js');

test('ParamStore round-trips through localStorage', () => {
  globalThis.localStorage.clear();
  const a = new ParamStore();
  a.setParam('blobCount', 3);
  a.setPerf('steps', a.perf.steps); // exercise save
  a.applyLook('slime-green', { ...DEFAULTS, glow: 2.5 });
  const b = new ParamStore();
  assert.equal(b.lookId, 'slime-green', 'lookId persisted');
  assert.equal(b.params.glow, 2.5, 'param persisted');
});

test('ParamStore ignores a wrong-version blob (no corruption)', () => {
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('primordialV1', JSON.stringify({ version: 999, lookId: 'x', params: {}, perf: {} }));
  const s = new ParamStore();
  assert.equal(s.lookId, null, 'wrong version → defaults');
  assert.deepEqual(s.params, { ...DEFAULTS }, 'wrong version → default params');
});

test('ParamStore survives corrupt JSON', () => {
  globalThis.localStorage.clear();
  globalThis.localStorage.setItem('primordialV1', '{not json');
  const s = new ParamStore();
  assert.equal(s.lookId, null, 'corrupt → defaults');
});

test('ParamStore.reset clears persisted state', () => {
  globalThis.localStorage.clear();
  const s = new ParamStore();
  s.applyLook('hud-amber', DEFAULTS);
  s.reset();
  assert.equal(s.lookId, null, 'reset clears lookId');
  assert.equal(globalThis.localStorage.getItem('primordialV1'), null, 'reset removes key');
});

// ---------------------------------------------------------------------------
// Look JSON files + registry INLINE_LOOKS mirror
// ---------------------------------------------------------------------------
const LOOK_FILES = ['slime-green.json', 'hud-amber.json'];

function validateLook(look, sourceLabel) {
  for (const f of ['id', 'name', 'description', 'params']) {
    assert.ok(f in look, `${sourceLabel}: has "${f}"`);
  }
  assert.ok(!('shader' in look), `${sourceLabel}: must NOT have a "shader" field (params-only looks)`);
  for (const e of PARAM_SCHEMA) {
    assert.ok(e.key in look.params, `${sourceLabel}: params has "${e.key}"`);
    const coerced = coerceValue(e, look.params[e.key]);
    assert.deepEqual(coerced, look.params[e.key], `${sourceLabel}: "${e.key}" already in valid range`);
  }
}

const jsonLooks = {};
for (const f of LOOK_FILES) {
  test(`look file ${f} is valid`, () => {
    const look = JSON.parse(readFileSync(join(root, 'src/looks', f), 'utf8'));
    jsonLooks[look.id] = look;
    validateLook(look, f);
  });
}

await atest('registry loadLooks() returns inline set matching the JSON files', async () => {
  // Under node, fetch() of a file: URL fails, so loadLooks() returns INLINE_LOOKS.
  const { loadLooks, findLook } = await import('../src/looks/registry.js');
  const looks = await loadLooks();
  assert.ok(Array.isArray(looks) && looks.length >= LOOK_FILES.length, 'looks array populated');
  for (const look of looks) validateLook(look, `inline:${look.id}`);
  // Drift check: every JSON file's look must equal the inline mirror.
  for (const id of Object.keys(jsonLooks)) {
    const inline = findLook(looks, id);
    assert.ok(inline, `inline mirror has "${id}"`);
    assert.deepEqual(inline, jsonLooks[id], `inline "${id}" matches src/looks JSON`);
  }
});

// ---------------------------------------------------------------------------
console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
