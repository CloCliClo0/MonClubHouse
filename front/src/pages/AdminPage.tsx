import { useEffect, useState } from 'react'
import api from '../services/api'

// ── Types codes ───────────────────────────────────────────────
type CategoryRef = { id: number; nom: string; couleur?: string }

type InviteCode = {
  id: number; code: string
  role: 'joueur' | 'parent' | 'coach' | 'dirigeant'; label?: string
  uses_count: number; max_uses: number; expires_at?: string; actif: boolean
  equipe?: { id: number; nom: string; categorie?: CategoryRef | null }
  club?:   { id: number; nom: string }
}
type Equipe = { id: number; nom: string; categorie?: CategoryRef | null }
// ─────────────────────────────────────────────────────────────

type Role = 'superadmin' | 'admin' | 'dirigeant' | 'coach' | 'joueur' | 'parent' | 'visiteur'
const ROLES: Role[] = ['superadmin', 'admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur']

const roleColors: Record<Role, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin:      'bg-purple-100 text-purple-700',
  dirigeant:  'bg-blue-100 text-blue-700',
  coach:      'bg-primary/10 text-primary',
  joueur:     'bg-green-100 text-green-700',
  parent:     'bg-orange-100 text-orange-700',
  visiteur:   'bg-slate-100 text-slate-700',
}

type User = { id: number; nom: string; prenom: string; email: string; role: Role; club_id: number | null; derniere_connexion: string | null; actif: boolean }

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; user: User }
  | { type: 'delete'; user: User }
  | { type: 'assign'; user: User }

const BLANK = { nom: '', prenom: '', email: '', role: 'joueur' as Role, password: '' }

type Club = { id: number; nom: string; logo?: string; ville?: string; email?: string; telephone?: string; description?: string; couleur_primaire?: string; actif: boolean }
type EquipeDetail = { id: number; nom: string; categorie?: CategoryRef | null; niveau?: string; couleur?: string; actif: boolean }

const CODE_ROLES = [
  { v: 'joueur',    l: 'Joueur',    color: 'bg-green-100 text-green-700'   },
  { v: 'parent',    l: 'Parent',    color: 'bg-orange-100 text-orange-700' },
  { v: 'coach',     l: 'Coach',     color: 'bg-primary/10 text-primary'    },
  { v: 'dirigeant', l: 'Dirigeant', color: 'bg-blue-100 text-blue-700'     },
]

