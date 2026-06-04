import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

type Convocation = {
  id: number
  joueur_id: number
  statut: 'convoque' | 'present' | 'absent' | 'incertain'
  commentaire?: string
  joueur: { id: number; nom: string; prenom: string; avatar?: string }
}

type MatchEvent = {
  id: number
  type: string
  adversaire?: string
  date: string
  domicile: boolean
  statut: string
  score_equipe?: number
  score_adversaire?: number
  notes?: string
  equipe: { id: number; nom: string; categorie: string; couleur_maillot?: string }
  terrain?: { nom: string; adresse?: string }
  convocations: Convocation[]
}

const TYPE_INFO: Record<string, { label: string; icon: string; color: string }> = {
  match:       { label: 'Match',         icon: 'sports_soccer',  color: 'bg-green-100 text-green-700'   },
  amical:      { label: 'Match amical',  icon: 'sports_soccer',  color: 'bg-teal-100 text-teal-700'     },
  coupe:       { label: 'Coupe',         icon: 'emoji_events',   color: 'bg-yellow-100 text-yellow-700' },
  tournoi:     { label: 'Tournoi',       icon: 'emoji_events',   color: 'bg-purple-100 text-purple-700' },
  entrainement:{ label: 'Entraînement',  icon: 'fitness_center', color: 'bg-blue-100 text-blue-700'     },
  plateau:     { label: 'Plateau',       icon: 'view_quilt',     color: 'bg-indigo-100 text-indigo-700' },
  reunion:     { label: 'Réunion',       icon: 'groups',         color: 'bg-slate-100 text-slate-700'   },
  autre:       { label: 'Événement',     icon: 'event',          color: 'bg-gray-100 text-gray-700'     },
}

const STATUT_COLORS: Record<string, string> = {
  present:   'bg-green-100 text-green-700 border-green-300',
  absent:    'bg-red-100 text-red-700 border-red-300',
  incertain: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  convoque:  'bg-orange-100 text-orange-600 border-orange-300',
}

const STATUT_LABEL: Record<string, string> = {
  present: 'Présent', absent: 'Absent', incertain: 'Incertain', convoque: 'En attente de réponse',
}

