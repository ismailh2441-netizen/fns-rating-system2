import { supabase, enabled } from './supabase.js';
import { getGames, getAllRatings, hydrateGames, hydrateRatings } from './db.js';
import { getUserId, authReady, displayName } from './auth.js';
import { cachePinHash } from './settings.js';

const anonDeviceId = getUserId().id;

function normalizeKey(s) {
  return String(s || '').trim().toLowerCase().replace(/\s+/g, ' ');
}

function gameToRow(g) {
  return {
    id: g.id,
    title: g.title,
    genre: g.genre || '',
    is_open_world: !!g.isOpenWorld,
    year: String(g.year ?? ''),
    description: g.description || '',
    image_url: g.imageUrl || '',
    created_at: g.createdAt ?? Date.now(),
  };
}

function rowToGame(r) {
  return {
    id: r.id,
    title: r.title,
    genre: r.genre || '',
    isOpenWorld: !!r.is_open_world,
    year: r.year != null ? String(r.year) : '',
    description: r.description || '',
    imageUrl: r.image_url || '',
    createdAt: r.created_at ?? Date.now(),
  };
}

function sameGame(a, b) {
  return a.id === b.id
    && a.title === b.title
    && a.genre === b.genre
    && a.is_open_world === b.is_open_world
    && a.year === b.year
    && a.description === b.description
    && a.image_url === b.image_url
    && a.created_at === b.created_at;
}

function ratingToRow(r) {
  return {
    id: r.id,
    game_id: r.gameId,
    user_id: r.userId,
    user_name: r.userName || 'Anonymous',
    gameplay: r.gameplay ?? null,
    story: r.story ?? null,
    graphics: r.graphics ?? null,
    background_music: r.backgroundMusic ?? null,
    world_design: r.worldDesign ?? null,
    exploration: r.exploration ?? null,
    characters: r.characters ?? null,
    villain: r.villain ?? null,
    average: r.average ?? 0,
    created_at: r.createdAt ?? Date.now(),
    updated_at: r.updatedAt ?? Date.now(),
  };
}

function rowToRating(r) {
  return {
    id: r.id,
    gameId: r.game_id,
    userId: r.user_id,
    userName: r.user_name || 'Anonymous',
    gameplay: r.gameplay ?? null,
    story: r.story ?? null,
    graphics: r.graphics ?? null,
    backgroundMusic: r.background_music ?? null,
    worldDesign: r.world_design ?? null,
    exploration: r.exploration ?? null,
    characters: r.characters ?? null,
    villain: r.villain ?? null,
    average: r.average ?? 0,
    createdAt: r.created_at ?? Date.now(),
    updatedAt: r.updated_at ?? Date.now(),
  };
}

function dispatchSync() {
  window.dispatchEvent(new CustomEvent('fns:sync'));
}

function sortGames(games) {
  return games.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
}

let remoteTitleToId = new Map();

async function pushLocal() {
  const games = getGames();
  const ratings = getAllRatings();

  const [gRes, rRes] = await Promise.all([
    supabase.from('games').select('id, title, genre, is_open_world, year, description, image_url, created_at'),
    supabase.from('ratings').select('id, updated_at'),
  ]);
  if (gRes.error) throw gRes.error;
  if (rRes.error) throw rRes.error;

  const remoteGames = gRes.data || [];
  const remoteRatings = rRes.data || [];

  remoteTitleToId = new Map();
  remoteGames.forEach(g => {
    const t = normalizeKey(g.title);
    if (t && !remoteTitleToId.has(t)) remoteTitleToId.set(t, g.id);
  });

  const remoteGameById = new Map(remoteGames.map(g => [g.id, g]));
  const gameById = new Map(games.map(g => [g.id, g]));

  const gameRows = [];
  games.forEach(g => {
    const t = normalizeKey(g.title);
    const remoteId = t ? remoteTitleToId.get(t) : null;
    if (remoteId && remoteId !== g.id) return;
    const row = gameToRow(g);
    const remote = remoteGameById.get(g.id);
    if (remote && sameGame(row, remote)) return;
    gameRows.push(row);
  });

  if (gameRows.length) {
    const { error } = await supabase.from('games').upsert(gameRows, { onConflict: 'id' });
    if (error) throw error;
  }

  const remoteUpdatedAt = new Map(remoteRatings.map(r => [r.id, r.updated_at]));

  const ratingRows = [];
  ratings.forEach(r => {
    if (!r || !r.gameId) return;
    let gameId = r.gameId;
    const local = gameById.get(r.gameId);
    if (local) {
      const canonical = remoteTitleToId.get(normalizeKey(local.title));
      if (canonical) gameId = canonical;
    }
    const row = ratingToRow({ ...r, gameId });
    if (remoteUpdatedAt.get(r.id) === row.updated_at) return;
    ratingRows.push(row);
  });

  if (ratingRows.length) {
    const { error } = await supabase.from('ratings').upsert(ratingRows, { onConflict: 'id' });
    if (error) throw error;
  }
}

