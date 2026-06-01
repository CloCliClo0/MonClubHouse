import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'

type CardColor = 'jaune' | 'rouge'

type Event = {
  id: number
  type: 'but' | 'carton' | 'remplacement'
  minute: number
  joueurId: number
  joueurNom: string
  equipe: 'mch' | 'adversaire'
  detail?: string          // couleur carte ou joueur entrant
  assists?: string         // passeur décisif
}

type PlayerRating = { joueurId: number; note: number; commentaire: string }

const MATCH = {
  id: 1, home: 'MCH Seniors A', away: 'Red Star FC',
  date: '2025-05-31', heure: '15:30', terrain: 'Stade Municipal',
  competition: 'Division 3', categorie: 'Seniors A',
}

const MCH_PLAYERS = [
  { id: 1, name: 'Marc Rousseau',   number: 1,  position: 'GB'  },
  { id: 2, name: 'Baptiste Girard', number: 5,  position: 'DEF' },
  { id: 3, name: 'Antoine Moreau',  number: 4,  position: 'DEF' },
  { id: 4, name: 'Sébastien Mard',  number: 3,  position: 'DEF' },
  { id: 5, name: 'Kevin Arnaud',    number: 7,  position: 'DEF' },
  { id: 6, name: 'Cédric Lefebvre', number: 8,  position: 'MIL' },
  { id: 7, name: 'Julien Fontaine', number: 6,  position: 'MIL' },
  { id: 8, name: 'Théo Blanchard',  number: 10, position: 'MIL' },
  { id: 9, name: 'Nicolas Perrin',  number: 11, position: 'ATT' },
  { id: 10, name: 'Lucas Bertin',   number: 9,  position: 'ATT' },
  { id: 11, name: 'Franck Morel',   number: 2,  position: 'ATT' },
]

const INIT_EVENTS: Event[] = [
  { id: 1, type: 'but', minute: 23, joueurId: 10, joueurNom: 'Lucas Bertin',   equipe: 'mch',        assists: 'N. Perrin' },
  { id: 2, type: 'but', minute: 41, joueurId: 9,  joueurNom: 'Nicolas Perrin', equipe: 'mch',        assists: '' },
  { id: 3, type: 'but', minute: 67, joueurId: 10, joueurNom: 'Lucas Bertin',   equipe: 'mch',        assists: 'C. Lefebvre' },
  { id: 4, type: 'but', minute: 55, joueurId: 0,  joueurNom: 'Dupont (adv.)',  equipe: 'adversaire', assists: '' },
  { id: 5, type: 'carton', minute: 38, joueurId: 3, joueurNom: 'Antoine Moreau', equipe: 'mch', detail: 'jaune' },
]

const INIT_RATINGS: PlayerRating[] = MCH_PLAYERS.map(p => ({ joueurId: p.id, note: 0, commentaire: '' }))

