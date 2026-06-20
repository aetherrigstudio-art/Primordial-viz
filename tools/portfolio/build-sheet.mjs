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
