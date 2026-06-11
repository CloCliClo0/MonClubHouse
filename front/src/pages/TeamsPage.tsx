import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type Team = {
  id: number
  nom: string
  categorie: string
  genre: string
  format: string
  couleur_maillot: string
  coach?: { nom: string; prenom: string }
  _count?: { licencies: number }
  players_count?: number
  actif: boolean
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const [teams, setTeams]     = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('Tous')

  useEffect(() => {
    api.get('/equipes')
      .then(r => setTeams(r.data.data || []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  const categories = ['Tous', ...Array.from(new Set(teams.map(t => t.categorie)))]

  const filtered = teams.filter(t => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tous' || t.categorie === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Équipes</h2>
          <p className="text-body-md text-on-surface-variant">Gérez vos équipes et leurs compositions</p>
        </div>
        <button onClick={() => navigate('/equipes/creer')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nouvelle équipe
        </button>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
            placeholder="Rechercher une équipe…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-label-md transition-all ${
                filter === cat ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white border border-[#e8e8f0] rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      )}

      {/* Vide */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white border border-[#e8e8f0] rounded-xl">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">sports_soccer</span>
          <p className="text-headline-md text-on-surface mb-2">
            {teams.length === 0 ? 'Aucune équipe créée' : 'Aucune équipe trouvée'}
          </p>
          <p className="text-body-md text-on-surface-variant mb-6">
            {teams.length === 0 ? 'Commencez par créer votre première équipe.' : 'Essayez un autre filtre.'}
          </p>
          {teams.length === 0 && (
            <button onClick={() => navigate('/equipes/creer')} className="bg-primary text-white px-6 py-3 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              Créer une équipe
            </button>
          )}
        </div>
      )}

      {/* Grille */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(team => (
            <div key={team.id}
              className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/equipes/${team.id}`)}>
              <div className="h-2" style={{ backgroundColor: team.couleur_maillot || '#0f5238' }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-headline-md text-on-surface">{team.nom}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">{team.categorie}</span>
                      <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">{team.genre}</span>
                      <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">{team.format}v{team.format}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: team.couleur_maillot || '#0f5238' }}>
                    {team.nom.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {team.coach && (
                    <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      Coach : <span className="text-on-surface font-medium">{team.coach.prenom} {team.coach.nom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">groups</span>
                    <span className="text-on-surface font-medium">{team.players_count ?? team._count?.licencies ?? 0} joueur(s)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#e8e8f0]">
                  <span className={`flex items-center gap-1.5 text-label-md ${team.actif ? 'text-primary' : 'text-on-surface-variant'}`}>
                    <span className={`w-2 h-2 rounded-full ${team.actif ? 'bg-primary' : 'bg-on-surface-variant'}`} />
                    {team.actif ? 'Actif' : 'Inactif'}
                  </span>
                  <span className="text-primary text-label-md flex items-center gap-1">
                    Voir l'équipe
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
