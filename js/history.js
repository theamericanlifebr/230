import { openTaskModal } from './tasks.js';

let calendarStart = getCurrentPeriodStart(new Date());
let calendarTitle;
let calendarList;
let aspectsMap = {};
let titleTouchX = 0;

export function initHistory(aspects) {
  aspectsMap = aspects;
  calendarTitle = document.getElementById('calendar-title');
  calendarList = document.getElementById('calendar-list');
  if (calendarTitle) {
    calendarTitle.addEventListener('touchstart', e => {
      titleTouchX = e.touches[0].clientX;
    });
    calendarTitle.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - titleTouchX;
      if (dx < -50) changePeriod(1);
      else if (dx > 50) changePeriod(-1);
    });
    calendarTitle.addEventListener('mousedown', e => {
      titleTouchX = e.clientX;
    });
    calendarTitle.addEventListener('mouseup', e => {
      const dx = e.clientX - titleTouchX;
      if (dx < -50) changePeriod(1);
      else if (dx > 50) changePeriod(-1);
    });
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowLeft') changePeriod(-1);
    else if (e.key === 'ArrowRight') changePeriod(1);
  });
  buildCalendar();
  setInterval(buildCalendar, 60000);
  window.buildCalendar = buildCalendar;
}

export function buildCalendar() {
  if (!calendarList || !calendarTitle) return;
  const now = new Date();
  const start = calendarStart;
  const periodInfo = getPeriodInfo(start.getHours());
  calendarTitle.textContent = `${formatDate(start)} (${periodInfo.label})`;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const periodEnd = new Date(start.getTime() + 6 * 60 * 60 * 1000);
  const periodTasks = tasks
    .map((t, idx) => ({ ...t, idx }))
    .filter(t => {
      if (!t.startTime) return false;
      const tStart = new Date(t.startTime).getTime();
      const tEnd = tStart + (t.duration || 15) * 60000;
      return tStart < periodEnd.getTime() && tEnd > start.getTime();
    });
  calendarList.innerHTML = '';
  for (let minutes = 0; minutes < 6 * 60; minutes += 15) {
    const blockTime = new Date(start.getTime() + minutes * 60000);
    const label = `${String(blockTime.getHours()).padStart(2, '0')}:${String(blockTime.getMinutes()).padStart(2, '0')}`;
    const boxtime = document.createElement('div');
    boxtime.className = `boxtime ${periodInfo.className}`;
    if (blockTime < now) boxtime.classList.add('past');
    const timeDiv = document.createElement('div');
    timeDiv.className = 'boxtime-time';
    timeDiv.textContent = label;
    boxtime.appendChild(timeDiv);
    const icons = document.createElement('div');
    icons.className = 'boxtime-icons';
    const blockStart = blockTime.getTime();
    const blockEnd = blockStart + 15 * 60000;
    const matching = periodTasks.filter(t => {
      const tStart = new Date(t.startTime).getTime();
      const tEnd = tStart + (t.duration || 15) * 60000;
      return tStart < blockEnd && tEnd > blockStart;
    });
    matching.slice(0, 4).forEach(t => {
      const img = document.createElement('img');
      img.src = aspectsMap[t.aspect]?.image || '';
      img.alt = t.aspect;
      img.width = 30;
      img.height = 30;
      const idx = t.idx;
      img.addEventListener('click', () => openTaskModal(idx));
      icons.appendChild(img);
    });
    boxtime.appendChild(icons);
    calendarList.appendChild(boxtime);
  }
}

function changePeriod(delta) {
  calendarStart = new Date(calendarStart.getTime() + delta * 6 * 60 * 60 * 1000);
  buildCalendar();
}

function getCurrentPeriodStart(now) {
  const hour = now.getHours();
  const startHour = hour < 6 ? 0 : hour < 12 ? 6 : hour < 18 ? 12 : 18;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), startHour, 0, 0, 0);
}

function getPeriodInfo(hour) {
  if (hour < 6) return { label: 'Madrugada', className: 'dawn' };
  if (hour < 12) return { label: 'Manhã', className: 'morning' };
  if (hour < 18) return { label: 'Tarde', className: 'afternoon' };
  return { label: 'Noite', className: 'night' };
}

function formatDate(date) {
  const dd = String(date.getDate()).padStart(2, '0');
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const yy = String(date.getFullYear()).slice(-2);
  return `${dd}|${mm}|${yy}`;
}
