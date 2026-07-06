import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../services/api'

export type InviteCodeRow = {
  id: number; code: string; role: string; label: string | null
  categorie?: string | null
  equipe?: { id: number; nom: string } | null
  max_uses: number; uses_count: number; actif: boolean
}

// Décrit un sélecteur de cible (catégorie ou équipe) affiché dans le formulaire, uniquement
// quand le rôle choisi en a besoin (ex : joueur/parent/coach, jamais dirigeant).
type TargetFieldConfig = {
  label: string
  paramName: string
  options: { value: string | number; label: string }[]
  requiredForRoles: string[]
  numeric?: boolean
  placeholder?: string
  helperWhenEmpty?: string
}

type Props = {
  // Paramètres de scope envoyés tels quels sur GET/POST /codes (ex: { categorie: 'U15' },
  // { equipe_id: 12 }, { club_id: 3, categorie: 'U15' }) — l'appelant gère son propre sélecteur
  // de portée (catégorie/équipe/club) et le fait vivre ici.
  scopeParams: Record<string, string | number>
  // Rôles que ce contexte a le droit de proposer à la création (ex: coach → joueur/parent seulement)
  roleOptions: { value: string; label: string }[]
  // Désactive la création tant que la portée n'est pas complète côté appelant (ex: aucune
  // catégorie choisie) — la liste reste consultable.
  canCreate?: boolean
  emptyMessage?: string
  // Masque le formulaire de création (la liste reste affichée) — pour les pages qui gèrent
  // elles-mêmes un bouton "Générer un code" togglable.
  showForm?: boolean
  // Sélecteur cible optionnel affiché dans le formulaire, seulement pour les rôles listés
  // dans requiredForRoles (ex: catégorie/équipe requise pour joueur/parent/coach, pas dirigeant).
  targetField?: TargetFieldConfig
  // Ajoute un bouton de suppression définitive (DELETE /codes/:id) en plus de la désactivation.
  allowHardDelete?: boolean
}

