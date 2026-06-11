import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type EventType = 'match' | 'amical' | 'coupe' | 'entrainement' | 'tournoi' | 'plateau' | 'reunion' | 'autre'
type Step = 1 | 2 | 3 | 4

type Equipe  = { id: number; nom: string; categorie: string }
type Terrain = { id: number; nom: string; type: string }

const EVENT_TYPES: { key: EventType; label: string; icon: string; color: string; desc: string }[] = [
  { key: 'match',        label: 'Match officiel', icon: 'sports_soccer',  color: 'border-green-500 bg-green-50',    desc: 'Match de championnat officiel' },
  { key: 'amical',       label: 'Match amical',   icon: 'handshake',      color: 'border-teal-500 bg-teal-50',      desc: 'Rencontre amicale hors championnat' },
  { key: 'coupe',        label: 'Coupe',          icon: 'emoji_events',   color: 'border-yellow-500 bg-yellow-50',  desc: 'Match de coupe ou compétition' },
  { key: 'entrainement', label: 'Entraînement',   icon: 'fitness_center', color: 'border-blue-500 bg-blue-50',      desc: 'Séance d\'entraînement d\'équipe' },
  { key: 'tournoi',      label: 'Tournoi',        icon: 'workspace_premium', color: 'border-purple-500 bg-purple-50', desc: 'Tournoi multi-équipes' },
  { key: 'plateau',      label: 'Plateau',        icon: 'view_quilt',     color: 'border-indigo-500 bg-indigo-50',  desc: 'Plateau sportif (U7–U11)' },
  { key: 'reunion',      label: 'Réunion',        icon: 'groups',         color: 'border-slate-500 bg-slate-50',    desc: 'Réunion d\'équipe ou de bureau' },
  { key: 'autre',        label: 'Autre',          icon: 'event',          color: 'border-gray-400 bg-gray-50',      desc: 'Autre type d\'événement' },
]

