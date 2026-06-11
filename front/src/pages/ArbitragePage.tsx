import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Presence {
  id: number
  user_id: number
  date: string
  commentaire?: string
  user?: {
    id: number
    nom: string
    prenom: string
    avatar?: string
    telephone?: string
  }
}

interface ByDate {
  [date: string]: Presence[]
}

const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']

function getSaturdays(count = 8): string[] {
  const dates: string[] = []
  const d = new Date()
  // Trouver prochain samedi
  while (d.getDay() !== 6) d.setDate(d.getDate() + 1)
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().slice(0, 10))
    d.setDate(d.getDate() + 7)
  }
  return dates
}

const formatDate = (d: string) => {
  const date = new Date(d)
  return date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })
}

export default function ArbitragePage() {
  const { user } = useAuth()
  const [presences, setPresences] = useState<ByDate>({})
  const [mesPresences, setMesPresences] = useState<Presence[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState('')
  const [commentaire, setCommentaire] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [tab, setTab] = useState<'inscrire' | 'planning'>('inscrire')

  const isAdmin = ['admin', 'superadmin', 'dirigeant'].includes(user?.role || '')
  const saturdays = getSaturdays(8)

  useEffect(() => {
    loadAll()
  }, [])

  const loadAll = async () => {
    setLoading(true)
    try {
      const [allR, mesR] = await Promise.all([
        api.get('/arbitrage/presences'),
        api.get('/arbitrage/mes-presences'),
      ])
      setPresences(allR.data.data || {})
      setMesPresences(mesR.data.data || [])
    } catch { /* ignore */ } finally {
      setLoading(false)
    }
  }

  const sInscrire = async () => {
    if (!selectedDate) return
    setSaving(true)
    setError('')
    try {
      await api.post('/arbitrage/presences', { date: selectedDate, commentaire: commentaire || undefined })
      setCommentaire('')
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription')
    } finally {
      setSaving(false)
    }
  }

  const seDesinscrire = async (id: number) => {
    try {
      await api.delete(`/arbitrage/presences/${id}`)
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur')
    }
  }

  const isInscrit = (date: string) => mesPresences.some(p => p.date === date)
  const getMyPresence = (date: string) => mesPresences.find(p => p.date === date)

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Arbitrage</h1>
        <p className="text-sm text-gray-500 mt-1">Inscrivez-vous pour arbitrer les matchs du samedi</p>
      </div>

      {/* Onglets */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setTab('inscrire')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === 'inscrire' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          M'inscrire
        </button>
        <button
          onClick={() => setTab('planning')}
          className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${tab === 'planning' ? 'bg-white shadow text-gray-900' : 'text-gray-500'}`}
        >
          Planning
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'inscrire' ? (
        <div className="space-y-4">
          {/* Mes inscriptions */}
          {mesPresences.length > 0 && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Mes inscriptions</h2>
              {mesPresences.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-green-800">{formatDate(p.date)}</p>
                    {p.commentaire && <p className="text-xs text-green-600 mt-0.5">{p.commentaire}</p>}
                  </div>
                  <button
                    onClick={() => seDesinscrire(p.id)}
                    className="text-xs text-red-500 hover:text-red-700 font-medium px-2 py-1"
                  >
                    Se désinscrire
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Dates disponibles */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Prochains samedis</h2>
            {saturdays.map(date => {
              const count = (presences[date] || []).length
              const inscrit = isInscrit(date)
              const complet = count >= 2 && !inscrit

              return (
                <button
                  key={date}
                  onClick={() => !inscrit && !complet && setSelectedDate(date === selectedDate ? '' : date)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 text-left transition ${
                    inscrit
                      ? 'bg-green-50 border-green-300 cursor-default'
                      : selectedDate === date
                        ? 'bg-blue-50 border-blue-400'
                        : complet
                          ? 'bg-gray-50 border-gray-200 opacity-50 cursor-not-allowed'
                          : 'bg-white border-gray-200 hover:border-blue-300'
                  }`}
                >
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{formatDate(date)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{count}/2 arbitre(s) inscrit(s)</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className={`w-4 h-4 rounded-full ${i < count ? 'bg-green-400' : 'bg-gray-200'}`} />
                    ))}
                    {inscrit && <span className="text-xs text-green-600 font-medium ml-2">Inscrit</span>}
                    {complet && <span className="text-xs text-gray-400 font-medium ml-2">Complet</span>}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Formulaire inscription */}
          {selectedDate && !isInscrit(selectedDate) && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <p className="text-sm font-semibold text-blue-800">Inscription pour le {formatDate(selectedDate)}</p>
              <textarea
                placeholder="Commentaire (optionnel)"
                value={commentaire}
                onChange={e => setCommentaire(e.target.value)}
                rows={2}
                className="w-full text-sm border border-blue-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-300 resize-none"
              />
              {error && <p className="text-xs text-red-600">{error}</p>}
              <button
                onClick={sInscrire}
                disabled={saving}
                className="w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl disabled:opacity-50 hover:bg-blue-700 transition"
              >
                {saving ? 'Inscription...' : "S'inscrire"}
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Planning — vue admin/coach */
        <div className="space-y-4">
          {saturdays.map(date => {
            const list = presences[date] || []
            return (
              <div key={date} className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-800">{formatDate(date)}</p>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${list.length >= 2 ? 'bg-green-100 text-green-700' : list.length === 1 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                    {list.length}/2
                  </span>
                </div>
                {list.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-gray-400">Aucun arbitre inscrit</p>
                ) : (
                  <ul className="divide-y divide-gray-50">
                    {list.map(p => (
                      <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                          <span className="text-sm font-semibold text-blue-600">
                            {p.user?.prenom?.[0]}{p.user?.nom?.[0]}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{p.user?.prenom} {p.user?.nom}</p>
                          {p.commentaire && <p className="text-xs text-gray-500 truncate">{p.commentaire}</p>}
                        </div>
                        {p.user?.telephone && (
                          <a
                            href={`tel:${p.user.telephone}`}
                            className="text-xs text-blue-600 font-medium px-2 py-1 bg-blue-50 rounded-lg"
                          >
                            Appeler
                          </a>
                        )}
                        {(isAdmin || p.user_id === user?.id) && (
                          <button
                            onClick={() => seDesinscrire(p.id)}
                            className="text-xs text-red-400 hover:text-red-600 p-1"
                          >
                            ✕
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
