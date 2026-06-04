import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

type Convocation = {
  id: number
  statut: string
  joueur: { id: number; nom: string; prenom: string; avatar?: string }
}

type Match = {
  id: number
  type: string
  adversaire?: string
  date: string
  domicile: boolean
  statut: string
  score_equipe?: number
  score_adversaire?: number
  notes?: string
  equipe: { id: number; nom: string; categorie: string; couleur_maillot?: string }
  terrain?: { nom: string }
  convocations: Convocation[]
}

export default function MatchDetailPage() {
  const { matchId } = useParams<{ matchId: string }>()
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'joueur'
  const canManage = ['superadmin', 'admin', 'dirigeant', 'coach'].includes(role)

  const [match, setMatch]     = useState<Match | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab]         = useState<'presences' | 'score'>('score')

  const [scoreHome, setScoreHome] = useState<number>(0)
  const [scoreAway, setScoreAway] = useState<number>(0)
  const [saving, setSaving]       = useState(false)
  const [msg, setMsg]             = useState('')

  const load = () => {
    api.get(`/matchs/${matchId}`)
      .then(r => {
        const m = r.data.data
        setMatch(m)
        setScoreHome(m.score_equipe ?? 0)
        setScoreAway(m.score_adversaire ?? 0)
      })
      .catch(() => navigate('/resultats'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [matchId])

  const saveScore = async () => {
    setSaving(true)
    setMsg('')
    try {
      await api.patch(`/matchs/${matchId}/score`, {
        score_equipe: scoreHome,
        score_adversaire: scoreAway,
        statut: 'termine',
      })
      setMsg('Score enregistré !')
      setTimeout(() => setMsg(''), 2500)
      load()
    } catch {
      setMsg('Erreur lors de la sauvegarde')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-4">
      <div className="h-48 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
      <div className="h-64 bg-white border border-[#e8e8f0] rounded-2xl animate-pulse" />
    </div>
  )
  if (!match) return null

  const dateStr  = new Date(match.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  const timeStr  = new Date(match.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
  const isMatch  = ['match', 'amical', 'coupe', 'tournoi'].includes(match.type)
  const present  = match.convocations.filter(c => c.statut === 'present').length

  const result = match.score_equipe !== undefined && match.score_adversaire !== undefined
    ? match.score_equipe > match.score_adversaire ? 'Victoire' : match.score_equipe < match.score_adversaire ? 'Défaite' : 'Nul'
    : null

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => navigate('/resultats')}
        className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-5 transition-colors">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour aux résultats
      </button>

      {/* Header match */}
      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden mb-6">
        <div style={{ background: 'linear-gradient(135deg,#1b4332,#2d6a4f)' }} className="px-6 py-6">
          <div className="flex items-center justify-between flex-wrap gap-2 mb-5">
            <div className="flex items-center gap-2">
              <span className="bg-white/15 text-white text-label-md px-3 py-1 rounded-full">{match.equipe.categorie}</span>
              <span className="bg-white/15 text-white text-label-md px-3 py-1 rounded-full capitalize">{match.type}</span>
              <span className={`text-label-md px-3 py-1 rounded-full ${match.statut === 'termine' ? 'bg-white/20 text-white' : 'bg-green-400/20 text-green-200'}`}>
                {match.statut === 'termine' ? 'Terminé' : 'Programmé'}
              </span>
            </div>
            <span className="text-white/70 text-body-sm">{dateStr} · {timeStr}</span>
          </div>

          {/* Score */}
          <div className="flex items-center justify-center gap-6">
            <div className="text-center flex-1">
              <p className="text-white font-black text-xl">{match.equipe.nom}</p>
              <p className="text-white/60 text-body-sm mt-0.5">{match.domicile ? '🏠 Domicile' : '✈️ Extérieur'}</p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 rounded-2xl px-6 py-4">
              {canManage && match.statut !== 'termine' ? (
                <>
                  <button onClick={() => setScoreHome(s => Math.max(0, s - 1))}
                    className="text-white/60 hover:text-white text-2xl font-black">−</button>
                  <span className="text-white font-black text-4xl w-10 text-center">{scoreHome}</span>
                  <span className="text-white/50 text-2xl">—</span>
                  <span className="text-white font-black text-4xl w-10 text-center">{scoreAway}</span>
                  <button onClick={() => setScoreAway(s => Math.max(0, s - 1))}
                    className="text-white/60 hover:text-white text-2xl font-black">−</button>
                </>
              ) : (
                <>
                  <span className="text-white font-black text-4xl w-10 text-center">{match.score_equipe ?? '?'}</span>
                  <span className="text-white/50 text-2xl">—</span>
                  <span className="text-white font-black text-4xl w-10 text-center">{match.score_adversaire ?? '?'}</span>
                </>
              )}
            </div>
            <div className="text-center flex-1">
              <p className="text-white font-black text-xl">{match.adversaire || 'Adversaire'}</p>
            </div>
          </div>

          {/* +1 buttons for coach */}
          {canManage && match.statut !== 'termine' && (
            <div className="flex items-center justify-center gap-6 mt-4">
              <button onClick={() => setScoreHome(s => s + 1)}
                className="bg-white/20 hover:bg-white/30 text-white text-label-md px-5 py-1.5 rounded-full transition-colors">
                +1 {match.equipe.nom.split(' ').slice(-1)}
              </button>
              <button onClick={() => setScoreAway(s => s + 1)}
                className="bg-white/20 hover:bg-white/30 text-white text-label-md px-5 py-1.5 rounded-full transition-colors">
                +1 {match.adversaire?.split(' ').slice(-1) || 'Adv.'}
              </button>
            </div>
          )}
        </div>

        {/* Infos bar */}
        <div className="px-6 py-3 bg-surface-container-lowest flex items-center gap-6 flex-wrap border-t border-[#e8e8f0] text-body-sm text-on-surface-variant">
          {match.terrain && (
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">location_on</span>
              {match.terrain.nom}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">how_to_reg</span>
            {present} présents / {match.convocations.length} convoqués
          </span>
          {result && (
            <span className={`font-semibold ${result === 'Victoire' ? 'text-green-600' : result === 'Défaite' ? 'text-error' : 'text-orange-500'}`}>
              {result === 'Victoire' ? '🏆' : result === 'Défaite' ? '❌' : '🤝'} {result}
            </span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-surface-container-low rounded-xl p-1 mb-5">
        {[
          { key: 'score',     label: 'Score & Résultat', icon: 'scoreboard'   },
          { key: 'presences', label: 'Présences',         icon: 'how_to_reg'   },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key as any)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-label-md font-semibold transition-all ${
              tab === t.key ? 'bg-white text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'
            }`}>
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#e8e8f0] rounded-2xl overflow-hidden">
        {/* Score tab */}
        {tab === 'score' && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: match.equipe.nom, value: match.score_equipe ?? '—', color: 'text-primary' },
                { label: 'Résultat',       value: result ?? '—',             color: result === 'Victoire' ? 'text-green-600' : result === 'Défaite' ? 'text-error' : 'text-orange-500' },
                { label: match.adversaire || 'Adversaire', value: match.score_adversaire ?? '—', color: 'text-on-surface' },
              ].map(s => (
                <div key={s.label} className="bg-surface-container-low rounded-xl p-4 text-center">
                  <p className={`text-headline-lg font-black ${s.color}`}>{s.value}</p>
                  <p className="text-label-md text-on-surface-variant mt-1 truncate">{s.label}</p>
                </div>
              ))}
            </div>

            {canManage && (
              <div className="flex items-center gap-3 pt-2">
                <button onClick={saveScore} disabled={saving}
                  className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 transition-colors">
                  {saving
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <span className="material-symbols-outlined text-[18px]">save</span>
                  }
                  Enregistrer le score
                </button>
                {msg && <p className={`text-body-md ${msg.includes('Erreur') ? 'text-error' : 'text-green-600'}`}>{msg}</p>}
              </div>
            )}
          </div>
        )}

        {/* Présences tab */}
        {tab === 'presences' && (
          <div>
            {match.convocations.length === 0 ? (
              <div className="py-12 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">groups</span>
                <p className="text-body-md">Aucune convocation pour ce match</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {match.convocations.map(c => {
                  const colors: Record<string, string> = {
                    present: 'bg-green-100 text-green-700', absent: 'bg-red-100 text-red-700',
                    incertain: 'bg-yellow-100 text-yellow-700', convoque: 'bg-orange-100 text-orange-600',
                  }
                  const labels: Record<string, string> = {
                    present: 'Présent', absent: 'Absent', incertain: 'Incertain', convoque: 'En attente',
                  }
                  return (
                    <div key={c.id} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-container-low transition-colors">
                      <div className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                        {c.joueur?.prenom?.[0]}{c.joueur?.nom?.[0]}
                      </div>
                      <p className="flex-1 text-label-lg text-on-surface">{c.joueur?.prenom} {c.joueur?.nom}</p>
                      <span className={`px-2 py-0.5 rounded-full text-label-md font-semibold ${colors[c.statut] || 'bg-slate-100 text-slate-600'}`}>
                        {labels[c.statut] || c.statut}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
