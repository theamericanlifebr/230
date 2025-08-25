export function initHistory() {
  const container = document.getElementById('history-grid');
  if (!container) return;
  container.innerHTML = '';
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0];
  const slots = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const idx = h * 4 + m / 15;
      const slot = document.createElement('div');
      slot.className = 'history-slot';
      const time = document.createElement('span');
      time.className = 'history-time';
      time.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      slot.appendChild(time);
      container.appendChild(slot);
      slots[idx] = slot;
    }
  }
  const tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
  tasks.forEach(t => {
    if (!t.startTime) return;
    const start = new Date(t.startTime);
    const d = start.toISOString().split('T')[0];
    if (d !== dateStr) return;
    const idx = start.getHours() * 4 + Math.floor(start.getMinutes() / 15);
    const slot = slots[idx];
    if (slot) {
      const span = document.createElement('span');
      span.className = 'history-task';
      span.textContent = ' ' + t.title;
      slot.appendChild(span);
    }
  });
}
