// Pull media from one Google Drive folder. Pure core (injected driveClient +
// write) + real fetch-based adapters for the CLI/CI.
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { classifyType } from './schema.mjs';

export async function pullFolder({ driveClient, folderId, write }) {
  const entries = await driveClient.list(folderId);
  const out = [];
  for (const e of entries) {
    const type = classifyType(e.name);
    if (!type) continue;
    const bytes = await driveClient.download(e.id);
    const destPath = write(e.name, bytes);
    out.push({ id: e.id, name: e.name, destPath, type });
  }
  return out;
}

export async function accessTokenFromRefresh({ clientId, clientSecret, refreshToken }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ client_id: clientId, client_secret: clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }),
  });
  if (!res.ok) throw new Error(`token refresh failed: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

export function makeDriveClient({ accessToken }) {
  const auth = { authorization: `Bearer ${accessToken}` };
  return {
    async list(folderId) {
      const files = [];
      let pageToken;
      do {
        const q = encodeURIComponent(`'${folderId}' in parents and trashed=false`);
        const url = `https://www.googleapis.com/drive/v3/files?q=${q}&fields=nextPageToken,files(id,name,mimeType,size)&pageSize=1000${pageToken ? `&pageToken=${pageToken}` : ''}`;
        const res = await fetch(url, { headers: auth });
        if (!res.ok) throw new Error(`drive list failed: ${res.status} ${await res.text()}`);
        const json = await res.json();
        files.push(...(json.files || []));
        pageToken = json.nextPageToken;
      } while (pageToken);
      return files;
    },
    async download(fileId) {
      const url = `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`;
      const res = await fetch(url, { headers: auth });
      if (!res.ok) throw new Error(`drive download failed: ${res.status}`);
      return new Uint8Array(await res.arrayBuffer());
    },
  };
}

// CLI: env GOOGLE_CLIENT_ID/SECRET/REFRESH_TOKEN + arg <folderId> <destDir>
if (import.meta.url === `file://${process.argv[1]}`) {
  const [folderId, destDir = 'work/raw'] = process.argv.slice(2);
  if (!folderId) { console.error('usage: pull-drive.mjs <folderId> [destDir]'); process.exit(1); }
  const accessToken = await accessTokenFromRefresh({
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
  });
  mkdirSync(destDir, { recursive: true });
  const out = await pullFolder({
    driveClient: makeDriveClient({ accessToken }),
    folderId,
    write: (name, bytes) => { const p = join(destDir, name); writeFileSync(p, bytes); return p; },
  });
  console.log(JSON.stringify(out, null, 2));
}
