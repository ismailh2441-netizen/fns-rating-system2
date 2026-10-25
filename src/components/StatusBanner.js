import { isStorageAvailable } from '../storage.js';

// Small, non-blocking status messages fixed to the bottom of the screen.
// - Cloud sync failures are now visible instead of failing silently.
// - A warning is shown when the browser blocks site data, so users know
//   their changes are not being saved permanently.

let root = null;
let syncMessage = '';
let syncing = false;

function ensureRoot() {
  if (root && root.isConnected) return root;
  root = document.createElement('div');
  root.id = 'statusBanner';
  root.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:max-w-sm z-[60] flex flex-col gap-2 print:hidden';
  document.body.appendChild(root);
  return root;
}

function buildNote(titleText, bodyText, tone) {
  const colors = tone === 'amber'
    ? 'border-amber-300 bg-amber-50 dark:bg-amber-900/40 dark:border-amber-700 text-amber-900 dark:text-amber-100'
    : 'border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 text-gray-900 dark:text-gray-100';

  const note = document.createElement('div');
  note.className = `rounded-lg border px-4 py-3 shadow-lg ${colors}`;

  const title = document.createElement('p');
  title.className = 'text-sm font-semibold';
  title.textContent = titleText;
  note.appendChild(title);

  if (bodyText) {
    const body = document.createElement('p');
    body.className = 'mt-1 text-xs leading-relaxed break-words opacity-90';
    body.textContent = bodyText;
    note.appendChild(body);
  }

  return note;
}

function buildSyncNote(message, pending) {
  const note = document.createElement('div');
  note.className = 'flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/40 dark:border-amber-700 px-4 py-3 shadow-lg';

  const body = document.createElement('div');
  body.className = 'flex-1 min-w-0';
  const title = document.createElement('p');
  title.className = 'text-sm font-semibold text-amber-900 dark:text-amber-100';
  title.textContent = pending ? 'Reconnecting to cloud sync…' : 'Cloud sync unavailable';
  body.appendChild(title);

  if (!pending && message) {
    const copy = document.createElement('p');
    copy.className = 'mt-1 text-xs leading-relaxed break-words text-amber-800 dark:text-amber-200';
    copy.textContent = message;
    body.appendChild(copy);
  }
  note.appendChild(body);

  if (!pending) {
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.className = 'shrink-0 px-2.5 py-1 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded transition-colors';
    retry.textContent = 'Retry';
    retry.addEventListener('click', requestRetry);
    note.appendChild(retry);
  }

  return note;
}

function render() {
  const mount = ensureRoot();
  mount.replaceChildren();

  if (!isStorageAvailable()) {
    mount.appendChild(buildNote(
      'This browser is blocking site data',
      'Changes will only last until you close this tab. Allow cookies/site data for this site to keep your ratings.',
      'amber'
    ));
  }

  if (syncing) {
    mount.appendChild(buildSyncNote('', true));
  } else if (syncMessage) {
    mount.appendChild(buildSyncNote(syncMessage, false));
  }

  mount.classList.toggle('hidden', mount.childElementCount === 0);
}

function requestRetry() {
  if (syncing) return;
  syncing = true;
  render();
  window.dispatchEvent(new CustomEvent('fns:sync-retry'));
}

function onSyncStatus(event) {
  const detail = (event && event.detail) || {};
  if (detail.pending) {
    syncing = true;
    render();
    return;
  }
  syncing = false;
  syncMessage = detail.ok ? '' : (detail.message || 'Cloud sync is not available right now.');
  render();
}

export function initStatusBanner() {
  ensureRoot();
  window.addEventListener('fns:sync-status', onSyncStatus);
  window.addEventListener('online', () => {
    if (syncMessage && !syncing) requestRetry();
  });
  render();
}
