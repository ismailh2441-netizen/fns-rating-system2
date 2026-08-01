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

function buildTree(comments) {
  const byId = new Map();
  comments.forEach(c => byId.set(c.id, { ...c, children: [] }));
  const roots = [];
  byId.forEach(c => {
    if (c.parentId && byId.has(c.parentId)) byId.get(c.parentId).children.push(c);
    else roots.push(c);
  });
  byId.forEach(c => {
    c.children.sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
  });
  return roots;
}

function nodeMarkup(node, user, depth) {
  const isOwn = node.userId === user.id;
  const indent = depth > 0
    ? (depth <= 3 ? 'ml-6 sm:ml-8 border-l-2 border-gray-200 dark:border-gray-700 pl-3 sm:pl-4' : '')
    : '';
  const children = node.children.length
    ? node.children.map(k => nodeMarkup(k, user, depth + 1)).join('')
    : '';
  return `
    <div class="${indent}">
      <div class="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/40 rounded-lg">
        <div class="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center font-bold text-emerald-600 dark:text-emerald-400 text-xs shrink-0">${initials(node.userName)}</div>
        <div class="flex-1 min-w-0">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <div class="min-w-0">
              <span class="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">${escapeHtml(node.userName || 'Anonymous')}</span>
              <span class="text-xs text-gray-400 dark:text-gray-500 ml-2">${node.createdAt ? formatDate(node.createdAt) : ''}</span>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <button type="button" data-reply-to="${node.id}" class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 transition-colors">Reply</button>
              ${isOwn ? `<button type="button" data-delete-comment="${node.id}" class="text-xs font-medium text-red-500 hover:text-red-600 transition-colors">Delete</button>` : ''}
            </div>
          </div>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap break-words">${escapeHtml(node.body)}</p>
          <div data-reply-form="${node.id}" class="hidden mt-2">
            <textarea data-reply-body="${node.id}" rows="2" maxlength="500" placeholder="Write a reply..." class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"></textarea>
            <div class="mt-2 flex gap-2">
              <button type="button" data-submit-reply="${node.id}" class="px-3 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">Post Reply</button>
              <button type="button" data-cancel-reply="${node.id}" class="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      </div>
      ${children}
    </div>
  `;
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

  const all = getComments(game.id);
  const roots = buildTree(all);
  roots.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

  container.innerHTML = `
    <div class="fade-in">
      <div id="commentMessage"></div>
      <h2 id="commentCount" class="text-lg font-bold mb-4 text-gray-900 dark:text-gray-100">Comments (${all.length})</h2>
      <div id="commentList" class="space-y-3 mb-5">
        ${roots.length > 0
          ? roots.map(n => nodeMarkup(n, user, 0)).join('')
          : '<p class="text-sm text-gray-400 dark:text-gray-500 text-center py-4">No comments yet. Be the first to comment!</p>'}
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
    const delBtn = e.target.closest('[data-delete-comment]');
    if (delBtn) {
      if (confirm('Delete this comment and its replies?')) {
        try {
          deleteComment(delBtn.dataset.deleteComment);
        } catch {}
        CommentSection(container, game);
      }
      return;
    }

    const replyBtn = e.target.closest('[data-reply-to]');
    if (replyBtn) {
      const id = replyBtn.dataset.replyTo;
      const form = container.querySelector(`[data-reply-form="${id}"]`);
      if (form) {
        const isHidden = form.classList.contains('hidden');
        container.querySelectorAll('[data-reply-form]').forEach(f => f.classList.add('hidden'));
        form.classList.toggle('hidden', !isHidden);
        if (!isHidden) {
          const ta = form.querySelector(`[data-reply-body="${id}"]`);
          if (ta) ta.focus();
        }
      }
      return;
    }

    const cancelBtn = e.target.closest('[data-cancel-reply]');
    if (cancelBtn) {
      const form = container.querySelector(`[data-reply-form="${cancelBtn.dataset.cancelReply}"]`);
      if (form) form.classList.add('hidden');
      return;
    }

    const submitBtn = e.target.closest('[data-submit-reply]');
    if (submitBtn) {
      const id = submitBtn.dataset.submitReply;
      const ta = container.querySelector(`[data-reply-body="${id}"]`);
      const body = (ta && ta.value || '').trim();
      if (!body) {
        showMessage(container, 'Write a reply before posting.', 'error');
        return;
      }
      try {
        addComment({ gameId: game.id, userId: user.id, userName: user.name || 'Anonymous', body, parentId: id });
        showMessage(container, 'Reply posted!', 'success');
        CommentSection(container, game);
      } catch (err) {
        showMessage(container, err.message || 'Something went wrong posting your reply. Please try again.', 'error');
      }
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
