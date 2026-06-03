import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'

export default function ForgotPasswordPage() {
  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await api.post('/auth/forgot-password', { email })
      setSent(true)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Une erreur est survenue.')
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
            <span className="material-symbols-outlined text-white text-[28px]">lock_reset</span>
          </div>
          <h1 className="text-headline-lg text-on-surface text-center">Mot de passe oublié</h1>
          <p className="text-body-md text-on-surface-variant text-center mt-1">
            Entrez votre email pour recevoir un lien de réinitialisation
          </p>
        </div>

        {sent ? (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-5 py-6 rounded-xl text-center">
              <span className="material-symbols-outlined text-green-600 text-[40px]">mark_email_read</span>
              <div>
                <p className="text-label-lg font-semibold mb-1">Email envoyé !</p>
                <p className="text-body-sm">Si l'adresse <strong>{email}</strong> est associée à un compte, vous recevrez un lien dans les prochaines minutes.</p>
                <p className="text-body-sm mt-2 text-green-700">Vérifiez aussi votre dossier spam.</p>
              </div>
            </div>
            <Link
              to="/login"
              className="flex items-center justify-center gap-2 w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container transition-colors"
            >
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-sm">
                <span className="material-symbols-outlined text-[18px]">error</span>
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Adresse e-mail</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="nom@votreclub.fr"
                required
                autoFocus
                autoComplete="email"
                className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={loading || !email.trim()}
              className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container disabled:opacity-40 transition-all flex items-center justify-center gap-2"
            >
              {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <><span className="material-symbols-outlined text-[20px]">send</span>Envoyer le lien</>
              }
            </button>

            <Link
              to="/login"
              className="flex items-center justify-center gap-1 text-on-surface-variant hover:text-primary text-label-md transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Retour à la connexion
            </Link>
          </form>
        )}
      </main>
    </div>
  )
}
