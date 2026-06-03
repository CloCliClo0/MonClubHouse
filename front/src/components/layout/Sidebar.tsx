import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import Logo from '../Logo'

type NavItem = { path: string; icon: string; label: string }
type NavGroup = { label: string; items: NavItem[] }

// ── Tous les items disponibles ────────────────────────────────────────────────
const DASHBOARD  : NavItem = { path: '/dashboard',          icon: 'dashboard',             label: 'Tableau de bord'  }
const CALENDRIER : NavItem = { path: '/calendrier',         icon: 'calendar_today',        label: 'Calendrier'       }
const MESSAGES   : NavItem = { path: '/messages',           icon: 'chat',                  label: 'Messages'         }
const EQUIPES    : NavItem = { path: '/equipes',            icon: 'sports_soccer',         label: 'Équipes'          }
const CONVOCS    : NavItem = { path: '/convocations',       icon: 'assignment_turned_in',  label: 'Convocations'     }
const COMPO      : NavItem = { path: '/composition',        icon: 'format_list_numbered',  label: 'Composition'      }
const ADVERSAIRES: NavItem = { path: '/adversaires',        icon: 'groups',                label: 'Adversaires'      }
const RESULTATS  : NavItem = { path: '/resultats',          icon: 'leaderboard',           label: 'Résultats'        }
const STATS      : NavItem = { path: '/statistiques',       icon: 'bar_chart',             label: 'Statistiques'     }
const MON_CLUB   : NavItem = { path: '/mon-club',           icon: 'home_work',             label: 'Mon Club'         }
const ADMIN      : NavItem = { path: '/admin',              icon: 'admin_panel_settings',  label: 'Administration'   }
const PROFIL     : NavItem = { path: '/profil',             icon: 'account_circle',        label: 'Mon Profil'       }

// ── Navigation par rôle ───────────────────────────────────────────────────────
const NAV_BY_ROLE: Record<string, NavGroup[]> = {
  superadmin: [
    { label: 'Principal',    items: [DASHBOARD, CALENDRIER, MESSAGES] },
    { label: 'Équipes',      items: [EQUIPES, CONVOCS, COMPO, ADVERSAIRES] },
    { label: 'Compétitions', items: [RESULTATS, STATS] },
    { label: 'Club',         items: [MON_CLUB, ADMIN] },
  ],
  admin: [
    { label: 'Principal',    items: [DASHBOARD, CALENDRIER, MESSAGES] },
    { label: 'Équipes',      items: [EQUIPES, CONVOCS, COMPO, ADVERSAIRES] },
    { label: 'Compétitions', items: [RESULTATS, STATS] },
    { label: 'Club',         items: [MON_CLUB, ADMIN] },
  ],
  dirigeant: [
    { label: 'Principal',    items: [DASHBOARD, CALENDRIER, MESSAGES] },
    { label: 'Équipes',      items: [EQUIPES, CONVOCS, COMPO, ADVERSAIRES] },
    { label: 'Compétitions', items: [RESULTATS, STATS] },
    { label: 'Club',         items: [MON_CLUB] },
  ],
  coach: [
    { label: 'Principal',    items: [DASHBOARD, CALENDRIER, MESSAGES] },
    { label: 'Mes équipes',  items: [EQUIPES, CONVOCS, COMPO, ADVERSAIRES] },
    { label: 'Compétitions', items: [RESULTATS, STATS] },
  ],
  joueur: [
    { label: 'Principal',    items: [DASHBOARD, CALENDRIER, MESSAGES] },
    { label: 'Mon activité', items: [CONVOCS, RESULTATS] },
  ],
  parent: [
    { label: 'Principal',    items: [DASHBOARD, CALENDRIER, MESSAGES] },
    { label: 'Mon enfant',   items: [CONVOCS, RESULTATS] },
  ],
  visiteur: [
    { label: 'Public',       items: [RESULTATS] },
  ],
}

export default function Sidebar() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'joueur'
  const groups = NAV_BY_ROLE[role] ?? NAV_BY_ROLE['joueur']

  const canCreateEvent = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)

  return (
    <aside className="fixed left-0 top-0 h-screen w-[260px] bg-sidebar flex flex-col z-50">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-white/5">
        <Logo variant="full" size={36} />
      </div>

      {/* Rôle badge */}
      <div className="px-5 py-2 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
          {({ superadmin: 'Super Admin', admin: 'Admin', dirigeant: 'Dirigeant', coach: 'Coach', joueur: 'Joueur', parent: 'Parent', visiteur: 'Visiteur' } as Record<string,string>)[role] ?? role}
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
        {groups.map(group => (
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
        {canCreateEvent && (
          <button
            onClick={() => navigate('/evenements/creer')}
            className="w-full bg-primary py-2.5 rounded-lg text-white text-label-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors mb-2"
          >
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            Nouvel événement
          </button>
        )}

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
