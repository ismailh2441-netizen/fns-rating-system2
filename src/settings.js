import { supabase, enabled } from './supabase.js';

const PIN_KEY = 'fns_pin';
const PIN_HASH_KEY = 'fns_pin_hash';
const UNLOCK_KEY = 'fns_core_unlocked';
const SALT = 'fns-pin-salt-v1';

export function getPin() {
  try { return localStorage.getItem(PIN_KEY) || ''; } catch { return ''; }
}

export function hasPin() {
  if (getPinHash()) return true;
  return !!getPin();
}

function getPinHash() {
  try { return localStorage.getItem(PIN_HASH_KEY) || ''; } catch { return ''; }
}

export function cachePinHash(hash) {
  try {
    if (hash) localStorage.setItem(PIN_HASH_KEY, hash);
    else localStorage.removeItem(PIN_HASH_KEY);
  } catch {}
}

export function isCoreUnlocked() {
  try { return localStorage.getItem(UNLOCK_KEY) === '1'; } catch { return false; }
}

async function hashPin(pin) {
  const data = new TextEncoder().encode(SALT + pin);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function setPinRemote(pin) {
  const hash = await hashPin(pin);
  const { error } = await supabase.from('settings').upsert({ key: 'pin_hash', value: hash }, { onConflict: 'key' });
  if (error) throw error;
  cachePinHash(hash);
}

export function setPin(pin) {
  try { localStorage.setItem(PIN_KEY, pin); } catch {}
}

export async function setPinAsync(pin) {
  if (!pin) return;
  if (enabled) {
    try {
      await setPinRemote(pin);
      return;
    } catch (e) {
      console.warn('pin: remote set failed, falling back', e);
    }
  }
  setPin(pin);
}

export async function unlockCore(pin) {
  if (!pin) return false;
  if (enabled) {
    try {
      const hash = await hashPin(pin);
      const { data, error } = await supabase.from('settings').select('value').eq('key', 'pin_hash').maybeSingle();
      if (error) throw error;
      if (data && data.value) {
        if (data.value === hash) {
          try { localStorage.setItem(UNLOCK_KEY, '1'); } catch {}
          return true;
        }
        return false;
      }
      await setPinRemote(pin);
      try { localStorage.setItem(UNLOCK_KEY, '1'); } catch {}
      return true;
    } catch (e) {
      console.warn('pin: remote check failed, falling back', e);
    }
  }
  const current = getPin();
  if (!current) {
    setPin(pin);
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch {}
    return true;
  }
  if (pin === current) {
    try { localStorage.setItem(UNLOCK_KEY, '1'); } catch {}
    return true;
  }
  return false;
}

export function lockCore() {
  try { localStorage.setItem(UNLOCK_KEY, '0'); } catch {}
}
