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
type AllTab = TabKey | 'classement'

type ChEquipeRow = {
  id: number; nom: string; equipe_id: number | null; couleur: string
  J: number; V: number; N: number; D: number; BP: number; BC: number; Diff: number; Pts: number
}
type ChMatchRow = {
  id: number; dom_id: number; ext_id: number
  journee: number | null; date: string | null
  score_dom: number | null; score_ext: number | null
}
type ChampData = { equipes: ChEquipeRow[]; matchs: ChMatchRow[] }

// ── Constantes ────────────────────────────────────────────────────────────────

const TAB_LABELS: Record<TabKey, { label: string; icon: string }> = {
  match:   { label: 'Championnat', icon: 'emoji_events'  },
  coupe:   { label: 'Coupe',       icon: 'military_tech' },
  amical:  { label: 'Amical',      icon: 'handshake'     },
  tournoi: { label: 'Tournoi',     icon: 'celebration'   },
}

type MatchForm = {
  adversaire: string; date: string; heure_rdv: string
  domicile_exterieur: 'domicile' | 'exterieur' | 'neutre'
  journee: string; championnat: string; type: TabKey
}

const BLANK_FORM: MatchForm = {
  adversaire: '', date: '', heure_rdv: '',
  domicile_exterieur: 'domicile',
  journee: '', championnat: '',
  type: 'match',
}

