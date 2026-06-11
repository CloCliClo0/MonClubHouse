import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type Player = {
  id: number
  name: string
  number: number
  position: string
  x: number
  y: number
}

type BenchPlayer = {
  id: number
  name: string
  number: number
  position: string
}

type ApiMatch = {
  id: number
  date: string
  heure_rdv: string | null
  adversaire: string | null
  lieu: string | null
  type: string
  championnat: string | null
  statut: string
  equipe: { id: number; nom: string; categorie: string }
  terrain: { id: number; nom: string; adresse: string } | null
}

type MatchDisplay = {
  id: number
  label: string
  date: string
  equipe: string
  terrain: string
  competition: string
  type: string
}

const TYPE_LABELS: Record<string, string> = {
  match:   'Match',
  tournoi: 'Tournoi',
  coupe:   'Coupe',
  amical:  'Amical',
  plateau: 'Plateau',
}

const TYPE_ICONS: Record<string, string> = {
  match:   'sports_soccer',
  tournoi: 'emoji_events',
  coupe:   'military_tech',
  amical:  'handshake',
  plateau: 'stadium',
}

const COMPETITION_TYPES = new Set(['match', 'tournoi', 'coupe', 'amical', 'plateau'])

function formatDate(date: string, heure: string | null): string {
  const d = new Date(date)
  const label = d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })
  return heure ? `${label} · ${heure.slice(0, 5)}` : label
}

function toDisplay(m: ApiMatch): MatchDisplay {
  return {
    id:          m.id,
    label:       m.adversaire ? `${m.equipe.nom} vs ${m.adversaire}` : m.equipe.nom,
    date:        formatDate(m.date, m.heure_rdv),
    equipe:      m.equipe.nom,
    terrain:     m.terrain?.nom ?? m.lieu ?? '—',
    competition: m.championnat ?? TYPE_LABELS[m.type] ?? m.type,
    type:        m.type,
  }
}

type ConvoquedPlayer = {
  userId: number
  nom: string
  prenom: string
  statut: string
  numero_maillot: number | null
  poste: string | null
}

