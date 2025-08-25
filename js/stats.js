let aspectKeys = [];
let responses = {};
let statsColors = {};
let aspectsData = {};
let currentIndex = 0;

export function initStats(keys, res, colors, aspects) {
  aspectKeys = keys;
  responses = res;
  statsColors = colors;
  aspectsData = aspects;
  currentIndex = 0;
  buildStats();
}

function buildStats() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '';

  const display = document.createElement('div');
  display.className = 'stats-display';
  container.appendChild(display);

  const img = document.createElement('img');
  img.className = 'stats-aspect-image';
  display.appendChild(img);

  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.classList.add('stats-circle');
  svg.setAttribute('width', '250');
  svg.setAttribute('height', '250');
  svg.setAttribute('viewBox', '0 0 250 250');
  const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  const radius = 115;
  const circumference = 2 * Math.PI * radius;
  circle.setAttribute('cx', '125');
  circle.setAttribute('cy', '125');
  circle.setAttribute('r', String(radius));
  circle.setAttribute('stroke-width', '20');
  circle.setAttribute('fill', 'none');
  circle.setAttribute('stroke-dasharray', String(circumference));
  svg.appendChild(circle);
  display.appendChild(svg);

  const name = document.createElement('div');
  name.className = 'stats-name';
  container.appendChild(name);

  function render() {
    const key = aspectKeys[currentIndex];
    const level = responses[key]?.level || 0;
    const color = statsColors[key]?.[1] || '#fff';
    img.src = aspectsData[key].image;
    img.alt = key;
    name.textContent = `${key}: ${level}%`;
    circle.setAttribute('stroke', color);
    circle.style.filter = `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})`;
    circle.setAttribute('stroke-dashoffset', String(circumference * (1 - level / 100)));
  }

  render();

  let startX = 0;
  container.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });
  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) {
      currentIndex = (currentIndex - 1 + aspectKeys.length) % aspectKeys.length;
      render();
    } else if (dx < -50) {
      currentIndex = (currentIndex + 1) % aspectKeys.length;
      render();
    }
  });
}

export function checkStatsPrompt() {}
