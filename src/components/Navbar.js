import { getTheme, toggleTheme } from '../theme.js';
import { getUserId, setUserName } from '../auth.js';
import { hasPin, isCoreUnlocked, unlockCore, lockCore, setPinAsync } from '../settings.js';

let navOpen = false;

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
        <div class="p-3 border-b border-gray-100 dark:border-gray-600">
          <label class="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Display Name</label>
          <input id="nameInput" type="text" value="${user.name}" class="w-full px-2 py-1 text-sm border rounded dark:bg-gray-600 dark:border-gray-500 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-indigo-500">
          <button id="nameSaveBtn" class="mt-2 w-full px-3 py-1.5 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700 transition-colors">Save</button>
        </div>
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

  document.getElementById('nameSaveBtn').addEventListener('click', () => {
    const name = document.getElementById('nameInput').value.trim();
    setUserName(name);
    Navbar();
    refreshRoute();
  });

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
