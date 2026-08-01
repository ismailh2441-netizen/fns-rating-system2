import { uuid, normalizeTitle, normalizeGenres, normalizePlatforms } from './util.js';

const GAMES_KEY = 'fns_games';
const RATINGS_KEY = 'fns_ratings';
const COMMENTS_KEY = 'fns_comments';

const SEED_GAMES = [
  { title: 'Sekiro: Shadows Die Twice', genre: 'Action RPG', isOpenWorld: false, year: 2019, description: 'A brutal action RPG where you play as a shinobi fighting for revenge in a fractured Japan.' },
  { title: 'Far Cry 3', genre: 'FPS', isOpenWorld: true, year: 2012, description: 'An open-world FPS set on a tropical island ruled by a charismatic warlord.' },
  { title: 'Far Cry 4', genre: 'FPS', isOpenWorld: true, year: 2014, description: 'Open-world FPS in the Himalayan region of Kyrat, torn between a dictator and a rebellion.' },
  { title: 'Far Cry 5', genre: 'FPS', isOpenWorld: true, year: 2018, description: 'Open-world FPS in Hope County, Montana, fighting against a fanatical doomsday cult.' },
  { title: 'Far Cry 6', genre: 'FPS', isOpenWorld: true, year: 2021, description: 'Open-world FPS on the island nation of Yara, leading a guerrilla revolution.' },
  { title: 'Battlefield 1', genre: 'FPS', isOpenWorld: false, year: 2016, description: 'A World War I FPS with massive combined-arms warfare.' },
  { title: 'Battlefield 4', genre: 'FPS', isOpenWorld: false, year: 2013, description: 'Modern military FPS focused on large-scale multiplayer battles.' },
  { title: 'Battlefield V', genre: 'FPS', isOpenWorld: false, year: 2018, description: 'World War II FPS with squad-focused multiplayer.' },
  { title: 'Battlefield 2042', genre: 'FPS', isOpenWorld: false, year: 2021, description: 'Near-future FPS with all-out warfare and massive maps.' },
  { title: 'Call of Duty: Modern Warfare', genre: 'FPS', isOpenWorld: false, year: 2019, description: 'Tactical modern FPS with a gritty campaign and fast multiplayer.' },
  { title: 'Call of Duty: Warzone', genre: 'Battle Royale', isOpenWorld: false, year: 2020, description: 'Free-to-play battle royale in the Modern Warfare universe.' },
  { title: 'Elden Ring', genre: 'Action RPG', isOpenWorld: true, year: 2022, description: 'An epic open-world Souls-like in a vast dark fantasy world by FromSoftware.' },
  { title: 'Hollow Knight', genre: 'Metroidvania', isOpenWorld: false, year: 2017, description: 'A hand-drawn metroidvania through the ruined kingdom of Hallownest.' },
  { title: 'Silksong', genre: 'Metroidvania', isOpenWorld: false, year: '', description: 'The anticipated sequel to Hollow Knight, following Hornet through the kingdom of Pharloom.' },
  { title: 'Dead Cells', genre: 'Roguelike', isOpenWorld: false, year: 2018, description: 'A fast-paced roguelike-metroidvania with ever-changing levels.' },
];

function load(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; } catch { return []; }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}

function seeded() {
  const key = 'fns_seeded';
  if (localStorage.getItem(key)) return;
  const games = load(GAMES_KEY);
  if (games.length > 0) return;
  const now = Date.now();
  const seededGames = SEED_GAMES.map((g, i) => ({
    ...g,
    imageUrl: '',
    id: uuid(),
    createdAt: now + i,
  }));
  save(GAMES_KEY, seededGames);
  try { localStorage.setItem(key, '1'); } catch {}
}

function migrate() {
  const games = load(GAMES_KEY);
  let changed = false;
  games.forEach(g => {
    const seed = SEED_GAMES.find(s => normalizeTitle(s.title) === normalizeTitle(g.title));
    if (!seed) return;
    if (g.year === undefined || g.year === null || g.year === '') { g.year = seed.year; changed = true; }
    if (!g.description) { g.description = seed.description; changed = true; }
    if (g.imageUrl === undefined) { g.imageUrl = ''; changed = true; }
  });
  games.forEach(g => {
    if (g.imageUrl === undefined) { g.imageUrl = ''; changed = true; }
    if (g.year === undefined || g.year === null) { g.year = ''; changed = true; }
    if (g.description === undefined) { g.description = ''; changed = true; }
    if (!Array.isArray(g.genres)) { g.genres = normalizeGenres(g.genre); changed = true; }
    if (g.platforms === undefined) { g.platforms = {}; changed = true; }
  });
  if (changed) save(GAMES_KEY, games);
}

seeded();
migrate();

export function getGames() {
  return load(GAMES_KEY);
}

export function hydrateGames(games) {
  save(GAMES_KEY, games);
}

export function hydrateRatings(ratings) {
  save(RATINGS_KEY, ratings);
}

