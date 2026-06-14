import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'infos' | 'terrains' | 'categories'

type Club = {
  id: number; nom: string; logo?: string; description: string
  adresse: string; ville: string; code_postal: string; telephone: string
  email: string; site_web: string; numero_affiliation: string
  couleur_primaire: string; couleur_secondaire: string
}

type Terrain = { id: number; nom: string; type: string; capacite: number | null; adresse: string }

type Category = { id: number; nom: string; couleur?: string }

type Equipe = {
  id: number; nom: string; categorie?: Category | null; genre: string; format: string
  couleur_maillot: string | null; coach_id: number | null; description: string | null
  coach?: { id: number; nom: string; prenom: string }
  coachs_extra?: { id: number; nom: string; prenom: string }[]
}

type UserShort = { id: number; nom: string; prenom: string; role: string }

// ── Constants ─────────────────────────────────────────────────────────────────

const BLANK_TERRAIN   = { nom: '', type: 'gazon_naturel', capacite: '', adresse: '' }
const BLANK_EQUIPE    = { nom: '', genre: 'masculin', format: '11', couleur_maillot: '#0f5238', description: '' }
const BLANK_CATEGORY  = { nom: '', couleur: '#1b4332' }

const TERRAIN_TYPES = [
  { v: 'gazon_naturel',     l: 'Gazon naturel'    },
  { v: 'gazon_synthetique', l: 'Gazon synthétique' },
  { v: 'salle',             l: 'Salle'             },
  { v: 'gymnase',           l: 'Gymnase'           },
  { v: 'piste',             l: 'Piste'             },
  { v: 'autre',             l: 'Autre'             },
]

const GENRES = [
  { v: 'masculin',   l: 'Masculin'   },
  { v: 'feminin',    l: 'Féminin'    },
  { v: 'mixte',      l: 'Mixte'      },
  { v: 'handisport', l: 'Handisport' },
]

const FORMATS = ['4','5','7','8','11','15','autre']

const TERRAIN_ICON: Record<string, string> = {
  gazon_naturel: 'grass', gazon_synthetique: 'sports_soccer',
  salle: 'house', gymnase: 'fitness_center', piste: 'directions_run', autre: 'stadium',
}

const GENRE_ICON: Record<string, string> = {
  masculin: 'male', feminin: 'female', mixte: 'people', handisport: 'accessible',
}

// ── Composant ligne équipe ────────────────────────────────────────────────────

