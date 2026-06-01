import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

const ROLE_LEVEL: Record<string, number> = {
  superadmin: 6, admin: 5, dirigeant: 4, coach: 3, joueur: 2, parent: 2, visiteur: 1
};

const navItems = [
  { group: 'Principal', items: [
    { to: '/dashboard', label: 'Tableau de bord', icon: '⊞', minRole: 'visiteur' },
    { to: '/calendrier', label: 'Calendrier', icon: '📅', minRole: 'visiteur' },
    { to: '/convocations', label: 'Convocations', icon: '👥', minRole: 'joueur' },
    { to: '/resultats', label: 'Résultats & Classement', icon: '📊', minRole: 'visiteur' }
  ]},
  { group: 'Club', items: [
    { to: '/club', label: 'Mon Club', icon: '🏠', minRole: 'visiteur' },
    { to: '/equipes', label: 'Équipes', icon: '⚽', minRole: 'coach' },
    { to: '/composition', label: 'Composition', icon: '🗺️', minRole: 'coach' }
  ]},
  { group: 'Communication', items: [
    { to: '/chat', label: 'Chat', icon: '💬', minRole: 'joueur' }
  ]},
  { group: 'Administration', items: [
    { to: '/admin', label: 'Administration', icon: '⚙️', minRole: 'dirigeant' }
  ]}
];

interface Props {
  open: boolean;
}

export const Sidebar: React.FC<Props> = ({ open }) => {
  const { user, logout } = useAuth();
  const userLevel = ROLE_LEVEL[user?.role || 'visiteur'] || 0;

  return (
    <aside style={{
      width: 'var(--sidebar-w)',
      background: 'var(--dark)',
      color: '#fff',
      display: 'flex', flexDirection: 'column',
      position: 'fixed', top: 0, left: 0, bottom: 0,
      zIndex: 100,
      transform: open ? 'translateX(0)' : 'translateX(calc(-1 * var(--sidebar-w)))',
      transition: 'transform var(--transition)'
    }}>
      {/* Brand */}
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{
          width: 44, height: 44, background: 'var(--primary)', borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 800, fontSize: '1rem', color: '#fff', letterSpacing: .5
        }}>MCH</div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 700 }}>MonClubHouse</div>
          <div style={{ fontSize: '.7rem', color: 'var(--grey-400)' }}>Ton club, ta maison</div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '12px 0' }}>
        {navItems.map(group => {
          const visibleItems = group.items.filter(item =>
            userLevel >= (ROLE_LEVEL[item.minRole] || 0)
          );
          if (!visibleItems.length) return null;
          return (
            <div key={group.group}>
              <div style={{ fontSize: '.65rem', textTransform: 'uppercase', letterSpacing: 1, color: 'var(--grey-400)', padding: '12px 20px 4px' }}>
                {group.group}
              </div>
              {visibleItems.map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '11px 20px',
                    color: isActive ? '#fff' : 'rgba(255,255,255,.75)',
                    textDecoration: 'none', fontSize: '.92rem',
                    background: isActive ? 'rgba(255,255,255,.08)' : 'transparent',
                    borderLeft: isActive ? '3px solid var(--primary-light)' : '3px solid transparent',
                    transition: 'all var(--transition)'
                  })}
                >
                  <span style={{ fontSize: '1rem' }}>{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 700, fontSize: '.85rem', color: '#fff', flexShrink: 0, overflow: 'hidden'
        }}>
          {user?.avatar
            ? <img src={user.avatar} alt={user.nom} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : `${user?.prenom?.[0] || ''}${user?.nom?.[0] || ''}`
          }
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user?.prenom} {user?.nom}
          </div>
          <div style={{ fontSize: '.7rem', color: 'var(--grey-400)', textTransform: 'capitalize' }}>{user?.role}</div>
        </div>
        <button
          onClick={logout}
          title="Déconnexion"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--grey-400)', padding: 4 }}
        >
          ↩
        </button>
      </div>
    </aside>
  );
};
