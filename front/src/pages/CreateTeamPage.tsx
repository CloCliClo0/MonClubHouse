import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type Category = { id: number; nom: string; couleur: string }

const GENRES  = [{ v: 'masculin', l: 'Masculin' }, { v: 'feminin', l: 'Féminin' }, { v: 'mixte', l: 'Mixte' }, { v: 'handisport', l: 'Handisport' }]
const FORMATS = ['4','5','7','8','11','15','autre']
const COULEURS = ['#0f5238','#dc2626','#d97706','#16a34a','#0369a1','#7c3aed','#db2777','#0891b2','#64748b','#1b4332','#2b2d42']

export default function CreateTeamPage() {
  const navigate = useNavigate()
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm] = useState({
    nom: '', categorie_id: '' as string | number, genre: 'masculin', format: '11',
    couleur_maillot: '#0f5238', description: '',
  })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    api.get('/categories').then(r => setCategories(r.data.data || [])).catch(() => {})
  }, [])

  const set = (k: string, v: string | number) => setForm(f => ({ ...f, [k]: v }))

  const selectedCat = categories.find(c => c.id === Number(form.categorie_id))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.nom.trim()) return
    setLoading(true)
    setError('')
    try {
      await api.post('/equipes', {
        ...form,
        categorie_id: form.categorie_id ? Number(form.categorie_id) : null,
      })
      navigate('/equipes')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <button onClick={() => navigate('/equipes')}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-4 transition-colors">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour aux équipes
        </button>
        <h2 className="text-headline-lg text-on-surface">Créer une équipe</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Ajoutez une nouvelle équipe à votre club</p>
      </div>

      {error && (
        <div className="mb-5 flex items-center gap-3 bg-error/10 border border-error/30 text-error px-4 py-3 rounded-xl">
          <span className="material-symbols-outlined text-[20px]">error</span>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden shadow-sm">
        <div className="p-6 space-y-5">

          {/* Aperçu */}
          <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl border border-[#e8e8f0]">
            <div className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-black text-lg shrink-0 transition-all"
              style={{ backgroundColor: form.couleur_maillot }}>
              {form.nom ? form.nom.slice(0, 2).toUpperCase() : 'MCH'}
            </div>
            <div>
              <p className="text-headline-md text-on-surface">{form.nom || 'Nom de l\'équipe'}</p>
              <div className="flex gap-2 mt-1 flex-wrap">
                {selectedCat && (
                  <span className="text-label-md text-on-surface-variant bg-white px-2 py-0.5 rounded border border-[#e8e8f0]">{selectedCat.nom}</span>
                )}
                <span className="text-label-md text-on-surface-variant bg-white px-2 py-0.5 rounded border border-[#e8e8f0]">{form.genre}</span>
                <span className="text-label-md text-on-surface-variant bg-white px-2 py-0.5 rounded border border-[#e8e8f0]">{form.format}v{form.format}</span>
              </div>
            </div>
          </div>

          {/* Nom */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Nom de l'équipe *</label>
            <input value={form.nom} onChange={e => set('nom', e.target.value)} required
              placeholder="Ex : Seniors A, U15 B, Féminines…"
              className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Catégorie */}
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Catégorie</label>
              <div className="relative">
                <select value={form.categorie_id} onChange={e => set('categorie_id', e.target.value)}
                  className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all pr-10 bg-white">
                  <option value="">Sans catégorie</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
              {categories.length === 0 && (
                <p className="text-body-sm text-on-surface-variant/70">Créez des catégories dans Administration.</p>
              )}
            </div>

            {/* Format */}
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Format</label>
              <div className="relative">
                <select value={form.format} onChange={e => set('format', e.target.value)}
                  className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary transition-all pr-10 bg-white">
                  {FORMATS.map(f => <option key={f} value={f}>{f === 'autre' ? 'Autre' : `${f}v${f}`}</option>)}
                </select>
                <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
              </div>
            </div>
          </div>

          {/* Genre */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Genre</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {GENRES.map(g => (
                <button key={g.v} type="button" onClick={() => set('genre', g.v)}
                  className={`py-2.5 rounded-xl border-2 text-label-md font-semibold transition-all ${
                    form.genre === g.v ? 'border-primary bg-primary/10 text-primary' : 'border-[#e8e8f0] text-on-surface-variant hover:border-primary/40'
                  }`}>
                  {g.l}
                </button>
              ))}
            </div>
          </div>

          {/* Couleur maillot */}
          <div className="space-y-2">
            <label className="text-label-md text-on-surface-variant">Couleur du maillot</label>
            <div className="flex gap-2 flex-wrap items-center">
              {COULEURS.map(c => (
                <button key={c} type="button" onClick={() => set('couleur_maillot', c)}
                  className={`w-9 h-9 rounded-full border-2 transition-all ${form.couleur_maillot === c ? 'border-on-surface scale-110 ring-2 ring-offset-2 ring-on-surface/30' : 'border-white hover:scale-105'}`}
                  style={{ backgroundColor: c }} />
              ))}
              <label className="cursor-pointer">
                <input type="color" value={String(form.couleur_maillot)} onChange={e => set('couleur_maillot', e.target.value)}
                  className="sr-only" />
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-outline-variant flex items-center justify-center hover:border-primary transition-colors">
                  <span className="material-symbols-outlined text-[16px] text-on-surface-variant">palette</span>
                </div>
              </label>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Description (optionnel)</label>
            <textarea value={String(form.description)} onChange={e => set('description', e.target.value)} rows={3}
              placeholder="Informations complémentaires sur cette équipe…"
              className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[#e8e8f0] flex justify-end gap-3 bg-surface-container-lowest">
          <button type="button" onClick={() => navigate('/equipes')}
            className="px-5 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low transition-colors">
            Annuler
          </button>
          <button type="submit" disabled={loading || !form.nom.trim()}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors flex items-center gap-2">
            {loading ? (
              <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Création…</>
            ) : (
              <><span className="material-symbols-outlined text-[18px]">check</span>Créer l'équipe</>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
