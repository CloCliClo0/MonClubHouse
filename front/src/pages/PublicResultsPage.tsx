import { useState } from 'react'
import { Link } from 'react-router-dom'

const results = [
  { id: 1, home: 'MCH Seniors A', away: 'Red Star FC', scoreHome: 3, scoreAway: 1, date: '31 mai 2025', competition: 'Division 3', status: 'Victoire' },
  { id: 2, home: 'AJ Lyon', away: 'MCH Seniors A', scoreHome: 0, scoreAway: 2, date: '24 mai 2025', competition: 'Division 3', status: 'Victoire' },
  { id: 3, home: 'MCH Seniors A', away: 'FC Villeurbanne', scoreHome: 1, scoreAway: 1, date: '17 mai 2025', competition: 'Division 3', status: 'Nul' },
  { id: 4, home: 'Paris FC B', away: 'MCH Seniors A', scoreHome: 2, scoreAway: 0, date: '10 mai 2025', competition: 'Division 3', status: 'Défaite' },
  { id: 5, home: 'MCH Seniors A', away: 'Olympique Givors', scoreHome: 4, scoreAway: 0, date: '3 mai 2025', competition: 'Division 3', status: 'Victoire' },
  { id: 6, home: 'MCH U19', away: 'Red Star U19', scoreHome: 2, scoreAway: 2, date: '31 mai 2025', competition: 'U19 Régional', status: 'Nul' },
  { id: 7, home: 'FC Lyon U19', away: 'MCH U19', scoreHome: 1, scoreAway: 3, date: '24 mai 2025', competition: 'U19 Régional', status: 'Victoire' },
]

const standings = [
  { rank: 1, team: 'MCH Seniors A', played: 18, won: 13, drawn: 3, lost: 2, gf: 42, ga: 18, pts: 42, current: true },
  { rank: 2, team: 'Red Star FC', played: 18, won: 11, drawn: 4, lost: 3, gf: 35, ga: 22, pts: 37 },
  { rank: 3, team: 'AJ Lyon', played: 18, won: 10, drawn: 3, lost: 5, gf: 31, ga: 25, pts: 33 },
  { rank: 4, team: 'FC Villeurbanne', played: 18, won: 8, drawn: 5, lost: 5, gf: 28, ga: 24, pts: 29 },
  { rank: 5, team: 'Paris FC B', played: 18, won: 7, drawn: 4, lost: 7, gf: 24, ga: 29, pts: 25 },
  { rank: 6, team: 'Olympique Givors', played: 18, won: 5, drawn: 5, lost: 8, gf: 22, ga: 34, pts: 20 },
  { rank: 7, team: 'SC Bron', played: 18, won: 4, drawn: 3, lost: 11, gf: 18, ga: 38, pts: 15 },
  { rank: 8, team: 'ES Décines', played: 18, won: 2, drawn: 5, lost: 11, gf: 14, ga: 42, pts: 11 },
]

