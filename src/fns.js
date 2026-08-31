import { normalizeGenres, normalizePlatforms } from './util.js';

export const CRITERIA = [
  { key: 'gameplay', label: 'Gameplay', always: true },
  { key: 'story', label: 'Story', always: true },
  { key: 'graphics', label: 'Graphics', always: true },
  { key: 'backgroundMusic', label: 'Background Music', always: true },
  { key: 'worldDesign', label: 'World Design / Details', always: true },
  { key: 'exploration', label: 'Exploration (Open World)', always: false },
  { key: 'characters', label: 'Characters', always: true },
  { key: 'villain', label: 'Villain', always: true },
  { key: 'dlc', label: 'DLC', always: true },
  { key: 'multiplayer', label: 'Multiplayer', always: true },
];

export const CRITERIA_SHORT = {
  gameplay: 'Gameplay',
  story: 'Story',
  graphics: 'Graphics',
  backgroundMusic: 'Music',
  worldDesign: 'World',
  exploration: 'Explore',
  characters: 'Characters',
  villain: 'Villain',
  dlc: 'DLC',
  multiplayer: 'Multiplayer',
};

export function activeCriteria(game) {
  return CRITERIA.filter(c => c.always || game.isOpenWorld);
}

export const GENRES = ['Action', 'Action RPG', 'Adventure', 'Battle Royale', 'Fighting', 'FPS', 'Horror', 'Indie', 'Metroidvania', 'Open World', 'Other', 'Platformer', 'Puzzle', 'Racing', 'Rhythm', 'RPG', 'Roguelike', 'Shooter', 'Simulation', 'Sports', 'Strategy', 'Survival'];

export const PLATFORM_OPTIONS = ['PC', 'Console', 'Mobile'];

export function genresText(game) {
  const list = game.genres && game.genres.length ? game.genres : (game.genre ? [game.genre] : []);
  return normalizeGenres(list).join(', ');
}

export function platformEntries(platforms) {
  const norm = normalizePlatforms(platforms);
  return PLATFORM_OPTIONS.map(name => {
    const e = norm[name.toLowerCase()] || { single: false, multiplayer: false };
    return { platform: name, single: e.single, multiplayer: e.multiplayer };
  }).filter(p => p.single || p.multiplayer);
}

export function computeFNS(rating) {
  const keys = ['gameplay', 'story', 'graphics', 'backgroundMusic', 'worldDesign', 'exploration', 'characters', 'villain', 'dlc', 'multiplayer'];
  const vals = keys.map(k => rating[k]).filter(v => v != null);
  return vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
}

export function scoreColor(score) {
  if (score >= 8.5) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 7.0) return 'text-blue-600 dark:text-blue-400';
  if (score >= 5.0) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

export function barColor(score) {
  if (score >= 8.5) return '#10b981';
  if (score >= 7.0) return '#3b82f6';
  if (score >= 5.0) return '#f59e0b';
  return '#ef4444';
}

export function initials(name) {
  return (name || '?').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

export function formatDate(ts) {
  try {
    return new Date(ts).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '';
  }
}
