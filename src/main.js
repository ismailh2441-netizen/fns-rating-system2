import { Navbar } from './components/Navbar.js';
import { Home } from './pages/Home.js';
import { GameDetail } from './pages/GameDetail.js';
import { AddGame } from './pages/AddGame.js';
import { MyRatings } from './pages/MyRatings.js';
import { Compare } from './pages/Compare.js';
import { Critics } from './pages/Critics.js';
import { initSync } from './sync.js';
import { authReady, onAuthChange } from './auth.js';
import { initStatusBanner } from './components/StatusBanner.js';

const app = document.getElementById('app');

initStatusBanner();

function router() {
  const hash = location.hash.slice(1) || '/';

  if (hash === '/') {
    Home(app);
  } else if (hash.startsWith('/game/')) {
    const id = hash.split('/')[2];
    if (id) {
      GameDetail(app, id);
    } else {
      location.hash = '/';
    }
  } else if (hash === '/add') {
    AddGame(app);
  } else if (hash === '/my') {
    MyRatings(app);
  } else if (hash === '/compare') {
    Compare(app);
  } else if (hash === '/critics' || hash.startsWith('/critic/')) {
    Critics(app);
  } else {
    location.hash = '/';
  }
}

window.addEventListener('hashchange', router);

window.addEventListener('load', () => {
  // Render immediately from the data saved on this PC. Auth and network sync
  // run in the background so a slow/unreachable backend can never leave the
  // page blank.
  Navbar();
  router();

  authReady()
    .catch(() => null)
    .then(() => {
      Navbar();
      router();
    })
    .finally(() => {
      initSync().catch(err => console.warn('sync: init failed', err));
    });
});

window.addEventListener('fns:sync', router);

let lastAuthUserId = null;
onAuthChange((event, session) => {
  const id = session && session.user ? session.user.id : null;
  if (id !== lastAuthUserId) {
    lastAuthUserId = id;
    Navbar();
    router();
  }
});
