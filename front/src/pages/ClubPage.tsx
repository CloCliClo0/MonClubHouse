import { useEffect, useState } from 'react'
import api from '../services/api'

type Club = { id: number; nom: string; description: string; adresse: string; ville: string; code_postal: string; telephone: string; email: string; site_web: string; numero_affiliation: string; couleur_primaire: string; couleur_secondaire: string }
type Terrain = { id: number; nom: string; type: string; capacite: number | null; adresse: string }
type ModalState = { open: false } | { open: true; editing: Terrain | null }

const BLANK_TERRAIN = { nom: '', type: 'gazon_naturel', capacite: '', adresse: '' }
const TERRAIN_TYPES = [
  { v: 'gazon_naturel',     l: 'Gazon naturel'     },
  { v: 'gazon_synthetique', l: 'Gazon synthétique'  },
  { v: 'salle',             l: 'Salle'              },
  { v: 'gymnase',           l: 'Gymnase'            },
  { v: 'piste',             l: 'Piste'              },
  { v: 'autre',             l: 'Autre'              },
]

export default function ClubPage() {
  const [club, setClub]           = useState<Club | null>(null)
  const [terrains, setTerrains]   = useState<Terrain[]>([])
  const [loading, setLoading]     = useState(true)
  const [editMode, setEditMode]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState<Partial<Club>>({})
  const [modal, setModal]         = useState<ModalState>({ open: false })
  const [terrainForm, setTerrainForm] = useState(BLANK_TERRAIN)
  const [savingTerrain, setSavingTerrain] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/clubs').catch(() => null),
      api.get('/clubs/terrains').catch(() => null),
    ]).then(([cRes, tRes]) => {
      const c = cRes?.data?.data?.[0] || cRes?.data?.data || null
      setClub(c)
      setForm(c || {})
      setTerrains(tRes?.data?.data || [])
    }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!club) return
    setSaving(true)
    try {
      await api.patch(`/clubs/${club.id}`, form)
      load()
      setEditMode(false)
    } finally {
      setSaving(false)
    }
  }

  const openAddTerrain  = () => { setTerrainForm(BLANK_TERRAIN); setModal({ open: true, editing: null }) }
  const openEditTerrain = (t: Terrain) => {
    setTerrainForm({ nom: t.nom, type: t.type, capacite: t.capacite?.toString() || '', adresse: t.adresse || '' })
    setModal({ open: true, editing: t })
  }

  const handleSaveTerrain = async () => {
    if (!club || !terrainForm.nom.trim()) return
    setSavingTerrain(true)
    try {
      const payload = { ...terrainForm, club_id: club.id, capacite: terrainForm.capacite ? parseInt(terrainForm.capacite) : null }
      if (modal.open && modal.editing) {
        await api.patch(`/clubs/terrains/${modal.editing.id}`, payload)
      } else {
        await api.post('/clubs/terrains', payload)
      }
      load()
      setModal({ open: false })
    } finally {
      setSavingTerrain(false)
    }
  }

  const handleDeleteTerrain = async (id: number) => {
    await api.delete(`/clubs/terrains/${id}`).catch(() => {})
    load()
    setDeleteConfirm(null)
  }

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const typeIcon: Record<string, string> = {
    gazon_naturel: 'grass', gazon_synthetique: 'sports_soccer', salle: 'house',
    gymnase: 'fitness_center', piste: 'directions_run', autre: 'stadium',
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-48 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />
        <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-24 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />)}</div>
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Mon Club</h2>
          <p className="text-body-md text-on-surface-variant">Informations et installations de votre club</p>
        </div>
        {editMode ? (
          <div className="flex gap-2">
            <button onClick={() => { setEditMode(false); setForm(club) }}
              className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">
              Annuler
            </button>
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-50">
              {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : <span className="material-symbols-outlined text-[18px]">save</span>}
              Enregistrer
            </button>
          </div>
        ) : (
          <button onClick={() => setEditMode(true)}
            className="flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[20px]">edit</span>
            Modifier
          </button>
        )}
      </div>

      {/* Header club */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden mb-6">
        <div className="h-20" style={{ background: `linear-gradient(135deg, ${club.couleur_primaire || '#0f5238'} 0%, ${club.couleur_secondaire || '#3f6653'} 100%)` }} />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-8 mb-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center font-black text-xl"
              style={{ color: club.couleur_primaire || '#0f5238' }}>
              {club.nom?.slice(0, 3).toUpperCase() || 'MCH'}
            </div>
            <div className="mb-1">
              {editMode ? (
                <input value={form.nom || ''} onChange={e => set('nom', e.target.value)}
                  className="text-headline-lg text-on-surface border-b-2 border-primary focus:outline-none bg-transparent" />
              ) : (
                <h2 className="text-headline-lg text-on-surface">{club.nom}</h2>
              )}
              <p className="text-body-md text-on-surface-variant">{club.ville} • {club.numero_affiliation}</p>
            </div>
          </div>
          {editMode ? (
            <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2}
              className="w-full border border-outline-variant rounded-lg px-3 py-2 text-body-md focus:outline-none focus:border-primary resize-none" />
          ) : (
            <p className="text-body-md text-on-surface-variant">{club.description}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos générales */}
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#e8e8f0]">
            <h4 className="text-headline-md">Informations générales</h4>
          </div>
          <div className="p-5 space-y-4">
            {[
              { k: 'adresse',            icon: 'location_on', label: 'Adresse'          },
              { k: 'ville',              icon: 'location_city',label: 'Ville'            },
              { k: 'code_postal',        icon: 'markunread_mailbox', label: 'Code postal'},
              { k: 'telephone',          icon: 'phone',       label: 'Téléphone'         },
              { k: 'email',              icon: 'mail',        label: 'Email'             },
              { k: 'site_web',           icon: 'public',      label: 'Site web'          },
              { k: 'numero_affiliation', icon: 'badge',       label: 'N° affiliation'    },
            ].map(item => (
              <div key={item.k} className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                  <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                </div>
                <div className="flex-1">
                  <p className="text-label-md text-on-surface-variant">{item.label}</p>
                  {editMode ? (
                    <input value={(form as any)[item.k] || ''} onChange={e => set(item.k, e.target.value)}
                      className="text-body-md text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary w-full mt-0.5 bg-transparent" />
                  ) : (
                    <p className="text-body-md text-on-surface">{(club as any)[item.k] || '—'}</p>
                  )}
                </div>
              </div>
            ))}

            {editMode && (
              <div className="flex items-center gap-4 pt-3 border-t border-[#e8e8f0]">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Couleur principale</label>
                  <input type="color" value={form.couleur_primaire || '#0f5238'} onChange={e => set('couleur_primaire', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Couleur secondaire</label>
                  <input type="color" value={form.couleur_secondaire || '#ffffff'} onChange={e => set('couleur_secondaire', e.target.value)}
                    className="w-10 h-10 rounded-lg border border-outline-variant cursor-pointer" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Terrains */}
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#e8e8f0] flex justify-between items-center">
            <h4 className="text-headline-md">Terrains & Installations</h4>
            <button onClick={openAddTerrain}
              className="flex items-center gap-1.5 text-primary text-label-md hover:underline">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Ajouter
            </button>
          </div>
          {terrains.length === 0 ? (
            <div className="py-12 text-center">
              <span className="material-symbols-outlined text-[40px] text-on-surface-variant/30 block mb-2">stadium</span>
              <p className="text-body-md text-on-surface-variant">Aucun terrain ajouté</p>
              <button onClick={openAddTerrain} className="mt-3 text-primary text-label-md hover:underline">Ajouter un terrain</button>
            </div>
          ) : (
            <div className="divide-y divide-[#e8e8f0]">
              {terrains.map(t => (
                <div key={t.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-primary text-[20px]">{typeIcon[t.type] || 'stadium'}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-label-lg text-on-surface">{t.nom}</p>
                    <p className="text-body-sm text-on-surface-variant">
                      {TERRAIN_TYPES.find(x => x.v === t.type)?.l || t.type}
                      {t.capacite ? ` • ${t.capacite} places` : ''}
                    </p>
                    {t.adresse && <p className="text-body-sm text-on-surface-variant">{t.adresse}</p>}
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => openEditTerrain(t)}
                      className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button onClick={() => setDeleteConfirm(t.id)}
                      className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modal Terrain ────────────────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">{modal.editing ? 'Modifier le terrain' : 'Ajouter un terrain'}</h3>
              <button onClick={() => setModal({ open: false })} className="text-on-surface-variant hover:text-on-surface">
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
                      className="w-full appearance-none px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all pr-8 bg-white">
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
              <button onClick={() => setModal({ open: false })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={handleSaveTerrain} disabled={savingTerrain || !terrainForm.nom.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40">
                {savingTerrain ? 'Enregistrement…' : modal.editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm suppression terrain ─────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete</span>
            </div>
            <h3 className="text-headline-md mb-2">Supprimer ce terrain ?</h3>
            <p className="text-body-md text-on-surface-variant mb-6">Cette action est irréversible.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={() => handleDeleteTerrain(deleteConfirm)}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-label-lg hover:opacity-90">Supprimer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
