let aspectKeys = [];
let responses = {};
let statsColors = {};
let aspectsData = {};
let currentIndex = 0;
let imgEl, nameEl, progressCircle;

export function initStats(keys, res, colors, aspects) {
  aspectKeys = keys;
  responses = res;
  statsColors = colors;
  aspectsData = aspects;
  buildStats();
}

function buildStats() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '';

  const slide = document.createElement('div');
  slide.className = 'stats-slide';

  const ring = document.createElement('div');
  ring.className = 'progress-ring';

  imgEl = document.createElement('img');
  ring.appendChild(imgEl);

  const svgNS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(svgNS, 'svg');
  svg.setAttribute('width', '250');
  svg.setAttribute('height', '250');

  const bgCircle = document.createElementNS(svgNS, 'circle');
  bgCircle.setAttribute('cx', '125');
  bgCircle.setAttribute('cy', '125');
  bgCircle.setAttribute('r', '115');
  bgCircle.setAttribute('stroke-width', '20');
  bgCircle.setAttribute('fill', 'none');
  bgCircle.setAttribute('stroke', '#333');
  svg.appendChild(bgCircle);

  progressCircle = document.createElementNS(svgNS, 'circle');
  progressCircle.setAttribute('cx', '125');
  progressCircle.setAttribute('cy', '125');
  progressCircle.setAttribute('r', '115');
  progressCircle.setAttribute('stroke-width', '20');
  progressCircle.setAttribute('fill', 'none');
  svg.appendChild(progressCircle);

  ring.appendChild(svg);

  slide.appendChild(ring);

  nameEl = document.createElement('span');
  nameEl.className = 'stats-name';
  slide.appendChild(nameEl);

  container.appendChild(slide);

  container.addEventListener('touchstart', handleTouchStart, { passive: true });
  container.addEventListener('touchend', handleTouchEnd);

  renderSlide();
}

let startX = 0;
function handleTouchStart(e) {
  startX = e.touches[0].clientX;
}

function handleTouchEnd(e) {
  const dx = e.changedTouches[0].clientX - startX;
  if (dx > 50) {
    currentIndex = (currentIndex - 1 + aspectKeys.length) % aspectKeys.length;
    renderSlide();
  } else if (dx < -50) {
    currentIndex = (currentIndex + 1) % aspectKeys.length;
    renderSlide();
  }
}

function renderSlide() {
  const key = aspectKeys[currentIndex];
  imgEl.src = aspectsData[key].image;
  imgEl.alt = key;
  nameEl.textContent = key;

  const color = statsColors[key][1];
  const level = responses[key] ? responses[key].level : 0;
  const r = 115;
  const circ = 2 * Math.PI * r;
  progressCircle.setAttribute('stroke', color);
  progressCircle.style.filter = `drop-shadow(0 0 6px ${color})`;
  progressCircle.setAttribute('stroke-dasharray', String(circ));
  progressCircle.setAttribute('stroke-dashoffset', String(circ * (1 - level / 100)));
}

export function needsLevelPrompt() {
  return localStorage.getItem('levelDone') !== 'true';
}

