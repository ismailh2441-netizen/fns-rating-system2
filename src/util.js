export function uuid() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function normalizeTitle(title) {
  return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, ' ').trim();
}

export function normalizeGenres(genres) {
  let list = [];
  if (Array.isArray(genres)) list = genres;
  else if (typeof genres === 'string' && genres.trim()) list = genres.split(',');
  return [...new Set(list.map(g => String(g).trim()).filter(Boolean))].sort();
}

export function normalizePlatforms(platforms) {
  const keys = ['pc', 'console', 'mobile'];
  const out = {};
  keys.forEach(k => {
    const p = platforms && typeof platforms === 'object' ? platforms[k] : null;
    out[k] = {
      single: !!(p && p.single),
      multiplayer: !!(p && p.multiplayer),
    };
  });
  return out;
}

export function normalizeCoverUrl(raw) {
  const value = String(raw || '').trim();
  if (!value) return '';
  try {
    const url = new URL(value);
    const params = url.searchParams;
    if (params.has('imgurl')) {
      const extracted = params.get('imgurl');
      if (extracted) return extracted;
    }
    if (params.has('url')) {
      const u = params.get('url');
      if (u) return u;
    }
  } catch {}
  return value;
}
