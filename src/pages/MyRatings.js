import { getGames, getAllRatings, deleteRating } from '../db.js';
import { getUserId } from '../auth.js';
import { CRITERIA, scoreColor, CRITERIA_SHORT, formatDate } from '../fns.js';

export function MyRatings(app) {
  const user = getUserId();
  const ratings = getAllRatings().filter(r => r.userId === user.id);
  const games = getGames();
  const gameMap = {};
  games.forEach(g => { gameMap[g.id] = g; });

  const rows = ratings
    .map(r => ({ rating: r, game: gameMap[r.gameId] }))
    .filter(r => r.game)
    .sort((a, b) => (b.rating.updatedAt || 0) - (a.rating.updatedAt || 0));

  app.innerHTML = `
    <div class="fade-in max-w-4xl mx-auto">
      <a href="#/" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Library
      </a>

      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-2">My Ratings</h1>
      <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">${rows.length} rating${rows.length !== 1 ? 's' : ''} by ${user.name}</p>

      ${rows.length === 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p class="text-gray-400 dark:text-gray-500">You haven't rated any games yet.</p>
          <a href="#/" class="inline-block mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors">Browse Games</a>
        </div>
      ` : `
        <div class="space-y-4">
          ${rows.map(({ rating, game }) => {
            const criteria = CRITERIA.filter(c => rating[c.key] != null);
            return `
              <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
                <div class="flex items-center justify-between gap-3 flex-wrap">
                  <div class="min-w-0">
                    <a href="#/game/${game.id}" class="font-bold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">${game.title}</a>
                    <p class="text-xs text-gray-400 dark:text-gray-500 mt-0.5">${game.genre} · updated ${rating.updatedAt ? formatDate(rating.updatedAt) : '—'}</p>
                  </div>
                  <div class="flex items-center gap-4 shrink-0">
                    <span class="text-2xl font-extrabold ${scoreColor(rating.average)}">${rating.average.toFixed(1)}</span>
                    <button data-remove="${game.id}" class="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Remove</button>
                  </div>
                </div>
                <div class="mt-3 flex flex-wrap gap-1.5">
                  ${criteria.map(c => {
                    const v = rating[c.key];
                    if (v == null) return '';
                    return `<span class="px-2 py-0.5 text-xs rounded-full bg-gray-100 dark:bg-gray-700/60 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300">${CRITERIA_SHORT[c.key] || c.label}: ${v}</span>`;
                  }).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      `}
    </div>
  `;

  const removeButtons = document.querySelectorAll('[data-remove]');
  removeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Remove your rating for this game?')) {
        deleteRating(btn.dataset.remove, user.id);
        MyRatings(app);
      }
    });
  });
}
