import { initTasks } from './tasks.js';
import { initLaws } from './laws.js';
import { initMindset } from './mindset.js';
import { initStats, checkStatsPrompt } from './stats.js';
import { initHistory } from './history.js';

let aspectsData = {};
let aspectKeys = [];
let tasksData = [];
let lawsData = [];
let mindsetData = [];
let currentIndex = 0;
let currentStep = 0; // 0 importance, 1 level
let responses = JSON.parse(localStorage.getItem('responses') || '{}');
let previousLogin = 0;

const statsColors = {
  Exercícios: ['#ff4d4d', '#ff6666'],
  Relationships: ['#ffd700', '#ffea00'],
  Nutrition: ['#66bb6a', '#81c784'],
  Sleep: ['#003366', '#004080'],
  Ambiente: ['#00bcd4', '#26c6da'],
  Emocional: ['#64b5f6', '#90caf9'],
  Hygiene: ['#b3e5fc', '#e1f5fe'],
  Energia: ['#c0c0c0', '#d3d3d3'],
  Learning: ['#ffb300', '#ffca28'],
  Financial: ['#2e7d32', '#388e3c'],
  Lazer: ['#7e57c2', '#9575cd'],
  Trabalho: ['#ffffff', '#f5f5f5']
};

const storedAspectColors = JSON.parse(localStorage.getItem('aspectColors') || '{}');
Object.keys(storedAspectColors).forEach(k => {
  statsColors[k] = [storedAspectColors[k], storedAspectColors[k]];
});

// Prevent copying, context menu, and zoom interactions
document.addEventListener('contextmenu', e => e.preventDefault());
document.addEventListener('copy', e => e.preventDefault());
document.addEventListener('cut', e => e.preventDefault());
document.addEventListener('paste', e => e.preventDefault());
document.addEventListener('selectstart', e => e.preventDefault());
document.addEventListener('wheel', e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('gesturechange', e => e.preventDefault());
document.addEventListener('gestureend', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.touches.length > 1) e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && ['c', 'x', 'v', 'a', '+', '-', '0'].includes(e.key.toLowerCase())) {
    e.preventDefault();
  }
});

const slider = document.getElementById('slider');
const sliderFeedback = document.getElementById('slider-feedback');
const aspectImage = document.getElementById('aspect-image');
const headerLogo = document.getElementById('header-logo');
const menuCarousel = document.getElementById('menu-carousel');

let savedTheme = localStorage.getItem('theme') || 'black';
document.body.classList.add(savedTheme);
const savedBg = localStorage.getItem('customBg');
if (savedBg) document.body.style.backgroundImage = `url(${savedBg})`;
headerLogo.addEventListener('click', () => showPage('menu'));

Promise.all([
  fetch('data/aspects.json').then(r => r.json()),
  fetch('tarefas.json').then(r => r.json()),
  fetch('leis.json').then(r => r.json()),
  fetch('mindset.json').then(r => r.json())
]).then(([aspects, tarefas, leis, mindset]) => {
  aspectsData = aspects;
  tasksData = tarefas;
  lawsData = leis;
  mindsetData = mindset;
  aspectKeys = Object.keys(aspects);
  if (Object.keys(responses).length) {
    document.getElementById('logo-screen').style.display = 'none';
    document.getElementById('main-header').classList.remove('hidden');
    document.getElementById('main-content').classList.remove('hidden');
    initApp(false);
  } else {
    setTimeout(() => {
      const text = document.getElementById('logo-text');
      text.classList.remove('hidden');
      requestAnimationFrame(() => text.classList.add('show'));
    }, 2500);
    setTimeout(() => {
      const logoScreen = document.getElementById('logo-screen');
      logoScreen.classList.add('fade-out');
      setTimeout(() => {
        logoScreen.style.display = 'none';
        document.getElementById('question-screen').classList.remove('hidden');
        showQuestion();
      }, 1000);
    }, 4000);
  }
});

function showQuestion() {
  const key = aspectKeys[currentIndex];
  const title = currentStep === 0
    ? `Você considera ${key.toLowerCase()} importante?`
    : `Qual o nível atual da sua ${key.toLowerCase()} hoje?`;
  document.getElementById('question-title').textContent = title;
  aspectImage.src = aspectsData[key].image;
  aspectImage.alt = key;
  const value = currentStep === 0
    ? (responses[key]?.importance || 50)
    : (responses[key]?.level || 50);
  slider.value = value;
  updateFeedback();
  const totalSteps = aspectKeys.length * 2;
  const stepIndex = currentIndex * 2 + currentStep;
  const progress = (stepIndex / totalSteps) * 100;
  document.getElementById('progress-bar').style.width = progress + '%';
}