const FIELD_POSITIONS: Record<string, Omit<Player, 'name' | 'number'>[]> = {
  '4-3-3': [
    { id: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  position: 'DG',  x: 15, y: 70 },
    { id: 3,  position: 'DCG', x: 35, y: 73 },
    { id: 4,  position: 'DCD', x: 65, y: 73 },
    { id: 5,  position: 'DD',  x: 85, y: 70 },
    { id: 6,  position: 'MG',  x: 20, y: 50 },
    { id: 7,  position: 'MC',  x: 50, y: 52 },
    { id: 8,  position: 'MD',  x: 80, y: 50 },
    { id: 9,  position: 'AG',  x: 20, y: 28 },
    { id: 10, position: 'AT',  x: 50, y: 22 },
    { id: 11, position: 'AD',  x: 80, y: 28 },
  ],
  '4-4-2': [
    { id: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  position: 'DG',  x: 15, y: 70 },
    { id: 3,  position: 'DCG', x: 35, y: 73 },
    { id: 4,  position: 'DCD', x: 65, y: 73 },
    { id: 5,  position: 'DD',  x: 85, y: 70 },
    { id: 6,  position: 'MG',  x: 20, y: 48 },
    { id: 7,  position: 'MCG', x: 38, y: 48 },
    { id: 8,  position: 'MCD', x: 62, y: 48 },
    { id: 9,  position: 'MD',  x: 80, y: 48 },
    { id: 10, position: 'ATG', x: 38, y: 24 },
    { id: 11, position: 'ATD', x: 62, y: 24 },
  ],
  '4-2-3-1': [
    { id: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  position: 'DG',  x: 15, y: 70 },
    { id: 3,  position: 'DCG', x: 35, y: 73 },
    { id: 4,  position: 'DCD', x: 65, y: 73 },
    { id: 5,  position: 'DD',  x: 85, y: 70 },
    { id: 6,  position: 'MDG', x: 33, y: 56 },
    { id: 7,  position: 'MDD', x: 67, y: 56 },
    { id: 8,  position: 'MC',  x: 50, y: 40 },
    { id: 9,  position: 'MG',  x: 22, y: 33 },
    { id: 10, position: 'MD',  x: 78, y: 33 },
    { id: 11, position: 'AT',  x: 50, y: 20 },
  ],
  '3-5-2': [
    { id: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  position: 'DG',  x: 22, y: 73 },
    { id: 3,  position: 'DC',  x: 50, y: 76 },
    { id: 4,  position: 'DD',  x: 78, y: 73 },
    { id: 5,  position: 'PG',  x: 10, y: 50 },
    { id: 6,  position: 'MCG', x: 30, y: 50 },
    { id: 7,  position: 'MC',  x: 50, y: 50 },
    { id: 8,  position: 'MCD', x: 70, y: 50 },
    { id: 9,  position: 'PD',  x: 90, y: 50 },
    { id: 10, position: 'ATG', x: 38, y: 24 },
    { id: 11, position: 'ATD', x: 62, y: 24 },
  ],
  '5-3-2': [
    { id: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  position: 'DLG', x: 12, y: 70 },
    { id: 3,  position: 'DCG', x: 30, y: 74 },
    { id: 4,  position: 'DC',  x: 50, y: 77 },
    { id: 5,  position: 'DCD', x: 70, y: 74 },
    { id: 6,  position: 'DLD', x: 88, y: 70 },
    { id: 7,  position: 'MCG', x: 28, y: 50 },
    { id: 8,  position: 'MC',  x: 50, y: 50 },
    { id: 9,  position: 'MCD', x: 72, y: 50 },
    { id: 10, position: 'ATG', x: 36, y: 25 },
    { id: 11, position: 'ATD', x: 64, y: 25 },
  ],
}

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']

function posOrder(poste: string | null): number {
  const p = (poste ?? '').toLowerCase()
  if (p.includes('gard') || p.startsWith('gb') || p === 'g') return 0
  if (p.includes('def') || p.startsWith('d')) return 1
  if (p.includes('mil') || p.startsWith('m')) return 2
  return 3
}

function playerLabel(p: ConvoquedPlayer): string {
  return `${p.prenom.charAt(0)}. ${p.nom}`
}

function buildTeam(convocations: ConvoquedPlayer[], formation: string, mode: CompoMode = 'pre'): { field: Player[]; bench: BenchPlayer[] } {
  const slots = FIELD_POSITIONS[formation]
  const eligible = mode === 'final'
    ? convocations.filter(p => p.statut === 'present')
    : convocations
  const sorted = [...eligible].sort((a, b) => posOrder(a.poste) - posOrder(b.poste))

  const field: Player[] = slots.map((slot, i) => {
    const p = sorted[i]
    return { ...slot, name: p ? playerLabel(p) : '—', number: p?.numero_maillot ?? i + 1 }
  })
  const bench: BenchPlayer[] = sorted.slice(slots.length).map((p, i) => ({
    id: 1000 + i,
    name: playerLabel(p),
    number: p.numero_maillot ?? slots.length + i + 1,
    position: p.poste ?? '—',
  }))
  return { field, bench }
}

function emptyField(formation: string): Player[] {
  return FIELD_POSITIONS[formation].map(slot => ({ ...slot, name: '—', number: 0 }))
}

type CompoMode = 'pre' | 'final'
type Selection = { id: number; source: 'field' | 'bench' }

