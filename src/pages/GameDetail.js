import { getGame, getRatings, updateGame, deleteGame, deleteRating } from '../db.js';
import { RatingForm } from '../components/RatingForm.js';
import { CommentSection } from '../components/CommentSection.js';
import { RadarChart } from '../components/RadarChart.js';
import { isCoreUnlocked } from '../settings.js';
import { getUserId } from '../auth.js';
import { computeFNS, scoreColor, barColor, CRITERIA, CRITERIA_SHORT, initials, formatDate } from '../fns.js';
import { processCoverFile } from '../cover.js';

const GENRES = ['Action RPG', 'FPS', 'Metroidvania', 'Roguelike', 'Battle Royale', 'Adventure', 'Platformer', 'Simulation', 'Strategy', 'Puzzle', 'Fighting', 'Racing', 'Sports', 'Horror', 'Other'];

export function GameDetail(app, id) {
  const game = getGame(id);
  if (!game) {
    location.hash = '/';
    return;
  }

  const user = getUserId();
  const coreUnlocked = isCoreUnlocked();
  const ratings = getRatings(id).sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  const fnsRatings = ratings.map(r => ({ ...r, fns: computeFNS(r) }));
  const overallScore = fnsRatings.length > 0
    ? Math.round((fnsRatings.reduce((s, r) => s + r.fns, 0) / fnsRatings.length) * 10) / 10
    : 0;

  const criteria = CRITERIA.filter(c => ratings.some(r => r[c.key] != null));
  const averages = {};
  criteria.forEach(c => {
    const vals = ratings.map(r => r[c.key]).filter(v => v != null);
    averages[c.key] = vals.length > 0 ? Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10 : 0;
  });

  const raterCount = fnsRatings.length;

  app.innerHTML = `
    <div class="fade-in max-w-5xl mx-auto">
      <a href="#/" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Library
      </a>

      <div class="grid gap-6 lg:grid-cols-3">
      <div class="lg:col-span-2 space-y-6">
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex flex-col sm:flex-row sm:items-start gap-4">
          ${game.imageUrl ? `<img src="${game.imageUrl}" alt="${game.title}" onerror="this.remove()" class="w-28 h-36 object-cover rounded-lg shadow shrink-0 hidden sm:block">` : ''}
          <div class="flex-1">
            <div class="flex items-center gap-3 flex-wrap">
              <h1 class="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-gray-100">${game.title}</h1>
              ${game.isOpenWorld ? '<span class="px-2.5 py-0.5 text-xs font-semibold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full">Open World</span>' : ''}
              ${game.year ? `<span class="px-2.5 py-0.5 text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">${game.year}</span>` : ''}
            </div>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">${game.genre}</p>
            ${game.description ? `<p class="text-sm text-gray-600 dark:text-gray-300 mt-3">${game.description}</p>` : ''}
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-3">${raterCount} rating${raterCount !== 1 ? 's' : ''}</p>
          </div>
          <div class="text-center shrink-0">
            <div class="text-5xl font-extrabold ${scoreColor(overallScore)}">${overallScore > 0 ? overallScore.toFixed(1) : '—'}</div>
            <div class="text-xs text-gray-400 dark:text-gray-500">Master Rating</div>
            <div class="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">Mean of ${raterCount} individual rating${raterCount !== 1 ? 's' : ''}</div>
            ${coreUnlocked ? `
              <div class="mt-4 flex gap-2">
                <button id="editGameBtn" class="px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors">Edit</button>
                <button id="deleteGameBtn" class="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">Delete</button>
              </div>
            ` : ''}
          </div>
        </div>
      </div>

      <div id="editContainer"></div>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <div id="ratingFormContainer"></div>
      </div>

      ${raterCount > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Criteria Radar</h2>
          ${RadarChart(criteria.map(c => CRITERIA_SHORT[c.key] || c.label), criteria.map(c => averages[c.key]))}
        </div>
      ` : ''}

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Criteria Breakdown</h2>
        ${raterCount > 0 ? `
          <div class="space-y-3">
            ${criteria.map(c => {
              const avg = averages[c.key];
              const pct = (avg / 10) * 100;
              return `
                <div>
                  <div class="flex items-center justify-between text-sm mb-1">
                    <span class="font-medium text-gray-700 dark:text-gray-300">${c.label}</span>
                    <span class="font-bold ${scoreColor(avg)}">${avg.toFixed(1)}</span>
                  </div>
                  <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 overflow-hidden">
                    <div class="h-full rounded-full transition-all duration-500" style="width: ${pct}%; background: ${barColor(avg)}"></div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        ` : `
          <p class="text-sm text-gray-400 dark:text-gray-500 text-center py-8">No ratings yet. Be the first to rate using the form above!</p>
        `}
      </div>

      </div>

      ${raterCount > 0 ? `
        <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 h-fit">
          <h2 class="text-lg font-bold mb-1 text-gray-900 dark:text-gray-100">Individual Ratings</h2>
          <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">Each rater's own score</p>
          <div id="ratingsList" class="space-y-4">
            ${fnsRatings.map(r => {
              const isOwn = r.userId === user.id;
              return `
                <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
                  <div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-sm shrink-0">${initials(r.userName)}</div>
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center justify-between gap-2">
                      <div class="min-w-0">
                        <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">${r.userName || 'Anonymous'}</span>
                        <span class="text-xs text-gray-400 dark:text-gray-500 ml-2">${r.updatedAt ? formatDate(r.updatedAt) : ''}</span>
                      </div>
                      <div class="flex items-center gap-3 shrink-0">
                        <span class="text-sm font-bold ${scoreColor(r.fns)}">${r.fns.toFixed(1)}</span>
                        ${isOwn ? `<button data-remove-rating="${r.userId}" class="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>` : ''}
                      </div>
                    </div>
                    <div class="mt-2 flex flex-wrap gap-1.5">
                      ${criteria.map(c => {
                        const v = r[c.key];
                        if (v == null) return '';
                        return `<span class="px-2 py-0.5 text-xs rounded-full bg-white dark:bg-gray-600/60 border border-gray-200 dark:border-gray-500 text-gray-600 dark:text-gray-300">${CRITERIA_SHORT[c.key] || c.label}: ${v}</span>`;
                      }).join('')}
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6 lg:col-span-3">
        <div id="commentSectionContainer"></div>
      </div>

      </div>
    </div>
  `;

  window.__onRatingChange = () => { GameDetail(app, id); };

  RatingForm(document.getElementById('ratingFormContainer'), game);
  CommentSection(document.getElementById('commentSectionContainer'), game);

  if (coreUnlocked) {
    document.getElementById('editGameBtn').addEventListener('click', () => {
      renderEditForm(game);
    });
    document.getElementById('deleteGameBtn').addEventListener('click', () => {
      if (confirm(`Delete "${game.title}" and all its ratings?`)) {
        deleteGame(id);
        location.hash = '/';
      }
    });
  }

  const ratingsList = document.getElementById('ratingsList');
  if (ratingsList) {
    ratingsList.addEventListener('click', e => {
      const btn = e.target.closest('[data-remove-rating]');
      if (!btn) return;
      if (confirm('Remove your rating?')) {
        deleteRating(game.id, btn.dataset.removeRating);
        GameDetail(app, id);
      }
    });
  }

  function renderEditForm(gameRef) {
    const container = document.getElementById('editContainer');
    container.innerHTML = `
      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-indigo-300 dark:border-indigo-800 p-6 mb-6 fade-in">
        <h2 class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Edit Game</h2>
        <form id="editGameForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Game Title</label>
            <input type="text" id="editTitle" value="${gameRef.title}" required class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div class="grid sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genre</label>
              <select id="editGenre" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
                ${GENRES.map(g => `<option value="${g}"${g === gameRef.genre ? ' selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <input type="number" id="editYear" value="${gameRef.year || ''}" min="1970" max="2100" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image</label>
            <div id="editCoverPreviewWrap" class="hidden mb-2">
              <img id="editCoverPreview" alt="Cover preview" class="h-32 w-auto rounded-lg shadow border border-gray-200 dark:border-gray-600">
            </div>
            <input type="file" id="editCoverUpload" accept="image/*"
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700">
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-2">Upload from your computer, or paste a URL below.</p>
            <input type="url" id="editImageUrl" value="${gameRef.imageUrl || ''}" placeholder="https://..." class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <div id="editCoverError" class="hidden mt-2 p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs rounded"></div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea id="editDescription" rows="3" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">${gameRef.description || ''}</textarea>
          </div>
          <div class="flex items-center gap-3">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="editOpenWorld" class="sr-only peer" ${gameRef.isOpenWorld ? 'checked' : ''}>
              <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Open World</span>
          </div>
          <div class="flex gap-2">
            <button type="submit" class="flex-1 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">Save Changes</button>
            <button type="button" id="cancelEditBtn" class="px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
          </div>
        </form>
      </div>
    `;

    const editCoverUpload = document.getElementById('editCoverUpload');
    const editCoverPreview = document.getElementById('editCoverPreview');
    const editCoverPreviewWrap = document.getElementById('editCoverPreviewWrap');
    const editCoverError = document.getElementById('editCoverError');
    const editImageUrl = document.getElementById('editImageUrl');
    let editCoverData = gameRef.imageUrl || '';
    if (editCoverData) showEditCoverPreview(editCoverData);

    function showEditCoverPreview(url) {
      if (url) {
        editCoverPreview.src = url;
        editCoverPreviewWrap.classList.remove('hidden');
      } else {
        editCoverPreviewWrap.classList.add('hidden');
        editCoverPreview.removeAttribute('src');
      }
    }

    editCoverUpload.addEventListener('change', async () => {
      editCoverError.classList.add('hidden');
      const file = editCoverUpload.files[0];
      if (!file) return;
      try {
        const dataUrl = await processCoverFile(file);
        editCoverData = dataUrl;
        editImageUrl.value = '';
        showEditCoverPreview(dataUrl);
      } catch (err) {
        editCoverData = '';
        showEditCoverPreview('');
        editCoverError.textContent = err.message;
        editCoverError.classList.remove('hidden');
      }
    });

    editImageUrl.addEventListener('input', () => {
      editCoverData = '';
      showEditCoverPreview(editImageUrl.value);
    });

    document.getElementById('editGameForm').addEventListener('submit', function (e) {
      e.preventDefault();
      const data = {
        title: document.getElementById('editTitle').value.trim(),
        genre: document.getElementById('editGenre').value,
        year: document.getElementById('editYear').value || '',
        imageUrl: editCoverData || editImageUrl.value.trim(),
        description: document.getElementById('editDescription').value.trim(),
        isOpenWorld: document.getElementById('editOpenWorld').checked,
      };
      if (data.title) {
        try {
          updateGame(gameRef.id, data);
          GameDetail(app, id);
        } catch (err) {
          editCoverError.textContent = err.message || 'Could not save the changes.';
          editCoverError.classList.remove('hidden');
        }
      }
    });

    document.getElementById('cancelEditBtn').addEventListener('click', () => {
      container.innerHTML = '';
    });
  }
}
