import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type EventType = 'match' | 'entrainement' | 'tournoi' | 'plateau' | 'reunion' | 'autre'

type Step = 1 | 2 | 3 | 4

const EVENT_TYPES: { key: EventType; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'match',       label: 'Match',         icon: 'sports_soccer',  color: 'border-green-500 bg-green-50',   desc: 'Match officiel contre un adversaire' },
  { key: 'entrainement',label: 'Entraînement',  icon: 'fitness_center', color: 'border-blue-500 bg-blue-50',     desc: 'Séance d\'entraînement d\'équipe' },
  { key: 'tournoi',     label: 'Tournoi',       icon: 'emoji_events',   color: 'border-yellow-500 bg-yellow-50', desc: 'Tournoi multi-équipes' },
  { key: 'plateau',     label: 'Plateau',       icon: 'view_quilt',     color: 'border-purple-500 bg-purple-50', desc: 'Plateau sportif (U7–U11)' },
  { key: 'reunion',     label: 'Réunion',       icon: 'groups',         color: 'border-slate-500 bg-slate-50',   desc: 'Réunion d\'équipe ou de bureau' },
  { key: 'autre',       label: 'Autre',         icon: 'event',          color: 'border-gray-400 bg-gray-50',     desc: 'Autre type d\'événement' },
]

const TEAMS = ['Seniors A', 'Seniors B', 'U19', 'U17', 'U15 A', 'U15 B', 'U13', 'U11', 'U9', 'U7', 'Féminines A']
const TERRAINS = ['Stade Municipal', 'Terrain Annexe A', 'Terrain Annexe B', 'Salle Multi-sports', 'Terrain extérieur']

const PLAYERS = [
  { id: 1, name: 'Lucas Bertin',    number: 9,  position: 'Attaquant' },
  { id: 2, name: 'Cédric Lefebvre', number: 8,  position: 'Milieu'    },
  { id: 3, name: 'Antoine Moreau',  number: 4,  position: 'Défenseur' },
  { id: 4, name: 'Marc Rousseau',   number: 1,  position: 'Gardien'   },
  { id: 5, name: 'Baptiste Girard', number: 5,  position: 'Défenseur' },
  { id: 6, name: 'Julien Fontaine', number: 6,  position: 'Milieu'    },
  { id: 7, name: 'Nicolas Perrin',  number: 11, position: 'Attaquant' },
  { id: 8, name: 'Théo Blanchard',  number: 10, position: 'Milieu'    },
  { id: 9, name: 'Sébastien Mard',  number: 3,  position: 'Défenseur' },
  { id: 10, name: 'Kevin Arnaud',   number: 7,  position: 'Milieu'    },
  { id: 11, name: 'Franck Morel',   number: 2,  position: 'Défenseur' },
]

