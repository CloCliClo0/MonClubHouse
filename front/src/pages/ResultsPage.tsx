import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Category = 'Seniors A' | 'Seniors B' | 'U19' | 'U15' | 'Féminines A'

type Match = {
  id: number
  home: string
  away: string
  scoreHome: number | null
  scoreAway: number | null
  date: string
  competition: string
  categorie: Category
  lieu: 'domicile' | 'exterieur'
  statut: 'planifie' | 'en_cours' | 'termine'
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
  form: ('V' | 'N' | 'D')[]
}

const CATEGORIES: Category[] = ['Seniors A', 'Seniors B', 'U19', 'U15', 'Féminines A']

const ALL_MATCHES: Match[] = [
  { id: 1,  home: 'MCH Seniors A',  away: 'Red Star FC',      scoreHome: 3, scoreAway: 1, date: '2025-05-31', competition: 'Division 3',    categorie: 'Seniors A',   lieu: 'domicile', statut: 'termine'  },
  { id: 2,  home: 'AJ Lyon',        away: 'MCH Seniors A',    scoreHome: 0, scoreAway: 2, date: '2025-05-24', competition: 'Division 3',    categorie: 'Seniors A',   lieu: 'exterieur',statut: 'termine'  },
  { id: 3,  home: 'MCH Seniors A',  away: 'FC Villeurbanne',  scoreHome: 1, scoreAway: 1, date: '2025-05-17', competition: 'Division 3',    categorie: 'Seniors A',   lieu: 'domicile', statut: 'termine'  },
  { id: 4,  home: 'Paris FC B',     away: 'MCH Seniors A',    scoreHome: 2, scoreAway: 0, date: '2025-05-10', competition: 'Division 3',    categorie: 'Seniors A',   lieu: 'exterieur',statut: 'termine'  },
  { id: 5,  home: 'MCH Seniors A',  away: 'Olympique Givors', scoreHome: 4, scoreAway: 0, date: '2025-05-03', competition: 'Division 3',    categorie: 'Seniors A',   lieu: 'domicile', statut: 'termine'  },
  { id: 6,  home: 'MCH Seniors A',  away: 'Red Star FC',      scoreHome: null, scoreAway: null, date: '2025-06-14', competition: 'Division 3', categorie: 'Seniors A', lieu: 'domicile', statut: 'planifie' },
  { id: 7,  home: 'MCH Seniors B',  away: 'FC Bron B',        scoreHome: 2, scoreAway: 2, date: '2025-05-31', competition: 'Division 4',    categorie: 'Seniors B',   lieu: 'domicile', statut: 'termine'  },
  { id: 8,  home: 'Lyon Sud B',     away: 'MCH Seniors B',    scoreHome: 1, scoreAway: 3, date: '2025-05-24', competition: 'Division 4',    categorie: 'Seniors B',   lieu: 'exterieur',statut: 'termine'  },
  { id: 9,  home: 'MCH U19',        away: 'Red Star U19',     scoreHome: 2, scoreAway: 2, date: '2025-05-31', competition: 'U19 Régional',  categorie: 'U19',         lieu: 'domicile', statut: 'termine'  },
  { id: 10, home: 'FC Lyon U19',    away: 'MCH U19',          scoreHome: 1, scoreAway: 3, date: '2025-05-24', competition: 'U19 Régional',  categorie: 'U19',         lieu: 'exterieur',statut: 'termine'  },
  { id: 11, home: 'MCH U15',        away: 'ES Décines U15',   scoreHome: 3, scoreAway: 1, date: '2025-05-25', competition: 'U15 District',  categorie: 'U15',         lieu: 'domicile', statut: 'termine'  },
  { id: 12, home: 'MCH Féminines A',away: 'Lyon Fém.',        scoreHome: 2, scoreAway: 0, date: '2025-05-28', competition: 'Div. Fém. R2',  categorie: 'Féminines A', lieu: 'domicile', statut: 'termine'  },
]

