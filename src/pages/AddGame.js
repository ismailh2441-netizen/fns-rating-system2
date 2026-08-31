import { addGame, findGameByTitle } from '../db.js';
import { normalizeTitle, normalizeCoverUrl } from '../util.js';
import { processCoverFile } from '../cover.js';
import { GENRES, PLATFORM_OPTIONS } from '../fns.js';

export function AddGame(app) {
  app.innerHTML = `
    <div class="fade-in max-w-lg mx-auto">
      <a href="#/" class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4 transition-colors">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/></svg>
        Back to Library
      </a>

      <div class="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">Add New Game</h1>
        <form id="addGameForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Game Title</label>
            <input type="text" id="titleInput" required
              class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="e.g. Red Dead Redemption 2">
            <div id="dupWarning" class="hidden mt-2 p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
              This game is already added. <a id="dupLink" href="#" class="font-semibold underline">View it here</a>
            </div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Genres</label>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-1">
              ${GENRES.map(g => `
                <label class="flex items-center gap-2 cursor-pointer select-none">
                  <input type="checkbox" data-genre="${g}" class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500">
                  <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${g}</span>
                </label>
              `).join('')}
            </div>
            <div id="genreError" class="hidden mt-2 p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs rounded">Select at least one genre.</div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
            <input type="number" id="yearInput" min="1970" max="2100" placeholder="e.g. 2023"
              class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cover Image</label>
            <div id="coverPreviewWrap" class="hidden mb-2">
              <img id="coverPreview" alt="Cover preview" class="h-32 w-auto rounded-lg shadow border border-gray-200 dark:border-gray-600">
            </div>
            <input type="file" id="coverUpload" accept="image/*"
              class="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-3 file:px-3 file:py-1.5 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-600 file:text-white hover:file:bg-indigo-700">
            <p class="text-xs text-gray-400 dark:text-gray-500 mt-1 mb-2">Upload from your computer, or paste a URL below.</p>
            <input type="url" id="imageUrlInput" placeholder="https://..."
              class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <div id="coverError" class="hidden mt-2 p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs rounded"></div>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea id="descInput" rows="3" placeholder="A short description of the game..."
              class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
          </div>
          <div class="flex items-center gap-3">
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" id="openWorldCheck" class="sr-only peer">
              <div class="w-9 h-5 bg-gray-300 dark:bg-gray-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Open World</span>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Platforms</label>
            <div class="space-y-3 mt-1">
              ${PLATFORM_OPTIONS.map(name => {
                const key = name.toLowerCase();
                return `
                  <div class="flex items-center justify-between border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2">
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${name}</span>
                    <div class="flex gap-4">
                      <label class="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" data-platform="${key}-single" class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500">
                        <span class="text-xs text-gray-600 dark:text-gray-300">Single-player</span>
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer select-none">
                        <input type="checkbox" data-platform="${key}-multiplayer" class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500">
                        <span class="text-xs text-gray-600 dark:text-gray-300">Multiplayer</span>
                      </label>
                    </div>
                  </div>
                `;
              }).join('')}
            </div>
          </div>
          <button type="submit" id="addGameBtn" class="w-full px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
            Add Game
          </button>
        </form>
      </div>
    </div>
  `;

  const titleInput = document.getElementById('titleInput');
  const dupWarning = document.getElementById('dupWarning');
  const dupLink = document.getElementById('dupLink');
  const addBtn = document.getElementById('addGameBtn');
  const coverUpload = document.getElementById('coverUpload');
  const coverPreview = document.getElementById('coverPreview');
  const coverPreviewWrap = document.getElementById('coverPreviewWrap');
  const coverError = document.getElementById('coverError');
  const imageUrlInput = document.getElementById('imageUrlInput');
  let coverData = '';

  function showCoverPreview(url) {
    if (url) {
      coverPreview.src = url;
      coverPreviewWrap.classList.remove('hidden');
    } else {
      coverPreviewWrap.classList.add('hidden');
      coverPreview.removeAttribute('src');
    }
  }

  coverUpload.addEventListener('change', async () => {
    coverError.classList.add('hidden');
    const file = coverUpload.files[0];
    if (!file) return;
    try {
      const dataUrl = await processCoverFile(file);
      coverData = dataUrl;
      imageUrlInput.value = '';
      showCoverPreview(dataUrl);
    } catch (err) {
      coverData = '';
      showCoverPreview('');
      coverError.textContent = err.message;
      coverError.classList.remove('hidden');
    }
  });

  imageUrlInput.addEventListener('input', () => {
    coverData = '';
    showCoverPreview(normalizeCoverUrl(imageUrlInput.value));
  });

  function checkDuplicate() {
    const title = titleInput.value.trim();
    if (!normalizeTitle(title)) {
      dupWarning.classList.add('hidden');
      addBtn.disabled = false;
      return;
    }
    const existing = findGameByTitle(title);
    if (existing) {
      dupWarning.classList.remove('hidden');
      dupLink.href = '#/game/' + existing.id;
      addBtn.disabled = true;
    } else {
      dupWarning.classList.add('hidden');
      addBtn.disabled = false;
    }
  }

  titleInput.addEventListener('input', checkDuplicate);

  document.getElementById('addGameForm').addEventListener('submit', function (e) {
    e.preventDefault();
    const title = titleInput.value.trim();
    const genres = [...document.querySelectorAll('[data-genre]:checked')].map(cb => cb.value);
    const genreError = document.getElementById('genreError');
    if (genres.length === 0) {
      genreError.classList.remove('hidden');
      return;
    }
    genreError.classList.add('hidden');
    const year = document.getElementById('yearInput').value;
    const imageUrl = coverData || normalizeCoverUrl(imageUrlInput.value);
    const description = document.getElementById('descInput').value.trim();
    const isOpenWorld = document.getElementById('openWorldCheck').checked;
    const platforms = {};
    PLATFORM_OPTIONS.forEach(name => {
      const key = name.toLowerCase();
      platforms[key] = {
        single: document.querySelector(`[data-platform="${key}-single"]`).checked,
        multiplayer: document.querySelector(`[data-platform="${key}-multiplayer"]`).checked,
      };
    });

    if (!title) return;

    const existing = findGameByTitle(title);
    if (existing) {
      location.hash = '#/game/' + existing.id;
      return;
    }

    let game;
    try {
      game = addGame({ title, genres, isOpenWorld, year, description, imageUrl, platforms });
    } catch (err) {
      coverError.textContent = err.message || 'Could not save the game.';
      coverError.classList.remove('hidden');
      return;
    }
    location.hash = '#/game/' + game.id;
  });
}