export default function InviteCodeManager({
  scopeParams, roleOptions, canCreate = true, emptyMessage = 'Aucun code pour le moment.',
  showForm = true, targetField, allowHardDelete = false,
}: Props) {
  const [codes, setCodes]       = useState<InviteCodeRow[]>([])
  const [loading, setLoading]   = useState(false)
  const [role, setRole]         = useState(roleOptions[0]?.value || 'joueur')
  const [label, setLabel]       = useState('')
  const [maxUses, setMaxUses]   = useState('50')
  const [targetValue, setTargetValue] = useState('')
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [copiedId, setCopiedId] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    api.get('/codes', { params: scopeParams }).then(r => setCodes(r.data.data || [])).catch(() => setCodes([])).finally(() => setLoading(false))
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load() }, [JSON.stringify(scopeParams)])

  const targetRequired = !!targetField && targetField.requiredForRoles.includes(role)

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (targetRequired && !targetValue) { setError('Choisissez une valeur pour ' + targetField!.label.replace(/\s*\*$/, '').toLowerCase() + '.'); return }
    setSaving(true)
    setError('')
    try {
      const payload: Record<string, any> = { ...scopeParams, role, label: label || undefined, max_uses: parseInt(maxUses) }
      if (targetField && targetRequired && targetValue) {
        payload[targetField.paramName] = targetField.numeric ? parseInt(targetValue) : targetValue
      }
      await api.post('/codes', payload)
      setLabel('')
      setTargetValue('')
      load()
    } catch (err: any) {
      setError(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  const disableCode = async (id: number) => {
    await api.patch(`/codes/${id}/disable`).catch(() => {})
    load()
  }

  const hardDeleteCode = async (id: number) => {
    if (!confirm('Supprimer définitivement ce code ?')) return
    await api.delete(`/codes/${id}`).catch(() => {})
    load()
  }

  const shareCode = (c: InviteCodeRow) => {
    const appUrl = window.location.origin
    const scopeLabel = c.label || c.categorie || c.equipe?.nom || 'votre club'
    const link = `${appUrl}/register?code=${c.code}`
    const text = `🏆 Rejoignez ${scopeLabel} sur MonClubHouse !\n\nCliquez sur ce lien pour vous inscrire directement (${c.role}) :\n${link}`

    if (navigator.share) {
      navigator.share({ title: 'Code MonClubHouse', text, url: link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      setCopiedId(c.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  return (
    <div className="space-y-4">
      {showForm && (
        <form onSubmit={createCode} className="bg-white border border-[#e8e8f0] rounded-xl p-4 space-y-3">
          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-[16px]">error</span>{error}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-label-md text-on-surface-variant">Rôle</label>
              <select value={role} onChange={e => { setRole(e.target.value); setTargetValue('') }}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                {roleOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-on-surface-variant">Utilisations max</label>
              <input type="number" min="1" max="500" value={maxUses} onChange={e => setMaxUses(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
          </div>
          {targetRequired && targetField && (
            <div className="space-y-1">
              <label className="text-label-md text-on-surface-variant">{targetField.label}</label>
              <select required value={targetValue} onChange={e => setTargetValue(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                <option value="">{targetField.placeholder || 'Sélectionner…'}</option>
                {targetField.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              {targetField.options.length === 0 && targetField.helperWhenEmpty && (
                <p className="text-body-sm text-error">{targetField.helperWhenEmpty}</p>
              )}
            </div>
          )}
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant">Libellé (optionnel)</label>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Ex : Saison 2025-26"
              className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
          </div>
          <button type="submit" disabled={saving || !canCreate || (targetRequired && !targetValue)}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
            {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            <span className="material-symbols-outlined text-[18px]">add</span>
            Générer un code
          </button>
        </form>
      )}

      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-5 space-y-2">{[1, 2].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
        ) : codes.length === 0 ? (
          <div className="py-10 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] block mb-2 opacity-30">key_off</span>
            <p className="text-body-md">{emptyMessage}</p>
          </div>
        ) : (
          <div className="divide-y divide-[#e8e8f0]">
            {codes.map(c => (
              <div key={c.id} className={`px-5 py-3 flex items-center gap-3 flex-wrap ${!c.actif ? 'opacity-50' : ''}`}>
                <span className="font-mono font-bold tracking-widest bg-surface-container-low px-2.5 py-1 rounded-lg text-body-sm">{c.code}</span>
                <button onClick={() => { navigator.clipboard.writeText(c.code); setCopiedId(c.id); setTimeout(() => setCopiedId(null), 2000) }}
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
                  <span className="material-symbols-outlined text-[16px]">{copiedId === c.id ? 'check' : 'content_copy'}</span>
                </button>
                <button onClick={() => shareCode(c)} title="Partager via SMS / réseaux"
                  className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                  <span className="material-symbols-outlined text-[16px]">share</span>
                </button>
                <span className="px-2 py-0.5 rounded-full text-label-md bg-green-100 text-green-700">{c.role}</span>
                {c.categorie && <span className="px-2 py-0.5 rounded-full text-label-md bg-blue-100 text-blue-700">{c.categorie}</span>}
                {c.equipe && <span className="text-body-sm text-on-surface-variant">{c.equipe.nom}</span>}
                {c.label && <span className="text-body-sm text-on-surface-variant italic">{c.label}</span>}
                <span className="text-[11px] text-on-surface-variant ml-auto">{c.uses_count}/{c.max_uses}</span>
                {c.actif && (
                  <button onClick={() => disableCode(c.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors" title="Désactiver">
                    <span className="material-symbols-outlined text-[16px]">block</span>
                  </button>
                )}
                {allowHardDelete && (
                  <button onClick={() => hardDeleteCode(c.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors" title="Supprimer définitivement">
                    <span className="material-symbols-outlined text-[16px]">delete</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
