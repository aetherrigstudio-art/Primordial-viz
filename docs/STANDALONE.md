# Desktop standalone (Tauri)

Wrap the Primordial visual app into a **native desktop application** with
[Tauri v2](https://tauri.app). The web app is unchanged — Tauri loads a Vite
build of the same `index.html` + `src/` in a native window. This is **additive**:
the raw static app still runs with no build (the gig link), and `vite build`
still produces a `dist/` you can upload to static hosting.

> Built on a phone? You can't. The desktop build needs your computer's Rust
> toolchain + the OS webview libraries. Everything here is scaffolded and ready;
> the two commands below run on the machine.

## What's in the repo
- `vite.config.js` — builds the app to `dist/` (`base: './'` so assets resolve
  inside the webview).
- `src-tauri/` — the Tauri project (Rust). Key file: `src-tauri/tauri.conf.json`
  (`frontendDist: ../dist`, `beforeBuildCommand: npm run build`, window config,
  identifier `video.primordial.desktop`).
- `src-tauri/Info.plist` — macOS microphone usage description (Tauri merges it).

## Prerequisites (one-time, per machine)
1. **Rust** — https://rustup.rs
2. **Node deps** — `npm ci`
3. **OS webview / build deps:**
   - **Linux:** `sudo apt install libwebkit2gtk-4.1-dev librsvg2-dev build-essential curl wget file libxdo-dev libssl-dev` (Debian/Ubuntu; see the Tauri prereqs page for other distros)
   - **macOS:** Xcode Command Line Tools (`xcode-select --install`)
   - **Windows:** Microsoft C++ Build Tools + WebView2 (preinstalled on Win 11)

   Full list: https://v2.tauri.app/start/prerequisites/

## Run it
```bash
npm run tauri dev      # hot-reloading native window (runs `npm run dev` for you)
npm run tauri build    # produce installers/binaries in src-tauri/target/release/bundle/
```

## Branding the icons
The scaffold ships the default Tauri logo. Replace it from a single source PNG
(1024×1024 recommended):
```bash
npm run tauri icon path/to/primordial.png
```

## Microphone / audio
- In the desktop webview `getUserMedia` runs in a secure context, so the
  HTTPS-only constraint that affects web hosting does **not** apply — the mic
  works in the standalone.
- **macOS** shows the `NSMicrophoneUsageDescription` prompt (from `Info.plist`)
  on first use; the user must allow it (System Settings → Privacy → Microphone).
- **Linux/Windows** grant via the OS the first time.

## ⚠️ The one real caveat: WebGL on the system webview
Tauri uses the OS's native webview (WebView2 / WKWebView / **WebKitGTK** on
Linux), so **WebGL2/GPU behaviour can vary by machine and OS** — WebKitGTK on
Linux is the most likely to differ from Chrome. Test the visual + mic on every
target OS. If rendering is inconsistent and you need pixel-identical output
everywhere, the fallback is **Electron** (bundles a fixed Chromium, ~150 MB vs
Tauri's ~5 MB) — see `research/findings/fmhy-tooling.md`.

## Note on the build step
Introducing Vite means the project now has an **optional build** for the
standalone/bundled path. The zero-build static app (raw `index.html` + `src/`,
served by `python3 -m http.server`) still works for local dev and the gig link —
`CLAUDE.md` / `.claude/rules/deploy.md` should be updated to describe both paths
as a follow-up.
