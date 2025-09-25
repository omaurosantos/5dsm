// ===== Config =====
const API_BASE = '';
const API = {
  tasks: `${API_BASE}/api/tasks`,
  login: `${API_BASE}/auth/login`,
  me:    `${API_BASE}/auth/me`,
  users: `${API_BASE}/api/users`,
};

// ===== State =====
let currentUser = null; // { id, username, role, ... } após login

// ===== Auth Helpers =====
function getToken() { return localStorage.getItem('token') || ''; }
function setToken(t) { localStorage.setItem('token', t); }
function clearToken() { localStorage.removeItem('token'); }
function isLogged() { return !!getToken(); }
function isAdmin() { return !!currentUser && currentUser.role === 'ADMIN'; }

function authHeaders() {
  const t = getToken();
  return t ? { Authorization: `Bearer ${t}` } : {};
}

// Atualiza UI de login/logado + áreas Admin
function renderAuthState(userLabelText = '') {
  const $out = document.getElementById('authLoggedOut');
  const $in  = document.getElementById('authLoggedIn');
  const $label = document.getElementById('authUserLabel');

  const $adminCreateUser = document.getElementById('adminCreateUserCard');
  const $adminUsersCard  = document.getElementById('adminUsersCard');

  if (isLogged()) {
    $out.classList.add('hidden');
    $in.classList.remove('hidden');
    if (userLabelText) $label.textContent = userLabelText;
  } else {
    $in.classList.add('hidden');
    $out.classList.remove('hidden');
    $label.textContent = '';
  }

  if (isAdmin()) {
    if ($adminCreateUser) $adminCreateUser.style.display = 'block';
    if ($adminUsersCard)  $adminUsersCard.style.display  = 'block';
  } else {
    if ($adminCreateUser) $adminCreateUser.style.display = 'none';
    if ($adminUsersCard)  $adminUsersCard.style.display  = 'none';
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
const $authError = document.getElementById('authError');
const $authUsername = document.getElementById('authUsername');
const $authPassword = document.getElementById('authPassword');

const $btnSearch = document.getElementById('btnSearch');
const $btnClear = document.getElementById('btnClear');
const $searchInput = document.getElementById('searchInput');

// Admin: criar usuário
const $userForm = document.getElementById('userForm');
const $userUsername = document.getElementById('userUsername');
const $userName = document.getElementById('userName');
const $userPassword = document.getElementById('userPassword');
const $userRole = document.getElementById('userRole');
const $userMsg = document.getElementById('userMsg');

// Admin: lista/edição de usuários
const $usersTbody = document.getElementById('usersTbody');
const $usersRefresh = document.getElementById('usersRefresh');

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

// ===== Status helpers (front) =====
const STATUS_LABEL = {
  TO_DO: 'To do',
  IN_PROGRESS: 'In progress',
  DONE: 'Done',
};
const STATUS_ORDER = ['TO_DO', 'IN_PROGRESS', 'DONE'];

// ===== Tasks =====
async function loadTasks({ q } = {}) {
  const params = new URLSearchParams();
  if (q && q.trim()) params.set('q', q.trim());
  const url = params.toString() ? `${API.tasks}?${params}` : API.tasks;

  const resp = await apiFetch(url, { noAuth: true });
  const items = Array.isArray(resp.data) ? resp.data : resp;
  renderTaskList(items);
}

function renderTaskList(tasks) {
  $taskList.innerHTML = '';
  for (const t of tasks) {
    const creator = t.owner ? `${escapeHtml(t.owner.username)} (${t.owner.role})` : '—';
    const li = document.createElement('li');

    // select de status
    const options = STATUS_ORDER
      .map(v => `<option value="${v}" ${t.status === v ? 'selected':''}>${STATUS_LABEL[v]}</option>`)
      .join('');

    li.innerHTML = `
      <div class="task-row">
        <div>
          <span class="task-title"><strong>#${t.id}</strong> - ${escapeHtml(t.title)}</span>
          ${t.description ? ` — <em>${escapeHtml(t.description)}</em>` : ''}
          <div class="task-meta"><small>Criado por: ${creator}</small></div>
          <div class="task-meta" style="margin-top:6px;">
            <label><small>Status:&nbsp;</small></label>
            <select class="task-status" data-id="${t.id}">
              ${options}
            </select>
          </div>
        </div>
        <button data-id="${t.id}" class="btn btn-danger btn-del">Excluir</button>
      </div>
    `;
    $taskList.appendChild(li);
  }

  // excluir
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

  // editar status
  $taskList.querySelectorAll('.task-status').forEach(sel => {
    sel.addEventListener('change', async () => {
      const id = Number(sel.getAttribute('data-id'));
      const status = sel.value; // TO_DO | IN_PROGRESS | DONE
      try {
        await apiFetch(`${API.tasks}/${id}`, {
          method: 'PUT',
          body: JSON.stringify({ status }),
        });
      } catch (err) {
        alert('Erro ao atualizar status: ' + err.message);
      }
    });
  });
}

// ===== Admin: Users =====
async function loadUsers() {
  if (!isAdmin() || !$usersTbody) return;
  try {
    const list = await apiFetch(API.users);
    renderUsers(list);
  } catch (err) {
    console.error('Falha ao carregar usuários:', err.message);
    if ($usersTbody) $usersTbody.innerHTML = `<tr><td colspan="6">Erro ao carregar usuários: ${escapeHtml(err.message)}</td></tr>`;
  }
}

function renderUsers(list) {
  if (!$usersTbody) return;
  $usersTbody.innerHTML = '';
  for (const u of list) {
    const tr = document.createElement('tr');
    tr.dataset.id = String(u.id);
    tr.innerHTML = `
      <td class="col-id">#${u.id}</td>
      <td class="col-username">${escapeHtml(u.username)}</td>
      <td class="col-name">${u.name ? escapeHtml(u.name) : '—'}</td>
      <td class="col-role">${u.role}</td>
      <td class="col-actions">
        <button class="btn btn-primary btn-edit-user">Editar</button>
        <button class="btn btn-danger btn-del-user">Excluir</button>
      </td>
    `;
    $usersTbody.appendChild(tr);
  }
}

// Delegação de eventos na tabela (editar/salvar/cancelar/deletar)
$usersTbody?.addEventListener('click', async (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  const tr = btn.closest('tr');
  const id = Number(tr?.dataset.id);

  if (btn.classList.contains('btn-del-user')) {
    if (currentUser?.id != null && currentUser.id === id) {
      alert('Você não pode excluir a si mesmo.');
      return;
    }
    if (!confirm(`Excluir usuário #${id}?`)) return;
    try {
      await apiFetch(`${API.users}/${id}`, { method: 'DELETE' });
      await loadUsers();
    } catch (err) {
      alert('Erro ao excluir usuário: ' + err.message);
    }
    return;
  }

  if (btn.classList.contains('btn-edit-user')) {
    enterEditMode(tr);
    return;
  }

  if (btn.classList.contains('btn-save-user')) {
    try {
      const payload = collectEditPayload(tr);
      if (!payload) return;
      await apiFetch(`${API.users}/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
      await loadUsers();
    } catch (err) {
      alert('Erro ao salvar usuário: ' + err.message);
    }
    return;
  }

  if (btn.classList.contains('btn-cancel-user')) {
    await loadUsers();
    return;
  }
});

function enterEditMode(tr) {
  const username = tr.querySelector('.col-username')?.textContent.trim();
  const name = tr.querySelector('.col-name')?.textContent.trim();
  const role = tr.querySelector('.col-role')?.textContent.trim();

  tr.querySelector('.col-username').innerHTML = `
    <input type="text" class="inp-username" value="${escapeAttr(username)}" />
  `;
  tr.querySelector('.col-name').innerHTML = `
    <input type="text" class="inp-name" value="${name !== '—' ? escapeAttr(name) : ''}" placeholder="Nome (opcional)" />
  `;
  tr.querySelector('.col-role').innerHTML = `
    <select class="inp-role">
      <option value="VIEWER" ${role === 'VIEWER' ? 'selected':''}>VIEWER</option>
      <option value="MANAGER" ${role === 'MANAGER' ? 'selected':''}>MANAGER</option>
      <option value="ADMIN" ${role === 'ADMIN' ? 'selected':''}>ADMIN</option>
    </select>
    <div><small>Senha (opcional):</small></div>
    <input type="password" class="inp-password" placeholder="Nova senha (mín. 6)" />
  `;
  tr.querySelector('.col-actions').innerHTML = `
    <button class="btn btn-primary btn-save-user">Salvar</button>
    <button class="btn btn-muted btn-cancel-user">Cancelar</button>
  `;
}

function collectEditPayload(tr) {
  const username = tr.querySelector('.inp-username')?.value.trim();
  const name = tr.querySelector('.inp-name')?.value.trim();
  const role = tr.querySelector('.inp-role')?.value;
  const password = tr.querySelector('.inp-password')?.value.trim();

  const payload = {};
  if (username) payload.username = username;
  if (name) payload.name = name;
  if (role) payload.role = role;
  if (password) {
    if (password.length < 6) {
      alert('Senha deve ter no mínimo 6 caracteres.');
      return null;
    }
    payload.password = password;
  }
  return payload;
}

// ===== Eventos =====
$taskForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  $taskError?.classList.add('hidden');
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

$btnSearch?.addEventListener('click', () => loadTasks({ q: $searchInput.value }));
$btnClear?.addEventListener('click', () => { $searchInput.value = ''; loadTasks(); });

// Login / Logout
$btnLogin?.addEventListener('click', async () => {
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
    currentUser = resp.user || { username, role: undefined };
    renderAuthState(currentUser.username || username);
    await loadUsers();
    $authPassword.value = '';
  } catch (err) {
    $authError.textContent = 'Falha no login: ' + err.message;
    $authError.classList.remove('hidden');
  }
});

$btnLogout?.addEventListener('click', () => {
  clearToken();
  currentUser = null;
  renderAuthState();
});

// Admin: criar usuário
$userForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  $userMsg.classList.add('hidden');
  try {
    const payload = {
      username: $userUsername.value.trim(),
      name: $userName.value.trim() || undefined,
      password: $userPassword.value.trim(),
      role: $userRole.value,
    };
    if (!payload.username || !payload.password) {
      $userMsg.textContent = 'Usuário e senha são obrigatórios';
      $userMsg.style.color = '#dc3545';
      $userMsg.classList.remove('hidden');
      return;
    }
    await apiFetch(API.users, { method: 'POST', body: JSON.stringify(payload) });
    $userMsg.textContent = 'Usuário criado com sucesso!';
    $userMsg.style.color = 'green';
    $userMsg.classList.remove('hidden');

    $userUsername.value = '';
    $userName.value = '';
    $userPassword.value = '';
    $userRole.value = 'VIEWER';

    await loadUsers();
  } catch (err) {
    $userMsg.textContent = 'Erro ao criar usuário: ' + err.message;
    $userMsg.style.color = '#dc3545';
    $userMsg.classList.remove('hidden');
  }
});

// ===== Utils =====
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (m) => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
  }[m]));
}
function escapeAttr(s) {
  return String(s ?? '').replace(/"/g, '&quot;');
}

// ===== Init =====
(async function init() {
  renderAuthState();
  await loadTasks();

  // botão "Atualizar" da lista de usuários
  $usersRefresh?.addEventListener('click', async () => {
    try { await loadUsers(); } catch (_) {}
  });
})();