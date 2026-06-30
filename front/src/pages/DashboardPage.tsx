import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../contexts/AuthContext'

type Stats = { membres: number; equipes: number; matchs_weekend: number; notifications: number }
type Event = { id: number; titre: string; date: string; heure: string; lieu: string; type: string }
type Notif = { id: number; titre: string; contenu: string; type: string; lu: boolean; created_at: string; lien?: string }
type PersonalStats = {
  taux_presence_matchs: number | null
  taux_presence_entrainements: number | null
  total_convocations: number
  prochaine_convocation: { date: string; type: string; adversaire?: string; statut: string } | null
  vote_en_cours: number | null
}

function EmptyCard({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-on-surface-variant gap-2">
      <span className="material-symbols-outlined text-[36px] opacity-30">{icon}</span>
      <p className="text-body-sm">{text}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user: authUser } = useAuth()
  const [stats, setStats]   = useState<Stats | null>(null)
  const [events, setEvents] = useState<Event[]>([])
  const [notifs, setNotifs] = useState<Notif[]>([])
  const [loading, setLoading] = useState(true)
  const [personalStats, setPersonalStats] = useState<PersonalStats | null>(null)
  const prenom = authUser?.prenom || localStorage.getItem('prenom') || 'vous'
  const isPlayer = authUser && ['joueur', 'parent'].includes(authUser.role)

  useEffect(() => {
    const load = async () => {
      try {
        const [mRes, nRes] = await Promise.all([
          api.get('/matchs?limit=3&statut=programme').catch(() => null),
          api.get('/profil/notifications?limit=3').catch(() => null),
        ])
        if (mRes) {
          const md = mRes.data.data
          setEvents(Array.isArray(md) ? md : (md?.rows ?? md?.matchs ?? []))
        }
        if (nRes) {
          const nd = nRes.data.data
          setNotifs(Array.isArray(nd) ? nd : (nd?.notifications ?? []))
        }

        if (isPlayer) {
          // Stats personnelles
          const convR = await api.get('/licencies/mes-convocations').catch(() => null)
          if (convR) {
            const convocations = convR.data.data || []
            const now = new Date()
            const matchs = convocations.filter((c: any) => c.match?.type === 'match')
            const entrs = convocations.filter((c: any) => c.match?.type !== 'match')
            const calcTaux = (arr: any[]) => {
              const total = arr.filter((c: any) => ['present','absent'].includes(c.statut)).length
              const pres = arr.filter((c: any) => c.statut === 'present').length
              return total > 0 ? Math.round(pres / total * 100) : null
            }
            const upcoming = convocations
              .filter((c: any) => c.match && new Date(c.match.date) >= now)
              .sort((a: any, b: any) => new Date(a.match.date).getTime() - new Date(b.match.date).getTime())
            const prochaine = upcoming[0]?.match ? {
              date: upcoming[0].match.date,
              type: upcoming[0].match.type,
              adversaire: upcoming[0].match.adversaire,
              statut: upcoming[0].statut,
            } : null

            // Chercher un vote en cours (notif de type vote non lue)
            const voteNotif = (Array.isArray(nRes?.data?.data?.notifications) ? nRes.data.data.notifications : [])
              .find((n: any) => n.type === 'vote' && !n.lu && n.lien?.startsWith('/vote/'))
            const vote_en_cours = voteNotif ? parseInt(voteNotif.lien.split('/vote/')[1]) : null

            setPersonalStats({
              taux_presence_matchs: calcTaux(matchs),
              taux_presence_entrainements: calcTaux(entrs),
              total_convocations: convocations.length,
              prochaine_convocation: prochaine,
              vote_en_cours,
            })
          }
        } else {
          const sRes = await api.get('/clubs/stats').catch(() => null)
          if (sRes) setStats(sRes.data.data)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [isPlayer])

  const userRole = authUser?.role || localStorage.getItem('role') || ''
  const isAdminRole = ['admin', 'superadmin', 'dirigeant'].includes(userRole)

  const quickActions = isPlayer ? [
    { icon: 'event_available', label: 'Mes présences', to: '/mes-presences' },
    { icon: 'forum',           label: 'Chat',          to: '/messages'     },
    { icon: 'leaderboard',     label: 'Résultats',     to: '/resultats'    },
    { icon: 'account_circle',  label: 'Profil',        to: '/profil'       },
  ] : isAdminRole ? [
    { icon: 'admin_panel_settings', label: 'Administration', to: '/admin'       },
    { icon: 'sports_soccer',        label: 'Équipes',        to: '/equipes'     },
    { icon: 'calendar_today',       label: 'Calendrier',     to: '/calendrier'  },
    { icon: 'forum',                label: 'Messages',       to: '/messages'    },
  ] : [
    { icon: 'assignment_turned_in', label: 'Convocations', to: '/convocations' },
    { icon: 'format_list_numbered', label: 'Composition',  to: '/composition'  },
    { icon: 'sports_soccer',        label: 'Équipes',      to: '/equipes'      },
    { icon: 'forum',                label: 'Messages',     to: '/messages'     },
  ]

  const statCards = isPlayer ? [
    { label: 'Présence matchs',     value: personalStats?.taux_presence_matchs != null ? `${personalStats.taux_presence_matchs}%` : '—', icon: 'sports_soccer',   color: 'text-green-500',  bg: 'bg-green-50',     border: 'border-l-green-500' },
    { label: 'Présence entraîn.',   value: personalStats?.taux_presence_entrainements != null ? `${personalStats.taux_presence_entrainements}%` : '—', icon: 'fitness_center', color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-l-blue-500' },
    { label: 'Convocations',        value: personalStats?.total_convocations ?? '—', icon: 'assignment_turned_in', color: 'text-orange-500', bg: 'bg-orange-50', border: 'border-l-orange-500' },
    { label: 'Notifications',       value: notifs.filter(n => !n.lu).length || '—',  icon: 'campaign',        color: 'text-error',      bg: 'bg-red-50',       border: 'border-l-error'    },
  ] : [
    { label: 'Membres',       value: stats?.membres,          icon: 'groups',          color: 'text-primary',    bg: 'bg-primary/10',   border: 'border-l-primary'  },
    { label: 'Équipes',       value: stats?.equipes,          icon: 'sports_soccer',   color: 'text-blue-500',   bg: 'bg-blue-50',      border: 'border-l-blue-500' },
    { label: 'Matchs',        value: stats?.matchs_weekend,   icon: 'event_available', color: 'text-orange-500', bg: 'bg-orange-50',    border: 'border-l-orange-500'},
    { label: 'Notifications', value: stats?.notifications,    icon: 'campaign',        color: 'text-error',      bg: 'bg-red-50',       border: 'border-l-error'    },
  ]

  const typeLabel: Record<string, { label: string; bg: string; text: string }> = {
    match:        { label: 'Match',         bg: 'bg-green-100', text: 'text-green-700' },
    entrainement: { label: 'Entraînement',  bg: 'bg-blue-100',  text: 'text-blue-700'  },
    tournoi:      { label: 'Tournoi',       bg: 'bg-yellow-100',text: 'text-yellow-700'},
    default:      { label: 'Événement',     bg: 'bg-slate-100', text: 'text-slate-700' },
  }

  return (
    <div>
      <div className="mb-10">
        <h2 className="text-display-lg text-on-surface">Bonjour {prenom} 👋</h2>
        <p className="text-body-lg text-on-surface-variant mt-2">Voici ce qui se passe dans votre club aujourd'hui.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {statCards.map((s) => (
          <div key={s.label} className={`bg-white border border-[#e8e8f0] p-6 rounded-lg border-l-4 ${s.border} shadow-sm hover:shadow-md transition-shadow`}>
            <div className="flex justify-between items-start">
              <div>
                <p className="text-on-surface-variant text-label-md uppercase tracking-wider">{s.label}</p>
                <h3 className="text-headline-lg text-on-surface mt-2">
                  {loading ? (
                    <span className="inline-block w-12 h-6 bg-surface-container-low rounded animate-pulse" />
                  ) : (
                    s.value ?? '—'
                  )}
                </h3>
              </div>
              <div className={`${s.bg} p-3 rounded-full`}>
                <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bandeaux joueur/parent */}
      {isPlayer && !loading && (
        <div className="space-y-3 mb-6">
          {personalStats?.vote_en_cours && (
            <Link to={`/vote/${personalStats.vote_en_cours}`}
              className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-4 py-3 rounded-xl shadow hover:opacity-90 transition">
              <span className="material-symbols-outlined text-[24px]">star</span>
              <div className="flex-1">
                <p className="font-semibold text-sm">Vote ouvert — Joueur du match</p>
                <p className="text-xs opacity-90">Votez avant la clôture</p>
              </div>
              <span className="material-symbols-outlined">chevron_right</span>
            </Link>
          )}
          {personalStats?.prochaine_convocation && (
            <Link to="/mes-presences"
              className="flex items-center gap-3 bg-white border border-blue-200 px-4 py-3 rounded-xl shadow-sm hover:bg-blue-50 transition">
              <span className="material-symbols-outlined text-blue-500 text-[24px]">event_available</span>
              <div className="flex-1">
                <p className="font-semibold text-sm text-gray-800">
                  Prochaine convocation — {personalStats.prochaine_convocation.type === 'match' ? `Match vs ${personalStats.prochaine_convocation.adversaire || '?'}` : 'Entraînement'}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(personalStats.prochaine_convocation.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  {' '}• Statut : <span className="font-medium">{
                    personalStats.prochaine_convocation.statut === 'present' ? '✓ Présent' :
                    personalStats.prochaine_convocation.statut === 'absent' ? '✕ Absent' :
                    personalStats.prochaine_convocation.statut === 'incertain' ? '? Incertain' : 'En attente de réponse'
                  }</span>
                </p>
              </div>
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </Link>
          )}
        </div>
      )}

      {/* Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prochains événements */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#e8e8f0] flex justify-between items-center">
            <h4 className="text-headline-md">Prochains événements</h4>
            <Link to="/calendrier" className="text-primary text-label-md hover:underline">Voir tout</Link>
          </div>
          <div className="flex-1 divide-y divide-[#e8e8f0]">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}
              </div>
            ) : events.length === 0 ? (
              <EmptyCard icon="calendar_today" text="Aucun événement à venir" />
            ) : (
              events.map((ev) => {
                const t = typeLabel[ev.type] || typeLabel.default
                return (
                  <div key={ev.id} className="p-4 hover:bg-surface-container-low transition-colors flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-orange-100 flex flex-col items-center justify-center text-orange-700 shrink-0">
                      <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
                      <span className="text-[10px] font-bold uppercase">
                        {new Date(ev.date).toLocaleDateString('fr-FR', { weekday: 'short' }).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface truncate">{ev.titre}</p>
                      <p className="text-body-sm text-on-surface-variant">{ev.lieu} • {ev.heure}</p>
                    </div>
                    <span className={`px-2 py-1 ${t.bg} ${t.text} rounded text-label-md text-[11px]`}>{t.label}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#e8e8f0] flex justify-between items-center">
            <h4 className="text-headline-md">Notifications récentes</h4>
            <button className="text-primary text-label-md hover:underline">Marquer comme lu</button>
          </div>
          <div className="flex-1 divide-y divide-[#e8e8f0]">
            {loading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-lg animate-pulse" />)}
              </div>
            ) : notifs.length === 0 ? (
              <EmptyCard icon="notifications_off" text="Aucune notification" />
            ) : (
              notifs.map((n) => (
                <div key={n.id} className={`p-4 flex gap-4 transition-colors ${!n.lu ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'hover:bg-surface-container-low'}`}>
                  <div className={`p-2 rounded-full h-fit ${!n.lu ? 'bg-white border border-blue-100' : 'bg-surface-container-low'}`}>
                    <span className={`material-symbols-outlined ${!n.lu ? 'text-blue-500' : 'text-on-surface-variant'}`}>notifications</span>
                  </div>
                  <div>
                    <p className="text-label-lg text-on-surface">{n.titre}</p>
                    <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-2">{n.contenu}</p>
                    <p className={`text-body-sm mt-1 font-semibold ${!n.lu ? 'text-blue-500' : 'text-on-surface-variant/60'}`}>
                      {new Date(n.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Accès rapides */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden flex flex-col p-6">
          <h4 className="text-headline-md mb-6">Accès rapides</h4>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {quickActions.map((qa) => (
              <Link key={qa.label} to={qa.to}
                className="group bg-surface-container-low hover:bg-primary hover:text-white border border-[#e8e8f0] rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300">
                <span className="material-symbols-outlined text-[32px] text-primary group-hover:text-white transition-colors">{qa.icon}</span>
                <span className="text-label-lg">{qa.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
            <span className="material-symbols-outlined text-primary shrink-0">lightbulb</span>
            <p className="text-body-sm text-on-surface">
              {isAdminRole
                ? 'Gérez vos équipes et membres depuis l\'administration.'
                : isPlayer
                  ? 'Répondez à vos convocations depuis "Mes présences".'
                  : 'Envoyez les convocations et composez votre équipe.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
