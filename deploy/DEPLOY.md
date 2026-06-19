# Deploying primordial to Namecheap Stellar Plus (cPanel)

This app is static and has no build step. Deploying = copying the right files
into `public_html` and confirming HTTPS works (the mic depends on it). Host
facts live in `.claude/rules/deploy.md`; the quick manual checklist is the
`deploy-cpanel` skill.

## What gets uploaded

Into the **`public_html`** root:

- `index.html`
- `src/` — the whole app (js incl. `shaders/*.js`, `looks/*.json`, `ui/`, …)
- `assets/` — fonts, lookup textures, icons, favicon, og-image
- `deploy/.htaccess` → uploaded **as `.htaccess`** at the `public_html` root

**Do not upload:** `node_modules/`, `research/`, `.claude/`, `docs/`,
`task_plan.md` / `findings.md` / `progress.md`, or any `*.local.*` file. Keeping
the tree lean also protects the **~300k inode** cap.

## Option A — cPanel File Manager (simplest)

1. Log into cPanel → **File Manager** → open `public_html`.
2. Zip `index.html` + `src/` + `assets/` locally, **Upload** the zip, then
   **Extract** it in `public_html`.
3. Enable **Settings → Show Hidden Files (dotfiles)**, then upload
   `deploy/.htaccess` (it must land as `.htaccess` at the root).
4. Verify the directory structure: `public_html/index.html`,
   `public_html/src/...`, `public_html/.htaccess`.

## Option B — cPanel Git Version Control

1. cPanel → **Git Version Control** → create or clone the repo on the server.
2. Add a `.cpanel.yml` that copies **only** the shippable tree
   (`index.html`, `src/`, `assets/`, and the `.htaccess`) into `public_html` —
   keep `.claude/`, `research/`, `node_modules/` out.
3. Pull + Deploy from the cPanel Git UI (or via the jailed SSH shell).

## HTTPS / SSL

- Stellar Plus auto-installs a **free 1-year Sectigo PositiveSSL** day one. That
  is enough for `getUserMedia` (the mic).
- It is **NOT** auto-renewing. **Re-issue annually** in cPanel → SSL/TLS Status,
  or set up **`acme.sh` over SSH** for hands-off renewal. Add a calendar
  reminder ~11 months out. **If SSL lapses, the mic stops working** and the
  instrument is dead until HTTPS is restored.

## Post-deploy verification

1. Visit `http://primordial.video` — confirm it **301-redirects to https://**.
2. Open the **HTTPS** URL on a phone, click **Start**, grant mic permission.
3. Play audio in the room — confirm the visual reacts.
4. Open DevTools → **Network**:
   - `js` / `css` carry a long `Cache-Control` (immutable); `index.html` is
     `no-cache`. Shaders ship inside `.js` modules, so they cache like other JS —
     there are no `.glsl` files (the `.glsl` MIME line in `.htaccess` is harmless
     but currently unused).
5. If you change a cached `js`/`css`/`glsl` file later, **cache-bust the
   filename** (or bump a query string) — the immutable cache will otherwise
   serve the old one.

## Troubleshooting

- **Mic prompt never appears** → not on HTTPS, or SSL expired. Check the
  redirect and SSL status.
- **A shader change doesn't show up** → shaders are bundled in `src/shaders/*.js`
  and cached immutably like other JS; cache-bust the filename (or a query
  string) to force the new version.
- **Old code keeps loading** → the immutable cache; cache-bust the filename.
