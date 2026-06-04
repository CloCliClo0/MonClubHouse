import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../../services/api'
import { logout } from '../../services/auth'

type Notif = { id: number; titre: string; contenu: string; lu: boolean; created_at: string }

const HELP_LINKS = [
  { icon: 'menu_book',     label: 'Documentation',       path: '/aide/documentation' },
  { icon: 'headset_mic',   label: 'Contacter le support', path: '/aide/support'       },
  { icon: 'school',        label: 'Tutoriels',            path: '/aide/tutoriels'     },
  { icon: 'keyboard',      label: 'Raccourcis clavier',   path: '/aide/raccourcis'    },
]

interface Props { onMenuToggle: () => void }

export default function Topbar({ onMenuToggle }: Props) {
  const navigate = useNavigate()
  const [notifs, setNotifs]         = useState<Notif[]>([])
  const [showNotifs, setShowNotifs] = useState(false)
  const [showHelp, setShowHelp]     = useState(false)
  const [search, setSearch]         = useState('')
  const [installPrompt, setInstallPrompt] = useState<any>(null)
  const [installed, setInstalled]   = useState(false)
  const notifRef = useRef<HTMLDivElement>(null)
  const helpRef  = useRef<HTMLDivElement>(null)

  const prenom = localStorage.getItem('prenom') || 'Utilisateur'
  const role   = localStorage.getItem('role')   || ''

  const loadNotifs = () => {
    api.get('/profil/notifications?limit=5&lu=false')
      .then(r => {
        const d = r.data.data
        const list = Array.isArray(d) ? d : (d?.notifications ?? [])
        setNotifs(list)
      })
      .catch(() => {})
  }

  useEffect(() => {
    loadNotifs()
    // Écoute l'événement d'installation PWA
    const handler = (e: any) => { e.preventDefault(); setInstallPrompt(e) }
    window.addEventListener('beforeinstallprompt', handler)
    // Détecte si déjà installée
    window.addEventListener('appinstalled', () => { setInstalled(true); setInstallPrompt(null) })
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') { setInstalled(true); setInstallPrompt(null) }
  }

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setShowNotifs(false)
      if (helpRef.current  && !helpRef.current.contains(e.target as Node))  setShowHelp(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const markAllRead = async () => {
    await api.patch('/profil/notifications/read-all').catch(() => {})
    setNotifs([])
  }

  const unreadCount = notifs.filter(n => !n.lu).length

  return (
    <header className="fixed top-0 left-0 right-0 lg:left-[260px] h-[64px] bg-white border-b border-outline-variant flex items-center justify-between px-4 lg:px-6 z-40">

      {/* Gauche : hamburger mobile + recherche */}
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Hamburger — mobile uniquement */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg hover:bg-surface-container-low transition-colors shrink-0"
        >
          <span className="material-symbols-outlined text-on-surface-variant text-[24px]">menu</span>
        </button>

        {/* Recherche — masquée sur très petits écrans */}
        <div className="relative hidden sm:block w-full max-w-[360px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all"
            placeholder="Rechercher…"
          />
        </div>
      </div>

      {/* Droite */}
      <div className="flex items-center gap-2 lg:gap-4 shrink-0">
        {/* Bouton installer l'app — visible uniquement si le navigateur propose l'install */}
        {installPrompt && !installed && (
          <button
            onClick={handleInstall}
            title="Installer l'application"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-label-md transition-colors mr-2"
          >
            <span className="material-symbols-outlined text-[18px]">install_mobile</span>
            <span className="hidden md:inline">Installer l'app</span>
          </button>
        )}

        <div className="flex items-center gap-1 lg:gap-2 border-r border-outline-variant pr-3 lg:pr-6">

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => { setShowNotifs(!showNotifs); setShowHelp(false); if (!showNotifs) loadNotifs() }}
              className="relative p-2 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">notifications</span>
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-error rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 mt-2 w-[300px] sm:w-[360px] bg-white rounded-2xl shadow-2xl border border-[#e8e8f0] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
                  <h3 className="text-label-lg text-on-surface font-bold">Notifications</h3>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-primary text-label-md hover:underline">
                      Tout marquer lu
                    </button>
                  )}
                </div>
                <div className="max-h-[320px] overflow-y-auto divide-y divide-[#e8e8f0]">
                  {notifs.length === 0 ? (
                    <div className="py-8 text-center text-on-surface-variant">
                      <span className="material-symbols-outlined text-[36px] block mb-2 opacity-30">notifications_off</span>
                      <p className="text-body-sm">Aucune notification</p>
                    </div>
                  ) : (
                    notifs.map(n => (
                      <div key={n.id}
                        className={`px-4 py-3 hover:bg-surface-container-low transition-colors cursor-pointer ${!n.lu ? 'bg-blue-50/50 border-l-4 border-blue-500' : ''}`}>
                        <p className="text-label-lg text-on-surface">{n.titre}</p>
                        <p className="text-body-sm text-on-surface-variant mt-0.5 line-clamp-2">{n.contenu}</p>
                        <p className="text-[11px] text-on-surface-variant/60 mt-1">
                          {new Date(n.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    ))
                  )}
                </div>
                <div className="px-4 py-3 border-t border-[#e8e8f0] text-center">
                  <button onClick={() => { navigate('/profil'); setShowNotifs(false) }}
                    className="text-primary text-label-md hover:underline">
                    Voir toutes les notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Aide */}
          <div ref={helpRef} className="relative">
            <button
              onClick={() => { setShowHelp(!showHelp); setShowNotifs(false) }}
              className="p-2 rounded-full hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-on-surface-variant text-[22px]">help</span>
            </button>

            {showHelp && (
              <div className="absolute right-0 mt-2 w-[220px] bg-white rounded-2xl shadow-2xl border border-[#e8e8f0] overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-[#e8e8f0]">
                  <p className="text-label-lg text-on-surface font-bold">Aide &amp; Ressources</p>
                </div>
                <div className="py-1">
                  {HELP_LINKS.map(l => (
                    <button
                      key={l.path}
                      onClick={() => { navigate(l.path); setShowHelp(false) }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-surface-container-low transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{l.icon}</span>
                      <span className="text-body-md text-on-surface">{l.label}</span>
                    </button>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-[#e8e8f0] text-center">
                  <p className="text-[11px] text-on-surface-variant">MonClubHouse v1.0</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Profil */}
        <button onClick={() => navigate('/profil')} className="flex items-center gap-2 lg:gap-3 cursor-pointer group">
          <div className="hidden sm:block text-right">
            <p className="text-label-lg text-on-surface leading-none">{prenom}</p>
            <p className="text-body-sm text-on-surface-variant capitalize">{role}</p>
          </div>
          <div className="w-9 h-9 lg:w-10 lg:h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm group-hover:ring-2 group-hover:ring-primary transition-all shrink-0">
            {prenom.slice(0, 2).toUpperCase()}
          </div>
        </button>

        {/* Déconnexion — masquée sur mobile (dispo dans sidebar) */}
        <button onClick={logout} title="Déconnexion"
          className="hidden sm:flex p-2 rounded-full hover:bg-red-50 hover:text-error text-on-surface-variant transition-colors">
          <span className="material-symbols-outlined text-[20px]">logout</span>
        </button>
      </div>
    </header>
  )
}
