import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

type Licencie = {
  id: number
  user_id: number
  statut: 'actif' | 'inactif' | 'suspendu' | 'blesse'
  poste?: string
  numero_maillot?: number
  user: {
    id: number; nom: string; prenom: string; email: string; avatar?: string; telephone?: string; parent_id?: number
    parent?: { id: number; nom: string; prenom: string; email: string; telephone?: string } | null
  }
}

type TeamDetail = {
  id: number; nom: string; categorie: string; genre: string; format: string
  couleur_maillot: string; description?: string; actif: boolean
  coach?: { id: number; nom: string; prenom: string; email: string }
  licencies: Licencie[]
}

type ClubUser = { id: number; nom: string; prenom: string; email: string; role: string; avatar?: string }

const STATUT_COLORS: Record<string, string> = {
  actif:    'bg-green-100 text-green-700',
  inactif:  'bg-slate-100 text-slate-600',
  suspendu: 'bg-red-100 text-red-700',
  blesse:   'bg-orange-100 text-orange-700',
}

export default function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'joueur'
  const canManage    = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)
  const canEditRoster = ['superadmin', 'admin', 'dirigeant'].includes(role)

  const [team, setTeam]       = useState<TeamDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'joueurs' | 'parents' | 'infos'>('joueurs')

  // Modal ajout joueur
  const [showAdd, setShowAdd]   = useState(false)
  const [clubUsers, setClubUsers] = useState<ClubUser[]>([])
  const [userSearch, setUserSearch] = useState('')
  const [addingId, setAddingId] = useState<number | null>(null)

  // Edition infos équipe
  const [editForm, setEditForm] = useState<Partial<TeamDetail>>({})
  const [saving, setSaving]     = useState(false)
  const [editMsg, setEditMsg]   = useState('')

  const load = () => {
    setLoading(true)
    api.get(`/equipes/${id}`)
      .then(r => {
        setTeam(r.data.data)
        setEditForm(r.data.data)
      })
      .catch(() => navigate('/equipes'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  const openAddModal = () => {
    setShowAdd(true)
    setUserSearch('')
    api.get('/admin/users').then(r => setClubUsers(r.data.data || [])).catch(() => {})
  }

  const alreadyInTeam = new Set(team?.licencies.map(l => l.user_id) ?? [])

  const filteredUsers = clubUsers.filter(u =>
    u.role === 'joueur' &&
    !alreadyInTeam.has(u.id) &&
    `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(userSearch.toLowerCase())
  )

  const addPlayer = async (user: ClubUser) => {
    setAddingId(user.id)
    try {
      await api.post('/licencies', { user_id: user.id, equipe_id: parseInt(id!), statut: 'actif' })
      load()
      setShowAdd(false)
    } catch (e: any) {
      alert(e.response?.data?.message || 'Erreur lors de l\'ajout')
    } finally {
      setAddingId(null)
    }
  }

  const updateStatut = async (licId: number, statut: string) => {
    await api.put(`/licencies/${licId}`, { statut }).catch(() => {})
    load()
  }

  const removePlayer = async (licId: number) => {
    if (!confirm('Retirer ce joueur de l\'équipe ?')) return
    await api.put(`/licencies/${licId}`, { equipe_id: null, statut: 'inactif' }).catch(() => {})
    load()
  }

  const saveInfos = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setEditMsg('')
    try {
      await api.put(`/equipes/${id}`, editForm)
      load()
      setEditMsg('Enregistré !')
      setTimeout(() => setEditMsg(''), 2500)
    } catch {
      setEditMsg('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="space-y-4">
      <div className="h-32 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />
      <div className="h-64 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />
    </div>
  )
  if (!team) return null

  const parents = team.licencies
    .filter(l => l.user.parent)
    .map(l => ({ player: l.user, parent: l.user.parent! }))

  return (
    <div>
      {/* Retour */}
      <button onClick={() => navigate('/equipes')}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-5 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour aux équipes
      </button>

      {/* Header */}
      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden mb-6">
        <div className="h-2" style={{ backgroundColor: team.couleur_maillot || '#0f5238' }} />
        <div className="p-6 flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white font-black text-xl shrink-0"
            style={{ backgroundColor: team.couleur_maillot || '#0f5238' }}>
            {team.nom.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-headline-lg text-on-surface">{team.nom}</h2>
            <div className="flex gap-2 mt-1.5 flex-wrap">
              <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{team.categorie}</span>
              <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{team.genre}</span>
              <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{team.format}v{team.format}</span>
              <span className={`px-2 py-0.5 rounded text-label-md ${team.actif ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
                {team.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
            {team.coach && (
              <p className="text-body-sm text-on-surface-variant mt-2 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px]">sports</span>
                Coach : <strong className="text-on-surface">{team.coach.prenom} {team.coach.nom}</strong>
              </p>
            )}
          </div>
          <div className="flex items-center gap-6 shrink-0">
            <div className="text-center">
              <p className="text-display-lg text-primary font-black">{team.licencies.filter(l => l.statut === 'actif').length}</p>
              <p className="text-label-md text-on-surface-variant">Joueurs actifs</p>
            </div>
            <div className="text-center">
              <p className="text-display-lg text-orange-500 font-black">{parents.length}</p>
              <p className="text-label-md text-on-surface-variant">Parents liés</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-outline-variant mb-6">
        {[
          { key: 'joueurs',  label: `Joueurs (${team.licencies.length})`, icon: 'sports_soccer' },
          { key: 'parents',  label: `Parents (${parents.length})`,        icon: 'family_restroom' },
          ...(canManage ? [{ key: 'infos', label: 'Infos équipe', icon: 'edit' }] : []),
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all ${
              tab === t.key ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
        {canEditRoster && tab === 'joueurs' && (
          <button onClick={openAddModal}
            className="ml-auto flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg text-label-md hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[18px]">person_add</span>
            Ajouter un joueur
          </button>
        )}
      </div>

      {/* ── Onglet Joueurs ─────────────────────────────────────────── */}
      {tab === 'joueurs' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          {team.licencies.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[52px] block mb-3 opacity-30">sports_soccer</span>
              <p className="text-headline-md text-on-surface mb-1">Aucun joueur</p>
              <p className="text-body-md mb-4">Ajoutez des joueurs à cette équipe.</p>
              {canEditRoster && (
                <button onClick={openAddModal}
                  className="bg-primary text-white px-5 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
                  Ajouter un joueur
                </button>
              )}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Joueur</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden sm:table-cell">Statut</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Poste</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">N°</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden lg:table-cell">Parent</th>
                  {canEditRoster && <th className="px-4 py-3 text-label-md text-on-surface-variant">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {team.licencies.map(lic => (
                  <tr key={lic.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {lic.user.avatar
                          ? <img src={lic.user.avatar} className="w-9 h-9 rounded-full object-cover" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                              {lic.user.prenom?.[0]}{lic.user.nom?.[0]}
                            </div>
                        }
                        <div>
                          <p className="text-label-lg text-on-surface">{lic.user.prenom} {lic.user.nom}</p>
                          <p className="text-body-sm text-on-surface-variant hidden sm:block">{lic.user.email}</p>
                          <span className={`sm:hidden px-2 py-0.5 rounded-full text-[11px] font-semibold ${STATUT_COLORS[lic.statut]}`}>{lic.statut}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {canManage ? (
                        <select value={lic.statut} onChange={e => updateStatut(lic.id, e.target.value)}
                          className={`px-2 py-0.5 rounded-full text-label-md font-semibold border-none focus:outline-none cursor-pointer ${STATUT_COLORS[lic.statut]}`}>
                          {['actif','inactif','suspendu','blesse'].map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      ) : (
                        <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${STATUT_COLORS[lic.statut]}`}>{lic.statut}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden md:table-cell">
                      {lic.poste || <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface hidden md:table-cell">
                      {lic.numero_maillot ?? <span className="opacity-40">—</span>}
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {lic.user.parent ? (
                        <div>
                          <p className="text-body-sm text-on-surface font-medium">{lic.user.parent.prenom} {lic.user.parent.nom}</p>
                          <p className="text-[11px] text-on-surface-variant">{lic.user.parent.email}</p>
                        </div>
                      ) : (
                        <span className="text-[11px] text-on-surface-variant opacity-50">Aucun</span>
                      )}
                    </td>
                    {canEditRoster && (
                      <td className="px-4 py-3">
                        <button onClick={() => removePlayer(lic.id)}
                          className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors" title="Retirer de l'équipe">
                          <span className="material-symbols-outlined text-[18px]">person_remove</span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Onglet Parents ─────────────────────────────────────────── */}
      {tab === 'parents' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          {parents.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[52px] block mb-3 opacity-30">family_restroom</span>
              <p className="text-headline-md text-on-surface mb-1">Aucun parent lié</p>
              <p className="text-body-md">Les parents se lient à leur enfant lors de leur inscription via un code d'accès parent.</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Parent</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Enfant (joueur)</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Contact</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {parents.map(({ player, parent }) => (
                  <tr key={player.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm shrink-0">
                          {parent.prenom?.[0]}{parent.nom?.[0]}
                        </div>
                        <div>
                          <p className="text-label-lg text-on-surface">{parent.prenom} {parent.nom}</p>
                          <p className="text-body-sm text-on-surface-variant">{parent.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary-container flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {player.prenom?.[0]}{player.nom?.[0]}
                        </div>
                        <span className="text-body-md text-on-surface">{player.prenom} {player.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-body-sm text-on-surface-variant hidden md:table-cell">
                      {parent.telephone || parent.email}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── Onglet Infos équipe ────────────────────────────────────── */}
      {tab === 'infos' && canManage && (
        <div className="bg-white border border-[#e8e8f0] rounded-2xl p-6">
          <form onSubmit={saveInfos} className="space-y-5 max-w-lg">
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Nom de l'équipe *</label>
              <input value={editForm.nom || ''} onChange={e => setEditForm(f => ({ ...f, nom: e.target.value }))} required
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-body-md" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Catégorie</label>
                <select value={editForm.categorie || ''} onChange={e => setEditForm(f => ({ ...f, categorie: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-body-md bg-white">
                  {['U7','U8','U9','U10','U11','U12','U13','U14','U15','U16','U17','U18','U19','U20','U21','Senior','Veteran','Loisir'].map(c => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Genre</label>
                <select value={editForm.genre || ''} onChange={e => setEditForm(f => ({ ...f, genre: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-body-md bg-white">
                  {[{ v: 'masculin', l: 'Masculin' }, { v: 'feminin', l: 'Féminin' }, { v: 'mixte', l: 'Mixte' }].map(g => <option key={g.v} value={g.v}>{g.l}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Description</label>
              <textarea value={editForm.description || ''} onChange={e => setEditForm(f => ({ ...f, description: e.target.value }))}
                rows={3} className="w-full px-4 py-2.5 border border-outline-variant rounded-lg focus:outline-none focus:border-primary text-body-md resize-none" />
            </div>
            <div className="flex items-center gap-4">
              <button type="submit" disabled={saving}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-50 flex items-center gap-2 transition-colors">
                {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                Enregistrer
              </button>
              {editMsg && <p className={`text-body-sm ${editMsg.includes('Erreur') ? 'text-error' : 'text-primary'}`}>{editMsg}</p>}
            </div>
          </form>
        </div>
      )}

      {/* ── Modal ajouter joueur ───────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAdd(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between shrink-0">
              <h3 className="text-headline-md">Ajouter un joueur</h3>
              <button onClick={() => setShowAdd(false)}><span className="material-symbols-outlined text-on-surface-variant">close</span></button>
            </div>
            <div className="p-4 shrink-0">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} autoFocus
                  placeholder="Rechercher un joueur dans le club…"
                  className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto divide-y divide-[#e8e8f0]">
              {filteredUsers.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px] block mb-2 opacity-30">person_search</span>
                  <p className="text-body-md">
                    {userSearch ? 'Aucun résultat' : 'Aucun joueur disponible dans ce club'}
                  </p>
                  <p className="text-body-sm mt-1">Les joueurs doivent d'abord rejoindre le club via un code d'accès.</p>
                </div>
              ) : (
                filteredUsers.map(u => (
                  <div key={u.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.prenom?.[0]}{u.nom?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface">{u.prenom} {u.nom}</p>
                      <p className="text-body-sm text-on-surface-variant truncate">{u.email}</p>
                    </div>
                    <button
                      onClick={() => addPlayer(u)}
                      disabled={addingId === u.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary-container disabled:opacity-50 transition-colors shrink-0"
                    >
                      {addingId === u.id
                        ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                        : <span className="material-symbols-outlined text-[16px]">add</span>
                      }
                      Ajouter
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
