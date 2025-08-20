let aspectKeys = [];
let tasksData = [];
let editingTaskIndex = null;
let aspectsMap = {};
let touchStartX = 0;
let calendarStart = getCurrentPeriodStart(new Date());
let titleTouchX = 0;
let pendingTask = null;
let conflictingIndices = [];

const addTaskBtn = document.getElementById('add-task-btn');
const suggestTaskBtn = document.getElementById('suggest-task-btn');
const taskModal = document.getElementById('task-modal');
const taskTitleInput = document.getElementById('task-title');
const taskDescInput = document.getElementById('task-desc');
const taskDateInput = document.getElementById('task-date');
const taskTimeInput = document.getElementById('task-time');
const taskDurationInput = document.getElementById('task-duration');
const taskAspectInput = document.getElementById('task-aspect');
const taskTypeInput = document.getElementById('task-type');
const taskNoTimeInput = document.getElementById('task-no-time');
const saveTaskBtn = document.getElementById('save-task');
const cancelTaskBtn = document.getElementById('cancel-task');
const completeTaskBtn = document.getElementById('complete-task');
const toStep2Btn = document.getElementById('to-step-2');
const toStep3Btn = document.getElementById('to-step-3');
const backStep1Btn = document.getElementById('back-step-1');
const backStep2Btn = document.getElementById('back-step-2');
const step1Div = document.getElementById('task-step-1');
const step2Div = document.getElementById('task-step-2');
const step3Div = document.getElementById('task-step-3');
const taskRepeatInputs = document.querySelectorAll('#task-repeat input');
const conflictModal = document.getElementById('conflict-modal');
const conflictList = document.getElementById('conflict-list');
const replaceAllBtn = document.getElementById('replace-all');
const cancelConflictBtn = document.getElementById('cancel-conflict');

function showTaskStep(step) {
  step1Div.classList.add('hidden');
  step2Div.classList.add('hidden');
  step3Div.classList.add('hidden');
  if (step === 1) {
    step1Div.classList.remove('hidden');
  } else if (step === 2) {
    step2Div.classList.remove('hidden');
  } else if (step === 3) {
    step3Div.classList.remove('hidden');
  }
}
const calendarTitle = document.getElementById('calendar-title');
const calendarList = document.getElementById('calendar-list');
const tasksSection = document.getElementById('tasks');

export function initTasks(keys, data, aspects) {
  aspectKeys = keys;
  tasksData = data;
  aspectsMap = aspects;
  addTaskBtn.addEventListener('click', () => openTaskModal());
  suggestTaskBtn.addEventListener('click', suggestTask);
  saveTaskBtn.addEventListener('click', saveTask);
  cancelTaskBtn.addEventListener('click', closeTaskModal);
  completeTaskBtn.addEventListener('click', completeTask);
  toStep2Btn.addEventListener('click', () => showTaskStep(2));
  toStep3Btn.addEventListener('click', () => showTaskStep(3));
  backStep1Btn.addEventListener('click', () => showTaskStep(1));
  backStep2Btn.addEventListener('click', () => showTaskStep(2));
  taskNoTimeInput.addEventListener('change', () => {
    taskTimeInput.disabled = taskNoTimeInput.value !== '';
  });
  replaceAllBtn.addEventListener('click', replaceAllConflicts);
  cancelConflictBtn.addEventListener('click', () => {
    conflictModal.classList.add('hidden');
    conflictModal.classList.remove('show');
    pendingTask = null;
    conflictingIndices = [];
  });
  tasksSection.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  });
  tasksSection.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (!tasksSection.classList.contains('show-calendar') && dx < -50) {
      tasksSection.classList.add('show-calendar');
    } else if (tasksSection.classList.contains('show-calendar') && dx > 50) {
      tasksSection.classList.remove('show-calendar');
    }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') {
      tasksSection.classList.add('show-calendar');
    } else if (e.key === 'ArrowDown') {
      tasksSection.classList.remove('show-calendar');
    } else if (e.key === 'ArrowLeft') {
      changePeriod(-1);
    } else if (e.key === 'ArrowRight') {
      changePeriod(1);
    }
  });
  const centralIcon = tasksSection.querySelector('.icone-central');
  if (centralIcon) {
    let pressTimer;
    const startPress = () => {
      pressTimer = setTimeout(() => {
        tasksSection.classList.toggle('show-calendar');
      }, 1000);
    };
    const cancelPress = () => clearTimeout(pressTimer);
    centralIcon.addEventListener('mousedown', startPress);
    centralIcon.addEventListener('touchstart', startPress);
    centralIcon.addEventListener('mouseup', cancelPress);
    centralIcon.addEventListener('mouseleave', cancelPress);
    centralIcon.addEventListener('touchend', cancelPress);
  }
  if (calendarTitle) {
    calendarTitle.addEventListener('touchstart', e => {
      titleTouchX = e.touches[0].clientX;
    });
    calendarTitle.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - titleTouchX;
      if (dx < -50) {
        changePeriod(1);
      } else if (dx > 50) {
        changePeriod(-1);
      }
    });
    calendarTitle.addEventListener('mousedown', e => {
      titleTouchX = e.clientX;
    });
    calendarTitle.addEventListener('mouseup', e => {
      const dx = e.clientX - titleTouchX;
      if (dx < -50) {
        changePeriod(1);
      } else if (dx > 50) {
        changePeriod(-1);
      }
    });
  }
  buildTasks();
  buildCalendar();
  setInterval(() => {
    buildTasks();
    buildCalendar();
  }, 60000);
}

