# Starter Design System — research + plan (review before build)

**Status:** plan for operator review · **Date:** 2026-06-21 · No code built yet.
Backed by 4 deep-research agents (cited at the bottom). This defines a small, real
React component library — consumable by **Claude Design via `/design-sync`** — whose
signature is the **gyro + camera "quad-reprojection" botanical hero**.

## Why this exists
`/design-sync` needs a *real, buildable React component library* (not abstract tokens) so
your Claude Design agent designs with your **actual on-brand parts**, and every mock maps
1:1 onto shippable Next.js code. So the starter DS = **design tokens + ~6 primitives + a
Storybook + the botanical Hero**, built as a Vite library, pushed to Claude Design.

## 1. Design POV (frontend-design — a deliberate, anti-template direction)
**Signature (the one bold thing):** *"a pressed-flower archive that breathes"* — a
**dark, immersive dusk hero** (the gyro-parallax botanical scene) opening onto **light,
airy editorial pages**, everything under a constant fine film-grain haze, headlines that
slowly drift and *bloom* into view like specimens waking in a glasshouse at dusk.

Spend the boldness in the hero; keep the rest quiet. Two coordinated themes:

**Light base — "Pressed & Bone"** (content pages):
`--bone #F6F1E6` · `--pressed-fern #1F4F3A` · `--sage-veil #A9C2B2` · `--cocoa-ink #3A2F2A`
· `--dusty-rose #C97A6A` · `--brut-champagne #EBDAB0`

**Dark mode — "Glasshouse at Dusk"** (the hero / immersive moments):
`--ink-ivy #0B1F18` · `--conservatory #1E3F34` · `--verdigris #4C7A68` ·
`--champagne #E6D7B8` · `--petal #D9B8C4` · `--gilt #C9B06A`

**Type** (all Google Fonts / open-license): **Fraunces** display with the *Wonk + Soft*
axes on (the antidote to the default Playfair/Didone — organic, ink-trapped, almost
botanical) · **Hanken Grotesk** body (warm humanist, premium-not-clinical) · **DM Mono**
for dates/labels/captions (gallery-catalog cadence).

**Anti-default check (escaped):** NOT the AI cream `#F4F1EA` + Didone + terracotta;
instead warm bone against deep green, Fraunces-Wonk, and a **muted dusk blush/mauve** —
gold stays **champagne/old-gold, never brass**; blush stays **dusk, never candy-pink**.

> Note: this *extends* the existing v1 weddings `:root` (champagne/gold) — it doesn't fork
> it. The Claude Design agent's output (Drive handoff) and these tokens reconcile;
> newest design wins per the handoff protocol.

## 2. DS vocabulary (domain-modeling — the ubiquitous language)
- **Tokens:** `color` (the two themes above), `type` (display/body/mono + a modular scale),
  `space`, `radius` (minimal — botanical = soft, low radius), `motion` (drift 12–30s eased;
  bloom-reveal 600–900ms), `texture` (grain density). Runtime layer = **CSS custom
  properties in `:root`** (`tokens.css`); authoring optional DTCG JSON only if a 2nd consumer appears.
- **Primitives (~6, practical names the design agent + engineers use):** `Button`, `Text`
  (heading/body via Fraunces/Hanken), `Section`, `Card`, `Field` (input), `Nav`.
- **Signature component:** `BotanicalHero` (the gyro/camera parallax scene shell).

## 3. Tech architecture — anamorphic "quad reprojection" (off-axis) hero
The operator's reference is the **B2BK TouchDesigner *Quad Reprojection / Anamorphosis***
tutorial — i.e. **off-axis projection**: the screen becomes a **window into a real recessed
3D space**, with forced-perspective depth that shifts as the viewpoint moves. Confirmed
doable in three.js via a custom **off-axis / asymmetric-frustum projection** (the "fish-tank
VR" / head-coupled technique — `PerspectiveCamera.setViewOffset` or a custom projection
matrix), driven by the gyro.
- **The space:** a real 3D recessed chamber/box with **drapery hanging INSIDE it** (real cloth
  — `MeshPhysicalMaterial` sheen) + botanical elements; the phone is a window peering in.
- **The illusion:** gyro → virtual eye position → the off-axis frustum updates each frame, so
  the draped space reads as true depth behind the screen and shifts anamorphically as you tilt.
