// tools/portfolio/schema.mjs
// Shared manifest contract for the portfolio gathering pipeline. Pure, no I/O.

export const IMAGE_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.heic', '.bmp'];
export const VIDEO_EXT = ['.mp4', '.mov', '.webm', '.m4v', '.avi', '.mkv', '.mpg', '.mpeg'];

export function classifyType(filename) {
  const lower = String(filename).toLowerCase();
  const dot = lower.lastIndexOf('.');
  if (dot < 0) return null;
  const ext = lower.slice(dot);
  if (IMAGE_EXT.includes(ext)) return 'image';
  if (VIDEO_EXT.includes(ext)) return 'video';
  return null;
}

export function makeItem({ id, path, type, score = 0, tags = [], reason = '', dupGroup = null, bestOfGroup = true, takenAt = null }) {
  return { id, path, type, score, tags: [...tags], reason, dupGroup, bestOfGroup, takenAt };
}

export function validateManifest(obj) {
  const errors = [];
  if (!obj || typeof obj !== 'object') return { ok: false, errors: ['manifest is not an object'] };
  if (typeof obj.generatedAt !== 'string') errors.push('generatedAt must be a string');
  if (!Array.isArray(obj.items)) { errors.push('items must be an array'); return { ok: false, errors }; }
  if (obj.count !== obj.items.length) errors.push(`count (${obj.count}) !== items.length (${obj.items.length})`);
  obj.items.forEach((it, i) => {
    if (typeof it.id !== 'string') errors.push(`item[${i}].id must be a string`);
    if (typeof it.path !== 'string') errors.push(`item[${i}].path must be a string`);
    if (it.type !== 'image' && it.type !== 'video') errors.push(`item[${i}].type must be image|video`);
    if (typeof it.score !== 'number' || it.score < 0 || it.score > 100) errors.push(`item[${i}].score out of range`);
    if (!Array.isArray(it.tags)) errors.push(`item[${i}].tags must be an array`);
  });
  return { ok: errors.length === 0, errors };
}
