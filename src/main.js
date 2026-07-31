import { Navbar } from './components/Navbar.js';
import { Home } from './pages/Home.js';
import { GameDetail } from './pages/GameDetail.js';
import { AddGame } from './pages/AddGame.js';
import { MyRatings } from './pages/MyRatings.js';
import { Compare } from './pages/Compare.js';
import { initSync } from './sync.js';

const app = document.getElementById('app');

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
  } else {
    location.hash = '/';
  }
}

window.addEventListener('hashchange', router);
window.addEventListener('load', () => {
  Navbar();
  router();
  initSync();
});

window.addEventListener('fns:sync', router);