- **Lighter fallback tier** (low-end phones): degrade to layered-quad parallax + the Codrops
  depth-displacement shader (`uv + tilt·depth`) — the flat version of the same idea.
- **Camera tier (opt-in):** `getUserMedia` → `useVideoTexture` backdrop with a **baked/painted
  depth map** (research is firm: **do NOT run live neural depth on a phone** — too heavy;
  bake it, or reserve live depth for a desktop WebGPU "wow" tier).
- **Look:** silk drapery via `MeshPhysicalMaterial` **sheen**; instanced **alpha-cutout**
  flowers/leaves with height-anchored wind-sway; a restrained beauty pass
  (DOF → selective Bloom → GodRays → golden-hour **LUT** → low grain → subtle vignette);
  ACES *or* AgX tone mapping (A/B — ACES desaturates the blush).
- **Input/permission:** a `useGyro` hook owns iOS `requestPermission()` **from a tap**
  ("Enable motion" CTA, HTTPS); writes a smoothed vec to a ref consumed in `useFrame`
  (never React state per frame).
- **Fallbacks:** desktop/no-gyro → **pointer/scroll** parallax; declined camera → painted
  backdrop; reduced-motion → gentle auto-drift only.
- **Mobile budget** (matches our existing perf rules): DPR ≤ 1.5, **instancing**, **KTX2**
  textures, `PerformanceMonitor` → DPR regression, pause on `visibilitychange`, ≤1–2 heavy
  post effects.
- **In Next.js:** a `'use client'` component on a **standalone route** (per ADR-012; not
  under a client-router that would kill the GL context).

## 4. Packaging for `/design-sync`
- **Vite library-mode** React lib → ESM `dist/`, **per-component** output (`preserveModules`),
  externalized React, **`vite-plugin-dts`** for `.d.ts`. `exports` map; `"sideEffects":["**/*.css"]`.
- **Storybook 9** (`@storybook/react-vite`) — stories are the **preview source** the design
  agent reads (each `*.stories.tsx` = a named, real-prop instance).
- **Tokens** shipped as a `tokens.css` subpath export.
- **Next.js gotcha:** `'use client'` on the **leaf interactive** components (compiled into
  `dist/`), tokens CSS imported first.
- **Folder:** `ui/src/{tokens, Button, Text, Section, Card, Field, Nav, BotanicalHero}/` +
  `.storybook/` + `vite.config.ts`.

## 5. Build sequence (only after you approve this plan)
1. Tokens (`tokens.css` + typed `tokens.ts`) + the two themes.
2. The 6 primitives + a Storybook story each → **first `/design-sync`** (gives Claude Design
   real on-brand parts fast).
3. The `BotanicalHero` (heavier; its own milestone) → spike → add to the lib + Storybook.
4. Integrate into the Next.js studio site (ADR-012), hero on its own route.

## 6. Decisions for you
- **D1 — the dusk direction:** confirm the **dark immersive hero + light editorial body**
  system (vs staying all-light champagne). This is the one real brand call.
- **D2 — type:** Fraunces + Hanken Grotesk + DM Mono (or pick Pairing B "Cormorant +
  Spectral" / C "Amarante" from the research).
- **D3 — camera tier:** ship the live-camera backdrop in v1, or start gyro-only and add
  camera later?

## 7. Risks (from research)
iOS gyro needs a tap + HTTPS (silently dead otherwise); live video-texture + parallax can
jank on phones (cap resolution; no live neural depth); displacement smears at depth edges
(keep offsets subtle / author good depth maps); ACES vs AgX saturation (test live).

## Sources
Packaging: Vite library-mode, Storybook 9, W3C DTCG tokens, Next.js `use client`.
Gyro/camera: MDN DeviceOrientation, iOS `requestPermission`, Codrops fake-3D, parallax.js,
drei `useVideoTexture`/`DeviceOrientationControls`, transformers.js depth (desktop only).
Botanical: R3F scaling-performance, MeshPhysicalMaterial sheen, alpha-cutout grass shaders,
@react-three/postprocessing (Bloom/DOF/GodRays/Vignette), ACES/AgX tone mapping, KTX2.
Design language: Fraunces/Hanken/DM Mono, botanical palettes, Immersive Garden (Awwwards).
(Full URLs in the session research transcript.)