function buildTasks() {
  const pending = document.getElementById('pending-list');
  const completed = document.getElementById('completed-list');
  const overdue = document.getElementById('overdue-list');
  const substituted = document.getElementById('substituted-list');
  pending.innerHTML = '';
  completed.innerHTML = '';
  overdue.innerHTML = '';
  substituted.innerHTML = '';
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = Date.now();
  tasks.forEach((t, index) => {
    const div = document.createElement('div');
    div.className = 'task-item';
    div.dataset.index = index;
    const h3 = document.createElement('h3');
    h3.textContent = t.title;
    const p = document.createElement('p');
    p.textContent = t.description;
    const span = document.createElement('span');
    const infoTime = t.startTime ? new Date(t.startTime).toLocaleString() : 'Sem horário';
    span.textContent = `${infoTime} | ${t.aspect} | ${t.type || 'Hábito'}`;
    div.appendChild(h3);
    div.appendChild(p);
    div.appendChild(span);
    div.addEventListener('dblclick', () => {
      tasks[index].completed = true;
      localStorage.setItem('tasks', JSON.stringify(tasks));
      buildTasks();
    });
    let pressTimer;
    const start = () => {
      pressTimer = setTimeout(() => openTaskModal(index), 500);
    };
    const cancel = () => clearTimeout(pressTimer);
    div.addEventListener('mousedown', start);
    div.addEventListener('touchstart', start);
    div.addEventListener('mouseup', cancel);
    div.addEventListener('mouseleave', cancel);
    div.addEventListener('touchend', cancel);
    const time = t.startTime ? new Date(t.startTime).getTime() : null;
    if (t.substituted) {
      div.classList.add('overdue');
      substituted.appendChild(div);
    } else if (t.completed) {
      div.classList.add('completed');
      completed.appendChild(div);
    } else if (time && time < now) {
      div.classList.add('overdue');
      overdue.appendChild(div);
    } else {
      div.classList.add('pending');
      pending.appendChild(div);
    }
  });
  if (!tasks.length) {
    pending.textContent = 'Sem tarefas ainda';
  }
}

