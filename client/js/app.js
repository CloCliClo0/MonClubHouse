/* ============================================================
   MonClubHouse — app.js (core utilitaires & navigation SPA)
   ============================================================ */

const API_URL = '/api';
let _accessToken = localStorage.getItem('mch_access_token');
let _refreshToken = localStorage.getItem('mch_refresh_token');
let _currentUser = null;

/* ─── HTTP helpers ─── */
async function api(method, path, body = null, isFormData = false) {
  const headers = {};
  if (_accessToken) headers['Authorization'] = `Bearer ${_accessToken}`;
  if (!isFormData && body) headers['Content-Type'] = 'application/json';

  const opts = { method, headers };
  if (body) opts.body = isFormData ? body : JSON.stringify(body);

  let res = await fetch(`${API_URL}${path}`, opts);

  // Auto-refresh JWT si 401
  if (res.status === 401 && _refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      headers['Authorization'] = `Bearer ${_accessToken}`;
      opts.headers = headers;
      res = await fetch(`${API_URL}${path}`, opts);
    } else {
      logout(false);
      return null;
    }
  }

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function refreshAccessToken() {
  if (!_refreshToken) return false;
  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: _refreshToken })
  });
  if (!res.ok) return false;
  const { data } = await res.json();
  setTokens(data.access_token, data.refresh_token);
  return true;
}

function setTokens(access, refresh) {
  _accessToken = access;
  _refreshToken = refresh;
  localStorage.setItem('mch_access_token', access);
  localStorage.setItem('mch_refresh_token', refresh);
}

function logout(redirect = true) {
  api('POST', '/auth/logout').catch(() => {});
  localStorage.removeItem('mch_access_token');
  localStorage.removeItem('mch_refresh_token');
  _accessToken = null; _refreshToken = null; _currentUser = null;
  if (redirect) window.location.href = '/login.html';
}

async function getCurrentUser() {
  if (_currentUser) return _currentUser;
  if (!_accessToken) return null;
  const res = await api('GET', '/auth/me');
  if (res?.ok) {
    _currentUser = res.data.data;
    return _currentUser;
  }
  return null;
}

/* ─── Toast ─── */
function toast(message, type = 'info', duration = 3500) {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast ${type}`;
  t.textContent = message;
  container.appendChild(t);
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translateX(100%)'; t.style.transition = '.3s'; setTimeout(() => t.remove(), 300); }, duration);
}

/* ─── Modal ─── */
function openModal(id) { document.getElementById(id)?.classList.add('open'); }
function closeModal(id) { document.getElementById(id)?.classList.remove('open'); }

/* ─── Sidebar toggle ─── */
function initSidebarToggle() {
  const sidebar = document.querySelector('.sidebar');
  const toggle = document.querySelector('.topbar-toggle');
  if (!toggle || !sidebar) return;
  toggle.addEventListener('click', () => sidebar.classList.toggle('open'));
  document.addEventListener('click', (e) => {
    if (window.innerWidth <= 900 && sidebar.classList.contains('open')
        && !sidebar.contains(e.target) && !toggle.contains(e.target)) {
      sidebar.classList.remove('open');
    }
  });
}

/* ─── Tabs ─── */
function initTabs(container = document) {
  container.querySelectorAll('.tabs').forEach(tabGroup => {
    tabGroup.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        tabGroup.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const panels = tabGroup.closest('[data-tabs-parent]') || document;
        panels.querySelectorAll('.tab-panel').forEach(p => {
          p.classList.toggle('active', p.dataset.panel === target);
        });
      });
    });
  });
}

/* ─── Active nav ─── */
function setActiveNav() {
  const page = window.location.pathname.replace(/\//g, '').replace('.html', '') || 'dashboard';
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });
}

/* ─── Init user sidebar info ─── */
async function initUserInfo() {
  const user = await getCurrentUser();
  if (!user) return;

  const nameEl = document.querySelector('.sidebar-user-name');
  const roleEl = document.querySelector('.sidebar-user-role');
  const avatarEl = document.querySelector('.sidebar-avatar');

  if (nameEl) nameEl.textContent = `${user.prenom} ${user.nom}`;
  if (roleEl) roleEl.textContent = user.role.charAt(0).toUpperCase() + user.role.slice(1);
  if (avatarEl) {
    if (user.avatar) {
      const img = document.createElement('img');
      img.src = user.avatar; img.alt = user.nom;
      img.style.cssText = 'width:100%;height:100%;border-radius:50%;object-fit:cover;';
      avatarEl.innerHTML = '';
      avatarEl.appendChild(img);
    } else {
      avatarEl.textContent = (user.prenom?.[0] || '') + (user.nom?.[0] || '');
    }
  }

  // Masquer les menus selon le rôle
  const roleLevel = { superadmin:6, admin:5, dirigeant:4, coach:3, joueur:2, parent:2, visiteur:1 };
  document.querySelectorAll('[data-min-role]').forEach(el => {
    const required = el.dataset.minRole;
    if ((roleLevel[user.role] || 0) < (roleLevel[required] || 0)) {
      el.style.display = 'none';
    }
  });

  return user;
}

/* ─── Notifications badge ─── */
async function initNotifBadge() {
  const res = await api('GET', '/profil/notifications');
  if (!res?.ok) return;
  const count = res.data.data.non_lues;
  const dot = document.querySelector('.notif-dot');
  const badge = document.querySelector('.nav-badge[data-notif]');
  if (dot) dot.style.display = count > 0 ? 'block' : 'none';
  if (badge) badge.textContent = count > 0 ? count : '';
}

/* ─── Format date ─── */
function formatDate(d, opts = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return new Date(d).toLocaleDateString('fr-FR', opts);
}
function formatDateTime(d) {
  return new Date(d).toLocaleString('fr-FR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

/* ─── Role badge helpers ─── */
function roleBadge(role) {
  const map = {
    superadmin: 'badge-purple', admin: 'badge-blue',
    dirigeant: 'badge-orange', coach: 'badge-green',
    joueur: 'badge-grey', parent: 'badge-grey', visiteur: 'badge-grey'
  };
  return `<span class="badge ${map[role] || 'badge-grey'}">${role}</span>`;
}
function statutConvocationBadge(s) {
  const map = {
    convoque: 'badge-blue', present: 'badge-green',
    absent: 'badge-red', incertain: 'badge-orange', non_retenu: 'badge-grey'
  };
  return `<span class="badge ${map[s] || 'badge-grey'}">${s.replace('_', ' ')}</span>`;
}

/* ─── OAuth callback handler ─── */
if (window.location.pathname === '/auth/callback') {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const refresh = params.get('refresh');
  if (token && refresh) {
    setTokens(token, refresh);
    window.location.href = '/dashboard.html';
  } else {
    window.location.href = '/login.html?error=oauth_failed';
  }
}

/* ─── Page protection ─── */
async function requireAuth() {
  const user = await getCurrentUser();
  if (!user) { window.location.href = '/login.html'; return null; }
  return user;
}

// Export global
window.MCH = {
  api, toast, openModal, closeModal, logout, getCurrentUser,
  setTokens, formatDate, formatDateTime, roleBadge, statutConvocationBadge,
  initSidebarToggle, initTabs, initUserInfo, initNotifBadge, setActiveNav,
  requireAuth
};
