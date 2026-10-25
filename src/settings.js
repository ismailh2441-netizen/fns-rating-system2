import { supabase, enabled } from './supabase.js';
import { storageGet, storageSet, storageRemove } from './storage.js';

const PIN_KEY = 'fns_pin';
const PIN_HASH_KEY = 'fns_pin_hash';
const UNLOCK_KEY = 'fns_core_unlocked';
const SALT = 'fns-pin-salt-v1';

export function getPin() {
  return storageGet(PIN_KEY) || '';
}

export function hasPin() {
  if (getPinHash()) return true;
  return !!getPin();
}

function getPinHash() {
  return storageGet(PIN_HASH_KEY) || '';
}

export function cachePinHash(hash) {
  if (hash) storageSet(PIN_HASH_KEY, hash);
  else storageRemove(PIN_HASH_KEY);
}

export function isCoreUnlocked() {
  return storageGet(UNLOCK_KEY) === '1';
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
  storageSet(PIN_KEY, pin);
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
          storageSet(UNLOCK_KEY, '1');
          return true;
        }
        return false;
      }
      await setPinRemote(pin);
      storageSet(UNLOCK_KEY, '1');
      return true;
    } catch (e) {
      console.warn('pin: remote check failed, falling back', e);
    }
  }
  const current = getPin();
  if (!current) {
    setPin(pin);
    storageSet(UNLOCK_KEY, '1');
    return true;
  }
  if (pin === current) {
    storageSet(UNLOCK_KEY, '1');
    return true;
  }
  return false;
}

export function lockCore() {
  storageSet(UNLOCK_KEY, '0');
}
