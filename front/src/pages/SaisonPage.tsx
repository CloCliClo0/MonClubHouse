import { useEffect, useState, useMemo } from 'react'
import api from '../services/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type Equipe = { id: number; nom: string; categorie: string; coach_id: number | null }

type MatchItem = {
  id: number
  adversaire: string | null
  date: string
  heure_rdv: string | null
  type: 'match' | 'amical' | 'coupe' | 'tournoi' | 'entrainement'
  domicile_exterieur: 'domicile' | 'exterieur' | 'neutre'
  score_equipe: number | null
  score_adversaire: number | null
  statut: 'programme' | 'en_cours' | 'termine' | 'annule' | 'reporte'
  journee: number | null
  championnat: string | null
}

type TabKey = 'match' | 'amical' | 'coupe' | 'tournoi'

// ── Constantes ────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<TabKey, { label: string; icon: string }> = {
  match:   { label: 'Championnat', icon: 'emoji_events'   },
  coupe:   { label: 'Coupe',       icon: 'military_tech'  },
  amical:  { label: 'Amical',      icon: 'handshake'      },
  tournoi: { label: 'Tournoi',     icon: 'celebration'    },
}

const BLANK_FORM = {
  adversaire: '',
  date: '',
  heure_rdv: '',
  domicile_exterieur: 'domicile' as 'domicile' | 'exterieur' | 'neutre',
  journee: '',
  championnat: '',
  type: 'match' as TabKey,
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getResultat(m: MatchItem) {
  if (m.statut !== 'termine' || m.score_equipe === null || m.score_adversaire === null) return null
  if (m.score_equipe > m.score_adversaire)  return { label: 'V', bg: 'bg-green-100', text: 'text-green-700' }
  if (m.score_equipe === m.score_adversaire) return { label: 'N', bg: 'bg-gray-100',  text: 'text-gray-600'  }
  return { label: 'D', bg: 'bg-red-100', text: 'text-red-700' }
}

function currentSeason(): string {
  const now = new Date()
  const y = now.getFullYear()
  return now.getMonth() + 1 >= 8 ? `${y}-${y + 1}` : `${y - 1}-${y}`
}

function fmtDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SaisonPage() {
  const [equipes, setEquipes]               = useState<Equipe[]>([])
  const [loadingEquipes, setLoadingEquipes] = useState(true)
  const [selectedCat, setSelectedCat]       = useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [activeTab, setActiveTab]           = useState<TabKey>('match')
  const [matchs, setMatchs]                 = useState<MatchItem[]>([])
  const [loadingMatchs, setLoadingMatchs]   = useState(false)
  const [adversaireNames, setAdversaireNames] = useState<string[]>([])

  // Modal
  const [showModal, setShowModal] = useState(false)
  const [form, setForm]           = useState(BLANK_FORM)
  const [saving, setSaving]       = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const role      = localStorage.getItem('role') || 'joueur'
  const canManage = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)
  const season    = currentSeason()

  // ── Chargement équipes ────────────────────────────────────────────────────

  useEffect(() => {
    api.get('/equipes')
      .then(r => {
        const data: Equipe[] = r.data.data || r.data || []
        setEquipes(data)
        if (data.length > 0) {
          const first = data[0].categorie
          setSelectedCat(first)
        }
      })
      .catch(() => setEquipes([]))
      .finally(() => setLoadingEquipes(false))
  }, [])

  // Adversaires pour autocomplete
  useEffect(() => {
    api.get('/adversaires')
      .then(r => {
        const data: any[] = r.data.data || r.data || []
        setAdversaireNames(data.map(a => a.nom))
      })
      .catch(() => {})
  }, [])

  // ── Équipes de la catégorie sélectionnée ──────────────────────────────────

  const teamsInCat = useMemo(
    () => equipes.filter(e => e.categorie === selectedCat),
    [equipes, selectedCat]
  )

  // Auto-select première équipe quand catégorie change
  useEffect(() => {
    if (teamsInCat.length > 0) setSelectedTeamId(teamsInCat[0].id)
    else setSelectedTeamId(null)
  }, [teamsInCat])

  // ── Chargement matchs ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedTeamId) { setMatchs([]); return }
    setLoadingMatchs(true)
    api.get(`/matchs?equipe_id=${selectedTeamId}&type=${activeTab}`)
      .then(r => setMatchs(r.data.data || r.data || []))
      .catch(() => setMatchs([]))
      .finally(() => setLoadingMatchs(false))
  }, [selectedTeamId, activeTab])

  // ── Stats ─────────────────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const done = matchs.filter(m =>
      m.statut === 'termine' && m.score_equipe !== null && m.score_adversaire !== null
    )
    const W   = done.filter(m => m.score_equipe! > m.score_adversaire!).length
    const D   = done.filter(m => m.score_equipe! === m.score_adversaire!).length
    const L   = done.filter(m => m.score_equipe! < m.score_adversaire!).length
    const GF  = done.reduce((s, m) => s + (m.score_equipe  ?? 0), 0)
    const GA  = done.reduce((s, m) => s + (m.score_adversaire ?? 0), 0)
    const Pts = W * 3 + D
    return { P: done.length, W, D, L, GF, GA, Pts, total: matchs.length }
  }, [matchs])

  const categories = [...new Set(equipes.map(e => e.categorie))]

  // ── Ajout match ───────────────────────────────────────────────────────────

  const openModal = () => {
    setForm({ ...BLANK_FORM, type: activeTab })
    setSaveError(null)
    setShowModal(true)
  }

  const reloadMatchs = async () => {
    if (!selectedTeamId) return
    const r = await api.get(`/matchs?equipe_id=${selectedTeamId}&type=${activeTab}`)
    setMatchs(r.data.data || r.data || [])
  }

  const handleSave = async () => {
    if (!form.adversaire.trim() || !form.date || !selectedTeamId) return
    setSaving(true)
    setSaveError(null)
    try {
      await api.post('/matchs', {
        equipe_id:          selectedTeamId,
        adversaire:         form.adversaire.trim(),
        date:               form.date,
        heure_rdv:          form.heure_rdv || null,
        type:               form.type,
        domicile_exterieur: form.domicile_exterieur,
        journee:            form.journee ? Number(form.journee) : null,
        championnat:        form.championnat || null,
        statut:             'programme',
      })
      setShowModal(false)
      await reloadMatchs()
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || 'Erreur lors de la création')
    } finally {
      setSaving(false)
    }
  }

  // ── Rendu ─────────────────────────────────────────────────────────────────

  const selectedTeam = equipes.find(e => e.id === selectedTeamId)

  return (
    <div>
      {/* En-tête */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Saison {season}</h2>
          <p className="text-body-md text-on-surface-variant">
            {selectedTeam ? selectedTeam.nom : 'Sélectionnez une catégorie'}
          </p>
        </div>
        {canManage && selectedTeamId && (
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary/90 transition-colors shadow-sm"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Ajouter un match
          </button>
        )}
      </div>

      {/* Sélecteur catégorie */}
      {loadingEquipes ? (
        <div className="flex gap-2 mb-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-9 w-20 bg-white border border-[#e8e8f0] rounded-full animate-pulse" />
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center bg-white border border-[#e8e8f0] rounded-xl">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">groups</span>
          <p className="text-headline-md text-on-surface mb-2">Aucune équipe</p>
          <p className="text-body-md text-on-surface-variant">Créez des équipes pour gérer leur saison.</p>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-label-lg transition-all font-medium ${
                selectedCat === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-[#e8e8f0] text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Sélecteur équipe (si plusieurs dans la catégorie) */}
      {teamsInCat.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {teamsInCat.map(eq => (
            <button
              key={eq.id}
              onClick={() => setSelectedTeamId(eq.id)}
              className={`px-3 py-1.5 rounded-lg text-label-md transition-all border ${
                selectedTeamId === eq.id
                  ? 'bg-on-surface text-surface border-on-surface'
                  : 'bg-white border-[#e8e8f0] text-on-surface-variant hover:border-on-surface/40'
              }`}
            >
              {eq.nom}
            </button>
          ))}
        </div>
      )}

      {selectedTeamId && (
        <>
          {/* Bande de stats (championnat uniquement) */}
          {activeTab === 'match' && stats.P > 0 && (
            <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-5 overflow-x-auto">
              <div className="flex items-center gap-8 min-w-max">
                {[
                  { label: 'Joués',     value: stats.P,   cls: 'text-on-surface'  },
                  { label: 'Victoires', value: stats.W,   cls: 'text-green-600'   },
                  { label: 'Nuls',      value: stats.D,   cls: 'text-gray-500'    },
                  { label: 'Défaites',  value: stats.L,   cls: 'text-red-600'     },
                  { label: 'Buts +',    value: stats.GF,  cls: 'text-on-surface'  },
                  { label: 'Buts −',    value: stats.GA,  cls: 'text-on-surface'  },
                  { label: 'Points',    value: stats.Pts, cls: 'text-primary'     },
                ].map((s, i, arr) => (
                  <div key={s.label} className={`text-center ${i < arr.length - 1 ? 'pr-8 border-r border-[#e8e8f0]' : ''}`}>
                    <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onglets type de match */}
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl mb-5 w-fit overflow-x-auto">
            {(Object.entries(TAB_LABELS) as [TabKey, { label: string; icon: string }][]).map(([tab, meta]) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-label-md transition-all whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-white text-on-surface shadow-sm font-medium'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                {meta.label}
              </button>
            ))}
          </div>

          {/* Tableau matchs */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {loadingMatchs ? (
              <div className="p-4 space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />
                ))}
              </div>
            ) : matchs.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">
                  {TAB_LABELS[activeTab].icon}
                </span>
                <p className="text-body-md font-medium">
                  Aucun match de {TAB_LABELS[activeTab].label.toLowerCase()}
                </p>
                <p className="text-body-sm mt-1">
                  Ajoutez les matchs de la saison pour suivre les résultats.
                </p>
                {canManage && (
                  <button
                    onClick={openModal}
                    className="mt-4 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-label-md mx-auto hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Ajouter un match
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#e8e8f0] bg-surface-container-low/30">
                      {activeTab === 'match' && (
                        <th className="text-left px-4 py-3 text-label-md text-on-surface-variant w-12">J.</th>
                      )}
                      <th className="text-left px-4 py-3 text-label-md text-on-surface-variant">Date</th>
                      <th className="text-left px-4 py-3 text-label-md text-on-surface-variant">Adversaire</th>
                      <th className="text-left px-4 py-3 text-label-md text-on-surface-variant hidden sm:table-cell">Lieu</th>
                      <th className="text-left px-4 py-3 text-label-md text-on-surface-variant">Score</th>
                      <th className="text-left px-4 py-3 text-label-md text-on-surface-variant">Rés.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8f0]">
                    {matchs.map(m => {
                      const res = getResultat(m)
                      return (
                        <tr key={m.id} className="hover:bg-surface-container-low/40 transition-colors">
                          {activeTab === 'match' && (
                            <td className="px-4 py-3 text-label-md text-on-surface-variant">
                              {m.journee ? `J${m.journee}` : '—'}
                            </td>
                          )}
                          <td className="px-4 py-3">
                            <p className="text-label-md text-on-surface">{fmtDate(m.date)}</p>
                            {m.heure_rdv && (
                              <p className="text-body-sm text-on-surface-variant">{m.heure_rdv.slice(0,5)}</p>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-label-md text-on-surface">{m.adversaire || '—'}</p>
                            {activeTab === 'match' && m.championnat && (
                              <p className="text-body-sm text-on-surface-variant">{m.championnat}</p>
                            )}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium ${
                              m.domicile_exterieur === 'domicile'
                                ? 'bg-blue-50 text-blue-700'
                                : m.domicile_exterieur === 'exterieur'
                                  ? 'bg-orange-50 text-orange-700'
                                  : 'bg-gray-50 text-gray-700'
                            }`}>
                              {m.domicile_exterieur === 'domicile' ? 'Dom.' : m.domicile_exterieur === 'exterieur' ? 'Ext.' : 'Neut.'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            {m.statut === 'termine' && m.score_equipe !== null ? (
                              <span className="text-label-lg font-bold text-on-surface">
                                {m.score_equipe} – {m.score_adversaire}
                              </span>
                            ) : (
                              <span className={`text-body-sm ${
                                m.statut === 'annule' || m.statut === 'reporte'
                                  ? 'text-error'
                                  : 'text-on-surface-variant'
                              }`}>
                                {m.statut === 'annule' ? 'Annulé' : m.statut === 'reporte' ? 'Reporté' : 'À venir'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {res ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-label-md font-black ${res.bg} ${res.text}`}>
                                {res.label}
                              </span>
                            ) : (
                              <span className="text-on-surface-variant">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── Modal ajout match ───────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <div>
                <h3 className="text-headline-md">Ajouter un match</h3>
                {selectedTeam && (
                  <p className="text-body-sm text-on-surface-variant">{selectedTeam.nom}</p>
                )}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Type */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Type de match</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(TAB_LABELS) as [TabKey, { label: string; icon: string }][]).map(([t, meta]) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-md border transition-all ${
                        form.type === t
                          ? 'bg-primary text-white border-primary'
                          : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Adversaire */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Adversaire *</label>
                <input
                  list="adv-datalist"
                  value={form.adversaire}
                  onChange={e => setForm(f => ({ ...f, adversaire: e.target.value }))}
                  placeholder="Nom du club adversaire"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <datalist id="adv-datalist">
                  {adversaireNames.map(a => <option key={a} value={a} />)}
                </datalist>
              </div>

              {/* Date + Heure */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Date *</label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Heure RDV</label>
                  <input
                    type="time"
                    value={form.heure_rdv}
                    onChange={e => setForm(f => ({ ...f, heure_rdv: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                  />
                </div>
              </div>

              {/* Domicile / Extérieur */}
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Terrain</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['domicile', 'exterieur', 'neutre'] as const).map(d => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, domicile_exterieur: d }))}
                      className={`py-2.5 rounded-lg text-label-md border transition-all ${
                        form.domicile_exterieur === d
                          ? 'bg-on-surface text-surface border-on-surface'
                          : 'border-outline-variant text-on-surface-variant hover:border-on-surface/40'
                      }`}
                    >
                      {d === 'domicile' ? 'Domicile' : d === 'exterieur' ? 'Extérieur' : 'Neutre'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Champs spécifiques championnat */}
              {form.type === 'match' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Journée</label>
                    <input
                      type="number"
                      min="1"
                      value={form.journee}
                      onChange={e => setForm(f => ({ ...f, journee: e.target.value }))}
                      placeholder="Ex : 5"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Division</label>
                    <input
                      type="text"
                      value={form.championnat}
                      onChange={e => setForm(f => ({ ...f, championnat: e.target.value }))}
                      placeholder="Ex : Régional 2"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                </div>
              )}

              {saveError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-700">
                  {saveError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-white p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !form.adversaire.trim() || !form.date}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {saving ? (
                  <>
                    <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                    Création…
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-[18px]">add</span>
                    Créer le match
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
