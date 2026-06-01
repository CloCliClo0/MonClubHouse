import { useState } from 'react'

const teams = [
  { id: 1, name: 'Seniors A', category: 'Sénior', gender: 'Masculin', format: '11', coach: 'Marc Dupont', players: 22, color: '#0f5238', active: true },
  { id: 2, name: 'Seniors B', category: 'Sénior', gender: 'Masculin', format: '11', coach: 'Pierre Martin', players: 18, color: '#3f6653', active: true },
  { id: 3, name: 'U19', category: 'U19', gender: 'Masculin', format: '11', coach: 'Jean Leclerc', players: 20, color: '#005236', active: true },
  { id: 4, name: 'U15 A', category: 'U15', gender: 'Masculin', format: '11', coach: 'Sophie Bernard', players: 16, color: '#1b4332', active: true },
  { id: 5, name: 'Féminines A', category: 'Sénior', gender: 'Féminin', format: '11', coach: 'Anne Petit', players: 19, color: '#6a0572', active: true },
  { id: 6, name: 'U13', category: 'U13', gender: 'Mixte', format: '8', coach: 'Louis Garnier', players: 14, color: '#1565c0', active: true },
]

export default function TeamsPage() {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')

  const categories = ['Tous', 'Sénior', 'U19', 'U15', 'U13']

  const filtered = teams.filter((t) => {
    const matchSearch = t.name.toLowerCase().includes(search.toLowerCase()) || t.coach.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tous' || t.category === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Équipes</h2>
          <p className="text-body-md text-on-surface-variant">Gérez vos équipes et leurs compositions</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nouvelle équipe
        </button>
      </div>

      {/* Search & Filters */}
      <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
            placeholder="Rechercher une équipe ou un coach..."
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-label-md transition-all ${
                filter === cat
                  ? 'bg-primary text-white'
                  : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((team) => (
          <div
            key={team.id}
            className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
          >
            <div
              className="h-3"
              style={{ backgroundColor: team.color }}
            />
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-headline-md text-on-surface">{team.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">
                      {team.category}
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">
                      {team.gender}
                    </span>
                    <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">
                      {team.format}v{team.format}
                    </span>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: team.color }}
                >
                  {team.name.slice(0, 2).toUpperCase()}
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">person</span>
                  Coach : <span className="text-on-surface font-medium">{team.coach}</span>
                </div>
                <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">groups</span>
                  <span className="text-on-surface font-medium">{team.players} joueurs</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-[#e8e8f0]">
                <span className={`flex items-center gap-1.5 text-label-md ${team.active ? 'text-primary' : 'text-on-surface-variant'}`}>
                  <span className={`w-2 h-2 rounded-full ${team.active ? 'bg-primary' : 'bg-on-surface-variant'}`} />
                  {team.active ? 'Actif' : 'Inactif'}
                </span>
                <button className="text-primary text-label-md hover:underline flex items-center gap-1">
                  Voir l'équipe
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-4 block">sports_soccer</span>
          <p className="text-body-lg">Aucune équipe trouvée</p>
        </div>
      )}
    </div>
  )
}
