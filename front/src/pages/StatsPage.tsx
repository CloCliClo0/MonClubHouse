import { useState } from 'react'

type Category = 'Tous' | 'Seniors A' | 'Seniors B' | 'U19' | 'U15' | 'Féminines A'

const CATEGORIES: Category[] = ['Tous', 'Seniors A', 'Seniors B', 'U19', 'U15', 'Féminines A']

const TOP_SCORERS = [
  { id: 1,  name: 'Lucas Bertin',    equipe: 'Seniors A',   number: 9,  buts: 18, assists: 7,  matchs: 22, minutesJouees: 1860 },
  { id: 2,  name: 'Nicolas Perrin',  equipe: 'Seniors A',   number: 11, buts: 12, assists: 5,  matchs: 20, minutesJouees: 1620 },
  { id: 3,  name: 'Franck Morel',    equipe: 'Seniors B',   number: 2,  buts: 10, assists: 3,  matchs: 18, minutesJouees: 1440 },
  { id: 4,  name: 'Kevin Arnaud',    equipe: 'U19',         number: 7,  buts: 9,  assists: 4,  matchs: 16, minutesJouees: 1350 },
  { id: 5,  name: 'Théo Blanchard',  equipe: 'Seniors A',   number: 10, buts: 7,  assists: 11, matchs: 22, minutesJouees: 1800 },
  { id: 6,  name: 'Cédric Lefebvre', equipe: 'Seniors A',   number: 8,  buts: 5,  assists: 9,  matchs: 21, minutesJouees: 1720 },
  { id: 7,  name: 'Tom Renard',      equipe: 'Féminines A', number: 10, buts: 14, assists: 6,  matchs: 15, minutesJouees: 1200 },
  { id: 8,  name: 'Lucie Bernard',   equipe: 'Féminines A', number: 9,  buts: 11, assists: 4,  matchs: 14, minutesJouees: 1100 },
]

const TEAM_STATS = [
  { equipe: 'Seniors A',   matchs: 22, victoires: 15, nuls: 4, defaites: 3, bp: 52, bc: 22, cleanSheets: 8, note: 7.2 },
  { equipe: 'Seniors B',   matchs: 18, victoires: 10, nuls: 4, defaites: 4, bp: 35, bc: 28, cleanSheets: 5, note: 6.8 },
  { equipe: 'U19',         matchs: 16, victoires: 11, nuls: 2, defaites: 3, bp: 42, bc: 18, cleanSheets: 6, note: 7.0 },
  { equipe: 'U15',         matchs: 14, victoires: 10, nuls: 1, defaites: 3, bp: 38, bc: 14, cleanSheets: 7, note: 7.4 },
  { equipe: 'Féminines A', matchs: 15, victoires: 9,  nuls: 3, defaites: 3, bp: 32, bc: 16, cleanSheets: 5, note: 6.9 },
]

const TOP_ASSISTS = TOP_SCORERS.slice().sort((a, b) => b.assists - a.assists)

const MONTHLY_GOALS = [
  { month: 'Jan', buts: 12 },
  { month: 'Fév', buts: 18 },
  { month: 'Mar', buts: 15 },
  { month: 'Avr', buts: 22 },
  { month: 'Mai', buts: 28 },
  { month: 'Juin', buts: 8 },
]

const maxGoals = Math.max(...MONTHLY_GOALS.map(m => m.buts))

