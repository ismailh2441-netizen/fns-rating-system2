import { getGames, getAllRatings } from '../db.js';
import { GameCard } from '../components/GameCard.js';
import { computeFNS } from '../fns.js';

export function Home(app) {
  const games = getGames();
  const allRatings = getAllRatings();

  const gameScores = {};
  const gameRaterCount = {};
  games.forEach(g => { gameScores[g.id] = 0; gameRaterCount[g.id] = 0; });

  const ratingsByGame = {};
  allRatings.forEach(r => {
    if (!ratingsByGame[r.gameId]) ratingsByGame[r.gameId] = [];
    ratingsByGame[r.gameId].push(r);
  });

  games.forEach(g => {
    const ratings = ratingsByGame[g.id] || [];
    if (ratings.length > 0) {
      gameScores[g.id] = ratings.reduce((sum, r) => sum + computeFNS(r), 0) / ratings.length;
      gameRaterCount[g.id] = ratings.length;
    }
  });

  const genres = [...new Set(games.map(g => g.genre))].sort();

  const state = { search: '', genre: 'All', world: 'All', sort: 'top' };

  function filteredGames() {
    const list = games.filter(g => {
      if (state.search && !g.title.toLowerCase().includes(state.search)) return false;
      if (state.genre !== 'All' && g.genre !== state.genre) return false;
      if (state.world === 'open' && !g.isOpenWorld) return false;
      if (state.world === 'linear' && g.isOpenWorld) return false;
      return true;
    });
    const score = id => gameScores[id] || 0;
    const count = id => gameRaterCount[id] || 0;
    switch (state.sort) {
      case 'az': list.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'za': list.sort((a, b) => b.title.localeCompare(a.title)); break;
      case 'most': list.sort((a, b) => count(b.id) - count(a.id)); break;
      case 'newest': list.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); break;
      default: list.sort((a, b) => score(b.id) - score(a.id));
    }
    return list;
  }

  function renderGrid() {
    const grid = document.getElementById('gameGrid');
    const list = filteredGames();
    if (list.length === 0) {
      grid.innerHTML = '<p class="col-span-full text-center text-gray-400 dark:text-gray-500 py-12">No games match your filters.</p>';
      return;
    }
    grid.innerHTML = list.map(g => GameCard(g, Math.round(gameScores[g.id] * 10) / 10, gameRaterCount[g.id])).join('');
  }

  app.innerHTML = `
    <div class="fade-in">
      <div class="flex flex-col gap-3 mb-6">
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-100">Game Library</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${games.length} games · ${allRatings.length} total ratings</p>
          </div>
          <a href="#/add" class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors text-center">+ Add Game</a>
        </div>
        <div class="flex flex-col sm:flex-row gap-2">
          <input id="searchInput" type="text" placeholder="Search games..." class="flex-1 px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <div class="flex gap-2 flex-wrap">
            <select id="genreFilter" class="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="All">All Genres</option>
              ${genres.map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
            <select id="worldFilter" class="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="All">All Worlds</option>
              <option value="open">Open World</option>
              <option value="linear">Linear</option>
            </select>
            <select id="sortSelect" class="px-3 py-2 text-sm border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="top">Top Rated</option>
              <option value="az">A to Z</option>
              <option value="za">Z to A</option>
              <option value="most">Most Rated</option>
              <option value="newest">Newest</option>
            </select>
          </div>
        </div>
      </div>
      <div id="gameGrid" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"></div>
    </div>
  `;

  document.getElementById('searchInput').addEventListener('input', function () {
    state.search = this.value.toLowerCase().trim();
    renderGrid();
  });

  document.getElementById('genreFilter').addEventListener('change', function () {
    state.genre = this.value;
    renderGrid();
  });

  document.getElementById('worldFilter').addEventListener('change', function () {
    state.world = this.value;
    renderGrid();
  });

  document.getElementById('sortSelect').addEventListener('change', function () {
    state.sort = this.value;
    renderGrid();
  });

  renderGrid();
}
