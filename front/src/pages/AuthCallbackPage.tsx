import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export default function AuthCallbackPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()

  useEffect(() => {
    const token   = params.get('token')
    const refresh = params.get('refresh')
    if (token) {
      localStorage.setItem('token', token)
      if (refresh) localStorage.setItem('refresh_token', refresh)
      navigate('/dashboard', { replace: true })
    } else {
      navigate('/login?error=oauth_failed', { replace: true })
    }
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