export default function EventPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const role   = localStorage.getItem('role') || 'joueur'
  const userId = parseInt(localStorage.getItem('userId') || '0')

  const isCoachOrMore = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)
  const isPlayer      = ['joueur', 'parent'].includes(role)

  const [event, setEvent]     = useState<MatchEvent | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'presences' | 'resultat' | 'modifier'>('presences')
  const [responding, setResponding] = useState(false)
  const [deleting, setDeleting]     = useState(false)

  // Formulaire d'édition
  const [editForm, setEditForm]   = useState<{ date: string; heure: string; terrain_id: string; adversaire: string; notes: string }>({
    date: '', heure: '', terrain_id: '', adversaire: '', notes: ''
  })
  const [terrains, setTerrains]   = useState<{ id: number; nom: string }[]>([])
  const [savingEdit, setSavingEdit] = useState(false)
  const [editMsg, setEditMsg]       = useState('')

  // Score edit (coach/dirigeant)
  const [scoreHome, setScoreHome] = useState<number | null>(null)
  const [scoreAway, setScoreAway] = useState<number | null>(null)
  const [savingScore, setSavingScore] = useState(false)
  const [scoreMsg, setScoreMsg] = useState('')

  const load = () => {
    api.get(`/matchs/${id}`)
      .then(r => {
        const m = r.data.data
        setEvent(m)
        setScoreHome(m.score_equipe ?? null)
        setScoreAway(m.score_adversaire ?? null)
      })
      .catch(() => navigate('/calendrier'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  // Charger les terrains pour le formulaire d'édition
  useEffect(() => {
    if (isCoachOrMore) {
      api.get('/clubs/terrains').then(r => setTerrains(r.data.data || [])).catch(() => {})
    }
  }, [])

  // Synchroniser le formulaire d'édition quand l'event est chargé
  useEffect(() => {
    if (!event) return
    const dt = new Date((event.date || '').replace(' ', 'T'))
    setEditForm({
      date:       isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10),
      heure:      isNaN(dt.getTime()) ? '' : dt.toTimeString().slice(0, 5),
      terrain_id: String(event.terrain ? (event as any).terrain_id ?? '' : ''),
      adversaire: event.adversaire || '',
      notes:      event.notes || '',
    })
  }, [event])

  // Ma propre convocation (joueur/parent)
  const myConvoc = event?.convocations.find(c => c.joueur?.id === userId)

  const respond = async (statut: 'present' | 'absent' | 'incertain') => {
    if (!myConvoc) return
    setResponding(true)
    try {
      await api.patch(`/matchs/${id}/reponse`, { statut, joueur_id: userId })
      load()
    } catch {}
    finally { setResponding(false) }
  }

  const updatePlayerStatut = async (convocId: number, joueurId: number, statut: string) => {
    await api.patch(`/matchs/${id}/reponse`, { statut, joueur_id: joueurId }).catch(() => {})
    load()
  }

  const deleteEvent = async () => {
    if (!confirm('Supprimer cet événement ? Cette action est irréversible.')) return
    setDeleting(true)
    try {
      await api.patch(`/matchs/${id}/disable`)
      navigate('/calendrier')
    } catch {
      alert('Erreur lors de la suppression')
      setDeleting(false)
    }
  }

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingEdit(true)
    setEditMsg('')
    try {
      const payload: Record<string, any> = {
        date:      `${editForm.date}T${editForm.heure}:00`,
        adversaire: editForm.adversaire || null,
        notes:     editForm.notes || null,
      }
      if (editForm.terrain_id) payload.terrain_id = parseInt(editForm.terrain_id)
      await api.put(`/matchs/${id}`, payload)
      setEditMsg('Modifications enregistrées !')
      setTimeout(() => setEditMsg(''), 2500)
      load()
    } catch {
      setEditMsg('Erreur lors de la sauvegarde')
    } finally {
      setSavingEdit(false)
    }
  }

  const saveScore = async () => {
    if (scoreHome === null || scoreAway === null) return
    setSavingScore(true)
    setScoreMsg('')
    try {
      await api.patch(`/matchs/${id}/score`, {
        score_equipe: scoreHome,
        score_adversaire: scoreAway,
        statut: 'termine',
      })
      setScoreMsg('Score enregistré !')
      setTimeout(() => setScoreMsg(''), 2500)
      load()
    } catch {
      setScoreMsg('Erreur lors de la sauvegarde')
    } finally {
      setSavingScore(false)
    }
  }

  if (loading) return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <div className="h-40 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
      <div className="h-64 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
    </div>
  )
  if (!event) return null

  const info  = TYPE_INFO[event.type] ?? TYPE_INFO['autre']
  const isMatch = ['match', 'amical', 'coupe', 'tournoi'].includes(event.type)
  const _dt    = new Date((event.date || '').replace(' ', 'T'))
  const dateStr = isNaN(_dt.getTime()) ? '—' : _dt.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr = isNaN(_dt.getTime()) ? '—' : _dt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })

  const present   = event.convocations.filter(c => c.statut === 'present').length
  const absent    = event.convocations.filter(c => c.statut === 'absent').length
  const incertain = event.convocations.filter(c => c.statut === 'incertain').length
  const attente   = event.convocations.filter(c => c.statut === 'convoque').length

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={() => navigate('/calendrier')}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-5 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour au calendrier
      </button>

      {/* Header */}
      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden mb-6">
        <div className="h-2" style={{ backgroundColor: event.equipe.couleur_maillot || '#1b4332' }} />
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${info.color}`}>
              <span className="material-symbols-outlined text-[28px]">{info.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${info.color}`}>{info.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-label-md ${event.statut === 'termine' ? 'bg-slate-100 text-slate-600' : 'bg-green-100 text-green-700'}`}>
                  {event.statut === 'termine' ? 'Terminé' : 'Programmé'}
                </span>
              </div>
              <h2 className="text-headline-lg text-on-surface">
                {isMatch && event.adversaire
                  ? `${event.equipe.nom} vs ${event.adversaire}`
                  : `${info.label} — ${event.equipe.nom}`
                }
              </h2>
              <div className="flex flex-wrap gap-4 mt-2 text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">calendar_today</span>
                  {dateStr}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  {timeStr}
                </span>
                {event.terrain && (
                  <span className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    {event.terrain.nom}
                  </span>
                )}
                <span className="flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-[16px]">sports_soccer</span>
                  {event.equipe.categorie}
                </span>
              </div>

              {/* Score si terminé */}
              {event.statut === 'termine' && isMatch && event.score_equipe !== null && event.score_adversaire !== null && (
                <div className="mt-3 inline-flex items-center gap-3 bg-surface-container-low px-4 py-2 rounded-xl">
                  <span className="text-headline-md font-black text-primary">{event.score_equipe}</span>
                  <span className="text-on-surface-variant">—</span>
                  <span className="text-headline-md font-black text-on-surface">{event.score_adversaire}</span>
                  <span className="text-body-sm text-on-surface-variant ml-2">
                    {event.score_equipe! > event.score_adversaire! ? '🏆 Victoire'
                      : event.score_equipe! < event.score_adversaire! ? '❌ Défaite'
                      : '🤝 Nul'}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── VUE JOUEUR / PARENT ──────────────────────────────────────── */}
      {isPlayer && (
        <div className="space-y-4">
          {!myConvoc ? (
            <div className="bg-white border border-[#e8e8f0] rounded-2xl p-8 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">assignment_turned_in</span>
              <p className="text-headline-md text-on-surface mb-1">Pas encore convoqué</p>
              <p className="text-body-md text-on-surface-variant">Votre coach n'a pas encore envoyé de convocation pour cet événement.</p>
            </div>
          ) : (
            <div className="bg-white border border-[#e8e8f0] rounded-2xl p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="text-headline-md text-on-surface">Ma présence</h3>
                <span className={`px-3 py-1 rounded-full text-label-md font-semibold border ${STATUT_COLORS[myConvoc.statut]}`}>
                  {STATUT_LABEL[myConvoc.statut]}
                </span>
              </div>

              {event.notes && (
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                  <p className="text-label-md text-primary mb-1">Message du coach</p>
                  <p className="text-body-md text-on-surface-variant">{event.notes}</p>
                </div>
              )}

              <div>
                <p className="text-body-md text-on-surface-variant mb-3">Indiquez votre disponibilité :</p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { s: 'present',   l: 'Présent',   icon: 'check_circle', cls: 'border-green-400 bg-green-50 text-green-700 hover:bg-green-100' },
                    { s: 'incertain', l: 'Incertain',  icon: 'help',         cls: 'border-yellow-400 bg-yellow-50 text-yellow-700 hover:bg-yellow-100' },
                    { s: 'absent',    l: 'Absent',     icon: 'cancel',       cls: 'border-red-400 bg-red-50 text-red-700 hover:bg-red-100' },
                  ].map(opt => (
                    <button
                      key={opt.s}
                      onClick={() => respond(opt.s as any)}
                      disabled={responding}
                      className={`flex flex-col items-center gap-2 py-4 rounded-xl border-2 font-semibold transition-all disabled:opacity-60 ${
                        myConvoc.statut === opt.s
                          ? opt.cls + ' ring-2 ring-offset-2'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[28px]">{opt.icon}</span>
                      <span className="text-label-lg">{opt.l}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Résumé présences (lecture seule pour joueur) */}
          {event.convocations.length > 0 && (
            <div className="bg-white border border-[#e8e8f0] rounded-2xl p-5">
              <h3 className="text-headline-md mb-4">Présences de l'équipe</h3>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { n: present,   l: 'Présents',   c: 'text-green-600'  },
                  { n: absent,    l: 'Absents',     c: 'text-error'      },
                  { n: incertain, l: 'Incertains',  c: 'text-yellow-600' },
                  { n: attente,   l: 'En attente',  c: 'text-orange-500' },
                ].map(s => (
                  <div key={s.l} className="text-center bg-surface-container-low rounded-xl py-3">
                    <p className={`text-headline-md font-black ${s.c}`}>{s.n}</p>
                    <p className="text-[11px] text-on-surface-variant mt-0.5">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── VUE COACH / DIRIGEANT ────────────────────────────────────── */}
      {isCoachOrMore && (
        <>
          {/* Tabs */}
          <div className="flex items-center border-b border-outline-variant mb-5">
            <button onClick={() => setTab('presences')}
              className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all ${tab === 'presences' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
              <span className="material-symbols-outlined text-[18px]">how_to_reg</span>
              Présences ({event.convocations.length})
            </button>
            {isMatch && (
              <button onClick={() => setTab('resultat')}
                className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all ${tab === 'resultat' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
                <span className="material-symbols-outlined text-[18px]">scoreboard</span>
                Résultat
              </button>
            )}
            <button onClick={() => setTab('modifier')}
              className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all ${tab === 'modifier' ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'}`}>
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Modifier
            </button>
            {/* Bouton supprimer */}
            <button
              onClick={deleteEvent}
              disabled={deleting}
              className="ml-auto flex items-center gap-1.5 px-3 py-2 text-error hover:bg-red-50 rounded-lg text-label-md transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-[18px]">delete</span>
              <span className="hidden sm:inline">Supprimer</span>
            </button>
          </div>

          {/* Présences */}
          {tab === 'presences' && (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-4 gap-3">
                {[
                  { n: present,   l: 'Présents',   c: 'text-green-600',  b: 'border-l-green-500'  },
                  { n: absent,    l: 'Absents',     c: 'text-error',      b: 'border-l-error'      },
                  { n: incertain, l: 'Incertains',  c: 'text-yellow-600', b: 'border-l-yellow-400' },
                  { n: attente,   l: 'En attente',  c: 'text-orange-500', b: 'border-l-orange-400' },
                ].map(s => (
                  <div key={s.l} className={`bg-white border border-[#e8e8f0] border-l-4 ${s.b} rounded-xl p-3 text-center`}>
                    <p className={`text-headline-md font-black ${s.c}`}>{s.n}</p>
                    <p className="text-[11px] text-on-surface-variant">{s.l}</p>
                  </div>
                ))}
              </div>

              {/* Liste */}
              <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                {event.convocations.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">groups</span>
                    <p className="text-body-md mb-4">Aucune convocation envoyée</p>
                    <button onClick={() => navigate('/convocations')}
                      className="bg-primary text-white px-5 py-2.5 rounded-lg text-label-md hover:bg-primary-container transition-colors">
                      Gérer les convocations
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8f0]">
                    {event.convocations.map(c => (
                      <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors">
                        {c.joueur?.avatar
                          ? <img src={c.joueur.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {c.joueur?.prenom?.[0]}{c.joueur?.nom?.[0]}
                            </div>
                        }
                        <p className="flex-1 text-label-lg text-on-surface">{c.joueur?.prenom} {c.joueur?.nom}</p>
                        {/* Boutons réponse rapide */}
                        <div className="flex gap-1.5">
                          {[
                            { s: 'present',   icon: 'check',        active: 'bg-green-500 text-white',  hover: 'hover:bg-green-100 hover:text-green-600' },
                            { s: 'incertain', icon: 'help',         active: 'bg-yellow-400 text-white', hover: 'hover:bg-yellow-100 hover:text-yellow-600' },
                            { s: 'absent',    icon: 'close',        active: 'bg-red-500 text-white',    hover: 'hover:bg-red-100 hover:text-red-600' },
                          ].map(opt => (
                            <button key={opt.s}
                              onClick={() => updatePlayerStatut(c.id, c.joueur.id, opt.s)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                                c.statut === opt.s ? opt.active : `text-on-surface-variant/40 ${opt.hover}`
                              }`}
                            >
                              <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                            </button>
                          ))}
                        </div>
                        <span className={`ml-2 px-2 py-0.5 rounded-full text-[11px] font-semibold border ${STATUT_COLORS[c.statut]}`}>
                          {STATUT_LABEL[c.statut]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modifier */}
          {tab === 'modifier' && (
            <div className="bg-white border border-[#e8e8f0] rounded-2xl p-6">
              <form onSubmit={saveEdit} className="space-y-4 max-w-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Date *</label>
                    <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))} required
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Heure *</label>
                    <input type="time" value={editForm.heure} onChange={e => setEditForm(f => ({ ...f, heure: e.target.value }))} required
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Terrain</label>
                  <select value={editForm.terrain_id} onChange={e => setEditForm(f => ({ ...f, terrain_id: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                    <option value="">Aucun terrain</option>
                    {terrains.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                </div>

                {isMatch && (
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Adversaire</label>
                    <input type="text" value={editForm.adversaire} onChange={e => setEditForm(f => ({ ...f, adversaire: e.target.value }))}
                      placeholder="Ex : Red Star FC"
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Instructions / Notes</label>
                  <textarea value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3}
                    placeholder="Consignes pour les joueurs…"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary resize-none" />
                </div>

                <div className="flex items-center gap-4 pt-1">
                  <button type="submit" disabled={savingEdit}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
                    {savingEdit ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <span className="material-symbols-outlined text-[18px]">save</span>}
                    Enregistrer
                  </button>
                  {editMsg && <p className={`text-body-md ${editMsg.includes('Erreur') ? 'text-error' : 'text-green-600'}`}>{editMsg}</p>}
                </div>
              </form>
            </div>
          )}

          {/* Résultat */}
          {tab === 'resultat' && isMatch && (
            <div className="bg-white border border-[#e8e8f0] rounded-2xl p-6 space-y-6">
              <h3 className="text-headline-md">Saisir le score</h3>

              {/* Score visuel */}
              <div className="flex items-center justify-center gap-6 bg-surface-container-low rounded-2xl py-6 px-4">
                <div className="text-center flex-1">
                  <p className="text-label-md text-on-surface-variant mb-2">{event.equipe.nom}</p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setScoreHome(s => Math.max(0, (s ?? 0) - 1))}
                      className="w-10 h-10 rounded-full bg-white border border-outline-variant flex items-center justify-center text-headline-md hover:border-primary transition-colors">−</button>
                    <span className="text-display-lg font-black text-primary w-12 text-center">{scoreHome ?? '?'}</span>
                    <button onClick={() => setScoreHome(s => (s ?? 0) + 1)}
                      className="w-10 h-10 rounded-full bg-white border border-outline-variant flex items-center justify-center text-headline-md hover:border-primary transition-colors">+</button>
                  </div>
                </div>
                <div className="text-headline-lg text-on-surface-variant font-black">—</div>
                <div className="text-center flex-1">
                  <p className="text-label-md text-on-surface-variant mb-2">{event.adversaire || 'Adversaire'}</p>
                  <div className="flex items-center justify-center gap-3">
                    <button onClick={() => setScoreAway(s => Math.max(0, (s ?? 0) - 1))}
                      className="w-10 h-10 rounded-full bg-white border border-outline-variant flex items-center justify-center text-headline-md hover:border-primary transition-colors">−</button>
                    <span className="text-display-lg font-black text-on-surface w-12 text-center">{scoreAway ?? '?'}</span>
                    <button onClick={() => setScoreAway(s => (s ?? 0) + 1)}
                      className="w-10 h-10 rounded-full bg-white border border-outline-variant flex items-center justify-center text-headline-md hover:border-primary transition-colors">+</button>
                  </div>
                </div>
              </div>

              {scoreHome !== null && scoreAway !== null && (
                <div className="text-center text-headline-md font-semibold text-on-surface">
                  {scoreHome > scoreAway ? '🏆 Victoire' : scoreHome < scoreAway ? '❌ Défaite' : '🤝 Match nul'}
                </div>
              )}

              <div className="flex items-center gap-4">
                <button onClick={saveScore} disabled={savingScore || scoreHome === null || scoreAway === null}
                  className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
                  {savingScore
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <span className="material-symbols-outlined text-[18px]">save</span>
                  }
                  Enregistrer le score
                </button>
                {scoreMsg && (
                  <p className={`text-body-md ${scoreMsg.includes('Erreur') ? 'text-error' : 'text-green-600'}`}>{scoreMsg}</p>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
