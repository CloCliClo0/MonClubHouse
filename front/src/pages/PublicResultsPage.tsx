import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import api from '../services/api'

// ── Types ─────────────────────────────────────────────────────────────────────

type ClubSummary = { id: number; nom: string; logo?: string | null; ville?: string | null; couleur_primaire?: string | null; actif: boolean }

type Category = { id: number; nom: string; couleur?: string }
type Sport = { id: number; nom: string }

type Equipe = {
  id: number; nom: string; genre: string; format: string
  couleur_maillot?: string | null
  categorie?: Category | null
  sport?: Sport | null
}

type Terrain = { id: number; nom: string; type: string; adresse?: string | null }

type ClubDetail = {
  id: number; nom: string; logo?: string | null; description?: string | null
  adresse?: string | null; ville?: string | null; code_postal?: string | null
  telephone?: string | null; email?: string | null; site_web?: string | null
  couleur_primaire?: string | null; couleur_secondaire?: string | null
  equipes?: Equipe[]
  terrains?: Terrain[]
}

type Match = {
  id: number
  adversaire: string
  date: string
  score_equipe: number | null
  score_adversaire: number | null
  statut: string
  domicile_exterieur: string
  championnat: string | null
  equipe?: { nom: string; categorie?: { id: number; nom: string } | null }
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

function normalizeUrl(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `https://${url}`
}

// ── En-tête public (commun aux deux vues) ────────────────────────────────────

function PublicHeader({ clubName, clubLogo, backLink }: { clubName: string; clubLogo?: string | null; backLink?: string }) {
  return (
    <header className="bg-[#2b2d42] text-white sticky top-0 z-50">
      <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {backLink && (
            <Link to={backLink} className="text-white/60 hover:text-white shrink-0" title="Retour">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
          )}
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-black text-sm overflow-hidden shrink-0">
            {clubLogo ? <img src={clubLogo} alt="" className="w-full h-full object-cover" /> : clubName.slice(0, 3).toUpperCase()}
          </div>
          <div className="min-w-0">
            <span className="font-bold text-base leading-none block truncate">{clubName}</span>
            <span className="text-white/50 text-[11px] uppercase tracking-widest">Page publique</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link to="/login" className="px-4 py-2 text-white/70 hover:text-white text-label-lg transition-colors">
            Se connecter
          </Link>
          <Link to="/register" className="px-4 py-2 bg-primary rounded-lg text-white text-label-lg hover:bg-primary-container transition-colors">
            Rejoindre le club
          </Link>
        </div>
      </div>
    </header>
  )
}

// ── Vue 1 : choisir un club ───────────────────────────────────────────────────

function ClubPicker() {
  const [clubs, setClubs]     = useState<ClubSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')

  useEffect(() => {
    api.get('/clubs').then(r => setClubs((r.data.data || []).filter((c: ClubSummary) => c.actif)))
      .catch(() => setClubs([]))
      .finally(() => setLoading(false))
  }, [])

  const filtered = clubs.filter(c =>
    `${c.nom} ${c.ville || ''}`.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      <PublicHeader clubName="MonClubHouse" />

      <div className="bg-[#2b2d42]">
        <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-14">
          <h1 className="text-display-lg text-white mb-2">Trouvez votre club</h1>
          <p className="text-white/60 text-body-lg">Infos, équipes et résultats — sans compte, en accès libre.</p>
          <div className="mt-6 relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-[20px]">search</span>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher un club, une ville…"
              className="w-full pl-10 pr-4 py-2.5 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 text-body-md"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-6 -mt-6 pb-12">
        <div className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-sm p-6">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-20 bg-surface-container-low rounded-xl animate-pulse" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-on-surface-variant">
              <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">home_work</span>
              <p className="text-headline-md text-on-surface mb-1">Aucun club trouvé</p>
              <p className="text-body-md">{search ? 'Essayez une autre recherche.' : 'Aucun club publié pour le moment.'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map(c => (
                <Link key={c.id} to={`/resultats-club/${c.id}`}
                  className="flex items-center gap-3 p-4 border border-[#e8e8f0] rounded-xl hover:border-primary/40 hover:shadow-sm transition-all">
                  <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center text-white font-black text-sm shrink-0"
                    style={{ backgroundColor: c.couleur_primaire || '#0f5238' }}>
                    {c.logo ? <img src={c.logo} alt="" className="w-full h-full object-cover" /> : c.nom.slice(0, 3).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-label-lg text-on-surface truncate">{c.nom}</p>
                    {c.ville && <p className="text-body-sm text-on-surface-variant truncate">{c.ville}</p>}
                  </div>
                  <span className="material-symbols-outlined ml-auto text-on-surface-variant/40 shrink-0">chevron_right</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vue 2 : page publique d'un club ───────────────────────────────────────────

type Tab = 'infos' | 'equipes' | 'resultats'

function ClubPublicPage({ clubId }: { clubId: string }) {
  const [tab, setTab]         = useState<Tab>('infos')
  const [club, setClub]       = useState<ClubDetail | null>(null)
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [search, setSearch]       = useState('')
  const [catFilter, setCatFilter] = useState('Toutes')

  useEffect(() => {
    setLoading(true)
    Promise.all([
      api.get(`/clubs/${clubId}`).catch(() => null),
      fetch(`/api/resultats?club_id=${clubId}&limit=100`).then(r => r.ok ? r.json() : { data: [] }).catch(() => ({ data: [] })),
    ]).then(([cRes, rRes]) => {
      if (!cRes?.data?.data) { setNotFound(true); return }
      setClub(cRes.data.data)
      setMatches((rRes.data || []).filter((m: Match) => m.statut === 'termine'))
    }).finally(() => setLoading(false))
  }, [clubId])

  const wins   = matches.filter(m => getResult(m) === 'Victoire').length
  const draws  = matches.filter(m => getResult(m) === 'Nul').length
  const losses = matches.filter(m => getResult(m) === 'Défaite').length

  const cats = ['Toutes', ...Array.from(new Set(matches.map(m => m.equipe?.categorie?.nom).filter(Boolean)))] as string[]
  const filteredMatches = matches.filter(m => {
    const s = search.trim().toLowerCase()
    const matchesCat = catFilter === 'Toutes' || m.equipe?.categorie?.nom === catFilter
    const matchesSearch = !s ||
      m.adversaire?.toLowerCase().includes(s) ||
      m.equipe?.nom?.toLowerCase().includes(s) ||
      m.championnat?.toLowerCase().includes(s)
    return matchesCat && matchesSearch
  })

  const equipesByCategorie = (club?.equipes || []).reduce((acc, eq) => {
    const key = eq.categorie?.nom || 'Sans catégorie'
    if (!acc[key]) acc[key] = []
    acc[key].push(eq)
    return acc
  }, {} as Record<string, Equipe[]>)

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f4f4f6]">
        <PublicHeader clubName="MonClubHouse" backLink="/resultats-club" />
        <div className="max-w-[1100px] mx-auto px-6 py-10 space-y-4">
          <div className="h-32 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
          <div className="h-64 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
        </div>
      </div>
    )
  }

  if (notFound || !club) {
    return (
      <div className="min-h-screen bg-[#f4f4f6]">
        <PublicHeader clubName="MonClubHouse" backLink="/resultats-club" />
        <div className="max-w-[1100px] mx-auto px-6 py-20 text-center text-on-surface-variant">
          <span className="material-symbols-outlined text-[56px] opacity-20 block mb-4">home_work</span>
          <p className="text-headline-md text-on-surface mb-2">Club introuvable</p>
          <Link to="/resultats-club" className="text-primary hover:underline">← Retour à la liste des clubs</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      <PublicHeader clubName={club.nom} clubLogo={club.logo} backLink="/resultats-club" />

      {/* Hero */}
      <div className="bg-[#2b2d42]">
        <div className="max-w-[1100px] mx-auto px-6 pt-10 pb-14">
          <h1 className="text-display-lg text-white mb-2">{club.nom}</h1>
          <p className="text-white/60 text-body-lg">{[club.ville, club.description?.slice(0, 80)].filter(Boolean).join(' · ') || 'Bienvenue sur la page publique du club.'}</p>

          {matches.length > 0 && (
            <div className="grid grid-cols-3 gap-4 mt-6 max-w-sm">
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
      <div className="max-w-[1100px] mx-auto px-6 -mt-6 pb-12">
        <div className="bg-white rounded-2xl border border-[#e8e8f0] overflow-hidden shadow-sm">
          <div className="flex items-center border-b border-[#e8e8f0] px-4 overflow-x-auto">
            {([['infos', 'info', 'Infos'], ['equipes', 'sports_soccer', 'Équipes'], ['resultats', 'scoreboard', 'Résultats']] as [Tab, string, string][]).map(([key, icon, label]) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-2 px-6 py-4 text-label-lg whitespace-nowrap transition-all ${
                  tab === key ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
                }`}>
                <span className="material-symbols-outlined text-[18px]">{icon}</span>
                {label}
              </button>
            ))}
          </div>

          {/* Infos */}
          {tab === 'infos' && (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                {[
                  { icon: 'location_on', label: 'Adresse', value: [club.adresse, club.code_postal, club.ville].filter(Boolean).join(', ') },
                  { icon: 'phone', label: 'Téléphone', value: club.telephone },
                  { icon: 'mail', label: 'Email', value: club.email },
                ].map(item => item.value && (
                  <div key={item.label} className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                    </div>
                    <div>
                      <p className="text-label-md text-on-surface-variant">{item.label}</p>
                      <p className="text-body-md text-on-surface">{item.value}</p>
                    </div>
                  </div>
                ))}
                {club.site_web && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">public</span>
                    </div>
                    <div>
                      <p className="text-label-md text-on-surface-variant">Site web</p>
                      <a href={normalizeUrl(club.site_web)} target="_blank" rel="noopener noreferrer"
                        className="text-body-md text-primary hover:underline break-all">
                        {club.site_web}
                      </a>
                    </div>
                  </div>
                )}
                {club.terrains && club.terrains.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg shrink-0">
                      <span className="material-symbols-outlined text-primary text-[18px]">stadium</span>
                    </div>
                    <div>
                      <p className="text-label-md text-on-surface-variant mb-1">Terrains</p>
                      <div className="space-y-0.5">
                        {club.terrains.map(t => (
                          <p key={t.id} className="text-body-md text-on-surface">{t.nom}{t.adresse ? ` — ${t.adresse}` : ''}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant mb-2">Description</p>
                <p className="text-body-md text-on-surface-variant leading-relaxed whitespace-pre-line">
                  {club.description || 'Aucune description renseignée.'}
                </p>
              </div>
            </div>
          )}

          {/* Équipes */}
          {tab === 'equipes' && (
            <div className="p-6">
              {!club.equipes || club.equipes.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">sports_soccer</span>
                  <p className="text-headline-md text-on-surface mb-1">Aucune équipe publiée</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(equipesByCategorie).map(([catName, eqs]) => (
                    <div key={catName}>
                      <p className="text-label-lg font-bold text-on-surface mb-3 flex items-center gap-2">
                        {eqs[0].categorie?.couleur && <span className="w-2.5 h-2.5 rounded-full" style={{ background: eqs[0].categorie.couleur }} />}
                        {catName}
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {eqs.map(eq => (
                          <div key={eq.id} className="flex items-center gap-3 p-3 border border-[#e8e8f0] rounded-xl">
                            <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                              style={{ backgroundColor: eq.couleur_maillot || '#0f5238' }}>
                              {eq.nom.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-label-lg text-on-surface truncate">{eq.nom}</p>
                              <p className="text-body-sm text-on-surface-variant">
                                {eq.genre} {eq.format !== 'autre' ? `· ${eq.format}v${eq.format}` : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Résultats */}
          {tab === 'resultats' && (
            <div className="p-6">
              <div className="mb-5 relative max-w-md">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-[20px]">search</span>
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Rechercher un adversaire, équipe, compétition…"
                  className="w-full pl-10 pr-4 py-2.5 border border-outline-variant rounded-xl focus:outline-none focus:border-primary text-body-md"
                />
              </div>
              {cats.length > 2 && (
                <div className="flex gap-2 flex-wrap mb-5">
                  {cats.map(cat => (
                    <button key={cat} onClick={() => setCatFilter(cat)}
                      className={`px-3 py-1.5 rounded-full text-label-md transition-all ${
                        catFilter === cat ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant border border-outline-variant hover:border-primary/40'
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
              {filteredMatches.length === 0 ? (
                <div className="py-16 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">sports_soccer</span>
                  <p className="text-headline-md text-on-surface mb-1">{search ? 'Aucun résultat pour cette recherche' : 'Aucun résultat disponible'}</p>
                  <p className="text-body-md">Les résultats apparaîtront ici une fois les matchs joués.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredMatches.map(m => {
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
                              {m.championnat || m.equipe?.categorie?.nom} • {new Date(m.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
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
        </div>

        {/* CTA */}
        <div className="mt-8 bg-white border border-[#e8e8f0] rounded-2xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
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

// ── Page ──────────────────────────────────────────────────────────────────────

export default function PublicResultsPage() {
  const { clubId } = useParams<{ clubId?: string }>()
  return clubId ? <ClubPublicPage clubId={clubId} /> : <ClubPicker />
}
