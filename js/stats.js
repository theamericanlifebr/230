let aspectKeys = [];
let responses = {};
let statsColors = {};
let aspectsData = {};
let currentIndex = 0;
let handlersAttached = false;
let startX = 0;

export function initStats(keys, res, colors, aspects) {
  aspectKeys = keys;
  responses = res;
  statsColors = colors;
  aspectsData = aspects;
  currentIndex = 0;
  showCurrent();
  if (!handlersAttached) {
    attachHandlers();
    handlersAttached = true;
  }
}

function showCurrent() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '';
  if (!aspectKeys.length) return;
  const key = aspectKeys[currentIndex];
  const level = responses[key]?.level || 0;
  const color = statsColors[key][1];

  const item = document.createElement('div');
  item.className = 'stats-item';

  const circleWrap = document.createElement('div');
  circleWrap.className = 'stats-circle';

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '290');
  svg.setAttribute('height', '290');
  const radius = 125;
  const circumference = 2 * Math.PI * radius;

  const bg = document.createElementNS(svgNS, 'circle');
  bg.setAttribute('cx', '145');
  bg.setAttribute('cy', '145');
  bg.setAttribute('r', radius);
  bg.setAttribute('stroke', '#222');
  bg.setAttribute('stroke-width', '20');
  bg.setAttribute('fill', 'none');
  svg.appendChild(bg);

  const prog = document.createElementNS(svgNS, 'circle');
  prog.setAttribute('cx', '145');
  prog.setAttribute('cy', '145');
  prog.setAttribute('r', radius);
  prog.setAttribute('stroke', color);
  prog.setAttribute('stroke-width', '20');
  prog.setAttribute('fill', 'none');
  prog.setAttribute('stroke-linecap', 'round');
  prog.setAttribute('stroke-dasharray', circumference);
  prog.setAttribute('stroke-dashoffset', circumference * (1 - level / 100));
  prog.style.filter = `drop-shadow(0 0 10px ${color})`;
  svg.appendChild(prog);

  circleWrap.appendChild(svg);

  const img = document.createElement('img');
  img.src = aspectsData[key].image;
  img.alt = key;
  circleWrap.appendChild(img);

  item.appendChild(circleWrap);

  const name = document.createElement('span');
  name.className = 'stats-name';
  name.textContent = `${key}: ${level}%`;
  item.appendChild(name);

  container.appendChild(item);
}

function attachHandlers() {
  const container = document.getElementById('stats-content');
  container.addEventListener('touchstart', e => startX = e.touches[0].clientX);
  container.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx < -50) next();
    else if (dx > 50) prev();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
  });
}

function next() {
  currentIndex = (currentIndex + 1) % aspectKeys.length;
  showCurrent();
}

function prev() {
  currentIndex = (currentIndex - 1 + aspectKeys.length) % aspectKeys.length;
  showCurrent();
}

export function checkStatsPrompt() {}

