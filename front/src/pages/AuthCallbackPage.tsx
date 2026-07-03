import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const code = params.get('code')
    if (!code) {
      navigate('/login?error=oauth_failed', { replace: true })
      return
    }

    // Échange le code one-time contre les JWTs (les tokens ne transitent plus en URL)
    api.post('/auth/oauth-exchange', { code })
      .then((res) => {
        const { access_token, refresh_token, isNew } = res.data.data
        localStorage.setItem('token', access_token)
        if (refresh_token) localStorage.setItem('refresh_token', refresh_token)
        try {
          const payload = JSON.parse(atob(access_token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
          if (payload.id)   localStorage.setItem('userId', String(payload.id))
          if (payload.role) localStorage.setItem('role',   payload.role)
        } catch {}

        const finish = () => navigate(isNew ? '/google-complete' : '/dashboard', { replace: true })

        api.get('/auth/me')
          .then((r) => {
            const u = r.data?.data
            if (u) {
              localStorage.setItem('prenom', u.prenom || u.nom || '')
              localStorage.setItem('nom',    u.nom || '')
              localStorage.setItem('email',  u.email || '')
              if (u.role) localStorage.setItem('role', u.role)
            }
          })
          .catch(() => {})
          .finally(finish)
      })
      .catch(() => navigate('/login?error=oauth_failed', { replace: true }))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f6]">
      <div className="flex flex-col items-center gap-4 text-on-surface-variant">
        <svg className="animate-spin h-8 w-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
        <p className="text-body-md">Connexion en cours…</p>
      </div>
    </div>
  )
}
