import { useEffect, useRef, useState } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { io, Socket } from 'socket.io-client'
import api from '../services/api'

type Convocation = {
  id: number
  statut: string
  joueur: { id: number; nom: string; prenom: string; avatar?: string }
}

type MatchEvent = {
  id: number
  type: string
  minute: number | null
  equipe: 'domicile' | 'exterieur' | null
  description?: string
  joueur?: { id: number; nom: string; prenom: string }
}

type Match = {
  id: number
  type: string
  adversaire?: string
  date: string
  domicile_exterieur?: string
  statut: string
  score_equipe?: number
  score_adversaire?: number
  notes?: string
  equipe: { id: number; nom: string; categorie?: { id: number; nom: string } | null; couleur_maillot?: string }
  terrain?: { nom: string }
  convocations: Convocation[]
}

const EVENT_TYPES: { type: string; label: string; icon: string; color: string }[] = [
  { type: 'but',           label: 'But',          icon: '⚽', color: 'bg-green-500' },
  { type: 'but_annule',    label: 'But annulé',   icon: '❌', color: 'bg-red-500'   },
  { type: 'carton_jaune',  label: 'Carton J.',    icon: '🟨', color: 'bg-yellow-500'},
  { type: 'carton_rouge',  label: 'Carton R.',    icon: '🟥', color: 'bg-red-600'   },
  { type: 'remplacement',  label: 'Remplac.',     icon: '🔄', color: 'bg-blue-500'  },
  { type: 'fin_mi_temps',  label: 'Mi-temps',     icon: '⏸️', color: 'bg-gray-500'  },
]

