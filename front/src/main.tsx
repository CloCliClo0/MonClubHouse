import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './i18n/LangContext'
import './index.css'

// Après un déploiement, un onglet resté ouvert peut tenter de charger un chunk
// (page lazy) dont le hash n'existe plus sur le serveur → on force un reload
// complet (une seule fois, pour éviter une boucle) qui récupère le nouvel index.html.
function isChunkLoadError(err: Error) {
  return /dynamically imported module|Importing a module script failed|Loading chunk|Failed to fetch dynamically imported module/i.test(err.message || '')
}

function reloadOnceForChunkError() {
  const key = 'mch-chunk-reload-at'
  const last = Number(sessionStorage.getItem(key) || 0)
  if (Date.now() - last > 10000) {
    sessionStorage.setItem(key, String(Date.now()))
    window.location.reload()
    return true
  }
  return false
}

window.addEventListener('vite:preloadError', () => {
  reloadOnceForChunkError()
})

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  componentDidCatch(error: Error) {
    if (isChunkLoadError(error)) reloadOnceForChunkError()
  }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
      if (isChunkLoadError(err)) {
        // Reload déjà déclenché par componentDidCatch ; on n'affiche rien pendant la transition.
        return null
      }
      return (
        <div style={{ padding: 40, fontFamily: 'monospace', background: '#fff1f2', minHeight: '100vh' }}>
          <h2 style={{ color: '#b91c1c' }}>❌ Erreur de rendu</h2>
          <p style={{ color: '#7f1d1d', marginBottom: 16 }}>{err.message}</p>
          <pre style={{ background: '#fee2e2', padding: 16, borderRadius: 8, fontSize: 12, overflow: 'auto' }}>
            {err.stack}
          </pre>
          <button
            onClick={() => { this.setState({ error: null }); window.location.href = '/login' }}
            style={{ marginTop: 20, padding: '10px 24px', background: '#0f5238', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
          >
            Retourner à la connexion
          </button>
        </div>
      )
    }
    return this.props.children
  }
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LangProvider>
      <App />
    </LangProvider>
  </ErrorBoundary>,
)
