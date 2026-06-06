import { useEffect, useState } from 'react'
import api from '../services/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type PlayerStatut = 'present' | 'absent' | 'incertain' | 'sans_reponse'

type Match = {
  id: number
  adversaire: string
  date: string
  heure_rdv: string
  type: string
  terrain?: { nom: string }
  equipe: { id: number; nom: string }
}

type Player = {
  id: number
  nom: string
  prenom: string
  statut: PlayerStatut
  notif_email: boolean
  licencie?: { poste: string; numero_maillot: number }
}

type TeamPlayer = {
  userId: number
  nom: string
  prenom: string
  poste: string | null
  numero_maillot: number | null
}

type SendStep = 'idle' | 'preview' | 'sending' | 'done'

// ── Constantes ────────────────────────────────────────────────────────────────

const BADGE: Record<PlayerStatut, { label: string; bg: string; text: string; icon: string }> = {
  present:      { label: 'Présent',    bg: 'bg-green-100',  text: 'text-green-700',  icon: 'check_circle' },
  absent:       { label: 'Absent',     bg: 'bg-red-100',    text: 'text-red-700',    icon: 'cancel'       },
  incertain:    { label: 'Incertain',  bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'help'         },
  sans_reponse: { label: 'En attente', bg: 'bg-orange-100', text: 'text-orange-700', icon: 'schedule'     },
}

