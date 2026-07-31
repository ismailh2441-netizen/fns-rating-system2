export function RadarChart(labels, values) {
  const n = labels.length;
  if (n === 0) return '';
  const size = 340;
  const cx = size / 2;
  const cy = size / 2;
  const r = 115;

  const point = (value, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const rad = (value / 10) * r;
    return [cx + rad * Math.cos(angle), cy + rad * Math.sin(angle)];
  };

  let rings = '';
  [0.25, 0.5, 0.75, 1].forEach(p => {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const [x, y] = point(10 * p, i);
      pts.push(x.toFixed(1) + ',' + y.toFixed(1));
    }
    rings += `<polygon points="${pts.join(' ')}" fill="none" stroke="#e5e7eb" class="dark:stroke-gray-700" stroke-width="1"/>`;
  });

  let axes = '';
  for (let i = 0; i < n; i++) {
    const [x, y] = point(10, i);
    axes += `<line x1="${cx}" y1="${cy}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" stroke="#e5e7eb" class="dark:stroke-gray-700" stroke-width="1"/>`;
  }

  const valPts = values.map((v, i) => {
    const [x, y] = point(v, i);
    return x.toFixed(1) + ',' + y.toFixed(1);
  });
  const polygon = `<polygon points="${valPts.join(' ')}" fill="rgba(99,102,241,0.25)" stroke="#6366f1" stroke-width="2"/>`;

  const dots = values.map((v, i) => {
    const [x, y] = point(v, i);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" fill="#6366f1"/>`;
  }).join('');

  const labelsMarkup = labels.map((label, i) => {
    const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
    const lx = cx + (r + 24) * Math.cos(angle);
    const ly = cy + (r + 24) * Math.sin(angle);
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const anchor = Math.abs(cos) < 0.3 ? 'middle' : (cos > 0 ? 'start' : 'end');
    const baseline = Math.abs(sin) < 0.3 ? 'middle' : (sin > 0 ? 'start' : 'end');
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" text-anchor="${anchor}" dominant-baseline="${baseline}" font-size="10" fill="#6b7280" class="dark:fill-gray-400">${label}</text>`;
  }).join('');

  return `
    <svg viewBox="0 0 ${size} ${size}" class="w-full max-w-sm mx-auto" role="img" aria-label="FNS criteria radar chart">
      ${rings}
      ${axes}
      ${polygon}
      ${dots}
      ${labelsMarkup}
    </svg>
  `;
}
