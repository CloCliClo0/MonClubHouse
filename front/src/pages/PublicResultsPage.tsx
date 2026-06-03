import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

type Match = {
  id: number
  adversaire: string
  date: string
  score_equipe: number | null
  score_adversaire: number | null
  statut: string
  domicile_exterieur: string
  championnat: string
  equipe?: { nom: string; categorie: string }
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
  current?: boolean
}

const statusStyle: Record<string, { bg: string; dot: string }> = {
  Victoire: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  Nul:      { bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  Défaite:  { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

function getResult(m: Match): string | null {
  if (m.score_equipe === null || m.statut !== 'termine') return null
  if (m.score_equipe > m.score_adversaire!) return 'Victoire'
  if (m.score_equipe < m.score_adversaire!) return 'Défaite'
  return 'Nul'
}

type Tab = 'resultats' | 'classement'

export default function PublicResultsPage() {
  const [tab, setTab]             = useState<Tab>('resultats')
  const [matches, setMatches]     = useState<Match[]>([])
  const [standings, setStandings] = useState<Standing[]>([])
  const [loading, setLoading]     = useState(true)
  const [clubName, setClubName]   = useState('MonClubHouse')

  useEffect(() => {
    const base = '/api'

    // Pas de token — appels publics (optionalAuth)
    Promise.all([
      fetch(`${base}/matchs`).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
      fetch(`${base}/resultats`).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]).then(([mRes, rRes]) => {
      const ms: Match[] = mRes.data || []
      const rs: Standing[] = rRes.data || []
      const played = ms.filter(m => m.statut === 'termine')
      setMatches(played)
      setStandings(rs)
      if (ms.length > 0 && ms[0].equipe?.nom) {
        const name = ms[0].equipe!.nom.replace(/(Seniors|U\d+|B|A).*/, '').trim()
        if (name) setClubName(name)
      }
    }).finally(() => setLoading(false))
  }, [])

  const wins   = matches.filter(m => getResult(m) === 'Victoire').length
  const draws  = matches.filter(m => getResult(m) === 'Nul').length
  const losses = matches.filter(m => getResult(m) === 'Défaite').length

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      {/* Header public */}
      <header className="bg-[#2b2d42] text-white sticky top-0 z-50">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-black text-sm">
              MCH
            </div>
            <div>
              <span className="font-bold text-base leading-none block">{clubName}</span>
              <span className="text-white/50 text-[11px] uppercase tracking-widest">Résultats publics</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login" className="px-4 py-2 text-white/70 hover:text-white text-label-lg transition-colors">
              Se connecter
            </Link>
            <Link to="/register" className="px-4 py-2 bg-primary rounded-lg text-white text-label-lg hover:bg-primary-container transition-colors">
              Rejoindre le club
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#2b2d42]">
        <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-14">
          <h1 className="text-display-lg text-white mb-2">Résultats & Classement</h1>
          <p className="text-white/60 text-body-lg">Performances de {clubName}</p>

          {!loading && matches.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-8 max-w-sm">
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-green-400">{wins}</p>
                <p className="text-white/60 text-label-md mt-0.5">Victoires</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-orange-300">{draws}</p>
                <p className="text-white/60 text-label-md mt-0.5">Nuls</p>
              </div>
              <div className="bg-white/10 rounded-xl p-4 text-center">
                <p className="text-2xl font-black text-red-400">{losses}</p>
                <p className="text-white/60 text-label-md mt-0.5">Défaites</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1100px] mx-auto px-6 -mt-6">
        <div className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-sm">
          <div className="flex items-center border-b border-[#e8e8f0] px-4">
            {(['resultats', 'classement'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-6 py-4 text-label-lg capitalize transition-all ${
                  tab === t ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
                }`}>
                {t === 'resultats' ? 'Résultats' : 'Classement'}
              </button>
            ))}
          </div>

          {loading && (
            <div className="p-8 space-y-3">
              {[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}
            </div>
          )}

          {!loading && tab === 'resultats' && (
            <div className="p-6">
              {matches.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">sports_soccer</span>
                  <p className="text-headline-md text-on-surface mb-1">Aucun résultat disponible</p>
                  <p className="text-body-md">Les résultats apparaîtront ici une fois les matchs joués.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {matches.map(m => {
                    const result = getResult(m)
                    const style = result ? statusStyle[result] : null
                    return (
                      <div key={m.id} className="border border-[#e8e8f0] rounded-xl p-4 flex items-center justify-between flex-wrap gap-4 hover:border-primary/30 transition-all">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sports_soccer</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-body-sm text-on-surface-variant">
                              {m.championnat || m.equipe?.categorie} • {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <div className="flex items-center gap-3 mt-1 flex-wrap">
                              <span className="text-label-lg text-primary font-bold">{m.equipe?.nom}</span>
                              <div className="flex items-center gap-2 bg-[#f4f4f6] px-3 py-1 rounded-lg shrink-0">
                                <span className="text-headline-md font-black text-on-surface">{m.score_equipe}</span>
                                <span className="text-on-surface-variant text-sm">—</span>
                                <span className="text-headline-md font-black text-on-surface">{m.score_adversaire}</span>
                              </div>
                              <span className="text-label-lg text-on-surface">{m.adversaire}</span>
                            </div>
                          </div>
                        </div>
                        {result && style && (
                          <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md shrink-0 ${style.bg}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                            {result}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {!loading && tab === 'classement' && (
            <div className="p-6">
              {standings.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">leaderboard</span>
                  <p className="text-headline-md text-on-surface mb-1">Classement indisponible</p>
                  <p className="text-body-md">Le classement se calcule à partir des résultats saisis.</p>
                </div>
              ) : (
                <div className="rounded-xl overflow-hidden border border-[#e8e8f0]">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-surface-container-low">
                        {['#','Équipe','J','G','N','P','BP','BC','Pts'].map(h => (
                          <th key={h} className={`px-4 py-3 text-label-md text-on-surface-variant ${h === 'Équipe' ? 'text-left' : 'text-center'} ${['BP','BC'].includes(h) ? 'hidden sm:table-cell' : ''}`}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#e8e8f0]">
                      {standings.map(s => (
                        <tr key={s.rank} className={`transition-colors ${s.current ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}>
                          <td className="px-4 py-3">
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-label-md font-bold ${s.rank === 1 ? 'bg-yellow-400 text-yellow-900' : s.rank <= 3 ? 'bg-primary/10 text-primary' : 'text-on-surface-variant'}`}>
                              {s.rank}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-label-lg ${s.current ? 'text-primary font-bold' : 'text-on-surface'}`}>{s.team}</span>
                            {s.current && <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">Nous</span>}
                          </td>
                          <td className="px-4 py-3 text-center text-body-md">{s.played}</td>
                          <td className="px-4 py-3 text-center text-body-md text-green-600">{s.won}</td>
                          <td className="px-4 py-3 text-center text-body-md text-orange-500">{s.drawn}</td>
                          <td className="px-4 py-3 text-center text-body-md text-error">{s.lost}</td>
                          <td className="px-4 py-3 text-center text-body-md hidden sm:table-cell">{s.gf}</td>
                          <td className="px-4 py-3 text-center text-body-md hidden sm:table-cell">{s.ga}</td>
                          <td className="px-4 py-3 text-center"><span className={`font-black text-headline-md ${s.current ? 'text-primary' : 'text-on-surface'}`}>{s.pts}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 mb-10 bg-white border border-[#e8e8f0] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-headline-md text-on-surface mb-1">Vous êtes membre du club ?</h3>
            <p className="text-body-md text-on-surface-variant">Connectez-vous pour accéder aux convocations, au chat, à la composition et plus.</p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link to="/login" className="px-5 py-2.5 border border-outline-variant rounded-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors">Se connecter</Link>
            <Link to="/register" className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container transition-colors">Créer un compte</Link>
          </div>
        </div>
      </div>
    </div>
  )
}