export default function CreateEventPage() {
  const navigate  = useNavigate()
  const role      = localStorage.getItem('role') || 'coach'
  const userId    = parseInt(localStorage.getItem('userId') || '0')

  const [step, setStep]             = useState<Step>(1)
  const [type, setType]             = useState<EventType | null>(null)
  const [equipeId, setEquipeId]     = useState('')
  const [date, setDate]             = useState('')
  const [heure, setHeure]           = useState('')
  const [terrainId, setTerrainId]   = useState('')
  const [adversaire, setAdversaire] = useState('')
  const [competition, setCompetition] = useState('')
  const [domicile, setDomicile]     = useState(true)
  const [instructions, setInstructions] = useState('')
  const [sendEmail, setSendEmail]   = useState(true)
  const [submitted, setSubmitted]   = useState(false)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const [equipes, setEquipes]         = useState<Equipe[]>([])
  const [terrains, setTerrains]       = useState<Terrain[]>([])
  const [adversaires, setAdversaires] = useState<{ id: number; nom: string }[]>([])

  // Récurrence entraînements
  const [isRecurring, setIsRecurring] = useState(false)
  const [recurDay, setRecurDay]       = useState<number>(2) // Mardi
  const [recurDateDebut, setRecurDateDebut] = useState('')
  const [recurDateFin, setRecurDateFin]     = useState('')
  const [recurringCount, setRecurringCount] = useState<number | null>(null)
  const [submittedRecurring, setSubmittedRecurring] = useState(false)

  const DAYS_FR = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']

  // Calcul du nombre d'entraînements
  useEffect(() => {
    if (!isRecurring || !recurDateDebut || !recurDateFin) { setRecurringCount(null); return }
    const start = new Date(recurDateDebut), end = new Date(recurDateFin)
    let count = 0, cur = new Date(start)
    while (cur.getDay() !== recurDay) cur.setDate(cur.getDate() + 1)
    while (cur <= end) { count++; cur.setDate(cur.getDate() + 7) }
    setRecurringCount(count)
  }, [isRecurring, recurDay, recurDateDebut, recurDateFin])

  useEffect(() => {
    api.get('/equipes').then(r => {
      const list: Equipe[] = r.data.data || []
      if (role === 'coach' && userId) {
        const mine = list.find((e: any) => e.coach_id === userId)
        if (mine) setEquipeId(String(mine.id))
      }
      setEquipes(list)
    }).catch(() => {})

    api.get('/clubs/terrains').then(r => setTerrains(r.data.data || [])).catch(() => {})
    api.get('/adversaires').then(r => setAdversaires(r.data.data || [])).catch(() => {})
  }, [])

  const canNext = () => {
    if (step === 1) return !!type
    if (step === 2) return !!equipeId && !!date && !!heure
    if (step === 3) return !(type === 'match' || type === 'coupe') || (!!adversaire && adversaire !== '__autre__')
    return true
  }

  const handleSubmit = async () => {
    setError('')
    setSaving(true)
    try {
      if (type === 'entrainement' && isRecurring) {
        const payload: Record<string, any> = {
          equipe_id: parseInt(equipeId),
          day_of_week: recurDay,
          heure, date_debut: recurDateDebut, date_fin: recurDateFin,
          terrain_id: terrainId ? parseInt(terrainId) : undefined,
        }
        const r = await api.post('/matchs/recurring', payload)
        setRecurringCount(r.data.count)
        setSubmittedRecurring(true)
        setTimeout(() => navigate('/calendrier'), 2000)
      } else {
        const payload: Record<string, any> = {
          equipe_id:   parseInt(equipeId),
          type, date: `${date}T${heure}:00`, domicile,
          adversaire: adversaire || null, competition: competition || null,
          statut: 'programme', notes: instructions || null,
        }
        if (terrainId) payload.terrain_id = parseInt(terrainId)
        await api.post('/matchs', payload)
        setSubmitted(true)
        setTimeout(() => navigate('/calendrier'), 1800)
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création')
      setSaving(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Type'         },
    { n: 2, label: 'Informations' },
    { n: 3, label: 'Détails'      },
    { n: 4, label: 'Confirmer'    },
  ]

  if (submittedRecurring) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-blue-600 text-[44px]">event_repeat</span>
        </div>
        <h2 className="text-headline-lg text-on-surface mb-2">{recurringCount} entraînement(s) créé(s) !</h2>
        <p className="text-body-lg text-on-surface-variant mb-6">Les séances récurrentes ont été planifiées.</p>
        <div className="animate-pulse text-body-md text-on-surface-variant">Redirection vers le calendrier…</div>
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-green-600 text-[44px]">check_circle</span>
        </div>
        <h2 className="text-headline-lg text-on-surface mb-2">Événement créé !</h2>
        <p className="text-body-lg text-on-surface-variant mb-6">L'événement a été ajouté au calendrier.</p>
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

      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-body-sm">
          <span className="material-symbols-outlined text-[18px]">error</span>
          {error}
        </div>
      )}

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
                  <select value={equipeId} onChange={e => setEquipeId(e.target.value)} required
                    className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10">
                    <option value="">Sélectionner une équipe</option>
                    {equipes.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.categorie} — {eq.nom}</option>
                    ))}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Terrain</label>
                <div className="relative">
                  <select value={terrainId} onChange={e => setTerrainId(e.target.value)}
                    className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10">
                    <option value="">Sélectionner un terrain</option>
                    {terrains.map(t => <option key={t.id} value={t.id}>{t.nom}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                </div>
              </div>

              {!isRecurring && (
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Date *</label>
                  <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Heure *</label>
                <input type="time" value={heure} onChange={e => setHeure(e.target.value)} required
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
            </div>

            {/* Récurrence — uniquement pour entraînements */}
            {type === 'entrainement' && (
              <div className="mt-4 space-y-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setIsRecurring(!isRecurring)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${isRecurring ? 'bg-blue-600' : 'bg-gray-200'}`}
                  >
                    <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${isRecurring ? 'left-6' : 'left-1'}`} />
                  </div>
                  <span className="text-label-lg text-on-surface">Entraînements récurrents</span>
                </label>

                {isRecurring && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
                    <p className="text-sm font-semibold text-blue-800">Planification automatique</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <label className="text-label-md text-on-surface-variant">Jour de la semaine</label>
                        <select value={recurDay} onChange={e => setRecurDay(Number(e.target.value))}
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg text-body-md focus:outline-none bg-white">
                          {DAYS_FR.map((d, i) => <option key={i} value={i}>{d}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label-md text-on-surface-variant">Heure</label>
                        <input type="time" value={heure} onChange={e => setHeure(e.target.value)}
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg text-body-md focus:outline-none bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label-md text-on-surface-variant">Date de début</label>
                        <input type="date" value={recurDateDebut} onChange={e => setRecurDateDebut(e.target.value)}
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg text-body-md focus:outline-none bg-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-label-md text-on-surface-variant">Date de fin</label>
                        <input type="date" value={recurDateFin} onChange={e => setRecurDateFin(e.target.value)}
                          className="w-full px-4 py-3 border border-blue-200 rounded-lg text-body-md focus:outline-none bg-white" />
                      </div>
                    </div>
                    {recurringCount !== null && (
                      <p className="text-sm font-semibold text-blue-700">
                        → {recurringCount} entraînement(s) seront créés
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ── Étape 3 : Détails ────────────────────────────────────── */}
        {step === 3 && (
          <div className="p-6 space-y-5">
            <h3 className="text-headline-md mb-1">
              {type === 'match' ? 'Détails du match' : type === 'tournoi' ? 'Détails du tournoi' : 'Détails de l\'événement'}
            </h3>

            {(type === 'match' || type === 'amical' || type === 'tournoi' || type === 'plateau' || type === 'coupe') && (
              <>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">
                    Adversaire {(type === 'match' || type === 'coupe') ? '*' : ''}
                  </label>

                  {/* Match officiel / coupe : select depuis les adversaires connus */}
                  {(type === 'match' || type === 'coupe') ? (
                    <div className="relative">
                      <select
                        value={adversaire}
                        onChange={e => setAdversaire(e.target.value)}
                        className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10 bg-white"
                      >
                        <option value="">Sélectionner un adversaire</option>
                        {adversaires.map(a => (
                          <option key={a.id} value={a.nom}>{a.nom}</option>
                        ))}
                        <option value="__autre__">Autre (saisie libre)…</option>
                      </select>
                      <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                    </div>
                  ) : null}

                  {/* Si "Autre" sélectionné dans le select, ou amical/tournoi/plateau : texte libre */}
                  {(type === 'amical' || type === 'tournoi' || type === 'plateau' || adversaire === '__autre__') && (
                    <input
                      type="text"
                      value={adversaire === '__autre__' ? '' : adversaire}
                      onChange={e => setAdversaire(e.target.value)}
                      placeholder="Ex : Red Star FC"
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all mt-2"
                    />
                  )}
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

        {/* ── Étape 4 : Récap ──────────────────────────────────────── */}
        {step === 4 && (
          <div className="p-6 space-y-4">
            <h3 className="text-headline-md mb-4">Récapitulatif</h3>
            <div className="bg-surface-container-low rounded-xl p-5 space-y-3">
              {[
                { icon: EVENT_TYPES.find(e => e.key === type)?.icon || 'event', label: 'Type', val: EVENT_TYPES.find(e => e.key === type)?.label },
                { icon: 'groups', label: 'Équipe', val: equipes.find(e => String(e.id) === equipeId)?.nom || '—' },
                { icon: 'calendar_today', label: 'Date', val: date ? new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
                { icon: 'schedule', label: 'Heure', val: heure || '—' },
                { icon: 'location_on', label: 'Terrain', val: terrains.find(t => String(t.id) === terrainId)?.nom || 'Non précisé' },
                (adversaire && adversaire !== '__autre__') ? { icon: 'sports_soccer', label: 'Adversaire', val: `vs ${adversaire}` } : null,
                competition ? { icon: 'emoji_events', label: 'Compétition', val: competition } : null,
              ].filter(Boolean).map((item: any, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                  </div>
                  <div>
                    <p className="text-label-md text-on-surface-variant">{item.label}</p>
                    <p className="text-body-md text-on-surface font-medium">{item.val}</p>
                  </div>
                </div>
              ))}
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

          <span className="text-label-md text-on-surface-variant">Étape {step} / 4</span>

          {step < 4 ? (
            <button onClick={() => canNext() && setStep((step + 1) as Step)}
              disabled={!canNext()}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
              Suivant
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm disabled:opacity-60">
              {saving
                ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <span className="material-symbols-outlined text-[18px]">check</span>
              }
              Créer l'événement
            </button>
          )}
        </div>
      </div>
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
