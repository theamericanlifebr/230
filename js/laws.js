import { applyCascade, hexToRgba } from './utils.js';

let aspectKeys = [];
let lawsData = [];
let statsColors = {};

const addLawBtn = document.getElementById('add-law-btn');
const suggestLawBtn = document.getElementById('suggest-law-btn');
const lawModal = document.getElementById('law-modal');
const lawTitleInput = document.getElementById('law-title');
const lawAspectSelect = document.getElementById('law-aspect-select');
const saveLawBtn = document.getElementById('save-law');
const acceptLawBtn = document.getElementById('accept-law');
const declineLawBtn = document.getElementById('decline-law');
const cancelLawBtn = document.getElementById('cancel-law');
const lawActionModal = document.getElementById('law-action-modal');
const revokeLawBtn = document.getElementById('revoke-law');
const cancelLawActionBtn = document.getElementById('cancel-law-action');

export function initLaws(keys, data, colors) {
  aspectKeys = keys;
  lawsData = data;
  statsColors = colors;
  addLawBtn.addEventListener('click', () => openLawModal());
  suggestLawBtn.addEventListener('click', suggestLaw);
  saveLawBtn.addEventListener('click', saveLaw);
  cancelLawBtn.addEventListener('click', closeLawModal);
  acceptLawBtn.addEventListener('click', saveLaw);
  declineLawBtn.addEventListener('click', closeLawModal);
  lawAspectSelect.addEventListener('change', updateLawModalColors);
  revokeLawBtn.addEventListener('click', () => {
    const index = Number(lawActionModal.dataset.index);
    const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
    laws.splice(index, 1);
    localStorage.setItem('customLaws', JSON.stringify(laws));
    closeLawActionModal();
    buildLaws();
  });
  cancelLawActionBtn.addEventListener('click', closeLawActionModal);
  if (window.innerWidth <= 600) {
    const icon = document.querySelector('#laws .icone-central');
    if (icon) {
      let lastTap = 0;
      icon.addEventListener('touchend', () => {
        const now = Date.now();
        if (now - lastTap < 300) suggestLaw();
        lastTap = now;
      });
    }
  }
  buildLaws();
}

function splitTwoLines(text) {
  const words = text.split(' ');
  const half = Math.ceil(text.length / 2);
  let line1 = '';
  let line2 = '';
  words.forEach(w => {
    if ((line1 + ' ' + w).trim().length <= half || !line2) {
      line1 = (line1 + ' ' + w).trim();
    } else {
      line2 = (line2 + ' ' + w).trim();
    }
  });
  if (!line2) {
    line2 = line1;
    line1 = '';
  }
  return `${line1}\n${line2}`.trim();
}

function updateLawModalColors() {
  const aspect = lawAspectSelect.value;
  const colors = statsColors[aspect] || ['#000', '#39ff14'];
  const neon = colors[1];
  const form = lawModal.querySelector('.task-form');
  form.style.background = `linear-gradient(to bottom, ${neon}, #000)`;
  const buttons = form.querySelectorAll('button');
  buttons.forEach(b => {
    b.style.background = neon;
    b.style.boxShadow = `0 0 10px ${neon}`;
  });
}

function buildLaws() {
  const container = document.getElementById('laws-list');
  container.innerHTML = '';
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.forEach((l, index) => {
    const div = document.createElement('div');
    div.className = 'law-box';
    const colors = statsColors[l.aspect] || ['#555', '#777'];
    const neon = colors[1];
    div.style.backgroundColor = hexToRgba(neon, 0.3);
    div.style.border = `3px solid ${neon}`;
    div.style.boxShadow = `0 0 10px ${neon}, 0 0 20px ${neon}`;
    const h3 = document.createElement('h3');
    h3.style.textAlign = 'center';
    h3.style.whiteSpace = 'pre-line';
    h3.textContent = splitTwoLines(l.title);
    div.appendChild(h3);
    div.dataset.index = index;
    let pressTimer;
    const start = () => { pressTimer = setTimeout(() => openLawActionModal(index), 500); };
    const cancel = () => clearTimeout(pressTimer);
    div.addEventListener('mousedown', start);
    div.addEventListener('touchstart', start);
    div.addEventListener('mouseup', cancel);
    div.addEventListener('mouseleave', cancel);
    div.addEventListener('touchend', cancel);
    container.appendChild(div);
  });
  if (!laws.length) {
    container.textContent = 'Sem leis ainda';
  } else {
    applyCascade(container);
  }
}

function openLawModal(prefill = null, suggestion = false) {
  lawAspectSelect.innerHTML = '';
  aspectKeys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    lawAspectSelect.appendChild(opt);
  });
  if (prefill) {
    lawTitleInput.value = prefill.title;
    lawAspectSelect.value = prefill.aspect;
  } else {
    lawTitleInput.value = '';
    lawAspectSelect.value = aspectKeys[0] || '';
  }
  lawTitleInput.readOnly = suggestion;
  lawAspectSelect.disabled = suggestion;
  if (suggestion) {
    saveLawBtn.classList.add('hidden');
    acceptLawBtn.classList.remove('hidden');
    declineLawBtn.classList.remove('hidden');
  } else {
    saveLawBtn.classList.remove('hidden');
    acceptLawBtn.classList.add('hidden');
    declineLawBtn.classList.add('hidden');
  }
  updateLawModalColors();
  lawModal.classList.add('show');
  lawModal.classList.remove('hidden');
}

function closeLawModal() {
  lawModal.classList.remove('show');
  lawModal.classList.add('hidden');
}

function saveLaw() {
  const title = lawTitleInput.value.trim().slice(0,80);
  if (!title) return;
  const aspect = lawAspectSelect.value;
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.push({ title, aspect });
  localStorage.setItem('customLaws', JSON.stringify(laws));
  closeLawModal();
  buildLaws();
}

function suggestLaw() {
  if (!Array.isArray(lawsData) || !lawsData.length) return;
  const idea = lawsData[Math.floor(Math.random() * lawsData.length)];
  const laws = JSON.parse(localStorage.getItem('customLaws') || '[]');
  laws.push({ title: idea.title, aspect: idea.aspect });
  localStorage.setItem('customLaws', JSON.stringify(laws));
  buildLaws();
}

function openLawActionModal(index) {
  lawActionModal.dataset.index = index;
  lawActionModal.classList.add('show');
  lawActionModal.classList.remove('hidden');
}

function closeLawActionModal() {
  lawActionModal.classList.remove('show');
  lawActionModal.classList.add('hidden');
  delete lawActionModal.dataset.index;
}

