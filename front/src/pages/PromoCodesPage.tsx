import { useEffect, useState } from 'react'
import api from '../services/api'

type PromoCode = {
  id: number
  code: string
  type: 'percent' | 'fixed'
  valeur: number
  description: string | null
  max_uses: number | null
  uses_count: number
  expires_at: string | null
  actif: boolean
}

const BLANK: { code: string; type: 'percent' | 'fixed'; valeur: string; description: string; max_uses: string; expires_at: string } =
  { code: '', type: 'percent', valeur: '', description: '', max_uses: '', expires_at: '' }

export default function PromoCodesPage() {
  const role = localStorage.getItem('role')
  if (role !== 'superadmin') return (
    <div className="py-20 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[56px] block mb-3 opacity-30">lock</span>
      <p className="text-headline-md">Accès réservé au Super Administrateur</p>
    </div>
  )

  const [codes, setCodes]     = useState<PromoCode[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await api.get('/promo-codes')
      setCodes(r.data.data || [])
    } catch {
      setCodes([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const handleCreate = async () => {
    if (!form.code.trim() || !form.valeur) return
    setSaving(true); setError('')
    try {
      await api.post('/promo-codes', {
        code: form.code.trim(),
        type: form.type,
        valeur: parseInt(form.valeur, 10),
        description: form.description || undefined,
        max_uses: form.max_uses ? parseInt(form.max_uses, 10) : null,
        expires_at: form.expires_at || null,
      })
      setForm(BLANK)
      setShowForm(false)
      load()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  const toggleActif = async (c: PromoCode) => {
    await api.patch(`/promo-codes/${c.id}`, { actif: !c.actif })
    setCodes(prev => prev.map(p => p.id === c.id ? { ...p, actif: !p.actif } : p))
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce code promo ?')) return
    await api.delete(`/promo-codes/${id}`)
    setCodes(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-headline-lg text-on-surface flex items-center gap-2">
            <span className="material-symbols-outlined text-[28px] text-primary">sell</span>
            Codes promo
          </h2>
          <p className="text-body-md text-on-surface-variant mt-1">Gestion des codes de réduction pour les abonnements.</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 transition-colors">
          <span className="material-symbols-outlined text-[18px]">add</span>
          Nouveau code
        </button>
      </div>

      {showForm && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Code *</label>
              <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="Ex : BIENVENUE2026"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value as 'percent' | 'fixed' }))}
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                <option value="percent">Pourcentage (%)</option>
                <option value="fixed">Montant fixe (centimes)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Valeur * {form.type === 'percent' ? '(1-100)' : '(centimes)'}</label>
              <input type="number" value={form.valeur} onChange={e => setForm(f => ({ ...f, valeur: e.target.value }))}
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Nombre d'utilisations max (vide = illimité)</label>
              <input type="number" value={form.max_uses} onChange={e => setForm(f => ({ ...f, max_uses: e.target.value }))}
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Expiration (optionnel)</label>
              <input type="date" value={form.expires_at} onChange={e => setForm(f => ({ ...f, expires_at: e.target.value }))}
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-label-md text-on-surface-variant">Description</label>
              <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Ex : Promo lancement"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
          </div>
          {error && <p className="text-body-sm text-error">{error}</p>}
          <div className="flex justify-end gap-3">
            <button onClick={() => { setShowForm(false); setForm(BLANK) }}
              className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
              Annuler
            </button>
            <button onClick={handleCreate} disabled={saving}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-60 transition-colors">
              {saving ? 'Création…' : 'Créer le code'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}
          </div>
        ) : codes.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">sell</span>
            <p className="text-body-md">Aucun code promo créé pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-left">
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Code</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Réduction</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Utilisations</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Expiration</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Statut</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {codes.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-3">
                      <p className="font-mono font-semibold text-on-surface">{c.code}</p>
                      {c.description && <p className="text-body-sm text-on-surface-variant">{c.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-on-surface">
                      {c.type === 'percent' ? `${c.valeur}%` : `${(c.valeur / 100).toFixed(2)} €`}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {c.uses_count}{c.max_uses !== null ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {c.expires_at ? new Date(c.expires_at).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggleActif(c)}
                        className={`px-2.5 py-1 rounded-full text-label-md ${c.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {c.actif ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(c.id)} className="text-error hover:underline text-label-md">
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
