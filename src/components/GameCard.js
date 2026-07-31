import { scoreColor, initials } from '../fns.js';

const GRADIENTS = [
  ['#667eea', '#764ba2'],
  ['#f093fb', '#f5576c'],
  ['#4facfe', '#00f2fe'],
  ['#43e97b', '#38f9d7'],
  ['#fa709a', '#fee140'],
  ['#a18cd1', '#fbc2eb'],
  ['#fccb90', '#d57eeb'],
  ['#e0c3fc', '#8ec5fc'],
  ['#f5576c', '#ff6f91'],
  ['#667eea', '#43e97b'],
  ['#fc5c7d', '#6a82fb'],
  ['#30cfd0', '#330867'],
  ['#a8edea', '#fed6e3'],
  ['#ffecd2', '#fcb69f'],
  ['#89f7fe', '#66a6ff'],
];

export function GameCard(game, fnsScore, raterCount) {
  const idx = game.title.length % GRADIENTS.length;
  const [c1, c2] = GRADIENTS[idx];
  const initialsText = initials(game.title);
  const score = fnsScore || 0;
  const scoreClass = scoreColor(score);
  const year = game.year ? `<span class="text-xs text-gray-400 dark:text-gray-500 ml-1">${game.year}</span>` : '';

  return `
    <a href="#/game/${game.id}" class="block card-hover">
      <div class="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md border border-gray-200 dark:border-gray-700">
        <div class="h-36 flex items-center justify-center relative overflow-hidden" style="background: linear-gradient(135deg, ${c1}, ${c2})">
          <span class="text-4xl font-extrabold text-white/80 drop-shadow-lg">${initialsText}</span>
          ${game.imageUrl ? `<img src="${game.imageUrl}" alt="${game.title}" loading="lazy" class="absolute inset-0 w-full h-full object-cover" onerror="this.remove()">` : ''}
          ${game.isOpenWorld ? '<span class="absolute top-2 right-2 px-2 py-0.5 text-xs font-semibold bg-white/20 text-white rounded-full backdrop-blur-sm">Open World</span>' : ''}
        </div>
        <div class="p-4">
          <h3 class="font-bold text-gray-900 dark:text-gray-100 truncate">${game.title}</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">${game.genre}${year}</p>
          <div class="mt-3 flex items-end justify-between">
            <div>
              <span class="text-2xl font-extrabold ${scoreClass}">${score > 0 ? score.toFixed(1) : '—'}</span>
              ${score > 0 ? `<span class="text-xs text-gray-400 dark:text-gray-500">/10</span>` : ''}
              ${score > 0 ? `<span class="block text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mt-0.5">Master Rating</span>` : ''}
            </div>
            <span class="text-xs text-gray-400 dark:text-gray-500">${raterCount || 0} rating${raterCount !== 1 ? 's' : ''}</span>
          </div>
        </div>
      </div>
    </a>
  `;
}
