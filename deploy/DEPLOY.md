# Deploying primordial to Namecheap Stellar Plus (cPanel)

This app is static and has no build step. Deploying = copying the right files
into `public_html` and confirming HTTPS works (the mic depends on it). Host
facts live in `.claude/rules/deploy.md`; the quick manual checklist is the
`deploy-cpanel` skill.

## What gets uploaded

Into the **`public_html`** root (this is exactly what `.cpanel.yml` copies):

- `index.html` — the entry point (raw WebGL2 app → `src/main.js`)
- `three.html` — alternate three.js variant (→ `src/three/main.js`)
- `src/` — the whole app (js incl. `shaders/*.js`, `looks/*.json`, `ui/`, `three/`, …)
- `vendor/` — vendored `three.module.js` (resolved by the `three.html` import map)
- `deploy/.htaccess` → copied **as `.htaccess`** at the `public_html` root

**Do not upload:** `node_modules/`, `dist/` (the Vite/Tauri **desktop** build —
not the web host), `src-tauri/`, `research/`, `.claude/`, `docs/`,
`task_plan.md` / `findings.md` / `progress.md`, or any `*.local.*` file. Keeping
the tree lean also protects the **~300k inode** cap.

> **No build step for the web.** `vite.config.js` and `dist/` exist only for the
> Tauri **desktop** bundle; the live site is the raw files above. Don't run
> `vite build` (or upload `dist/`) for hosting.

## Option A — cPanel File Manager (simplest)

1. Log into cPanel → **File Manager** → open `public_html`.
2. Zip `index.html` + `src/` + `assets/` locally, **Upload** the zip, then
   **Extract** it in `public_html`.
3. Enable **Settings → Show Hidden Files (dotfiles)**, then upload
   `deploy/.htaccess` (it must land as `.htaccess` at the root).
4. Verify the directory structure: `public_html/index.html`,
   `public_html/src/...`, `public_html/.htaccess`.

## Option B — cPanel Git Version Control (deploy from GitHub)

**Recommended when working from a phone:** everything happens in the cPanel +
GitHub web UIs — no FTP client. `.cpanel.yml` already lives at the repo root and
copies the shippable tree above, so there's nothing to author.

**1. Connect GitHub → cPanel (one-time, via an SSH deploy key).**
The repo is private, so the server needs read access:
- cPanel → **SSH Access → Manage SSH Keys** → *Generate a New Key* (or open an
  existing one) → view/copy the **public** key.
- GitHub → repo → **Settings → Deploy keys → Add deploy key** → paste the public
  key → leave **"Allow write access" unchecked** (read-only) → Save.

**2. Clone the repo onto the server.**
- cPanel → **Git Version Control → Create** → toggle **"Clone a Repository"** on.
- **Clone URL:** `git@github.com:aetherrigstudio-art/primordial-viz.git` — use the
  **SSH** form (`git@…`), not `https://`, so the deploy key is used.
- Pick a repository path (e.g. `repositories/primordial-viz`) → Create. cPanel
  clones the **default branch** (`main`).

**3. Deploy.**
- Git Version Control → **Manage** the repo → **Pull or Deploy** tab → *Update
  from Remote*, then **Deploy HEAD Commit**. That runs `.cpanel.yml` and copies
  the app into `public_html`.
- **Redeploy after each push:** repeat step 3. It is **not** automatic on push
  unless you later add a GitHub webhook + a cron that pulls.

> **Deploy from `main`.** cPanel clones the default branch, so merge feature
> branches (e.g. `claude/*`) into `main` before deploying — otherwise the live
> site won't include the unmerged work.

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
