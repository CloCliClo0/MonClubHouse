import { useEffect, useState } from 'react'
import api from '../services/api'

type Club = {
  id: number; nom: string; logo?: string; ville?: string; email?: string
  telephone?: string; description?: string; couleur_primaire?: string; actif: boolean
}
type Category = { id: number; nom: string; couleur?: string }
type Equipe = { id: number; nom: string; categorie?: Category | null; niveau?: string; couleur?: string; actif: boolean }
type Role = 'superadmin' | 'admin' | 'dirigeant' | 'coach' | 'joueur' | 'parent' | 'visiteur'
type User = { id: number; nom: string; prenom: string; email: string; role: Role; actif: boolean; derniere_connexion: string | null }
type InviteCode = { id: number; code: string; role: string; label?: string; uses_count: number; max_uses: number; actif: boolean; categorie?: string; equipe?: { id: number; nom: string } }

const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-red-100 text-red-700', admin: 'bg-purple-100 text-purple-700',
  dirigeant: 'bg-blue-100 text-blue-700', coach: 'bg-primary/10 text-primary',
  joueur: 'bg-green-100 text-green-700', parent: 'bg-orange-100 text-orange-700',
  visiteur: 'bg-slate-100 text-slate-700',
}

export default function SuperAdminPage() {
  const role = localStorage.getItem('role')
  if (role !== 'superadmin') return (
    <div className="py-20 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[56px] block mb-3 opacity-30">lock</span>
      <p className="text-headline-md">Accès réservé au Super Administrateur</p>
    </div>
  )

  const [clubs, setClubs] = useState<Club[]>([])
  const [clubsLoading, setClubsLoading] = useState(true)
  const [selectedClub, setSelectedClub] = useState<Club | null>(null)
  const [tab, setTab] = useState<'infos' | 'equipes' | 'membres' | 'codes'>('infos')

  // Infos
  const [infos, setInfos] = useState({ nom: '', ville: '', email: '', telephone: '', description: '', couleur_primaire: '#1b4332' })
  const [infoSaving, setInfoSaving] = useState(false)
  const [infoSaved, setInfoSaved] = useState(false)

  // Équipes / Catégories
  const [equipes, setEquipes] = useState<Equipe[]>([])
  const [clubCategories, setClubCategories] = useState<Category[]>([])
  const [eqLoading, setEqLoading] = useState(false)
  // Création catégorie
  const [showCatForm, setShowCatForm] = useState(false)
  const [catForm, setCatForm] = useState({ categorie: '', couleur: '#1b4332' })
  const [catSaving, setCatSaving] = useState(false)
  // Création équipe dans une catégorie
  const [addEqInCat, setAddEqInCat] = useState<number | null>(null)
  const [eqForm, setEqForm] = useState({ nom: '', niveau: '' })
  const [eqSaving, setEqSaving] = useState(false)
  // Joueurs par catégorie (expanded)
  const [expandedCat, setExpandedCat] = useState<number | null>(null)
  const [catJoueurs, setCatJoueurs] = useState<Record<number, User[]>>({})

  // Membres
  const [membres, setMembres] = useState<User[]>([])
  const [memLoading, setMemLoading] = useState(false)
  const [memSearch, setMemSearch] = useState('')
  const [memRole, setMemRole] = useState('Tous')

  // Codes
  const [codes, setCodes] = useState<InviteCode[]>([])
  const [codesLoading, setCodesLoading] = useState(false)
  const [showCodeForm, setShowCodeForm] = useState(false)
  const [codeForm, setCodeForm] = useState({ role: 'joueur', categorie: '', label: '', max_uses: '50' })
  const [codeSaving, setCodeSaving] = useState(false)
  const [copied, setCopied] = useState<number | null>(null)

  useEffect(() => {
    api.get('/clubs').then(r => setClubs(r.data.data || [])).catch(() => setClubs([])).finally(() => setClubsLoading(false))
  }, [])

  const selectClub = (club: Club) => {
    setSelectedClub(club)
    setTab('infos')
    setInfos({ nom: club.nom, ville: club.ville || '', email: club.email || '', telephone: club.telephone || '', description: club.description || '', couleur_primaire: club.couleur_primaire || '#1b4332' })
  }

  useEffect(() => {
    if (!selectedClub) return
    if (tab === 'equipes') {
      setEqLoading(true)
      Promise.all([
        api.get(`/equipes?club_id=${selectedClub.id}`).catch(() => null),
        api.get(`/categories?club_id=${selectedClub.id}`).catch(() => null),
      ]).then(([eRes, catRes]) => {
        setEquipes(eRes?.data?.data || [])
        setClubCategories(catRes?.data?.data || [])
      }).finally(() => setEqLoading(false))
    }
    if (tab === 'membres') {
      setMemLoading(true)
      api.get(`/admin/users?club_id=${selectedClub.id}`).then(r => setMembres(r.data.data || [])).catch(() => setMembres([])).finally(() => setMemLoading(false))
    }
    if (tab === 'codes') {
      setCodesLoading(true)
      api.get(`/codes?club_id=${selectedClub.id}`).then(r => setCodes(r.data.data || [])).catch(() => setCodes([])).finally(() => setCodesLoading(false))
      api.get(`/equipes?club_id=${selectedClub.id}`).then(r => setEquipes(r.data.data || [])).catch(() => {})
      api.get(`/categories?club_id=${selectedClub.id}`).then(r => setClubCategories(r.data.data || [])).catch(() => {})
    }
  }, [tab, selectedClub])

  const saveInfos = async () => {
    if (!selectedClub) return
    setInfoSaving(true)
    try {
      await api.put(`/clubs/${selectedClub.id}`, infos)
      setSelectedClub(c => c ? { ...c, ...infos } : c)
      setClubs(prev => prev.map(c => c.id === selectedClub.id ? { ...c, ...infos } : c))
      setInfoSaved(true); setTimeout(() => setInfoSaved(false), 2000)
    } catch {}
    finally { setInfoSaving(false) }
  }

  const reloadEquipes = async () => {
    if (!selectedClub) return
    const r = await api.get(`/equipes?club_id=${selectedClub.id}`)
    setEquipes(r.data.data || [])
  }

  const reloadCategories = async () => {
    if (!selectedClub) return
    const r = await api.get(`/categories?club_id=${selectedClub.id}`)
    setClubCategories(r.data.data || [])
  }

  const createCategorie = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedClub) return; setCatSaving(true)
    try {
      await api.post('/categories', { nom: catForm.categorie, couleur: catForm.couleur, club_id: selectedClub.id })
      await reloadCategories()
      setShowCatForm(false); setCatForm({ categorie: '', couleur: '#1b4332' })
    } catch {}
    finally { setCatSaving(false) }
  }

  const createEquipeDansCat = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedClub || !addEqInCat) return; setEqSaving(true)
    try {
      const cat = clubCategories.find(c => c.id === addEqInCat)
      await api.post('/equipes', { nom: eqForm.nom, categorie_id: addEqInCat, niveau: eqForm.niveau || undefined, couleur_maillot: cat?.couleur || '#1b4332', club_id: selectedClub.id })
      await reloadEquipes()
      setAddEqInCat(null); setEqForm({ nom: '', niveau: '' })
    } catch {}
    finally { setEqSaving(false) }
  }

  const loadJoueursCat = async (catId: number) => {
    if (!selectedClub) return
    if (expandedCat === catId) { setExpandedCat(null); return }
    setExpandedCat(catId)
    if (catJoueurs[catId]) return
    try {
      const equipeIds = equipes.filter(e => e.categorie?.id === catId).map(e => e.id)
      const results = await Promise.all(equipeIds.map(id => api.get(`/licencies?equipe_id=${id}`).catch(() => ({ data: { data: [] } }))))
      const joueurs = results.flatMap(r => r.data.data || [])
      const unique = joueurs.filter((j, i, arr) => arr.findIndex(x => x.user_id === j.user_id) === i)
      setCatJoueurs(prev => ({ ...prev, [catId]: unique }))
    } catch {}
  }

  const deleteEquipe = async (id: number) => {
    if (!confirm('Désactiver cette équipe ?')) return
    await api.patch(`/equipes/${id}/disable`).catch(() => {})
    setEquipes(prev => prev.filter(e => e.id !== id))
  }

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault(); if (!selectedClub) return; setCodeSaving(true)
    try {
      const payload: Record<string, any> = { role: codeForm.role, label: codeForm.label || undefined, max_uses: parseInt(codeForm.max_uses), club_id: selectedClub.id }
      if (codeForm.categorie) payload.categorie = codeForm.categorie
      await api.post('/codes', payload)
      const r = await api.get(`/codes?club_id=${selectedClub.id}`)
      setCodes(r.data.data || [])
      setShowCodeForm(false); setCodeForm({ role: 'joueur', categorie: '', label: '', max_uses: '50' })
    } catch {}
    finally { setCodeSaving(false) }
  }

  const filteredMembres = membres.filter(u => {
    const matchSearch = `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(memSearch.toLowerCase())
    return matchSearch && (memRole === 'Tous' || u.role === memRole)
  })

  // ── Sélection du club ──────────────────────────────────────────
  if (!selectedClub) return (
    <div>
      <div className="mb-6">
        <h2 className="text-headline-lg text-on-surface">Super Administration</h2>
        <p className="text-body-md text-on-surface-variant">Sélectionnez un club à gérer</p>
      </div>

      <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 px-4 py-3 rounded-xl">
        <span className="material-symbols-outlined text-red-600">admin_panel_settings</span>
        <p className="text-label-lg text-red-800">Mode Super Administrateur — accès global à tous les clubs</p>
      </div>

      {clubsLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="h-24 bg-surface-container-low rounded-xl animate-pulse" />)}
        </div>
      ) : clubs.length === 0 ? (
        <div className="py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[56px] block mb-3 opacity-30">home_work</span>
          <p className="text-headline-md mb-2">Aucun club</p>
          <a href="/setup-club" className="inline-flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Créer un club
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {clubs.map(club => (
            <button key={club.id} onClick={() => selectClub(club)}
              className="bg-white border border-[#e8e8f0] rounded-xl p-5 text-left hover:border-primary/40 hover:shadow-sm transition-all group">
              <div className="flex items-center gap-3 mb-3">
                {club.logo
                  ? <img src={club.logo} className="w-12 h-12 rounded-xl object-cover" alt="" />
                  : <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg"
                      style={{ background: club.couleur_primaire || '#1b4332' }}>
                      {club.nom.slice(0,2).toUpperCase()}
                    </div>
                }
                <div className="min-w-0 flex-1">
                  <p className="text-label-lg text-on-surface font-semibold truncate group-hover:text-primary transition-colors">{club.nom}</p>
                  <p className="text-body-sm text-on-surface-variant">{club.ville || '—'}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ${club.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {club.actif ? 'Actif' : 'Inactif'}
                </span>
              </div>
              <div className="flex items-center justify-between text-body-sm text-on-surface-variant">
                <span>{club.email || 'Pas d\'email'}</span>
                <span className="text-primary group-hover:underline flex items-center gap-0.5">
                  Gérer <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </span>
              </div>
            </button>
          ))}
          <a href="/setup-club"
            className="bg-white border-2 border-dashed border-outline-variant rounded-xl p-5 flex flex-col items-center justify-center gap-2 text-on-surface-variant hover:border-primary/40 hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[32px]">add</span>
            <span className="text-label-lg">Nouveau club</span>
          </a>
        </div>
      )}
    </div>
  )

  // ── Gestion du club sélectionné ────────────────────────────────
  return (
    <div>
      {/* Header avec sélecteur de club */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => setSelectedClub(null)}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-surface-container-low transition-colors shrink-0">
            <span className="material-symbols-outlined text-on-surface-variant">arrow_back</span>
          </button>
          {selectedClub.logo
            ? <img src={selectedClub.logo} className="w-10 h-10 rounded-xl object-cover shrink-0" alt="" />
            : <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold shrink-0"
                style={{ background: selectedClub.couleur_primaire || '#1b4332' }}>
                {selectedClub.nom.slice(0,2).toUpperCase()}
              </div>
          }
          <div>
            <h2 className="text-headline-lg text-on-surface">{selectedClub.nom}</h2>
            <p className="text-body-sm text-on-surface-variant">{selectedClub.ville || 'Aucune ville renseignée'}</p>
          </div>
        </div>
        {/* Switcher de club */}
        <select
          value={selectedClub.id}
          onChange={e => { const c = clubs.find(cl => cl.id === parseInt(e.target.value)); if (c) selectClub(c) }}
          className="px-4 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white sm:w-56">
          {clubs.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
        </select>
      </div>

      {/* Sous-onglets */}
      <div className="flex border-b border-[#e8e8f0] mb-6 overflow-x-auto">
        {[
          { key: 'infos',   label: 'Infos du club', icon: 'info'    },
          { key: 'equipes', label: 'Équipes',        icon: 'groups'  },
          { key: 'membres', label: 'Membres',        icon: 'person'  },
          { key: 'codes',   label: 'Codes accès',    icon: 'key'     },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-5 py-3 text-label-lg whitespace-nowrap transition-all ${
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
            {([
              { label: 'Nom du club *', key: 'nom',       type: 'text'  },
              { label: 'Ville',         key: 'ville',     type: 'text'  },
              { label: 'Email',         key: 'email',     type: 'email' },
              { label: 'Téléphone',     key: 'telephone', type: 'tel'   },
            ] as const).map(f => (
              <div key={f.key} className="space-y-1">
                <label className="text-label-md text-on-surface-variant">{f.label}</label>
                <input type={f.type} value={(infos as any)[f.key]}
                  onChange={e => setInfos(i => ({ ...i, [f.key]: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
              </div>
            ))}
          </div>
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant">Description</label>
            <textarea value={infos.description} onChange={e => setInfos(i => ({ ...i, description: e.target.value }))} rows={3}
              className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary resize-none" />
          </div>
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input type="color" value={infos.couleur_primaire}
                onChange={e => setInfos(i => ({ ...i, couleur_primaire: e.target.value }))}
                className="w-10 h-10 rounded cursor-pointer border border-outline-variant" />
              <span className="text-body-sm font-mono text-on-surface-variant">{infos.couleur_primaire}</span>
              <div className="w-8 h-8 rounded-lg" style={{ background: infos.couleur_primaire }} />
            </div>
          </div>
          <div className="flex justify-end">
            <button onClick={saveInfos} disabled={infoSaving}
              className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
              {infoSaving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              {infoSaved ? '✓ Enregistré' : 'Enregistrer'}
            </button>
          </div>
        </div>
      )}

      {/* ── Catégories & Équipes ── */}
      {tab === 'equipes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => { setShowCatForm(v => !v); setAddEqInCat(null) }}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[20px]">create_new_folder</span>
              Créer une catégorie
            </button>
          </div>

          {/* Formulaire nouvelle catégorie */}
          {showCatForm && (
            <form onSubmit={createCategorie} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
              <h3 className="text-headline-md mb-1">Nouvelle catégorie</h3>
              <p className="text-body-sm text-on-surface-variant mb-4">Ex : U15, U17, Seniors, Vétérans…</p>
              <div className="flex items-end gap-4 flex-wrap">
                <div className="flex-1 min-w-[180px] space-y-1">
                  <label className="text-label-md text-on-surface-variant">Nom de la catégorie *</label>
                  <input required value={catForm.categorie} onChange={e => setCatForm(f => ({ ...f, categorie: e.target.value }))}
                    placeholder="Ex : U15"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Couleur</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={catForm.couleur} onChange={e => setCatForm(f => ({ ...f, couleur: e.target.value }))}
                      className="w-10 h-10 rounded cursor-pointer border border-outline-variant" />
                    <span className="text-body-sm font-mono text-on-surface-variant">{catForm.couleur}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setShowCatForm(false)}
                    className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
                  <button type="submit" disabled={catSaving}
                    className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40">Créer</button>
                </div>
              </div>
            </form>
          )}

          {eqLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
          ) : clubCategories.length === 0 ? (
            <div className="py-16 text-center bg-white border border-[#e8e8f0] rounded-xl text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">folder_open</span>
              <p className="text-headline-md mb-1">Aucune catégorie</p>
              <p className="text-body-md">Créez votre première catégorie pour organiser les équipes.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {clubCategories.map(cat => {
                const eqsDeCat = equipes.filter(e => e.categorie?.id === cat.id)
                const couleurCat = cat.couleur || '#1b4332'
                const joueursCat = catJoueurs[cat.id] || []
                return (
                  <div key={cat.id} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                    {/* Header catégorie */}
                    <div className="px-5 py-4 flex items-center gap-3 border-b border-[#e8e8f0]">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ background: couleurCat }} />
                      <div className="flex-1">
                        <p className="text-label-lg font-bold text-on-surface">{cat.nom}</p>
                        <p className="text-body-sm text-on-surface-variant">
                          {eqsDeCat.length} équipe{eqsDeCat.length > 1 ? 's' : ''}
                          {expandedCat === cat.id && joueursCat.length > 0 ? ` · ${joueursCat.length} joueur${joueursCat.length > 1 ? 's' : ''}` : ''}
                        </p>
                      </div>
                      <button onClick={() => loadJoueursCat(cat.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-label-md transition-colors ${expandedCat === cat.id ? 'bg-primary/10 text-primary' : 'text-on-surface-variant hover:bg-surface-container-low'}`}>
                        <span className="material-symbols-outlined text-[16px]">person</span>
                        Joueurs
                        <span className="material-symbols-outlined text-[14px]">{expandedCat === cat.id ? 'expand_less' : 'expand_more'}</span>
                      </button>
                      <button onClick={() => { setAddEqInCat(addEqInCat === cat.id ? null : cat.id); setEqForm({ nom: '', niveau: '' }); setShowCatForm(false) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary-container transition-colors">
                        <span className="material-symbols-outlined text-[16px]">add</span>
                        Équipe
                      </button>
                    </div>

                    {/* Formulaire ajout équipe dans cette catégorie */}
                    {addEqInCat === cat.id && (
                      <form onSubmit={createEquipeDansCat} className="px-5 py-4 bg-primary/5 border-b border-[#e8e8f0] flex items-end gap-3 flex-wrap">
                        <div className="flex-1 min-w-[150px] space-y-1">
                          <label className="text-label-md text-on-surface-variant">Nom de l'équipe *</label>
                          <input required value={eqForm.nom} onChange={e => setEqForm(f => ({ ...f, nom: e.target.value }))}
                            placeholder={`Ex : ${cat.nom} A`}
                            className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white" />
                        </div>
                        <div className="flex-1 min-w-[130px] space-y-1">
                          <label className="text-label-md text-on-surface-variant">Niveau</label>
                          <input value={eqForm.niveau} onChange={e => setEqForm(f => ({ ...f, niveau: e.target.value }))}
                            placeholder="Ex : Régional"
                            className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white" />
                        </div>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setAddEqInCat(null)}
                            className="px-3 py-2 border border-outline-variant rounded-lg text-label-lg hover:bg-white">Annuler</button>
                          <button type="submit" disabled={eqSaving}
                            className="px-4 py-2 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40">Ajouter</button>
                        </div>
                      </form>
                    )}

                    {/* Liste des équipes */}
                    <div className="divide-y divide-[#e8e8f0]">
                      {eqsDeCat.map(eq => (
                        <div key={eq.id} className="px-5 py-3 flex items-center gap-3 pl-10">
                          <span className="material-symbols-outlined text-[16px] text-on-surface-variant">subdirectory_arrow_right</span>
                          <div className="flex-1">
                            <p className="text-label-lg text-on-surface">{eq.nom}</p>
                            {eq.niveau && <p className="text-body-sm text-on-surface-variant">{eq.niveau}</p>}
                          </div>
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${eq.actif ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {eq.actif ? 'Active' : 'Inactive'}
                          </span>
                          <button onClick={() => { api.patch(`/equipes/${eq.id}/disable`).catch(() => {}); setEquipes(prev => prev.filter(e => e.id !== eq.id)) }}
                            className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors">
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Joueurs de la catégorie (expanded) */}
                    {expandedCat === cat.id && (
                      <div className="border-t border-[#e8e8f0] bg-surface-container-low/50">
                        {joueursCat.length === 0 ? (
                          <p className="px-5 py-4 text-body-sm text-on-surface-variant">Aucun joueur dans cette catégorie.</p>
                        ) : (
                          <div className="divide-y divide-[#e8e8f0]">
                            {joueursCat.map((j: any) => (
                              <div key={j.id} className="px-5 py-3 flex items-center gap-3">
                                <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {j.user?.prenom?.[0]}{j.user?.nom?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-label-md text-on-surface truncate">{j.user?.prenom} {j.user?.nom}</p>
                                  <p className="text-body-sm text-on-surface-variant truncate">{j.equipe?.nom} {j.poste ? `· ${j.poste}` : ''} {j.numero_maillot ? `· #${j.numero_maillot}` : ''}</p>
                                </div>
                                <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${j.statut === 'actif' ? 'bg-green-100 text-green-700' : 'bg-surface-container text-on-surface-variant'}`}>
                                  {j.statut}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Membres ── */}
      {tab === 'membres' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input value={memSearch} onChange={e => setMemSearch(e.target.value)} placeholder="Rechercher un membre…"
                className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['Tous', 'dirigeant', 'coach', 'joueur', 'parent'].map(r => (
                <button key={r} onClick={() => setMemRole(r)}
                  className={`px-3 py-1.5 rounded-full text-label-md transition-all ${memRole === r ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'}`}>
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* Stats rapides */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Total', value: membres.length, color: 'text-on-surface' },
              { label: 'Joueurs', value: membres.filter(u => u.role === 'joueur').length, color: 'text-green-600' },
              { label: 'Parents', value: membres.filter(u => u.role === 'parent').length, color: 'text-orange-500' },
              { label: 'Staff', value: membres.filter(u => ['coach','dirigeant','admin'].includes(u.role)).length, color: 'text-primary' },
            ].map(s => (
              <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
                <p className={`text-headline-lg font-black ${s.color}`}>{s.value}</p>
                <p className="text-label-md text-on-surface-variant">{s.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {memLoading ? (
              <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-12 bg-surface-container-low rounded animate-pulse" />)}</div>
            ) : filteredMembres.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">person_off</span>
                <p>Aucun membre trouvé</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {filteredMembres.map(u => (
                  <div key={u.id} className="px-5 py-3 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface truncate">{u.prenom} {u.nom}</p>
                      <p className="text-body-sm text-on-surface-variant truncate">{u.email}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold shrink-0 ${ROLE_COLORS[u.role] || ''}`}>{u.role}</span>
                    <span className="text-body-sm text-on-surface-variant hidden sm:block shrink-0">
                      {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Codes d'accès ── */}
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
                  <select value={codeForm.role} onChange={e => setCodeForm(f => ({ ...f, role: e.target.value, categorie: '' }))}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                    <option value="joueur">Joueur</option>
                    <option value="parent">Parent</option>
                    <option value="coach">Coach</option>
                    <option value="dirigeant">Dirigeant</option>
                  </select>
                </div>
                {['joueur', 'parent', 'coach'].includes(codeForm.role) && (
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Catégorie</label>
                    <select value={codeForm.categorie} onChange={e => setCodeForm(f => ({ ...f, categorie: e.target.value }))}
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary">
                      <option value="">— Aucune —</option>
                      {clubCategories.map(cat => <option key={cat.id} value={cat.nom}>{cat.nom}</option>)}
                    </select>
                  </div>
                )}
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Libellé (optionnel)</label>
                  <input value={codeForm.label} onChange={e => setCodeForm(f => ({ ...f, label: e.target.value }))}
                    placeholder="Ex : Saison 2025-26 U15"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Utilisations max</label>
                  <input type="number" value={codeForm.max_uses} min="1" max="500"
                    onChange={e => setCodeForm(f => ({ ...f, max_uses: e.target.value }))}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-4">
                <button type="button" onClick={() => setShowCodeForm(false)}
                  className="px-4 py-2 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
                <button type="submit" disabled={codeSaving}
                  className="px-5 py-2 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40">Générer</button>
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
                    <button onClick={() => { navigator.clipboard.writeText(c.code); setCopied(c.id); setTimeout(() => setCopied(null), 2000) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">{copied === c.id ? 'check' : 'content_copy'}</span>
                    </button>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full text-label-md bg-green-100 text-green-700">{c.role}</span>
                        {c.categorie && <span className="px-2 py-0.5 rounded-full text-label-md bg-blue-100 text-blue-700">{c.categorie}</span>}
                        {c.equipe && !c.categorie && <span className="text-body-sm text-on-surface-variant">{c.equipe.nom}</span>}
                        {c.label && <span className="text-body-sm text-on-surface-variant italic">• {c.label}</span>}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <p className="text-[11px] text-on-surface-variant">{c.uses_count}/{c.max_uses} utilisations</p>
                        <div className="w-20 h-1 bg-surface-container-low rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (c.uses_count / c.max_uses) * 100)}%` }} />
                        </div>
                      </div>
                    </div>
                    <button onClick={async () => { await api.patch(`/codes/${c.id}/disable`).catch(() => {}); setCodes(prev => prev.filter(x => x.id !== c.id)) }}
                      className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors">
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