export default function StatsPage() {
  const [cat, setCat]         = useState<Category>('Tous')
  const [statView, setStatView] = useState<'buteurs' | 'passes' | 'equipes'>('buteurs')

  const filteredScorers = TOP_SCORERS.filter(p => cat === 'Tous' || p.equipe === cat)
    .sort((a, b) => b.buts - a.buts)

  const filteredAssists = TOP_ASSISTS.filter(p => cat === 'Tous' || p.equipe === cat)
    .sort((a, b) => b.assists - a.assists)

  const filteredTeams = TEAM_STATS.filter(t => cat === 'Tous' || t.equipe === cat)

  const globalStats = {
    totalButs: TEAM_STATS.reduce((s, t) => s + t.bp, 0),
    totalMatchs: TEAM_STATS.reduce((s, t) => s + t.matchs, 0),
    avgVictoires: Math.round((TEAM_STATS.reduce((s, t) => s + t.victoires, 0) / TEAM_STATS.reduce((s, t) => s + t.matchs, 0)) * 100),
    cleanSheets: TEAM_STATS.reduce((s, t) => s + t.cleanSheets, 0),
    notesMoyenne: (TEAM_STATS.reduce((s, t) => s + t.note, 0) / TEAM_STATS.length).toFixed(1),
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Statistiques</h2>
          <p className="text-body-md text-on-surface-variant">Performances et analyses de toutes les équipes</p>
        </div>
        <div className="flex items-center gap-2 text-body-sm text-on-surface-variant bg-white border border-[#e8e8f0] px-4 py-2 rounded-lg">
          <span className="material-symbols-outlined text-[16px]">update</span>
          Saison 2024/2025
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        {[
          { v: globalStats.totalMatchs, l: 'Matchs joués',  icon: 'sports_soccer', c: 'text-primary',     bg: 'bg-primary/10'   },
          { v: globalStats.totalButs,   l: 'Buts marqués',  icon: 'local_fire_department', c: 'text-orange-600', bg: 'bg-orange-50' },
          { v: `${globalStats.avgVictoires}%`, l: 'Taux de victoire', icon: 'emoji_events', c: 'text-green-600', bg: 'bg-green-50' },
          { v: globalStats.cleanSheets, l: 'Clean sheets',  icon: 'shield',        c: 'text-blue-600',    bg: 'bg-blue-50'      },
          { v: globalStats.notesMoyenne,l: 'Note moyenne',  icon: 'star',          c: 'text-yellow-600',  bg: 'bg-yellow-50'    },
        ].map(s => (
          <div key={s.l} className="bg-white border border-[#e8e8f0] rounded-xl p-4 flex items-center gap-3">
            <div className={`${s.bg} p-2.5 rounded-xl shrink-0`}>
              <span className={`material-symbols-outlined ${s.c}`}>{s.icon}</span>
            </div>
            <div>
              <p className={`text-headline-md font-black ${s.c}`}>{s.v}</p>
              <p className="text-label-md text-on-surface-variant">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Graphique buts / mois */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-6 mb-6">
        <h4 className="text-headline-md mb-5">Buts marqués par mois (toutes équipes)</h4>
        <div className="h-44 flex items-end gap-3 px-2">
          {MONTHLY_GOALS.map(m => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
              <span className="text-label-md text-primary font-bold">{m.buts}</span>
              <div className="w-full relative group">
                <div className="w-full bg-primary rounded-t-lg transition-all hover:opacity-80 cursor-default"
                  style={{ height: `${(m.buts / maxGoals) * 140}px` }} />
              </div>
              <span className="text-label-md text-on-surface-variant">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3 mb-5 items-center justify-between">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map(c => (
            <button key={c} onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-full text-label-md transition-all ${
                cat === c ? 'bg-primary text-white' : 'bg-white border border-[#e8e8f0] text-on-surface-variant hover:border-primary/40'
              }`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-1 bg-surface-container-low rounded-lg p-1">
          {(['buteurs', 'passes', 'equipes'] as const).map(v => (
            <button key={v} onClick={() => setStatView(v)}
              className={`px-3 py-1.5 rounded-md text-label-md capitalize transition-all ${
                statView === v ? 'bg-white text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
              }`}>
              {v === 'buteurs' ? '⚽ Buteurs' : v === 'passes' ? '🎯 Passeurs' : '📊 Équipes'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Classement buteurs ──────────────────────────────────────── */}
      {statView === 'buteurs' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0]">
            <h4 className="text-headline-md">Classement des buteurs</h4>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">#</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Joueur</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Équipe</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Matchs</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Passes D.</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Buts</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden md:table-cell">Moy./match</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8f0]">
              {filteredScorers.map((p, i) => (
                <tr key={p.id} className={`transition-colors hover:bg-surface-container-low ${i === 0 ? 'bg-yellow-50/60' : ''}`}>
                  <td className="px-4 py-3">
                    <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-label-md font-bold ${
                      i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-amber-600 text-white' : 'text-on-surface-variant'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-white font-bold text-sm flex items-center justify-center shrink-0">
                        #{p.number}
                      </div>
                      <div>
                        <p className="text-label-lg text-on-surface">{p.name}</p>
                        <p className="text-body-sm text-on-surface-variant md:hidden">{p.equipe}</p>
                      </div>
                      {i === 0 && <span className="text-lg">🏆</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{p.equipe}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-body-md text-on-surface-variant">{p.matchs}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-label-lg text-primary font-semibold">{p.assists}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-headline-md font-black text-on-surface">{p.buts}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-body-md text-on-surface-variant">
                      {(p.buts / p.matchs).toFixed(2)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Passeurs ───────────────────────────────────────────────── */}
      {statView === 'passes' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0]">
            <h4 className="text-headline-md">Classement des passeurs décisifs</h4>
          </div>
          <table className="w-full">
            <thead>
              <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">#</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Joueur</th>
                <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Équipe</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Buts</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Passes D.</th>
                <th className="px-4 py-3 text-center text-label-md text-on-surface-variant hidden md:table-cell">Contrib. totale</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8e8f0]">
              {filteredAssists.map((p, i) => (
                <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                  <td className="px-4 py-3">
                    <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-label-md font-bold ${
                      i === 0 ? 'bg-yellow-400 text-yellow-900' : 'text-on-surface-variant'
                    }`}>{i + 1}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-white font-bold text-sm flex items-center justify-center shrink-0">
                        #{p.number}
                      </div>
                      <span className="text-label-lg text-on-surface">{p.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{p.equipe}</span>
                  </td>
                  <td className="px-4 py-3 text-center text-body-md text-on-surface-variant">{p.buts}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-headline-md font-black text-primary">{p.assists}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden md:table-cell">
                    <span className="text-label-lg text-on-surface font-semibold">{p.buts + p.assists}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Statistiques équipes ───────────────────────────────────── */}
      {statView === 'equipes' && (
        <div className="space-y-4">
          {filteredTeams.map(t => {
            const pct = Math.round((t.victoires / t.matchs) * 100)
            return (
              <div key={t.equipe} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-headline-md text-on-surface">{t.equipe}</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-body-sm text-on-surface-variant">Taux de victoire</span>
                    <span className={`text-label-lg font-bold ${pct >= 60 ? 'text-green-600' : pct >= 40 ? 'text-orange-500' : 'text-error'}`}>
                      {pct}%
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {[
                    { v: t.matchs,   l: 'Matchs',     c: 'text-on-surface' },
                    { v: t.victoires,l: 'Victoires',   c: 'text-green-600'  },
                    { v: t.bp,       l: 'Buts marqués',c: 'text-primary'   },
                    { v: t.cleanSheets, l: 'Clean sheets', c: 'text-blue-600' },
                  ].map(s => (
                    <div key={s.l} className="bg-surface-container-low rounded-lg p-3 text-center">
                      <p className={`text-headline-md font-black ${s.c}`}>{s.v}</p>
                      <p className="text-label-md text-on-surface-variant">{s.l}</p>
                    </div>
                  ))}
                </div>

                {/* Barre bilan */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-label-md text-on-surface-variant">
                    <span className="text-green-600 font-semibold">{t.victoires}V</span>
                    <span className="text-orange-500 font-semibold">{t.nuls}N</span>
                    <span className="text-error font-semibold">{t.defaites}D</span>
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-green-500 rounded-full" style={{ width: `${(t.victoires / t.matchs) * 100}%` }} />
                    <div className="bg-orange-400 rounded-full" style={{ width: `${(t.nuls / t.matchs) * 100}%` }} />
                    <div className="bg-red-500 rounded-full flex-1" />
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-body-sm text-on-surface-variant border-t border-[#e8e8f0] pt-3">
                  <span>Buts concédés : <strong className="text-on-surface">{t.bc}</strong></span>
                  <span>Moy. buts / match : <strong className="text-on-surface">{(t.bp / t.matchs).toFixed(1)}</strong></span>
                  <span>Note moy. joueurs : <strong className="text-yellow-600">{t.note}/10</strong></span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
