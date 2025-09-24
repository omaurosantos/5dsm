// ===== Config =====
const API_BASE = ''; // vazio => mesmo domínio (Express serve LP e API)
const API = {
  tasks: `${API_BASE}/api/tasks`,
  login: `${API_BASE}/auth/login`,
  me:    `${API_BASE}/auth/me`,
};

// ===== Auth Helpers =====
function getToken() { return localStorage.getItem('token') || ''; }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }
function isLogged() { return !!getToken(); }

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Atualiza UI de login/logado
function renderAuthState(userLabelText = '') {
  const $out = document.getElementById('authLoggedOut');
  const $in  = document.getElementById('authLoggedIn');
  const $label = document.getElementById('authUserLabel');

  if (isLogged()) {
    $out.classList.add('hidden');
    $in.classList.remove('hidden');
    if (userLabelText) $label.textContent = userLabelText;
  } else {
    $in.classList.add('hidden');
    $out.classList.remove('hidden');
    $label.textContent = '';
  }
}

// ===== UI Elements =====
const $taskList = document.getElementById('taskList');
const $taskForm = document.getElementById('taskForm');
const $taskError = document.getElementById('taskError');
const $title = document.getElementById('titleInput');
const $desc  = document.getElementById('descInput');

const $btnLogin = document.getElementById('btnLogin');
const $btnLogout = document.getElementById('btnLogout');
const $authUserLabel = document.getElementById('authUserLabel');
const $authError = document.getElementById('authError');
const $authUsername = document.getElementById('authUsername');
const $authPassword = document.getElementById('authPassword');

const $btnSearch = document.getElementById('btnSearch');
const $btnClear = document.getElementById('btnClear');
const $searchInput = document.getElementById('searchInput');

// ===== Fetch wrapper =====
async function apiFetch(url, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (!options.noAuth) Object.assign(headers, authHeaders());

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

// ===== Tasks =====
async function loadTasks({ q } = {}) {
  const params = new URLSearchParams();
  if (q && q.trim()) params.set('q', q.trim());
  const url = params.toString() ? `${API.tasks}?${params}` : API.tasks;

  const resp = await apiFetch(url, { noAuth: true }); // GET é público
  const items = Array.isArray(resp.data) ? resp.data : resp;
  renderTaskList(items);
}

function renderTaskList(tasks) {
  $taskList.innerHTML = '';
  for (const t of tasks) {
    const creator = t.owner ? `${escapeHtml(t.owner.username)} (${t.owner.role})` : '—';
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="task-row">
        <div>
          <span class="task-title"><strong>#${t.id}</strong> - ${escapeHtml(t.title)}</span>
          ${t.description ? ` — <em>${escapeHtml(t.description)}</em>` : ''}
          <div class="task-meta"><small>Criado por: ${creator}</small></div>
        </div>
        <button data-id="${t.id}" class="btn btn-danger btn-del">Excluir</button>
      </div>
    `;
    $taskList.appendChild(li);
  }

  $taskList.querySelectorAll('.btn-del').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = Number(btn.getAttribute('data-id'));
      try {
        await apiFetch(`${API.tasks}/${id}`, { method: 'DELETE' });
        await loadTasks({ q: $searchInput.value });
      } catch (err) {
        alert('Erro ao excluir: ' + err.message + (isLogged() ? '' : ' (faça login)'));
      }
    });
  });
}

// ===== Eventos =====
$taskForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  $taskError.classList.add('hidden');
  try {
    const body = {
      title: $title.value.trim(),
      description: $desc.value.trim() || undefined,
    };
    if (!body.title) {
      $taskError.textContent = 'Título é obrigatório';
      $taskError.classList.remove('hidden');
      return;
    }
    await apiFetch(API.tasks, { method: 'POST', body: JSON.stringify(body) });
    $title.value = '';
    $desc.value = '';
    await loadTasks({ q: $searchInput.value });
  } catch (err) {
    $taskError.textContent = 'Erro ao criar: ' + err.message + (isLogged() ? '' : ' (faça login)');
    $taskError.classList.remove('hidden');
  }
});

$btnSearch.addEventListener('click', () => loadTasks({ q: $searchInput.value }));
$btnClear.addEventListener('click', () => { $searchInput.value = ''; loadTasks(); });

// ===== Login / Logout =====
$btnLogin.addEventListener('click', async () => {
  $authError.classList.add('hidden');
  try {
    const username = $authUsername.value.trim();
    const password = $authPassword.value.trim();
    if (!username || !password) {
      $authError.textContent = 'Informe usuário e senha';
      $authError.classList.remove('hidden');
      return;
    }
    const resp = await apiFetch(API.login, {
      method: 'POST',
      body: JSON.stringify({ username, password }),
      noAuth: true,
    });
    setToken(resp.token);
    renderAuthState(resp.user?.username || username);
    $authPassword.value = '';
  } catch (err) {
    $authError.textContent = 'Falha no login: ' + err.message;
    $authError.classList.remove('hidden');
  }
});

$btnLogout.addEventListener('click', () => {
  clearToken();
  renderAuthState();
});

// ===== Utils =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}

// ===== Init =====
(async function init() {
  renderAuthState();
  await loadTasks();
})();