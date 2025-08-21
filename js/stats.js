let aspectKeys = [];
let responses = {};
let statsColors = {};
let aspectsData = {};

const statsSlider = document.getElementById('stats-slider');
const statsSliderValue = document.getElementById('stats-slider-value');
let statsIndex = 0;
let statsResponses = {};

export function initStats(keys, res, colors, aspects) {
  aspectKeys = keys;
  responses = res;
  statsColors = colors;
  aspectsData = aspects;
  statsSlider.addEventListener('input', () => {
    statsSliderValue.textContent = statsSlider.value;
  });
  document.getElementById('stats-next').addEventListener('click', () => {
    const key = aspectKeys[statsIndex];
    statsResponses[key] = Number(statsSlider.value);
    statsIndex++;
    if (statsIndex < aspectKeys.length) {
      showStatsQuestion();
    } else {
      const date = new Date().toISOString().split('T')[0];
      const allStats = JSON.parse(localStorage.getItem('dailyStats') || '{}');
      allStats[date] = statsResponses;
      localStorage.setItem('dailyStats', JSON.stringify(allStats));
      document.getElementById('stats-modal').classList.remove('show');
    }
  });
  buildStats();
}

function buildStats() {
  const container = document.getElementById('stats-content');
  container.innerHTML = '';
  aspectKeys.forEach(k => {
    const item = document.createElement('div');
    item.className = 'stats-item';

    const img = document.createElement('img');
    img.src = aspectsData[k].image;
    img.alt = k;
    item.appendChild(img);

    const name = document.createElement('span');
    name.className = 'stats-name';
    name.textContent = k;
    item.appendChild(name);

    container.appendChild(item);
  });
}

function showStatsQuestion() {
  const key = aspectKeys[statsIndex];
  document.getElementById('stats-question').textContent = `Qual seu nível hoje para ${key}?`;
  statsSlider.value = 5;
  statsSliderValue.textContent = 5;
}

function openStatsModal() {
  statsIndex = 0;
  statsResponses = {};
  showStatsQuestion();
  document.getElementById('stats-modal').classList.add('show');
}

export function checkStatsPrompt() {
  const hour = Number(localStorage.getItem('statsHour'));
  if (isNaN(hour)) return;
  const lastDate = localStorage.getItem('statsDate');
  const now = new Date();
  if (now.getHours() === hour && (!lastDate || lastDate !== now.toDateString())) {
    openStatsModal();
    localStorage.setItem('statsDate', now.toDateString());
  }
}

