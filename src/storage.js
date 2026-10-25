// Safe wrapper around localStorage.
// Some browsers/PCs block site data (strict privacy settings, kiosk profiles,
// in-app browsers). A raw localStorage call then throws a SecurityError, which
// used to crash the whole app at import time and leave a blank page.
// Everything now falls back to an in-memory store for the current session.

const memory = new Map();

function probe() {
  try {
    if (typeof localStorage === 'undefined') return false;
    const key = '__fns_storage_test__';
    localStorage.setItem(key, '1');
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

let available = probe();

export function isStorageAvailable() {
  return available;
}

export function storageGet(key) {
  if (available) {
    try {
      return localStorage.getItem(key);
    } catch {
      available = false;
    }
  }
  return memory.has(key) ? memory.get(key) : null;
}

export function storageSet(key, value) {
  const text = String(value);
  memory.set(key, text);
  if (!available) return false;
  try {
    localStorage.setItem(key, text);
    return true;
  } catch (err) {
    // Quota errors should not disable storage for the whole session,
    // but a security/permission error will fail on every call.
    if (err && (err.name === 'SecurityError' || err.name === 'NotAllowedError')) {
      available = false;
    }
    return false;
  }
}

export function storageRemove(key) {
  memory.delete(key);
  if (!available) return false;
  try {
    localStorage.removeItem(key);
    return true;
  } catch (err) {
    if (err && (err.name === 'SecurityError' || err.name === 'NotAllowedError')) {
      available = false;
    }
    return false;
  }
}