async function pullAll() {
  const { data: games, error: gErr } = await supabase.from('games').select('*').order('created_at', { ascending: true });
  if (gErr) throw gErr;
  const { data: ratings, error: rErr } = await supabase.from('ratings').select('*').order('created_at', { ascending: true });
  if (rErr) throw rErr;
  hydrateGames(sortGames((games || []).map(rowToGame)));
  hydrateRatings((ratings || []).map(rowToRating));
}

async function pullSettings() {
  const { data, error } = await supabase.from('settings').select('value').eq('key', 'pin_hash').maybeSingle();
  if (error) throw error;
  cachePinHash(data && data.value ? data.value : '');
}

function isOwnRating(row) {
  if (!row) return false;
  try { return row.user_id === getUserId().id; } catch { return false; }
}

function handleGameEvent(payload) {
  const games = getGames();
  const { eventType, new: next, old: prev } = payload;
  if (eventType === 'DELETE') {
    const id = prev && prev.id;
    if (!id) return;
    hydrateGames(games.filter(g => g.id !== id));
    const ratings = getAllRatings();
    hydrateRatings(ratings.filter(r => r.gameId !== id));
  } else {
    const game = rowToGame(next);
    const idx = games.findIndex(g => g.id === game.id);
    if (idx >= 0) games[idx] = game;
    else games.push(game);
    hydrateGames(sortGames(games));
  }
}

function handleRatingEvent(payload) {
  const { eventType, new: next, old: prev } = payload;
  if (isOwnRating(eventType === 'DELETE' ? prev : next)) return;
  const ratings = getAllRatings();
  if (eventType === 'DELETE') {
    const id = prev && prev.id;
    if (id) hydrateRatings(ratings.filter(r => r.id !== id));
  } else {
    const rating = rowToRating(next);
    const idx = ratings.findIndex(r => r.id === rating.id);
    if (idx >= 0) ratings[idx] = rating;
    else ratings.push(rating);
    hydrateRatings(ratings);
  }
}

function subscribe() {
  if (subscribed) return;
  subscribed = true;
  supabase.channel('fns-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'games' }, handleGameEvent)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'ratings' }, handleRatingEvent)
    .subscribe(status => {
      if (status !== 'SUBSCRIBED') console.warn('sync: realtime status', status);
    });
}

window.addEventListener('fns:local-change', e => {
  if (!enabled) return;
  const d = e.detail;
  if (!d || !d.type) return;
  const p = (() => {
    if (d.type === 'game-upsert') return supabase.from('games').upsert(gameToRow(d.game), { onConflict: 'id' });
    if (d.type === 'game-delete') {
      const del = supabase.from('games').delete().eq('id', d.id);
      const delRatings = supabase.from('ratings').delete().eq('game_id', d.id);
      return Promise.all([del, delRatings]);
    }
    if (d.type === 'rating-upsert') {
      let gameId = d.rating.gameId;
      const local = getGames().find(g => g.id === gameId);
      if (local) {
        const canonical = remoteTitleToId.get(normalizeKey(local.title));
        if (canonical) gameId = canonical;
      }
      return supabase.from('ratings').upsert(ratingToRow({ ...d.rating, gameId }), { onConflict: 'id' });
    }
    if (d.type === 'rating-delete') return supabase.from('ratings').delete().eq('game_id', d.gameId).eq('user_id', d.userId);
    return null;
  })();
  if (p) p.then(({ error } = {}) => { if (error) console.error('sync: push', error); }).catch(err => console.error('sync: push', err));
});

let subscribed = false;

function adoptDeviceRatings(authId, authName) {
  if (!anonDeviceId || anonDeviceId === authId) return;
  const ratings = getAllRatings();
  let changed = false;
  ratings.forEach(r => {
    if (r && r.userId === anonDeviceId) {
      r.userId = authId;
      r.userName = authName || r.userName;
      r.updatedAt = Date.now();
      changed = true;
    }
  });
  if (changed) hydrateRatings(ratings);
}

async function syncNow() {
  if (!enabled) return;
  try {
    await pushLocal();
  } catch (err) {
    console.error('sync: push failed', err);
  }
  try {
    await pullAll();
  } catch (err) {
    console.error('sync: pull failed', err);
  }
  try {
    await pullSettings();
  } catch (err) {
    console.warn('sync: settings pull failed', err);
  }
  dispatchSync();
}

export async function initSync() {
  if (!enabled) return;
  const user = await authReady();
  if (user) {
    adoptDeviceRatings(user.id, displayName(user));
  }
  await syncNow();
  subscribe();
}
