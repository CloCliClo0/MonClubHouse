import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface ConvocationMatch {
  id: number
  date: string
  heure?: string
  type: string
  adversaire?: string
  lieu?: string
  statut: string
}

interface ConvocationJoueur {
  id: number
  nom: string
  prenom: string
}

interface Convocation {
  id: number
  match_id: number
  joueur_id: number
  statut: 'convoque' | 'present' | 'absent' | 'incertain'
  motif_absence?: string
  reponse_at?: string
  match: ConvocationMatch
  joueur?: ConvocationJoueur
}

const STATUT_LABELS: Record<string, string> = {
  convoque: 'En attente',
  present: 'Présent',
  absent: 'Absent',
  incertain: 'Incertain',
}

const STATUT_COLORS: Record<string, string> = {
  convoque: 'bg-blue-100 text-blue-700',
  present: 'bg-green-100 text-green-700',
  absent: 'bg-red-100 text-red-700',
  incertain: 'bg-yellow-100 text-yellow-700',
}

export default function PresencePage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [convocations, setConvocations] = useState<Convocation[]>([])
  const [loading, setLoading] = useState(true)
  const [repondingId, setRepondingId] = useState<number | null>(null)
  const [motifAbsence, setMotifAbsence] = useState('')
  const [showMotif, setShowMotif] = useState<number | null>(null)
  const [filter, setFilter] = useState<'all' | 'match' | 'entrainement'>('all')

  const isParent = user?.role === 'parent'

  useEffect(() => {
    if (!user) return
    if (!['joueur', 'parent'].includes(user.role)) {
      navigate('/convocations')
      return
    }
    loadConvocations()
  }, [user])

  const loadConvocations = async () => {
    try {
      setLoading(true)
      const r = await api.get('/licencies/mes-convocations')
      setConvocations(r.data.data || [])
    } catch {
      setConvocations([])
    } finally {
      setLoading(false)
    }
  }

  // matchId = match_id de la convocation ; joueurId = ID du joueur (enfant pour parent)
  const repondre = async (matchId: number, joueurId: number, statut: string) => {
    const key = matchId
    if (statut === 'absent' && showMotif !== key) {
      setShowMotif(key)
      return
    }
    setRepondingId(key)
    try {
      await api.patch(`/matchs/${matchId}/reponse`, {
        statut,
        motif_absence: motifAbsence || undefined,
        joueur_id: joueurId,
      })
      setConvocations(prev =>
        prev.map(c =>
          c.match_id === matchId && c.joueur_id === joueurId
            ? { ...c, statut: statut as Convocation['statut'], reponse_at: new Date().toISOString() }
            : c
        )
      )
      setShowMotif(null)
      setMotifAbsence('')
    } catch (err: any) {
      console.error(err)
    } finally {
      setRepondingId(null)
    }
  }

  const filtered = convocations.filter(c => {
    if (!c.match) return false
    if (filter === 'match') return c.match.type === 'match'
    if (filter === 'entrainement') return c.match.type !== 'match'
    return true
  })

  const upcoming = filtered.filter(c => c.match && new Date(c.match.date) >= new Date())
  const past = filtered.filter(c => c.match && new Date(c.match.date) < new Date())

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })

  const ConvCard = ({ conv }: { conv: Convocation }) => {
    const m = conv.match
    if (!m) return null
    const isPast = new Date(m.date) < new Date()
    const isEntrainement = m.type !== 'match'
    const convKey = conv.match_id
    const joueurId = conv.joueur_id

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  isEntrainement ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isEntrainement ? 'Entraînement' : 'Match'}
              </span>
              {m.adversaire && (
                <span className="text-sm font-semibold text-gray-800">vs {m.adversaire}</span>
              )}
              {/* Afficher le nom de l'enfant pour les parents */}
              {isParent && conv.joueur && (
                <span className="text-xs text-indigo-600 font-medium">
                  {conv.joueur.prenom} {conv.joueur.nom}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500">
              {formatDate(m.date)}
              {m.heure ? ` • ${m.heure.substring(0, 5)}` : ''}
            </p>
            {m.lieu && <p className="text-xs text-gray-400 mt-0.5">{m.lieu}</p>}
          </div>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full shrink-0 ${
              STATUT_COLORS[conv.statut]
            }`}
          >
            {STATUT_LABELS[conv.statut]}
          </span>
        </div>

        {/* Boutons réponse */}
        {!isPast && (
          <div className="mt-3">
            {showMotif === convKey ? (
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder="Motif d'absence (optionnel)"
                  value={motifAbsence}
                  onChange={e => setMotifAbsence(e.target.value)}
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-300"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => repondre(m.id, joueurId, 'absent')}
                    className="flex-1 bg-red-500 text-white text-sm font-medium py-2 rounded-lg"
                  >
                    Confirmer absence
                  </button>
                  <button
                    onClick={() => { setShowMotif(null); setMotifAbsence('') }}
                    className="px-3 py-2 text-sm text-gray-500 border rounded-lg"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => repondre(m.id, joueurId, 'present')}
                  disabled={repondingId === convKey}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    conv.statut === 'present'
                      ? 'bg-green-500 text-white'
                      : 'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100'
                  }`}
                >
                  ✓ Présent
                </button>
                <button
                  onClick={() => repondre(m.id, joueurId, 'incertain')}
                  disabled={repondingId === convKey}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    conv.statut === 'incertain'
                      ? 'bg-yellow-500 text-white'
                      : 'bg-yellow-50 text-yellow-700 border border-yellow-200 hover:bg-yellow-100'
                  }`}
                >
                  ? Incertain
                </button>
                <button
                  onClick={() => repondre(m.id, joueurId, 'absent')}
                  disabled={repondingId === convKey}
                  className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
                    conv.statut === 'absent'
                      ? 'bg-red-500 text-white'
                      : 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
                  }`}
                >
                  ✕ Absent
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Mes présences</h1>
        <p className="text-sm text-gray-500 mt-1">
          {isParent
            ? 'Gérez les réponses aux convocations de vos enfants'
            : 'Gérez vos réponses aux convocations'}
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['all', 'match', 'entrainement'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition ${
              filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'Tout' : f === 'match' ? 'Matchs' : 'Entraînements'}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {upcoming.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">À venir</h2>
              {upcoming.map(c => (
                <ConvCard key={`${c.match_id}-${c.joueur_id}`} conv={c} />
              ))}
            </section>
          )}

          {past.length > 0 && (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Passés</h2>
              {past.map(c => (
                <ConvCard key={`${c.match_id}-${c.joueur_id}`} conv={c} />
              ))}
            </section>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              <p className="text-4xl mb-3">📅</p>
              <p className="font-medium">Aucune convocation</p>
              <p className="text-sm mt-1">
                {isParent
                  ? 'Vos enfants n\'ont pas encore été convoqués'
                  : 'Vous n\'avez pas encore été convoqué(e)'}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