// ── Composants internes ───────────────────────────────────────────────────────

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-surface-container-highest'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ConvocationsPage() {
  const [matches, setMatches]             = useState<Match[]>([])
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null)
  const [players, setPlayers]             = useState<Player[]>([])
  const [teamPlayers, setTeamPlayers]     = useState<TeamPlayer[]>([])
  const [loadingMatches, setLoadingMatches] = useState(true)
  const [loadingPlayers, setLoadingPlayers] = useState(false)
  const [isClubFallback, setIsClubFallback] = useState(false)

  // Panneau d'ajout
  const [showAddPanel, setShowAddPanel]   = useState(false)
  const [pendingAdd, setPendingAdd]       = useState<Set<number>>(new Set())
  const [addSearch, setAddSearch]         = useState('')
  const [addingPlayers, setAddingPlayers] = useState(false)

  // Email
  const [sendEmail, setSendEmail]         = useState(true)
  const [instructions, setInstructions]   = useState('')
  const [sendStep, setSendStep]           = useState<SendStep>('idle')
  const [emailReport, setEmailReport]     = useState<{ sent: number; failed: number } | null>(null)

  // ── Chargement des matchs ──────────────────────────────────────────────────

  useEffect(() => {
    api.get('/matchs?statut=programme')
      .then(r => setMatches(r.data.data || r.data || []))
      .catch(() => setMatches([]))
      .finally(() => setLoadingMatches(false))
  }, [])

  // ── Chargement convocations + roster équipe ────────────────────────────────

  const loadMatch = async (match: Match) => {
    setSelectedMatch(match)
    setLoadingPlayers(true)
    setShowAddPanel(false)
    setPendingAdd(new Set())
    setPlayers([])
    setTeamPlayers([])
    setIsClubFallback(false)

    try {
      const [convoRes, teamRes] = await Promise.all([
        api.get(`/matchs/${match.id}/convocations`),
        api.get(`/equipes/${match.equipe.id}`),
      ])

      // Convocations existantes
      const convoList = convoRes.data.data || convoRes.data || []
      const mapped: Player[] = convoList.map((c: any) => ({
        id:          c.joueur?.id,
        nom:         c.joueur?.nom,
        prenom:      c.joueur?.prenom,
        statut:      c.statut === 'convoque' ? 'sans_reponse' : c.statut,
        notif_email: c.joueur?.notif_email ?? true,
        licencie:    c.joueur?.licence,
      }))
      setPlayers(mapped)

      // Roster de l'équipe
      const equipeData = teamRes.data.data || teamRes.data || {}
      const licencies: any[] = equipeData.licencies || []
      const activeLicencies = licencies.filter((l: any) => l.statut === 'actif' && l.user)

      if (activeLicencies.length > 0) {
        setTeamPlayers(activeLicencies.map((l: any) => ({
          userId:         l.user.id,
          nom:            l.user.nom,
          prenom:         l.user.prenom,
          poste:          l.poste ?? null,
          numero_maillot: l.numero_maillot ?? null,
        })))
      } else {
        // Fallback : roster vide → afficher tous les joueurs du club
        try {
          const usersRes = await api.get('/admin/users')
          const allUsers: any[] = usersRes.data.data || usersRes.data || []
          setTeamPlayers(allUsers
            .filter((u: any) => ['joueur', 'parent'].includes(u.role))
            .map((u: any) => ({
              userId:         u.id,
              nom:            u.nom,
              prenom:         u.prenom,
              poste:          null,
              numero_maillot: null,
            }))
          )
          setIsClubFallback(true)
        } catch {
          // keep empty
        }
      }
    } catch {
      setPlayers([])
    } finally {
      setLoadingPlayers(false)
    }
  }

  // ── Joueurs de l'équipe non encore convoqués ───────────────────────────────

  const convokedIds = new Set(players.map(p => p.id))

  const availablePlayers = teamPlayers
    .filter(tp => !convokedIds.has(tp.userId))
    .filter(tp => {
      const q = addSearch.toLowerCase()
      return !q || tp.prenom.toLowerCase().includes(q) || tp.nom.toLowerCase().includes(q)
    })

  // ── Ajouter des joueurs à la convocation ──────────────────────────────────

  const togglePending = (userId: number) => {
    setPendingAdd(prev => {
      const next = new Set(prev)
      next.has(userId) ? next.delete(userId) : next.add(userId)
      return next
    })
  }

  const selectAllAvailable = () =>
    setPendingAdd(new Set(availablePlayers.map(p => p.userId)))

  const handleAddPlayers = async () => {
    if (!selectedMatch || pendingAdd.size === 0) return
    setAddingPlayers(true)
    try {
      await api.post(`/matchs/${selectedMatch.id}/convocations`, {
        match_id:      selectedMatch.id,
        joueur_ids:    Array.from(pendingAdd),
        envoyer_email: false,
      })
      // Recharger les convocations
      const r = await api.get(`/matchs/${selectedMatch.id}/convocations`)
      const list = r.data.data || r.data || []
      setPlayers(list.map((c: any) => ({
        id:          c.joueur?.id,
        nom:         c.joueur?.nom,
        prenom:      c.joueur?.prenom,
        statut:      c.statut === 'convoque' ? 'sans_reponse' : c.statut,
        notif_email: c.joueur?.notif_email ?? true,
        licencie:    c.joueur?.licence,
      })))
      setPendingAdd(new Set())
      setShowAddPanel(false)
    } catch {
      // échec silencieux
    } finally {
      setAddingPlayers(false)
    }
  }

  // ── Réponse / email ────────────────────────────────────────────────────────

  const updateResponse = (id: number, statut: PlayerStatut) => {
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, statut } : p))
    if (selectedMatch) {
      api.patch(`/matchs/${selectedMatch.id}/reponse`, { statut, joueur_id: id }).catch(() => {})
    }
  }

  const toggleEmail = (id: number) =>
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, notif_email: !p.notif_email } : p))

  const stats = {
    present:      players.filter(p => p.statut === 'present').length,
    absent:       players.filter(p => p.statut === 'absent').length,
    incertain:    players.filter(p => p.statut === 'incertain').length,
    sans_reponse: players.filter(p => p.statut === 'sans_reponse').length,
  }
  const emailCount = players.filter(p => p.notif_email).length

  const handleSend = async () => {
    if (!selectedMatch) return
    setSendStep('sending')
    try {
      const joueur_ids = players.map(p => p.id)
      const r = await api.post(`/matchs/${selectedMatch.id}/convocations`, {
        match_id: selectedMatch.id, joueur_ids, envoyer_email: sendEmail,
        instructions: instructions || undefined,
      })
      setEmailReport(r.data.email || { sent: sendEmail ? emailCount : 0, failed: 0 })
    } catch {
      setEmailReport({ sent: 0, failed: players.length })
    }
    setSendStep('done')
  }

  // ── Sélection du match ─────────────────────────────────────────────────────

  if (!selectedMatch) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-headline-lg text-on-surface">Convocations</h2>
          <p className="text-body-md text-on-surface-variant">Sélectionnez un match pour gérer les convocations</p>
        </div>

        {loadingMatches ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1,2,3].map(i => <div key={i} className="h-24 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />)}
          </div>
        ) : matches.length === 0 ? (
          <div className="py-20 text-center bg-white border border-[#e8e8f0] rounded-xl">
            <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">assignment_turned_in</span>
            <p className="text-headline-md text-on-surface mb-2">Aucun match à venir</p>
            <p className="text-body-md text-on-surface-variant">Créez d'abord un match dans le calendrier.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {matches.map(m => (
              <button key={m.id} onClick={() => loadMatch(m)}
                className="bg-white border border-[#e8e8f0] rounded-xl p-5 text-left hover:border-primary/50 hover:shadow-md transition-all group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                    <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-label-lg text-on-surface font-bold">
                      {m.equipe?.nom}{m.adversaire ? ` vs ${m.adversaire}` : ''}
                    </p>
                    <p className="text-body-sm text-on-surface-variant mt-1">
                      {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                      {m.heure_rdv && ` · ${m.heure_rdv}`}
                    </p>
                    {m.terrain && <p className="text-body-sm text-on-surface-variant">{m.terrain.nom}</p>}
                  </div>
                  <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Gestion convocations ───────────────────────────────────────────────────

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => setSelectedMatch(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Choisir un autre match
          </button>
          <h2 className="text-headline-lg text-on-surface">Convocations</h2>
          <p className="text-body-md text-on-surface-variant">
            {selectedMatch.equipe?.nom}{selectedMatch.adversaire ? ` vs ${selectedMatch.adversaire}` : ''}
          </p>
        </div>
        <button
          onClick={() => setSendStep('preview')}
          disabled={players.length === 0}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-label-lg hover:bg-primary/90 transition-colors shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          Envoyer les convocations
        </button>
      </div>

      {/* Info match */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-5 mb-5">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0">
            <span className="material-symbols-outlined text-[22px]">sports_soccer</span>
          </div>
          <div>
            <h3 className="text-headline-md text-on-surface">
              {selectedMatch.equipe?.nom}{selectedMatch.adversaire ? ` vs ${selectedMatch.adversaire}` : ''}
            </h3>
            <div className="flex flex-wrap gap-4 mt-1 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                {new Date(selectedMatch.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </span>
              {selectedMatch.heure_rdv && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {selectedMatch.heure_rdv}
                </span>
              )}
              {selectedMatch.terrain && (
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  {selectedMatch.terrain.nom}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      {players.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
          {[
            { key: 'present',      label: 'Présents',    color: 'text-green-600',  border: 'border-l-green-500'  },
            { key: 'absent',       label: 'Absents',     color: 'text-red-600',    border: 'border-l-red-500'    },
            { key: 'incertain',    label: 'Incertains',  color: 'text-yellow-600', border: 'border-l-yellow-400' },
            { key: 'sans_reponse', label: 'En attente',  color: 'text-orange-500', border: 'border-l-orange-400' },
          ].map(s => (
            <div key={s.key} className={`bg-white border border-[#e8e8f0] border-l-4 ${s.border} rounded-lg p-4 text-center`}>
              <p className={`text-display-lg font-black ${s.color}`}>{stats[s.key as keyof typeof stats]}</p>
              <p className="text-label-md text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Liste joueurs */}
        <div className="lg:col-span-2 space-y-4">

          {/* Joueurs convoqués */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between">
              <h4 className="text-headline-md">Joueurs convoqués ({players.length})</h4>
              {!loadingPlayers && !showAddPanel && (
                <button
                  onClick={() => setShowAddPanel(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-label-md transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">person_add</span>
                  Ajouter des joueurs
                </button>
              )}
            </div>

            {loadingPlayers ? (
              <div className="p-4 space-y-3">
                {[1,2,3,4].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
              </div>
            ) : players.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">group_off</span>
                <p className="text-body-md font-medium">Aucun joueur convoqué</p>
                <p className="text-body-sm mt-1">Ajoutez des joueurs depuis le roster de l'équipe.</p>
                {!showAddPanel && (
                  <button
                    onClick={() => setShowAddPanel(true)}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-label-md mx-auto hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">person_add</span>
                    Ajouter des joueurs
                  </button>
                )}
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {players.map(p => {
                  const badge = BADGE[p.statut]
                  return (
                    <div key={p.id} className="p-4 flex items-center gap-3 hover:bg-surface-container-low transition-colors">
                      <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {p.prenom?.[0]}{p.nom?.[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-lg text-on-surface">{p.prenom} {p.nom}</p>
                        <p className="text-body-sm text-on-surface-variant">{p.licencie?.poste || '—'}</p>
                      </div>
                      <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md ${badge.bg} ${badge.text}`}>
                        <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                        {badge.label}
                      </div>
                      <button
                        onClick={() => toggleEmail(p.id)}
                        title={p.notif_email ? 'Email activé' : 'Email désactivé'}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          p.notif_email ? 'text-primary hover:bg-primary/10' : 'text-on-surface-variant/40 hover:bg-surface-container'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">{p.notif_email ? 'mark_email_read' : 'mail_off'}</span>
                      </button>
                      <div className="flex gap-1">
                        <button onClick={() => updateResponse(p.id, 'present')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            p.statut === 'present' ? 'bg-green-500 text-white' : 'hover:bg-green-100 text-green-600'
                          }`}>
                          <span className="material-symbols-outlined text-[18px]">check</span>
                        </button>
                        <button onClick={() => updateResponse(p.id, 'absent')}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            p.statut === 'absent' ? 'bg-red-500 text-white' : 'hover:bg-red-100 text-red-600'
                          }`}>
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Panneau d'ajout de joueurs */}
          {showAddPanel && (
            <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between">
                <div>
                  <h4 className="text-headline-md">Ajouter des joueurs</h4>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    {isClubFallback
                      ? `${availablePlayers.length} joueur${availablePlayers.length > 1 ? 's' : ''} du club`
                      : `${availablePlayers.length} joueur${availablePlayers.length > 1 ? 's' : ''} disponible${availablePlayers.length > 1 ? 's' : ''} dans l'équipe`
                    }
                  </p>
                </div>
                <button
                  onClick={() => { setShowAddPanel(false); setPendingAdd(new Set()); setAddSearch('') }}
                  className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">close</span>
                </button>
              </div>

              {/* Recherche + sélectionner tout */}
              <div className="p-3 border-b border-[#e8e8f0] flex items-center gap-3">
                <div className="relative flex-1">
                  <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                  <input
                    value={addSearch}
                    onChange={e => setAddSearch(e.target.value)}
                    placeholder="Rechercher un joueur…"
                    className="w-full pl-9 pr-3 py-2 text-body-md border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <button
                  onClick={selectAllAvailable}
                  className="px-3 py-2 text-label-md text-primary hover:bg-primary/10 rounded-lg transition-colors shrink-0"
                >
                  Tout sélectionner
                </button>
              </div>

              {/* Liste */}
              {availablePlayers.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px] block mb-2 opacity-30">
                    {teamPlayers.length === 0 ? 'groups' : 'check_circle'}
                  </span>
                  <p className="text-body-sm">
                    {addSearch
                      ? 'Aucun résultat pour cette recherche.'
                      : 'Tous les joueurs disponibles sont déjà convoqués.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[#e8e8f0] max-h-[320px] overflow-y-auto">
                  {availablePlayers.map(tp => {
                    const checked = pendingAdd.has(tp.userId)
                    return (
                      <div
                        key={tp.userId}
                        onClick={() => togglePending(tp.userId)}
                        className={`p-4 flex items-center gap-3 cursor-pointer transition-colors ${
                          checked ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-surface-container-low'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                          checked ? 'bg-primary border-primary' : 'border-outline-variant'
                        }`}>
                          {checked && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                        </div>
                        <div className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant font-bold text-sm shrink-0">
                          {tp.prenom?.[0]}{tp.nom?.[0]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-label-lg text-on-surface">{tp.prenom} {tp.nom}</p>
                          <p className="text-body-sm text-on-surface-variant">{tp.poste || '—'}</p>
                        </div>
                        {tp.numero_maillot && (
                          <span className="text-label-md text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded text-[11px]">
                            #{tp.numero_maillot}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Footer */}
              <div className="p-4 border-t border-[#e8e8f0] flex items-center justify-between bg-surface-container-low/50">
                <span className="text-body-sm text-on-surface-variant">
                  {pendingAdd.size > 0
                    ? `${pendingAdd.size} joueur${pendingAdd.size > 1 ? 's' : ''} sélectionné${pendingAdd.size > 1 ? 's' : ''}`
                    : 'Sélectionnez des joueurs à ajouter'}
                </span>
                <button
                  onClick={handleAddPlayers}
                  disabled={pendingAdd.size === 0 || addingPlayers}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-label-md hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {addingPlayers
                    ? <><span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>Ajout…</>
                    : <><span className="material-symbols-outlined text-[18px]">person_add</span>Ajouter {pendingAdd.size > 0 ? `(${pendingAdd.size})` : ''}</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Panneau latéral */}
        <div className="space-y-4">
          {/* Email */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">mail</span>
                </div>
                <div>
                  <p className="text-label-lg text-on-surface">Envoi par email</p>
                  <p className="text-body-sm text-on-surface-variant">Via Hostinger Mail</p>
                </div>
              </div>
              <Toggle on={sendEmail} onChange={setSendEmail} />
            </div>
            {sendEmail && players.length > 0 && (
              <div className="space-y-2 pt-3 border-t border-[#e8e8f0]">
                <div className="flex justify-between text-body-sm">
                  <span className="text-on-surface-variant">Emails à envoyer</span>
                  <span className="font-semibold text-primary">{emailCount} / {players.length}</span>
                </div>
                <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all"
                    style={{ width: players.length ? `${(emailCount / players.length) * 100}%` : '0%' }} />
                </div>
              </div>
            )}
          </div>

          {/* Instructions */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl p-5">
            <p className="text-label-lg text-on-surface mb-3">Instructions du coach</p>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              rows={4}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              placeholder="Ex : Soyez présents 30 min avant…"
            />
          </div>

          {/* Récap */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
            <p className="text-label-lg text-primary">Récapitulatif</p>
            <div className="space-y-1.5 text-body-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Joueurs convoqués</span>
                <span className="font-semibold">{players.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Emails</span>
                <span className="font-semibold">{sendEmail ? emailCount : 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Notifs in-app</span>
                <span className="font-semibold">{players.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal confirmation envoi */}
      {(sendStep === 'preview' || sendStep === 'sending' || sendStep === 'done') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {sendStep !== 'done' ? (
              <>
                <div className="p-6 border-b border-[#e8e8f0]">
                  <h3 className="text-headline-md">Confirmer l'envoi</h3>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Les joueurs recevront une notification et devront confirmer leur présence.
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Joueurs convoqués</span>
                    <span className="font-semibold">{players.length}</span>
                  </div>
                  {sendEmail && (
                    <div className="flex justify-between text-body-md">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                        Emails Hostinger
                      </span>
                      <span className="font-semibold text-primary">{emailCount} emails</span>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-[#e8e8f0] flex justify-end gap-3">
                  <button
                    onClick={() => setSendStep('idle')}
                    disabled={sendStep === 'sending'}
                    className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sendStep === 'sending'}
                    className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-70 flex items-center gap-2"
                  >
                    {sendStep === 'sending'
                      ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Envoi…</>
                      : <><span className="material-symbols-outlined text-[18px]">send</span>Confirmer</>
                    }
                  </button>
                </div>
              </>
            ) : emailReport && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-green-600 text-[36px]">check_circle</span>
                </div>
                <h3 className="text-headline-md mb-2">Convocations envoyées !</h3>
                <div className="grid grid-cols-2 gap-3 mb-6 mt-4">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-2xl font-black text-green-600">{emailReport.sent}</p>
                    <p className="text-label-md text-green-700 mt-0.5">Emails envoyés</p>
                  </div>
                  <div className="bg-surface-container-low border border-[#e8e8f0] rounded-xl p-4">
                    <p className="text-2xl font-black text-on-surface-variant">{emailReport.failed}</p>
                    <p className="text-label-md text-on-surface-variant mt-0.5">Sans email</p>
                  </div>
                </div>
                <button
                  onClick={() => { setSendStep('idle'); setEmailReport(null) }}
                  className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary/90 transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
