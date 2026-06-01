import { useState } from 'react'

type Role = 'superadmin' | 'admin' | 'dirigeant' | 'coach' | 'joueur' | 'parent' | 'visiteur'

const ROLES: Role[] = ['superadmin', 'admin', 'dirigeant', 'coach', 'joueur', 'parent', 'visiteur']

const roleColors: Record<Role, string> = {
  superadmin: 'bg-red-100 text-red-700',
  admin: 'bg-purple-100 text-purple-700',
  dirigeant: 'bg-blue-100 text-blue-700',
  coach: 'bg-primary/10 text-primary',
  joueur: 'bg-green-100 text-green-700',
  parent: 'bg-orange-100 text-orange-700',
  visiteur: 'bg-slate-100 text-slate-700',
}

const users = [
  { id: 1, name: 'Jean-Marc Durand', email: 'jm.durand@mch.fr', role: 'admin' as Role, lastLogin: 'Il y a 1 heure' },
  { id: 2, name: 'Marc Dupont', email: 'marc.dupont@mch.fr', role: 'coach' as Role, lastLogin: 'Il y a 3 heures' },
  { id: 3, name: 'Lucas Bertin', email: 'l.bertin@mch.fr', role: 'joueur' as Role, lastLogin: 'Hier' },
  { id: 4, name: 'Sophie Bernard', email: 's.bernard@mch.fr', role: 'coach' as Role, lastLogin: 'Il y a 2 jours' },
  { id: 5, name: 'Pierre Martin', email: 'p.martin@mch.fr', role: 'dirigeant' as Role, lastLogin: 'Il y a 5 heures' },
  { id: 6, name: 'Emma Leblanc', email: 'e.leblanc@mch.fr', role: 'parent' as Role, lastLogin: 'Il y a 1 semaine' },
  { id: 7, name: 'Alex Visiteur', email: 'a.visiteur@gmail.com', role: 'visiteur' as Role, lastLogin: 'Jamais' },
]

export default function AdminPage() {
  const [userList, setUserList] = useState(users)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<Role | 'Tous'>('Tous')

  const updateRole = (id: number, role: Role) => {
    setUserList((prev) => prev.map((u) => (u.id === id ? { ...u, role } : u)))
  }

  const filtered = userList.filter((u) => {
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
    const matchRole = roleFilter === 'Tous' || u.role === roleFilter
    return matchSearch && matchRole
  })

  const statsData = [
    { label: 'Utilisateurs', value: userList.length, icon: 'groups', color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Admins', value: userList.filter((u) => ['admin', 'superadmin', 'dirigeant'].includes(u.role)).length, icon: 'admin_panel_settings', color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Coachs', value: userList.filter((u) => u.role === 'coach').length, icon: 'sports', color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Joueurs', value: userList.filter((u) => u.role === 'joueur').length, icon: 'sports_soccer', color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Administration</h2>
          <p className="text-body-md text-on-surface-variant">Gérez les utilisateurs et leurs rôles</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">person_add</span>
          Ajouter un utilisateur
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {statsData.map((s) => (
          <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-lg p-4 flex items-center gap-4">
            <div className={`${s.bg} p-3 rounded-full`}>
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <p className="text-headline-md text-on-surface font-black">{s.value}</p>
              <p className="text-label-md text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
            placeholder="Rechercher un utilisateur..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['Tous', ...ROLES] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r as Role | 'Tous')}
              className={`px-3 py-1.5 rounded-full text-label-md transition-all ${
                roleFilter === r
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
              <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Utilisateur</th>
              <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Email</th>
              <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Rôle</th>
              <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Dernière connexion</th>
              <th className="px-6 py-3 text-left text-label-md text-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#e8e8f0]">
            {filtered.map((u) => (
              <tr key={u.id} className="hover:bg-surface-container-low transition-colors">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                      {u.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-label-lg text-on-surface">{u.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface-variant">{u.email}</td>
                <td className="px-6 py-4">
                  <select
                    value={u.role}
                    onChange={(e) => updateRole(u.id, e.target.value as Role)}
                    className={`px-3 py-1 rounded-full text-label-md font-semibold border-none focus:outline-none cursor-pointer ${roleColors[u.role]}`}
                  >
                    {ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-6 py-4 text-body-md text-on-surface-variant">{u.lastLogin}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors" title="Modifier">
                      <span className="material-symbols-outlined text-[18px]">edit</span>
                    </button>
                    <button className="w-8 h-8 rounded-full hover:bg-red-50 flex items-center justify-center text-on-surface-variant hover:text-error transition-colors" title="Supprimer">
                      <span className="material-symbols-outlined text-[18px]">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] mb-3 block">person_off</span>
            <p className="text-body-lg">Aucun utilisateur trouvé</p>
          </div>
        )}
      </div>
    </div>
  )
}
