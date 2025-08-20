let aspectKeys = [];
let tasksData = [];
let editingTaskIndex = null;
let aspectsMap = {};
let pendingTask = null;
let conflictingIndices = [];
let currentTaskStep = 1;

const addTaskBtn = document.getElementById('add-task-btn');
const suggestTaskBtn = document.getElementById('suggest-task-btn');
const taskModal = document.getElementById('task-modal');
const taskTitleInput = document.getElementById('task-title');
const taskDateOption = document.getElementById('task-date-option');
const taskDateInput = document.getElementById('task-date');
const taskCustomWeekDiv = document.getElementById('task-custom-week');
const taskCustomInputs = document.querySelectorAll('#task-custom-week input');
const taskTimeInput = document.getElementById('task-time');
const taskHoursInput = document.getElementById('task-hours');
const taskMinutesInput = document.getElementById('task-minutes');
const taskDescInput = document.getElementById('task-desc');
const taskAspectInput = document.getElementById('task-aspect');
const taskTypeInput = document.getElementById('task-type');
const taskNoTimeInput = document.getElementById('task-no-time');
const saveTaskBtn = document.getElementById('save-task');
const cancelTaskBtn = document.getElementById('cancel-task');
const completeTaskBtn = document.getElementById('complete-task');
const step1Div = document.getElementById('task-step-1');
const step2Div = document.getElementById('task-step-2');
const step3Div = document.getElementById('task-step-3');
const conflictModal = document.getElementById('conflict-modal');
const conflictList = document.getElementById('conflict-list');
const replaceAllBtn = document.getElementById('replace-all');
const cancelConflictBtn = document.getElementById('cancel-conflict');