function formatMinute(m: number | null) {
  if (m === null) return ''
  return `${m}'`
}

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const role = localStorage.getItem('role') || 'joueur'
  const canManage = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)

  const [match, setMatch]       = useState<Match | null>(null)
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'presences' | 'score' | 'live'>('presences')
  const [events, setEvents]     = useState<MatchEvent[]>([])
  const [chrono, setChrono]     = useState(0)
  const [chronoRunning, setChronoRunning] = useState(false)
  const chronoRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Formulaire ajout événement
  const [eventType, setEventType]  = useState('but')
  const [eventEquipe, setEventEquipe] = useState<'domicile' | 'exterieur'>('domicile')
  const [eventJoueur, setEventJoueur] = useState<number | ''>('')
  const [eventDesc, setEventDesc]   = useState('')
  const [addingEvent, setAddingEvent] = useState(false)

  // Score
  const [scoreHome, setScoreHome] = useState<number>(0)
  const [scoreAway, setScoreAway] = useState<number>(0)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')

  // Socket.io
  const socketRef = useRef<Socket | null>(null)

  const load = () => {
    api.get(`/matchs/${matchId}`)
      .then(r => {
        const m = r.data.data
        setMatch(m)
        setScoreHome(m.score_equipe ?? 0)
        setScoreAway(m.score_adversaire ?? 0)
        if (m.statut === 'en_cours') {
          setTab('live')
          setChronoRunning(true)
        }
      })
      .catch(() => navigate('/resultats'))
      .finally(() => setLoading(false))
  }

  const loadEvents = () => {
    api.get(`/matchs/${matchId}/events`).then(r => setEvents(r.data.data || [])).catch(() => {})
  }

  useEffect(() => {
    load()
    loadEvents()

    // Socket.io live
    const token = localStorage.getItem('token')
    const socket = io(window.location.origin, { auth: { token }, transports: ['websocket'] })
    socketRef.current = socket
    socket.emit('join:match', matchId)
    socket.on('match:event', ({ event, score_equipe, score_adversaire, statut }: any) => {
      setEvents(prev => [...prev, event])
      setScoreHome(score_equipe ?? 0)
      setScoreAway(score_adversaire ?? 0)
      if (statut) setMatch(m => m ? { ...m, statut, score_equipe, score_adversaire } : m)
    })
    socket.on('match:ended', () => {
      setChronoRunning(false)
      setMatch(m => m ? { ...m, statut: 'termine' } : m)
      load()
    })

    return () => { socket.disconnect() }
  }, [matchId])

  // Chronomètre
  useEffect(() => {
    if (chronoRunning) {
      chronoRef.current = setInterval(() => setChrono(c => c + 1), 1000)
    } else {
      if (chronoRef.current) clearInterval(chronoRef.current)
    }
    return () => { if (chronoRef.current) clearInterval(chronoRef.current) }
  }, [chronoRunning])

  const startLive = async () => {
    try {
      await api.post(`/matchs/${matchId}/events`, { type: 'debut', minute: 0 })
      setChronoRunning(true)
      setTab('live')
      loadEvents()
    } catch { /* ignore */ }
  }

  const endMatch = async () => {
    if (!confirm('Terminer le match ?')) return
    try {
      await api.patch(`/matchs/${matchId}/end`, {})
      setChronoRunning(false)
      load()
    } catch { /* ignore */ }
  }

  const addEvent = async () => {
    setAddingEvent(true)
    try {
      await api.post(`/matchs/${matchId}/events`, {
        type: eventType,
        minute: Math.floor(chrono / 60) || null,
        equipe: eventEquipe,
        joueur_id: eventJoueur || undefined,
        description: eventDesc || undefined,
      })
      setEventJoueur('')
      setEventDesc('')
      loadEvents()
    } catch { /* ignore */ } finally {
      setAddingEvent(false)
    }
  }

  const saveScore = async () => {
    setSaving(true)
    setMsg('')
    try {
      await api.patch(`/matchs/${matchId}/score`, { score_equipe: scoreHome, score_adversaire: scoreAway, statut: 'termine' })
      setMsg('Score enregistré !')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch { setMsg('Erreur lors de la sauvegarde') } finally { setSaving(false) }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="h-48 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
      <div className="h-64 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
    </div>
  )
  if (!match) return null

  const _d      = new Date((match.date || '').replace(' ', 'T'))
  const dateStr = isNaN(_d.getTime()) ? '—' : _d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const isMatch = ['match', 'amical', 'coupe', 'tournoi'].includes(match.type)
  const present = match.convocations.filter(c => c.statut === 'present').length
  const isLive  = match.statut === 'en_cours'

  const result = match.score_equipe !== undefined && match.score_adversaire !== undefined
    ? match.score_equipe > match.score_adversaire! ? 'Victoire' : match.score_equipe < match.score_adversaire! ? 'Défaite' : 'Nul'
    : null

  const convoquesPresents = match.convocations.filter(c => ['present', 'convoque'].includes(c.statut))
  const mm = Math.floor(chrono / 60).toString().padStart(2, '0')
  const ss = (chrono % 60).toString().padStart(2, '0')

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/resultats')}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-5 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour aux résultats
      </button>

      {/* Header match */}
      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden mb-6">
        <div style={{ background: isLive ? 'linear-gradient(135deg,#7f1d1d,#b91c1c)' : 'linear-gradient(135deg,#1b4332,#2d6a4f)' }} className="px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-white/15 text-white text-label-md px-3 py-1 rounded-full">{match.equipe.categorie?.nom}</span>
              <span className="bg-white/15 text-white text-label-md px-3 py-1 rounded-full capitalize">{match.type}</span>
              <span className={`text-label-md px-3 py-1 rounded-full font-semibold ${
                isLive ? 'bg-red-400 text-white animate-pulse' :
                match.statut === 'termine' ? 'bg-white/20 text-white' : 'bg-green-400/20 text-green-200'
              }`}>
                {isLive ? '🔴 EN DIRECT' : match.statut === 'termine' ? 'Terminé' : 'Programmé'}
              </span>
            </div>
            {isLive && (
              <span className="text-white font-mono text-xl font-bold">{mm}:{ss}</span>
            )}
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-white font-black text-base sm:text-xl leading-tight">{match.equipe.nom}</p>
              <p className="text-white/60 text-xs mt-0.5">{match.domicile_exterieur === 'domicile' ? '🏠' : '✈️'}</p>
            </div>
            <div className="flex items-center gap-3 bg-white/10 rounded-2xl px-5 py-4">
              {canManage && match.statut !== 'termine' && !isLive ? (
                <>
                  <button onClick={() => setScoreHome(s => Math.max(0, s - 1))} className="text-white/60 hover:text-white text-2xl font-black">−</button>
                  <span className="text-white font-black text-4xl w-8 text-center">{scoreHome}</span>
                  <span className="text-white/50 text-2xl">—</span>
                  <span className="text-white font-black text-4xl w-8 text-center">{scoreAway}</span>
                  <button onClick={() => setScoreAway(s => Math.max(0, s - 1))} className="text-white/60 hover:text-white text-2xl font-black">−</button>
                </>
              ) : (
                <>
                  <span className="text-white font-black text-4xl w-8 text-center">{match.score_equipe ?? '?'}</span>
                  <span className="text-white/50 text-2xl">—</span>
                  <span className="text-white font-black text-4xl w-8 text-center">{match.score_adversaire ?? '?'}</span>
                </>
              )}
            </div>
            <div className="text-center flex-1 min-w-[80px]">
              <p className="text-white font-black text-base sm:text-xl leading-tight">{match.adversaire || 'Adversaire'}</p>
            </div>
          </div>

          {/* +1 buttons */}
          {canManage && match.statut !== 'termine' && !isLive && (
            <div className="flex items-center justify-center gap-4 mt-4">
              <button onClick={() => setScoreHome(s => s + 1)} className="bg-white/20 hover:bg-white/30 text-white text-label-md px-4 py-1.5 rounded-full">
                +1
              </button>
              <button onClick={() => setScoreAway(s => s + 1)} className="bg-white/20 hover:bg-white/30 text-white text-label-md px-4 py-1.5 rounded-full">
                +1
              </button>
            </div>
          )}

          {/* Bouton Mode live */}
          {canManage && match.statut === 'programme' && isMatch && (
            <div className="flex justify-center mt-4">
              <button onClick={startLive} className="bg-red-500 hover:bg-red-400 text-white font-semibold px-6 py-2 rounded-full text-sm flex items-center gap-2 transition">
                🔴 Démarrer le mode live
              </button>
            </div>
          )}
          {canManage && isLive && (
            <div className="flex justify-center mt-4">
              <button onClick={endMatch} className="bg-white/20 hover:bg-white/30 text-white font-semibold px-6 py-2 rounded-full text-sm flex items-center gap-2 transition">
                ⏹️ Terminer le match
              </button>
            </div>
          )}
        </div>

        {/* Infos bar */}
        <div className="px-4 sm:px-6 py-3 bg-surface-container-lowest flex items-center gap-4 flex-wrap border-t border-[#e8e8f0] text-body-sm text-on-surface-variant">
          {match.terrain && (
            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[16px]">location_on</span>{match.terrain.nom}</span>
          )}
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            {present} présents / {match.convocations.length}
          </span>
          {result && (
            <span className={`font-semibold ${result === 'Victoire' ? 'text-green-600' : result === 'Défaite' ? 'text-error' : 'text-orange-500'}`}>
              {result === 'Victoire' ? '🏆' : result === 'Défaite' ? '❌' : '🤝'} {result}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-5 overflow-x-auto">
        {[
          ...(isMatch || isLive ? [{ key: 'live', label: 'Live', icon: 'radio_button_checked' }] : []),
          ...(isMatch ? [{ key: 'score', label: 'Score', icon: 'scoreboard' }] : []),
          { key: 'presences', label: 'Présences', icon: 'how_to_reg' },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-label-md font-semibold transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden">
        {/* Live tab */}
        {tab === 'live' && (
          <div className="p-4 space-y-5">
            {/* Ajouter un événement (coach+) */}
            {canManage && (isLive || match.statut === 'en_cours') && (
              <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-700">Ajouter un événement</p>
                {/* Types */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {EVENT_TYPES.map(e => (
                    <button
                      key={e.type}
                      onClick={() => setEventType(e.type)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-center transition ${eventType === e.type ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}
                    >
                      <span className="text-xl">{e.icon}</span>
                      <span className="text-xs font-medium leading-tight">{e.label}</span>
                    </button>
                  ))}
                </div>
                {/* Équipe */}
                <div className="flex gap-2">
                  <button
                    onClick={() => setEventEquipe('domicile')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition ${eventEquipe === 'domicile' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    {match.equipe.nom}
                  </button>
                  <button
                    onClick={() => setEventEquipe('exterieur')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg border-2 transition ${eventEquipe === 'exterieur' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600'}`}
                  >
                    {match.adversaire || 'Adversaire'}
                  </button>
                </div>
                {/* Joueur */}
                {convoquesPresents.length > 0 && (
                  <select
                    value={eventJoueur}
                    onChange={e => setEventJoueur(e.target.value ? Number(e.target.value) : '')}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                  >
                    <option value="">Joueur (optionnel)</option>
                    {convoquesPresents.map(c => (
                      <option key={c.joueur.id} value={c.joueur.id}>{c.joueur.prenom} {c.joueur.nom}</option>
                    ))}
                  </select>
                )}
                <button
                  onClick={addEvent}
                  disabled={addingEvent}
                  className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition"
                >
                  {addingEvent ? 'Ajout...' : `Ajouter à ${mm}:${ss}`}
                </button>
              </div>
            )}

            {/* Timeline */}
            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Événements</p>
              {events.length === 0 ? (
                <p className="text-center text-gray-400 py-6 text-sm">Aucun événement pour l'instant</p>
              ) : (
                <div className="space-y-2">
                  {[...events].reverse().map(e => (
                    <div key={e.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                      <span className="text-lg shrink-0">{EVENT_TYPES.find(t => t.type === e.type)?.icon || '•'}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800">
                          {EVENT_TYPES.find(t => t.type === e.type)?.label || e.type}
                          {e.joueur && <span className="font-normal text-gray-600"> — {e.joueur.prenom} {e.joueur.nom}</span>}
                        </p>
                        {e.equipe && <p className="text-xs text-gray-500">{e.equipe === 'domicile' ? match.equipe.nom : match.adversaire}</p>}
                      </div>
                      {e.minute !== null && (
                        <span className="text-sm font-bold text-gray-500 shrink-0">{formatMinute(e.minute)}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Score tab */}
        {tab === 'score' && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: match.equipe.nom, value: match.score_equipe ?? '—', color: 'text-primary' },
                { label: 'Résultat',       value: result ?? '—',             color: result === 'Victoire' ? 'text-green-600' : result === 'Défaite' ? 'text-error' : 'text-orange-500' },
                { label: match.adversaire || 'Adversaire', value: match.score_adversaire ?? '—', color: 'text-on-surface' },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className={`text-headline-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-label-md text-on-surface-variant mt-1 truncate">{s.label}</p>
                </div>
              ))}
            </div>
            {canManage && (
              <div className="flex items-center gap-3 pt-2">
                <button onClick={saveScore} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
                  {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <span className="material-symbols-outlined text-[18px]">save</span>}
                  Enregistrer le score
                </button>
                {msg && <p className={`text-body-md ${msg.includes('Erreur') ? 'text-error' : 'text-green-600'}`}>{msg}</p>}
              </div>
            )}
          </div>
        )}

        {/* Présences tab */}
        {tab === 'presences' && (
          <div>
            {match.convocations.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">groups</span>
                <p className="text-body-md">Aucune convocation pour ce match</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {match.convocations.map(c => {
                  const colors: Record<string, string> = {
                    present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700',
                    incertain: 'bg-yellow-100 text-yellow-700', convoque: 'bg-orange-100 text-orange-600',
                  }
                  const labels: Record<string, string> = {
                    present: 'Présent', absent: 'Absent', incertain: 'Incertain', convoque: 'En attente',
                  }
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-4 sm:px-5 py-3 hover:bg-surface-container-low transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {c.joueur?.prenom?.[0]}{c.joueur?.nom?.[0]}
                      </div>
                      <p className="flex-1 text-label-lg text-on-surface">{c.joueur?.prenom} {c.joueur?.nom}</p>
                      <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${colors[c.statut] || 'bg-slate-100 text-slate-600'}`}>
                        {labels[c.statut] || c.statut}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
