import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type UserInfo = { id: number; prenom: string; nom: string; email: string; avatar?: string; role: string }
type Player   = { id: number; nom: string; prenom: string; avatar?: string }

export default function GoogleCompletePage() {
  const navigate = useNavigate()

  const [user, setUser]           = useState<UserInfo | null>(null)
  const [loadingUser, setLoadingUser] = useState(true)
  const [code, setCode]           = useState('')
  const [step, setStep]           = useState<'form' | 'child' | 'done'>('form')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [joinInfo, setJoinInfo]   = useState<{ equipe: { nom: string }; role: string } | null>(null)

  // Editable profile fields
  const [editPrenom, setEditPrenom] = useState('')
  const [editNom, setEditNom]       = useState('')
  const [editPassword, setEditPassword] = useState('')

  const [players, setPlayers]         = useState<Player[]>([])
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  const [loadingPlayers, setLoadingPlayers] = useState(false)

  // Track whether the user completed the flow — used for cleanup on quit
  const completedRef = useRef(false)

  useEffect(() => {
    api.get('/auth/me')
      .then(r => {
        const u = r.data.data
        setUser(u)
        setEditPrenom(u.prenom || '')
        setEditNom(u.nom || '')
        localStorage.setItem('userId', String(u.id))
        localStorage.setItem('prenom', u.prenom || u.nom || '')
        localStorage.setItem('role', u.role || 'visiteur')
      })
      .catch(() => navigate('/login', { replace: true }))
      .finally(() => setLoadingUser(false))
  }, [])

  // Cleanup: delete pending account on SPA navigation away (if not completed)
  useEffect(() => {
    return () => {
      if (!completedRef.current) {
        api.delete('/auth/cancel-google-pending').catch(() => {})
      }
    }
  }, [])

  // Cleanup: delete pending account on tab close / page reload (keepalive fetch)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (completedRef.current) return
      const token = localStorage.getItem('access_token')
      fetch('/api/auth/cancel-google-pending', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        keepalive: true,
      }).catch(() => {})
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [])

  useEffect(() => {
    if (step === 'done') {
      completedRef.current = true
      setTimeout(() => navigate('/dashboard', { replace: true }), 1500)
    }
  }, [step])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      // 1. Update profile info (name) — le téléphone est demandé plus tard dans la modale de complément de profil
      await api.put('/profil', {
        prenom: editPrenom.trim() || undefined,
        nom:    editNom.trim()    || undefined,
      })

      // 2. Set password if provided
      if (editPassword.trim()) {
        if (editPassword.length < 8) {
          setError('Le mot de passe doit faire au moins 8 caractères.')
          setLoading(false)
          return
        }
        await api.post('/profil/set-initial-password', { password: editPassword })
      }

      // 3. Join club with invite code
      const res = await api.post('/clubs/join', { code: code.trim().toUpperCase() })
      const data = res.data.data
      setJoinInfo(data)
      localStorage.setItem('role', data.role)
      localStorage.setItem('prenom', editPrenom.trim() || user?.prenom || '')

      if (data.role === 'parent') {
        setStep('child')
        setLoadingPlayers(true)
        const pRes = await api.get('/clubs/players')
        setPlayers(pRes.data.data || [])
        setLoadingPlayers(false)
      } else {
        setStep('done')
      }
    } catch (err: any) {
      const status = err.response?.status
      if (status === 404) setError('Code invalide ou inexistant.')
      else if (status === 410) setError('Code expiré ou quota atteint.')
      else setError(err.response?.data?.message || 'Code invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  const handleLinkChild = async () => {
    if (!selectedChild) return
    setLoading(true)
    setError('')
    try {
      await api.post('/clubs/link-child', { child_user_id: selectedChild })
      setStep('done')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la liaison.')
    } finally {
      setLoading(false)
    }
  }

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f4f4f6]">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #2b2d42 0%, #1b4332 100%)' }}
    >
      <div className="w-full max-w-[480px] bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="px-8 pt-8 pb-6 text-center border-b border-[#e8e8f0]">
          {step === 'form' && (
            <>
              {user?.avatar
                ? <img src={user.avatar} className="w-16 h-16 rounded-full mx-auto mb-4 object-cover ring-4 ring-primary/20" alt="" />
                : (
                  <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-primary-container flex items-center justify-center ring-4 ring-primary/20">
                    <span className="text-white font-black text-xl">{user?.prenom?.[0]}{user?.nom?.[0]}</span>
                  </div>
                )
              }
              <h1 className="text-headline-md text-on-surface">Bienvenue, {user?.prenom} !</h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                Complète ton inscription pour rejoindre ton club.
              </p>
            </>
          )}
          {step === 'child' && (
            <>
              <div className="w-14 h-14 bg-primary-container rounded-xl flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-white text-[28px]">family_restroom</span>
              </div>
              <h1 className="text-headline-md text-on-surface">Quel est votre enfant ?</h1>
              <p className="text-body-md text-on-surface-variant mt-1">Sélectionnez le joueur que vous accompagnez.</p>
            </>
          )}
          {step === 'done' && (
            <>
              <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-[28px]">check_circle</span>
              </div>
              <h1 className="text-headline-md text-on-surface">Bienvenue !</h1>
              <p className="text-body-md text-on-surface-variant mt-1">
                {joinInfo ? `Vous avez rejoint ${joinInfo.equipe?.nom ?? 'l\'équipe'}` : 'Inscription terminée.'}
              </p>
            </>
          )}
        </div>

        <div className="px-8 py-6 space-y-5">

          {error && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
              <span className="material-symbols-outlined text-[18px] shrink-0">error</span>
              {error}
            </div>
          )}

          {/* Étape 1 : formulaire */}
          {step === 'form' && (
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Infos modifiables */}
              <div className="space-y-3">
                <p className="text-label-md text-on-surface-variant">Vos informations</p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant">Prénom</label>
                    <input value={editPrenom} onChange={e => setEditPrenom(e.target.value)}
                      placeholder="Jean"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-sm text-on-surface-variant">Nom</label>
                    <input value={editNom} onChange={e => setEditNom(e.target.value)}
                      placeholder="Dupont"
                      className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-label-sm text-on-surface-variant">Mot de passe (optionnel)</label>
                  <input value={editPassword} onChange={e => setEditPassword(e.target.value)}
                    type="password" placeholder="Pour se connecter sans Google…"
                    className="w-full px-3 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                  <p className="text-body-sm text-on-surface-variant/70">Laissez vide pour utiliser uniquement Google.</p>
                </div>
              </div>

              {/* Code d'accès */}
              <div className="space-y-2">
                <label className="text-label-md text-on-surface-variant" htmlFor="code">
                  Code d'accès
                </label>
                <input
                  id="code"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  placeholder="Ex : U15-A3F2B1"
                  className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md font-mono tracking-widest text-center focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all uppercase"
                  required
                  autoFocus
                />
                <p className="text-body-sm text-on-surface-variant">
                  Le code est fourni par l'administrateur ou le dirigeant de votre club.
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || !code.trim()}
                className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
              >
                {loading
                  ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <><span className="material-symbols-outlined text-[20px]">login</span>Rejoindre mon club</>
                }
              </button>

              <p className="text-center text-body-sm text-on-surface-variant/60">
                Un code d'invitation est requis pour accéder à l'application.
              </p>
            </form>
          )}

          {/* Étape 2 (parents) : choisir son enfant */}
          {step === 'child' && (
            <div className="space-y-4">
              {loadingPlayers ? (
                <div className="space-y-2">
                  {[1, 2, 3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-xl animate-pulse" />)}
                </div>
              ) : players.length === 0 ? (
                <div className="text-center py-6 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">person_off</span>
                  <p className="text-body-md">Aucun joueur inscrit pour le moment.</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {players.map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedChild(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                        selectedChild === p.id
                          ? 'border-primary bg-primary/5'
                          : 'border-[#e8e8f0] hover:border-primary/40'
                      }`}
                    >
                      {p.avatar
                        ? <img src={p.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                        : <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-white text-sm">
                            {p.prenom?.[0]}{p.nom?.[0]}
                          </div>
                      }
                      <p className="text-label-lg text-on-surface">{p.prenom} {p.nom}</p>
                      {selectedChild === p.id && (
                        <span className="ml-auto material-symbols-outlined text-primary text-[20px]">check_circle</span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('done')}
                  className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg text-on-surface-variant hover:bg-surface-container-low transition-colors"
                >
                  Plus tard
                </button>
                <button
                  onClick={handleLinkChild}
                  disabled={!selectedChild || loading}
                  className="flex-1 py-2.5 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                >
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
