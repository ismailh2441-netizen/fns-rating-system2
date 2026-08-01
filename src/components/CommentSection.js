import { getComments, addComment, deleteComment } from '../db.js';
import { getUserId } from '../auth.js';
import { initials, formatDate } from '../fns.js';

function escapeHtml(str) {
  return String(str == null ? '' : str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function commentMarkup(c, user) {
  const isOwn = c.userId === user.id;
  return `
    <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
      <div class="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-sm shrink-0">${initials(c.userName)}</div>
      <div class="flex-1 min-w-0">
        <div class="flex items-center justify-between gap-2">
          <div class="min-w-0">
            <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">${escapeHtml(c.userName || 'Anonymous')}</span>
            <span class="text-xs text-gray-400 dark:text-gray-500 ml-2">${c.createdAt ? formatDate(c.createdAt) : ''}</span>
          </div>
          ${isOwn ? `<button data-delete-comment="${c.id}" class="text-xs font-medium text-red-500 hover:text-red-600 transition-colors shrink-0">Delete</button>` : ''}
        </div>
        <p class="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">${escapeHtml(c.body)}</p>
      </div>
    </div>
  `;
}

function renderList(container, game, user) {
  const listEl = container.querySelector('#commentList');
  if (!listEl) return;
  const comments = getComments(game.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  listEl.innerHTML = comments.length > 0
    ? comments.map(c => commentMarkup(c, user)).join('')
    : '<p class="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>';
  const countEl = container.querySelector('#commentCount');
  if (countEl) countEl.textContent = `Comments (${comments.length})`;
}

function showMessage(container, msg, type) {
  const el = container.querySelector('#commentMessage');
  if (!el) return;
  const styles = type === 'success'
    ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
    : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
  el.innerHTML = `<div class="mb-4 p-3 ${styles} rounded-lg text-sm font-medium text-center">${msg}</div>`;
}

export function CommentSection(container, game) {
  if (!container) return;

  let user;
  try {
    user = getUserId();
  } catch {
    user = { id: 'anon-' + Date.now(), name: 'Anonymous' };
  }

  const comments = getComments(game.id).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  container.innerHTML = `
    <div class="fade-in">
      <div id="commentMessage"></div>
      <h2 id="commentCount" class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Comments (${comments.length})</h2>
      <div id="commentList" class="space-y-3 mb-5">
        ${comments.map(c => commentMarkup(c, user)).join('') || '<p class="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>'}
      </div>
      <form id="commentForm" onsubmit="return false" class="border-t border-gray-200 dark:border-gray-700 pt-4">
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your name</label>
          <input type="text" id="commentName" value="${escapeHtml(user.name || 'Anonymous')}" maxlength="30" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        </div>
        <div class="mb-3">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comment</label>
          <textarea id="commentBody" rows="3" maxlength="500" placeholder="Share your thoughts..." class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
        </div>
        <button type="submit" id="submitCommentBtn" class="w-full sm:w-auto px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">Post Comment</button>
      </form>
    </div>
  `;

  container.addEventListener('click', e => {
    const btn = e.target.closest('[data-delete-comment]');
    if (!btn) return;
    if (confirm('Delete this comment?')) {
      try {
        deleteComment(btn.dataset.deleteComment);
      } catch {}
      CommentSection(container, game);
    }
  });

  container.addEventListener('submit', e => {
    const form = e.target.closest('#commentForm');
    if (!form) return;
    e.preventDefault();
    e.stopPropagation();
    const nameEl = container.querySelector('#commentName');
    const bodyEl = container.querySelector('#commentBody');
    const name = (nameEl.value || '').trim() || user.name || 'Anonymous';
    const body = (bodyEl.value || '').trim();
    if (!body) {
      showMessage(container, 'Write a comment before posting.', 'error');
      return;
    }
    try {
      addComment({ gameId: game.id, userId: user.id, userName: name, body });
      showMessage(container, 'Comment posted!', 'success');
      CommentSection(container, game);
    } catch (err) {
      showMessage(container, err.message || 'Something went wrong posting your comment. Please try again.', 'error');
    }
  });
}
