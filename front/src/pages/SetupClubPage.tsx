import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Logo from '../components/Logo'

type Step = 1 | 2 | 3

const COULEURS = ['#0f5238','#1b4332','#2d6a4f','#dc2626','#d97706','#0369a1','#7c3aed','#db2777','#374151']

export default function SetupClubPage() {
  const navigate = useNavigate()
  const [step, setStep]   = useState<Step>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState('')

  const [club, setClub] = useState({
    nom: '', description: '', adresse: '', ville: '', code_postal: '',
    telephone: '', email: '', site_web: '', numero_affiliation: '',
    couleur_primaire: '#0f5238', couleur_secondaire: '#ffffff',
  })

  const [sports, setSports] = useState<string[]>(['Football'])
  const SPORT_LIST = ['Football', 'Futsal', 'Rugby', 'Basketball', 'Handball', 'Volleyball', 'Tennis', 'Natation', 'Athlétisme', 'Autre']

  const [terrain, setTerrain] = useState({ nom: '', type: 'gazon_naturel', capacite: '', adresse: '' })

  const setC = (k: string, v: string) => setClub(f => ({ ...f, [k]: v }))

  const toggleSport = (s: string) =>
    setSports(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s])

  const handleFinish = async () => {
    setSaving(true)
    setError('')
    try {
      const clubRes = await api.post('/clubs', club)
      const clubId  = clubRes.data.data?.id

      if (terrain.nom.trim() && clubId) {
        await api.post('/clubs/terrains', { ...terrain, club_id: clubId, capacite: terrain.capacite ? parseInt(terrain.capacite) : null })
          .catch(() => {})
      }

      navigate('/dashboard')
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const STEPS = [
    { n: 1, label: 'Identité'    },
    { n: 2, label: 'Coordonnées' },
    { n: 3, label: 'Terrain'     },
  ]

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #1b4332 0%, #2b2d42 100%)' }}
    >
      <div className="w-full max-w-2xl">
        {/* Header */}
        <div className="flex flex-col items-center mb-8">
          <Logo size={52} variant="white" className="mb-4" />
          <h1 className="text-display-lg text-white text-center">Configurer votre club</h1>
          <p className="text-white/60 text-body-lg mt-2 text-center">
            Quelques informations pour démarrer sur MonClubHouse
          </p>
        </div>

        {/* Stepper */}
        <div className="flex items-center gap-0 mb-8">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-label-lg font-bold transition-all ${
                  step > s.n ? 'bg-white text-primary' :
                  step === s.n ? 'bg-white text-primary ring-4 ring-white/20' :
                  'bg-white/20 text-white'
                }`}>
                  {step > s.n ? <span className="material-symbols-outlined text-[20px]">check</span> : s.n}
                </div>
                <span className={`text-label-md mt-1.5 ${step >= s.n ? 'text-white font-semibold' : 'text-white/40'}`}>{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 mt-[-18px] transition-all ${step > s.n ? 'bg-white' : 'bg-white/20'}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl overflow-hidden shadow-2xl">
          {/* Étape 1 : Identité */}
          {step === 1 && (
            <div className="p-6 space-y-5">
              <h2 className="text-headline-md text-on-surface">Identité du club</h2>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom du club *</label>
                <input value={club.nom} onChange={e => setC('nom', e.target.value)} required
                  placeholder="Ex : FC Olympique Lyon, AS Montrouge…"
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Description</label>
                <textarea value={club.description} onChange={e => setC('description', e.target.value)} rows={3}
                  placeholder="Présentez votre club en quelques mots…"
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
              </div>

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">N° d'affiliation (FFF, FFHB…)</label>
                <input value={club.numero_affiliation} onChange={e => setC('numero_affiliation', e.target.value)}
                  placeholder="Ex : FFF-2024-06931"
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              {/* Sports */}
              <div className="space-y-2">
                <label className="text-label-md text-on-surface-variant">Sport(s) pratiqué(s)</label>
                <div className="flex flex-wrap gap-2">
                  {SPORT_LIST.map(s => (
                    <button key={s} type="button" onClick={() => toggleSport(s)}
                      className={`px-4 py-2 rounded-full text-label-md transition-all ${
                        sports.includes(s) ? 'bg-primary text-white shadow-sm' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:border-primary/40'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Couleurs */}
              <div className="space-y-2">
                <label className="text-label-md text-on-surface-variant">Couleurs du club</label>
                <div className="flex items-center gap-6">
                  <div className="space-y-1.5">
                    <p className="text-body-sm text-on-surface-variant">Principale</p>
                    <div className="flex gap-2 flex-wrap">
                      {COULEURS.map(c => (
                        <button key={c} type="button" onClick={() => setC('couleur_primaire', c)}
                          className={`w-8 h-8 rounded-full border-2 transition-all ${club.couleur_primaire === c ? 'border-on-surface scale-110 ring-2 ring-offset-1 ring-on-surface/20' : 'border-white hover:scale-105'}`}
                          style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  </div>
                  {/* Aperçu */}
                  <div className="flex items-center gap-2 px-4 py-2 bg-surface-container-low rounded-xl border border-[#e8e8f0]">
                    <div className="w-6 h-6 rounded-full" style={{ backgroundColor: club.couleur_primaire }} />
                    <div className="w-6 h-6 rounded-full border border-outline-variant" style={{ backgroundColor: club.couleur_secondaire }} />
                    <span className="text-body-sm text-on-surface-variant">Aperçu</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2 : Coordonnées */}
          {step === 2 && (
            <div className="p-6 space-y-5">
              <h2 className="text-headline-md text-on-surface">Coordonnées</h2>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Adresse</label>
                  <input value={club.adresse} onChange={e => setC('adresse', e.target.value)}
                    placeholder="12 Rue du Stade"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Ville</label>
                  <input value={club.ville} onChange={e => setC('ville', e.target.value)}
                    placeholder="Lyon"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Code postal</label>
                  <input value={club.code_postal} onChange={e => setC('code_postal', e.target.value)}
                    placeholder="69001"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Téléphone</label>
                  <input value={club.telephone} onChange={e => setC('telephone', e.target.value)}
                    placeholder="+33 4 78 12 34 56" type="tel"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Email du club</label>
                  <input value={club.email} onChange={e => setC('email', e.target.value)}
                    placeholder="contact@monclub.fr" type="email"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Site web</label>
                  <input value={club.site_web} onChange={e => setC('site_web', e.target.value)}
                    placeholder="www.monclub.fr"
                    className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
            </div>
          )}

          {/* Étape 3 : Terrain principal */}
          {step === 3 && (
            <div className="p-6 space-y-5">
              <div>
                <h2 className="text-headline-md text-on-surface">Terrain principal</h2>
                <p className="text-body-md text-on-surface-variant mt-1">Vous pourrez en ajouter d'autres plus tard dans "Mon Club"</p>
              </div>

              {error && (
                <div className="flex items-center gap-2 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom du terrain</label>
                <input value={terrain.nom} onChange={e => setTerrain(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Stade Municipal (optionnel)"
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
              </div>

              {terrain.nom.trim() && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-label-md text-on-surface-variant">Type</label>
                      <div className="relative">
                        <select value={terrain.type} onChange={e => setTerrain(f => ({ ...f, type: e.target.value }))}
                          className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all pr-10 bg-white">
                          <option value="gazon_naturel">Gazon naturel</option>
                          <option value="gazon_synthetique">Gazon synthétique</option>
                          <option value="salle">Salle</option>
                          <option value="gymnase">Gymnase</option>
                          <option value="piste">Piste</option>
                          <option value="autre">Autre</option>
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-label-md text-on-surface-variant">Capacité</label>
                      <input type="number" value={terrain.capacite} onChange={e => setTerrain(f => ({ ...f, capacite: e.target.value }))}
                        placeholder="Ex : 500"
                        className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Adresse du terrain</label>
                    <input value={terrain.adresse} onChange={e => setTerrain(f => ({ ...f, adresse: e.target.value }))}
                      placeholder="Ex : 12 Rue du Stade, Lyon"
                      className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all" />
                  </div>
                </>
              )}

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
                <span className="material-symbols-outlined text-primary shrink-0">check_circle</span>
                <div>
                  <p className="text-label-lg text-on-surface">Récapitulatif</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">
                    Club : <strong>{club.nom || '—'}</strong><br />
                    Ville : <strong>{club.ville || '—'}</strong><br />
                    Sport(s) : <strong>{sports.join(', ') || '—'}</strong>
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="px-6 py-4 border-t border-[#e8e8f0] flex items-center justify-between bg-surface-container-lowest">
            <button
              onClick={() => step > 1 ? setStep((step - 1) as Step) : null}
              className={`flex items-center gap-2 px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors ${step === 1 ? 'invisible' : ''}`}>
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Précédent
            </button>

            {step < 3 ? (
              <button
                onClick={() => setStep((step + 1) as Step)}
                disabled={step === 1 && !club.nom.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
                Suivant
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || !club.nom.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
                {saving ? (
                  <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Création…</>
                ) : (
                  <><span className="material-symbols-outlined text-[18px]">rocket_launch</span>Lancer MonClubHouse</>
                )}
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-white/30 text-body-sm mt-6">
          Vous pourrez modifier ces informations à tout moment dans "Mon Club"
        </p>
      </div>
    </div>
  )
}
