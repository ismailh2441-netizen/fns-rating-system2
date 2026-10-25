import { storageGet, storageSet } from './storage.js';

const THEME_KEY = 'fns_theme';

export function getTheme() {
  return storageGet(THEME_KEY) || 'light';
}

export function setTheme(mode) {
  storageSet(THEME_KEY, mode);
  applyTheme(mode);
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
  return next;
}

export function applyTheme(mode) {
  if (mode === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

applyTheme(getTheme());