export default function CreateEventPage() {
  const navigate = useNavigate()
  const [step, setStep]           = useState<Step>(1)
  const [type, setType]           = useState<EventType | null>(null)
  const [team, setTeam]           = useState('')
  const [date, setDate]           = useState('')
  const [heure, setHeure]         = useState('15:00')
  const [terrain, setTerrain]     = useState('')
  const [adversaire, setAdversaire] = useState('')
  const [competition, setCompetition] = useState('')
  const [domicile, setDomicile]   = useState(true)
  const [instructions, setInstructions] = useState('')
  const [sendEmail, setSendEmail] = useState(true)
  const [selectedPlayers, setSelectedPlayers] = useState<number[]>(PLAYERS.map(p => p.id))
  const [submitted, setSubmitted] = useState(false)

  const togglePlayer = (id: number) =>
    setSelectedPlayers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])

  const canNext = () => {
    if (step === 1) return !!type
    if (step === 2) return !!team && !!date && !!heure && !!terrain
    if (step === 3) return type !== 'match' || !!adversaire
    return true
  }

  const handleSubmit = () => {
    setSubmitted(true)
    setTimeout(() => navigate('/calendrier'), 1800)
  }

  const STEPS = [
    { n: 1, label: 'Type'         },
    { n: 2, label: 'Informations' },
    { n: 3, label: 'Détails'      },
    { n: 4, label: 'Joueurs'      },
  ]

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-green-600 text-[44px]">check_circle</span>
        </div>
        <h2 className="text-headline-lg text-on-surface mb-2">Événement créé !</h2>
        <p className="text-body-lg text-on-surface-variant mb-6">
          Les convocations ont été envoyées aux {selectedPlayers.length} joueurs sélectionnés.
        </p>
        <div className="animate-pulse text-body-md text-on-surface-variant">Redirection vers le calendrier…</div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-4 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour
        </button>
        <h2 className="text-headline-lg text-on-surface">Créer un événement</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Planifiez un match, un entraînement, un tournoi ou autre.</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-0 mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1">
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-label-lg font-bold transition-all ${
                step > s.n ? 'bg-primary text-white' :
                step === s.n ? 'bg-primary text-white ring-4 ring-primary/20' :
                'bg-surface-container text-on-surface-variant'
              }`}>
                {step > s.n ? <span className="material-symbols-outlined text-[20px]">check</span> : s.n}
              </div>
              <span className={`text-label-md mt-1.5 hidden sm:block ${step >= s.n ? 'text-primary font-semibold' : 'text-on-surface-variant'}`}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 mt-[-18px] sm:mt-[-22px] transition-all ${step > s.n ? 'bg-primary' : 'bg-surface-container'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden shadow-sm">

        {/* ── Étape 1 : Type ──────────────────────────────────────── */}
        {step === 1 && (
          <div className="p-6">
            <h3 className="text-headline-md mb-5">Quel type d'événement ?</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {EVENT_TYPES.map(et => (
                <button
                  key={et.key}
                  onClick={() => setType(et.key)}
                  className={`relative border-2 rounded-xl p-5 text-left transition-all hover:shadow-md group ${
                    type === et.key ? et.color + ' ring-2 ring-primary/30 shadow-md' : 'border-[#e8e8f0] bg-white hover:border-primary/40'
                  }`}
                >
                  {type === et.key && (
                    <div className="absolute top-3 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <span className="material-symbols-outlined text-white text-[14px]">check</span>
                    </div>
                  )}
                  <span className={`material-symbols-outlined text-[32px] mb-3 block ${type === et.key ? 'text-primary' : 'text-on-surface-variant group-hover:text-primary'} transition-colors`}>
                    {et.icon}
                  </span>
                  <p className="text-label-lg text-on-surface font-bold">{et.label}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">{et.desc}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Étape 2 : Informations générales ─────────────────────── */}
        {step === 2 && (
          <div className="p-6 space-y-5">
            <h3 className="text-headline-md mb-1">Informations générales</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Équipe *</label>
                <div className="relative">
                  <select value={team} onChange={e => setTeam(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10">
                    <option value="">Sélectionner une équipe</option>
                    {TEAMS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Terrain *</label>
                <div className="relative">
                  <select value={terrain} onChange={e => setTerrain(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10">
                    <option value="">Sélectionner un terrain</option>
                    {TERRAINS.map(t => <option key={t}>{t}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Date *</label>
                <input type="date" value={date} onChange={e => setDate(e.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Heure *</label>
                <input type="time" value={heure} onChange={e => setHeure(e.target.value)}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>
          </div>
        )}

        {/* ── Étape 3 : Détails ────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <h3 className="text-headline-md mb-1">
              {type === 'match' ? 'Détails du match' : type === 'tournoi' ? 'Détails du tournoi' : 'Détails de l\'événement'}
            </h3>

            {(type === 'match' || type === 'tournoi' || type === 'plateau') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Adversaire {type === 'match' ? '*' : ''}</label>
                  <input type="text" value={adversaire} onChange={e => setAdversaire(e.target.value)}
                    placeholder="Ex : Red Star FC"
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>

                {type === 'match' && (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-label-md text-on-surface-variant">Compétition</label>
                      <input type="text" value={competition} onChange={e => setCompetition(e.target.value)}
                        placeholder="Ex : Division 3, Coupe Régionale…"
                        className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-label-md text-on-surface-variant">Lieu de réception</label>
                      <div className="flex gap-3">
                        {[{ v: true, l: '🏠 Domicile' }, { v: false, l: '✈️ Extérieur' }].map(({ v, l }) => (
                          <button key={l} onClick={() => setDomicile(v)}
                            className={`flex-1 py-3 rounded-xl border-2 text-label-lg font-semibold transition-all ${
                              domicile === v ? 'border-primary bg-primary/10 text-primary' : 'border-[#e8e8f0] text-on-surface-variant hover:border-primary/40'
                            }`}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </>
            )}

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Instructions / Consignes</label>
              <textarea value={instructions} onChange={e => setInstructions(e.target.value)} rows={4}
                placeholder="Ex : Rendez-vous 30 min avant, tenue complète obligatoire…"
                className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
            </div>

            <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary">mail</span>
                <div>
                  <p className="text-label-lg text-on-surface">Envoyer convocations par email</p>
                  <p className="text-body-sm text-on-surface-variant">Via convocations@monclubhouse.fr</p>
                </div>
              </div>
              <Toggle on={sendEmail} onChange={setSendEmail} />
            </div>
          </div>
        )}

        {/* ── Étape 4 : Joueurs ────────────────────────────────────── */}
        {step === 4 && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-headline-md">Sélection des joueurs</h3>
              <button onClick={() => setSelectedPlayers(
                selectedPlayers.length === PLAYERS.length ? [] : PLAYERS.map(p => p.id)
              )} className="text-primary text-label-md hover:underline">
                {selectedPlayers.length === PLAYERS.length ? 'Tout désélectionner' : 'Tout sélectionner'}
              </button>
            </div>

            <div className="mb-4 flex items-center gap-3 p-3 bg-surface-container-low rounded-xl">
              <span className="material-symbols-outlined text-primary">groups</span>
              <span className="text-body-md text-on-surface">
                <strong>{selectedPlayers.length}</strong> joueur(s) sélectionné(s) sur {PLAYERS.length}
              </span>
            </div>

            <div className="divide-y divide-[#e8e8f0] border border-[#e8e8f0] rounded-xl overflow-hidden">
              {PLAYERS.map(p => {
                const selected = selectedPlayers.includes(p.id)
                return (
                  <label key={p.id} className={`flex items-center gap-4 p-3.5 cursor-pointer transition-colors ${selected ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                    <input type="checkbox" checked={selected} onChange={() => togglePlayer(p.id)}
                      className="w-4 h-4 accent-primary shrink-0" />
                    <div className="w-9 h-9 rounded-full bg-primary-container text-white font-bold text-sm flex items-center justify-center shrink-0">
                      #{p.number}
                    </div>
                    <div className="flex-1">
                      <p className="text-label-lg text-on-surface">{p.name}</p>
                      <p className="text-body-sm text-on-surface-variant">{p.position}</p>
                    </div>
                    {selected && <span className="material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* ── Boutons nav ──────────────────────────────────────────── */}
        <div className="px-6 py-5 border-t border-[#e8e8f0] flex items-center justify-between bg-surface-container-lowest">
          <button onClick={() => step > 1 ? setStep((step - 1) as Step) : navigate(-1)}
            className="flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            {step === 1 ? 'Annuler' : 'Précédent'}
          </button>

          <div className="flex items-center gap-2">
            <span className="text-label-md text-on-surface-variant">Étape {step} / 4</span>
          </div>

          {step < 4 ? (
            <button onClick={() => canNext() && setStep((step + 1) as Step)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
              Suivant
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button onClick={handleSubmit}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[18px]">check</span>
              Créer l'événement
            </button>
          )}
        </div>
      </div>

      {/* Récap flottant */}
      {type && step > 1 && (
        <div className="mt-4 bg-white border border-[#e8e8f0] rounded-xl p-4 flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant shadow-sm">
          {[
            { icon: EVENT_TYPES.find(e => e.key === type)?.icon || 'event', val: EVENT_TYPES.find(e => e.key === type)?.label },
            team     && { icon: 'groups', val: team },
            date     && { icon: 'calendar_today', val: new Date(date).toLocaleDateString('fr-FR', { day:'numeric', month:'short' }) },
            heure    && { icon: 'schedule', val: heure },
            terrain  && { icon: 'location_on', val: terrain },
            adversaire && { icon: 'sports_soccer', val: `vs ${adversaire}` },
          ].filter(Boolean).map((item: any, i) => (
            <span key={i} className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px] text-primary">{item.icon}</span>
              {item.val}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-surface-container-highest'}`}>
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`} />
    </button>
  )
}
