const API_URL = (localStorage.getItem('API_URL') || '/api').replace(/\/$/, '');

const els = {
  list: document.getElementById('taskList'),
  year: document.getElementById('year'),
  form: document.getElementById('newTaskForm'),
  titleInput: document.getElementById('titleInput'),
  toggleMode: document.getElementById('toggleMode'),
};

els.year.textContent = new Date().getFullYear().toString();

async function fetchTasks() {
  const res = await fetch(`${API_URL}/tasks`, { headers: { 'Accept': 'application/json' } });
  if (!res.ok) throw new Error('Falha ao buscar tasks');
  return res.json();
}

function taskItem(t) {
  const wrap = document.createElement('div');
  wrap.className = 'list-group-item d-flex align-items-center justify-content-between';
  wrap.setAttribute('data-id', t.id);

  wrap.innerHTML = `
    <div class="d-flex align-items-center gap-2">
      <input type="checkbox" ${t.status === 'done' ? 'checked' : ''} data-id="${t.id}" class="form-check-input" aria-label="Marcar como concluída">
      <div>
        <div class="fw-semibold">${t.title}</div>
        ${t.description ? `<small class="text-muted">${t.description}</small>` : ''}
      </div>
    </div>
    <button class="btn btn-sm btn-outline-danger" data-del="${t.id}" aria-label="Excluir tarefa">Excluir</button>
  `;
  return wrap;
}

async function render() {
  els.list.innerHTML = '<div class="list-group-item">Carregando...</div>';
  try {
    const tasks = await fetchTasks();
    els.list.innerHTML = '';
    if (!tasks.length) {
      els.list.innerHTML = '<div class="list-group-item text-muted">Nenhuma tarefa.</div>';
      return;
    }
    tasks.forEach(t => els.list.appendChild(taskItem(t)));
  } catch (e) {
    els.list.innerHTML = `<div class="list-group-item text-danger">Erro: ${e.message}</div>`;
  }
}

els.list.addEventListener('change', async (ev) => {
  const cb = ev.target.closest('input[type="checkbox"]');
  if (!cb) return;
  const id = cb.getAttribute('data-id');
  await fetch(`${API_URL}/tasks/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ status: cb.checked ? 'done' : 'pending' }),
  });
  render();
});

els.list.addEventListener('click', async (ev) => {
  const btn = ev.target.closest('button[data-del]');
  if (!btn) return;
  const id = btn.getAttribute('data-del');
  await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
  render();
});

els.form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const title = els.titleInput.value.trim();
  if (!title) return;
  await fetch(`${API_URL}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ title, status: 'pending' }),
  });
  els.titleInput.value = '';
  render();
});

// Toggle Mobile-first vs Desktop-first
els.toggleMode.addEventListener('click', () => {
  document.body.classList.toggle('desktop-first');
  const desktop = document.body.classList.contains('desktop-first');
  els.toggleMode.textContent = desktop ? 'Desktop-first' : 'Mobile-first';
  els.toggleMode.setAttribute('aria-pressed', desktop ? 'true' : 'false');
});

render();
