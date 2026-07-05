import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { getApiErrorMessage } from '../services/api'

type Category = { id: number; nom: string; couleur: string }

type Team = {
  id: number
  nom: string
  categorie?: Category | null
  genre: string
  format: string
  couleur_maillot: string
  coach?: { nom: string; prenom: string }
  _count?: { licencies: number }
  players_count?: number
  actif: boolean
}

type InviteCodeRow = {
  id: number; code: string; role: string; label: string | null; categorie: string | null
  max_uses: number; uses_count: number; actif: boolean
}

const CODE_ROLE_OPTIONS: Record<string, { v: string; l: string }[]> = {
  coach: [{ v: 'joueur', l: 'Joueur' }, { v: 'parent', l: 'Parent' }],
  admin: [{ v: 'dirigeant', l: 'Dirigeant' }, { v: 'coach', l: 'Coach' }, { v: 'joueur', l: 'Joueur' }, { v: 'parent', l: 'Parent' }],
}

export default function TeamsPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'joueur'
  // Un dirigeant ne peut plus créer de code (réservé admin/superadmin/coach, voir back/routes/codes.js)
  const canCreateCodes = ['admin', 'coach'].includes(role)

  const [teams, setTeams]     = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [filter, setFilter]   = useState('Tous')

  // Codes d'invitation — un code cible toujours une CATÉGORIE entière (toutes ses équipes),
  // jamais une équipe précise.
  const [showCodes, setShowCodes]         = useState(false)
  const [codeCategories, setCodeCategories] = useState<Category[]>([])
  const [codes, setCodes]                 = useState<InviteCodeRow[]>([])
  const [loadingCodes, setLoadingCodes]   = useState(false)
  const [codeForm, setCodeForm]           = useState({ categorie: '', role: 'joueur', label: '', max_uses: '50' })
  const [codeSaving, setCodeSaving]       = useState(false)
  const [codeError, setCodeError]         = useState('')
  const [copiedCodeId, setCopiedCodeId]   = useState<number | null>(null)

  useEffect(() => {
    api.get('/equipes')
      .then(r => setTeams(r.data.data || []))
      .catch(() => setTeams([]))
      .finally(() => setLoading(false))
  }, [])

  const loadCodes = () => {
    setLoadingCodes(true)
    api.get('/codes').then(r => setCodes(r.data.data || [])).catch(() => setCodes([])).finally(() => setLoadingCodes(false))
  }

  const openCodesModal = () => {
    setShowCodes(true)
    setCodeError('')
    const catEndpoint = role === 'coach' ? '/equipes/categories-coach' : '/categories'
    api.get(catEndpoint).then(r => setCodeCategories(r.data.data || [])).catch(() => setCodeCategories([]))
    loadCodes()
  }

  const createCode = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!codeForm.categorie) { setCodeError('Choisissez une catégorie.'); return }
    setCodeSaving(true)
    setCodeError('')
    try {
      await api.post('/codes', {
        categorie: codeForm.categorie,
        role: codeForm.role,
        label: codeForm.label || undefined,
        max_uses: parseInt(codeForm.max_uses),
      })
      setCodeForm(f => ({ ...f, label: '' }))
      loadCodes()
    } catch (err: any) {
      setCodeError(getApiErrorMessage(err))
    } finally {
      setCodeSaving(false)
    }
  }

  const disableCode = async (id: number) => {
    await api.patch(`/codes/${id}/disable`).catch(() => {})
    loadCodes()
  }

  const shareCode = (c: InviteCodeRow) => {
    const appUrl = window.location.origin
    const label  = c.label || c.categorie || 'votre catégorie'
    const link   = `${appUrl}/register?code=${c.code}`
    const text   = `🏆 Rejoignez ${label} sur MonClubHouse !\n\nCliquez sur ce lien pour vous inscrire directement (${c.role}) :\n${link}`

    if (navigator.share) {
      navigator.share({ title: 'Code MonClubHouse', text, url: link }).catch(() => {})
    } else {
      navigator.clipboard.writeText(text)
      setCopiedCodeId(c.id)
      setTimeout(() => setCopiedCodeId(null), 2000)
    }
  }

  const categories = ['Tous', ...Array.from(new Set(
    teams.map(t => t.categorie?.nom).filter((n): n is string => Boolean(n))
  ))]

  const filtered = teams.filter(t => {
    const matchSearch = t.nom.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'Tous' || t.categorie?.nom === filter
    return matchSearch && matchFilter
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Équipes</h2>
          <p className="text-body-md text-on-surface-variant">Gérez vos équipes et leurs compositions</p>
        </div>
        <div className="flex items-center gap-2">
          {canCreateCodes && (
            <button onClick={openCodesModal}
              className="flex items-center gap-2 border border-outline-variant px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
              <span className="material-symbols-outlined text-[20px]">key</span>
              <span className="hidden sm:inline">Codes d'invitation</span>
              <span className="sm:hidden">Codes</span>
            </button>
          )}
          <button onClick={() => navigate('/equipes/creer')}
            className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
            <span className="material-symbols-outlined text-[20px]">add</span>
            Nouvelle équipe
          </button>
        </div>
      </div>

      {/* Filtres */}
      <div className="bg-white border border-[#e8e8f0] rounded-lg p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
            placeholder="Rechercher une équipe…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              className={`px-4 py-2 rounded-full text-label-md transition-all ${
                filter === cat ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="bg-white border border-[#e8e8f0] rounded-xl h-48 animate-pulse" />
          ))}
        </div>
      )}

      {/* Vide */}
      {!loading && filtered.length === 0 && (
        <div className="text-center py-20 bg-white border border-[#e8e8f0] rounded-xl">
          <span className="material-symbols-outlined text-[56px] text-on-surface-variant/30 block mb-4">sports_soccer</span>
          <p className="text-headline-md text-on-surface mb-2">
            {teams.length === 0 ? 'Aucune équipe créée' : 'Aucune équipe trouvée'}
          </p>
          <p className="text-body-md text-on-surface-variant mb-6">
            {teams.length === 0 ? 'Commencez par créer votre première équipe.' : 'Essayez un autre filtre.'}
          </p>
          {teams.length === 0 && (
            <button onClick={() => navigate('/equipes/creer')} className="bg-primary text-white px-6 py-3 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              Créer une équipe
            </button>
          )}
        </div>
      )}

      {/* Grille */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map(team => (
            <div key={team.id}
              className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`/equipes/${team.id}`)}>
              <div className="h-2" style={{ backgroundColor: team.couleur_maillot || '#0f5238' }} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-headline-md text-on-surface">{team.nom}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {team.categorie && (
                        <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">{team.categorie.nom}</span>
                      )}
                      <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">{team.genre}</span>
                      <span className="px-2 py-0.5 bg-surface-container-low text-on-surface-variant rounded text-label-md">{team.format}v{team.format}</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{ backgroundColor: team.couleur_maillot || '#0f5238' }}>
                    {team.nom.slice(0, 2).toUpperCase()}
                  </div>
                </div>
                <div className="space-y-2 mb-4">
                  {team.coach && (
                    <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px]">person</span>
                      Coach : <span className="text-on-surface font-medium">{team.coach.prenom} {team.coach.nom}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-[16px]">groups</span>
                    <span className="text-on-surface font-medium">{team.players_count ?? team._count?.licencies ?? 0} joueur(s)</span>
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-[#e8e8f0]">
                  <span className={`flex items-center gap-1.5 text-label-md ${team.actif ? 'text-primary' : 'text-on-surface-variant'}`}>
                    <span className={`w-2 h-2 rounded-full ${team.actif ? 'bg-primary' : 'bg-on-surface-variant'}`} />
                    {team.actif ? 'Actif' : 'Inactif'}
                  </span>
                  <span className="text-primary text-label-md flex items-center gap-1">
                    Voir l'équipe
                    <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal codes d'invitation — cible toujours une catégorie entière, jamais une équipe précise */}
      {showCodes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowCodes(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between shrink-0">
              <div>
                <h3 className="text-headline-md">Codes d'invitation</h3>
                <p className="text-body-sm text-on-surface-variant mt-0.5">Un code rattache le joueur/parent à toute la catégorie (toutes ses équipes).</p>
              </div>
              <button onClick={() => setShowCodes(false)}><span className="material-symbols-outlined text-on-surface-variant">close</span></button>
            </div>

            <form onSubmit={createCode} className="p-5 border-b border-[#e8e8f0] space-y-3 shrink-0">
              {codeError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg text-body-sm">
                  <span className="material-symbols-outlined text-[16px]">error</span>{codeError}
                </div>
              )}
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Catégorie *</label>
                <select value={codeForm.categorie} onChange={e => setCodeForm(f => ({ ...f, categorie: e.target.value }))}
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                  <option value="">Sélectionner une catégorie</option>
                  {codeCategories.map(c => <option key={c.id} value={c.nom}>{c.nom}</option>)}
                </select>
                {codeCategories.length === 0 && (
                  <p className="text-body-sm text-error">
                    {role === 'coach' ? "Vous n'encadrez aucune catégorie pour l'instant." : "Ce club n'a aucune catégorie."}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Rôle</label>
                  <select value={codeForm.role} onChange={e => setCodeForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                    {(CODE_ROLE_OPTIONS[role] || CODE_ROLE_OPTIONS.coach).map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Utilisations max</label>
                  <input type="number" min="1" max="500" value={codeForm.max_uses}
                    onChange={e => setCodeForm(f => ({ ...f, max_uses: e.target.value }))}
                    className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Libellé (optionnel)</label>
                <input value={codeForm.label} onChange={e => setCodeForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Ex : Saison 2025-26"
                  className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
              </div>
              <button type="submit" disabled={codeSaving || !codeForm.categorie}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
                {codeSaving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                <span className="material-symbols-outlined text-[18px]">add</span>
                Générer un code
              </button>
            </form>

            <div className="flex-1 overflow-y-auto divide-y divide-[#e8e8f0]">
              {loadingCodes ? (
                <div className="p-5 space-y-2">{[1, 2].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
              ) : codes.length === 0 ? (
                <div className="py-10 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[36px] block mb-2 opacity-30">key_off</span>
                  <p className="text-body-md">Aucun code pour l'instant.</p>
                </div>
              ) : (
                codes.map(c => (
                  <div key={c.id} className={`px-5 py-3 flex items-center gap-3 flex-wrap ${!c.actif ? 'opacity-50' : ''}`}>
                    <span className="font-mono font-bold tracking-widest bg-surface-container-low px-2.5 py-1 rounded-lg text-body-sm">{c.code}</span>
                    <button onClick={() => { navigator.clipboard.writeText(c.code); setCopiedCodeId(c.id); setTimeout(() => setCopiedCodeId(null), 2000) }}
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-surface-container-low text-on-surface-variant transition-colors">
                      <span className="material-symbols-outlined text-[16px]">{copiedCodeId === c.id ? 'check' : 'content_copy'}</span>
                    </button>
                    <button onClick={() => shareCode(c)} title="Partager via SMS / réseaux"
                      className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-green-50 text-green-600 transition-colors">
                      <span className="material-symbols-outlined text-[16px]">share</span>
                    </button>
                    <span className="px-2 py-0.5 rounded-full text-label-md bg-green-100 text-green-700">{c.role}</span>
                    {c.categorie && <span className="px-2 py-0.5 rounded-full text-label-md bg-blue-100 text-blue-700">{c.categorie}</span>}
                    {c.label && <span className="text-body-sm text-on-surface-variant italic">{c.label}</span>}
                    <span className="text-[11px] text-on-surface-variant ml-auto">{c.uses_count}/{c.max_uses}</span>
                    {c.actif && (
                      <button onClick={() => disableCode(c.id)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-on-surface-variant hover:text-error transition-colors" title="Désactiver">
                        <span className="material-symbols-outlined text-[16px]">block</span>
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
