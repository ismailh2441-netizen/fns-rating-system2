import { setUserName, signInWithGoogle } from '../auth.js';

const GOOGLE_SVG = '<svg class="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C37.3 41.4 44 36.5 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>';

export function openNameGate({ onDone } = {}) {
  const existing = document.getElementById('nameGateModal');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'nameGateModal';
  overlay.innerHTML = `
    <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60" id="nameGateBackdrop">
      <div class="w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 fade-in">
        <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">Set your name to continue</h2>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">You need a name before you can rate. Sign in with Google or set a display name.</p>
        <div id="nameGateError" class="hidden mb-3 p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs rounded">Sign-in is not set up yet.</div>
        <button id="nameGateGoogleBtn" class="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm font-semibold text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
          ${GOOGLE_SVG}
          Sign in with Google
        </button>
        <div class="flex items-center gap-3 my-4">
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
          <span class="text-xs text-gray-400 dark:text-gray-500">or</span>
          <div class="flex-1 h-px bg-gray-200 dark:bg-gray-600"></div>
        </div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" for="nameGateInput">Display Name</label>
        <input id="nameGateInput" type="text" maxlength="30" placeholder="Your name" class="w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <button id="nameGateContinueBtn" class="w-full mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg transition-colors">Continue</button>
        <button id="nameGateCancelBtn" class="w-full mt-2 px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">Cancel</button>
      </div>
    </div>
  `;

  function close() {
    overlay.remove();
    document.body.classList.remove('overflow-hidden');
  }

  function succeed() {
    close();
    if (typeof onDone === 'function') onDone(true);
  }

  overlay.querySelector('#nameGateBackdrop').addEventListener('click', e => {
    if (e.target.id === 'nameGateBackdrop') close();
  });

  overlay.querySelector('#nameGateCancelBtn').addEventListener('click', close);

  overlay.querySelector('#nameGateGoogleBtn').addEventListener('click', async () => {
    const err = overlay.querySelector('#nameGateError');
    try {
      await signInWithGoogle();
      succeed();
    } catch {
      err.textContent = 'Sign-in is not set up yet. Ask Ismail to enable Google sign-in.';
      err.classList.remove('hidden');
    }
  });

  const input = overlay.querySelector('#nameGateInput');
  overlay.querySelector('#nameGateContinueBtn').addEventListener('click', () => {
    const name = input.value.trim();
    if (!name) {
      input.focus();
      return;
    }
    try {
      setUserName(name);
    } catch {}
    succeed();
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') overlay.querySelector('#nameGateContinueBtn').click();
  });

  overlay.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });

  document.body.appendChild(overlay);
  document.body.classList.add('overflow-hidden');
  input.focus();
}
