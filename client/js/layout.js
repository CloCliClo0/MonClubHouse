/* layout.js — charge la sidebar/topbar communes dans les pages authentifiées */
const SIDEBAR_HTML = `
<aside class="sidebar" id="sidebar">
  <div class="sidebar-brand">
    <div class="brand-logo">MCH</div>
    <div>
      <div class="brand-name">MonClubHouse</div>
      <div class="brand-tagline">Ton club, ta maison</div>
    </div>
  </div>

  <nav class="sidebar-nav">
    <div class="nav-section-label">Principal</div>
    <a class="nav-item" data-page="dashboard" href="/dashboard.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
      Tableau de bord
    </a>
    <a class="nav-item" data-page="calendrier" href="/calendrier.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
      Calendrier
    </a>
    <a class="nav-item" data-page="convocations" href="/convocations.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
      Convocations
    </a>
    <a class="nav-item" data-page="resultats" href="/resultats.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
      Résultats &amp; Classement
    </a>

    <div class="nav-section-label">Club</div>
    <a class="nav-item" data-page="club" href="/club.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      Mon Club
    </a>
    <a class="nav-item" data-page="equipes" href="/equipes.html" data-min-role="coach">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/></svg>
      Équipes
    </a>
    <a class="nav-item" data-page="composition" href="/composition.html" data-min-role="coach">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      Composition
    </a>

    <div class="nav-section-label">Communication</div>
    <a class="nav-item" data-page="chat" href="/chat.html">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      Chat
      <span class="nav-badge hidden" data-notif></span>
    </a>

    <div class="nav-section-label" data-min-role="dirigeant">Administration</div>
    <a class="nav-item" data-page="admin" href="/admin.html" data-min-role="dirigeant">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 0 0 4.93 19.07"/><path d="M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
      Administration
    </a>
  </nav>

  <div class="sidebar-footer">
    <div class="sidebar-avatar"></div>
    <div>
      <div class="sidebar-user-name">—</div>
      <div class="sidebar-user-role">—</div>
    </div>
    <button onclick="MCH.logout()" style="margin-left:auto;background:none;border:none;cursor:pointer;color:var(--grey);" title="Déconnexion">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
    </button>
  </div>
</aside>`;

const TOPBAR_HTML = `
<header class="topbar">
  <button class="topbar-toggle" id="sidebar-toggle" aria-label="Menu">
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
  </button>
  <h1 class="topbar-title" id="topbar-title">MonClubHouse</h1>
  <div class="topbar-actions">
    <button class="icon-btn" onclick="window.location.href='/chat.html'" title="Messages">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>
    <button class="icon-btn" id="notif-btn" onclick="window.location.href='/profil.html#notifications'" title="Notifications">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
      <span class="notif-dot hidden"></span>
    </button>
    <a class="icon-btn" href="/profil.html" title="Profil">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
    </a>
  </div>
</header>`;

async function initLayout(pageTitle = 'MonClubHouse') {
  // Protection auth
  const user = await MCH.requireAuth();
  if (!user) return;

  // Injecter sidebar + topbar
  const appShell = document.querySelector('.app-shell');
  if (!appShell) return;

  appShell.insertAdjacentHTML('afterbegin', SIDEBAR_HTML);

  const mainContent = appShell.querySelector('.main-content');
  if (mainContent) mainContent.insertAdjacentHTML('afterbegin', TOPBAR_HTML);

  // Titres
  document.title = `${pageTitle} — MonClubHouse`;
  const topbarTitle = document.getElementById('topbar-title');
  if (topbarTitle) topbarTitle.textContent = pageTitle;

  // Init
  MCH.setActiveNav();
  MCH.initSidebarToggle();
  MCH.initTabs();
  await MCH.initUserInfo();
  await MCH.initNotifBadge();
}

window.initLayout = initLayout;
