// Ambient "autonomous vibe" playlist manifest for the immersive app.
//
// Each entry is { id, title, kind, src?, license, attribution, mood? }:
//   - kind 'procedural' : a fully-synthesized source built by ambientGenerator.js (no asset on
//     disk). license is 'authored' (we wrote it; commercial-safe — .claude/rules/immersive.md).
//     `mood` (dawn|forest|dusk) seeds the generator.
//   - kind 'file' : a real audio file served from /assets/audio/<id>. Added LATER by the operator
//     once tracks are shortlisted + licensed; see the commented slot below. Do NOT invent track URLs.
//
// The hook (useAmbientPlaylist) fades in the CURRENT entry when there's no live music, crossfades /
// auto-advances between entries, and fades out when real audio returns.

export const PLAYLIST = [
  {
    id: 'appalachian-dawn',
    title: 'Appalachian Dawn (procedural)',
    kind: 'procedural',
    license: 'authored',
    attribution: 'Primordial Studio — synthesized Web Audio (no samples)',
    mood: 'dawn',
  },
  {
    id: 'appalachian-forest',
    title: 'Appalachian Forest (procedural)',
    kind: 'procedural',
    license: 'authored',
    attribution: 'Primordial Studio — synthesized Web Audio (no samples)',
    mood: 'forest',
  },
  {
    id: 'appalachian-dusk',
    title: 'Appalachian Dusk (procedural)',
    kind: 'procedural',
    license: 'authored',
    attribution: 'Primordial Studio — synthesized Web Audio (no samples)',
    mood: 'dusk',
  },

  // ---- file-backed tracks (added later — DO NOT invent URLs) -----------------------------------
  // When the operator shortlists CC0 / CC-BY Appalachian folk / old-time-ambient or temperate-forest
  // field recordings (Track 1.9 in progress.md), drop the compressed file in
  // immersive/public/assets/audio/<id> and add an entry like:
  //
  // {
  //   id: 'old-time-ambient-01.ogg',          // the served filename under /assets/audio/
  //   title: 'Old-Time Ambient (field recording)',
  //   kind: 'file',
  //   src: '/assets/audio/old-time-ambient-01.ogg',
  //   license: 'CC0',                          // or 'CC-BY-4.0'
  //   attribution: 'Author Name — source URL',  // required for CC-BY
  // },
  //
  // Keep it commercial-safe: ONLY CC0 or CC-BY (with attribution). Never bundle copyrighted or
  // NC-licensed audio.
];

export function getEntry(id) {
  return PLAYLIST.find((e) => e.id === id) || null;
}
