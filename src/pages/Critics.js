import { getGames, getAllRatings } from '../db.js';
import { getCritics, getCriticByUsername, addToTop10, removeFromTop10, moveTop10 } from '../critics.js';
import { getUserId } from '../auth.js';
import { genresText } from '../fns.js';

function ratingCount(userId) {
  let n = 0;
  getAllRatings().forEach(r => { if (r.userId === userId) n++; });
  return n;
}

export function Critics(app) {
  const hash = location.hash.slice(1);
  const match = hash.match(/^\/critic\/(.+)$/);
  if (match) {
    renderCritic(app, decodeURIComponent(match[1]));
  } else {
    renderBrowse(app);
  }
}

function initials2(name) {
  return String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
}

function renderBrowse(app) {
  const critics = getCritics().sort((a, b) => a.username.localeCompare(b.username));

  app.innerHTML = `
    <div class="fade-in max-w-5xl mx-auto">
      <a href="#/" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Library
      </a>
      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-1">Critics</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">FNS critics and their Top 10 games. Claim a unique username in your menu to become a critic.</p>

      ${critics.length === 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p class="text-gray-400 dark:text-gray-500">No critics yet. Be the first!</p>
          <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">Open your user menu and claim a unique username.</p>
        </div>
      ` : `
        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          ${critics.map(c => `
            <a href="#/critic/${encodeURIComponent(c.username)}" class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5 hover:border-purple-300 dark:hover:border-purple-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center font-bold text-purple-600 dark:text-purple-300 text-sm shrink-0">${initials2(c.displayName)}</span>
                <div class="min-w-0">
                  <p class="font-semibold text-gray-900 dark:text-gray-100 truncate">${c.displayName || 'Anonymous'}</p>
                  <p class="text-xs text-purple-600 dark:text-purple-400">@${c.username}</p>
                </div>
              </div>
              <div class="mt-3 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
                <span>${(c.gameIds || []).length}/10 Top 10</span>
                <span>${ratingCount(c.userId)} rating${ratingCount(c.userId) !== 1 ? 's' : ''}</span>
              </div>
            </a>
          `).join('')}
        </div>
      `}
    </div>
  `;
}

function renderCritic(app, username) {
  const critic = getCriticByUsername(username);
  if (!critic) {
    location.hash = '/critics';
    return;
  }

  const user = getUserId();
  const isOwn = critic.userId === user.id;
  const games = getGames();
  const gameMap = {};
  games.forEach(g => { gameMap[g.id] = g; });
  const picks = (critic.gameIds || [])
    .map((id, i) => ({ game: gameMap[id], rank: i + 1 }))
    .filter(p => p.game);
  const pickedIds = new Set(picks.map(p => p.game.id));

  app.innerHTML = `
    <div class="fade-in max-w-5xl mx-auto">
      <a href="#/critics" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        All Critics
      </a>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-4">
          <span class="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center font-bold text-purple-600 dark:text-purple-300 text-lg shrink-0">${initials2(critic.displayName)}</span>
          <div>
            <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">${critic.displayName || 'Anonymous'}</h1>
            <p class="text-sm text-purple-600 dark:text-purple-400">@${critic.username}</p>
          </div>
        </div>
        <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">${ratingCount(critic.userId)} rating${ratingCount(critic.userId) !== 1 ? 's' : ''} · ${picks.length}/10 games in Top 10</p>
        ${isOwn ? '<p class="text-xs text-emerald-600 dark:text-emerald-400 mt-1">This is your critic profile.</p>' : ''}
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mt-6">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Top 10 Games</h2>
        ${picks.length === 0 ? `
          <p class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">${isOwn ? 'Pick games from the library below to build your Top 10.' : 'No Top 10 yet.'}</p>
        ` : `
          <ol class="space-y-3">
            ${picks.map(p => `
              <li class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg" data-game-id="${p.game.id}">
                <span class="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${p.rank <= 3 ? 'bg-purple-600 text-white' : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300'}">${p.rank}</span>
                ${p.game.imageUrl ? `<img src="${p.game.imageUrl}" alt="" onerror="this.remove()" class="w-10 h-12 object-cover rounded shrink-0 hidden sm:block">` : ''}
                <a href="#/game/${p.game.id}" class="min-w-0 flex-1">
                  <p class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate hover:text-purple-600 dark:hover:text-purple-400 transition-colors">${p.game.title}</p>
                  <p class="text-xs text-gray-400 dark:text-gray-500 truncate">${genresText(p.game)}</p>
                </a>
                ${isOwn ? `
                  <div class="flex items-center gap-1 shrink-0">
                    <button data-move-up="${p.rank}" title="Move up" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" ${p.rank <= 1 ? 'disabled' : ''}><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"/></svg></button>
                    <button data-move-down="${p.rank}" title="Move down" class="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors" ${p.rank >= picks.length ? 'disabled' : ''}><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/></svg></button>
                    <button data-remove-pick="${p.game.id}" title="Remove" class="p-1 text-red-400 hover:text-red-600 transition-colors"><svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg></button>
                  </div>
                ` : ''}
              </li>
            `).join('')}
          </ol>
        `}
      </div>

      ${isOwn ? renderPicker(gameMap, pickedIds, picks.length) : ''}
    </div>
  `;

  const list = app.querySelector('ol');
  if (list && isOwn) {
    list.addEventListener('click', e => {
      const up = e.target.closest('[data-move-up]');
      const down = e.target.closest('[data-move-down]');
      const remove = e.target.closest('[data-remove-pick]');
      if (up) {
        const rank = Number(up.dataset.moveUp);
        moveTop10(critic.username, rank - 1, rank - 2);
        renderCritic(app, username);
      } else if (down) {
        const rank = Number(down.dataset.moveDown);
        moveTop10(critic.username, rank - 1, rank);
        renderCritic(app, username);
      } else if (remove) {
        removeFromTop10(critic.username, remove.dataset.removePick);
        renderCritic(app, username);
      }
    });
  }

  const picker = app.querySelector('#criticPicker');
  if (picker) {
    picker.addEventListener('click', e => {
      const add = e.target.closest('[data-add-pick]');
      if (add) {
        addToTop10(critic.username, add.dataset.addPick);
        renderCritic(app, username);
      }
    });
  }
}

function renderPicker(gameMap, pickedIds, currentCount) {
  const remaining = 10 - currentCount;
  const candidates = Object.keys(gameMap)
    .map(id => gameMap[id])
    .filter(g => !pickedIds.has(g.id));
  if (remaining <= 0) return '';

  return `
    <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 mt-6">
      <h2 class="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Add to Top 10</h2>
      <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">Pick ${remaining} more game${remaining !== 1 ? 's' : ''} from the library.</p>
      ${candidates.length === 0 ? '<p class="text-sm text-gray-400 dark:text-gray-500">No more games in the library to add.</p>' : `
        <div id="criticPicker" class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          ${candidates.map(g => `
            <button data-add-pick="${g.id}" class="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left">
              ${g.imageUrl ? `<img src="${g.imageUrl}" alt="" onerror="this.remove()" class="w-10 h-12 object-cover rounded shrink-0 hidden sm:block">` : ''}
              <span class="min-w-0">
                <span class="block font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">${g.title}</span>
                <span class="block text-xs text-gray-400 dark:text-gray-500 truncate">${genresText(g)}</span>
              </span>
            </button>
          `).join('')}
        </div>
      `}
    </div>
  `;
}
