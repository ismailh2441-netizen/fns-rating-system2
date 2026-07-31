import { getTheme, toggleTheme } from '../theme.js';
import { getUserId, setUserName, isSignedIn, signInWithGoogle, signOut } from '../auth.js';
import { hasPin, isCoreUnlocked, unlockCore, lockCore, setPinAsync } from '../settings.js';

let navOpen = false;

function initials(name) {
  return String(name || '?').trim().split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

function refreshRoute() {
  window.dispatchEvent(new HashChangeEvent('hashchange'));
}

function setNav(open) {
  if (navOpen === open) return;
  navOpen = open;
  const menu = document.getElementById('userMenu');
  const btn = document.getElementById('userButton');
  if (menu) menu.classList.toggle('hidden', !open);
  if (btn) btn.setAttribute('aria-expanded', String(open));
  if (open) {
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onDocKey);
  } else {
    document.removeEventListener('click', onDocClick);
    document.removeEventListener('keydown', onDocKey);
  }
}

function onDocClick(e) {
  if (!e.target || !e.target.isConnected) return;
  const menu = document.getElementById('userMenu');
  const btn = document.getElementById('userButton');
  if (menu && btn && !menu.contains(e.target) && !btn.contains(e.target)) {
    setNav(false);
  }
}

function onDocKey(e) {
  if (e.key === 'Escape') setNav(false);
}

export function Navbar() {
  const container = document.getElementById('navbar');
  const user = getUserId();
  const signedIn = isSignedIn();
  const isDark = getTheme() === 'dark';
  const coreUnlocked = isCoreUnlocked();
  const hasCorePin = hasPin();

  container.innerHTML = `
    <nav class="relative sticky top-0 z-40 bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
      <div class="container mx-auto px-4">
        <div class="flex items-center justify-between h-16 gap-2">
          <a href="#/" class="flex items-center gap-2 text-xl font-extrabold tracking-tight shrink-0">
            <span class="bg-indigo-600 dark:bg-indigo-500 text-white px-2.5 py-1 rounded-lg">FNS</span>
            <span class="text-gray-800 dark:text-gray-100 hidden sm:inline">Rating System</span>
          </a>
          <div class="flex items-center gap-3 sm:gap-4 overflow-x-auto">
            <a href="#/" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">Home</a>
            <a href="#/my" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">My Ratings</a>
            <a href="#/compare" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">Compare</a>
            <a href="#/add" class="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors whitespace-nowrap">Add Game</a>
            <button id="themeToggle" class="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors shrink-0" title="Toggle theme">
              ${isDark ? '<svg class="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"/></svg>' : '<svg class="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"/></svg>'}
            </button>
            <button id="userButton" aria-expanded="${navOpen}" aria-haspopup="true" class="flex items-center gap-1.5 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors shrink-0">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/></svg>
              <span id="userName" class="max-w-[80px] truncate">${user.name}</span>
              ${coreUnlocked ? '<span class="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 rounded">CORE</span>' : ''}
            </button>
          </div>
        </div>
      </div>
      <div id="userMenu" class="absolute right-4 top-full mt-2 w-72 bg-white dark:bg-gray-700 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 ${navOpen ? '' : 'hidden'}">
        ${signedIn ? `
          <div class="p-3 border-b border-gray-100 dark:border-gray-600">
            <div class="flex items-center gap-2.5">
              <span class="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 text-xs shrink-0">${initials(user.name)}</span>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">${user.name}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 truncate">${user.email || 'Google account'}</p>
              </div>
            </div>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-2">Your ratings are linked to this Google account on all your devices.</p>
            <button id="signOutBtn" class="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded transition-colors">Sign out</button>
          </div>
        ` : `
          <div class="p-3 border-b border-gray-100 dark:border-gray-600">
            <div id="signInError" class="hidden mb-2 p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs rounded">Sign-in is not set up yet.</div>
            <button id="googleSignInBtn" class="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-500 transition-colors">
              <svg class="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.5 6.1 29.5 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.7l6.2 5.2C37.3 41.4 44 36.5 44 24c0-1.3-.1-2.6-.4-3.9z"/></svg>
              Sign in with Google
            </button>
            <p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">Optional. Sign in to keep your ratings on all your devices.</p>
          </div>
          <div class="p-3 border-b border-gray-100 dark:border-gray-600">
            <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
            <input id="nameInput" type="text" value="${user.name}" class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
            <button id="nameSaveBtn" class="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">Save</button>
          </div>
        `}
        <div class="p-3">
          <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">Core Mode</p>
          ${coreUnlocked ? `
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold text-emerald-600 dark:text-emerald-400">&#9679; Unlocked</span>
              <button id="lockCoreBtn" class="px-2 py-1 text-xs font-medium text-white bg-gray-500 hover:bg-gray-600 rounded transition-colors">Lock</button>
            </div>
            <input id="newPinInput" type="password" placeholder="New PIN" class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2">
            <button id="savePinBtn" class="w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">Change PIN</button>
          ` : `
            <div id="coreError" class="hidden mb-2 p-2 bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400 text-xs rounded">Wrong PIN</div>
            <input id="pinInput" type="password" placeholder="${hasCorePin ? 'Enter PIN' : 'Create a PIN'}" class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 mb-2">
            <button id="unlockCoreBtn" class="w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">${hasCorePin ? 'Unlock Core Mode' : 'Set PIN &amp; Unlock'}</button>
            ${hasCorePin ? '' : '<p class="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5">Anyone can set the PIN the first time.</p>'}
          `}
        </div>
      </div>
    </nav>
  `;

  document.getElementById('themeToggle').addEventListener('click', () => {
    toggleTheme();
    Navbar();
  });

  document.getElementById('userButton').addEventListener('click', () => {
    setNav(!navOpen);
  });

  document.getElementById('nameSaveBtn')?.addEventListener('click', () => {
    const name = document.getElementById('nameInput').value.trim();
    setUserName(name);
    Navbar();
    refreshRoute();
  });

  const googleBtn = document.getElementById('googleSignInBtn');
  if (googleBtn) {
    googleBtn.addEventListener('click', async () => {
      const err = document.getElementById('signInError');
      try {
        await signInWithGoogle();
      } catch (e) {
        if (err) {
          err.textContent = 'Sign-in is not set up yet. Ask Ismail to enable Google sign-in.';
          err.classList.remove('hidden');
        }
      }
    });
  }

  const signOutBtn = document.getElementById('signOutBtn');
  if (signOutBtn) {
    signOutBtn.addEventListener('click', async () => {
      try {
        await signOut();
      } catch (e) {
        console.error('auth: sign out failed', e);
      }
      Navbar();
      refreshRoute();
    });
  }

  const unlockBtn = document.getElementById('unlockCoreBtn');
  if (unlockBtn) {
    unlockBtn.addEventListener('click', async () => {
      const pin = document.getElementById('pinInput').value;
      const ok = await unlockCore(pin);
      if (ok) {
        Navbar();
        refreshRoute();
      } else {
        const err = document.getElementById('coreError');
        if (err) err.classList.remove('hidden');
      }
    });
  }

  const lockBtn = document.getElementById('lockCoreBtn');
  if (lockBtn) {
    lockBtn.addEventListener('click', () => {
      lockCore();
      Navbar();
      refreshRoute();
    });
  }

  const savePinBtn = document.getElementById('savePinBtn');
  if (savePinBtn) {
    savePinBtn.addEventListener('click', async () => {
      const newPin = document.getElementById('newPinInput').value;
      if (newPin) {
        await setPinAsync(newPin);
        Navbar();
        refreshRoute();
      }
    });
  }
}
