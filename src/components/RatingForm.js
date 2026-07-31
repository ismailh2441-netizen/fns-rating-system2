import { getUserRating, saveRating, deleteRating } from '../db.js';
import { getUserId } from '../auth.js';
import { CRITERIA, activeCriteria } from '../fns.js';

function getColor(val) {
  if (val >= 8.5) return '#10b981';
  if (val >= 7) return '#3b82f6';
  if (val >= 5) return '#f59e0b';
  return '#ef4444';
}

function trackClass(val) {
  if (val >= 8.5) return 'bg-emerald-500';
  if (val >= 7) return 'bg-blue-500';
  if (val >= 5) return 'bg-amber-500';
  return 'bg-red-500';
}

function valueTextClass(val) {
  if (val >= 8.5) return 'text-emerald-600 dark:text-emerald-400';
  if (val >= 7) return 'text-blue-600 dark:text-blue-400';
  if (val >= 5) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-600 dark:text-red-400';
}

function defaultKeys(existing, game) {
  if (existing) {
    return CRITERIA.filter(c => existing[c.key] != null).map(c => c.key);
  }
  return activeCriteria(game).map(c => c.key);
}

function headerMarkup(crit, checked) {
  return `
    <label class="flex items-center gap-2 cursor-pointer select-none">
      <input type="checkbox" data-crit-toggle="${crit.key}" ${checked ? 'checked' : ''} class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500">
      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">${crit.label}</span>
    </label>
  `;
}

function sliderMarkup(crit, val) {
  const pct = ((val - 1) / 9) * 100;
  const color = getColor(val);
  return `
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs text-gray-400 dark:text-gray-500">Score</span>
      <span id="val_${crit.key}" class="text-sm font-bold ${valueTextClass(val)}">${val}</span>
    </div>
    <input type="range" min="1" max="10" step="0.5" value="${val}"
      name="${crit.key}"
      class="rating-slider w-full ${trackClass(val)}"
      style="background: linear-gradient(to right, ${color} ${pct}%, #e5e7eb ${pct}%)"
    >
  `;
}

function selectMarkup(crit, val) {
  const options = [];
  for (let i = 1; i <= 10; i += 0.5) {
    options.push(`<option value="${i}"${i === val ? ' selected' : ''}>${i}</option>`);
  }
  return `
    <div class="flex items-center justify-between mb-1">
      <span class="text-xs text-gray-400 dark:text-gray-500">Score</span>
      <span id="val_${crit.key}" class="text-sm font-bold ${valueTextClass(val)}">${val}</span>
    </div>
    <select name="${crit.key}" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
      ${options.join('')}
    </select>
  `;
}

function criteriaMarkup(existing, game, control) {
  const defaults = defaultKeys(existing, game);
  return CRITERIA.map(crit => {
    const checked = defaults.includes(crit.key);
    const val = existing && existing[crit.key] != null ? existing[crit.key] : 5;
    const body = control === 'select' ? selectMarkup(crit, val) : sliderMarkup(crit, val);
    return `
      <div data-criterion-row="${crit.key}">
        <div class="mb-1">
          ${headerMarkup(crit, checked)}
        </div>
        <div data-criterion-slider="${crit.key}" class="${checked ? '' : 'hidden'}">
          ${body}
        </div>
      </div>
    `;
  }).join('');
}

function renderForm(container, game, existing, control) {
  container.innerHTML = `
    <div class="fade-in">
      <div id="ratingMessage"></div>
      <h3 class="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">
        ${existing ? 'Your Rating' : 'Rate This Game'}
      </h3>
      <p class="text-xs text-gray-400 dark:text-gray-500 mb-4">Tick the criteria you want to rate. Your FNS score is the mean of the criteria you choose.</p>
      <form id="ratingForm" onsubmit="return false">
        <div class="space-y-4">
          ${criteriaMarkup(existing, game, control)}
        </div>
        <button type="submit" id="submitRatingBtn" class="w-full mt-4 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">
          ${existing ? 'Update Rating' : 'Submit Rating'}
        </button>
        ${existing ? '<button type="button" id="removeRatingBtn" class="w-full mt-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">Remove my rating</button>' : ''}
      </form>
      ${existing ? '<button type="button" id="resetRatingBtn" class="w-full mt-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Reset form</button>' : ''}
    </div>
  `;
}

function showMessage(msg, type) {
  const el = document.getElementById('ratingMessage');
  if (!el) return;
  const styles = type === 'success'
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  el.innerHTML = `<div class="mb-4 p-3 ${styles} rounded-lg text-sm font-medium text-center">${msg}</div>`;
}

export function RatingForm(container, game) {
  if (!container) return;

  let user;
  try {
    user = getUserId();
  } catch {
    user = { id: 'anon-' + Date.now(), name: 'Anonymous' };
  }

  let existing = null;
  try {
    existing = getUserRating(game.id, user.id);
  } catch {
    existing = null;
  }

  try {
    renderForm(container, game, existing, 'slider');
  } catch {
    renderForm(container, game, existing, 'select');
  }

  container.querySelectorAll('#ratingForm input[type="range"]').forEach(input => {
    input.addEventListener('input', function () {
      try {
        const val = parseFloat(this.value);
        const span = document.getElementById('val_' + this.name);
        if (span) {
          span.textContent = val;
          span.className = `text-sm font-bold ${valueTextClass(val)}`;
        }
        const pct = ((val - 1) / 9) * 100;
        const color = getColor(val);
        this.style.background = `linear-gradient(to right, ${color} ${pct}%, #e5e7eb ${pct}%)`;
      } catch {}
    });
  });

  container.querySelectorAll('#ratingForm input[data-crit-toggle]').forEach(cb => {
    cb.addEventListener('change', function () {
      const row = container.querySelector(`[data-criterion-slider="${this.dataset.critToggle}"]`);
      if (row) row.classList.toggle('hidden', !this.checked);
    });
  });

  container.addEventListener('submit', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const form = container.querySelector('#ratingForm');
    if (!form) return;

    const active = CRITERIA.filter(crit => {
      const cb = form.querySelector(`input[data-crit-toggle="${crit.key}"]`);
      return cb && cb.checked;
    });

    if (active.length === 0) {
      showMessage('Select at least one criterion to rate.', 'error');
      return;
    }

    const rating = {};
    active.forEach(crit => {
      const input = form.querySelector(`input[name="${crit.key}"]`);
      const v = input ? parseFloat(input.value) : 5;
      rating[crit.key] = isNaN(v) ? 5 : v;
    });

    try {
      saveRating({
        gameId: game.id,
        userId: user.id,
        userName: user.name,
        ...rating,
      });
      showMessage('Rating saved!', 'success');
      setTimeout(() => {
        if (!container.isConnected) return;
        if (typeof window.__onRatingChange === 'function') {
          window.__onRatingChange();
        }
      }, 600);
    } catch (err) {
      showMessage('Something went wrong saving your rating. Please try again.', 'error');
    }
  });

  const resetBtn = container.querySelector('#resetRatingBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      RatingForm(container, game);
    });
  }

  const removeBtn = container.querySelector('#removeRatingBtn');
  if (removeBtn) {
    removeBtn.addEventListener('click', () => {
      if (confirm('Remove your rating for this game?')) {
        try {
          deleteRating(game.id, user.id);
        } catch {}
        if (typeof window.__onRatingChange === 'function') {
          window.__onRatingChange();
        }
      }
    });
  }
}
