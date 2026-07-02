import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface ArbitrageUser {
  id: number
  nom: string
  prenom: string
  avatar?: string
  telephone?: string
}

interface ArbitrageInscription {
  id: number
  user_id: number
  match_id: number | null
  date: string
  commentaire?: string
  user?: ArbitrageUser
}

interface ArbitrageMatch {
  id: number
  date: string
  adversaire?: string
  type: string
  domicile_exterieur?: string
  equipe: { id: number; nom: string }
  arbitrage_presences: ArbitrageInscription[]
}

interface StatEntry { count: number; dates: string[]; user?: ArbitrageUser }

const formatDate = (d: string) =>
  new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

function calcAge(dateNaissance: string | null | undefined): number | null {
  if (!dateNaissance) return null
  const dob = new Date(dateNaissance)
  const today = new Date()
  let age = today.getFullYear() - dob.getFullYear()
  const m = today.getMonth() - dob.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--
  return age
}

export default function ArbitragePage() {
  const { user } = useAuth()
  const role = user?.role || 'joueur'
  const isManager = ['admin', 'superadmin', 'dirigeant', 'coach'].includes(role)
  const isAdmin   = ['admin', 'superadmin', 'dirigeant'].includes(role)
  const isCoach   = role === 'coach'

  // Vérification majorité pour joueurs
  const age = calcAge(user?.date_naissance)
  const isMajeur = age !== null && age >= 18

  type Tab = 'inscrire' | 'planning' | 'stats'
  const defaultTab: Tab = isManager ? 'planning' : (isMajeur ? 'inscrire' : 'planning')
  const [tab, setTab] = useState<Tab>(defaultTab)

  const [matchs, setMatchs]             = useState<ArbitrageMatch[]>([])
  const [mesPresences, setMesPresences] = useState<ArbitrageInscription[]>([])
  const [stats, setStats]               = useState<StatEntry[]>([])
  const [loading, setLoading]           = useState(true)
  const [selectedMatch, setSelectedMatch] = useState<ArbitrageMatch | null>(null)
  const [commentaire, setCommentaire]   = useState('')
  const [saving, setSaving]             = useState(false)
  const [error, setError]               = useState('')

  useEffect(() => { loadAll() }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [matchsR, mesR] = await Promise.all([
        api.get('/arbitrage/matchs-besoin-arbitre'),
        api.get('/arbitrage/mes-presences'),
      ])
      setMatchs(matchsR.data.data || [])
      setMesPresences(mesR.data.data || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const r = await api.get('/arbitrage/stats')
      setStats(r.data.data || [])
    } catch { /* ignore */ }
  }

  useEffect(() => {
    if (tab === 'stats') loadStats()
  }, [tab])

  const sInscrire = async () => {
    if (!selectedMatch) return
    setSaving(true); setError('')
    try {
      const matchDate = selectedMatch.date.slice(0, 10)
      await api.post('/arbitrage/presences', {
        match_id: selectedMatch.id,
        date: matchDate,
        commentaire: commentaire || undefined,
      })
      setCommentaire('')
      setSelectedMatch(null)
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally { setSaving(false) }
  }

  const seDesinscrire = async (id: number) => {
    try {
      await api.delete(`/arbitrage/presences/${id}`)
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur')
    }
  }

  const isInscritMatch = (matchId: number) =>
    mesPresences.some(p => p.match_id === matchId)

  const tabs: { key: Tab; label: string; icon: string }[] = [
    ...((!isManager && isMajeur) ? [{ key: 'inscrire' as Tab, label: 'M\'inscrire', icon: 'edit_calendar' }] : []),
    { key: 'planning', label: isManager ? 'Organisation' : 'Planning', icon: 'calendar_view_week' },
    ...(isAdmin ? [{ key: 'stats' as Tab, label: 'Statistiques', icon: 'bar_chart' }] : []),
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-display-lg text-on-surface">Arbitrage</h2>
          <p className="text-body-lg text-on-surface-variant mt-1">
            {isManager
              ? 'Organisation et suivi des arbitres du club'
              : 'Inscrivez-vous pour arbitrer les matchs du club'}
          </p>
        </div>
        {!isManager && isMajeur && mesPresences.length > 0 && (
          <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-green-50 border border-green-200 rounded-xl">
            <span className="material-symbols-outlined text-green-600 text-[20px]">check_circle</span>
            <span className="text-label-md text-green-700">{mesPresences.length} inscription{mesPresences.length > 1 ? 's' : ''}</span>
          </div>
        )}
      </div>

      {/* Avertissement non-majeur */}
      {!isManager && !isMajeur && (
        <div className="flex items-center gap-3 px-5 py-4 bg-amber-50 border border-amber-200 rounded-xl">
          <span className="material-symbols-outlined text-amber-600 text-[22px]">info</span>
          <div>
            <p className="text-label-lg text-amber-800">Inscription réservée aux majeurs</p>
            <p className="text-body-sm text-amber-700">
              {age === null
                ? 'Votre date de naissance n\'est pas renseignée. Complétez votre profil pour accéder à l\'arbitrage.'
                : 'Vous devez avoir 18 ans révolus pour vous inscrire comme arbitre.'}
            </p>
          </div>
        </div>
      )}

      {/* Onglets */}
      {tabs.length > 1 && (
        <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-label-md transition-all whitespace-nowrap ${
                tab === t.key
                  ? 'bg-white text-on-surface shadow-sm font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}>
              <span className="material-symbols-outlined text-[16px]">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />)}
        </div>
      ) : (
        <>
          {/* ── Tab : M'inscrire ─────────────────────────────────────────────── */}
          {tab === 'inscrire' && isMajeur && (
            <div className="space-y-5">
              {/* Mes inscriptions actuelles */}
              {mesPresences.length > 0 && (
                <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                  <div className="px-5 py-4 border-b border-[#e8e8f0]">
                    <h3 className="text-headline-md">Mes inscriptions</h3>
                  </div>
                  <div className="divide-y divide-[#e8e8f0]">
                    {mesPresences.map(p => {
                      const m = matchs.find(mx => mx.id === p.match_id)
                      return (
                        <div key={p.id} className="flex items-center justify-between px-5 py-4 gap-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                              <span className="material-symbols-outlined text-green-600 text-[20px]">sports</span>
                            </div>
                            <div>
                              <p className="text-label-lg text-on-surface capitalize">{formatDate(p.date)}</p>
                              {m && <p className="text-body-sm text-on-surface-variant">{m.equipe?.nom} vs {m.adversaire || '—'}</p>}
                              {p.commentaire && <p className="text-body-sm text-on-surface-variant">{p.commentaire}</p>}
                            </div>
                          </div>
                          <button onClick={() => seDesinscrire(p.id)}
                            className="flex items-center gap-1.5 px-3 py-1.5 border border-error/30 text-error rounded-lg text-label-md hover:bg-red-50 transition-colors">
                            <span className="material-symbols-outlined text-[16px]">cancel</span>
                            Se désinscrire
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Matchs disponibles */}
              <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8e8f0]">
                  <h3 className="text-headline-md">Matchs nécessitant un arbitre</h3>
                  <p className="text-body-sm text-on-surface-variant">Maximum 2 arbitres par match</p>
                </div>
                {matchs.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">sports</span>
                    <p className="text-body-md">Aucun match ne nécessite d'arbitre pour le moment</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8f0]">
                    {matchs.map(m => {
                      const count    = m.arbitrage_presences?.length ?? 0
                      const inscrit  = isInscritMatch(m.id)
                      const complet  = count >= 2 && !inscrit
                      return (
                        <button key={m.id} disabled={complet}
                          onClick={() => !inscrit && !complet && setSelectedMatch(selectedMatch?.id === m.id ? null : m)}
                          className={`w-full flex items-center justify-between px-5 py-4 text-left transition-colors ${
                            inscrit    ? 'bg-green-50/60'
                            : selectedMatch?.id === m.id ? 'bg-primary/5'
                            : complet  ? 'opacity-50 cursor-not-allowed bg-surface-container-lowest'
                            : 'hover:bg-surface-container-low/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                              inscrit ? 'bg-green-100' : complet ? 'bg-surface-container' : 'bg-primary/10'
                            }`}>
                              <span className={`material-symbols-outlined text-[20px] ${
                                inscrit ? 'text-green-600' : complet ? 'text-on-surface-variant' : 'text-primary'
                              }`}>
                                {inscrit ? 'check_circle' : complet ? 'block' : 'sports_soccer'}
                              </span>
                            </div>
                            <div className="text-left">
                              <p className="text-label-lg text-on-surface capitalize">{formatDate(m.date.slice(0, 10))}</p>
                              <p className="text-body-sm text-on-surface-variant">
                                {m.equipe?.nom} vs {m.adversaire || '—'} · {m.domicile_exterieur === 'domicile' ? '🏠 Dom.' : '✈️ Ext.'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {Array.from({ length: 2 }).map((_, i) => (
                              <div key={i} className={`w-3 h-3 rounded-full ${i < count ? 'bg-primary' : 'bg-surface-container'}`} />
                            ))}
                            <span className="ml-1 text-body-sm text-on-surface-variant">{count}/2</span>
                            {inscrit && <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-label-sm">Inscrit</span>}
                            {complet && <span className="ml-2 px-2 py-0.5 bg-surface-container text-on-surface-variant rounded-full text-label-sm">Complet</span>}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Formulaire inscription */}
              {selectedMatch && !isInscritMatch(selectedMatch.id) && (
                <div className="bg-white border-2 border-primary/30 rounded-xl p-5 space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary text-[20px]">edit_calendar</span>
                    </div>
                    <div>
                      <p className="text-label-lg text-on-surface">Confirmer l'inscription</p>
                      <p className="text-body-sm text-on-surface-variant capitalize">{formatDate(selectedMatch.date.slice(0, 10))} — {selectedMatch.equipe?.nom} vs {selectedMatch.adversaire || '—'}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Commentaire (optionnel)</label>
                    <textarea value={commentaire} onChange={e => setCommentaire(e.target.value)} rows={2} placeholder="Disponibilité, remarques…"
                      className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                  </div>
                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-700">
                      <span className="material-symbols-outlined text-[16px]">error</span>
                      {error}
                    </div>
                  )}
                  <div className="flex justify-end gap-3">
                    <button onClick={() => setSelectedMatch(null)}
                      className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-md hover:bg-surface-container-low transition-colors">
                      Annuler
                    </button>
                    <button onClick={sInscrire} disabled={saving}
                      className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary/90 disabled:opacity-50 transition-colors">
                      {saving
                        ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                        : <span className="material-symbols-outlined text-[18px]">check</span>}
                      {saving ? 'Inscription…' : 'S\'inscrire'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tab : Planning / Organisation ─────────────────────────────────── */}
          {tab === 'planning' && (
            <div className="space-y-4">
              {/* Résumé pour admins */}
              {isAdmin && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Matchs couverts',    value: matchs.filter(m => (m.arbitrage_presences?.length ?? 0) >= 2).length, icon: 'check_circle', color: 'text-green-600' },
                    { label: 'Matchs incomplets',  value: matchs.filter(m => (m.arbitrage_presences?.length ?? 0) === 1).length, icon: 'warning',      color: 'text-yellow-600' },
                    { label: 'Sans arbitre',       value: matchs.filter(m => (m.arbitrage_presences?.length ?? 0) === 0).length, icon: 'cancel',       color: 'text-error' },
                    { label: 'Total inscriptions', value: matchs.reduce((s, m) => s + (m.arbitrage_presences?.length ?? 0), 0), icon: 'groups',       color: 'text-primary' },
                  ].map(s => (
                    <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`material-symbols-outlined text-[20px] ${s.color}`}>{s.icon}</span>
                      </div>
                      <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
                      <p className="text-label-sm text-on-surface-variant mt-0.5">{s.label}</p>
                    </div>
                  ))}
                </div>
              )}

              {matchs.length === 0 ? (
                <div className="bg-white border border-[#e8e8f0] rounded-xl py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">sports</span>
                  <p className="text-body-md">
                    {isCoach ? 'Aucun de vos matchs ne nécessite d\'arbitre pour le moment' : 'Aucun match ne nécessite d\'arbitre pour le moment'}
                  </p>
                </div>
              ) : (
                matchs.map(m => {
                  const list = m.arbitrage_presences || []
                  return (
                    <div key={m.id} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                      <div className={`px-5 py-3 border-b border-[#e8e8f0] flex items-center justify-between ${
                        list.length >= 2 ? 'bg-green-50/60' : list.length === 1 ? 'bg-yellow-50/60' : ''
                      }`}>
                        <div>
                          <p className="text-label-lg text-on-surface capitalize">{formatDate(m.date.slice(0, 10))}</p>
                          <p className="text-body-sm text-on-surface-variant">{m.equipe?.nom} vs {m.adversaire || '—'} · {m.domicile_exterieur === 'domicile' ? '🏠 Domicile' : '✈️ Extérieur'}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-label-sm font-medium ${
                          list.length >= 2 ? 'bg-green-100 text-green-700'
                          : list.length === 1 ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-50 text-error'
                        }`}>
                          {list.length >= 2 ? 'Complet' : list.length === 1 ? '1 arbitre' : 'Aucun arbitre'} ({list.length}/2)
                        </span>
                      </div>
                      {list.length === 0 ? (
                        <div className="px-5 py-4 text-body-sm text-on-surface-variant flex items-center gap-2">
                          <span className="material-symbols-outlined text-[16px] opacity-40">person_off</span>
                          Aucun arbitre inscrit
                        </div>
                      ) : (
                        <div className="divide-y divide-[#e8e8f0]">
                          {list.map(p => (
                            <div key={p.id} className="flex items-center gap-3 px-5 py-3">
                              {p.user?.avatar
                                ? <img src={p.user.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                                : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                                    {p.user?.prenom?.[0]}{p.user?.nom?.[0]}
                                  </div>
                              }
                              <div className="flex-1 min-w-0">
                                <p className="text-label-md text-on-surface">{p.user?.prenom} {p.user?.nom}</p>
                                {p.commentaire && <p className="text-body-sm text-on-surface-variant truncate">{p.commentaire}</p>}
                              </div>
                              {p.user?.telephone && (
                                <a href={`tel:${p.user.telephone}`}
                                  className="flex items-center gap-1.5 px-3 py-1.5 bg-surface-container-low text-on-surface-variant rounded-lg text-label-sm hover:bg-surface-container transition-colors">
                                  <span className="material-symbols-outlined text-[14px]">call</span>
                                  Appeler
                                </a>
                              )}
                              {(isAdmin || p.user_id === user?.id) && (
                                <button onClick={() => seDesinscrire(p.id)}
                                  className="p-1.5 rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors">
                                  <span className="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          )}

          {/* ── Tab : Statistiques ────────────────────────────────────────────── */}
          {tab === 'stats' && (
            <div className="space-y-4">
              <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-[#e8e8f0]">
                  <h3 className="text-headline-md">Classement des arbitres</h3>
                  <p className="text-body-sm text-on-surface-variant">Nombre d'arbitrages effectués</p>
                </div>
                {stats.length === 0 ? (
                  <div className="py-16 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">sports</span>
                    <p className="text-body-md">Aucune statistique disponible</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8f0]">
                    {stats.map((s, idx) => (
                      <div key={s.user?.id ?? idx} className="flex items-center gap-4 px-5 py-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold shrink-0 ${
                          idx === 0 ? 'bg-yellow-100 text-yellow-700'
                          : idx === 1 ? 'bg-gray-100 text-gray-600'
                          : idx === 2 ? 'bg-orange-50 text-orange-600'
                          : 'text-on-surface-variant'
                        }`}>{idx + 1}</span>
                        {s.user?.avatar
                          ? <img src={s.user.avatar} className="w-9 h-9 rounded-full object-cover shrink-0" alt="" />
                          : <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary text-sm">
                              {s.user?.prenom?.[0]}{s.user?.nom?.[0]}
                            </div>
                        }
                        <span className="flex-1 text-label-lg text-on-surface">{s.user?.prenom} {s.user?.nom}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                            <div className="h-full bg-primary rounded-full" style={{ width: `${Math.min(100, (s.count / (stats[0]?.count || 1)) * 100)}%` }} />
                          </div>
                          <span className="text-label-lg font-black text-primary w-8 text-right">{s.count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