const BLANK_RESULT = { dom_id: '', ext_id: '', score_dom: '', score_ext: '', journee: '', date: '' }

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

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SaisonPage() {
  const role      = localStorage.getItem('role') || 'joueur'
  const canManage = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)
  const season    = currentSeason()

  // ── State équipes ─────────────────────────────────────────────────────────
  const [equipes, setEquipes]               = useState<Equipe[]>([])
  const [loadingEquipes, setLoadingEquipes] = useState(true)
  const [selectedCat, setSelectedCat]       = useState<string>('')
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null)
  const [activeTab, setActiveTab]           = useState<AllTab>('match')

  // ── State matchs ──────────────────────────────────────────────────────────
  const [matchs, setMatchs]               = useState<MatchItem[]>([])
  const [loadingMatchs, setLoadingMatchs] = useState(false)
  const [adversaireNames, setAdversaireNames] = useState<string[]>([])
  const [showModal, setShowModal]         = useState(false)
  const [form, setForm]                   = useState(BLANK_FORM)
  const [saving, setSaving]               = useState(false)
  const [saveError, setSaveError]         = useState<string | null>(null)

  // ── State classement ──────────────────────────────────────────────────────
  const [champList, setChampList]         = useState<string[]>([])
  const [activeChamp, setActiveChamp]     = useState<string>('')
  const [champData, setChampData]         = useState<ChampData | null>(null)
  const [loadingChamp, setLoadingChamp]   = useState(false)

  // Modals classement
  const [showNewChamp, setShowNewChamp]   = useState(false)
  const [newChampName, setNewChampName]   = useState('')
  const [showAddTeam, setShowAddTeam]     = useState(false)
  const [addTeamNom, setAddTeamNom]       = useState('')
  const [addTeamIsOwn, setAddTeamIsOwn]   = useState(false)
  const [showAddResult, setShowAddResult] = useState(false)
  const [resultForm, setResultForm]       = useState(BLANK_RESULT)
  const [editingMatch, setEditingMatch]   = useState<ChMatchRow | null>(null)
  const [savingCh, setSavingCh]           = useState(false)

  // ── Chargement équipes ────────────────────────────────────────────────────

  useEffect(() => {
    api.get('/equipes')
      .then(r => {
        const data: Equipe[] = r.data.data || r.data || []
        setEquipes(data)
        if (data.length > 0) setSelectedCat(data[0].categorie)
      })
      .catch(() => setEquipes([]))
      .finally(() => setLoadingEquipes(false))
  }, [])

  useEffect(() => {
    api.get('/adversaires')
      .then(r => setAdversaireNames((r.data.data || []).map((a: any) => a.nom)))
      .catch(() => {})
  }, [])

  const teamsInCat = useMemo(
    () => equipes.filter(e => e.categorie === selectedCat),
    [equipes, selectedCat]
  )

  useEffect(() => {
    if (teamsInCat.length > 0) setSelectedTeamId(teamsInCat[0].id)
    else setSelectedTeamId(null)
  }, [teamsInCat])

  const categories = [...new Set(equipes.map(e => e.categorie))]

  // ── Chargement matchs ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedTeamId || activeTab === 'classement') { setMatchs([]); return }
    setLoadingMatchs(true)
    api.get(`/matchs?equipe_id=${selectedTeamId}&type=${activeTab}`)
      .then(r => setMatchs(r.data.data || r.data || []))
      .catch(() => setMatchs([]))
      .finally(() => setLoadingMatchs(false))
  }, [selectedTeamId, activeTab])

  // ── Chargement classement ─────────────────────────────────────────────────

  useEffect(() => {
    if (!selectedTeamId || activeTab !== 'classement') return
    api.get(`/championnat/list?equipe_ref_id=${selectedTeamId}&saison=${season}`)
      .then(r => {
        const list: string[] = r.data.data || []
        setChampList(list)
        if (list.length > 0 && !list.includes(activeChamp)) setActiveChamp(list[0])
      })
      .catch(() => setChampList([]))
  }, [selectedTeamId, activeTab])

  const loadChampData = async () => {
    if (!selectedTeamId) return
    setLoadingChamp(true)
    try {
      const r = await api.get(
        `/championnat?equipe_ref_id=${selectedTeamId}&saison=${season}&championnat=${encodeURIComponent(activeChamp)}`
      )
      setChampData(r.data.data)
    } catch {
      setChampData(null)
    } finally {
      setLoadingChamp(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'classement' && selectedTeamId) loadChampData()
  }, [activeChamp, selectedTeamId, activeTab])

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
    return { P: done.length, W, D, L, GF, GA, Pts: W * 3 + D, total: matchs.length }
  }, [matchs])

  // ── Ajout match (onglets hors classement) ─────────────────────────────────

  const handleSave = async () => {
    if (!form.adversaire.trim() || !form.date || !selectedTeamId) return
    setSaving(true); setSaveError(null)
    try {
      await api.post('/matchs', {
        equipe_id: selectedTeamId, adversaire: form.adversaire.trim(), date: form.date,
        heure_rdv: form.heure_rdv || null, type: form.type,
        domicile_exterieur: form.domicile_exterieur,
        journee: form.journee ? Number(form.journee) : null,
        championnat: form.championnat || null, statut: 'programme',
      })
      setShowModal(false)
      const r = await api.get(`/matchs?equipe_id=${selectedTeamId}&type=${activeTab}`)
      setMatchs(r.data.data || r.data || [])
    } catch (e: any) {
      setSaveError(e?.response?.data?.message || 'Erreur lors de la création')
    } finally { setSaving(false) }
  }

  // ── Actions classement ────────────────────────────────────────────────────

  const createChamp = async () => {
    if (!newChampName.trim() || !selectedTeamId) return
    const n = newChampName.trim()
    // Auto-ajouter l'équipe du club comme première équipe du championnat
    await api.post('/championnat/equipes', {
      equipe_ref_id: selectedTeamId, equipe_id: selectedTeamId,
      nom: equipes.find(e => e.id === selectedTeamId)?.nom || 'Mon équipe',
      saison: season, championnat: n, couleur: '#1b4332',
    })
    setChampList(prev => [...prev, n])
    setActiveChamp(n)
    setNewChampName(''); setShowNewChamp(false)
    await loadChampData()
  }

  const handleAddTeam = async () => {
    if (!addTeamNom.trim() || !selectedTeamId) return
    setSavingCh(true)
    try {
      await api.post('/championnat/equipes', {
        equipe_ref_id: selectedTeamId,
        equipe_id: addTeamIsOwn ? selectedTeamId : null,
        nom: addTeamNom.trim(), saison: season, championnat: activeChamp,
      })
      setAddTeamNom(''); setAddTeamIsOwn(false); setShowAddTeam(false)
      await loadChampData()
    } catch { /* ignore */ } finally { setSavingCh(false) }
  }

  const handleAddResult = async () => {
    if (!resultForm.dom_id || !resultForm.ext_id || !selectedTeamId) return
    setSavingCh(true)
    try {
      if (editingMatch) {
        await api.patch(`/championnat/matchs/${editingMatch.id}`, resultForm)
      } else {
        await api.post('/championnat/matchs', {
          equipe_ref_id: selectedTeamId, saison: season, championnat: activeChamp, ...resultForm,
        })
      }
      setShowAddResult(false); setResultForm(BLANK_RESULT); setEditingMatch(null)
      await loadChampData()
    } catch { /* ignore */ } finally { setSavingCh(false) }
  }

  const handleDeleteMatch = async (id: number) => {
    if (!confirm('Supprimer ce résultat ?')) return
    await api.delete(`/championnat/matchs/${id}`)
    await loadChampData()
  }

  const openEditResult = (m: ChMatchRow) => {
    setResultForm({
      dom_id: String(m.dom_id), ext_id: String(m.ext_id),
      score_dom: m.score_dom !== null ? String(m.score_dom) : '',
      score_ext: m.score_ext !== null ? String(m.score_ext) : '',
      journee: m.journee !== null ? String(m.journee) : '',
      date: m.date || '',
    })
    setEditingMatch(m)
    setShowAddResult(true)
  }

  const handleDeleteTeam = async (id: number) => {
    if (!confirm('Supprimer cette équipe et tous ses résultats du championnat ?')) return
    await api.delete(`/championnat/equipes/${id}`)
    await loadChampData()
  }

  const handleDeleteChamp = async () => {
    if (!selectedTeamId || !activeChamp) return
    if (!confirm(`Supprimer le championnat "${activeChamp}" et toutes ses données ?`)) return
    await api.delete(`/championnat/complet?equipe_ref_id=${selectedTeamId}&saison=${season}&championnat=${encodeURIComponent(activeChamp)}`)
    setChampList(prev => prev.filter(c => c !== activeChamp))
    setActiveChamp('')
    setChampData(null)
  }

  // ── Render ────────────────────────────────────────────────────────────────

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
        {canManage && selectedTeamId && activeTab !== 'classement' && (
          <button
            onClick={() => { setForm({ ...BLANK_FORM, type: activeTab as TabKey }); setSaveError(null); setShowModal(true) }}
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
          {[1,2,3,4].map(i => <div key={i} className="h-9 w-20 bg-white border border-[#e8e8f0] rounded-full animate-pulse" />)}
        </div>
      ) : categories.length === 0 ? (
        <div className="py-20 text-center bg-white border border-[#e8e8f0] rounded-xl">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">groups</span>
          <p className="text-headline-md text-on-surface mb-2">Aucune équipe</p>
          <p className="text-body-md text-on-surface-variant">
            {['joueur', 'parent'].includes(role)
              ? 'Vous n\'êtes pas encore licencié(e) dans une équipe.'
              : 'Créez des équipes pour gérer leur saison.'}
          </p>
        </div>
      ) : (
        <div className="flex gap-2 flex-wrap mb-4">
          {categories.map(cat => (
            <button key={cat} onClick={() => setSelectedCat(cat)}
              className={`px-4 py-2 rounded-full text-label-lg transition-all font-medium ${
                selectedCat === cat
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-white border border-[#e8e8f0] text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
              }`}
            >{cat}</button>
          ))}
        </div>
      )}

      {/* Sélecteur équipe (plusieurs dans la catégorie) */}
      {teamsInCat.length > 1 && (
        <div className="flex gap-2 flex-wrap mb-4">
          {teamsInCat.map(eq => (
            <button key={eq.id} onClick={() => setSelectedTeamId(eq.id)}
              className={`px-3 py-1.5 rounded-lg text-label-md transition-all border ${
                selectedTeamId === eq.id
                  ? 'bg-on-surface text-surface border-on-surface'
                  : 'bg-white border-[#e8e8f0] text-on-surface-variant hover:border-on-surface/40'
              }`}
            >{eq.nom}</button>
          ))}
        </div>
      )}

      {selectedTeamId && (
        <>
          {/* Stats bar (championnat uniquement) */}
          {activeTab === 'match' && stats.P > 0 && (
            <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-5 overflow-x-auto">
              <div className="flex items-center gap-8 min-w-max">
                {[
                  { label: 'Joués', value: stats.P, cls: 'text-on-surface' },
                  { label: 'Victoires', value: stats.W, cls: 'text-green-600' },
                  { label: 'Nuls', value: stats.D, cls: 'text-gray-500' },
                  { label: 'Défaites', value: stats.L, cls: 'text-red-600' },
                  { label: 'Buts +', value: stats.GF, cls: 'text-on-surface' },
                  { label: 'Buts −', value: stats.GA, cls: 'text-on-surface' },
                  { label: 'Points', value: stats.Pts, cls: 'text-primary' },
                ].map((s, i, arr) => (
                  <div key={s.label} className={`text-center ${i < arr.length - 1 ? 'pr-8 border-r border-[#e8e8f0]' : ''}`}>
                    <p className={`text-2xl font-black ${s.cls}`}>{s.value}</p>
                    <p className="text-label-sm text-on-surface-variant mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Onglets */}
          <div className="flex gap-1 bg-surface-container-low p-1 rounded-xl mb-5 w-fit overflow-x-auto">
            {(Object.entries(TAB_LABELS) as [TabKey, { label: string; icon: string }][]).map(([tab, meta]) => (
              <button key={tab} onClick={() => setActiveTab(tab)}
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
            <button onClick={() => setActiveTab('classement')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-label-md transition-all whitespace-nowrap ${
                activeTab === 'classement'
                  ? 'bg-white text-on-surface shadow-sm font-medium'
                  : 'text-on-surface-variant hover:text-on-surface'
              }`}
            >
              <span className="material-symbols-outlined text-[16px]">leaderboard</span>
              Classement
            </button>
          </div>

          {/* ── Vue matchs ────────────────────────────────────────────────── */}
          {activeTab !== 'classement' && (
            <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              {loadingMatchs ? (
                <div className="p-4 space-y-3">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
                </div>
              ) : matchs.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">
                    {TAB_LABELS[activeTab as TabKey].icon}
                  </span>
                  <p className="text-body-md font-medium">
                    Aucun match de {TAB_LABELS[activeTab as TabKey].label.toLowerCase()}
                  </p>
                  {canManage && (
                    <button
                      onClick={() => { setForm({ ...BLANK_FORM, type: activeTab as TabKey }); setSaveError(null); setShowModal(true) }}
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
                        {activeTab === 'match' && <th className="text-left px-4 py-3 text-label-md text-on-surface-variant w-12">J.</th>}
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
                              <p className="text-label-md text-on-surface">
                                {new Date(m.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })}
                              </p>
                              {m.heure_rdv && <p className="text-body-sm text-on-surface-variant">{m.heure_rdv.slice(0,5)}</p>}
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-label-md text-on-surface">{m.adversaire || '—'}</p>
                              {activeTab === 'match' && m.championnat && (
                                <p className="text-body-sm text-on-surface-variant">{m.championnat}</p>
                              )}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-label-sm font-medium ${
                                m.domicile_exterieur === 'domicile' ? 'bg-blue-50 text-blue-700'
                                  : m.domicile_exterieur === 'exterieur' ? 'bg-orange-50 text-orange-700'
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
                                  m.statut === 'annule' || m.statut === 'reporte' ? 'text-error' : 'text-on-surface-variant'
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
                              ) : <span className="text-on-surface-variant">—</span>}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Vue classement ─────────────────────────────────────────────── */}
          {activeTab === 'classement' && (
            <ClassementView
              champList={champList}
              activeChamp={activeChamp}
              champData={champData}
              loadingChamp={loadingChamp}
              canManage={canManage}
              savingCh={savingCh}
              onSelectChamp={setActiveChamp}
              onOpenNewChamp={() => { setNewChampName(''); setShowNewChamp(true) }}
              onAddTeam={() => { setAddTeamNom(''); setAddTeamIsOwn(false); setShowAddTeam(true) }}
              onAddResult={() => { setResultForm(BLANK_RESULT); setEditingMatch(null); setShowAddResult(true) }}
              onEditResult={openEditResult}
              onDeleteResult={handleDeleteMatch}
              onDeleteTeam={handleDeleteTeam}
              onDeleteChamp={handleDeleteChamp}
            />
          )}
        </>
      )}

      {/* ── Modal ajout match ─────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <div>
                <h3 className="text-headline-md">Ajouter un match</h3>
                {selectedTeam && <p className="text-body-sm text-on-surface-variant">{selectedTeam.nom}</p>}
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-surface-container-low text-on-surface-variant">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Type de match</label>
                <div className="flex gap-2 flex-wrap">
                  {(Object.entries(TAB_LABELS) as [TabKey, { label: string; icon: string }][]).map(([t, meta]) => (
                    <button key={t} type="button" onClick={() => setForm(f => ({ ...f, type: t }))}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-md border transition-all ${
                        form.type === t ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                      }`}>
                      <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
                      {meta.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Adversaire *</label>
                <input list="adv-datalist" value={form.adversaire}
                  onChange={e => setForm(f => ({ ...f, adversaire: e.target.value }))}
                  placeholder="Nom du club adversaire"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                />
                <datalist id="adv-datalist">{adversaireNames.map(a => <option key={a} value={a} />)}</datalist>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Heure RDV</label>
                  <input type="time" value={form.heure_rdv} onChange={e => setForm(f => ({ ...f, heure_rdv: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Terrain</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['domicile', 'exterieur', 'neutre'] as const).map(d => (
                    <button key={d} type="button" onClick={() => setForm(f => ({ ...f, domicile_exterieur: d }))}
                      className={`py-2.5 rounded-lg text-label-md border transition-all ${
                        form.domicile_exterieur === d ? 'bg-on-surface text-surface border-on-surface' : 'border-outline-variant text-on-surface-variant hover:border-on-surface/40'
                      }`}>
                      {d === 'domicile' ? 'Domicile' : d === 'exterieur' ? 'Extérieur' : 'Neutre'}
                    </button>
                  ))}
                </div>
              </div>
              {form.type === 'match' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Journée</label>
                    <input type="number" min="1" value={form.journee}
                      onChange={e => setForm(f => ({ ...f, journee: e.target.value }))} placeholder="Ex : 5"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Division</label>
                    <input type="text" value={form.championnat}
                      onChange={e => setForm(f => ({ ...f, championnat: e.target.value }))} placeholder="Ex : Régional 2"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
              )}
              {saveError && <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-700">{saveError}</div>}
            </div>
            <div className="sticky bottom-0 bg-white p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setShowModal(false)}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
                Annuler
              </button>
              <button onClick={handleSave} disabled={saving || !form.adversaire.trim() || !form.date}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 flex items-center gap-2 transition-colors">
                {saving
                  ? <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-[18px]">add</span>}
                {saving ? 'Création…' : 'Créer le match'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal nouveau championnat ──────────────────────────────────────── */}
      {showNewChamp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowNewChamp(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-headline-md mb-4">Nouveau championnat</h3>
            <div className="space-y-1.5 mb-5">
              <label className="text-label-md text-on-surface-variant">Nom du championnat / compétition *</label>
              <input autoFocus value={newChampName} onChange={e => setNewChampName(e.target.value)}
                placeholder="Ex : Régional 2, Coupe District…"
                className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
              />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewChamp(false)} className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">Annuler</button>
              <button onClick={createChamp} disabled={!newChampName.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 transition-colors">
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ajout équipe championnat ─────────────────────────────────── */}
      {showAddTeam && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowAddTeam(false)}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-headline-md mb-4">Ajouter une équipe</h3>
            <div className="space-y-4 mb-5">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom de l'équipe *</label>
                <input autoFocus value={addTeamNom} onChange={e => setAddTeamNom(e.target.value)}
                  placeholder="Ex : FC Exemple"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                />
              </div>
              {canManage && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" checked={addTeamIsOwn} onChange={e => setAddTeamIsOwn(e.target.checked)}
                    className="w-4 h-4 accent-primary" />
                  <span className="text-body-md text-on-surface">C'est notre propre équipe</span>
                </label>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowAddTeam(false)} className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">Annuler</button>
              <button onClick={handleAddTeam} disabled={!addTeamNom.trim() || savingCh}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {savingCh ? 'Ajout…' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal ajout / édition résultat ─────────────────────────────────── */}
      {showAddResult && champData && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => { setShowAddResult(false); setEditingMatch(null) }}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-headline-md mb-4">{editingMatch ? 'Modifier le résultat' : 'Ajouter un résultat'}</h3>
            <div className="space-y-4 mb-5">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Équipe domicile *</label>
                <select value={resultForm.dom_id} onChange={e => setResultForm(f => ({ ...f, dom_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all">
                  <option value="">— Choisir —</option>
                  {champData.equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Équipe extérieure *</label>
                <select value={resultForm.ext_id} onChange={e => setResultForm(f => ({ ...f, ext_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all">
                  <option value="">— Choisir —</option>
                  {champData.equipes.map(eq => <option key={eq.id} value={eq.id}>{eq.nom}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Score dom.</label>
                  <input type="number" min="0" value={resultForm.score_dom}
                    onChange={e => setResultForm(f => ({ ...f, score_dom: e.target.value }))} placeholder="0"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md text-center focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Score ext.</label>
                  <input type="number" min="0" value={resultForm.score_ext}
                    onChange={e => setResultForm(f => ({ ...f, score_ext: e.target.value }))} placeholder="0"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md text-center focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Journée</label>
                  <input type="number" min="1" value={resultForm.journee}
                    onChange={e => setResultForm(f => ({ ...f, journee: e.target.value }))} placeholder="Ex : 5"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Date</label>
                  <input type="date" value={resultForm.date}
                    onChange={e => setResultForm(f => ({ ...f, date: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowAddResult(false); setEditingMatch(null) }}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">Annuler</button>
              <button onClick={handleAddResult} disabled={!resultForm.dom_id || !resultForm.ext_id || savingCh}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary/90 disabled:opacity-40 transition-colors">
                {savingCh ? 'Enregistrement…' : (editingMatch ? 'Modifier' : 'Ajouter')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Composant Classement ───────────────────────────────────────────────────────

interface ClassementProps {
  champList: string[]
  activeChamp: string
  champData: ChampData | null
  loadingChamp: boolean
  canManage: boolean
  savingCh: boolean
  onSelectChamp: (c: string) => void
  onOpenNewChamp: () => void
  onAddTeam: () => void
  onAddResult: () => void
  onEditResult: (m: ChMatchRow) => void
  onDeleteResult: (id: number) => void
  onDeleteTeam: (id: number) => void
  onDeleteChamp: () => void
}

function ClassementView({
  champList, activeChamp, champData, loadingChamp, canManage,
  onSelectChamp, onOpenNewChamp, onAddTeam, onAddResult, onEditResult, onDeleteResult, onDeleteTeam, onDeleteChamp,
}: ClassementProps) {
  const equipes = champData?.equipes ?? []
  const matchs  = champData?.matchs  ?? []

  const teamName = (id: number) => equipes.find(e => e.id === id)?.nom ?? `#${id}`

  return (
    <div className="space-y-5">
      {/* Barre sélecteur championnat */}
      <div className="flex items-center gap-3 flex-wrap">
        {champList.length > 0 && champList.map(c => (
          <button key={c} onClick={() => onSelectChamp(c)}
            className={`px-4 py-2 rounded-full text-label-lg transition-all font-medium ${
              activeChamp === c
                ? 'bg-primary text-white shadow-sm'
                : 'bg-white border border-[#e8e8f0] text-on-surface-variant hover:border-primary/40 hover:text-on-surface'
            }`}
          >{c}</button>
        ))}
        {canManage && (
          <button onClick={onOpenNewChamp}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full text-label-lg border border-dashed border-outline-variant text-on-surface-variant hover:border-primary hover:text-primary transition-all">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Nouveau championnat
          </button>
        )}
        {canManage && activeChamp && (
          <button onClick={onDeleteChamp}
            className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-label-md text-error hover:bg-red-50 border border-error/20 transition-colors">
            <span className="material-symbols-outlined text-[16px]">delete</span>
            Supprimer "{activeChamp}"
          </button>
        )}
      </div>

      {champList.length === 0 && !canManage && (
        <div className="py-20 text-center bg-white border border-[#e8e8f0] rounded-xl text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">leaderboard</span>
          <p className="text-body-md">Aucun championnat configuré pour cette équipe.</p>
        </div>
      )}

      {activeChamp && (
        <>
          {loadingChamp ? (
            <div className="space-y-3">
              {[1,2,3,4].map(i => <div key={i} className="h-12 bg-white border border-[#e8e8f0] rounded-xl animate-pulse" />)}
            </div>
          ) : (
            <>
              {/* Tableau de classement */}
              <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between">
                  <h3 className="text-title-md font-semibold text-on-surface">Classement — {activeChamp}</h3>
                  {canManage && (
                    <button onClick={onAddTeam}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-label-md hover:bg-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">group_add</span>
                      Ajouter une équipe
                    </button>
                  )}
                </div>
                {equipes.length === 0 ? (
                  <div className="py-12 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">groups</span>
                    <p className="text-body-md">Aucune équipe dans ce championnat.</p>
                    {canManage && (
                      <button onClick={onAddTeam} className="mt-3 flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-label-md mx-auto hover:bg-primary/90 transition-colors">
                        <span className="material-symbols-outlined text-[18px]">add</span>
                        Ajouter des équipes
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#e8e8f0] bg-surface-container-low/30">
                          <th className="text-left px-3 py-3 text-label-md text-on-surface-variant w-10">Rg</th>
                          <th className="text-left px-3 py-3 text-label-md text-on-surface-variant">Équipe</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant">J</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant">V</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant">N</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant">D</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant hidden sm:table-cell">BP</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant hidden sm:table-cell">BC</th>
                          <th className="text-center px-2 py-3 text-label-md text-on-surface-variant hidden sm:table-cell">Diff</th>
                          <th className="text-center px-3 py-3 text-label-md text-on-surface-variant font-bold">Pts</th>
                          {canManage && <th className="w-10" />}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#e8e8f0]">
                        {equipes.map((eq, idx) => (
                          <tr key={eq.id} className={`transition-colors ${eq.equipe_id ? 'bg-primary/5' : 'hover:bg-surface-container-low/40'}`}>
                            <td className="px-3 py-3 text-center">
                              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-label-sm font-bold mx-auto ${
                                idx === 0 ? 'bg-yellow-100 text-yellow-700'
                                  : idx === 1 ? 'bg-gray-100 text-gray-600'
                                  : idx === 2 ? 'bg-orange-50 text-orange-600'
                                  : 'text-on-surface-variant'
                              }`}>{idx + 1}</span>
                            </td>
                            <td className="px-3 py-3">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: eq.couleur }} />
                                <span className={`text-label-md ${eq.equipe_id ? 'text-primary font-semibold' : 'text-on-surface'}`}>
                                  {eq.nom}
                                  {eq.equipe_id && <span className="ml-1.5 text-label-sm bg-primary/10 text-primary px-1.5 py-0.5 rounded">Nous</span>}
                                </span>
                              </div>
                            </td>
                            <td className="px-2 py-3 text-center text-body-md">{eq.J}</td>
                            <td className="px-2 py-3 text-center text-body-md text-green-700 font-medium">{eq.V}</td>
                            <td className="px-2 py-3 text-center text-body-md text-gray-500">{eq.N}</td>
                            <td className="px-2 py-3 text-center text-body-md text-red-600">{eq.D}</td>
                            <td className="px-2 py-3 text-center text-body-md hidden sm:table-cell">{eq.BP}</td>
                            <td className="px-2 py-3 text-center text-body-md hidden sm:table-cell">{eq.BC}</td>
                            <td className="px-2 py-3 text-center text-body-md hidden sm:table-cell">
                              <span className={eq.Diff > 0 ? 'text-green-700' : eq.Diff < 0 ? 'text-red-600' : 'text-gray-500'}>
                                {eq.Diff > 0 ? '+' : ''}{eq.Diff}
                              </span>
                            </td>
                            <td className="px-3 py-3 text-center">
                              <span className="text-label-lg font-black text-primary">{eq.Pts}</span>
                            </td>
                            {canManage && (
                              <td className="px-2 py-3 text-center">
                                <button onClick={() => onDeleteTeam(eq.id)}
                                  className="p-1 rounded hover:bg-red-50 text-on-surface-variant hover:text-red-600 transition-colors">
                                  <span className="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                              </td>
                            )}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Résultats des matchs */}
              <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between">
                  <h3 className="text-title-md font-semibold text-on-surface">Résultats</h3>
                  {canManage && equipes.length >= 2 && (
                    <button onClick={onAddResult}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-label-md hover:bg-primary/20 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">add</span>
                      Ajouter un résultat
                    </button>
                  )}
                </div>
                {matchs.length === 0 ? (
                  <div className="py-10 text-center text-on-surface-variant">
                    <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">sports_score</span>
                    <p className="text-body-md">Aucun résultat enregistré.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-[#e8e8f0]">
                    {matchs.map(m => (
                      <div key={m.id} className="flex items-center px-4 py-3 hover:bg-surface-container-low/40 transition-colors gap-3">
                        {m.journee && (
                          <span className="text-label-sm text-on-surface-variant w-8 shrink-0">J{m.journee}</span>
                        )}
                        {m.date && (
                          <span className="text-label-sm text-on-surface-variant w-16 shrink-0">{fmtDate(m.date)}</span>
                        )}
                        <span className="text-body-md text-on-surface flex-1 text-right truncate">{teamName(m.dom_id)}</span>
                        <span className="text-label-lg font-black text-on-surface shrink-0 w-14 text-center">
                          {m.score_dom !== null && m.score_ext !== null ? `${m.score_dom} – ${m.score_ext}` : '— – —'}
                        </span>
                        <span className="text-body-md text-on-surface flex-1 truncate">{teamName(m.ext_id)}</span>
                        {canManage && (
                          <div className="flex gap-1 shrink-0">
                            <button onClick={() => onEditResult(m)}
                              className="p-1 rounded hover:bg-surface-container-low text-on-surface-variant hover:text-primary transition-colors">
                              <span className="material-symbols-outlined text-[16px]">edit</span>
                            </button>
                            <button onClick={() => onDeleteResult(m.id)}
                              className="p-1 rounded hover:bg-red-50 text-on-surface-variant hover:text-red-600 transition-colors">
                              <span className="material-symbols-outlined text-[16px]">delete</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