const STANDINGS: Record<Category, Standing[]> = {
  'Seniors A': [
    { rank: 1, team: 'MCH Seniors A',   played: 18, won: 13, drawn: 3, lost: 2,  gf: 42, ga: 18, pts: 42, current: true,  form: ['V','V','N','V','D'] },
    { rank: 2, team: 'Red Star FC',      played: 18, won: 11, drawn: 4, lost: 3,  gf: 35, ga: 22, pts: 37, current: false, form: ['D','V','V','N','V'] },
    { rank: 3, team: 'AJ Lyon',          played: 18, won: 10, drawn: 3, lost: 5,  gf: 31, ga: 25, pts: 33, current: false, form: ['V','N','D','V','V'] },
    { rank: 4, team: 'FC Villeurbanne',  played: 18, won: 8,  drawn: 5, lost: 5,  gf: 28, ga: 24, pts: 29, current: false, form: ['N','V','N','D','V'] },
    { rank: 5, team: 'Paris FC B',       played: 18, won: 7,  drawn: 4, lost: 7,  gf: 24, ga: 29, pts: 25, current: false, form: ['V','D','N','V','D'] },
    { rank: 6, team: 'Olympique Givors', played: 18, won: 5,  drawn: 5, lost: 8,  gf: 22, ga: 34, pts: 20, current: false, form: ['D','D','N','V','D'] },
  ],
  'Seniors B': [
    { rank: 1, team: 'FC Bron B',      played: 14, won: 9,  drawn: 3, lost: 2, gf: 28, ga: 14, pts: 30, current: false, form: ['V','N','V','V','D'] },
    { rank: 2, team: 'MCH Seniors B',  played: 14, won: 8,  drawn: 3, lost: 3, gf: 25, ga: 18, pts: 27, current: true,  form: ['V','N','V','V','D'] },
    { rank: 3, team: 'Lyon Sud B',     played: 14, won: 7,  drawn: 2, lost: 5, gf: 22, ga: 20, pts: 23, current: false, form: ['D','V','N','V','D'] },
  ],
  'U19': [
    { rank: 1, team: 'MCH U19',    played: 12, won: 8, drawn: 2, lost: 2, gf: 30, ga: 12, pts: 26, current: true,  form: ['V','N','V','V','D'] },
    { rank: 2, team: 'Red Star U19',played: 12, won: 7, drawn: 2, lost: 3, gf: 24, ga: 15, pts: 23, current: false, form: ['D','V','N','V','D'] },
    { rank: 3, team: 'FC Lyon U19', played: 12, won: 5, drawn: 3, lost: 4, gf: 18, ga: 18, pts: 18, current: false, form: ['N','V','D','N','V'] },
  ],
  'U15': [
    { rank: 1, team: 'MCH U15',      played: 10, won: 8, drawn: 1, lost: 1, gf: 35, ga: 8,  pts: 25, current: true,  form: ['V','V','V','N','V'] },
    { rank: 2, team: 'ES Décines U15',played: 10, won: 6, drawn: 2, lost: 2, gf: 22, ga: 14, pts: 20, current: false, form: ['D','V','V','N','V'] },
  ],
  'Féminines A': [
    { rank: 1, team: 'MCH Féminines A',played: 10, won: 7, drawn: 2, lost: 1, gf: 28, ga: 10, pts: 23, current: true,  form: ['V','V','V','N','V'] },
    { rank: 2, team: 'Lyon Fém.',       played: 10, won: 5, drawn: 2, lost: 3, gf: 18, ga: 16, pts: 17, current: false, form: ['D','V','N','V','D'] },
  ],
}

const statusStyle: Record<string, string> = {
  Victoire: 'bg-green-100 text-green-700',
  Nul:      'bg-orange-100 text-orange-600',
  Défaite:  'bg-red-100 text-red-700',
}

const formColor: Record<string, string> = {
  V: 'bg-green-500', N: 'bg-orange-400', D: 'bg-red-500',
}

