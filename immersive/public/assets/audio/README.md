# immersive/public/assets/audio/

Ambient "autonomous vibe" playlist tracks, served by Vite at the site root
(`/assets/audio/<id>`). This is the **file-backed** half of the ambient playlist
(Track 1.9). The **procedural** default (a synthesized Appalachian bed,
`src/playlist/ambientGenerator.js`) needs no asset and always works — these files
are optional, curated additions.

## What goes here

Compressed audio for `kind:'file'` playlist entries. Like the splat binaries, audio
files are **gitignored and host/CDN-delivered, never committed** (repo-lean /
inode-cap rule). `*.ogg/.mp3/.m4a/.opus/.wav/.flac` here are gitignored; the app
falls back to the procedural generator when a file is absent, so the app and CI
always have a working ambient source.

## Licensing — commercial-safe, ONLY CC0 or CC-BY

This is commercial work. Use **only** CC0 (public domain) or CC-BY (attribution)
audio — never copyrighted, never NC (non-commercial), never SA-only that would force
copyleft. Aesthetic target (locked): **Appalachian / old-time-ambient + temperate
(NOT tropical) forest field recordings** — see
`docs/design-system/rainforest-asset-spec.md` for the matching art direction.

Good sources: Freesound (filter to CC0 / CC-BY), the Internet Archive's public-domain
audio, ccMixter, and field-recording collections that state CC0/CC-BY explicitly.
Record the exact license + author + source URL for every file (CC-BY requires
attribution in-product).

## How to add a track

1. Drop the compressed file here, e.g. `immersive/public/assets/audio/old-time-ambient-01.ogg`
   (keep files small — these stream on mobile; prefer Opus/OGG ~96-128 kbps).
2. Add an entry to `PLAYLIST` in `src/playlist/playlist.js` (uncomment the documented
   `kind:'file'` slot):

   ```js
   {
     id: 'old-time-ambient-01.ogg',          // the served filename under /assets/audio/
     title: 'Old-Time Ambient (field recording)',
     kind: 'file',
     src: '/assets/audio/old-time-ambient-01.ogg',
     license: 'CC0',                          // or 'CC-BY-4.0'
     attribution: 'Author Name — https://source-url',  // required for CC-BY
   }
   ```

3. Deploy: upload the file to the host's `assets/audio/` path (same FTPS flow as the
   splats); it is not part of the git build.

The hook (`src/playlist/useAmbientPlaylist.jsx`) plays a `kind:'file'` entry through a
`MediaElementAudioSourceNode` routed into the existing AnalyserNode (CORS-safe:
`crossOrigin` is set before `src`, so host/CDN files analyze correctly), crossfading it
with the other entries exactly like the procedural ones.