function showTaskStep(step) {
  currentTaskStep = step;
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

function nextTaskStep() {
  if (currentTaskStep < 3) showTaskStep(currentTaskStep + 1);
}

function prevTaskStep() {
  if (currentTaskStep > 1) showTaskStep(currentTaskStep - 1);
}

function formatDuration(mins) {
  const m = mins || 0;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  if (h && mm) return `${h}h ${mm}m`;
  if (h) return `${h}h`;
  if (mm) return `${mm}m`;
  return '';
}
export function initTasks(keys, data, aspects) {
  aspectKeys = keys;
  tasksData = data;
  aspectsMap = aspects;
  addTaskBtn.addEventListener('click', () => openTaskModal());
  suggestTaskBtn.addEventListener('click', suggestTask);
  saveTaskBtn.addEventListener('click', saveTask);
  cancelTaskBtn.addEventListener('click', closeTaskModal);
  completeTaskBtn.addEventListener('click', completeTask);
  taskNoTimeInput.addEventListener('change', () => {
    taskTimeInput.disabled = taskNoTimeInput.value !== '';
  });
  taskDateOption.addEventListener('change', () => {
    const val = taskDateOption.value;
    if (val === 'choose') {
      taskDateInput.classList.remove('hidden');
      taskCustomWeekDiv.classList.add('hidden');
    } else if (val === 'custom') {
      taskCustomWeekDiv.classList.remove('hidden');
      taskDateInput.classList.add('hidden');
    } else {
      taskDateInput.classList.add('hidden');
      taskCustomWeekDiv.classList.add('hidden');
    }
  });
  replaceAllBtn.addEventListener('click', replaceAllConflicts);
  cancelConflictBtn.addEventListener('click', () => {
    conflictModal.classList.add('hidden');
    conflictModal.classList.remove('show');
    pendingTask = null;
    conflictingIndices = [];
  });
  if (window.innerWidth <= 600) {
    let startX = 0;
    taskModal.addEventListener('touchstart', e => {
      startX = e.touches[0].clientX;
    });
    taskModal.addEventListener('touchend', e => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50) nextTaskStep();
      else if (dx > 50) prevTaskStep();
    });
    const icon = document.querySelector('#tasks .icone-central');
    if (icon) {
      let lastTap = 0;
      icon.addEventListener('touchend', () => {
        const now = Date.now();
        if (now - lastTap < 300) suggestTask();
        lastTap = now;
      });
    }
  } else {
    document.addEventListener('keydown', e => {
      if (taskModal.classList.contains('hidden')) return;
      if (e.key === 'ArrowRight') nextTaskStep();
      if (e.key === 'ArrowLeft') prevTaskStep();
    });
  }
  buildTasks();
  setInterval(() => {
    buildTasks();
    if (window.buildCalendar) window.buildCalendar();
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

    const icon = document.createElement('img');
    icon.className = 'task-aspect-icon';
    icon.alt = t.aspect;
    icon.src = aspectsMap[t.aspect]?.image || '';

    const textDiv = document.createElement('div');
    textDiv.className = 'task-text';

    const h3 = document.createElement('h3');
    h3.textContent = t.title;
    textDiv.appendChild(h3);

    const span = document.createElement('span');
    span.textContent = `${formatDuration(t.duration)} ${t.type || 'Hábito'}`.trim();
    textDiv.appendChild(span);

    div.appendChild(icon);
    div.appendChild(textDiv);
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
    if (time && time > now) {
      const timer = document.createElement('div');
      timer.className = 'task-timer';
      const diff = Math.floor((time - now) / 60000);
      const hh = Math.floor(diff / 60);
      const mm = diff % 60;
      timer.innerHTML = `<small>tempo até início</small><div>${hh}:${mm.toString().padStart(2,'0')}h</div>`;
      div.appendChild(timer);
    }
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

export function openTaskModal(index = null, prefill = null) {
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
  taskDateOption.value = 'today';
  taskDateInput.classList.add('hidden');
  taskCustomWeekDiv.classList.add('hidden');
  taskTimeInput.value = now.toTimeString().slice(0,5);
  taskNoTimeInput.value = '';
  taskHoursInput.value = 0;
  taskMinutesInput.value = 0;
  taskDescInput.value = '';
  taskCustomInputs.forEach(i => (i.checked = false));
  if (index !== null) {
    const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
    const t = tasks[index];
    taskTitleInput.value = t.title;
    if (t.startTime) {
      const d = new Date(t.startTime);
      taskDateOption.value = 'choose';
      taskDateInput.classList.remove('hidden');
      taskDateInput.value = d.toISOString().slice(0,10);
      taskTimeInput.value = d.toTimeString().slice(0,5);
    } else {
      taskDateOption.value = 'today';
      taskDateInput.classList.add('hidden');
      taskTimeInput.value = '';
    }
    taskAspectInput.value = t.aspect;
    taskTypeInput.value = t.type || 'Hábito';
    taskDescInput.value = t.description || '';
    const dur = t.duration || 0;
    taskHoursInput.value = Math.floor(dur / 60);
    taskMinutesInput.value = dur % 60;
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
      taskAspectInput.value = prefill.aspect;
      taskTypeInput.value = prefill.type || 'Hábito';
      taskDescInput.value = prefill.description || '';
      const dur = prefill.duration || 0;
      taskHoursInput.value = Math.floor(dur / 60);
      taskMinutesInput.value = dur % 60;
    } else {
      taskTitleInput.value = '';
      taskAspectInput.value = aspectKeys[0] || '';
      taskDescInput.value = '';
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
  if (window.buildCalendar) window.buildCalendar();
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
  const duration = (parseInt(taskHoursInput.value, 10) || 0) * 60 + (parseInt(taskMinutesInput.value, 10) || 0);
  const noTime = taskNoTimeInput.value;
  const time = taskTimeInput.value;
  const dateOption = taskDateOption.value;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  if (!noTime) {
    if (!time) return;
    let baseDate = new Date();
    if (dateOption === 'tomorrow') baseDate.setDate(baseDate.getDate() + 1);
    else if (dateOption === 'weekday2') baseDate.setDate(baseDate.getDate() + 2);
    else if (dateOption === 'weekday3') baseDate.setDate(baseDate.getDate() + 3);
    else if (dateOption === 'weekday4') baseDate.setDate(baseDate.getDate() + 4);
    else if (dateOption === 'choose') {
      if (!taskDateInput.value) return;
      baseDate = new Date(taskDateInput.value);
    }
    const datetime = new Date(baseDate);
    const [hh, mm] = time.split(':');
    datetime.setHours(hh, mm, 0, 0);
    if (datetime <= new Date()) {
      alert('Selecione um horário futuro');
      return;
    }
    const baseTask = {
      title: title.slice(0, 14),
      description: description.slice(0, 60),
      aspect,
      type,
      duration,
      completed: false
    };
    if (dateOption === 'custom' && editingTaskIndex === null) {
      const selectedDays = Array.from(taskCustomInputs)
        .filter(i => i.checked)
        .map(i => parseInt(i.value));
      const days = selectedDays.length ? selectedDays : [datetime.getDay()];
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
    } else {
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
        const conflicts = findConflicts(datetime, duration, tasks);
        if (conflicts.length) {
          pendingTask = { ...baseTask, startTime: datetime.toISOString(), editIndex: null };
          conflictingIndices = conflicts.map(c => c.idx);
          showConflicts(conflicts);
          closeTaskModal();
          return;
        }
        tasks.push({ ...baseTask, startTime: datetime.toISOString() });
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
  if (window.buildCalendar) window.buildCalendar();
}

function completeTask() {
  if (editingTaskIndex === null) return;
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks[editingTaskIndex].completed = true;
  localStorage.setItem('tasks', JSON.stringify(tasks));
  closeTaskModal();
  buildTasks();
  if (window.buildCalendar) window.buildCalendar();
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
  if (window.buildCalendar) window.buildCalendar();
}

