import { uuid } from './util.js';

const CRITICS_KEY = 'fns_critics';

function load() {
  try { return JSON.parse(localStorage.getItem(CRITICS_KEY)) || []; } catch { return []; }
}

function save(critics) {
  try {
    localStorage.setItem(CRITICS_KEY, JSON.stringify(critics));
    return true;
  } catch {
    return false;
  }
}

function notify(type, detail) {
  try {
    window.dispatchEvent(new CustomEvent('fns:local-change', { detail: { type, ...detail } }));
  } catch {}
}

export function getCritics() {
  return load();
}

export function hydrateCritics(critics) {
  save(critics);
}

export function getCriticByUsername(username) {
  const u = normalizeUsername(username);
  return load().find(c => c.username === u) || null;
}

export function getCriticByUserId(userId) {
  if (!userId) return null;
  return load().find(c => c.userId === userId) || null;
}

export function isUsernameTaken(username) {
  return !!getCriticByUsername(username);
}

export function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

export function validUsername(username) {
  const u = String(username || '').trim();
  return /^[a-zA-Z0-9_\- ]{3,24}$/.test(u);
}

export function claimUsername(username, userId, displayName) {
  const raw = String(username || '').trim();
  if (!validUsername(raw)) {
    throw new Error('Username must be 3-24 characters (letters, numbers, spaces, - or _).');
  }
  const u = normalizeUsername(raw);
  const critics = load();
  const existing = critics.find(c => c.username === u);
  if (existing) {
    if (existing.userId === userId) return existing;
    throw new Error('This username is already taken.');
  }

  const prior = critics.find(c => c.userId === userId);
  let critic;
  if (prior) {
    prior.username = u;
    prior.displayName = displayName || prior.displayName;
    prior.updatedAt = Date.now();
    critic = prior;
  } else {
    critic = {
      id: uuid(),
      username: u,
      userId,
      displayName: displayName || 'Anonymous',
      gameIds: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    critics.push(critic);
  }

  if (!save(critics)) throw new Error('Could not save your username. Storage is full.');
  notify('critic-upsert', { critic });
  return critic;
}

export function setCriticTop10(username, orderedGameIds) {
  const u = normalizeUsername(username);
  const critics = load();
  const idx = critics.findIndex(c => c.username === u);
  if (idx < 0) return null;
  const clean = (Array.isArray(orderedGameIds) ? orderedGameIds : [])
    .filter(id => typeof id === 'string' && id)
    .slice(0, 10);
  critics[idx] = { ...critics[idx], gameIds: clean, updatedAt: Date.now() };
  if (!save(critics)) return null;
  notify('critic-upsert', { critic: critics[idx] });
  return critics[idx];
}

export function addToTop10(username, gameId) {
  const critic = getCriticByUsername(username);
  if (!critic) return null;
  const ids = (critic.gameIds || []);
  if (ids.includes(gameId)) return critic;
  if (ids.length >= 10) return critic;
  return setCriticTop10(username, [...ids, gameId]);
}

export function removeFromTop10(username, gameId) {
  const critic = getCriticByUsername(username);
  if (!critic) return null;
  return setCriticTop10(username, (critic.gameIds || []).filter(id => id !== gameId));
}

export function moveTop10(username, fromIndex, toIndex) {
  const critic = getCriticByUsername(username);
  if (!critic) return null;
  const ids = [...(critic.gameIds || [])];
  if (fromIndex < 0 || fromIndex >= ids.length) return null;
  const [moved] = ids.splice(fromIndex, 1);
  const clampedTo = Math.max(0, Math.min(toIndex, ids.length));
  ids.splice(clampedTo, 0, moved);
  return setCriticTop10(username, ids);
}

export function deleteCritic(username) {
  if (!isOwnCritic(username)) return;
  const u = normalizeUsername(username);
  save(load().filter(c => c.username !== u));
  notify('critic-delete', { username: u });
}

export function isOwnCritic(username) {
  const u = normalizeUsername(username);
  return !!load().find(c => c.username === u);
}