function EquipeRow({
  eq, canManage, onEdit, onDelete,
}: {
  eq: Equipe
  canManage: boolean
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="p-4 flex items-center gap-4 hover:bg-surface-container-low/30 transition-colors">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shrink-0"
        style={{ backgroundColor: eq.couleur_maillot || '#0f5238' }}
      >
        {eq.nom.slice(0, 2).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-label-lg text-on-surface">{eq.nom}</p>
        <div className="flex items-center flex-wrap gap-2 mt-0.5">
          <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
            <span className="material-symbols-outlined text-[13px]">{GENRE_ICON[eq.genre] || 'people'}</span>
            {GENRES.find(g => g.v === eq.genre)?.l || eq.genre}
          </span>
          <span className="text-on-surface-variant/40">·</span>
          <span className="text-body-sm text-on-surface-variant">
            {eq.format !== 'autre' ? `${eq.format}v${eq.format}` : 'Format libre'}
          </span>
          {(() => {
            const all = eq.coachs_extra && eq.coachs_extra.length > 0
              ? eq.coachs_extra
              : eq.coach ? [eq.coach] : []
            if (!all.length) return null
            return (
              <>
                <span className="text-on-surface-variant/40">·</span>
                <span className="flex items-center gap-1 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[13px]">person</span>
                  {all.map(c => `${c.prenom} ${c.nom}`).join(', ')}
                </span>
              </>
            )
          })()}
        </div>
      </div>
      {canManage && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onEdit}
            className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">edit</span>
          </button>
          <button
            onClick={onDelete}
            className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">delete</span>
          </button>
        </div>
      )}
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function ClubPage() {
  const role       = localStorage.getItem('role') || 'joueur'
  const canManage  = ['superadmin', 'admin', 'dirigeant'].includes(role)

  const [activeTab, setActiveTab] = useState<Tab>('infos')

  // ── Club ─────────────────────────────────────────────────────────
  const [club, setClub]       = useState<Club | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving]   = useState(false)
  const [form, setForm]       = useState<Partial<Club>>({})

  // ── Terrains ──────────────────────────────────────────────────────
  const [terrains, setTerrains]     = useState<Terrain[]>([])
  const [terrainModal, setTerrainModal] = useState<{ open: false } | { open: true; editing: Terrain | null }>({ open: false })
  const [terrainForm, setTerrainForm]   = useState(BLANK_TERRAIN)
  const [savingTerrain, setSavingTerrain] = useState(false)
  const [deleteTerrainId, setDeleteTerrainId] = useState<number | null>(null)

  // ── Équipes ───────────────────────────────────────────────────────
  const [equipes, setEquipes]       = useState<Equipe[]>([])
  const [clubCategories, setClubCategories] = useState<Category[]>([])
  const [coaches, setCoaches]       = useState<UserShort[]>([])
  const [equipeModal, setEquipeModal] = useState<{ open: false } | { open: true; editing: Equipe | null }>({ open: false })
  const [equipeForm, setEquipeForm]   = useState(BLANK_EQUIPE)
  const [equipeModalCatId, setEquipeModalCatId] = useState<number>(0)
  const [selectedCoachIds, setSelectedCoachIds] = useState<number[]>([])
  const [savingEquipe, setSavingEquipe] = useState(false)
  const [equipeError, setEquipeError]   = useState<string | null>(null)
  const [deleteEquipeId, setDeleteEquipeId] = useState<number | null>(null)
  const [selectedCatView, setSelectedCatView] = useState<number | null>(null)

  // ── Catégories ────────────────────────────────────────────────
  const [catModal, setCatModal] = useState<{ open: false } | { open: true; editing: Category | null }>({ open: false })
  const [catForm, setCatForm]   = useState(BLANK_CATEGORY)
  const [savingCat, setSavingCat]   = useState(false)
  const [deleteCatId, setDeleteCatId] = useState<number | null>(null)

  // ── Load ──────────────────────────────────────────────────────────

  const load = async () => {
    setLoading(true)
    try {
      const [cRes, tRes, eRes, uRes, catRes] = await Promise.all([
        api.get('/clubs').catch(() => null),
        api.get('/clubs/terrains').catch(() => null),
        api.get('/equipes').catch(() => null),
        api.get('/admin/users').catch(() => null),
        api.get('/categories').catch(() => null),
      ])

      // GET /clubs ne retourne que id/nom/logo/ville/couleur_primaire
      // → on récupère le club complet via GET /clubs/:id
      const partial = cRes?.data?.data?.[0] || cRes?.data?.data || null
      let c: Club | null = partial
      if (partial?.id) {
        try {
          const fullRes = await api.get(`/clubs/${partial.id}`)
          c = fullRes?.data?.data || partial
        } catch {}
      }

      setClub(c)
      setForm(c || {})
      setTerrains(tRes?.data?.data || [])
      setEquipes(eRes?.data?.data || eRes?.data || [])
      setClubCategories(catRes?.data?.data || [])
      const users: UserShort[] = uRes?.data?.data || []
      setCoaches(users.filter(u => ['coach', 'dirigeant', 'admin', 'superadmin'].includes(u.role)))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  // ── Derived ───────────────────────────────────────────────────────

  const equipesByCategorie = useMemo(() =>
    equipes.reduce((acc, eq) => {
      if (eq.categorie?.id) {
        if (!acc[eq.categorie.id]) acc[eq.categorie.id] = []
        acc[eq.categorie.id].push(eq)
      }
      return acc
    }, {} as Record<number, Equipe[]>)
  , [equipes])

  const usedCategories = useMemo(() => {
    const seen = new Map<number, Category>()
    equipes.forEach(e => { if (e.categorie?.id) seen.set(e.categorie.id, e.categorie) })
    return [...seen.values()]
  }, [equipes])

  // ── Club handlers ─────────────────────────────────────────────────

  const handleSave = async () => {
    if (!club) return
    setSaving(true)
    try { await api.patch(`/clubs/${club.id}`, form); load(); setEditMode(false) }
    finally { setSaving(false) }
  }

  const setF = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  // ── Terrain handlers ──────────────────────────────────────────────

  const openAddTerrain  = () => { setTerrainForm(BLANK_TERRAIN); setTerrainModal({ open: true, editing: null }) }
  const openEditTerrain = (t: Terrain) => {
    setTerrainForm({ nom: t.nom, type: t.type, capacite: t.capacite?.toString() || '', adresse: t.adresse || '' })
    setTerrainModal({ open: true, editing: t })
  }
  const handleSaveTerrain = async () => {
    if (!club || !terrainForm.nom.trim()) return
    setSavingTerrain(true)
    try {
      const payload = { ...terrainForm, club_id: club.id, capacite: terrainForm.capacite ? parseInt(terrainForm.capacite) : null }
      if (terrainModal.open && terrainModal.editing) {
        await api.patch(`/clubs/terrains/${terrainModal.editing.id}`, payload)
      } else {
        await api.post('/clubs/terrains', payload)
      }
      load(); setTerrainModal({ open: false })
    } finally { setSavingTerrain(false) }
  }
  const handleDeleteTerrain = async (id: number) => {
    await api.patch(`/clubs/terrains/${id}/disable`).catch(() => {})
    load(); setDeleteTerrainId(null)
  }

  // ── Equipe handlers ───────────────────────────────────────────────

  const openAddEquipe = (presetCatId?: number) => {
    setEquipeForm(BLANK_EQUIPE)
    setEquipeModalCatId(presetCatId || 0)
    setSelectedCoachIds([])
    setEquipeError(null)
    setEquipeModal({ open: true, editing: null })
  }
  const openEditEquipe = (e: Equipe) => {
    setEquipeForm({
      nom: e.nom, genre: e.genre, format: e.format,
      couleur_maillot: e.couleur_maillot || '#0f5238',
      description: e.description || '',
    })
    setEquipeModalCatId(e.categorie?.id || 0)
    const ids = e.coachs_extra && e.coachs_extra.length > 0
      ? e.coachs_extra.map(c => c.id)
      : e.coach_id ? [e.coach_id] : []
    setSelectedCoachIds(ids)
    setEquipeError(null)
    setEquipeModal({ open: true, editing: e })
  }

  const toggleCoach = (id: number) =>
    setSelectedCoachIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )

  const handleSaveEquipe = async () => {
    if (!equipeForm.nom.trim()) return
    setSavingEquipe(true)
    setEquipeError(null)
    try {
      const payload = {
        nom:             equipeForm.nom.trim(),
        categorie_id:    equipeModalCatId || null,
        genre:           equipeForm.genre,
        format:          equipeForm.format,
        couleur_maillot: equipeForm.couleur_maillot,
        description:     equipeForm.description || null,
        coach_id:        selectedCoachIds[0] || null,
      }
      let equipeId: number
      if (equipeModal.open && equipeModal.editing) {
        await api.put(`/equipes/${equipeModal.editing.id}`, payload)
        equipeId = equipeModal.editing.id
      } else {
        const res = await api.post('/equipes', payload)
        equipeId = res.data.data.id
      }
      await api.put(`/equipes/${equipeId}/coachs`, { coach_ids: selectedCoachIds })
      load(); setEquipeModal({ open: false })
    } catch (err: any) {
      setEquipeError(err?.response?.data?.message || 'Erreur lors de l\'enregistrement')
    } finally {
      setSavingEquipe(false)
    }
  }
  const handleDeleteEquipe = async (id: number) => {
    await api.patch(`/equipes/${id}/disable`).catch(() => {})
    load(); setDeleteEquipeId(null)
  }

  const setEF = (k: string, v: string) => setEquipeForm(f => ({ ...f, [k]: v }))

  // ── Category handlers ─────────────────────────────────────────

  const openAddCategory = () => {
    setCatForm(BLANK_CATEGORY)
    setCatModal({ open: true, editing: null })
  }
  const openEditCategory = (cat: Category) => {
    setCatForm({ nom: cat.nom, couleur: cat.couleur || '#1b4332' })
    setCatModal({ open: true, editing: cat })
  }
  const handleSaveCategory = async () => {
    if (!catForm.nom.trim()) return
    setSavingCat(true)
    try {
      if (catModal.open && catModal.editing) {
        await api.put(`/categories/${catModal.editing.id}`, catForm)
      } else {
        await api.post('/categories', catForm)
      }
      load(); setCatModal({ open: false })
    } catch {}
    finally { setSavingCat(false) }
  }
  const handleDeleteCategory = async (id: number) => {
    await api.delete(`/categories/${id}`).catch(() => {})
    load(); setDeleteCatId(null)
  }

  // ── Loading / No club ─────────────────────────────────────────────

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-40 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />
        <div className="h-10 w-72 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />
        <div className="grid grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="h-32 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />)}
        </div>
      </div>
    )
  }

  if (!club) {
    return (
      <div className="text-center py-20 bg-white border border-[#e8e8f0] rounded-xl">
        <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">home_work</span>
        <p className="text-headline-md text-on-surface mb-2">Aucun club configuré</p>
        <p className="text-body-md text-on-surface-variant">Contactez votre administrateur pour configurer le club.</p>
      </div>
    )
  }

  // ── Render ────────────────────────────────────────────────────────

  return (
    <div>
      {/* En-tête page */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-headline-lg text-on-surface">Mon Club</h2>
          <p className="text-body-md text-on-surface-variant">Gestion des informations, terrains et équipes</p>
        </div>

        {/* Actions contextuelles selon l'onglet */}
        {canManage && (
          <>
            {activeTab === 'infos' && (
              editMode ? (
                <div className="flex gap-2">
                  <button onClick={() => { setEditMode(false); setForm(club) }}
                    className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">
                    Annuler
                  </button>
                  <button onClick={handleSave} disabled={saving}
                    className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-50">
                    {saving
                      ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                      : <span className="material-symbols-outlined text-[18px]">save</span>
                    }
                    Enregistrer
                  </button>
                </div>
              ) : (
                <button onClick={() => setEditMode(true)}
                  className="flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>Modifier
                </button>
              )
            )}
            {activeTab === 'terrains' && (
              <button onClick={openAddTerrain}
                className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary/90 transition-colors shadow-sm">
                <span className="material-symbols-outlined text-[20px]">add</span>Ajouter un terrain
              </button>
            )}
            {activeTab === 'categories' && (
              <div className="flex items-center gap-2">
                <button onClick={openAddCategory}
                  className="flex items-center gap-2 border border-primary text-primary px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary/5 transition-colors">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Nouvelle catégorie
                </button>
                <button onClick={() => openAddEquipe(selectedCatView ?? undefined)}
                  className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary/90 transition-colors shadow-sm">
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  {selectedCatView
                    ? `Équipe ${clubCategories.find(c => c.id === selectedCatView)?.nom || ''}`
                    : 'Nouvelle équipe'}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Carte club */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden mb-5">
        <div className="h-14" style={{ background: `linear-gradient(135deg, ${club.couleur_primaire || '#0f5238'} 0%, ${club.couleur_secondaire || '#3f6653'} 100%)` }} />
        <div className="px-5 pb-4">
          <div className="flex items-end gap-4 -mt-6 mb-2">
            <div className="w-12 h-12 rounded-xl border-4 border-white shadow overflow-hidden shrink-0">
              {club.logo
                ? <img src={club.logo} alt="Logo" className="w-full h-full object-cover" />
                : <div className="w-full h-full bg-white flex items-center justify-center font-black text-sm" style={{ color: club.couleur_primaire || '#0f5238' }}>
                    {club.nom?.slice(0,3).toUpperCase() || 'MCH'}
                  </div>
              }
            </div>
            <div className="pb-1">
              <h3 className="text-headline-md text-on-surface leading-tight">{club.nom}</h3>
              <p className="text-body-sm text-on-surface-variant">
                {[club.ville, club.numero_affiliation].filter(Boolean).join(' · ')}
              </p>
            </div>
            <div className="ml-auto pb-1 flex gap-3 text-body-sm text-on-surface-variant">
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">sports_soccer</span>{equipes.length} équipe{equipes.length > 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">stadium</span>{terrains.length} terrain{terrains.length > 1 ? 's' : ''}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl mb-6 w-fit">
        {([
          { id: 'infos',      label: 'Informations',         icon: 'info'          },
          { id: 'terrains',   label: 'Terrains',              icon: 'stadium'       },
          { id: 'categories', label: 'Catégories & Équipes',  icon: 'sports_soccer' },
        ] as { id: Tab; label: string; icon: string }[]).map(tab => (
          <button key={tab.id}
            onClick={() => { setActiveTab(tab.id as Tab); setEditMode(false) }}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-label-md transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-white text-on-surface shadow-sm font-medium'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <span className="material-symbols-outlined text-[16px]">{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* ════════════════ Onglet Informations ════════════════════════ */}
      {activeTab === 'infos' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Infos générales */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#e8e8f0]">
              <h4 className="text-headline-md">Informations générales</h4>
            </div>
            <div className="p-5 space-y-4">
              {[
                { k: 'adresse',            icon: 'location_on',        label: 'Adresse'        },
                { k: 'ville',              icon: 'location_city',      label: 'Ville'          },
                { k: 'code_postal',        icon: 'markunread_mailbox',  label: 'Code postal'    },
                { k: 'telephone',          icon: 'phone',              label: 'Téléphone'      },
                { k: 'email',              icon: 'mail',               label: 'Email'          },
                { k: 'site_web',           icon: 'public',             label: 'Site web'       },
                { k: 'numero_affiliation', icon: 'badge',              label: 'N° affiliation' },
              ].map(item => (
                <div key={item.k} className="flex items-start gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                    <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-label-md text-on-surface-variant">{item.label}</p>
                    {editMode && canManage ? (
                      <input value={(form as any)[item.k] || ''} onChange={e => setF(item.k, e.target.value)}
                        className="text-body-md text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary w-full mt-0.5 bg-transparent" />
                    ) : (
                      <p className="text-body-md text-on-surface">{(club as any)[item.k] || '—'}</p>
                    )}
                  </div>
                </div>
              ))}

              {editMode && canManage && (
                <div className="flex items-center gap-4 pt-3 border-t border-[#e8e8f0]">
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Couleur principale</label>
                    <input type="color" value={form.couleur_primaire || '#0f5238'}
                      onChange={e => setF('couleur_primaire', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Couleur secondaire</label>
                    <input type="color" value={form.couleur_secondaire || '#ffffff'}
                      onChange={e => setF('couleur_secondaire', e.target.value)}
                      className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Description + logo */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="p-5 border-b border-[#e8e8f0]">
              <h4 className="text-headline-md">Description & Logo</h4>
            </div>
            <div className="p-5 space-y-4">
              {editMode && canManage && (
                <div>
                  <p className="text-label-md text-on-surface-variant mb-2">Logo du club</p>
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-14 rounded-xl border border-outline-variant overflow-hidden bg-surface-container flex items-center justify-center">
                      {club.logo
                        ? <img src={club.logo} className="w-full h-full object-cover" alt="" />
                        : <span className="font-black text-on-surface-variant text-sm">{club.nom?.slice(0,3).toUpperCase()}</span>
                      }
                    </div>
                    <button type="button" onClick={() => document.getElementById('club-logo-input')?.click()}
                      className="flex items-center gap-1.5 px-3 py-2 text-primary border border-primary/30 rounded-lg text-label-md hover:bg-primary/5 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">add_photo_alternate</span>
                      Changer le logo
                    </button>
                    <input id="club-logo-input" type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0]; if (!file) return
                        e.target.value = ''
                        const fd = new FormData(); fd.append('file', file)
                        try {
                          const res = await api.post('/upload/club', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
                          if (res.data.success) { await api.patch(`/clubs/${club.id}`, { logo: res.data.url }); load() }
                        } catch {}
                      }}
                    />
                  </div>
                </div>
              )}
              <div>
                <p className="text-label-md text-on-surface-variant mb-2">Description</p>
                {editMode && canManage ? (
                  <textarea value={form.description || ''} onChange={e => setF('description', e.target.value)} rows={6}
                    className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:outline-none focus:border-primary resize-none transition-all" />
                ) : (
                  <p className="text-body-md text-on-surface-variant leading-relaxed">
                    {club.description || 'Aucune description renseignée.'}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Onglet Terrains ════════════════════════════ */}
      {activeTab === 'terrains' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          {terrains.length === 0 ? (
            <div className="py-16 text-center">
              <span className="material-symbols-outlined text-[48px] text-on-surface-variant/30 block mb-3">stadium</span>
              <p className="text-body-md font-medium text-on-surface">Aucun terrain ajouté</p>
              <p className="text-body-sm text-on-surface-variant mt-1">Ajoutez les installations sportives de votre club.</p>
              {canManage && (
                <button onClick={openAddTerrain}
                  className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-label-md mx-auto hover:bg-primary/90 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">add</span>Ajouter un terrain
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[#e8e8f0]">
              {terrains.map(t => (
                <div key={t.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">{TERRAIN_ICON[t.type] || 'stadium'}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-label-lg text-on-surface">{t.nom}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {TERRAIN_TYPES.find(x => x.v === t.type)?.l || t.type}
                      {t.capacite ? ` · ${t.capacite} places` : ''}
                    </p>
                    {t.adresse && <p className="text-body-sm text-on-surface-variant truncate">{t.adresse}</p>}
                  </div>
                  {canManage && (
                    <div className="flex gap-1 shrink-0">
                      <button onClick={() => openEditTerrain(t)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => setDeleteTerrainId(t.id)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors">
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════ Onglet Catégories & Équipes ════════════════ */}
      {activeTab === 'categories' && (
        <div className="space-y-5">

          {/* Stats rapides */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 flex items-center gap-3">
              <div className="bg-primary/10 p-3 rounded-xl">
                <span className="material-symbols-outlined text-primary">sports_soccer</span>
              </div>
              <div>
                <p className="text-headline-md font-black text-primary">{equipes.length}</p>
                <p className="text-label-md text-on-surface-variant">Équipes</p>
              </div>
            </div>
            <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 flex items-center gap-3">
              <div className="bg-blue-50 p-3 rounded-xl">
                <span className="material-symbols-outlined text-blue-600">category</span>
              </div>
              <div>
                <p className="text-headline-md font-black text-blue-600">{usedCategories.length}</p>
                <p className="text-label-md text-on-surface-variant">Catégories actives</p>
              </div>
            </div>
          </div>

          {/* Filtres catégories */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl p-4">
            <p className="text-label-md text-on-surface-variant mb-3">Catégories</p>
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => setSelectedCatView(null)}
                className={`px-3 py-1.5 rounded-full text-label-md transition-all font-medium ${
                  selectedCatView === null
                    ? 'bg-primary text-white shadow-sm'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                }`}
              >
                Toutes ({usedCategories.length})
              </button>
              {clubCategories.map(cat => {
                const count = equipesByCategorie[cat.id]?.length || 0
                const isActive = count > 0
                const isSelected = selectedCatView === cat.id
                return (
                  <div key={cat.id} className="flex items-center gap-0.5">
                    <button
                      onClick={() => setSelectedCatView(cat.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md transition-all ${
                        isSelected
                          ? 'bg-primary text-white shadow-sm'
                          : isActive
                            ? 'bg-surface-container text-on-surface border border-outline-variant hover:border-primary/40'
                            : 'bg-white text-on-surface-variant/50 border border-dashed border-outline-variant hover:text-on-surface hover:border-primary/40'
                      }`}
                    >
                      {cat.couleur && (
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: cat.couleur }} />
                      )}
                      {cat.nom}
                      {isActive && (
                        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                          isSelected ? 'bg-white/20' : 'bg-primary/10 text-primary'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                    {canManage && (
                      <>
                        <button
                          onClick={() => openEditCategory(cat)}
                          title="Modifier la catégorie"
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-surface-container text-on-surface-variant/50 hover:text-on-surface transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteCatId(cat.id)}
                          title="Supprimer la catégorie"
                          className="w-6 h-6 flex items-center justify-center rounded-full hover:bg-red-50 text-on-surface-variant/50 hover:text-error transition-colors"
                        >
                          <span className="material-symbols-outlined text-[14px]">delete</span>
                        </button>
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Contenu — catégorie sélectionnée ou toutes les actives */}
          {selectedCatView !== null ? (
            /* ── Vue d'une catégorie spécifique ── */
            <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-[#e8e8f0] flex items-center justify-between bg-surface-container-low/30">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-primary text-white rounded-full text-label-md font-bold">
                    {clubCategories.find(c => c.id === selectedCatView)?.nom || ''}
                  </span>
                  <span className="text-body-sm text-on-surface-variant">
                    {(equipesByCategorie[selectedCatView] || []).length > 0
                      ? `${equipesByCategorie[selectedCatView].length} équipe${equipesByCategorie[selectedCatView].length > 1 ? 's' : ''}`
                      : 'Aucune équipe dans cette catégorie'}
                  </span>
                </div>
                {canManage && (
                  <button
                    onClick={() => openAddEquipe(selectedCatView)}
                    className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-label-md hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Créer une équipe
                  </button>
                )}
              </div>

              {!(equipesByCategorie[selectedCatView] || []).length ? (
                <div className="py-14 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">sports_soccer</span>
                  <p className="text-body-md font-medium">
                    Aucune équipe en {clubCategories.find(c => c.id === selectedCatView)?.nom || ''}
                  </p>
                  {canManage && (
                    <button
                      onClick={() => openAddEquipe(selectedCatView)}
                      className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-label-md mx-auto hover:bg-primary/90 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>
                      Créer la première équipe {clubCategories.find(c => c.id === selectedCatView)?.nom || ''}
                    </button>
                  )}
                </div>
              ) : (
                <div className="divide-y divide-[#e8e8f0]">
                  {equipesByCategorie[selectedCatView].map(eq => (
                    <EquipeRow
                      key={eq.id} eq={eq} canManage={canManage}
                      onEdit={() => openEditEquipe(eq)}
                      onDelete={() => setDeleteEquipeId(eq.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : usedCategories.length === 0 ? (
            /* ── Aucune équipe dans le club ── */
            <div className="py-16 text-center bg-white border border-[#e8e8f0] rounded-xl">
              <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">sports_soccer</span>
              <p className="text-headline-md text-on-surface mb-2">Aucune équipe créée</p>
              <p className="text-body-md text-on-surface-variant mb-5">
                Sélectionnez une catégorie ci-dessus pour créer votre première équipe.
              </p>
              {canManage && (
                <button
                  onClick={() => openAddEquipe()}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg mx-auto hover:bg-primary/90 transition-colors"
                >
                  <span className="material-symbols-outlined text-[20px]">add</span>
                  Créer une équipe
                </button>
              )}
            </div>
          ) : (
            /* ── Vue de toutes les catégories actives ── */
            usedCategories.map(cat => (
              <div key={cat.id} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                <div className="px-5 py-3 border-b border-[#e8e8f0] flex items-center justify-between bg-surface-container-low/30">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCatView(cat.id)}
                      className="px-3 py-1 bg-primary text-white rounded-full text-label-md font-bold hover:bg-primary/80 transition-colors"
                    >
                      {cat.nom}
                    </button>
                    <span className="text-body-sm text-on-surface-variant">
                      {equipesByCategorie[cat.id].length} équipe{equipesByCategorie[cat.id].length > 1 ? 's' : ''}
                    </span>
                  </div>
                  {canManage && (
                    <button
                      onClick={() => openAddEquipe(cat.id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-primary hover:bg-primary/10 rounded-lg text-label-md transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">add</span>Ajouter
                    </button>
                  )}
                </div>
                <div className="divide-y divide-[#e8e8f0]">
                  {equipesByCategorie[cat.id].map(eq => (
                    <EquipeRow
                      key={eq.id} eq={eq} canManage={canManage}
                      onEdit={() => openEditEquipe(eq)}
                      onDelete={() => setDeleteEquipeId(eq.id)}
                    />
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* ════════════════ Modal Terrain ══════════════════════════════ */}
      {terrainModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setTerrainModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">{terrainModal.editing ? 'Modifier le terrain' : 'Ajouter un terrain'}</h3>
              <button onClick={() => setTerrainModal({ open: false })} className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom *</label>
                <input value={terrainForm.nom} onChange={e => setTerrainForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Stade Municipal"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Type</label>
                  <div className="relative">
                    <select value={terrainForm.type} onChange={e => setTerrainForm(f => ({ ...f, type: e.target.value }))}
                      className="w-full appearance-none px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary pr-8 bg-white">
                      {TERRAIN_TYPES.map(t => <option key={t.v} value={t.v}>{t.l}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Capacité</label>
                  <input type="number" value={terrainForm.capacite} onChange={e => setTerrainForm(f => ({ ...f, capacite: e.target.value }))}
                    placeholder="Ex : 500"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Adresse</label>
                <input value={terrainForm.adresse} onChange={e => setTerrainForm(f => ({ ...f, adresse: e.target.value }))}
                  placeholder="Ex : 12 Rue du Stade, Lyon"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
              </div>
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setTerrainModal({ open: false })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={handleSaveTerrain} disabled={savingTerrain || !terrainForm.nom.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40">
                {savingTerrain ? 'Enregistrement…' : terrainModal.editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Modal Équipe ════════════════════════════════ */}
      {equipeModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setEquipeModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">{equipeModal.editing ? 'Modifier l\'équipe' : 'Créer une équipe'}</h3>
              <button onClick={() => setEquipeModal({ open: false })} className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Nom */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom de l'équipe *</label>
                <input value={equipeForm.nom} onChange={e => setEF('nom', e.target.value)}
                  placeholder="Ex : U15 Garçons A"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              {/* Catégorie */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Catégorie</label>
                <div className="relative">
                  <select value={equipeModalCatId} onChange={e => setEquipeModalCatId(Number(e.target.value))}
                    className="w-full appearance-none px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary pr-8 bg-white">
                    <option value={0}>— Aucune —</option>
                    {clubCategories.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
                  </select>
                  <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                </div>
              </div>

              {/* Genre + Format */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Genre</label>
                  <div className="relative">
                    <select value={equipeForm.genre} onChange={e => setEF('genre', e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary pr-8 bg-white">
                      {GENRES.map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Format</label>
                  <div className="relative">
                    <select value={equipeForm.format} onChange={e => setEF('format', e.target.value)}
                      className="w-full appearance-none px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary pr-8 bg-white">
                      {FORMATS.map(f => <option key={f} value={f}>{f === 'autre' ? 'Autre' : `${f}v${f}`}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
              </div>

              {/* Couleur maillot */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Couleur du maillot</label>
                <div className="flex items-center gap-3">
                  <input type="color" value={equipeForm.couleur_maillot} onChange={e => setEF('couleur_maillot', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer" />
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: equipeForm.couleur_maillot }}>
                    {equipeForm.nom.slice(0,2).toUpperCase() || '?'}
                  </div>
                  <span className="text-body-sm text-on-surface-variant">Aperçu du badge d'équipe</span>
                </div>
              </div>

              {/* Coachs (multi-select) */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">
                  Coachs (optionnel)
                  {selectedCoachIds.length > 0 && (
                    <span className="ml-2 text-primary font-semibold">{selectedCoachIds.length} sélectionné{selectedCoachIds.length > 1 ? 's' : ''}</span>
                  )}
                </label>
                {coaches.length === 0 ? (
                  <p className="text-body-sm text-on-surface-variant italic px-1">Aucun coach disponible dans le club.</p>
                ) : (
                  <div className="border border-outline-variant rounded-lg overflow-hidden divide-y divide-outline-variant/50 max-h-40 overflow-y-auto">
                    {coaches.map(c => {
                      const checked = selectedCoachIds.includes(c.id)
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => toggleCoach(c.id)}
                          className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                            checked ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded flex items-center justify-center border-2 shrink-0 transition-colors ${
                            checked ? 'bg-primary border-primary' : 'border-outline-variant'
                          }`}>
                            {checked && <span className="material-symbols-outlined text-white text-[14px]">check</span>}
                          </div>
                          <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                            <span className="text-primary text-[11px] font-bold">
                              {c.prenom[0]}{c.nom[0]}
                            </span>
                          </div>
                          <span className="text-body-md">{c.prenom} {c.nom}</span>
                          <span className="ml-auto text-body-sm text-on-surface-variant capitalize">{c.role}</span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Description (optionnel)</label>
                <textarea value={equipeForm.description} onChange={e => setEF('description', e.target.value)} rows={2}
                  placeholder="Informations sur l'équipe…"
                  className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-md focus:outline-none focus:border-primary resize-none transition-all" />
              </div>

              {equipeError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-700 flex items-center gap-2">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {equipeError}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setEquipeModal({ open: false })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
                Annuler
              </button>
              <button onClick={handleSaveEquipe} disabled={savingEquipe || !equipeForm.nom.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 flex items-center gap-2 transition-colors">
                {savingEquipe
                  ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Enregistrement…</>
                  : <><span className="material-symbols-outlined text-[18px]">{equipeModal.editing ? 'save' : 'add'}</span>{equipeModal.editing ? 'Enregistrer' : 'Créer l\'équipe'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Confirm suppression terrain ════════════════ */}
      {deleteTerrainId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete</span>
            </div>
            <h3 className="text-headline-md mb-2">Supprimer ce terrain ?</h3>
            <p className="text-body-md text-on-surface-variant mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTerrainId(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={() => handleDeleteTerrain(deleteTerrainId)}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-label-lg hover:opacity-90">Supprimer</button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Modal Catégorie ════════════════════════════ */}
      {catModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCatModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">{catModal.editing ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button onClick={() => setCatModal({ open: false })} className="p-2 hover:bg-surface-container-low rounded-lg text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom *</label>
                <input
                  value={catForm.nom}
                  onChange={e => setCatForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Senior, U18, Féminine…"
                  autoFocus
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Couleur</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={catForm.couleur}
                    onChange={e => setCatForm(f => ({ ...f, couleur: e.target.value }))}
                    className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer"
                  />
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-outline-variant text-label-md">
                    <span className="w-3 h-3 rounded-full" style={{ background: catForm.couleur }} />
                    {catForm.nom || 'Aperçu'}
                  </div>
                  <span className="text-body-sm text-on-surface-variant font-mono">{catForm.couleur}</span>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setCatModal({ open: false })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">
                Annuler
              </button>
              <button
                onClick={handleSaveCategory}
                disabled={savingCat || !catForm.nom.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 flex items-center gap-2"
              >
                {savingCat
                  ? <><span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>Enregistrement…</>
                  : <><span className="material-symbols-outlined text-[18px]">{catModal.editing ? 'save' : 'add'}</span>{catModal.editing ? 'Enregistrer' : 'Créer'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Confirm suppression catégorie ══════════════ */}
      {deleteCatId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">category</span>
            </div>
            <h3 className="text-headline-md mb-2">Supprimer cette catégorie ?</h3>
            <p className="text-body-md text-on-surface-variant mb-6">
              Les équipes liées ne seront pas supprimées mais n'auront plus de catégorie.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatId(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low">
                Annuler
              </button>
              <button onClick={() => handleDeleteCategory(deleteCatId)}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-label-lg hover:opacity-90">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ════════════════ Confirm suppression équipe ═════════════════ */}
      {deleteEquipeId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">sports_soccer</span>
            </div>
            <h3 className="text-headline-md mb-2">Désactiver cette équipe ?</h3>
            <p className="text-body-md text-on-surface-variant mb-6">L'équipe sera masquée mais les données (matchs, licenciés) seront conservées.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteEquipeId(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={() => handleDeleteEquipe(deleteEquipeId)}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-label-lg hover:opacity-90">Désactiver</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
