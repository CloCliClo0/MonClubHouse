import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const navigate = useNavigate()

  const [password, setPassword]   = useState('')
  const [confirm, setConfirm]     = useState('')
  const [showPwd, setShowPwd]     = useState(false)
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)
  const [error, setError]         = useState('')

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg,#2b2d42,#1b4332)' }}>
        <div className="bg-white rounded-xl p-10 max-w-sm w-full text-center shadow-2xl">
          <span className="material-symbols-outlined text-error text-[48px] block mb-4">link_off</span>
          <h2 className="text-headline-md text-on-surface mb-2">Lien invalide</h2>
          <p className="text-body-md text-on-surface-variant mb-6">Ce lien de réinitialisation est invalide ou manquant.</p>
          <Link to="/forgot-password" className="px-6 py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container transition-colors">
            Nouvelle demande
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas.')
      return
    }
    setLoading(true)
    try {
      await api.post('/auth/reset-password', { token, password })
      setSuccess(true)
      setTimeout(() => navigate('/login', { replace: true }), 2500)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Lien invalide ou expiré.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #2b2d42 0%, #1b4332 100%)' }}
    >
      <main className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl p-10">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary-container rounded-lg flex items-center justify-center mb-4">
            <span className="material-symbols-outlined text-white text-[28px]">
              {success ? 'check_circle' : 'lock_reset'}
            </span>
          </div>
          <h1 className="text-headline-lg text-on-surface text-center">
            {success ? 'Mot de passe mis à jour !' : 'Nouveau mot de passe'}
          </h1>
          {!success && (
            <p className="text-body-md text-on-surface-variant text-center mt-1">
              Choisissez un mot de passe sécurisé
            </p>
          )}
        </div>

        {success ? (
          <div className="space-y-5 text-center">
            <p className="text-body-md text-on-surface-variant">
              Votre mot de passe a été modifié avec succès. Redirection vers la connexion…
            </p>
            <svg className="animate-spin h-6 w-6 text-primary mx-auto" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
                <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Nouveau mot de passe</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoFocus
                  autoComplete="new-password"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-12"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  <span className="material-symbols-outlined text-[20px]">{showPwd ? 'visibility_off' : 'visibility'}</span>
                </button>
              </div>
              <p className="text-body-sm text-on-surface-variant/70">8 caractères minimum</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Confirmer le mot de passe</label>
              <input
                type={showPwd ? 'text' : 'password'}
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                autoComplete="new-password"
                className={`w-full px-4 py-3 border rounded-lg text-body-md focus:outline-none focus:ring-2 transition-all ${
                  confirm && confirm !== password
                    ? 'border-error focus:border-error focus:ring-error/20'
                    : 'border-outline-variant focus:border-primary focus:ring-primary/20'
                }`}
              />
              {confirm && confirm !== password && (
                <p className="text-body-sm text-error">Les mots de passe ne correspondent pas</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !password || !confirm}
              className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <><span className="material-symbols-outlined text-[20px]">lock</span>Enregistrer le mot de passe</>
              }
            </button>

            <Link to="/login" className="flex items-center justify-center gap-1 text-on-surface-variant hover:text-primary text-label-md transition-colors">
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Retour à la connexion
            </Link>
          </form>
        )}
      </main>
    </div>
  )
}
