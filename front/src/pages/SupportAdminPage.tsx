import { useEffect, useState } from 'react'
import api from '../services/api'

type Priorite = 'normal' | 'haute' | 'urgent'
type Statut   = 'ouvert' | 'en_cours' | 'resolu' | 'ferme'

type Ticket = {
  id: number
  sujet: string
  message: string
  priorite: Priorite
  statut: Statut
  reponse: string | null
  createdAt: string
  updatedAt: string
  auteur?: { id: number; nom: string; prenom: string; email: string; role: string }
  repondant?: { nom: string; prenom: string } | null
  club?: { id: number; nom: string; couleur_primaire?: string } | null
}

type Stats = { ouvert: number; en_cours: number; resolu: number; ferme: number; total: number }

const PRIORITE_CFG: Record<Priorite, { label: string; icon: string; badgeCls: string; dotCls: string }> = {
  normal: { label: 'Normal', icon: 'info',     badgeCls: 'bg-blue-100 text-blue-700',     dotCls: 'bg-blue-400' },
  haute:  { label: 'Haute',  icon: 'warning',  badgeCls: 'bg-orange-100 text-orange-700', dotCls: 'bg-orange-400' },
  urgent: { label: 'Urgent', icon: 'error',    badgeCls: 'bg-red-100 text-red-700',       dotCls: 'bg-red-500' },
}

const STATUT_CFG: Record<Statut, { label: string; cls: string; next?: Statut }> = {
  ouvert:   { label: 'Ouvert',   cls: 'bg-blue-100 text-blue-700',    next: 'en_cours' },
  en_cours: { label: 'En cours', cls: 'bg-orange-100 text-orange-700', next: 'resolu' },
  resolu:   { label: 'Résolu',   cls: 'bg-green-100 text-green-700',  next: 'ferme' },
  ferme:    { label: 'Fermé',    cls: 'bg-slate-100 text-slate-600' },
}

const STATUTS: Statut[] = ['ouvert', 'en_cours', 'resolu', 'ferme']