// ── Composant gestion d'un club (superadmin) ─────────────────
function ClubManagePanel({ club, onBack, allClubs }: { club: Club; onBack: () => void; allClubs: Club[] }) {
  const [tab, setTab] = useState<'infos' | 'equipes' | 'membres' | 'codes'>('infos')
  const [infos, setInfos] = useState({ nom: club.nom, ville: club.ville || '', email: club.email || '', telephone: club.telephone || '', description: club.description || '', couleur_primaire: club.couleur_primaire || '#1b4332' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Équipes
  const [equipes, setEquipes] = useState<EquipeDetail[]>([])
  const [eqLoading, setEqLoading] = useState(false)
  const [showEqForm, setShowEqForm] = useState(false)
  const [eqForm, setEqForm] = useState({ nom: '', categorie: '', niveau: '', couleur: '#1b4332' })
  const [eqSaving, setEqSaving] = useState(false)

  // Membres
  const [membres, setMembres] = useState<User[]>([])
  const [membresLoading, setMembresLoading] = useState(false)
  const [memSearch, setMemSearch] = useState('')
  const [memRoleFilter, setMemRoleFilter] = useState<Role | 'Tous'>('Tous')

  // Codes
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [newCode, setNewCode] = useState({ equipe_id: '', role: 'joueur', label: '', max_uses: '50' })
  const [codeSaving, setCodeSaving] = useState(false)
  const [copiedId, setCopiedId] = useState<number | null>(null)

  useEffect(() => {
    if (tab === 'equipes') {
      setEqLoading(true)
      api.get(`/equipes?club_id=${club.id}`).then(r => setEquipes(r.data.data || [])).catch(() => setEquipes([])).finally(() => setEqLoading(false))
    }
    if (tab === 'membres') {
      setMembresLoading(true)
      api.get(`/admin/users?club_id=${club.id}`).then(r => setMembres(r.data.data || [])).catch(() => setMembres([])).finally(() => setMembresLoading(false))
    }
    if (tab === 'codes') {
      setCodesLoading(true)
      api.get(`/codes?club_id=${club.id}`).then(r => setCodes(r.data.data || [])).catch(() => setCodes([])).finally(() => setCodesLoading(false))
    }
  }, [tab])

  const saveInfos = async () => {
    setSaving(true)
    try {
      await api.put(`/clubs/${club.id}`, infos)
      setSaved(true); setTimeout(() => setSaved(false), 2000)
    } catch {}
    finally { setSaving(false) }
  }

  const createEquipe = async (e: React.FormEvent) => {
    e.preventDefault(); setEqSaving(true)
    try {
      await api.post('/equipes', { ...eqForm, club_id: club.id })
      const r = await api.get(`/equipes?club_id=${club.id}`)
      setEquipes(r.data.data || [])
      setShowEqForm(false); setEqForm({ nom: '', categorie: '', niveau: '', couleur: '#1b4332' })
    } catch {}
    finally { setEqSaving(false) }
  }

  const deleteEquipe = async (id: number) => {
    if (!confirm('Désactiver cette équipe ?')) return
    await api.patch(`/equipes/${id}/disable`).catch(() => {})
    setEquipes(prev => prev.filter(e => e.id !== id))
  }

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault(); setCodeSaving(true)
    try {
      const payload: Record<string, any> = { role: newCode.role, label: newCode.label || undefined, max_uses: parseInt(newCode.max_uses), club_id: club.id }
      if (newCode.equipe_id) payload.equipe_id = parseInt(newCode.equipe_id)
      await api.post('/codes', payload)
      const r = await api.get(`/codes?club_id=${club.id}`)
      setCodes(r.data.data || [])
      setShowCodeForm(false); setNewCode({ equipe_id: '', role: 'joueur', label: '', max_uses: '50' })
    } catch {}
    finally { setCodeSaving(false) }
  }

  const disableCode = async (id: number) => {
    await api.patch(`/codes/${id}/disable`).catch(() => {})
    setCodes(prev => prev.filter(c => c.id !== id))
  }

  const filteredMembres = membres.filter(u => {
    const matchSearch = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(memSearch.toLowerCase())
    const matchRole = memRoleFilter === 'Tous' || u.role === memRoleFilter
    return matchSearch && matchRole
  })

  const categories = [...new Map(equipes.filter(e => e.categorie).map(e => [e.categorie!.id, e.categorie!])).values()]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container-low transition-colors">
          <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
        </button>
        <div className="flex items-center gap-3 flex-1">
          {club.logo
            ? <img src={club.logo} className="w-10 h-10 rounded-xl object-cover" alt="" />
            : <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold">{club.nom.slice(0,2).toUpperCase()}</div>
          }
          <div>
            <h2 className="text-headline-lg text-on-surface">{club.nom}</h2>
            <p className="text-body-sm text-on-surface-variant">Gestion complète du club</p>
          </div>
        </div>
        <span className={`px-2 py-1 rounded-full text-label-md ${club.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{club.actif ? 'Actif' : 'Inactif'}</span>
      </div>

      {/* Sous-onglets */}
      <div className="flex border-b border-[#e8e8f0] mb-6 overflow-x-auto">
        {[
          { key: 'infos',    label: 'Infos',     icon: 'info'         },
          { key: 'equipes',  label: 'Équipes',   icon: 'groups'       },
          { key: 'membres',  label: 'Membres',   icon: 'person'       },
          { key: 'codes',    label: 'Codes',     icon: 'key'          },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all whitespace-nowrap ${
              tab === t.key ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Infos ── */}
      {tab === 'infos' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl p-6 max-w-2xl space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'Nom du club *', key: 'nom', type: 'text' },
              { label: 'Ville',         key: 'ville', type: 'text' },
              { label: 'Email',         key: 'email', type: 'email' },
              { label: 'Téléphone',     key: 'telephone', type: 'tel' },
            ].map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-label-md text-on-surface-variant">{f.label}</label>
                <input type={f.type} value={(infos as any)[f.key]} onChange={e => setInfos(i => ({ ...i, [f.key]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant">Description</label>
            <textarea value={infos.description} onChange={e => setInfos(i => ({ ...i, description: e.target.value }))} rows={3}
              className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all resize-none" />
          </div>
          <div className="flex items-center gap-4">
            <div className="space-y-1">
              <label className="text-label-md text-on-surface-variant">Couleur principale</label>
              <div className="flex items-center gap-2">
                <input type="color" value={infos.couleur_primaire} onChange={e => setInfos(i => ({ ...i, couleur_primaire: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border border-outline-variant" />
                <span className="text-body-sm text-on-surface-variant font-mono">{infos.couleur_primaire}</span>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveInfos} disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
              {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
              {saved ? '✓ Enregistré' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* ── Équipes ── */}
      {tab === 'equipes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowEqForm(v => !v)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Nouvelle équipe
            </button>
          </div>

          {showEqForm && (
            <form onSubmit={createEquipe} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
              <h3 className="text-headline-md mb-4">Nouvelle équipe</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Nom *</label>
                  <input required value={eqForm.nom} onChange={e => setEqForm(f => ({ ...f, nom: e.target.value }))}
                    placeholder="Ex : U15 A" className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Catégorie *</label>
                  <input required value={eqForm.categorie} onChange={e => setEqForm(f => ({ ...f, categorie: e.target.value }))}
                    placeholder="Ex : U15" className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Niveau</label>
                  <input value={eqForm.niveau} onChange={e => setEqForm(f => ({ ...f, niveau: e.target.value }))}
                    placeholder="Ex : Régional" className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={eqForm.couleur} onChange={e => setEqForm(f => ({ ...f, couleur: e.target.value }))} className="w-10 h-10 rounded cursor-pointer border border-outline-variant" />
                    <span className="text-body-sm font-mono text-on-surface-variant">{eqForm.couleur}</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowEqForm(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
                <button type="submit" disabled={eqSaving} className="px-5 py-2 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40">Créer</button>
              </div>
            </form>
          )}

          {eqLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
          ) : equipes.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant bg-white border border-[#e8e8f0] rounded-xl">
              <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">groups</span>
              <p className="text-headline-md">Aucune équipe</p>
            </div>
          ) : (
            categories.map(cat => (
              <div key={cat.id} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                <div className="px-5 py-3 bg-surface-container-low border-b border-[#e8e8f0]">
                  <p className="text-label-lg font-semibold text-on-surface">{cat.nom}</p>
                </div>
                <div className="divide-y divide-[#e8e8f0]">
                  {equipes.filter(e => e.categorie?.id === cat.id).map(eq => (
                    <div key={eq.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shrink-0" style={{ background: eq.couleur || '#1b4332' }} />
                      <div className="flex-1">
                        <p className="text-label-lg text-on-surface">{eq.nom}</p>
                        {eq.niveau && <p className="text-body-sm text-on-surface-variant">{eq.niveau}</p>}
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-label-md ${eq.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{eq.actif ? 'Active' : 'Inactive'}</span>
                      <button onClick={() => deleteEquipe(eq.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ── Membres ── */}
      {tab === 'membres' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input value={memSearch} onChange={e => setMemSearch(e.target.value)} placeholder="Rechercher…"
                className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {(['Tous', 'coach', 'joueur', 'parent', 'dirigeant'] as const).map(r => (
                <button key={r} onClick={() => setMemRoleFilter(r as any)}
                  className={`px-3 py-1.5 rounded-full text-label-md transition-all ${memRoleFilter === r ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {membresLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded animate-pulse" />)}</div>
            ) : filteredMembres.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">person_off</span>
                <p>Aucun membre</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {filteredMembres.map(u => (
                  <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface truncate">{u.prenom} {u.nom}</p>
                      <p className="text-body-sm text-on-surface-variant truncate">{u.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold shrink-0 ${roleColors[u.role]}`}>{u.role}</span>
                    <span className="text-body-sm text-on-surface-variant shrink-0 hidden sm:block">
                      {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Codes ── */}
      {tab === 'codes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setShowCodeForm(v => !v)}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Générer un code
            </button>
          </div>

          {showCodeForm && (
            <form onSubmit={createCode} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
              <h3 className="text-headline-md mb-4">Nouveau code d'invitation</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Rôle</label>
                  <select value={newCode.role} onChange={e => setNewCode(f => ({ ...f, role: e.target.value, equipe_id: '' }))}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                    {CODE_ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                  </select>
                </div>
                {['joueur', 'parent', 'coach'].includes(newCode.role) && (
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Équipe *</label>
                    <select required value={newCode.equipe_id} onChange={e => setNewCode(f => ({ ...f, equipe_id: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                      <option value="">Choisir une équipe</option>
                      {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.categorie?.nom ? `${eq.categorie.nom} — ` : ''}{eq.nom}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Libellé (optionnel)</label>
                  <input value={newCode.label} onChange={e => setNewCode(f => ({ ...f, label: e.target.value }))} placeholder="Ex : Saison 2025-26 U15"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Utilisations max</label>
                  <input type="number" value={newCode.max_uses} onChange={e => setNewCode(f => ({ ...f, max_uses: e.target.value }))} min="1" max="500"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowCodeForm(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
                <button type="submit" disabled={codeSaving} className="px-5 py-2 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40">Générer</button>
              </div>
            </form>
          )}

          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {codesLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded animate-pulse" />)}</div>
            ) : codes.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">key_off</span>
                <p>Aucun code pour ce club</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {codes.map(c => (
                  <div key={c.id} className={`px-5 py-4 flex items-center gap-4 flex-wrap ${!c.actif ? 'opacity-50' : ''}`}>
                    <span className="font-mono font-bold text-lg tracking-widest bg-surface-container-low px-3 py-1.5 rounded-lg">{c.code}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.code); setCopiedId(c.id); setTimeout(() => setCopiedId(null), 2000) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">{copiedId === c.id ? 'check' : 'content_copy'}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-label-md bg-green-100 text-green-700">{c.role}</span>
                        {c.equipe && <span className="text-body-sm text-on-surface-variant">{c.equipe.nom}</span>}
                        {c.label && <span className="text-body-sm text-on-surface-variant italic">• {c.label}</span>}
                      </div>
                      <p className="text-[11px] text-on-surface-variant mt-0.5">{c.uses_count}/{c.max_uses} utilisations</p>
                    </div>
                    <button onClick={() => disableCode(c.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error">
                      <span className="material-symbols-outlined text-[18px]">block</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminPage() {
  const isSuperAdmin = localStorage.getItem('role') === 'superadmin'
  const [activeTab, setActiveTab] = useState<'users' | 'codes' | 'clubs'>('users')
  const [managedClub, setManagedClub] = useState<Club | null>(null)

  // ── Clubs (superadmin) ────────────────────────────────────
  const [clubs, setClubs]             = useState<Club[]>([])
  const [clubsLoading, setClubsLoading] = useState(false)
  const [clubSearch, setClubSearch]   = useState('')
  const [clubFilter, setClubFilter]   = useState<number | 'all'>('all')

  const loadClubs = () => {
    setClubsLoading(true)
    api.get('/clubs').then(r => setClubs(r.data.data || [])).catch(() => setClubs([]))
      .finally(() => setClubsLoading(false))
  }

  useEffect(() => {
    if (isSuperAdmin && clubs.length === 0) loadClubs()
  }, [])
  useEffect(() => { if (activeTab === 'clubs' && isSuperAdmin) loadClubs() }, [activeTab])

  // ── État utilisateurs ─────────────────────────────────────
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'Tous'>('Tous')
  const [modal, setModal]     = useState<ModalState>({ type: 'none' })
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [assignForm, setAssignForm] = useState({ club_id: '', role: 'joueur' as Role, equipe_id: '' })
  const [assignEquipes, setAssignEquipes] = useState<Equipe[]>([])
  const [assignCategorie, setAssignCategorie] = useState('')

  // ── État codes ────────────────────────────────────────────
  const [codes, setCodes]         = useState<InviteCode[]>([])
  const [equipes, setEquipes]     = useState<Equipe[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [newCode, setNewCode]     = useState({ equipe_id: '', role: 'joueur', label: '', max_uses: '50', club_id: '' })
  const [creatingCode, setCreatingCode] = useState(false)
  const [copiedId, setCopiedId]   = useState<number | null>(null)

  const loadCodes = () => {
    setCodesLoading(true)
    api.get('/codes').then(r => setCodes(r.data.data || [])).catch(() => setCodes([]))
      .finally(() => setCodesLoading(false))
  }
  const loadEquipes = (clubId?: string) => {
    const params = clubId ? `?club_id=${clubId}` : ''
    api.get(`/equipes${params}`).then(r => setEquipes(r.data.data || [])).catch(() => setEquipes([]))
  }

  useEffect(() => {
    if (activeTab === 'codes') {
      loadCodes()
      if (!isSuperAdmin) loadEquipes()
      else if (clubs.length === 0) loadClubs()
    }
  }, [activeTab])

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreatingCode(true)
    try {
      const payload: Record<string, any> = {
        role:     newCode.role,
        label:    newCode.label || undefined,
        max_uses: parseInt(newCode.max_uses),
      }
      if (newCode.equipe_id) payload.equipe_id = parseInt(newCode.equipe_id)
      if (isSuperAdmin && newCode.club_id) payload.club_id = parseInt(newCode.club_id)
      await api.post('/codes', payload)
      loadCodes()
      setShowCodeForm(false)
      setNewCode({ equipe_id: '', role: 'joueur', label: '', max_uses: '50', club_id: '' })
    } catch {}
    finally { setCreatingCode(false) }
  }

  const deleteCode = async (id: number) => {
    await api.patch(`/codes/${id}/disable`).catch(() => {})
    loadCodes()
  }

  const copyCode = (code: InviteCode) => {
    navigator.clipboard.writeText(code.code)
    setCopiedId(code.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const shareCode = (code: InviteCode) => {
    const appUrl = window.location.origin
    const label  = code.label || code.equipe?.nom || 'votre équipe'
    const role   = ({ joueur: 'joueur', parent: 'parent', coach: 'coach', dirigeant: 'dirigeant' } as Record<string,string>)[code.role] ?? code.role
    const link   = `${appUrl}/register?code=${code.code}`
    const text   = `🏆 Rejoignez ${label} sur MonClubHouse !\n\nCliquez sur ce lien pour vous inscrire directement (${role}) :\n${link}`

    if (navigator.share) {
      navigator.share({ title: 'Code MonClubHouse', text, url: link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      setCopiedId(code.id)
      setTimeout(() => setCopiedId(null), 2000)
    }
  }

  const load = (cId?: number) => {
    setLoading(true)
    const params = cId ? `?club_id=${cId}` : ''
    api.get(`/admin/users${params}`)
      .then(r => setUsers(r.data.data || []))
      .catch(() => setUsers([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u => {
    const matchSearch = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(search.toLowerCase())
    const matchRole   = roleFilter === 'Tous' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const openCreate = () => { setForm(BLANK); setError(''); setModal({ type: 'create' }) }
  const openEdit   = (u: User) => { setForm({ nom: u.nom, prenom: u.prenom, email: u.email, role: u.role, password: '' }); setError(''); setModal({ type: 'edit', user: u }) }
  const openDelete = (u: User) => setModal({ type: 'delete', user: u })
  const openAssign = (u: User) => {
    setAssignForm({ club_id: String(u.club_id || ''), role: u.role, equipe_id: '' })
    setAssignEquipes([])
    setAssignCategorie('')
    if (u.club_id) api.get(`/equipes?club_id=${u.club_id}`).then(r => setAssignEquipes(r.data.data || [])).catch(() => {})
    setError('')
    setModal({ type: 'assign', user: u })
  }

  const handleSave = async () => {
    setError('')
    setSaving(true)
    try {
      if (modal.type === 'create') {
        await api.post('/auth/register', { ...form, password_hash: form.password })
        load()
        setModal({ type: 'none' })
      } else if (modal.type === 'edit') {
        await api.patch(`/admin/users/${modal.user.id}`, { nom: form.nom, prenom: form.prenom, role: form.role })
        load()
        setModal({ type: 'none' })
      } else if (modal.type === 'assign') {
        await api.patch(`/admin/users/${modal.user.id}`, {
          club_id: assignForm.club_id ? parseInt(assignForm.club_id) : null,
          role:    assignForm.role,
        })
        load()
        setModal({ type: 'none' })
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (modal.type !== 'delete') return
    setSaving(true)
    try {
      await api.patch(`/admin/users/${modal.user.id}/actif`, { actif: false })
      load()
      setModal({ type: 'none' })
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erreur')
    } finally {
      setSaving(false)
    }
  }

  const updateRole = async (id: number, role: Role) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u))
    await api.patch(`/admin/users/${id}/role`, { role }).catch(() => load())
  }

  const statsData = [
    { label: 'Utilisateurs', value: users.length,                                                icon: 'groups',               color: 'text-primary',    bg: 'bg-primary/10'   },
    { label: 'Admins',       value: users.filter(u => ['admin','superadmin','dirigeant'].includes(u.role)).length, icon: 'admin_panel_settings', color: 'text-purple-600', bg: 'bg-purple-50'    },
    { label: 'Coachs',       value: users.filter(u => u.role === 'coach').length,                icon: 'sports',               color: 'text-blue-600',   bg: 'bg-blue-50'      },
    { label: 'Joueurs',      value: users.filter(u => u.role === 'joueur').length,               icon: 'sports_soccer',        color: 'text-green-600',  bg: 'bg-green-50'     },
  ]

  // Si un club est en cours de gestion, afficher le panneau dédié
  if (managedClub && isSuperAdmin) {
    return <ClubManagePanel club={managedClub} onBack={() => setManagedClub(null)} allClubs={clubs} />
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Administration</h2>
          <p className="text-body-md text-on-surface-variant">{isSuperAdmin ? 'Gestion globale des utilisateurs' : 'Gérez les utilisateurs, rôles et codes d\'accès'}</p>
        </div>
        {activeTab === 'users' && (
          <button onClick={openCreate}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">person_add</span>
            <span className="hidden sm:inline">Ajouter un utilisateur</span>
            <span className="sm:hidden">Ajouter</span>
          </button>
        )}
        {activeTab === 'codes' && !isSuperAdmin && (
          <button onClick={() => setShowCodeForm(v => !v)}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span>
            <span className="hidden sm:inline">Générer un code</span>
            <span className="sm:hidden">Générer</span>
          </button>
        )}
      </div>

      {/* Onglets */}
      {/* Header superadmin */}
      {isSuperAdmin && (
        <div className="mb-6 flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
          <span className="material-symbols-outlined text-red-600">admin_panel_settings</span>
          <div>
            <p className="text-label-lg text-red-800">Mode Super Administrateur</p>
            <p className="text-body-sm text-red-600">Accès global à tous les clubs, utilisateurs et codes.</p>
          </div>
        </div>
      )}

      {/* Filtre par club (superadmin uniquement) */}
      {isSuperAdmin && clubs.length > 0 && activeTab === 'users' && (
        <div className="mb-4 flex items-center gap-3 flex-wrap">
          <span className="text-label-md text-on-surface-variant">Filtrer par club :</span>
          {[{ id: 'all', nom: 'Tous les clubs' } as any, ...clubs].map(c => (
            <button key={c.id} onClick={() => { setClubFilter(c.id); load(c.id === 'all' ? undefined : c.id) }}
              className={`px-3 py-1.5 rounded-full text-label-md transition-all ${
                clubFilter === c.id ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:border-primary/40'
              }`}>
              {c.nom}
            </button>
          ))}
        </div>
      )}

      {!isSuperAdmin && (
        <div className="flex items-center border-b border-outline-variant mb-6 overflow-x-auto">
          {[
            { key: 'users', label: 'Utilisateurs',   icon: 'groups' },
            { key: 'codes', label: 'Codes d\'accès', icon: 'key'    },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)}
              className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all ${
                activeTab === t.key ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`}>
              <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* ── ONGLET CODES ─────────────────────────────────────────── */}
      {activeTab === 'codes' && (
        <div className="space-y-5">
          {/* Formulaire nouveau code */}
          {showCodeForm && (
            <div className="bg-white border border-[#e8e8f0] rounded-xl p-5">
              <h3 className="text-headline-md mb-4">Nouveau code d'invitation</h3>
              <form onSubmit={createCode} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Club selector (superadmin uniquement) */}
                {isSuperAdmin && (
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Club *</label>
                    <select
                      value={newCode.club_id}
                      onChange={e => {
                        setNewCode(f => ({ ...f, club_id: e.target.value, equipe_id: '' }))
                        if (e.target.value) loadEquipes(e.target.value)
                        else setEquipes([])
                      }}
                      required
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                    >
                      <option value="">Choisir un club</option>
                      {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                    </select>
                  </div>
                )}

                {/* Rôle */}
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Rôle autorisé</label>
                  <select value={newCode.role} onChange={e => setNewCode(f => ({ ...f, role: e.target.value, equipe_id: '' }))}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                    {CODE_ROLES.map(r => <option key={r.v} value={r.v}>{r.l}</option>)}
                  </select>
                </div>

                {/* Équipe/catégorie — seulement pour joueur / parent / coach */}
                {['joueur', 'parent', 'coach'].includes(newCode.role) && (
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Catégorie / Équipe *</label>
                    <select value={newCode.equipe_id} onChange={e => setNewCode(f => ({ ...f, equipe_id: e.target.value }))}
                      required
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                      <option value="">Choisir une catégorie</option>
                      {equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.categorie} — {eq.nom}</option>)}
                    </select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Libellé (optionnel)</label>
                  <input value={newCode.label} onChange={e => setNewCode(f => ({ ...f, label: e.target.value }))}
                    placeholder="Ex : Saison 2025-26 U15"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Utilisations max</label>
                  <input type="number" value={newCode.max_uses} onChange={e => setNewCode(f => ({ ...f, max_uses: e.target.value }))}
                    min="1" max="500"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="md:col-span-2 flex justify-end gap-3">
                  <button type="button" onClick={() => setShowCodeForm(false)}
                    className="px-4 py-2 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
                  <button type="submit" disabled={
                    creatingCode ||
                    (isSuperAdmin && !newCode.club_id) ||
                    (['joueur', 'parent', 'coach'].includes(newCode.role) && !newCode.equipe_id)
                  }
                    className="px-5 py-2 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 flex items-center gap-2">
                    {creatingCode && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                    Générer
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Liste des codes */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {codesLoading ? (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
              </div>
            ) : codes.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">key_off</span>
                <p className="text-headline-md mb-1">Aucun code généré</p>
                <p className="text-body-md">Créez un code pour permettre aux joueurs et parents de rejoindre une équipe.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {codes.map(c => (
                  <div key={c.id} className={`px-5 py-4 flex items-center gap-4 flex-wrap ${!c.actif ? 'opacity-50' : ''}`}>
                    {/* Code */}
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg tracking-widest text-on-surface bg-surface-container-low px-3 py-1.5 rounded-lg">
                        {c.code}
                      </span>
                      <button onClick={() => copyCode(c)} title="Copier le code"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low transition-colors text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">
                          {copiedId === c.id ? 'check' : 'content_copy'}
                        </span>
                      </button>
                      <button onClick={() => shareCode(c)} title="Partager via SMS / réseaux"
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-on-surface-variant">
                        <span className="material-symbols-outlined text-[18px]">share</span>
                      </button>
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${c.role === 'parent' ? 'bg-orange-100 text-orange-700' : 'bg-green-100 text-green-700'}`}>
                          {c.role}
                        </span>
                        <span className="text-body-sm text-on-surface-variant">{c.equipe?.nom}{c.equipe?.categorie?.nom ? ` — ${c.equipe.categorie.nom}` : ''}</span>
                        {c.label && <span className="text-body-sm text-on-surface-variant italic">• {c.label}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[11px] text-on-surface-variant">
                        <span>{c.uses_count}/{c.max_uses} utilisations</span>
                        {c.expires_at && <span>Expire le {new Date(c.expires_at).toLocaleDateString('fr-FR')}</span>}
                        {!c.actif && <span className="text-error font-semibold">Désactivé</span>}
                      </div>
                    </div>

                    {/* Barre de progression */}
                    <div className="w-24 h-1.5 bg-surface-container-low rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (c.uses_count / c.max_uses) * 100)}%` }} />
                    </div>

                    {/* Action */}
                    <button onClick={() => deleteCode(c.id)} title="Désactiver"
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors">
                      <span className="material-symbols-outlined text-[18px]">block</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-primary shrink-0">info</span>
            <div>
              <p className="font-semibold text-on-surface mb-1">Comment ça marche ?</p>
              <p>Générez un code par équipe et par rôle. Partagez-le avec vos joueurs ou parents. Ils l'entrent lors de leur inscription sur <strong>/join</strong>. Les parents peuvent ensuite se lier à leur enfant.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── ONGLET UTILISATEURS (original, inchangé) ─────────────── */}
      {activeTab === 'users' && (<>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsData.map(s => (
          <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-lg p-4 flex items-center gap-4">
            <div className={`${s.bg} p-3 rounded-full`}>
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              {loading ? <div className="w-8 h-5 bg-surface-container-low rounded animate-pulse mb-1" /> : (
                <p className={`text-headline-md font-black ${s.color}`}>{s.value}</p>
              )}
              <p className="text-label-md text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
            placeholder="Rechercher un utilisateur…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['Tous', ...ROLES] as const).map(r => (
            <button key={r} onClick={() => setRoleFilter(r as any)}
              className={`px-3 py-1.5 rounded-full text-label-md transition-all ${
                roleFilter === r ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
              }`}>{r}</button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1,2,3,4].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-3 block opacity-30">person_off</span>
            <p className="text-headline-md text-on-surface mb-1">{users.length === 0 ? 'Aucun utilisateur' : 'Aucun résultat'}</p>
            <p className="text-body-md">
              {users.length === 0 ? 'Ajoutez votre premier utilisateur.' : 'Essayez un autre filtre.'}
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Utilisateur</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Email</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Rôle</th>
                {isSuperAdmin && <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden xl:table-cell">Club</th>}
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden lg:table-cell">Connexion</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8f0]">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-label-lg text-on-surface truncate">{u.prenom} {u.nom}</p>
                        {isSuperAdmin && u.club_id && (
                          <p className="text-[11px] text-primary truncate xl:hidden">
                            {clubs.find(c => c.id === u.club_id)?.nom ?? `Club #${u.club_id}`}
                          </p>
                        )}
                        {isSuperAdmin && !u.club_id && (
                          <p className="text-[11px] text-orange-500 xl:hidden">Sans club</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-body-md text-on-surface-variant hidden md:table-cell">{u.email}</td>
                  <td className="px-4 py-3">
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value as Role)}
                      className={`px-3 py-1 rounded-full text-label-md font-semibold border-none focus:outline-none cursor-pointer ${roleColors[u.role]}`}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3 hidden xl:table-cell">
                      {u.club_id
                        ? <span className="text-body-sm text-primary font-medium">{clubs.find(c => c.id === u.club_id)?.nom ?? `#${u.club_id}`}</span>
                        : <span className="text-body-sm text-orange-500">Sans club</span>
                      }
                    </td>
                  )}
                  <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden lg:table-cell">
                    {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      {isSuperAdmin && (
                        <button
                          onClick={() => openAssign(u)}
                          title={u.club_id ? 'Changer de club' : 'Affecter à un club'}
                          className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                            u.club_id
                              ? 'text-primary hover:bg-primary/10'
                              : 'text-orange-500 hover:bg-orange-50'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            {u.club_id ? 'home_work' : 'add_home'}
                          </span>
                        </button>
                      )}
                      <button onClick={() => openEdit(u)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors" title="Modifier">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => openDelete(u)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors" title="Désactiver">
                        <span className="material-symbols-outlined text-[18px]">block</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Modal Créer / Modifier ──────────────────────────────────── */}
      {(modal.type === 'create' || modal.type === 'edit') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ type: 'none' })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">{modal.type === 'create' ? 'Ajouter un utilisateur' : 'Modifier l\'utilisateur'}</h3>
              <button onClick={() => setModal({ type: 'none' })} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && <p className="text-error text-body-sm bg-error/10 border border-error/30 px-3 py-2 rounded-lg">{error}</p>}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Prénom *</label>
                  <input value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                    placeholder="Jean" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Nom *</label>
                  <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                    placeholder="Dupont" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Email *</label>
                <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  type="email" disabled={modal.type === 'edit'}
                  className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all disabled:opacity-50"
                  placeholder="jean@club.fr" />
              </div>
              {modal.type === 'create' && (
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Mot de passe *</label>
                  <input value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    type="password"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                    placeholder="••••••••" />
                </div>
              )}
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Rôle</label>
                <div className="relative">
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}
                    className="w-full appearance-none px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all pr-8 bg-white">
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setModal({ type: 'none' })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={handleSave} disabled={saving || !form.nom || !form.email}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 flex items-center gap-2">
                {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                {modal.type === 'create' ? 'Créer' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Affecter au club ─────────────────────────────────── */}
      {modal.type === 'assign' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ type: 'none' })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <div>
                <h3 className="text-headline-md">Affecter au club</h3>
                <p className="text-body-sm text-on-surface-variant mt-0.5">{modal.user.prenom} {modal.user.nom} — {modal.user.email}</p>
              </div>
              <button onClick={() => setModal({ type: 'none' })} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              {error && <p className="text-error text-body-sm bg-error/10 border border-error/30 px-3 py-2 rounded-lg">{error}</p>}

              {/* Club actuel */}
              {modal.user.club_id && (
                <div className="flex items-center gap-2 bg-surface-container-low rounded-lg px-3 py-2.5 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] text-primary">home_work</span>
                  Club actuel : <strong className="text-on-surface">{clubs.find(c => c.id === modal.user.club_id)?.nom ?? `#${modal.user.club_id}`}</strong>
                </div>
              )}

              {/* Sélecteur de club */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Club *</label>
                <select
                  value={assignForm.club_id}
                  onChange={e => {
                    const cid = e.target.value
                    setAssignForm(f => ({ ...f, club_id: cid, equipe_id: '' }))
                    if (cid) api.get(`/equipes?club_id=${cid}`).then(r => setAssignEquipes(r.data.data || [])).catch(() => setAssignEquipes([]))
                    else setAssignEquipes([])
                  }}
                  className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                >
                  <option value="">Aucun club (retirer)</option>
                  {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                </select>
              </div>

              {/* Rôle */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Rôle</label>
                <select
                  value={assignForm.role}
                  onChange={e => setAssignForm(f => ({ ...f, role: e.target.value as Role }))}
                  className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                >
                  {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Catégorie (optionnel, pour joueur/coach/parent) */}
              {['joueur', 'coach', 'parent'].includes(assignForm.role) && assignEquipes.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">
                    Catégorie <span className="text-on-surface-variant/60">(optionnel)</span>
                  </label>
                  <select
                    value={assignCategorie}
                    onChange={e => {
                      setAssignCategorie(e.target.value)
                      const first = assignEquipes.find(eq => String(eq.categorie?.id) === e.target.value)
                      setAssignForm(f => ({ ...f, equipe_id: first ? String(first.id) : '' }))
                    }}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary"
                  >
                    <option value="">Sans catégorie spécifique</option>
                    {[...new Map(assignEquipes.filter(e => e.categorie).map(e => [e.categorie!.id, e.categorie!])).values()].map(cat => (
                      <option key={cat.id} value={String(cat.id)}>{cat.nom}</option>
                    ))}
                  </select>
                  {assignCategorie && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {assignEquipes.filter(e => String(e.categorie?.id) === assignCategorie).map(eq => (
                        <span key={eq.id} className="px-2.5 py-1 bg-primary/10 text-primary text-label-md rounded-full border border-primary/20">
                          {eq.nom}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setModal({ type: 'none' })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 flex items-center gap-2"
              >
                {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Suppression ───────────────────────────────────────── */}
      {modal.type === 'delete' && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete</span>
            </div>
            <h3 className="text-headline-md mb-2">Supprimer cet utilisateur ?</h3>
            <p className="text-body-md text-on-surface-variant mb-1">
              <strong>{modal.user.prenom} {modal.user.nom}</strong>
            </p>
            <p className="text-body-sm text-on-surface-variant mb-6">Cette action est irréversible.</p>
            {error && <p className="text-error text-body-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button onClick={() => { setModal({ type: 'none' }); setError('') }}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={handleDelete} disabled={saving}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-label-lg hover:opacity-90 disabled:opacity-50">
                {saving ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
      </>)} {/* fin onglet users */}

      {/* ── Onglet Clubs (superadmin) ─────────────────────────────── */}
      {activeTab === 'clubs' && isSuperAdmin && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="relative">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input value={clubSearch} onChange={e => setClubSearch(e.target.value)}
                placeholder="Rechercher un club…"
                className="pl-9 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary w-72" />
            </div>
            <button onClick={() => window.location.href = '/setup-club'}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">add</span>
              Nouveau club
            </button>
          </div>

          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {clubsLoading ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
            ) : clubs.filter(c => c.nom.toLowerCase().includes(clubSearch.toLowerCase())).length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">home_work</span>
                <p className="text-headline-md">Aucun club</p>
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                    {['Club','Ville','Email','Statut','Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-label-md text-on-surface-variant">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e8f0]">
                  {clubs.filter(c => c.nom.toLowerCase().includes(clubSearch.toLowerCase())).map(c => (
                    <tr key={c.id} className="hover:bg-surface-container-low transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {c.logo
                            ? <img src={c.logo} className="w-9 h-9 rounded-lg object-cover" alt="" />
                            : <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{c.nom.slice(0,2).toUpperCase()}</div>
                          }
                          <span className="text-label-lg text-on-surface font-medium">{c.nom}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant">{c.ville || '—'}</td>
                      <td className="px-4 py-3 text-body-md text-on-surface-variant">{c.email || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full text-label-md ${c.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {c.actif ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setManagedClub(c)}
                            className="px-3 py-1.5 text-primary text-label-md hover:bg-primary/5 rounded-lg transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">settings</span>
                            Gérer
                          </button>
                          <button
                            onClick={() => { setClubFilter(c.id); setActiveTab('users'); load(c.id) }}
                            className="px-3 py-1.5 text-on-surface-variant text-label-md hover:bg-surface-container rounded-lg transition-colors flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">groups</span>
                            Membres
                          </button>
                          <button
                            onClick={async () => { if (confirm(`Désactiver ${c.nom} ?`)) { await api.patch(`/clubs/${c.id}/disable`).catch(() => {}); loadClubs() } }}
                            className="p-1.5 text-error hover:bg-red-50 rounded-lg transition-colors">
                            <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
