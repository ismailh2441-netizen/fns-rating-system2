import { uuid } from './util.js';

const USER_KEY = 'fns_user';

export function getUserId() {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (raw) {
      const user = JSON.parse(raw);
      if (user && user.id) return user;
    }
    const user = { id: uuid(), name: 'Anonymous' };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    return { id: uuid(), name: 'Anonymous' };
  }
}

export function setUserName(name) {
  const user = getUserId();
  user.name = name || 'Anonymous';
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  return user;
}
