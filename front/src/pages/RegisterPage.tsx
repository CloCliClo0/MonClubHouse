import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function RegisterPage() {
  const [searchParams] = useSearchParams()
  const [form, setForm] = useState({
    prenom: '', nom: '', email: '', password: '',
    telephone: '',
    invite_code: (searchParams.get('code') || '').toUpperCase(),
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState('')
  const navigate = useNavigate()

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.')
      return
    }
    if (!form.telephone.trim()) {
      setError('Le numéro de téléphone est requis.')
      return
    }
    if (!form.invite_code.trim()) {
      setError('Un code d\'invitation est requis.')
      return
    }
    setLoading(true)
    try {
      const res = await api.post('/auth/register', {
        ...form,
        invite_code: form.invite_code.trim().toUpperCase(),
      })
      const { access_token, refresh_token, user, invite_role } = res.data.data
      localStorage.setItem('token',         access_token)
      localStorage.setItem('refresh_token', refresh_token || '')
      localStorage.setItem('userId',        String(user.id))
      localStorage.setItem('prenom',        user.prenom || user.nom || '')
      localStorage.setItem('role',          user.role || 'joueur')

      // Si parent, aller lier l'enfant
      if (invite_role === 'parent') {
        navigate('/join', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (err.response?.status === 409) {
        setError('Cette adresse email est déjà utilisée.')
      } else if (err.response?.status === 400) {
        setError(msg || 'Code d\'invitation invalide ou expiré.')
      } else if (err.response?.status === 503 || !err.response) {
        setError('Serveur ou base de données indisponible.')
      } else {
        setError(msg || 'Une erreur est survenue.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'linear-gradient(135deg, #2b2d42 0%, #1b4332 100%)' }}
    >
      <main className="w-full max-w-[440px] bg-white rounded-xl p-10 shadow-2xl flex flex-col items-center">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="w-14 h-14 bg-primary-container rounded-lg flex items-center justify-center mb-4">
            <span className="text-white font-black text-xl tracking-tight">MCH</span>
          </div>
          <h1 className="text-headline-lg text-on-surface mb-2">Créer un compte</h1>
          <p className="text-body-md text-on-surface-variant">Rejoins ton club</p>
        </div>

        {error && (
          <div className="w-full mb-4 flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
            <span className="material-symbols-outlined text-[18px] shrink-0 mt-0.5">error</span>
            {error}
          </div>
        )}

        <form className="w-full flex flex-col gap-5" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant" htmlFor="prenom">Prénom *</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id="prenom" type="text" placeholder="Jean" required
                value={form.prenom} onChange={e => set('prenom', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant" htmlFor="nom">Nom *</label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id="nom" type="text" placeholder="Dupont" required
                value={form.nom} onChange={e => set('nom', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="telephone">Téléphone *</label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="telephone" type="tel" placeholder="06 12 34 56 78" required
              value={form.telephone} onChange={e => set('telephone', e.target.value)}
              autoComplete="tel"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="email">Email *</label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="email" type="email" placeholder="jean.dupont@email.com" required
              value={form.email} onChange={e => set('email', e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="password">Mot de passe *</label>
            <div className="relative">
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" required
                value={form.password} onChange={e => set('password', e.target.value)}
                autoComplete="new-password"
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant/70 italic">8 car. min.</p>
          </div>

          {/* Code d'invitation */}
          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="invite_code">
              Code d'invitation *
            </label>
            {form.invite_code && searchParams.get('code') ? (
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg border border-green-300 bg-green-50">
                <span className="material-symbols-outlined text-green-600 text-[20px] shrink-0">check_circle</span>
                <span className="font-mono tracking-widest text-green-800 text-body-md font-bold flex-1 text-center">
                  {form.invite_code}
                </span>
                <button
                  type="button"
                  onClick={() => set('invite_code', '')}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Modifier le code"
                >
                  <span className="material-symbols-outlined text-[18px]">edit</span>
                </button>
              </div>
            ) : (
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-mono tracking-widest text-center uppercase"
                id="invite_code" type="text"
                placeholder="Ex : U15-A3F2B1"
                required
                value={form.invite_code}
                onChange={e => set('invite_code', e.target.value.toUpperCase())}
                autoFocus={!form.invite_code}
              />
            )}
            <p className="text-body-sm text-on-surface-variant/70">
              Fourni par le dirigeant ou l'administrateur de votre club.
            </p>
          </div>

          <button
            type="submit" disabled={loading}
            className="w-full mt-2 bg-primary-container text-white py-3 px-6 rounded-lg text-label-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading
              ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
              : 'Créer mon compte'
            }
          </button>
        </form>

        <footer className="mt-8 text-center space-y-3">
          <p className="text-body-md text-on-surface-variant">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline ml-1">Se connecter</Link>
          </p>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-outline-variant" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-label-md text-on-surface-variant">ou</span>
            </div>
          </div>
          <Link to="/resultats-club"
            className="flex items-center justify-center gap-2 text-on-surface-variant hover:text-primary text-label-md transition-colors">
            <span className="material-symbols-outlined text-[18px]">leaderboard</span>
            Voir les résultats de mon club
          </Link>
        </footer>
      </main>
    </div>
  )
}