function getImportanceFeedback(val) {
  const v = Number(val);
  if (v <= 20) return 'Totalmente irrelevante';
  if (v <= 40) return 'Pouco importante';
  if (v <= 60) return 'Importância moderada';
  if (v <= 80) return 'Importante';
  return 'Muito importante';
}

function getLevelFeedback(val, key) {
  const v = Number(val);
  if (v <= 20) return `Nível de ${key} péssimo hoje`;
  if (v <= 40) return `Nível de ${key} não está bom`;
  if (v <= 60) return `Nível de ${key} regular`;
  if (v <= 80) return `Nível de ${key} bom`;
  return `Nível de ${key} excelente`;
}

function updateFeedback() {
  const key = aspectKeys[currentIndex];
  sliderFeedback.textContent = currentStep === 0
    ? getImportanceFeedback(slider.value)
    : getLevelFeedback(slider.value, key);
}

slider.addEventListener('input', updateFeedback);

document.getElementById('next-btn').addEventListener('click', () => {
  const key = aspectKeys[currentIndex];
  if (!responses[key]) responses[key] = { importance: 0, level: 50 };
  if (currentStep === 0) {
    responses[key].importance = Number(slider.value);
    currentStep = 1;
    slider.value = responses[key].level || 50;
    updateFeedback();
    showQuestion();
  } else {
    responses[key].level = Number(slider.value);
    currentStep = 0;
    currentIndex++;
    if (currentIndex < aspectKeys.length) {
      showQuestion();
    } else {
      document.getElementById('question-screen').classList.add('hidden');
      document.getElementById('oath-text').textContent = buildOath();
      document.getElementById('name-screen').classList.remove('hidden');
    }
  }
});

document.getElementById('agree').addEventListener('change', checkStartReady);
document.getElementById('username').addEventListener('input', checkStartReady);

function checkStartReady() {
  const agree = document.getElementById('agree').checked;
  const name = document.getElementById('username').value.trim();
  document.getElementById('start-btn').disabled = !(agree && name);
}

document.getElementById('start-btn').addEventListener('click', () => {
  document.getElementById('name-screen').classList.add('hidden');
  initApp(true);
});

function buildOath() {
  const parts = [];
  for (const key of aspectKeys) {
    const res = responses[key];
    if (res.importance >= 7) {
      parts.push(aspectsData[key].speech);
    }
  }
  return parts.length ? 'Eu prometo ' + parts.join(' ') : '';
}

function initApp(firstTime) {
  const now = Date.now();
  previousLogin = Number(localStorage.getItem('lastLogin')) || now;
  localStorage.setItem('lastLogin', now);
  if (firstTime) {
    const hour = prompt('Qual horário (0-23) é melhor para você atualizar suas estatísticas?');
    if (hour !== null) {
      localStorage.setItem('statsHour', hour);
    }
    localStorage.setItem('responses', JSON.stringify(responses));
    const name = document.getElementById('username').value.trim();
    localStorage.setItem('username', name);
  } else {
    responses = JSON.parse(localStorage.getItem('responses') || '{}');
  }
  buildOptions();
  initTasks(aspectKeys, tasksData, aspectsData);
  initLaws(aspectKeys, lawsData, statsColors);
  initStats(aspectKeys, responses, statsColors, aspectsData);
  initMindset(aspectKeys, mindsetData, statsColors);
  initHistory(aspectsData);
  scheduleNotifications();
  document.getElementById('main-header').classList.remove('hidden');
  document.getElementById('main-content').classList.remove('hidden');
  setInterval(checkStatsPrompt, 60000);
  checkStatsPrompt();
  if (window.innerWidth <= 600) {
    initCarousel();
  }
}

function applyTheme(theme) {
  document.body.classList.remove('black', 'turquoise', 'whitecolor', 'minimalist');
  document.body.classList.add(theme);
  localStorage.setItem('theme', theme);
  savedTheme = theme;
}

