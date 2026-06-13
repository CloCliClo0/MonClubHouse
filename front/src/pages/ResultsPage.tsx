import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type Match = {
  id: number
  adversaire: string
  date: string
  score_equipe: number | null
  score_adversaire: number | null
  statut: string
  type: string
  domicile_exterieur: string
  championnat: string
  equipe: { nom: string; categorie?: { id: number; nom: string } | null }
}

type Standing = {
  rank: number
  team: string
  played: number
  won: number
  drawn: number
  lost: number
  gf: number
  ga: number
  pts: number
  current: boolean
}

const MATCH_TYPES = ['match', 'amical', 'coupe', 'tournoi']

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-20 text-center">
      <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">sports_soccer</span>
      <p className="text-headline-md text-on-surface mb-2">Aucun résultat</p>
      <p className="text-body-md text-on-surface-variant mb-6">Commencez par créer un match pour cette catégorie.</p>
      <button onClick={onAdd} className="bg-primary text-white px-6 py-3 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
        Créer un match
      </button>
    </div>
  )
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const [matches, setMatches]     = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading]     = useState(true)
  const [cat, setCat]             = useState('Tous')
  const [tab, setTab]             = useState<'resultats' | 'classement'>('resultats')

  useEffect(() => {
    api.get('/matchs')
      .then(r => setMatches((r.data.data || []).filter((m: Match) => MATCH_TYPES.includes(m.type))))
      .catch(() => setMatches([]))
    api.get('/resultats').then(r => setStandings(r.data.data || [])).catch(() => setStandings([])).finally(() => setLoading(false))
  }, [])

  // Catégories dynamiques depuis les matchs réels
  const categories = ['Tous', ...Array.from(new Set(matches.map(m => m.equipe?.categorie?.nom).filter(Boolean)))] as string[]

  const filtered = matches.filter(m =>
    cat === 'Tous' || m.equipe?.categorie?.nom === cat
  )

  const played   = filtered.filter(m => m.statut === 'termine')
  const getResult = (m: Match) => {
    if (m.score_equipe === null) return null
    if (m.score_equipe > m.score_adversaire!) return 'Victoire'
    if (m.score_equipe < m.score_adversaire!) return 'Défaite'
    return 'Nul'
  }

  const statusStyle: Record<string, string> = {
    Victoire: 'bg-green-100 text-green-700',
    Nul:      'bg-orange-100 text-orange-600',
    Défaite:  'bg-red-100 text-red-700',
  }

  const formColor: Record<string, string> = { V: 'bg-green-500', N: 'bg-orange-400', D: 'bg-red-500' }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Résultats & Classement</h2>
          <p className="text-body-md text-on-surface-variant">Résultats et classements par catégorie</p>
        </div>
        <button onClick={() => navigate('/evenements/creer')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nouveau match
        </button>
      </div>

      {/* Catégories */}
      <div className="flex gap-2 flex-wrap mb-5">
        {categories.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-full text-label-md font-semibold transition-all ${
              cat === c ? 'bg-primary text-white shadow-sm' : 'bg-white border border-[#e8e8f0] text-on-surface-variant hover:border-primary/40'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Stats rapides */}
      {!loading && played.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {[
            { v: played.length,                                    l: 'Matchs joués', c: 'text-on-surface'  },
            { v: played.filter(m => getResult(m) === 'Victoire').length, l: 'Victoires', c: 'text-green-600' },
            { v: played.filter(m => getResult(m) === 'Nul').length,      l: 'Nuls',      c: 'text-orange-500'},
            { v: played.filter(m => getResult(m) === 'Défaite').length,  l: 'Défaites',  c: 'text-error'    },
          ].map(s => (
            <div key={s.l} className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
              <p className={`text-headline-lg font-black ${s.c}`}>{s.v}</p>
              <p className="text-label-md text-on-surface-variant mt-0.5">{s.l}</p>
            </div>
          ))}
        </div>
      )}

      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#e8e8f0]">
          {(['resultats', 'classement'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-4 text-label-lg transition-all ${
                tab === t ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`}>
              {t === 'resultats' ? '⚽ Résultats' : '🏆 Classement'}
            </button>
          ))}
        </div>

        {/* Résultats */}
        {tab === 'resultats' && (
          <>
            {loading && (
              <div className="p-6 space-y-3">
                {[1,2,3].map(i => <div key={i} className="h-20 bg-surface-container-low rounded-xl animate-pulse" />)}
              </div>
            )}
            {!loading && filtered.length === 0 && <EmptyState onAdd={() => navigate('/evenements/creer')} />}
            {!loading && filtered.length > 0 && (
              <div className="divide-y divide-[#e8e8f0]">
                {filtered.map(m => {
                  const result = m.statut === 'termine' ? getResult(m) : null
                  const isFuture = m.statut === 'programme'
                  return (
                    <div key={m.id}
                      className={`p-5 flex items-center justify-between flex-wrap gap-4 transition-colors ${
                        m.statut === 'termine' ? 'hover:bg-surface-container-low cursor-pointer' : 'opacity-80'
                      }`}
                      onClick={() => m.statut === 'termine' && navigate(`/resultats/${m.id}`)}>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-label-md text-on-surface-variant">{m.championnat || m.equipe?.categorie?.nom}</span>
                          <span className="text-on-surface-variant/40">•</span>
                          <span className="text-label-md text-on-surface-variant">
                            {(() => { const d = new Date((m.date||'').replace(' ','T')); return isNaN(d.getTime()) ? '—' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) })()}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            m.domicile_exterieur === 'domicile' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                          }`}>
                            {m.domicile_exterieur === 'domicile' ? '🏠 Dom.' : '✈️ Ext.'}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="text-label-lg text-primary font-bold">{m.equipe?.nom}</span>
                          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#f4f4f6]">
                            {isFuture ? (
                              <span className="text-label-lg text-on-surface-variant">à venir</span>
                            ) : (
                              <>
                                <span className="text-headline-md font-black text-on-surface">{m.score_equipe}</span>
                                <span className="text-on-surface-variant">—</span>
                                <span className="text-headline-md font-black text-on-surface">{m.score_adversaire}</span>
                              </>
                            )}
                          </div>
                          <span className="text-label-lg text-on-surface">{m.adversaire}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {result && (
                          <span className={`px-3 py-1.5 rounded-full text-label-md font-semibold ${statusStyle[result]}`}>{result}</span>
                        )}
                        {m.statut === 'termine' && (
                          <button onClick={e => { e.stopPropagation(); navigate(`/resultats/${m.id}`) }}
                            className="flex items-center gap-1 text-primary text-label-md hover:underline">
                            Détails <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                          </button>
                        )}
                        {isFuture && (
                          <button onClick={e => { e.stopPropagation(); navigate(`/resultats/${m.id}`) }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-label-md hover:bg-primary/20 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">edit</span>
                            Saisir
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* Classement */}
        {tab === 'classement' && (
          <>
            {loading && (
              <div className="p-6 space-y-2">
                {[1,2,3,4].map(i => <div key={i} className="h-12 bg-surface-container-low rounded animate-pulse" />)}
              </div>
            )}
            {!loading && standings.length === 0 && (
              <div className="py-20 text-center">
                <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">leaderboard</span>
                <p className="text-headline-md text-on-surface mb-2">Classement indisponible</p>
                <p className="text-body-md text-on-surface-variant">Le classement se calcule automatiquement à partir des résultats saisis.</p>
              </div>
            )}
            {!loading && standings.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                      <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">#</th>
                      <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Équipe</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">J</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">G</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">N</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">P</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden md:table-cell">BP</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden md:table-cell">BC</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8f0]">
                    {standings.map(s => (
                      <tr key={s.rank} className={`transition-colors ${s.current ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                        <td className="px-4 py-3">
                          <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-label-md font-bold ${
                            s.rank === 1 ? 'bg-yellow-400 text-yellow-900' : s.rank <= 3 ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'
                          }`}>{s.rank}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`text-label-lg ${s.current ? 'text-primary font-bold' : 'text-on-surface'}`}>{s.team}</span>
                            {s.current && <span className="text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">Nous</span>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-body-md">{s.played}</td>
                        <td className="px-4 py-3 text-center text-body-md text-green-600 font-medium">{s.won}</td>
                        <td className="px-4 py-3 text-center text-body-md text-orange-500 font-medium">{s.drawn}</td>
                        <td className="px-4 py-3 text-center text-body-md text-error font-medium">{s.lost}</td>
                        <td className="px-4 py-3 text-center text-body-md hidden md:table-cell">{s.gf}</td>
                        <td className="px-4 py-3 text-center text-body-md hidden md:table-cell">{s.ga}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-black text-headline-md ${s.current ? 'text-primary' : 'text-on-surface'}`}>{s.pts}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
