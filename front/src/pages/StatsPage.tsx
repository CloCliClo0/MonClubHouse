import { useEffect, useState } from 'react'
import api from '../services/api'

type Scorer = { id: number; nom: string; prenom: string; equipe: string; buts: number; assists: number; matchs: number }
type TeamStat = { equipe: string; matchs: number; victoires: number; nuls: number; defaites: number; bp: number; bc: number }

export default function StatsPage() {
  const [scorers, setScorers]     = useState<Scorer[]>([])
  const [teamStats, setTeamStats] = useState<TeamStat[]>([])
  const [loading, setLoading]     = useState(true)
  const [view, setView]           = useState<'buteurs' | 'passes' | 'equipes'>('buteurs')

  useEffect(() => {
    Promise.all([
      api.get('/resultats/stats/buteurs').catch(() => ({ data: { data: [] } })),
      api.get('/resultats/stats/equipes').catch(() => ({ data: { data: [] } })),
    ]).then(([sRes, tRes]) => {
      setScorers(sRes.data.data || [])
      setTeamStats(tRes.data.data || [])
    }).finally(() => setLoading(false))
  }, [])

  const assists = [...scorers].sort((a, b) => b.assists - a.assists)

  function Empty({ icon, text }: { icon: string; text: string }) {
    return (
      <div className="py-20 text-center">
        <span className={`material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4`}>{icon}</span>
        <p className="text-headline-md text-on-surface mb-2">{text}</p>
        <p className="text-body-md text-on-surface-variant">Les statistiques se calculent automatiquement à partir des résultats saisis.</p>
      </div>
    )
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
          Saison en cours
        </div>
      </div>

      {/* Chiffres clés */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { v: teamStats.reduce((s, t) => s + t.matchs, 0),    l: 'Matchs joués',  icon: 'sports_soccer', c: 'text-primary',    bg: 'bg-primary/10'  },
          { v: teamStats.reduce((s, t) => s + t.bp, 0),        l: 'Buts marqués',  icon: 'local_fire_department', c: 'text-orange-600', bg: 'bg-orange-50' },
          { v: scorers.reduce((s, p) => s + p.buts, 0),        l: 'Total buts',    icon: 'emoji_events',  c: 'text-green-600',  bg: 'bg-green-50'    },
          { v: teamStats.length,                                l: 'Équipes suivies',icon: 'groups',        c: 'text-blue-600',   bg: 'bg-blue-50'     },
        ].map(s => (
          <div key={s.l} className="bg-white border border-[#e8e8f0] rounded-xl p-4 flex items-center gap-3">
            <div className={`${s.bg} p-2.5 rounded-xl shrink-0`}>
              <span className={`material-symbols-outlined ${s.c}`}>{s.icon}</span>
            </div>
            <div>
              {loading ? (
                <div className="w-10 h-6 bg-surface-container-low rounded animate-pulse mb-1" />
              ) : (
                <p className={`text-headline-md font-black ${s.c}`}>{s.v}</p>
              )}
              <p className="text-label-md text-on-surface-variant">{s.l}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Switcher */}
      <div className="flex gap-1 bg-surface-container-low rounded-lg p-1 mb-5 w-fit">
        {(['buteurs', 'passes', 'equipes'] as const).map(v => (
          <button key={v} onClick={() => setView(v)}
            className={`px-4 py-2 rounded-md text-label-md transition-all ${
              view === v ? 'bg-white text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            {v === 'buteurs' ? '⚽ Buteurs' : v === 'passes' ? '🎯 Passeurs' : '📊 Équipes'}
          </button>
        ))}
      </div>

      {/* Buteurs */}
      {view === 'buteurs' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0]"><h4 className="text-headline-md">Classement des buteurs</h4></div>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-surface-container-low rounded animate-pulse" />)}</div>
          ) : scorers.length === 0 ? (
            <Empty icon="sports_soccer" text="Aucun buteur enregistré" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">#</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Joueur</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Équipe</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Matchs</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Passes D.</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Buts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {scorers.map((p, i) => (
                  <tr key={p.id} className={`hover:bg-surface-container-low transition-colors ${i === 0 ? 'bg-yellow-50/60' : ''}`}>
                    <td className="px-4 py-3">
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-label-md font-bold ${
                        i === 0 ? 'bg-yellow-400 text-yellow-900' : i === 1 ? 'bg-slate-300 text-slate-800' : i === 2 ? 'bg-amber-600 text-white' : 'text-on-surface-variant'
                      }`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {p.prenom?.[0]}{p.nom?.[0]}
                        </div>
                        <span className="text-label-lg text-on-surface">{p.prenom} {p.nom}</span>
                        {i === 0 && <span className="text-lg">🏆</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{p.equipe}</span>
                    </td>
                    <td className="px-4 py-3 text-center text-body-md text-on-surface-variant">{p.matchs}</td>
                    <td className="px-4 py-3 text-center"><span className="text-label-lg text-primary font-semibold">{p.assists}</span></td>
                    <td className="px-4 py-3 text-center"><span className="text-headline-md font-black text-on-surface">{p.buts}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Passeurs */}
      {view === 'passes' && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0]"><h4 className="text-headline-md">Classement des passeurs décisifs</h4></div>
          {loading ? (
            <div className="p-4 space-y-2">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded animate-pulse" />)}</div>
          ) : assists.length === 0 ? (
            <Empty icon="sports_soccer" text="Aucune passe décisive enregistrée" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-surface-container-low border-b border-[#e8e8f0]">
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">#</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant">Joueur</th>
                  <th className="px-4 py-3 text-left text-label-md text-on-surface-variant hidden md:table-cell">Équipe</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant">Buts</th>
                  <th className="px-4 py-3 text-center text-label-md text-on-surface-variant font-black">Passes D.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {assists.map((p, i) => (
                  <tr key={p.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-4 py-3">
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center text-label-md font-bold ${i === 0 ? 'bg-yellow-400 text-yellow-900' : 'text-on-surface-variant'}`}>{i + 1}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-primary-container text-white font-bold text-sm flex items-center justify-center shrink-0">
                          {p.prenom?.[0]}{p.nom?.[0]}
                        </div>
                        <span className="text-label-lg text-on-surface">{p.prenom} {p.nom}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell"><span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{p.equipe}</span></td>
                    <td className="px-4 py-3 text-center text-body-md text-on-surface-variant">{p.buts}</td>
                    <td className="px-4 py-3 text-center"><span className="text-headline-md font-black text-primary">{p.assists}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Équipes */}
      {view === 'equipes' && (
        <div className="space-y-4">
          {loading ? (
            [1,2,3].map(i => <div key={i} className="h-32 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />)
          ) : teamStats.length === 0 ? (
            <div className="bg-white border border-[#e8e8f0] rounded-xl">
              <Empty icon="groups" text="Aucune statistique d'équipe" />
            </div>
          ) : (
            teamStats.map(t => {
              const pct = t.matchs ? Math.round((t.victoires / t.matchs) * 100) : 0
              return (
                <div key={t.equipe} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-headline-md text-on-surface">{t.equipe}</h4>
                    <span className={`text-label-lg font-bold ${pct >= 60 ? 'text-green-600' : pct >= 40 ? 'text-orange-500' : 'text-error'}`}>
                      {pct}% victoires
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3 mb-4">
                    {[
                      { v: t.matchs,    l: 'Matchs',  c: 'text-on-surface'  },
                      { v: t.victoires, l: 'Victoires',c: 'text-green-600'  },
                      { v: t.bp,        l: 'Buts',    c: 'text-primary'     },
                      { v: t.bc,        l: 'Encaissés',c: 'text-error'      },
                    ].map(s => (
                      <div key={s.l} className="bg-surface-container-low rounded-lg p-3 text-center">
                        <p className={`text-headline-md font-black ${s.c}`}>{s.v}</p>
                        <p className="text-label-md text-on-surface-variant">{s.l}</p>
                      </div>
                    ))}
                  </div>
                  <div className="flex h-3 rounded-full overflow-hidden gap-0.5">
                    <div className="bg-green-500" style={{ width: `${t.matchs ? (t.victoires / t.matchs) * 100 : 0}%` }} />
                    <div className="bg-orange-400" style={{ width: `${t.matchs ? (t.nuls / t.matchs) * 100 : 0}%` }} />
                    <div className="bg-red-500 flex-1" />
                  </div>
                  <div className="flex gap-4 mt-2 text-body-sm">
                    <span className="text-green-600 font-semibold">{t.victoires}V</span>
                    <span className="text-orange-500 font-semibold">{t.nuls}N</span>
                    <span className="text-error font-semibold">{t.defaites}D</span>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
