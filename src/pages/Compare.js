import { getGames, getRatings } from '../db.js';
import { CRITERIA, computeFNS, scoreColor } from '../fns.js';

export function Compare(app) {
  const games = getGames();

  function gameData(gameId) {
    const game = games.find(g => g.id === gameId);
    if (!game) return null;
    const ratings = getRatings(gameId);
    const fnsRatings = ratings.map(r => computeFNS(r));
    const overall = fnsRatings.length > 0
      ? Math.round((fnsRatings.reduce((a, b) => a + b, 0) / fnsRatings.length) * 10) / 10
      : null;
    const criteriaKeys = CRITERIA.filter(c => ratings.some(r => r[c.key] != null));
    const averages = {};
    criteriaKeys.forEach(c => {
      const vals = ratings.map(r => r[c.key]).filter(v => v != null);
      averages[c.key] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : null;
    });
    return { game, overall, averages, criteriaKeys };
  }

  app.innerHTML = `
    <div class="fade-in max-w-4xl mx-auto">
      <a href="#/" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Library
      </a>

      <h1 class="text-3xl font-extrabold text-gray-900 dark:text-gray-100 mb-6">Compare Games</h1>

      <div class="grid sm:grid-cols-2 gap-3 mb-6">
        <select id="gameA" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Choose game...</option>
          ${games.map(g => `<option value="${g.id}">${g.title}</option>`).join('')}
        </select>
        <select id="gameB" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Choose game...</option>
          ${games.map(g => `<option value="${g.id}">${g.title}</option>`).join('')}
        </select>
      </div>

      <div id="compareTable"></div>
    </div>
  `;

  function render() {
    const container = document.getElementById('compareTable');
    const aId = document.getElementById('gameA').value;
    const bId = document.getElementById('gameB').value;

    if (!aId || !bId) {
      container.innerHTML = '<p class="text-center text-gray-400 dark:text-gray-500 py-8">Select two games to compare.</p>';
      return;
    }

    const A = gameData(aId);
    const B = gameData(bId);
    if (!A || !B) return;

    const keysA = A.criteriaKeys.map(c => c.key);
    const keysB = B.criteriaKeys.map(c => c.key);
    const usedKeys = [...new Set([...keysA, ...keysB])];
    const rows = CRITERIA.filter(c => usedKeys.includes(c.key));

    const cell = (val) => val == null ? '—' : val.toFixed(1);

    function winner(vA, vB) {
      if (vA != null && vB != null && vA !== vB) {
        return vA > vB ? 'left' : 'right';
      }
      return null;
    }

    const overallWinner = winner(A.overall, B.overall);

    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
        <table class="w-full text-sm min-w-[480px]">
          <thead>
            <tr class="bg-gray-50 dark:bg-gray-700/40">
              <th class="p-3 text-left font-semibold text-gray-500 dark:text-gray-400">Criterion</th>
              <th class="p-3 text-center font-bold text-gray-900 dark:text-gray-100">${A.game.title}</th>
              <th class="p-3 text-center font-bold text-gray-900 dark:text-gray-100">${B.game.title}</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-t border-gray-100 dark:border-gray-700">
              <td class="p-3 font-bold text-gray-900 dark:text-gray-100">FNS Score</td>
              <td class="p-3 text-center text-lg font-extrabold ${overallWinner === 'left' ? 'text-emerald-600 dark:text-emerald-400' : scoreColor(A.overall || 0)}">${cell(A.overall)}</td>
              <td class="p-3 text-center text-lg font-extrabold ${overallWinner === 'right' ? 'text-emerald-600 dark:text-emerald-400' : scoreColor(B.overall || 0)}">${cell(B.overall)}</td>
            </tr>
            ${rows.map(c => {
              const vA = A.averages[c.key];
              const vB = B.averages[c.key];
              const w = winner(vA, vB);
              const cls = cls => w === cls ? 'text-emerald-600 dark:text-emerald-400 font-bold' : 'text-gray-700 dark:text-gray-300';
              return `
                <tr class="border-t border-gray-100 dark:border-gray-700">
                  <td class="p-3 font-medium text-gray-700 dark:text-gray-300">${c.label}</td>
                  <td class="p-3 text-center ${cls('left')}">${cell(vA)}</td>
                  <td class="p-3 text-center ${cls('right')}">${cell(vB)}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  document.getElementById('gameA').addEventListener('change', render);
  document.getElementById('gameB').addEventListener('change', render);
}
