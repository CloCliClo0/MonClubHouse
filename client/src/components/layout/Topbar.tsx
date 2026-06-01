import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/calendrier': 'Calendrier',
  '/convocations': 'Convocations',
  '/resultats': 'Résultats & Classement',
  '/club': 'Mon Club',
  '/equipes': 'Équipes',
  '/composition': 'Composition',
  '/chat': 'Chat',
  '/profil': 'Mon Profil',
  '/admin': 'Administration'
};

interface Props {
  onToggleSidebar: () => void;
}

export const Topbar: React.FC<Props> = ({ onToggleSidebar }) => {
  const { pathname } = useLocation();
  const title = pageTitles[pathname] || 'MonClubHouse';

  return (
    <header style={{
      background: '#fff', padding: '0 28px',
      height: 'var(--topbar-h)', display: 'flex', alignItems: 'center',
      borderBottom: '1px solid var(--grey-200)',
      boxShadow: 'var(--shadow-sm)',
      position: 'sticky', top: 0, zIndex: 50, gap: 16
    }}>
      <button
        onClick={onToggleSidebar}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--dark)', padding: 6, borderRadius: 'var(--radius-sm)' }}
        aria-label="Toggle menu"
      >
        ☰
      </button>
      <h1 style={{ fontSize: '1.1rem', fontWeight: 700, flex: 1 }}>{title}</h1>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <TopbarIconBtn to="/chat" label="Messages" icon="💬" />
        <TopbarIconBtn to="/profil#notifications" label="Notifications" icon="🔔" />
        <TopbarIconBtn to="/profil" label="Profil" icon="👤" />
      </div>
    </header>
  );
};

const TopbarIconBtn: React.FC<{ to: string; label: string; icon: string }> = ({ to, label, icon }) => (
  <Link
    to={to}
    title={label}
    style={{
      background: 'none', border: 'none', cursor: 'pointer',
      width: 40, height: 40, borderRadius: 'var(--radius-sm)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1.1rem', textDecoration: 'none',
      transition: 'background var(--transition)', color: 'var(--dark)'
    }}
  >
    {icon}
  </Link>
);
