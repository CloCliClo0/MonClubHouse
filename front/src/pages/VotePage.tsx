import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

interface Player {
  id: number
  nom: string
  prenom: string
  avatar?: string
}

interface VoteResult {
  user: Player
  count: number
}

interface VoteData {
  match_id: number
  mon_vote: number | null
  classement: VoteResult[]
  total_votes: number
  convocations: Player[]
}

export default function VotePage() {
  const { matchId } = useParams<{ matchId: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [voteData, setVoteData] = useState<VoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [voting, setVoting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadVotes()
  }, [matchId])

  const loadVotes = async () => {
    try {
      setLoading(true)
      setError('')
      const r = await api.get(`/votes/${matchId}`)
      setVoteData(r.data.data)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Impossible de charger les votes')
    } finally {
      setLoading(false)
    }
  }

  const voter = async (playerId: number) => {
    if (!voteData || voteData.mon_vote) return
    if (playerId === user?.id) return
    setVoting(true)
    try {
      await api.post(`/votes/${matchId}`, { voted_for_id: playerId })
      await loadVotes()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors du vote')
    } finally {
      setVoting(false)
    }
  }

  const avatarUrl = (p: Player) =>
    p.avatar ? (p.avatar.startsWith('http') ? p.avatar : `/uploads/${p.avatar}`) : null

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="w-8 h-8 border-2 border-yellow-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto px-4 py-12 text-center space-y-4">
        <p className="text-4xl">🔒</p>
        <p className="font-semibold text-gray-700">{error}</p>
        <button onClick={() => navigate(-1)} className="text-sm text-blue-600 underline">Retour</button>
      </div>
    )
  }

  if (!voteData) return null

  const hasVoted = voteData.mon_vote !== null
  const winner = voteData.classement[0]

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">⭐ Joueur du match</h1>
        <p className="text-sm text-gray-500 mt-1">
          {hasVoted ? `${voteData.total_votes} vote(s) exprimé(s)` : 'Votez pour votre meilleur joueur'}
        </p>
      </div>

      {/* Résultat / gagnant si déjà voté */}
      {hasVoted && winner && (
        <div className="bg-gradient-to-r from-yellow-400 to-orange-400 rounded-2xl p-5 text-white text-center shadow-lg">
          <p className="text-sm font-medium opacity-90 mb-2">En tête</p>
          <div className="w-16 h-16 rounded-full bg-white/20 mx-auto mb-2 flex items-center justify-center overflow-hidden">
            {avatarUrl(winner.user) ? (
              <img src={avatarUrl(winner.user)!} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold">{winner.user.prenom[0]}{winner.user.nom[0]}</span>
            )}
          </div>
          <p className="text-xl font-bold">{winner.user.prenom} {winner.user.nom}</p>
          <p className="text-sm opacity-80 mt-1">{winner.count} vote(s)</p>
        </div>
      )}

      {/* Grille joueurs */}
      {!hasVoted ? (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-3">Choisissez un joueur :</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {voteData.convocations.filter(p => p.id !== user?.id).map(p => (
              <button
                key={p.id}
                onClick={() => voter(p.id)}
                disabled={voting}
                className="bg-white rounded-xl border-2 border-gray-100 p-4 text-center hover:border-yellow-400 hover:shadow-md transition active:scale-95 disabled:opacity-50"
              >
                <div className="w-14 h-14 rounded-full bg-gray-100 mx-auto mb-2 flex items-center justify-center overflow-hidden">
                  {avatarUrl(p) ? (
                    <img src={avatarUrl(p)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-lg font-semibold text-gray-500">{p.prenom[0]}{p.nom[0]}</span>
                  )}
                </div>
                <p className="text-sm font-semibold text-gray-800 truncate">{p.prenom}</p>
                <p className="text-xs text-gray-500 truncate">{p.nom}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Classement complet */
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">Classement</p>
          {voteData.classement.map((v, i) => {
            const isMyVote = voteData.mon_vote === v.user.id
            const maxCount = voteData.classement[0]?.count || 1
            return (
              <div key={v.user.id} className={`flex items-center gap-3 p-3 rounded-xl ${isMyVote ? 'bg-yellow-50 border border-yellow-200' : 'bg-white border border-gray-100'}`}>
                <span className="text-lg font-bold text-gray-400 w-6 text-center">{i + 1}</span>
                <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
                  {avatarUrl(v.user) ? (
                    <img src={avatarUrl(v.user)!} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold text-gray-500">{v.user.prenom[0]}{v.user.nom[0]}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{v.user.prenom} {v.user.nom}</p>
                  <div className="mt-1 bg-gray-100 rounded-full h-1.5">
                    <div className="bg-yellow-400 h-1.5 rounded-full transition-all" style={{ width: `${(v.count / maxCount) * 100}%` }} />
                  </div>
                </div>
                <span className="text-sm font-bold text-gray-700 shrink-0">{v.count}</span>
                {isMyVote && <span className="text-xs text-yellow-600 font-medium shrink-0">Mon vote</span>}
              </div>
            )
          })}
        </div>
      )}

      <button onClick={() => navigate(-1)} className="w-full py-3 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50">
        Retour
      </button>
    </div>
  )
}
