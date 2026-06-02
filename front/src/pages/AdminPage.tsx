import { useEffect, useState } from 'react'
import api from '../services/api'

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

type User = { id: number; nom: string; prenom: string; email: string; role: Role; derniere_connexion: string | null; actif: boolean }

type ModalState =
  | { type: 'none' }
  | { type: 'create' }
  | { type: 'edit'; user: User }
  | { type: 'delete'; user: User }

const BLANK = { nom: '', prenom: '', email: '', role: 'joueur' as Role, password: '' }

export default function AdminPage() {
  const [users, setUsers]     = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'Tous'>('Tous')
  const [modal, setModal]     = useState<ModalState>({ type: 'none' })
  const [form, setForm]       = useState(BLANK)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')

  const load = () => {
    setLoading(true)
    api.get('/admin/users')
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
      await api.delete(`/admin/users/${modal.user.id}`)
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Administration</h2>
          <p className="text-body-md text-on-surface-variant">Gérez les utilisateurs et leurs rôles</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Ajouter un utilisateur
        </button>
      </div>

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
                <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Utilisateur</th>
                <th className="px-6 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Email</th>
                <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Rôle</th>
                <th className="px-6 py-3 text-left text-label-md text-on-surface-variant hidden lg:table-cell">Dernière connexion</th>
                <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8f0]">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {u.prenom?.[0]}{u.nom?.[0]}
                      </div>
                      <span className="text-label-lg text-on-surface">{u.prenom} {u.nom}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-body-md text-on-surface-variant hidden md:table-cell">{u.email}</td>
                  <td className="px-6 py-4">
                    <select value={u.role} onChange={e => updateRole(u.id, e.target.value as Role)}
                      className={`px-3 py-1 rounded-full text-label-md font-semibold border-none focus:outline-none cursor-pointer ${roleColors[u.role]}`}>
                      {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 text-body-md text-on-surface-variant hidden lg:table-cell">
                    {u.derniere_connexion ? new Date(u.derniere_connexion).toLocaleDateString('fr-FR') : 'Jamais'}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)}
                        className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors" title="Modifier">
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                      </button>
                      <button onClick={() => openDelete(u)}
                        className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors" title="Supprimer">
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
    </div>
  )
}
