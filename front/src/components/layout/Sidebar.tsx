import { NavLink, useNavigate } from 'react-router-dom'
import { logout } from '../../services/auth'
import Logo from '../Logo'
import { useLang } from '../../i18n/LangContext'

type NavItem  = { path: string; icon: string; label: string }
type NavGroup = { label: string; items: NavItem[] }

interface Props { open: boolean; onClose: () => void }

export default function Sidebar({ open, onClose }: Props) {
  const navigate = useNavigate()
  const { t } = useLang()
  const role   = localStorage.getItem('role') || 'joueur'
  const canCreateEvent = ['dirigeant', 'coach'].includes(role)

  // Nav items avec labels traduits
  const NAV = {
    CALENDRIER:  { path: '/calendrier',   icon: 'calendar_today',       label: t.nav.calendrier    },
    MESSAGES:    { path: '/messages',     icon: 'chat',                 label: t.nav.messages      },
    EQUIPES:     { path: '/equipes',      icon: 'sports_soccer',        label: t.nav.equipes       },
    CONVOCS:     { path: '/convocations', icon: 'assignment_turned_in', label: t.nav.convocations  },
    COMPO:       { path: '/composition',  icon: 'format_list_numbered', label: t.nav.composition   },
    ADVERSAIRES: { path: '/adversaires',  icon: 'groups',               label: t.nav.adversaires   },
    SAISON:      { path: '/saison',       icon: 'emoji_events',         label: t.nav.saison        },
    RESULTATS:   { path: '/resultats',    icon: 'leaderboard',          label: t.nav.resultats     },
    STATS:       { path: '/statistiques', icon: 'bar_chart',            label: t.nav.statistiques  },
    MON_CLUB:    { path: '/mon-club',     icon: 'home_work',            label: t.nav.monClub       },
    ADMIN:       { path: '/admin',        icon: 'admin_panel_settings', label: t.nav.administration},
    SCRAPER:     { path: '/scraper',      icon: 'code_blocks',          label: 'Import FFF'        },
  }

  const roleLabel = t.roles[role as keyof typeof t.roles] ?? role

  const NAV_BY_ROLE: Record<string, NavGroup[]> = {
    superadmin: [
      { label: t.nav.administration, items: [NAV.ADMIN] },
      { label: 'Outils',            items: [NAV.SCRAPER] },
    ],
    admin: [
      { label: t.nav.administration, items: [NAV.ADMIN] },
      { label: 'Outils',            items: [NAV.SCRAPER] },
    ],
    dirigeant: [
      { label: 'Club',          items: [NAV.MON_CLUB, NAV.EQUIPES] },
      { label: 'Planning',      items: [NAV.CALENDRIER] },
      { label: 'Compétition',   items: [NAV.SAISON, NAV.ADVERSAIRES, NAV.RESULTATS, NAV.STATS] },
      { label: 'Communication', items: [NAV.MESSAGES] },
    ],
    coach: [
      { label: 'Mon équipe',    items: [NAV.EQUIPES, NAV.CALENDRIER, NAV.CONVOCS, NAV.COMPO] },
      { label: 'Compétition',   items: [NAV.SAISON, NAV.ADVERSAIRES, NAV.RESULTATS, NAV.STATS] },
      { label: 'Communication', items: [NAV.MESSAGES] },
    ],
    joueur:   [{ label: 'Mon activité', items: [NAV.SAISON, NAV.CONVOCS, NAV.MESSAGES] }],
    parent:   [{ label: 'Mon enfant',   items: [NAV.SAISON, NAV.CONVOCS, NAV.MESSAGES] }],
    visiteur: [{ label: 'Public',       items: [NAV.RESULTATS] }],
  }

  const groups = NAV_BY_ROLE[role] ?? NAV_BY_ROLE['joueur']
  const go = (path: string) => { navigate(path); onClose() }

  return (
    <aside className={`
      fixed left-0 top-0 h-screen w-[260px] bg-sidebar flex flex-col z-50
      transition-transform duration-300 ease-in-out
      ${open ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
    `}>
      {/* Logo + close mobile */}
      <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between">
        <Logo variant="full" size={36} />
        <button onClick={onClose} className="lg:hidden text-white/40 hover:text-white transition-colors">
          <span className="material-symbols-outlined text-[22px]">close</span>
        </button>
      </div>

      {/* Rôle badge */}
      <div className="px-5 py-2 border-b border-white/5">
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">{roleLabel}</span>
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
                <NavLink key={path} to={path} end={path === '/resultats'} onClick={onClose}
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
          <button onClick={() => go('/evenements/creer')}
            className="w-full bg-primary py-2.5 rounded-lg text-white text-label-lg flex items-center justify-center gap-2 hover:bg-primary-container transition-colors mb-2">
            <span className="material-symbols-outlined text-[20px]">add_circle</span>
            {t.nav.nouvelEvent}
          </button>
        )}

        <NavLink to="/profil" onClick={onClose}
          className={({ isActive }) =>
            isActive
              ? 'flex items-center gap-3 px-4 py-2.5 text-primary-fixed bg-primary/15 border-l-4 border-primary rounded-r-lg'
              : 'flex items-center gap-3 px-4 py-2.5 text-white/50 hover:text-white transition-colors rounded-lg'
          }
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className="text-body-md">{t.nav.parametres}</span>
        </NavLink>

        <button onClick={logout}
          className="flex items-center gap-3 px-4 py-2.5 w-full text-white/50 hover:text-white hover:bg-white/5 transition-colors rounded-lg">
          <span className="material-symbols-outlined text-[20px]">logout</span>
          <span className="text-body-md">{t.nav.deconnexion}</span>
        </button>

        <p className="px-4 pt-1 text-[10px] text-white/20 text-center">{t.help.version}</p>
      </div>
    </aside>
  )
}
