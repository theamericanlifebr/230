import { applyCascade } from './utils.js';

let aspectKeys = [];
let responses = {};
let statsColors = {};
let aspectsData = {};

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
  applyCascade(container);
}

export function checkStatsPrompt() {}