function buildCalendar() {
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
    if (blockTime < now) {
      boxtime.classList.add('past');
    }
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

function openTaskModal(index = null, prefill = null) {
  editingTaskIndex = index;
  taskAspectInput.innerHTML = '';
  aspectKeys.forEach(k => {
    const opt = document.createElement('option');
    opt.value = k;
    opt.textContent = k;
    taskAspectInput.appendChild(opt);
  });
  taskTypeInput.value = 'Hábito';
  const now = new Date();
  taskDateInput.value = now.toISOString().slice(0,10);
  taskTimeInput.value = now.toTimeString().slice(0,5);
  taskDurationInput.value = 15;
  taskNoTimeInput.value = '';
  taskRepeatInputs.forEach(i => (i.checked = false));
  if (index !== null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const t = tasks[index];
    taskTitleInput.value = t.title;
    taskDescInput.value = t.description;
    if (t.startTime) {
      const d = new Date(t.startTime);
      taskDateInput.value = d.toISOString().slice(0,10);
      taskTimeInput.value = d.toTimeString().slice(0,5);
    } else {
      taskDateInput.value = '';
      taskTimeInput.value = '';
    }
    taskAspectInput.value = t.aspect;
    taskTypeInput.value = t.type || 'Hábito';
    taskDurationInput.value = t.duration || 15;
    taskNoTimeInput.value = t.noTime || '';
    document.querySelector('#task-modal h2').textContent = 'Editar tarefa';
    if (!t.completed) {
      completeTaskBtn.classList.remove('hidden');
    } else {
      completeTaskBtn.classList.add('hidden');
    }
  } else {
    document.querySelector('#task-modal h2').textContent = 'Nova tarefa';
    completeTaskBtn.classList.add('hidden');
    if (prefill) {
      taskTitleInput.value = prefill.title;
      taskDescInput.value = prefill.description;
      taskAspectInput.value = prefill.aspect;
      taskTypeInput.value = prefill.type || 'Hábito';
    } else {
      taskTitleInput.value = '';
      taskDescInput.value = '';
      taskAspectInput.value = aspectKeys[0] || '';
    }
  }
  showTaskStep(1);
  taskModal.classList.add('show');
  taskModal.classList.remove('hidden');
}

function suggestTask() {
  if (!Array.isArray(tasksData) || !tasksData.length) return;
  const idea = tasksData[Math.floor(Math.random() * tasksData.length)];
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  const now = new Date(Date.now() + 3600000).toISOString();
  tasks.push({
    title: idea.title.slice(0, 14),
    description: (idea.description || '').slice(0, 60),
    startTime: now,
    aspect: idea.aspect,
    type: idea.type || 'Hábito',
    duration: 15,
    completed: false
  });
  localStorage.setItem('tasks', JSON.stringify(tasks));
  buildTasks();
  buildCalendar();
}

function closeTaskModal() {
  taskModal.classList.remove('show');
  taskModal.classList.add('hidden');
  editingTaskIndex = null;
}

function showConflicts(conflicts) {
  conflictList.innerHTML = '';
  conflicts.forEach(c => {
    const div = document.createElement('div');
    div.className = 'task-item';
    const h3 = document.createElement('h3');
    h3.textContent = c.title;
    div.appendChild(h3);
    conflictList.appendChild(div);
  });
  conflictModal.classList.remove('hidden');
  conflictModal.classList.add('show');
}

function findConflicts(start, duration, tasks, ignoreIndex = null) {
  const startMs = start.getTime();
  const endMs = startMs + duration * 60000;
  return tasks
    .map((t, idx) => ({ ...t, idx }))
    .filter(t => {
      if (ignoreIndex !== null && t.idx === ignoreIndex) return false;
      if (!t.startTime) return false;
      const tStart = new Date(t.startTime).getTime();
      const tEnd = tStart + (t.duration || 15) * 60000;
      return startMs < tEnd && endMs > tStart;
    });
}

function saveTask() {
  const title = taskTitleInput.value.trim();
  if (!title) return;
  const description = taskDescInput.value.trim();
  const aspect = taskAspectInput.value;
  const type = taskTypeInput.value;
  const duration = parseInt(taskDurationInput.value, 10) || 15;
  const noTime = taskNoTimeInput.value;
  const date = taskDateInput.value;
  const time = taskTimeInput.value;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  if (!noTime) {
    if (!date || !time) return;
    const datetime = new Date(`${date}T${time}`);
    if (datetime <= new Date()) {
      alert('Selecione um horário futuro');
      return;
    }
    const selectedDays = Array.from(taskRepeatInputs)
      .filter(i => i.checked)
      .map(i => parseInt(i.value));
    const days = selectedDays.length ? selectedDays : [datetime.getDay()];
    const baseTask = {
      title: title.slice(0, 14),
      description: (description || '').slice(0, 60),
      aspect,
      type,
      duration,
      completed: false
    };
    if (editingTaskIndex !== null) {
      const conflicts = findConflicts(datetime, duration, tasks, editingTaskIndex);
      if (conflicts.length) {
        pendingTask = { ...baseTask, startTime: datetime.toISOString(), editIndex: editingTaskIndex };
        conflictingIndices = conflicts.map(c => c.idx);
        showConflicts(conflicts);
        closeTaskModal();
        return;
      }
      tasks[editingTaskIndex] = { ...baseTask, startTime: datetime.toISOString() };
    } else {
      for (const day of days) {
        const d = new Date(datetime);
        const diff = (day - d.getDay() + 7) % 7;
        d.setDate(d.getDate() + diff);
        const conflicts = findConflicts(d, duration, tasks);
        if (conflicts.length) {
          pendingTask = { ...baseTask, startTime: d.toISOString(), editIndex: null };
          conflictingIndices = conflicts.map(c => c.idx);
          showConflicts(conflicts);
          closeTaskModal();
          return;
        }
        tasks.push({ ...baseTask, startTime: d.toISOString() });
      }
    }
  } else {
    const taskObj = {
      title: title.slice(0, 14),
      description: (description || '').slice(0, 60),
      aspect,
      type,
      duration,
      noTime,
      completed: false
    };
    if (editingTaskIndex !== null) {
      tasks[editingTaskIndex] = taskObj;
    } else {
      tasks.push(taskObj);
    }
  }
  localStorage.setItem('tasks', JSON.stringify(tasks));
  closeTaskModal();
  buildTasks();
  buildCalendar();
}

function completeTask() {
  if (editingTaskIndex === null) return;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks[editingTaskIndex].completed = true;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  closeTaskModal();
  buildTasks();
  buildCalendar();
}

function replaceAllConflicts() {
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  conflictingIndices.forEach(i => {
    if (tasks[i]) {
      tasks[i].startTime = null;
      tasks[i].substituted = true;
    }
  });
  if (pendingTask) {
    if (pendingTask.editIndex !== null) {
      tasks[pendingTask.editIndex] = pendingTask;
    } else {
      tasks.push(pendingTask);
    }
  }
  localStorage.setItem('tasks', JSON.stringify(tasks));
  conflictModal.classList.add('hidden');
  conflictModal.classList.remove('show');
  pendingTask = null;
  conflictingIndices = [];
  buildTasks();
  buildCalendar();
}