export default function SupportAdminPage() {
  const role = localStorage.getItem('role')
  if (role !== 'superadmin') return (
    <div className="py-20 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[56px] block mb-3 opacity-30">lock</span>
      <p className="text-headline-md">Accès réservé au Super Administrateur</p>
    </div>
  )

  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats]     = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [filterStatut, setFilterStatut]   = useState<string>('tous')
  const [filterPriorite, setFilterPriorite] = useState<string>('tous')
  const [search, setSearch]   = useState('')

  // Ticket ouvert pour répondre
  const [selected, setSelected]   = useState<Ticket | null>(null)
  const [reponse, setReponse]     = useState('')
  const [newStatut, setNewStatut] = useState<Statut>('en_cours')
  const [saving, setSaving]       = useState(false)
  const [saveOk, setSaveOk]       = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const params: Record<string, string> = {}
      if (filterStatut !== 'tous')    params.statut   = filterStatut
      if (filterPriorite !== 'tous')  params.priorite = filterPriorite
      if (search)                     params.search   = search
      const [tRes, sRes] = await Promise.all([
        api.get('/support', { params }),
        api.get('/support/stats'),
      ])
      setTickets(tRes.data.data || [])
      setStats(sRes.data.data)
    } catch {
      setTickets([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [filterStatut, filterPriorite])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); load() }

  const openTicket = (t: Ticket) => {
    setSelected(t)
    setReponse(t.reponse || '')
    setNewStatut(t.statut)
    setSaveOk(false)
  }

  const handleSave = async () => {
    if (!selected) return
    setSaving(true)
    try {
      const r = await api.patch(`/support/${selected.id}`, {
        statut: newStatut,
        reponse: reponse.trim() || null,
      })
      const updated = r.data.data as Ticket
      setSelected(updated)
      setTickets(prev => prev.map(t => t.id === updated.id ? updated : t))
      setSaveOk(true)
      setTimeout(() => setSaveOk(false), 2000)
    } catch {}
    finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce ticket définitivement ?')) return
    await api.delete(`/support/${id}`).catch(() => {})
    setTickets(prev => prev.filter(t => t.id !== id))
    if (selected?.id === id) setSelected(null)
    if (stats) setStats(s => s ? { ...s, total: s.total - 1 } : s)
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-headline-lg text-on-surface">Support — Toutes les demandes</h2>
        <p className="text-body-md text-on-surface-variant">Répondez aux demandes des utilisateurs de tous les clubs.</p>
      </div>

      {/* Compteurs */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
          {[
            { label: 'Total',    value: stats.total,    cls: 'text-on-surface' },
            { label: 'Ouverts',  value: stats.ouvert,   cls: 'text-blue-600' },
            { label: 'En cours', value: stats.en_cours, cls: 'text-orange-500' },
            { label: 'Résolus',  value: stats.resolu,   cls: 'text-green-600' },
            { label: 'Fermés',   value: stats.ferme,    cls: 'text-slate-500' },
          ].map(s => (
            <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
              <p className={`text-headline-lg font-black ${s.cls}`}>{s.value}</p>
              <p className="text-label-md text-on-surface-variant">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-5">
        {/* Liste */}
        <div className="flex-1 min-w-0">
          {/* Filtres */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-4 flex flex-wrap gap-3 items-center">
            <form onSubmit={handleSearch} className="relative flex-1 min-w-[180px]">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher…"
                className="w-full pl-9 pr-4 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </form>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-label-md text-on-surface-variant self-center">Statut :</span>
              {(['tous', ...STATUTS] as const).map(s => (
                <button key={s} onClick={() => setFilterStatut(s)}
                  className={`px-3 py-1.5 rounded-full text-label-md transition-all ${filterStatut === s ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'}`}>
                  {s === 'tous' ? 'Tous' : STATUT_CFG[s as Statut].label}
                </button>
              ))}
            </div>
            <div className="flex gap-1.5 flex-wrap">
              <span className="text-label-md text-on-surface-variant self-center">Priorité :</span>
              {(['tous', 'urgent', 'haute', 'normal'] as const).map(p => (
                <button key={p} onClick={() => setFilterPriorite(p)}
                  className={`px-3 py-1.5 rounded-full text-label-md transition-all ${filterPriorite === p ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant'}`}>
                  {p === 'tous' ? 'Toutes' : PRIORITE_CFG[p as Priorite].label}
                </button>
              ))}
            </div>
          </div>

          {/* Tableau des tickets */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {loading ? (
              <div className="p-6 space-y-3">{[1,2,3,4].map(i => <div key={i} className="h-14 bg-surface-container-low rounded animate-pulse" />)}</div>
            ) : tickets.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">inbox</span>
                <p className="text-headline-md">Aucun ticket</p>
                <p className="text-body-md">Aucune demande ne correspond aux filtres.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {tickets.map(t => {
                  const pCfg = PRIORITE_CFG[t.priorite]
                  const sCfg = STATUT_CFG[t.statut]
                  const isActive = selected?.id === t.id
                  return (
                    <div key={t.id}
                      className={`px-5 py-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-surface-container-low/50 ${isActive ? 'bg-primary/5 border-l-4 border-primary' : ''}`}
                      onClick={() => openTicket(t)}>
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${pCfg.dotCls}`} title={pCfg.label} />
                      <div className="flex-1 min-w-0">
                        <p className="text-label-lg text-on-surface truncate">{t.sujet}</p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          {t.auteur && (
                            <span className="text-body-sm text-on-surface-variant truncate">
                              {t.auteur.prenom} {t.auteur.nom}
                              {t.club && <span className="ml-1 opacity-70">· {t.club.nom}</span>}
                            </span>
                          )}
                          <span className="text-body-sm text-on-surface-variant">
                            {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${pCfg.badgeCls}`}>{pCfg.label}</span>
                        <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${sCfg.cls}`}>{sCfg.label}</span>
                        <button onClick={e => { e.stopPropagation(); handleDelete(t.id) }}
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-error transition-colors ml-1">
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Panneau de réponse */}
        {selected && (
          <div className="w-full lg:w-[440px] shrink-0">
            <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden sticky top-4">
              {/* Header */}
              <div className="px-5 py-4 border-b border-[#e8e8f0] flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-label-lg font-bold text-on-surface">{selected.sujet}</p>
                  {selected.auteur && (
                    <p className="text-body-sm text-on-surface-variant mt-0.5">
                      {selected.auteur.prenom} {selected.auteur.nom} · {selected.auteur.email}
                      {selected.club && <span className="ml-1">· {selected.club.nom}</span>}
                    </p>
                  )}
                  <p className="text-body-sm text-on-surface-variant">
                    {new Date(selected.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <button onClick={() => setSelected(null)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors shrink-0">
                  <span className="material-symbols-outlined text-[18px]">close</span>
                </button>
              </div>

              <div className="p-5 space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Badges priorité/statut */}
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2.5 py-1 rounded-full text-label-md font-semibold ${PRIORITE_CFG[selected.priorite].badgeCls}`}>
                    {PRIORITE_CFG[selected.priorite].label}
                  </span>
                  <span className={`px-2.5 py-1 rounded-full text-label-md font-semibold ${STATUT_CFG[selected.statut].cls}`}>
                    {STATUT_CFG[selected.statut].label}
                  </span>
                </div>

                {/* Message utilisateur */}
                <div className="bg-surface-container-low rounded-lg p-4">
                  <p className="text-label-md text-on-surface-variant mb-2 flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">person</span>
                    Message de l'utilisateur
                  </p>
                  <p className="text-body-md text-on-surface whitespace-pre-wrap">{selected.message}</p>
                </div>

                {/* Changer le statut */}
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Statut</label>
                  <div className="grid grid-cols-2 gap-2">
                    {STATUTS.map(s => (
                      <button key={s} type="button" onClick={() => setNewStatut(s)}
                        className={`py-2 px-3 rounded-lg border-2 text-label-md font-semibold transition-all ${
                          newStatut === s ? STATUT_CFG[s].cls + ' border-current' : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                        }`}>
                        {STATUT_CFG[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Réponse */}
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">support_agent</span>
                    Votre réponse
                  </label>
                  <textarea value={reponse} onChange={e => setReponse(e.target.value)}
                    rows={6} placeholder="Rédigez votre réponse ici…"
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary resize-none transition-all" />
                </div>

                {/* Réponse précédente */}
                {selected.repondant && selected.reponse && (
                  <div className="text-body-sm text-on-surface-variant flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    Dernière réponse par {selected.repondant.prenom} {selected.repondant.nom}
                  </div>
                )}

                <button onClick={handleSave} disabled={saving}
                  className="w-full py-3 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {saving
                    ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <span className="material-symbols-outlined text-[20px]">{saveOk ? 'check' : 'save'}</span>
                  }
                  {saveOk ? 'Enregistré !' : saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