export default function MatchDetailPage() {
  const { matchId } = useParams()
  const navigate = useNavigate()

  const [scoreHome, setScoreHome] = useState(3)
  const [scoreAway, setScoreAway] = useState(1)
  const [events, setEvents]       = useState<Event[]>(INIT_EVENTS)
  const [ratings, setRatings]     = useState<PlayerRating[]>(INIT_RATINGS)
  const [rapport, setRapport]     = useState('')
  const [saved, setSaved]         = useState(false)
  const [activeTab, setActiveTab] = useState<'score' | 'events' | 'notes' | 'rapport'>('score')

  // Form ajout événement
  const [evtType, setEvtType]     = useState<Event['type']>('but')
  const [evtMinute, setEvtMinute] = useState('')
  const [evtPlayer, setEvtPlayer] = useState<number>(MCH_PLAYERS[0].id)
  const [evtTeam, setEvtTeam]     = useState<'mch' | 'adversaire'>('mch')
  const [evtAssist, setEvtAssist] = useState('')
  const [evtCard, setEvtCard]     = useState<CardColor>('jaune')
  const [evtAdv, setEvtAdv]       = useState('')

  const addEvent = () => {
    if (!evtMinute) return
    const player = MCH_PLAYERS.find(p => p.id === evtPlayer)
    const newEvt: Event = {
      id: Date.now(),
      type: evtType,
      minute: parseInt(evtMinute),
      joueurId: evtTeam === 'mch' ? evtPlayer : 0,
      joueurNom: evtTeam === 'mch' ? (player?.name || '') : evtAdv,
      equipe: evtTeam,
      detail: evtType === 'carton' ? evtCard : undefined,
      assists: evtType === 'but' ? evtAssist : undefined,
    }
    setEvents(prev => [...prev, newEvt].sort((a, b) => a.minute - b.minute))
    setEvtMinute('')
    setEvtAssist('')
    setEvtAdv('')
  }

  const removeEvent = (id: number) => setEvents(prev => prev.filter(e => e.id !== id))

  const updateRating = (joueurId: number, note: number) =>
    setRatings(prev => prev.map(r => r.joueurId === joueurId ? { ...r, note } : r))

  const updateComment = (joueurId: number, commentaire: string) =>
    setRatings(prev => prev.map(r => r.joueurId === joueurId ? { ...r, commentaire } : r))

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => { setSaved(false); navigate('/resultats') }, 2000)
  }

  const mchGoals = events.filter(e => e.type === 'but' && e.equipe === 'mch')
  const advGoals = events.filter(e => e.type === 'but' && e.equipe === 'adversaire')
  const scorers = MCH_PLAYERS.map(p => ({
    ...p, buts: events.filter(e => e.type === 'but' && e.joueurId === p.id).length,
    cartons: events.filter(e => e.type === 'carton' && e.joueurId === p.id),
  })).filter(p => p.buts > 0 || p.cartons.length > 0)

  const TABS = [
    { key: 'score',   label: 'Score & Résultat', icon: 'scoreboard' },
    { key: 'events',  label: 'Événements',        icon: 'timeline'   },
    { key: 'notes',   label: 'Notes joueurs',     icon: 'star'       },
    { key: 'rapport', label: 'Rapport coach',     icon: 'edit_note'  },
  ] as const

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button onClick={() => navigate('/resultats')}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-4 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour aux résultats
        </button>

        <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden">
          <div style={{ background: 'linear-gradient(135deg,#1b4332,#2d6a4f)' }} className="px-6 py-5">
            <div className="flex items-center justify-between flex-wrap gap-2 mb-4">
              <span className="text-white/70 text-label-md">{MATCH.competition} • {MATCH.categorie}</span>
              <span className="bg-white/15 text-white text-label-md px-3 py-1 rounded-full">
                {new Date(MATCH.date).toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' })} · {MATCH.heure}
              </span>
            </div>
            {/* Score */}
            <div className="flex items-center justify-center gap-6">
              <div className="text-center flex-1">
                <p className="text-white font-black text-lg">{MATCH.home}</p>
                <p className="text-white/60 text-body-sm mt-0.5">🏠 Domicile</p>
              </div>
              <div className="flex items-center gap-4 bg-white/10 px-8 py-4 rounded-2xl">
                <button onClick={() => setScoreHome(s => Math.max(0, s - 1))}
                  className="text-white/60 hover:text-white text-2xl font-black w-8 h-8 flex items-center justify-center">−</button>
                <span className="text-white font-black text-4xl min-w-[2ch] text-center">{scoreHome}</span>
                <span className="text-white/50 text-2xl">—</span>
                <span className="text-white font-black text-4xl min-w-[2ch] text-center">{scoreAway}</span>
                <button onClick={() => setScoreAway(s => Math.max(0, s - 1))}
                  className="text-white/60 hover:text-white text-2xl font-black w-8 h-8 flex items-center justify-center">−</button>
              </div>
              <div className="text-center flex-1">
                <p className="text-white font-black text-lg">{MATCH.away}</p>
                <p className="text-white/60 text-body-sm mt-0.5">✈️ Extérieur</p>
              </div>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <button onClick={() => setScoreHome(s => s + 1)}
                className="bg-white/20 hover:bg-white/30 text-white text-label-md px-4 py-1.5 rounded-full transition-colors">
                +1 {MATCH.home.split(' ').pop()}
              </button>
              <button onClick={() => setScoreAway(s => s + 1)}
                className="bg-white/20 hover:bg-white/30 text-white text-label-md px-4 py-1.5 rounded-full transition-colors">
                +1 {MATCH.away}
              </button>
            </div>
          </div>

          {/* Terrain + buteurs résumé */}
          <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center justify-between flex-wrap gap-3 bg-surface-container-lowest">
            <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {MATCH.terrain}
            </div>
            <div className="flex gap-4 text-body-sm">
              {mchGoals.length > 0 && (
                <span className="text-on-surface">
                  ⚽ {mchGoals.map(g => `${g.joueurNom.split(' ').pop()} ${g.minute}'`).join(', ')}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-label-md font-semibold transition-all ${
              activeTab === t.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden">

        {/* ── Score ────────────────────────────────────────────────── */}
        {activeTab === 'score' && (
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-headline-md mb-4">Récapitulatif du match</h3>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: 'Buts MCH', value: scoreHome, color: 'text-primary' },
                  { label: 'Buts adversaire', value: scoreAway, color: 'text-error' },
                  { label: 'Résultat', value: scoreHome > scoreAway ? '🏆 Victoire' : scoreHome < scoreAway ? '❌ Défaite' : '🤝 Nul', color: scoreHome > scoreAway ? 'text-green-600' : scoreHome < scoreAway ? 'text-error' : 'text-orange-500' },
                ].map(s => (
                  <div key={s.label} className="bg-surface-container-low rounded-xl p-4 text-center">
                    <p className={`text-headline-lg font-black ${s.color}`}>{s.value}</p>
                    <p className="text-label-md text-on-surface-variant mt-1">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
            {scorers.length > 0 && (
              <div>
                <h4 className="text-headline-md mb-3">Buteurs MCH</h4>
                <div className="space-y-2">
                  {scorers.filter(p => p.buts > 0).map(p => (
                    <div key={p.id} className="flex items-center gap-3 p-3 border border-[#e8e8f0] rounded-xl">
                      <span className="text-xl">⚽</span>
                      <div className="flex-1">
                        <span className="text-label-lg text-on-surface">{p.name}</span>
                        <span className="ml-2 text-body-sm text-on-surface-variant">
                          {events.filter(e => e.type === 'but' && e.joueurId === p.id).map(e => `${e.minute}'`).join(', ')}
                          {events.filter(e => e.type === 'but' && e.joueurId === p.id && e.assists).map(e => ` (p. ${e.assists})`)[0] || ''}
                        </span>
                      </div>
                      <span className="text-headline-md font-black text-primary">{p.buts}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Événements ───────────────────────────────────────────── */}
        {activeTab === 'events' && (
          <div className="p-6 space-y-6">
            {/* Ajout événement */}
            <div className="bg-surface-container-low rounded-xl p-5 space-y-4">
              <h4 className="text-headline-md">Ajouter un événement</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Type</label>
                  <select value={evtType} onChange={e => setEvtType(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                    <option value="but">⚽ But</option>
                    <option value="carton">🟨 Carton</option>
                    <option value="remplacement">🔄 Remplacement</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Minute</label>
                  <input type="number" min="1" max="120" value={evtMinute} onChange={e => setEvtMinute(e.target.value)}
                    placeholder="Ex : 45"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Équipe</label>
                  <select value={evtTeam} onChange={e => setEvtTeam(e.target.value as any)}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                    <option value="mch">MCH</option>
                    <option value="adversaire">Adversaire</option>
                  </select>
                </div>
                <div className="space-y-1">
                  {evtTeam === 'mch' ? (
                    <>
                      <label className="text-label-md text-on-surface-variant">Joueur</label>
                      <select value={evtPlayer} onChange={e => setEvtPlayer(Number(e.target.value))}
                        className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                        {MCH_PLAYERS.map(p => <option key={p.id} value={p.id}>#{p.number} {p.name.split(' ').pop()}</option>)}
                      </select>
                    </>
                  ) : (
                    <>
                      <label className="text-label-md text-on-surface-variant">Nom joueur adv.</label>
                      <input value={evtAdv} onChange={e => setEvtAdv(e.target.value)}
                        placeholder="Ex : Dupont"
                        className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                    </>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {evtType === 'but' && (
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Passeur décisif</label>
                    <input value={evtAssist} onChange={e => setEvtAssist(e.target.value)}
                      placeholder="Ex : N. Perrin"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                  </div>
                )}
                {evtType === 'carton' && (
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Couleur</label>
                    <div className="flex gap-2">
                      {(['jaune', 'rouge'] as CardColor[]).map(c => (
                        <button key={c} onClick={() => setEvtCard(c)}
                          className={`flex-1 py-2.5 rounded-lg text-label-md font-bold transition-all ${
                            evtCard === c ? (c === 'jaune' ? 'bg-yellow-400 text-yellow-900' : 'bg-red-500 text-white') : 'border border-outline-variant text-on-surface-variant'
                          }`}>
                          {c === 'jaune' ? '🟨 Jaune' : '🟥 Rouge'}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={addEvent} disabled={!evtMinute}
                className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
                <span className="material-symbols-outlined text-[18px]">add</span>
                Ajouter
              </button>
            </div>

            {/* Timeline */}
            <div>
              <h4 className="text-headline-md mb-3">Chronologie ({events.length} événements)</h4>
              {events.length === 0 && <p className="text-body-md text-on-surface-variant text-center py-8">Aucun événement enregistré</p>}
              <div className="space-y-2">
                {events.sort((a, b) => a.minute - b.minute).map(e => (
                  <div key={e.id} className={`flex items-center gap-4 p-3.5 rounded-xl border transition-colors ${
                    e.equipe === 'mch' ? 'border-primary/20 bg-primary/5' : 'border-[#e8e8f0] bg-white'
                  }`}>
                    <span className={`text-label-lg font-black min-w-[40px] ${e.equipe === 'mch' ? 'text-primary' : 'text-on-surface-variant'}`}>
                      {e.minute}'
                    </span>
                    <span className="text-xl">
                      {e.type === 'but' ? '⚽' : e.detail === 'rouge' ? '🟥' : e.detail === 'jaune' ? '🟨' : '🔄'}
                    </span>
                    <div className="flex-1">
                      <p className="text-label-lg text-on-surface">{e.joueurNom}</p>
                      {e.type === 'but' && e.assists && <p className="text-body-sm text-on-surface-variant">Passe de {e.assists}</p>}
                      <p className="text-body-sm text-on-surface-variant capitalize">
                        {e.equipe === 'mch' ? MATCH.home : MATCH.away} · {e.type}
                      </p>
                    </div>
                    <button onClick={() => removeEvent(e.id)}
                      className="w-7 h-7 rounded-full hover:bg-red-50 hover:text-error flex items-center justify-center text-on-surface-variant/40 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Notes joueurs ────────────────────────────────────────── */}
        {activeTab === 'notes' && (
          <div className="p-6">
            <h3 className="text-headline-md mb-1">Notes & évaluations</h3>
            <p className="text-body-md text-on-surface-variant mb-5">Notez les performances de chaque joueur sur 10.</p>
            <div className="space-y-3">
              {MCH_PLAYERS.map(p => {
                const rating = ratings.find(r => r.joueurId === p.id)!
                const buts = events.filter(e => e.type === 'but' && e.joueurId === p.id).length
                const cartons = events.filter(e => e.type === 'carton' && e.joueurId === p.id)
                return (
                  <div key={p.id} className="border border-[#e8e8f0] rounded-xl p-4">
                    <div className="flex items-center gap-4 mb-3">
                      <div className="w-10 h-10 rounded-full bg-primary-container text-white font-bold text-sm flex items-center justify-center shrink-0">
                        #{p.number}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-label-lg text-on-surface">{p.name}</p>
                          <span className="text-label-md text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">{p.position}</span>
                          {buts > 0 && <span className="text-body-sm">⚽ ×{buts}</span>}
                          {cartons.map((c, i) => <span key={i}>{c.detail === 'rouge' ? '🟥' : '🟨'}</span>)}
                        </div>
                      </div>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-black text-lg ${
                        rating.note >= 8 ? 'bg-green-100 text-green-700' :
                        rating.note >= 6 ? 'bg-primary/10 text-primary' :
                        rating.note >= 4 ? 'bg-orange-100 text-orange-700' :
                        rating.note > 0 ? 'bg-red-100 text-red-700' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {rating.note || '—'}
                      </div>
                    </div>
                    {/* Slider note */}
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-label-md text-on-surface-variant w-4">0</span>
                      <input type="range" min="0" max="10" step="0.5" value={rating.note}
                        onChange={e => updateRating(p.id, parseFloat(e.target.value))}
                        className="flex-1 accent-primary h-2" />
                      <span className="text-label-md text-on-surface-variant w-4">10</span>
                    </div>
                    <input type="text" value={rating.commentaire}
                      onChange={e => updateComment(p.id, e.target.value)}
                      placeholder="Commentaire (optionnel)…"
                      className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-sm focus:outline-none focus:border-primary transition-all" />
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Rapport coach ────────────────────────────────────────── */}
        {activeTab === 'rapport' && (
          <div className="p-6 space-y-5">
            <div>
              <h3 className="text-headline-md mb-1">Rapport d'après-match</h3>
              <p className="text-body-md text-on-surface-variant">Ce rapport sera visible par les dirigeants du club.</p>
            </div>
            {[
              { key: 'positifs', label: '✅ Points positifs', placeholder: 'Ex : Bonne organisation défensive, pressing efficace…' },
              { key: 'ameliorer', label: '⚠️ Points à améliorer', placeholder: 'Ex : Manque de précision dans les passes…' },
              { key: 'objectifs', label: '🎯 Objectifs pour le prochain match', placeholder: 'Ex : Travailler la finition…' },
            ].map(({ key, label, placeholder }) => (
              <div key={key} className="space-y-1.5">
                <label className="text-label-lg text-on-surface">{label}</label>
                <textarea rows={3} placeholder={placeholder}
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
              </div>
            ))}
            <div className="space-y-1.5">
              <label className="text-label-lg text-on-surface">📝 Notes libres</label>
              <textarea rows={4} value={rapport} onChange={e => setRapport(e.target.value)}
                placeholder="Observations générales du match…"
                className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
            </div>
          </div>
        )}

        {/* Footer save */}
        <div className="px-6 py-4 border-t border-[#e8e8f0] flex items-center justify-between bg-surface-container-lowest">
          <p className="text-body-sm text-on-surface-variant">
            {saved ? '✅ Enregistré !' : 'Les données alimenteront la page statistiques'}
          </p>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-label-lg transition-colors ${
              saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-container'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{saved ? 'check' : 'save'}</span>
            {saved ? 'Enregistré !' : 'Enregistrer le match'}
          </button>
        </div>
      </div>
    </div>
  )
}
