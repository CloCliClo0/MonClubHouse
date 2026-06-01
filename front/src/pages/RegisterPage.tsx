import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    navigate('/dashboard')
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

        <form className="w-full flex flex-col gap-6" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant" htmlFor="first_name">
                Prénom
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id="first_name"
                type="text"
                placeholder="Jean"
                required
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-label-md text-on-surface-variant" htmlFor="last_name">
                Nom
              </label>
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                id="last_name"
                type="text"
                placeholder="Dupont"
                required
              />
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="email">
              Email
            </label>
            <input
              className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
              id="email"
              type="email"
              placeholder="jean.dupont@email.com"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="password">
              Mot de passe
            </label>
            <div className="relative">
              <input
                className="w-full px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[20px]">
                  {showPassword ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <p className="text-body-sm text-on-surface-variant/70 italic">
              8 car. min., 1 majuscule, 1 chiffre
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-label-md text-on-surface-variant" htmlFor="role">
              Rôle
            </label>
            <div className="relative">
              <select
                className="w-full appearance-none px-4 py-2.5 rounded-lg border border-outline-variant bg-white text-on-surface text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all pr-10"
                id="role"
                required
              >
                <option value="" disabled selected>
                  Choisir un rôle
                </option>
                <option value="joueur">Joueur</option>
                <option value="parent">Parent</option>
                <option value="visiteur">Visiteur</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-on-surface-variant">
                <span className="material-symbols-outlined">expand_more</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="w-full mt-2 bg-primary-container text-white py-3 px-6 rounded-lg text-label-lg hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            Créer mon compte
          </button>
        </form>

        <footer className="mt-8 text-center space-y-3">
          <p className="text-body-md text-on-surface-variant">
            Déjà un compte ?{' '}
            <Link to="/login" className="text-primary font-bold hover:underline ml-1">
              Se connecter
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
