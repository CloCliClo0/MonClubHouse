import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { LangProvider } from './i18n/LangContext'
import './index.css'

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      const err = this.state.error as Error
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

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <LangProvider>
      <App />
    </LangProvider>
  </ErrorBoundary>,
)