export default function ResultsPage() {
  const navigate = useNavigate()
  const [cat, setCat]   = useState<Category>('Seniors A')
  const [tab, setTab]   = useState<'resultats' | 'classement'>('resultats')

  const catMatches = ALL_MATCHES.filter(m => m.categorie === cat)
  const catStandings = STANDINGS[cat] || []

  const getResult = (m: Match): 'Victoire' | 'Nul' | 'Défaite' | null => {
    if (m.statut !== 'termine' || m.scoreHome === null) return null
    const isMCHHome = m.home.startsWith('MCH')
    const our = isMCHHome ? m.scoreHome : m.scoreAway!
    const their = isMCHHome ? m.scoreAway! : m.scoreHome
    if (our > their) return 'Victoire'
    if (our < their) return 'Défaite'
    return 'Nul'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Résultats & Classement</h2>
          <p className="text-body-md text-on-surface-variant">Résultats et classements par catégorie</p>
        </div>
        <button
          onClick={() => navigate('/evenements/creer')}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Nouveau match
        </button>
      </div>

      {/* Catégories */}
      <div className="flex gap-2 flex-wrap mb-5">
        {CATEGORIES.map(c => (
          <button key={c} onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-full text-label-md font-semibold transition-all ${
              cat === c ? 'bg-primary text-white shadow-sm' : 'bg-white border border-[#e8e8f0] text-on-surface-variant hover:border-primary/40'
            }`}>
            {c}
          </button>
        ))}
      </div>

      {/* Stats rapides catégorie */}
      {(() => {
        const played   = catMatches.filter(m => m.statut === 'termine')
        const victoires = played.filter(m => getResult(m) === 'Victoire').length
        const nuls      = played.filter(m => getResult(m) === 'Nul').length
        const defaites  = played.filter(m => getResult(m) === 'Défaite').length
        const pts       = catStandings.find(s => s.current)?.pts ?? 0
        const rank      = catStandings.find(s => s.current)?.rank ?? '-'
        return (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
            {[
              { v: played.length,  l: 'Matchs joués',    c: 'text-on-surface'   },
              { v: victoires,      l: 'Victoires',        c: 'text-green-600'    },
              { v: nuls,           l: 'Nuls',             c: 'text-orange-500'   },
              { v: defaites,       l: 'Défaites',         c: 'text-error'        },
              { v: `${pts} pts`,   l: `${rank}${rank === 1 ? 'er' : 'ème'} place`, c: 'text-primary' },
            ].map(s => (
              <div key={s.l} className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
                <p className={`text-headline-lg font-black ${s.c}`}>{s.v}</p>
                <p className="text-label-md text-on-surface-variant mt-0.5">{s.l}</p>
              </div>
            ))}
          </div>
        )
      })()}

      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        {/* Tabs */}
        <div className="flex border-b border-[#e8e8f0]">
          {(['resultats', 'classement'] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-4 text-label-lg capitalize transition-all ${
                tab === t ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
              }`}>
              {t === 'resultats' ? '⚽ Résultats' : '🏆 Classement'}
            </button>
          ))}
        </div>

        {/* Résultats */}
        {tab === 'resultats' && (
          <div className="divide-y divide-[#e8e8f0]">
            {catMatches.length === 0 && (
              <div className="py-12 text-center text-on-surface-variant">Aucun match pour cette catégorie</div>
            )}
            {catMatches.map(m => {
              const result = getResult(m)
              const isMCHHome = m.home.startsWith('MCH')
              const isFuture = m.statut === 'planifie'
              return (
                <div key={m.id}
                  className={`p-5 flex items-center justify-between flex-wrap gap-4 transition-colors ${
                    m.statut === 'termine' ? 'hover:bg-surface-container-low cursor-pointer' : 'opacity-70'
                  }`}
                  onClick={() => m.statut === 'termine' && navigate(`/resultats/${m.id}`)}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <span className="text-label-md text-on-surface-variant">{m.competition}</span>
                      <span className="text-on-surface-variant/40">•</span>
                      <span className="text-label-md text-on-surface-variant">
                        {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        m.lieu === 'domicile' ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                      }`}>
                        {m.lieu === 'domicile' ? '🏠 Dom.' : '✈️ Ext.'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className={`text-label-lg ${isMCHHome ? 'text-primary font-bold' : 'text-on-surface'}`}>{m.home}</span>
                      <div className={`flex items-center gap-2 px-4 py-2 rounded-xl ${isFuture ? 'bg-surface-container-low' : 'bg-[#f4f4f6]'}`}>
                        {isFuture ? (
                          <span className="text-label-lg text-on-surface-variant">à venir</span>
                        ) : (
                          <>
                            <span className="text-headline-md font-black text-on-surface">{m.scoreHome}</span>
                            <span className="text-on-surface-variant">—</span>
                            <span className="text-headline-md font-black text-on-surface">{m.scoreAway}</span>
                          </>
                        )}
                      </div>
                      <span className={`text-label-lg ${!isMCHHome ? 'text-primary font-bold' : 'text-on-surface'}`}>{m.away}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {result && (
                      <span className={`px-3 py-1.5 rounded-full text-label-md font-semibold ${statusStyle[result]}`}>{result}</span>
                    )}
                    {m.statut === 'termine' && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/resultats/${m.id}`) }}
                        className="flex items-center gap-1 text-primary text-label-md hover:underline"
                      >
                        Détails
                        <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                      </button>
                    )}
                    {isFuture && (
                      <button
                        onClick={e => { e.stopPropagation(); navigate(`/resultats/${m.id}/saisir`) }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-label-md hover:bg-primary/20 transition-colors"
                      >
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

        {/* Classement */}
        {tab === 'classement' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant w-10">#</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Équipe</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">J</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">G</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">N</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">P</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden md:table-cell">BP</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden md:table-cell">BC</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Forme</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {catStandings.map(s => (
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
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-0.5">
                        {s.form.map((f, i) => (
                          <span key={i} className={`w-5 h-5 rounded-full ${formColor[f]} text-white text-[9px] font-black flex items-center justify-center`}>{f}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`font-black text-headline-md ${s.current ? 'text-primary' : 'text-on-surface'}`}>{s.pts}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