export default function CompositionPage() {
  const navigate = useNavigate()
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [formation, setFormation]   = useState('4-3-3')
  const [fieldPlayers, setFieldPlayers] = useState<Player[]>(() => emptyField('4-3-3'))
  const [bench, setBench]               = useState<BenchPlayer[]>([])
  const [selected, setSelected]         = useState<Selection | null>(null)
  const [saved, setSaved]               = useState(false)

  const [matches, setMatches]   = useState<MatchDisplay[]>([])
  const [loading, setLoading]   = useState(true)
  const [fetchError, setFetchError] = useState(false)

  const [convocations, setConvocations]       = useState<ConvoquedPlayer[]>([])
  const [rawCounts, setRawCounts]             = useState({ present: 0, incertain: 0, convoque: 0, absent: 0, non_retenu: 0 })
  const [loadingConvocations, setLoadingConvocations] = useState(false)
  const [mode, setMode]                       = useState<CompoMode>('pre')

  useEffect(() => {
    api.get('/matchs?statut=programme')
      .then(r => {
        const list: ApiMatch[] = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        const today = new Date(); today.setHours(0, 0, 0, 0)
        const filtered = list
          .filter(m => COMPETITION_TYPES.has(m.type) && new Date(m.date) >= today)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        setMatches(filtered.map(toDisplay))
      })
      .catch(() => setFetchError(true))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (!selectedMatchId) return
    setLoadingConvocations(true)
    setConvocations([])
    setFieldPlayers(emptyField(formation))
    setBench([])

    api.get(`/matchs/${selectedMatchId}/convocations`)
      .then(r => {
        const list = Array.isArray(r.data) ? r.data : (r.data?.data ?? [])
        // Comptes bruts pour les stats
        const cnt = { present: 0, incertain: 0, convoque: 0, absent: 0, non_retenu: 0 }
        list.forEach((c: any) => { if (c.statut in cnt) cnt[c.statut as keyof typeof cnt]++ })
        setRawCounts(cnt)
        // Joueurs éligibles (sans absents ni non-retenus)
        const eligible: ConvoquedPlayer[] = list
          .filter((c: any) => c.statut !== 'absent' && c.statut !== 'non_retenu')
          .map((c: any) => ({
            userId:         c.joueur.id,
            nom:            c.joueur.nom,
            prenom:         c.joueur.prenom,
            statut:         c.statut,
            numero_maillot: c.joueur.licence?.numero_maillot ?? null,
            poste:          c.joueur.licence?.poste ?? null,
          }))
        setConvocations(eligible)
        setMode('pre')
        const { field, bench } = buildTeam(eligible, formation, 'pre')
        setFieldPlayers(field)
        setBench(bench)
      })
      .catch(() => {})
      .finally(() => setLoadingConvocations(false))
  }, [selectedMatchId])

  const match = matches.find(m => m.id === selectedMatchId)

  const handleModeChange = (newMode: CompoMode) => {
    setMode(newMode)
    const { field, bench } = buildTeam(convocations, formation, newMode)
    setFieldPlayers(field)
    setBench(bench)
    setSelected(null)
  }

  const changeFormation = (f: string) => {
    setFormation(f)
    const { field, bench } = buildTeam(convocations, f, mode)
    setFieldPlayers(field)
    setBench(bench)
    setSelected(null)
  }

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    const { field, bench } = buildTeam(convocations, formation, mode)
    setFieldPlayers(field)
    setBench(bench)
    setSelected(null)
  }

  const handlePlayerClick = (id: number, source: 'field' | 'bench') => {
    // Deselect if same player clicked again
    if (selected?.id === id && selected?.source === source) {
      setSelected(null)
      return
    }

    // No player selected yet → select this one
    if (!selected) {
      setSelected({ id, source })
      return
    }

    // Swap logic
    if (selected.source === 'field' && source === 'field') {
      // Field ↔ Field : échange nom et numéro, les positions restent
      setFieldPlayers(prev => {
        const next = prev.map(p => ({ ...p }))
        const a = next.findIndex(p => p.id === selected.id)
        const b = next.findIndex(p => p.id === id)
        if (a >= 0 && b >= 0) {
          const { name: na, number: nua } = next[a]
          next[a].name = next[b].name
          next[a].number = next[b].number
          next[b].name = na
          next[b].number = nua
        }
        return next
      })
    } else if (selected.source === 'bench' && source === 'bench') {
      // Bench ↔ Bench
      setBench(prev => {
        const next = prev.map(p => ({ ...p }))
        const a = next.findIndex(p => p.id === selected.id)
        const b = next.findIndex(p => p.id === id)
        if (a >= 0 && b >= 0) {
          const { name: na, number: nua } = next[a]
          next[a].name = next[b].name
          next[a].number = next[b].number
          next[b].name = na
          next[b].number = nua
        }
        return next
      })
    } else {
      // Field ↔ Bench : échange complet nom + numéro
      const fieldId = selected.source === 'field' ? selected.id : id
      const benchId = selected.source === 'bench' ? selected.id : id

      const fp = fieldPlayers.find(p => p.id === fieldId)
      const bp = bench.find(p => p.id === benchId)
      if (fp && bp) {
        const { name: fn, number: fnu } = fp
        const { name: bn, number: bnu } = bp
        setFieldPlayers(prev => prev.map(p =>
          p.id === fieldId ? { ...p, name: bn, number: bnu } : p
        ))
        setBench(prev => prev.map(p =>
          p.id === benchId ? { ...p, name: fn, number: fnu } : p
        ))
      }
    }

    setSelected(null)
  }

  const isSelected = (id: number, source: 'field' | 'bench') =>
    selected?.id === id && selected?.source === source

  // ── Sélection du match ────────────────────────────────────────────────────
  if (!selectedMatchId) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-headline-lg text-on-surface">Composition</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Choisissez le match pour lequel préparer la composition</p>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-20 text-on-surface-variant">
            <span className="material-symbols-outlined text-[36px] animate-spin mr-3">progress_activity</span>
            Chargement des matchs…
          </div>
        )}

        {fetchError && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 text-red-700 text-body-sm">
            <span className="material-symbols-outlined text-[20px]">error</span>
            Impossible de charger les matchs. Vérifiez votre connexion.
          </div>
        )}

        {!loading && !fetchError && matches.length === 0 && (
          <div className="flex flex-col items-center py-20 text-on-surface-variant gap-3">
            <span className="material-symbols-outlined text-[48px] opacity-30">sports_soccer</span>
            <p className="text-body-md">Aucun match, tournoi ou coupe à venir.</p>
            <button onClick={() => navigate('/evenements/creer')} className="text-primary hover:underline text-label-md">
              Créer un événement →
            </button>
          </div>
        )}

        {!loading && !fetchError && matches.length > 0 && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map(m => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMatchId(m.id)}
                  className="bg-white border border-[#e8e8f0] rounded-xl p-5 text-left hover:border-primary/50 hover:shadow-md transition-all group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                      <span className="material-symbols-outlined text-[20px]">{TYPE_ICONS[m.type] ?? 'sports_soccer'}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface font-bold truncate">{m.label}</p>
                      <p className="text-body-sm text-on-surface-variant mt-1">{m.date}</p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{m.equipe}</span>
                        <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-label-md">{TYPE_LABELS[m.type] ?? m.type}</span>
                        {m.competition !== TYPE_LABELS[m.type] && (
                          <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{m.competition}</span>
                        )}
                        {m.terrain !== '—' && (
                          <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant flex items-center gap-1">
                            <span className="material-symbols-outlined text-[12px]">location_on</span>
                            {m.terrain}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors shrink-0">arrow_forward</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mt-6 bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-3 text-body-sm text-on-surface-variant">
              <span className="material-symbols-outlined text-primary">info</span>
              Matchs, tournois et coupes à venir ({matches.length}). Les entraînements et réunions n'apparaissent pas ici.
              <button onClick={() => navigate('/evenements/creer')} className="ml-auto text-primary hover:underline text-label-md shrink-0">
                Créer un match →
              </button>
            </div>
          </>
        )}
      </div>
    )
  }

  // ── Chargement des convocations ───────────────────────────────────────────
  if (loadingConvocations) {
    return (
      <div>
        <button
          onClick={() => { setSelectedMatchId(null); setSelected(null) }}
          className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-6 transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Choisir un autre match
        </button>
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
          <p className="text-body-md">Chargement des convocations…</p>
        </div>
      </div>
    )
  }

  // ── Éditeur de composition ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <button onClick={() => { setSelectedMatchId(null); setSelected(null) }}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Choisir un autre match
          </button>
          <h2 className="text-headline-lg text-on-surface">Composition</h2>
          <p className="text-body-md text-on-surface-variant">{match?.label} · {match?.date}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={handleReset}
            className="flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-label-lg transition-colors ${
              saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-container'
            }`}>
            <span className="material-symbols-outlined text-[20px]">{saved ? 'check' : 'save'}</span>
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Chargement des convocations */}
      {loadingConvocations && (
        <div className="mb-4 flex items-center gap-3 bg-surface-container-low border border-outline-variant px-4 py-3 rounded-xl text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-[20px] animate-spin text-primary">progress_activity</span>
          Chargement des joueurs convoqués…
        </div>
      )}

      {!loadingConvocations && convocations.length === 0 && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-xl text-body-sm text-yellow-800">
          <span className="material-symbols-outlined text-yellow-600 text-[20px]">warning</span>
          Aucun joueur convoqué pour ce match. Créez des convocations depuis la page <button onClick={() => navigate('/convocations')} className="underline font-semibold">Convocations</button>.
        </div>
      )}

      {!loadingConvocations && convocations.length > 0 && convocations.length < 11 && (
        <div className="mb-4 flex items-center gap-3 bg-orange-50 border border-orange-200 px-4 py-3 rounded-xl text-body-sm text-orange-800">
          <span className="material-symbols-outlined text-orange-500 text-[20px]">group</span>
          {convocations.length} joueur{convocations.length > 1 ? 's' : ''} convoqué{convocations.length > 1 ? 's' : ''} — il en faut au moins 11 pour compléter le terrain.
        </div>
      )}

      {/* Info match */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
        {[
          { icon: 'sports_soccer', val: match?.label },
          { icon: 'calendar_today', val: match?.date?.split(' · ')[0] },
          { icon: 'schedule', val: match?.date?.split(' · ')[1] },
          { icon: 'location_on', val: match?.terrain !== '—' ? match?.terrain : undefined },
          { icon: 'emoji_events', val: match?.competition },
        ].map((item, i) => item.val && (
          <span key={i} className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">{item.icon}</span>
            {item.val}
          </span>
        ))}
        {convocations.length > 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-primary font-medium">
            <span className="material-symbols-outlined text-[16px]">group</span>
            {convocations.length} convoqué{convocations.length > 1 ? 's' : ''}
          </span>
        )}
        {convocations.length === 0 && (
          <span className="ml-auto flex items-center gap-1.5 text-orange-500 text-label-md">
            <span className="material-symbols-outlined text-[16px]">warning</span>
            Aucune convocation pour ce match
          </span>
        )}
      </div>

      {/* Toggle pré-composition / composition finale */}
      {!loadingConvocations && convocations.length > 0 && (
        <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex rounded-xl border border-outline-variant overflow-hidden">
              <button
                onClick={() => handleModeChange('pre')}
                className={`flex items-center gap-2 px-4 py-2 text-label-md transition-colors ${
                  mode === 'pre' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">edit_calendar</span>
                Pré-composition
              </button>
              <button
                onClick={() => handleModeChange('final')}
                className={`flex items-center gap-2 px-4 py-2 text-label-md transition-colors ${
                  mode === 'final' ? 'bg-primary text-white' : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">group_add</span>
                Composition finale
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {rawCounts.present > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-lg text-label-md">
                  <span className="material-symbols-outlined text-[14px]">check_circle</span>
                  {rawCounts.present} présent{rawCounts.present > 1 ? 's' : ''}
                </span>
              )}
              {rawCounts.incertain > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-orange-50 text-orange-700 rounded-lg text-label-md">
                  <span className="material-symbols-outlined text-[14px]">help</span>
                  {rawCounts.incertain} incertain{rawCounts.incertain > 1 ? 's' : ''}
                </span>
              )}
              {rawCounts.convoque > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-700 rounded-lg text-label-md">
                  <span className="material-symbols-outlined text-[14px]">schedule</span>
                  {rawCounts.convoque} en attente
                </span>
              )}
              {rawCounts.absent > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 rounded-lg text-label-md">
                  <span className="material-symbols-outlined text-[14px]">cancel</span>
                  {rawCounts.absent} absent{rawCounts.absent > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-3">
            {mode === 'pre'
              ? 'Pré-composition : inclut les convoqués en attente de réponse et les incertains.'
              : 'Composition finale : uniquement les joueurs ayant confirmé leur présence.'}
          </p>
          {mode === 'final' && rawCounts.present < 11 && (
            <div className="mt-3 flex items-center gap-2 text-body-sm text-orange-700 bg-orange-50 rounded-xl px-3 py-2">
              <span className="material-symbols-outlined text-[16px]">warning</span>
              Seulement {rawCounts.present} présent{rawCounts.present > 1 ? 's' : ''} confirmé{rawCounts.present > 1 ? 's' : ''} — des postes resteront vides.
            </div>
          )}
        </div>
      )}

      {/* Hint échange */}
      {selected && (
        <div className="mb-4 flex items-center gap-3 bg-yellow-50 border border-yellow-200 px-4 py-3 rounded-xl text-body-sm text-yellow-800">
          <span className="material-symbols-outlined text-yellow-600 text-[20px]">swap_horiz</span>
          <span>
            <strong>{selected.source === 'field'
              ? fieldPlayers.find(p => p.id === selected.id)?.name
              : bench.find(p => p.id === selected.id)?.name
            }</strong> sélectionné — cliquez sur un autre joueur pour l'échanger, ou à nouveau pour désélectionner.
          </span>
          <button onClick={() => setSelected(null)} className="ml-auto text-yellow-600 hover:text-yellow-800">
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terrain */}
        <div className="lg:col-span-2 bg-white border border-[#e8e8f0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-md">Disposition sur le terrain</h3>
            <div className="flex items-center gap-2">
              <span className="text-label-md text-on-surface-variant">Formation :</span>
              <select value={formation} onChange={e => changeFormation(e.target.value)}
                className="border border-outline-variant rounded-lg px-3 py-1.5 text-label-md text-on-surface focus:outline-none focus:border-primary">
                {FORMATIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Pitch */}
          <div className="relative rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#2d6a4f 0%,#1b4332 50%,#2d6a4f 100%)', aspectRatio: '7/10' }}>
            {/* Lignes */}
            <div className="absolute inset-[6%] border-2 border-white/25 rounded" />
            <div className="absolute left-[6%] right-[6%] top-[50%] border-t-2 border-white/25" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full border-2 border-white/25" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
            <div className="absolute left-[25%] right-[25%] top-[6%] h-[14%] border-2 border-white/25 border-t-0" />
            <div className="absolute left-[25%] right-[25%] bottom-[6%] h-[14%] border-2 border-white/25 border-b-0" />
            <div className="absolute left-[38%] right-[38%] top-[5%] h-[3%] border-2 border-white/40 border-t-0 bg-white/10" />
            <div className="absolute left-[38%] right-[38%] bottom-[5%] h-[3%] border-2 border-white/40 border-b-0 bg-white/10" />

            <div className="absolute top-[3%] left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
              {match?.label.split(' vs ')[1]}
            </div>
            <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
              {match?.equipe}
            </div>

            {/* Joueurs sur le terrain */}
            {fieldPlayers.map(p => {
              const sel = isSelected(p.id, 'field')
              const hasSelection = !!selected
              return (
                <button key={p.id} onClick={() => handlePlayerClick(p.id, 'field')}
                  className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                  style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] shadow-lg transition-all ${
                    sel
                      ? 'bg-yellow-400 text-black scale-125 ring-4 ring-yellow-300'
                      : hasSelection
                      ? 'bg-white/90 text-primary ring-2 ring-white/60 scale-105 hover:bg-white hover:scale-110'
                      : 'bg-white/90 text-primary group-hover:bg-white group-hover:scale-110'
                  }`}>
                    {p.number}
                  </div>
                  <div className={`text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap ${
                    sel ? 'bg-yellow-400/90 text-black' : 'bg-black/60 text-white'
                  }`}>
                    {p.name.split(' ').pop()}
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sidebar joueurs */}
        <div className="space-y-4">
          {/* Onze titulaire */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <h4 className="text-headline-md">Onze titulaire</h4>
              <span className="text-label-md text-on-surface-variant">{formation}</span>
            </div>
            <div className="divide-y divide-[#e8e8f0] max-h-[280px] overflow-y-auto">
              {fieldPlayers.map(p => {
                const sel = isSelected(p.id, 'field')
                return (
                  <div key={p.id} onClick={() => handlePlayerClick(p.id, 'field')}
                    className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      sel ? 'bg-yellow-50' : 'hover:bg-surface-container-low'
                    }`}>
                    <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      sel ? 'bg-yellow-400 text-yellow-900' : 'bg-primary text-white'
                    }`}>{p.number}</span>
                    <div className="flex-1">
                      <span className="text-label-lg text-on-surface">{p.name}</span>
                    </div>
                    <span className="text-label-md text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded text-[11px]">
                      {p.position}
                    </span>
                    {sel && <span className="material-symbols-outlined text-yellow-500 text-[16px]">swap_horiz</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Remplaçants */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <h4 className="text-headline-md">Remplaçants</h4>
              {bench.length > 0 && (
                <span className="text-label-md text-on-surface-variant">{bench.length}</span>
              )}
            </div>
            <div className="divide-y divide-[#e8e8f0]">
              {bench.length === 0 && (
                <div className="py-6 flex flex-col items-center gap-1.5 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[28px] opacity-30">person_off</span>
                  <p className="text-body-sm">Aucun remplaçant convoqué</p>
                </div>
              )}
              {bench.map(p => {
                const sel = isSelected(p.id, 'bench')
                return (
                  <div key={p.id} onClick={() => handlePlayerClick(p.id, 'bench')}
                    className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                      sel ? 'bg-yellow-50' : 'hover:bg-surface-container-low'
                    }`}>
                    <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                      sel ? 'bg-yellow-400 text-yellow-900' : 'bg-surface-container text-on-surface-variant'
                    }`}>{p.number}</span>
                    <div className="flex-1">
                      <span className="text-label-lg text-on-surface">{p.name}</span>
                    </div>
                    <span className="text-label-md text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded text-[11px]">
                      {p.position}
                    </span>
                    {sel && <span className="material-symbols-outlined text-yellow-500 text-[16px]">swap_horiz</span>}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Aide */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-body-sm text-on-surface-variant">
            <p className="text-label-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">swap_horiz</span>
              Échanger des joueurs
            </p>
            <p>Cliquez sur un joueur (terrain ou banc) pour le sélectionner (jaune), puis sur un autre pour les échanger.</p>
            <p>Vous pouvez intervertir titulaires entre eux, remplaçants entre eux, ou faire entrer un remplaçant.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
