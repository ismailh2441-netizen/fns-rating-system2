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
