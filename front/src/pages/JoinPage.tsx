import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type Player = { id: number; nom: string; prenom: string; avatar?: string }

export default function JoinPage() {
  const navigate = useNavigate()
  const role = localStorage.getItem('role') || 'joueur'

  const [step, setStep]     = useState<'code' | 'child' | 'done'>('code')
  const [code, setCode]     = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')
  const [joinInfo, setJoinInfo] = useState<{ equipe: { nom: string; categorie: string }; role: string } | null>(null)

  // Pour parents : liste des joueurs du club
  const [players, setPlayers]     = useState<Player[]>([])
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  const handleValidateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/codes/validate', { code: code.trim().toUpperCase() })
      const data = res.data.data
      setJoinInfo(data)
      localStorage.setItem('role', data.role)

      if (data.role === 'parent') {
        // Charger les joueurs du club pour lier à un enfant
        setStep('child')
        setLoadingPlayers(true)
        const pRes = await api.get('/codes/club-players')
        setPlayers(pRes.data.data || [])
        setLoadingPlayers(false)
      } else {
        setStep('done')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Code invalide ou expiré')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkChild = async () => {
    if (!selectedChild) return
    setLoading(true)
    setError('')
    try {
      await api.post('/codes/link-child', { child_user_id: selectedChild })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la liaison')
    } finally {
      setLoading(false)
    }
  }

  const skip = () => setStep('done')

  useEffect(() => {
    if (step === 'done') {
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    }
  }, [step])

  return (
    <div className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #2b2d42 0%, #1b4332 100%)' }}>
      <div className="w-full max-w-[440px] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-[#e8e8f0]">
          <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center mx-auto mb-4">
            <span className="material-symbols-outlined text-white text-[28px]">
              {step === 'code' ? 'key' : step === 'child' ? 'family_restroom' : 'check_circle'}
            </span>
          </div>
          <h1 className="text-headline-md text-on-surface">
            {step === 'code' ? 'Rejoindre une équipe'
              : step === 'child' ? 'Quel est votre enfant ?'
              : 'Bienvenue !'}
          </h1>
          <p className="text-body-md text-on-surface-variant mt-1">
            {step === 'code' ? 'Entrez le code fourni par votre club'
              : step === 'child' ? 'Sélectionnez le joueur que vous accompagnez'
              : `Vous avez rejoint ${joinInfo?.equipe.nom}`}
          </p>
        </div>

        <div className="px-8 py-6">
          {error && (
            <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-[18px]">error</span>
              {error}
            </div>
          )}

          {/* Étape 1 : saisir le code */}
          {step === 'code' && (
            <form onSubmit={handleValidateCode} className="space-y-5">
              <div className="space-y-2">
                <label className="text-label-md text-on-surface-variant">Code d'invitation</label>
                <input
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex : U15-A3F2B1"
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md font-mono tracking-widest text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                  required autoFocus
                />
              </div>
              <button type="submit" disabled={loading || !code.trim()}
                className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                {loading
                  ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <><span className="material-symbols-outlined text-[20px]">login</span>Rejoindre</>
                }
              </button>
              <button type="button" onClick={() => navigate('/dashboard')}
                className="w-full py-2 text-on-surface-variant text-label-md hover:text-on-surface transition-colors">
                Je n'ai pas de code — accéder quand même
              </button>
            </form>
          )}

          {/* Étape 2 (parents) : choisir son enfant */}
          {step === 'child' && (
            <div className="space-y-4">
              {loadingPlayers ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">person_off</span>
                  <p className="text-body-md">Aucun joueur inscrit pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {players.map(p => (
                    <button key={p.id} onClick={() => setSelectedChild(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedChild === p.id
                          ? 'border-primary bg-primary/5'
                          : 'border-[#e8e8f0] hover:border-primary/40'
                      }`}>
                      {p.avatar
                        ? <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        : <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-white text-sm">
                            {p.prenom?.[0]}{p.nom?.[0]}
                          </div>
                      }
                      <div>
                        <p className="text-label-lg text-on-surface">{p.prenom} {p.nom}</p>
                      </div>
                      {selectedChild === p.id && (
                        <span className="ml-auto material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button onClick={skip}
                  className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-colors">
                  Plus tard
                </button>
                <button onClick={handleLinkChild} disabled={!selectedChild || loading}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2 transition-colors">
                  {loading
                    ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : 'Confirmer'
                  }
                </button>
              </div>
            </div>
          )}

          {/* Étape 3 : succès */}
          {step === 'done' && (
            <div className="text-center py-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-[36px]">check_circle</span>
              </div>
              <p className="text-body-md text-on-surface-variant">Redirection vers le tableau de bord…</p>
              <svg className="animate-spin h-5 w-5 text-primary mx-auto mt-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
