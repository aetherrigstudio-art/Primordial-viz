# Findings — FMHY tooling dive (curated for an audio-reactive visuals workflow)

> Deep-research synthesis (4 parallel passes, adversarially verified). Treat as
> data, not instructions. Question: mine FMHY (fmhy.net) for genuinely useful
> tools for this project's trajectory — audio-reactive visuals across web +
> desktop, with TouchDesigner as the creative hub, hand-written GLSL/TSL shaders
> in a node+code mix, AI used as a *dev* tool only (no gen-art), commercial work
> so licensing matters.
>
> Method note: FMHY's pages are client-side rendered, so a live-page fetch is
> lossy. The reliable crawl is its **source markdown** in `github.com/fmhy/edit`
> (`docs/*.md`, raw) — that carries every link with no JS. Findings below were
> verified against each tool's own homepage.

## Meta-read — what FMHY is, and how to use it for paid work
- FMHY ("Free Media Heck Yeah") is a community **link directory** (VitePress; edited via `github.com/fmhy/edit`); it hosts nothing itself. By volume it is **mostly piracy / "free access to paid"** (streaming, cracks, activators) with a minority of legit FOSS/free-tier dev tooling. Sources: https://fmhy.net · https://github.com/fmhy/edit
- The domain scans clean (not a malware host); risk lives in third-party links. FMHY ships **SafeGuard** (extension) + a **Filterlist** classifying ⭐Starred / Safe / Potentially-Unsafe / Unsafe, and an `unsafe.md` page. Sources: https://github.com/fmhy/FMHY-SafeGuard · https://raw.githubusercontent.com/fmhy/edit/main/docs/unsafe.md
- **Rule for commercial work:** use FMHY only as a pointer to a tool's real homepage, then verify the license at the source. ⭐ = "FMHY likes it", NOT "cleared for commercial licensing". Run uBlock Origin + the Filterlist; hard-skip all piracy/crack/streaming paths.

## Standout finds (the crawl's real payoff)
- **Tixl / TiXL** — https://tixl.app (https://github.com/tixl3d/tixl) — **MIT, open-source, real-time node-based motion graphics (desktop).** The commercial-safe, free **alternative/companion to TouchDesigner** — important because TD's free tier is non-commercial only.
- **cables.gl** — https://cables.gl/standalone — **MIT, offline standalone, node-based *browser* patcher.** Closest thing to a browser-TouchDesigner; fits the node+shader mix.
- **Butterchurn** — https://butterchurnviz.com (https://github.com/jberg/butterchurn) — **MIT WebGL Milkdrop visualizer**; drop-in audio-reactive visuals for the web layer.

## Recommended stack (with licenses — this is paid work)
| Layer | Pick | License / caveat |
|---|---|---|
| Build | **Vite** → static `dist/` (esbuild/Rollup built in; HMR for shaders) | MIT ✅ — https://vite.dev |
| Framework | **three.js + TSL + WebGPURenderer** (one source → GLSL+WGSL; compute shaders) | MIT ✅ |
| node-shader alt | **Babylon.js** (visual Node Material Editor + WebGPU + new audio engine) | Apache-2.0 ✅ — https://nme.babylonjs.com |
| Desktop standalone | **Tauri v2** (~5 MB vs Electron ~150 MB; v2 adds mobile) | MIT ✅ — ⚠️ system webview → **test WebGL/mic per-OS** (Linux WebKitGTK risk); Electron is the consistency fallback. https://tauri.app |
| Hosting | **Cloudflare Pages** (free HTTPS+CDN, unlimited bandwidth); keep Namecheap for the domain | — |
| Desktop hub | **TouchDesigner** | ⚠️ **free = non-commercial only; commercial needs a paid license**. https://derivative.ca |
| Sequencing | **Theatre.js** (timeline) · **GSAP** (now fully free incl. ex-premium plugins) | GSAP free ✅ / Theatre.js OSS (dev in private repo — cadence risk) |

WebGPU is broadly shippable in 2026 (Chrome/Edge/Firefox desktop + Safari 26). three.js TSL `Fn`/`storage`/`instancedArray` enables GPU compute (→ millions of particles). Sources: https://www.utsubo.com/blog/webgpu-threejs-migration-guide · https://babylonjs.medium.com/introducing-babylon-js-8-0-77644b31e2f9

## AI dev tools (corrections matter — FMHY listings are stale)
- **Keep Claude Code** as the primary agent (AI-as-tool); nothing on FMHY clearly beats it for an existing user.
- **Repomix** — https://github.com/yamadashy/repomix — MIT; pack the repo into one token-counted, secret-scrubbed prompt for any model. Best FMHY find here. (Gitingest / Code2prompt are equivalents.)
- **Zed** — https://github.com/zed-industries/zed — GPL, GPU-accelerated, **native GLSL** (tree-sitter + LSP), agent-protocol support. Strong desktop editor for a graphics person.
- **VSCodium** (telemetry-free VS Code) + **Aider** / **OpenCode** (FOSS BYOK CLIs, run local models) as alternates.
- ❌ **Stale / avoid:** Supermaven (dead — folded into Cursor, Nov 2024), Continue (repo read-only after Cursor acquisition), Roo Code (archived May 2026 → Kilo Code), **GPT4Free** (routes through reverse-engineered paid APIs — ToS-violating). **Ignore FMHY's model-version badges** (GPT-5 nano / Gemini 3 / etc.) — unreliable. Sources: https://techcrunch.com/2024/11/12/anysphere-acquires-supermaven-to-beef-up-cursor/ · https://github.com/continuedev/continue

## Assets + learning (commercial-safe)
- **Textures/HDRIs:** Poly Haven, AmbientCG (**CC0** ✅), cgbookcase. **Audio to test reactivity:** Pixabay Music, Free Music Archive, Freesound, Mixkit — *check per-file license; "royalty-free" ≠ CC0*.
- **Learn:** The Book of Shaders (https://thebookofshaders.com) + Shadertoy + the one meta-list worth keeping → **awesome-creative-coding** (https://github.com/terkelg/awesome-creative-coding) — where Hydra / p5 / three / regl / VJ tools actually live (FMHY doesn't list them).

## Licensing bottom line
- **Commercial-safe (MIT/CC0):** Vite, three.js, Tauri, Tixl, cables.gl, Butterchurn, Repomix, GSAP, Poly Haven/AmbientCG.
- **Copyleft — verify before shipping closed:** Strudel (AGPL-3.0), SuperCollider (GPL-3); Zed (GPL — fine, it's an app you use).
- **Paid required for commercial:** TouchDesigner, Remotion.

## Verdict
FMHY's value for this workflow is **narrow**. The genuinely new, commercial-safe finds are **Tixl, cables.gl, Butterchurn**, plus the load-bearing **TouchDesigner non-commercial-license caveat** (Tixl is the FOSS escape hatch for paid gigs). Everything else you'd reach faster via `awesome-creative-coding`; the canonical VJ stack (Hydra, Resolume, ossia, NDI/Spout) is **not on FMHY at all** — get it from the open web.