function buildOptions() {
  const container = document.getElementById('options-content');
  container.innerHTML = '';

  const themeDiv = document.createElement('div');
  const themeLabel = document.createElement('label');
  themeLabel.textContent = 'Tema:';
  const themeSelect = document.createElement('select');
  [
    { value: 'black', label: 'Black' },
    { value: 'turquoise', label: 'Blue Turquesa' },
    { value: 'whitecolor', label: 'White and Color' },
    { value: 'minimalist', label: 'Minimalist' }
  ].forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.value;
    opt.textContent = t.label;
    themeSelect.appendChild(opt);
  });
  themeSelect.value = savedTheme;
  themeSelect.addEventListener('change', e => applyTheme(e.target.value));
  themeDiv.appendChild(themeLabel);
  themeDiv.appendChild(themeSelect);
  container.appendChild(themeDiv);

  const bgDiv = document.createElement('div');
  const bgLabel = document.createElement('label');
  bgLabel.textContent = 'Imagem de fundo:';
  const bgInput = document.createElement('input');
  bgInput.type = 'file';
  bgInput.accept = 'image/*';
  bgInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      localStorage.setItem('customBg', reader.result);
      document.body.style.backgroundImage = `url(${reader.result})`;
    };
    reader.readAsDataURL(file);
  });
  bgDiv.appendChild(bgLabel);
  bgDiv.appendChild(bgInput);
  container.appendChild(bgDiv);

  const aspectColors = JSON.parse(localStorage.getItem('aspectColors') || '{}');
  aspectKeys.forEach(k => {
    const colorWrap = document.createElement('div');
    const colorLabel = document.createElement('label');
    colorLabel.textContent = `${k} cor:`;
    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.value = aspectColors[k] || '#ffffff';
    colorInput.addEventListener('input', e => {
      aspectColors[k] = e.target.value;
      statsColors[k] = [e.target.value, e.target.value];
      localStorage.setItem('aspectColors', JSON.stringify(aspectColors));
    });
    colorWrap.appendChild(colorLabel);
    colorWrap.appendChild(colorInput);
    container.appendChild(colorWrap);
  });

  const categories = [
    { title: 'Princípios fundamentais', filter: v => v === 10 },
    { title: 'Pilares de uma vida equilibrada', filter: v => v >= 8 && v <= 9 },
    { title: 'Pontos a trabalhar a longo prazo', filter: v => v >= 6 && v <= 7 }
  ];
  categories.forEach(cat => {
    const aspects = aspectKeys.filter(k => cat.filter(responses[k]?.importance));
    if (!aspects.length) return;
    const h = document.createElement('h2');
    h.textContent = cat.title;
    container.appendChild(h);
    aspects.sort((a, b) => responses[b].importance - responses[a].importance || a.localeCompare(b));
    aspects.forEach(k => {
      const p = document.createElement('p');
      p.textContent = `${aspectsData[k].speech} Importância: ${responses[k].importance}.`;
      container.appendChild(p);
    });
  });
}

function scheduleNotifications() {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = Date.now();
  tasks.forEach(t => {
    const time = new Date(t.startTime).getTime();
    if (time > now) {
      setTimeout(() => {
        new Notification('Mr.President | New Task |', { body: t.title });
      }, time - now);
    }
  });
}

document.querySelectorAll('.menu-item').forEach(item => {
  item.addEventListener('click', e => {
    const page = e.currentTarget.getAttribute('data-page');
    showPage(page);
  });
});

function initCarousel() {
  const items = [
    { page: 'tasks', img: 'acoes.png', label: 'Tarefas' },
    { page: 'laws', img: 'leis.png', label: 'Leis' },
    { page: 'stats', img: 'estatisticas.png', label: 'Estatísticas' },
    { page: 'mindset', img: 'mindset.png', label: 'Mindset' },
    { page: 'options', img: 'constituicao.png', label: 'Opções' },
    { page: 'history', img: 'historico.png', label: 'Histórico' }
  ];
  let idx = 0;
  const img = document.createElement('img');
  menuCarousel.appendChild(img);

  function render() {
    const item = items[idx];
    img.src = item.img;
    img.alt = item.label;
    showPage(item.page);
  }

  render();

  let startX = 0;
  menuCarousel.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
  });
  menuCarousel.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (dx > 50) {
      idx = (idx - 1 + items.length) % items.length;
      render();
    } else if (dx < -50) {
      idx = (idx + 1) % items.length;
      render();
    }
  });
}

function showPage(pageId) {
  document.querySelectorAll('.page').forEach(sec => sec.classList.remove('active'));
  const section = document.getElementById(pageId);
  if (section) section.classList.add('active');
}

