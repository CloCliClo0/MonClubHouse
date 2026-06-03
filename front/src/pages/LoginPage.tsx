import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../services/api'

export default function LoginPage() {
  const [email, setEmail]           = useState('')
  const [password, setPassword]     = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]       = useState(false)
  const [error, setError]           = useState('')
  const navigate = useNavigate()

  const storeSession = (data: any) => {
    localStorage.setItem('token',  data.access_token)
    localStorage.setItem('userId', String(data.user.id))
    localStorage.setItem('prenom', data.user.prenom || data.user.nom || '')
    localStorage.setItem('role',   data.user.role || 'joueur')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await api.post('/auth/login', { email, password })
      storeSession(res.data.data)
      navigate('/dashboard', { replace: true })
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (err.response?.status === 401) {
        setError('Email ou mot de passe incorrect.')
      } else if (err.response?.status === 503 || !err.response) {
        setError('Serveur ou base de données indisponible. Vérifiez votre connexion.')
      } else {
        setError(msg || 'Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Contourne l'auth pour tester l'UI sans base de données (localhost uniquement)
  const devBypass = () => {
    localStorage.setItem('token',  'dev-bypass-token')
    localStorage.setItem('userId', '1')
    localStorage.setItem('prenom', 'Dev')
    localStorage.setItem('role',   'admin')
    navigate('/dashboard', { replace: true })
  }

  const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #2b2d42 0%, #1b4332 100%)' }}
    >
      <main className="w-full max-w-[420px] bg-white rounded-xl shadow-2xl overflow-hidden" style={{ padding: '40px' }}>
        {/* Header */}
        <header className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-primary-container rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-black text-xl tracking-tighter">MCH</span>
          </div>
          <h1 className="text-display-lg text-on-background text-center">MonClubHouse</h1>
          <p className="text-body-md text-on-surface-variant text-center mt-1">Ton club, ta maison</p>
        </header>

        {/* Erreur */}
        {error && (
          <div className="mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            {error}
          </div>
        )}

        {/* Form */}
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label className="block text-label-lg text-on-surface" htmlFor="email">
              Adresse e-mail
            </label>
            <input
              className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body-md outline-none"
              id="email"
              type="email"
              placeholder="nom@votreclub.fr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-label-lg text-on-surface" htmlFor="password">
                Mot de passe
              </label>
              <Link to="/forgot-password" className="text-label-md text-primary hover:underline">
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                className="w-full px-4 py-3 bg-white border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-body-md outline-none pr-12"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-primary-container hover:bg-primary text-white text-label-lg rounded-lg transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-outline-variant" />
          </div>
          <div className="relative flex justify-center text-label-md">
            <span className="px-3 bg-white text-on-surface-variant">ou</span>
          </div>
        </div>

        {/* Google */}
        <a
          href="/auth/google"
          className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-outline-variant hover:bg-surface-container-low text-on-surface text-label-lg rounded-lg transition-all"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Continuer avec Google
        </a>

        {/* Mode démo (local uniquement) */}
        {isDev && (
          <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-[11px] text-amber-700 font-semibold uppercase tracking-wider mb-2">Développement local</p>
            <p className="text-body-sm text-amber-700 mb-2">Base de données non disponible localement ? Utilisez le mode démo pour tester l'interface.</p>
            <button
              onClick={devBypass}
              className="w-full py-2 px-3 bg-amber-100 hover:bg-amber-200 text-amber-800 text-label-md rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[16px]">developer_mode</span>
              Accès démo (sans DB)
            </button>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-6 text-center space-y-3">
          <p className="text-body-md text-on-surface-variant">
            Pas de compte ?{' '}
            <Link to="/register" className="text-primary text-label-lg hover:underline decoration-2 underline-offset-4 ml-1">
              S'inscrire
            </Link>
          </p>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-label-md text-on-surface-variant">ou</span>
            </div>
          </div>
          <Link
            to="/resultats-club"
            className="flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary text-label-md transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">leaderboard</span>
            Voir les résultats de mon club
          </Link>
        </footer>
      </main>
    </div>
  )
}
