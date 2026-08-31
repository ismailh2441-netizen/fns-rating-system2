import { uuid } from './util.js';
import { supabase, enabled } from './supabase.js';
import { getCriticByUserId } from './critics.js';

const USER_KEY = 'fns_user';

function anonUser() {
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

export function displayName(user) {
  if (!user) return '';
  const meta = (user.user_metadata || {});
  for (const key of ['full_name', 'name', 'preferred_username']) {
    if (meta[key]) return meta[key];
  }
  if (user.email) return user.email.split('@')[0];
  return '';
}

let authUser = null;
let readyPromise = null;

export function getAuthUser() {
  return authUser;
}

export function isSignedIn() {
  return !!authUser;
}

export function authReady() {
  if (!enabled || !supabase) return Promise.resolve(null);
  if (!readyPromise) {
    readyPromise = supabase.auth.getSession()
      .then(({ data }) => {
        authUser = data.session && data.session.user ? data.session.user : null;
        return authUser;
      })
      .catch(() => {
        authUser = null;
        return null;
      });
  }
  return readyPromise;
}

export function getUserId() {
  const u = getAuthUser();
  if (u) {
    return { id: u.id, name: displayName(u) || 'Anonymous', email: u.email || '' };
  }
  return anonUser();
}

export function getMyCritic() {
  return getCriticByUserId(getUserId().id) || null;
}

export function getMyUsername() {
  const critic = getMyCritic();
  return critic ? critic.username : '';
}

export function setUserName(name) {
  const clean = (name || '').trim() || 'Anonymous';
  if (isSignedIn() && supabase) {
    const u = getAuthUser();
    if (u) {
      u.user_metadata = { ...(u.user_metadata || {}), full_name: clean };
    }
    supabase.auth.updateUser({ data: { full_name: clean } }).catch(err => console.warn('auth: name update failed', err));
    return getUserId();
  }
  const user = anonUser();
  user.name = clean;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {}
  return user;
}

export async function signInWithGoogle() {
  if (!supabase) throw new Error('Supabase not configured');
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin },
  });
  if (error) throw error;
}

export async function signOut() {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
  authUser = null;
}

export function onAuthChange(cb) {
  if (!supabase) return () => {};
  const res = supabase.auth.onAuthStateChange((event, session) => {
    authUser = session && session.user ? session.user : null;
    cb(event, session, authUser);
  });
  return () => {
    try { res.data.subscription.unsubscribe(); } catch {}
  };
}

if (enabled && supabase) {
  onAuthChange(() => {});
}