function notify(type, detail) {
  try {
    window.dispatchEvent(new CustomEvent('fns:local-change', { detail: { type, ...detail } }));
  } catch {}
}

export function getGame(id) {
  return load(GAMES_KEY).find(g => g.id === id) || null;
}

export function findGameByTitle(title) {
  const normalized = normalizeTitle(title);
  if (!normalized) return null;
  return load(GAMES_KEY).find(g => normalizeTitle(g.title) === normalized) || null;
}

export function addGame({ title, genres, isOpenWorld, year, description, imageUrl, platforms }) {
  const games = load(GAMES_KEY);
  const game = {
    id: uuid(),
    title,
    genres: normalizeGenres(genres),
    isOpenWorld,
    year: year || '',
    description: description || '',
    imageUrl: imageUrl || '',
    platforms: normalizePlatforms(platforms),
    createdAt: Date.now(),
  };
  games.push(game);
  if (!save(GAMES_KEY, games)) throw new Error('Storage is full. Try a smaller cover image.');
  notify('game-upsert', { game });
  return game;
}

export function updateGame(id, fields) {
  const games = load(GAMES_KEY);
  const idx = games.findIndex(g => g.id === id);
  if (idx < 0) return null;
  games[idx] = { ...games[idx], ...fields };
  if (!save(GAMES_KEY, games)) throw new Error('Storage is full. Try a smaller cover image.');
  notify('game-upsert', { game: games[idx] });
  return games[idx];
}

export function deleteGame(id) {
  save(GAMES_KEY, load(GAMES_KEY).filter(g => g.id !== id));
  save(RATINGS_KEY, load(RATINGS_KEY).filter(r => r.gameId !== id));
  save(COMMENTS_KEY, load(COMMENTS_KEY).filter(c => c.gameId !== id));
  notify('game-delete', { id });
}

export function getRatings(gameId) {
  return load(RATINGS_KEY).filter(r => r.gameId === gameId);
}

export function getUserRating(gameId, userId) {
  return load(RATINGS_KEY).find(r => r.gameId === gameId && r.userId === userId) || null;
}

export function saveRating({ gameId, userId, userName, gameplay, story, graphics, backgroundMusic, worldDesign, exploration, characters, villain, dlc, multiplayer }) {
  const ratings = load(RATINGS_KEY);
  const existing = ratings.findIndex(r => r.gameId === gameId && r.userId === userId);
  const criteria = [gameplay, story, graphics, backgroundMusic, worldDesign, characters, villain, exploration, dlc, multiplayer].filter(v => v != null);
  const average = criteria.length > 0 ? Math.round((criteria.reduce((a, b) => a + b, 0) / criteria.length) * 10) / 10 : 0;

  const rating = {
    gameId, userId, userName,
    gameplay, story, graphics, backgroundMusic, worldDesign,
    exploration: exploration ?? null,
    characters, villain,
    dlc: dlc ?? null,
    multiplayer: multiplayer ?? null,
    average,
    updatedAt: Date.now(),
  };

  if (existing >= 0) {
    ratings[existing] = { ...ratings[existing], ...rating, id: ratings[existing].id, createdAt: ratings[existing].createdAt };
  } else {
    rating.id = uuid();
    rating.createdAt = Date.now();
    ratings.push(rating);
  }

  save(RATINGS_KEY, ratings);
  notify('rating-upsert', { rating });
  return rating;
}

export function deleteRating(gameId, userId) {
  save(RATINGS_KEY, load(RATINGS_KEY).filter(r => !(r.gameId === gameId && r.userId === userId)));
  notify('rating-delete', { gameId, userId });
}

export function getAllRatings() {
  return load(RATINGS_KEY);
}

export function getComments(gameId) {
  return load(COMMENTS_KEY).filter(c => c.gameId === gameId);
}

export function getAllComments() {
  return load(COMMENTS_KEY);
}

export function hydrateComments(comments) {
  save(COMMENTS_KEY, comments);
}

export function addComment({ gameId, userId, userName, body, parentId }) {
  const comments = load(COMMENTS_KEY);
  const comment = {
    id: uuid(),
    gameId,
    userId,
    userName: userName || 'Anonymous',
    body: String(body || '').trim(),
    parentId: parentId || null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  comments.push(comment);
  if (!save(COMMENTS_KEY, comments)) throw new Error('Storage is full. Try a shorter comment.');
  notify('comment-upsert', { comment });
  return comment;
}

export function deleteComment(id) {
  const comments = load(COMMENTS_KEY);
  const idsToDelete = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    comments.forEach(c => {
      if (c.parentId && idsToDelete.has(c.parentId) && !idsToDelete.has(c.id)) {
        idsToDelete.add(c.id);
        changed = true;
      }
    });
  }
  save(COMMENTS_KEY, comments.filter(c => !idsToDelete.has(c.id)));
  idsToDelete.forEach(delId => notify('comment-delete', { id: delId }));
}
