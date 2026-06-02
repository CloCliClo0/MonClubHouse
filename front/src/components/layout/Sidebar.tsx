import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'

const NAV_GROUPS = [
  {
    label: 'Principal',
    items: [
      { path: '/dashboard',   icon: 'dashboard',             label: 'Tableau de bord' },
      { path: '/calendrier',  icon: 'calendar_today',        label: 'Calendrier'      },
      { path: '/messages',    icon: 'chat',                  label: 'Messages'        },
    ],
  },
  {
    label: 'Équipes',
    items: [
      { path: '/equipes',      icon: 'sports_soccer',        label: 'Équipes'         },
      { path: '/convocations', icon: 'assignment_turned_in', label: 'Convocations'    },
      { path: '/composition',  icon: 'format_list_numbered', label: 'Composition'     },
      { path: '/adversaires',  icon: 'groups',               label: 'Adversaires'     },
    ],
  },
  {
    label: 'Compétitions',
    items: [
      { path: '/resultats',    icon: 'leaderboard',          label: 'Résultats'       },
      { path: '/statistiques', icon: 'bar_chart',            label: 'Statistiques'    },
    ],
  },
  {
    label: 'Club',
    items: [
      { path: '/mon-club',     icon: 'home_work',            label: 'Mon Club'        },
      { path: '/admin',        icon: 'admin_panel_settings', label: 'Administration'  },
    ],
  },
]

export default function Sidebar() {
  const navigate = useNavigate()

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="px-6 py-5 border-b border-white/5">
        <h1 className="text-white font-black text-2xl tracking-tight leading-none">MCH</h1>
        <p className="text-white/40 text-[11px] font-semibold uppercase tracking-widest mt-1">
          Sports Club Management
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {NAV_GROUPS.map(group => (
          <div key={group.label}>
            <p className="px-4 mb-1.5 text-[10px] font-bold uppercase tracking-widest text-white/25">
              {group.label}
            </p>
            <div className="space-y-0.5">
              {group.items.map(({ path, icon, label }) => (
                <NavLink
                  key={path}
                  to={path}
                  end={path === '/resultats'}
                  className={({ isActive }) =>
                    isActive
                      ? 'flex items-center gap-3 px-4 py-2.5 text-primary-fixed bg-primary/15 border-l-4 border-primary rounded-r-lg transition-all'
                      : 'flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-white hover:bg-white/5 rounded-lg transition-colors'
                  }
                >
                  <span className="material-symbols-outlined text-[20px]">{icon}</span>
                  <span className="text-body-md">{label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-3 py-4 border-t border-white/5 space-y-1">
        <button
          onClick={() => navigate('/evenements/creer')}
          className="w-full bg-primary py-2.5 rounded-lg text-white text-label-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors mb-2"
        >
          <span className="material-symbols-outlined text-[20px]">add_circle</span>
          Nouvel événement
        </button>

        <NavLink
          to="/profil"
          className={({ isActive }) =>
            isActive
              ? 'flex items-center gap-3 px-4 py-2.5 text-primary-fixed bg-primary/15 border-l-4 border-primary rounded-r-lg'
              : 'flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-white transition-colors rounded-lg'
          }
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-body-md">Paramètres</span>
        </NavLink>

        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-white/50 hover:text-white hover:bg-white/5 transition-colors rounded-lg"
        >
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-body-md">Déconnexion</span>
        </button>
      </div>
    </aside>
  )
}