const statusStyle: Record<string, { bg: string; dot: string }> = {
  Victoire: { bg: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
  Nul: { bg: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
  Défaite: { bg: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
}

type Tab = 'resultats' | 'classement'

const teamFilters = ['Toutes les équipes', 'MCH Seniors A', 'MCH U19', 'MCH Féminines']

export default function PublicResultsPage() {
  const [tab, setTab] = useState<Tab>('resultats')
  const [teamFilter, setTeamFilter] = useState('Toutes les équipes')

  const filteredResults = results.filter(
    (r) =>
      teamFilter === 'Toutes les équipes' ||
      r.home.startsWith(teamFilter.split(' ').slice(0, 2).join(' ')) ||
      r.away.startsWith(teamFilter.split(' ').slice(0, 2).join(' '))
  )

  const wins = results.filter((r) => r.status === 'Victoire').length
  const draws = results.filter((r) => r.status === 'Nul').length
  const losses = results.filter((r) => r.status === 'Défaite').length

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
              <span className="font-bold text-base leading-none block">MonClubHouse FC</span>
              <span className="text-white/50 text-[11px] uppercase tracking-widest">Lyon • Division 3</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="px-4 py-2 text-white/70 hover:text-white text-label-lg transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="px-4 py-2 bg-primary rounded-lg text-white text-label-lg hover:bg-primary-container transition-colors"
            >
              Rejoindre le club
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <div className="bg-[#2b2d42]">
        <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-14">
          <h1 className="text-display-lg text-white mb-2">Résultats & Classement</h1>
          <p className="text-white/60 text-body-lg">
            Suivez les performances de MonClubHouse FC en temps réel
          </p>

          {/* Quick stats */}
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
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-[1100px] mx-auto px-6 -mt-6">
        <div className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-sm">
          {/* Tabs */}
          <div className="flex items-center border-b border-[#e8e8f0] px-4">
            {(['resultats', 'classement'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-6 py-4 text-label-lg capitalize transition-all ${
                  tab === t
                    ? 'text-primary border-b-2 border-primary'
                    : 'text-on-surface-variant hover:text-primary'
                }`}
              >
                {t === 'resultats' ? 'Résultats' : 'Classement'}
              </button>
            ))}
          </div>

          {/* Results tab */}
          {tab === 'resultats' && (
            <div className="p-6">
              {/* Team filter */}
              <div className="flex gap-2 flex-wrap mb-6">
                {teamFilters.map((f) => (
                  <button
                    key={f}
                    onClick={() => setTeamFilter(f)}
                    className={`px-4 py-1.5 rounded-full text-label-md transition-all ${
                      teamFilter === f
                        ? 'bg-primary text-white'
                        : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              <div className="space-y-3">
                {filteredResults.map((r) => {
                  const isMCH = r.home.startsWith('MCH') || r.away.startsWith('MCH')
                  const isHome = r.home.startsWith('MCH')
                  const style = statusStyle[r.status] ?? { bg: 'bg-slate-100 text-slate-600', dot: 'bg-slate-400' }

                  return (
                    <div
                      key={r.id}
                      className="border border-[#e8e8f0] rounded-xl p-4 flex items-center justify-between flex-wrap gap-4 hover:border-primary/30 hover:bg-primary/[0.02] transition-all group"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                          <span className="material-symbols-outlined text-on-surface-variant text-[20px]">sports_soccer</span>
                        </div>
                        <div className="min-w-0">
                          <p className="text-body-sm text-on-surface-variant">
                            {r.competition} • {r.date}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`text-label-lg ${r.home.startsWith('MCH') ? 'text-primary font-bold' : 'text-on-surface'}`}>
                              {r.home}
                            </span>
                            <div className="flex items-center gap-2 bg-[#f4f4f6] px-3 py-1 rounded-lg shrink-0">
                              <span className="text-headline-md font-black text-on-surface">{r.scoreHome}</span>
                              <span className="text-on-surface-variant text-sm">—</span>
                              <span className="text-headline-md font-black text-on-surface">{r.scoreAway}</span>
                            </div>
                            <span className={`text-label-lg ${r.away.startsWith('MCH') ? 'text-primary font-bold' : 'text-on-surface'}`}>
                              {r.away}
                            </span>
                          </div>
                        </div>
                      </div>
                      {isMCH && (
                        <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-label-md shrink-0 ${style.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                          {r.status}
                        </span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Standings tab */}
          {tab === 'classement' && (
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4 text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-yellow-400 inline-block" />
                  Leader
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-primary inline-block" />
                  MonClubHouse FC
                </span>
              </div>

              <div className="rounded-xl overflow-hidden border border-[#e8e8f0]">
                <table className="w-full">
                  <thead>
                    <tr className="bg-surface-container-low">
                      <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">#</th>
                      <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Équipe</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">J</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">G</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">N</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">P</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden sm:table-cell">BP</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden sm:table-cell">BC</th>
                      <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Pts</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8f0]">
                    {standings.map((s) => (
                      <tr
                        key={s.rank}
                        className={`transition-colors ${s.current ? 'bg-primary/5' : 'hover:bg-surface-container-low'}`}
                      >
                        <td className="px-4 py-3">
                          <div
                            className={`w-7 h-7 rounded-full flex items-center justify-center text-label-md font-bold ${
                              s.rank === 1
                                ? 'bg-yellow-400 text-yellow-900'
                                : s.rank <= 3
                                ? 'bg-primary/10 text-primary'
                                : 'text-on-surface-variant'
                            }`}
                          >
                            {s.rank}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-label-lg ${s.current ? 'text-primary font-bold' : 'text-on-surface'}`}>
                            {s.team}
                          </span>
                          {s.current && (
                            <span className="ml-2 text-[10px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">
                              Nous
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center text-body-md text-on-surface">{s.played}</td>
                        <td className="px-4 py-3 text-center text-body-md text-green-600">{s.won}</td>
                        <td className="px-4 py-3 text-center text-body-md text-orange-500">{s.drawn}</td>
                        <td className="px-4 py-3 text-center text-body-md text-error">{s.lost}</td>
                        <td className="px-4 py-3 text-center text-body-md text-on-surface hidden sm:table-cell">{s.gf}</td>
                        <td className="px-4 py-3 text-center text-body-md text-on-surface hidden sm:table-cell">{s.ga}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`font-black text-headline-md ${s.current ? 'text-primary' : 'text-on-surface'}`}>
                            {s.pts}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* CTA rejoindre */}
        <div className="mt-8 mb-10 bg-white border border-[#e8e8f0] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-headline-md text-on-surface mb-1">Vous êtes membre du club ?</h3>
            <p className="text-body-md text-on-surface-variant">
              Connectez-vous pour accéder aux convocations, au chat, à la composition et à plus de données.
            </p>
          </div>
          <div className="flex gap-3 shrink-0">
            <Link
              to="/login"
              className="px-5 py-2.5 border border-outline-variant rounded-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors"
            >
              Se connecter
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container transition-colors"
            >
              Créer un compte
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
