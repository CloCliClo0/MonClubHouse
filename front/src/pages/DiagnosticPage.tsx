import { useEffect, useRef, useState } from 'react'
import api, { getApiErrorMessage } from '../services/api'

// ── Types ────────────────────────────────────────────────────────────────────
type EndpointResult = {
  method: string; path: string; label: string; section: string
  status: number | null; ok: boolean | null; ms: number | null; msg: string; body?: any
}

type ServerDiag = {
  server: {
    uptime_s: number; uptime_human: string; node_version: string
    env: string; pid: number; app_url: string
    memory: { heap_used_mb: number; heap_total_mb: number; rss_mb: number; heap_pct: number }
    os: { type: string; free_mem_mb: number; total_mem_mb: number; load_avg: number[]; cpus: number }
  }
  database: { ok: boolean; ping_ms: number | null; error: string | null; dialect: string; counts: Record<string, number | null> }
  schema: { table: string; exists: boolean; isColumn?: boolean; error?: string }[]
  env: Record<string, string>
  diagnostic_ms: number
  timestamp: string
}

// ── Endpoints to test ───────────────────────────────────────────────────────
const ENDPOINTS: Omit<EndpointResult, 'status' | 'ok' | 'ms' | 'msg' | 'body'>[] = [
  // Santé
  { section: 'Santé',          method: 'GET', path: '/api/ping',                   label: 'Ping serveur' },
  { section: 'Santé',          method: 'GET', path: '/health',                     label: 'Health check' },
  { section: 'Santé',          method: 'GET', path: '/api/diagnostic',             label: 'Diagnostic serveur' },
  // Auth / Profil
  { section: 'Auth',           method: 'GET', path: '/api/profil',                 label: 'Mon profil' },
  { section: 'Auth',           method: 'GET', path: '/api/profil/notifications',   label: 'Notifications' },
  { section: 'Auth',           method: 'GET', path: '/api/profil/historique',      label: 'Historique connexions' },
  // Clubs
  { section: 'Clubs',          method: 'GET', path: '/api/clubs',                  label: 'Liste des clubs' },
  // Équipes
  { section: 'Équipes',        method: 'GET', path: '/api/equipes',                label: 'Toutes équipes' },
  { section: 'Équipes',        method: 'GET', path: '/api/equipes/categories-coach', label: 'Catégories coach' },
  // Licenciés
  { section: 'Licenciés',      method: 'GET', path: '/api/licencies',              label: 'Liste licenciés' },
  // Matchs
  { section: 'Matchs',         method: 'GET', path: '/api/matchs',                 label: 'Tous matchs' },
  { section: 'Matchs',         method: 'GET', path: '/api/matchs?type=entrainement', label: 'Entraînements' },
  // Chat
  { section: 'Chat',           method: 'GET', path: '/api/chat/channels',          label: 'Channels' },
  // Résultats
  { section: 'Résultats',      method: 'GET', path: '/api/resultats',              label: 'Résultats' },
  // Admin
  { section: 'Admin',          method: 'GET', path: '/api/admin/dashboard',        label: 'Dashboard admin' },
  { section: 'Admin',          method: 'GET', path: '/api/admin/users',            label: 'Tous les membres' },
  // Codes
  { section: 'Codes',          method: 'GET', path: '/api/codes',                  label: "Codes d'invitation" },
  // Adversaires
  { section: 'Adversaires',    method: 'GET', path: '/api/adversaires',            label: 'Adversaires' },
  // Support
  { section: 'Support',        method: 'GET', path: '/api/support',                label: 'Tickets support (admin)' },
  { section: 'Support',        method: 'GET', path: '/api/support/stats',          label: 'Stats tickets support' },
  { section: 'Support',        method: 'GET', path: '/api/support/mes-tickets',    label: 'Mes tickets support' },
  // Championnat
  { section: 'Championnat',    method: 'GET', path: '/api/championnat/list',       label: 'Championnats list' },
  // Votes & Arbitrage
  { section: 'Arbitrage',      method: 'GET', path: '/api/arbitrage/matchs-besoin-arbitre', label: 'Matchs besoin arbitre' },
  { section: 'Arbitrage',      method: 'GET', path: '/api/arbitrage/presences',    label: 'Présences arbitrage' },
  { section: 'Arbitrage',      method: 'GET', path: '/api/arbitrage/stats',        label: 'Stats arbitrage' },
  // Licenciés
  { section: 'Licenciés',      method: 'GET', path: '/api/licencies/mes-convocations', label: 'Mes convocations (joueur/parent)' },
  // Résultats stats
  { section: 'Résultats',      method: 'GET', path: '/api/resultats/stats/buteurs',    label: 'Stats buteurs' },
  { section: 'Résultats',      method: 'GET', path: '/api/resultats/stats/equipes',    label: 'Stats équipes' },
  { section: 'Résultats',      method: 'GET', path: '/api/resultats/stats/presence',   label: 'Stats présences' },
  // Catégories
  { section: 'Clubs',          method: 'GET', path: '/api/categories',                 label: 'Catégories' },
  // Club stats
  { section: 'Clubs',          method: 'GET', path: '/api/clubs/stats',                label: 'Stats club' },
  // Codes
  { section: 'Codes',          method: 'GET', path: '/api/codes/my-children',          label: 'Mes enfants (parent)' },
  { section: 'Codes',          method: 'GET', path: '/api/codes/club-players',         label: 'Joueurs du club' },
  // Matchs événements — :sampleMatchId est résolu dynamiquement au lancement des tests
  // (le match #1 était un enregistrement de test, supprimé depuis — un id fixe fait
  // échouer ces deux tests en permanence avec un faux-positif 404).
  { section: 'Matchs',         method: 'GET', path: '/api/matchs/:sampleMatchId/events',       label: 'Événements match (échantillon)' },
  { section: 'Matchs',         method: 'GET', path: '/api/matchs/:sampleMatchId/convocations', label: 'Convocations match (échantillon)' },
  // Abonnement / Codes promo
  { section: 'Abonnement',     method: 'GET', path: '/api/subscription/status',        label: 'Statut abonnement' },
  { section: 'Abonnement',     method: 'GET', path: '/api/subscription/admin',         label: 'Liste abonnements (superadmin)' },
  { section: 'Abonnement',     method: 'GET', path: '/api/promo-codes',                label: 'Codes promo (superadmin)' },
]

// ── Tests CRUD complets (GET + POST + UPDATE + DELETE) par ressource ────────
// Couvre chaque contrôleur/ressource offrant un cycle create→read→update→delete sûr et jetable.
// Exclus volontairement : Match/ChEquipe (nécessiteraient une vraie équipe existante comme FK —
// même transitoire, un faux match/adversaire apparaîtrait sur le calendrier/classement d'une
// vraie équipe) ; Licencié (pas de route DELETE, et nécessite un vrai user_id existant) ;
// Club (entité trop lourde/sensible pour une création jetable automatique) ; Auth/Chat/Vote/
// Arbitrage/Abonnement (pas de cycle CRUD complet ou intégration Stripe réelle).
type CrudResource = {
  key: string; label: string
  needsClub?: boolean
  createPath: string
  buildCreate: (clubId: number | null) => Record<string, any>
  getPath: string
  updateMethod: 'put' | 'patch'
  updatePath: (id: number) => string
  buildUpdate: () => Record<string, any>
  deleteMethod?: 'delete' | 'patch'
  deletePath: (id: number) => string
  softDelete?: boolean
}

const CRUD_RESOURCES: CrudResource[] = [
  {
    key: 'categorie', label: 'Catégorie', needsClub: true,
    createPath: '/categories',
    buildCreate: (clubId) => ({ nom: `__diag_test_${Date.now()}__`, club_id: clubId }),
    getPath: '/categories',
    updateMethod: 'put',
    updatePath: (id) => `/categories/${id}`,
    buildUpdate: () => ({ nom: `__diag_test_updated__` }),
    deletePath: (id) => `/categories/${id}`,
  },
  {
    key: 'adversaire', label: 'Adversaire', needsClub: true,
    createPath: '/adversaires',
    buildCreate: (clubId) => ({ nom: `__diag_test_${Date.now()}__`, club_id: clubId }),
    getPath: '/adversaires',
    updateMethod: 'patch',
    updatePath: (id) => `/adversaires/${id}`,
    buildUpdate: () => ({ nom: `__diag_test_updated__` }),
    deletePath: (id) => `/adversaires/${id}`,
  },
  {
    key: 'promo', label: 'Code promo',
    createPath: '/promo-codes',
    buildCreate: () => ({ code: `DIAGTEST${Date.now()}`, type: 'percent', valeur: 1 }),
    getPath: '/promo-codes',
    updateMethod: 'patch',
    updatePath: (id) => `/promo-codes/${id}`,
    buildUpdate: () => ({ description: 'Test diagnostic' }),
    deletePath: (id) => `/promo-codes/${id}`,
  },
  {
    key: 'code_invitation', label: "Code d'invitation", needsClub: true,
    createPath: '/codes',
    buildCreate: (clubId) => ({ role: 'dirigeant', club_id: clubId, label: `__diag_test_${Date.now()}__`, max_uses: 1 }),
    getPath: '/codes',
    updateMethod: 'patch',
    updatePath: (id) => `/codes/${id}/disable`,
    buildUpdate: () => ({}),
    deletePath: (id) => `/codes/${id}`,
  },
  {
    key: 'equipe', label: 'Équipe', needsClub: true,
    createPath: '/equipes',
    buildCreate: (clubId) => ({ nom: `__diag_test_${Date.now()}__`, club_id: clubId }),
    getPath: '/equipes',
    updateMethod: 'put',
    updatePath: (id) => `/equipes/${id}`,
    buildUpdate: () => ({ nom: `__diag_test_updated__` }),
    deleteMethod: 'patch',
    deletePath: (id) => `/equipes/${id}/disable`,
    softDelete: true,
  },
  {
    key: 'terrain', label: 'Terrain', needsClub: true,
    createPath: '/clubs/terrains',
    buildCreate: (clubId) => ({ nom: `__diag_test_${Date.now()}__`, club_id: clubId }),
    getPath: '/clubs/terrains',
    updateMethod: 'put',
    updatePath: (id) => `/clubs/terrains/${id}`,
    buildUpdate: () => ({ nom: `__diag_test_updated__` }),
    deleteMethod: 'patch',
    deletePath: (id) => `/clubs/terrains/${id}/disable`,
    softDelete: true,
  },
  {
    key: 'ticket_support', label: 'Ticket support',
    createPath: '/support',
    buildCreate: () => ({ sujet: `__diag_test_${Date.now()}__`, message: 'Test diagnostic CRUD automatique.' }),
    getPath: '/support',
    updateMethod: 'patch',
    updatePath: (id) => `/support/${id}`,
    buildUpdate: () => ({ statut: 'resolu' }),
    deletePath: (id) => `/support/${id}`,
  },
]

type CrudStepResult = { ok: boolean; ms: number | null; status: number | null; error: string | null }
type CrudResourceState = { get: CrudStepResult | null; post: CrudStepResult | null; update: CrudStepResult | null; delete: CrudStepResult | null }

// ── Helpers ──────────────────────────────────────────────────────────────────
function classify(status: number | null): 'ok' | 'warn' | 'err' | 'pending' {
  if (status === null) return 'pending'
  if (status >= 200 && status < 300) return 'ok'
  if (status === 401 || status === 403) return 'warn'
  return 'err'
}

const BADGE: Record<string, string> = {
  ok:      'bg-green-900/60 text-green-300 border border-green-700',
  warn:    'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
  err:     'bg-red-900/60 text-red-300 border border-red-700',
  pending: 'bg-blue-900/40 text-blue-400 border border-blue-800',
}
const TEXT: Record<string, string> = {
  ok: 'text-green-400', warn: 'text-yellow-400', err: 'text-red-400', pending: 'text-slate-500'
}

function initResults(): EndpointResult[] {
  return ENDPOINTS.map(ep => ({ ...ep, status: null, ok: null, ms: null, msg: '—' }))
}

// ── Component ────────────────────────────────────────────────────────────────
export default function DiagnosticPage() {
  const role = localStorage.getItem('role')
  if (role !== 'superadmin') return (
    <div className="py-20 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[56px] block mb-3 opacity-30">lock</span>
      <p className="text-headline-md">Accès réservé au Super Administrateur</p>
    </div>
  )

  const [results, setResults]     = useState<EndpointResult[]>(initResults)
  const [running, setRunning]     = useState(false)
  const [progress, setProgress]   = useState(0)
  const [filter, setFilter]       = useState<'all' | 'ok' | 'warn' | 'err'>('all')
  const [serverDiag, setServerDiag] = useState<ServerDiag | null>(null)
  const [diagLoading, setDiagLoading] = useState(false)
  const [lastRun, setLastRun]     = useState<string | null>(null)
  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const abortRef = useRef(false)

  type GeminiTokens = { prompt: number | null; response: number | null; total: number | null }
  type GeminiQuota  = { used: number; limit: number; remaining: number }
  type GeminiResult = { ok: boolean; model: string | null; ms: number | null; response: string | null; error: string | null; tokens: GeminiTokens | null; quota: GeminiQuota | null }
  const [geminiResult, setGeminiResult] = useState<GeminiResult | null>(null)
  const [geminiLoading, setGeminiLoading] = useState(false)

  type StripeResult = { ok: boolean; mode: 'test' | 'live'; enabled: boolean; ms: number | null; error: string | null; livemode: boolean | null; available: { amount: number; currency: string }[] | null }
  const [stripeResult, setStripeResult] = useState<StripeResult | null>(null)
  const [stripeLoading, setStripeLoading] = useState(false)

  type DiagUser = { id: number; nom: string; prenom: string; email: string }
  type TestFnResult = { ok: boolean; ms: number | null; to: string; error: string | null } | null
  type DriveResult  = { ok: boolean; ms: number | null; fileId?: string; url?: string; name?: string; error: string | null } | null
  const [diagUsers, setDiagUsers]         = useState<DiagUser[]>([])
  const [testUserId, setTestUserId]       = useState<string>('')
  const [emailResult, setEmailResult]     = useState<TestFnResult>(null)
  const [emailLoading, setEmailLoading]   = useState(false)
  const [notifResult, setNotifResult]     = useState<TestFnResult>(null)
  const [notifLoading, setNotifLoading]   = useState(false)
  const [driveResult, setDriveResult]     = useState<DriveResult>(null)
  const [driveLoading, setDriveLoading]   = useState(false)
  const [twoFaResult, setTwoFaResult]     = useState<TestFnResult>(null)
  const [twoFaLoading, setTwoFaLoading]   = useState(false)
  const [verifyResult, setVerifyResult]   = useState<TestFnResult>(null)
  const [verifyLoading, setVerifyLoading] = useState(false)
  const [convocEmailResult, setConvocEmailResult] = useState<TestFnResult>(null)
  const [convocEmailLoading, setConvocEmailLoading] = useState(false)
  const [crudResults, setCrudResults] = useState<Record<string, CrudResourceState>>({})
  const [crudRunning, setCrudRunning] = useState(false)
  const [crudClubId, setCrudClubId] = useState<number | null>(null)
  const [sampleMatchId, setSampleMatchId] = useState<number | null>(null)

  useEffect(() => {
    api.get('/admin/users').then(r => {
      const users: DiagUser[] = (r.data.data || []).map((u: any) => ({ id: u.id, nom: u.nom, prenom: u.prenom, email: u.email }))
      setDiagUsers(users)
      if (users.length > 0 && !testUserId) {
        const selfId = localStorage.getItem('userId')
        const self = selfId ? users.find(u => String(u.id) === selfId) : null
        setTestUserId(self ? String(self.id) : String(users[0].id))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/clubs').then(r => {
      const list = r.data.data || []
      if (list.length > 0) setCrudClubId(list[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    api.get('/matchs?limit=1').then(r => {
      const list = r.data.data || []
      if (list.length > 0) setSampleMatchId(list[0].id)
    }).catch(() => {})
  }, [])

  const runTestEmail = async () => {
    if (!testUserId) return
    setEmailLoading(true); setEmailResult(null)
    try {
      const r = await api.post('/diagnostic/test-email', { user_id: Number(testUserId) })
      setEmailResult(r.data.data)
    } catch (err: any) {
      setEmailResult({ ok: false, ms: null, to: '', error: err?.response?.data?.message || err?.message || 'Erreur réseau' })
    } finally { setEmailLoading(false) }
  }

  const runTestNotification = async () => {
    if (!testUserId) return
    setNotifLoading(true); setNotifResult(null)
    try {
      const r = await api.post('/diagnostic/test-notification', { user_id: Number(testUserId) })
      setNotifResult(r.data.data)
    } catch (err: any) {
      setNotifResult({ ok: false, ms: null, to: '', error: err?.response?.data?.message || err?.message || 'Erreur réseau' })
    } finally { setNotifLoading(false) }
  }

  const runTestDrive = async () => {
    setDriveLoading(true); setDriveResult(null)
    try {
      const r = await api.get('/diagnostic/drive')
      setDriveResult(r.data.data)
    } catch (err: any) {
      setDriveResult({ ok: false, ms: null, error: err?.response?.data?.message || err?.message || 'Erreur réseau' })
    } finally { setDriveLoading(false) }
  }

  const runTest2fa = async () => {
    if (!testUserId) return
    setTwoFaLoading(true); setTwoFaResult(null)
    try {
      const r = await api.post('/diagnostic/test-2fa', { user_id: Number(testUserId) })
      setTwoFaResult(r.data.data)
    } catch (err: any) {
      setTwoFaResult({ ok: false, ms: null, to: '', error: err?.response?.data?.message || err?.message || 'Erreur réseau' })
    } finally { setTwoFaLoading(false) }
  }

  const runTestConvocEmail = async () => {
    if (!testUserId) return
    setConvocEmailLoading(true); setConvocEmailResult(null)
    try {
      const r = await api.post('/diagnostic/test-convoc-email', { user_id: Number(testUserId) })
      setConvocEmailResult(r.data.data)
    } catch (err: any) {
      setConvocEmailResult({ ok: false, ms: null, to: '', error: err?.response?.data?.message || err?.message || 'Erreur réseau' })
    } finally { setConvocEmailLoading(false) }
  }

  const runCrudStep = async (fn: () => Promise<any>): Promise<CrudStepResult> => {
    const t0 = performance.now()
    try {
      const r = await fn()
      return { ok: true, ms: Math.round(performance.now() - t0), status: r.status, error: null }
    } catch (err: any) {
      return { ok: false, ms: Math.round(performance.now() - t0), status: err?.response?.status ?? null, error: getApiErrorMessage(err) }
    }
  }

  const runCrudTests = async () => {
    setCrudRunning(true)
    for (const res of CRUD_RESOURCES) {
      if (res.needsClub && !crudClubId) {
        const skipped: CrudStepResult = { ok: false, ms: null, status: null, error: 'Aucun club disponible pour ce test' }
        setCrudResults(prev => ({ ...prev, [res.key]: { get: skipped, post: skipped, update: skipped, delete: skipped } }))
        continue
      }

      const state: CrudResourceState = { get: null, post: null, update: null, delete: null }
      setCrudResults(prev => ({ ...prev, [res.key]: { ...state } }))

      let createdId: number | null = null
      state.post = await runCrudStep(async () => {
        const r = await api.post(res.createPath, res.buildCreate(crudClubId))
        createdId = r.data?.data?.id ?? null
        return r
      })
      setCrudResults(prev => ({ ...prev, [res.key]: { ...state } }))

      state.get = await runCrudStep(() => api.get(res.getPath))
      setCrudResults(prev => ({ ...prev, [res.key]: { ...state } }))

      if (createdId) {
        const id = createdId as number
        state.update = await runCrudStep(() => api[res.updateMethod](res.updatePath(id), res.buildUpdate()))
        setCrudResults(prev => ({ ...prev, [res.key]: { ...state } }))

        state.delete = await runCrudStep(() => res.deleteMethod === 'patch' ? api.patch(res.deletePath(id), {}) : api.delete(res.deletePath(id)))
        setCrudResults(prev => ({ ...prev, [res.key]: { ...state } }))
      } else {
        const skipped: CrudStepResult = { ok: false, ms: null, status: null, error: 'Ignoré (POST a échoué)' }
        state.update = skipped; state.delete = skipped
        setCrudResults(prev => ({ ...prev, [res.key]: { ...state } }))
      }
    }
    setCrudRunning(false)
  }

  const runTestVerifyEmail = async () => {
    if (!testUserId) return
    setVerifyLoading(true); setVerifyResult(null)
    try {
      const r = await api.post('/diagnostic/test-email-verify', { user_id: Number(testUserId) })
      setVerifyResult(r.data.data)
    } catch (err: any) {
      setVerifyResult({ ok: false, ms: null, to: '', error: err?.response?.data?.message || err?.message || 'Erreur réseau' })
    } finally { setVerifyLoading(false) }
  }

  const testGeminiApi = async () => {
    setGeminiLoading(true)
    setGeminiResult(null)
    try {
      const r = await api.get('/diagnostic/gemini')
      setGeminiResult(r.data.data)
    } catch (err: any) {
      setGeminiResult({ ok: false, model: null, ms: null, response: null, error: err?.response?.data?.message || err?.message || 'Erreur réseau', tokens: null, quota: null })
    } finally {
      setGeminiLoading(false)
    }
  }

  const testStripeApi = async () => {
    setStripeLoading(true)
    setStripeResult(null)
    try {
      const r = await api.get('/diagnostic/stripe')
      setStripeResult(r.data.data)
    } catch (err: any) {
      setStripeResult({ ok: false, mode: 'test', enabled: false, ms: null, error: err?.response?.data?.message || err?.message || 'Erreur réseau', livemode: null, available: null })
    } finally {
      setStripeLoading(false)
    }
  }

  const loadServerDiag = async () => {
    setDiagLoading(true)
    try {
      const r = await api.get('/diagnostic')
      setServerDiag(r.data.data)
    } catch {}
    finally { setDiagLoading(false) }
  }

  useEffect(() => { loadServerDiag() }, [])

  const runAll = async (onlyErrors = false) => {
    if (running) return
    setRunning(true)
    abortRef.current = false
    const base = results.map(r => onlyErrors
      ? (classify(r.status) !== 'ok' ? { ...r, status: null, ok: null, ms: null, msg: '—' } : r)
      : { ...r, status: null, ok: null, ms: null, msg: '—' }
    )
    setResults(base)
    setProgress(0)

    const eps = onlyErrors ? ENDPOINTS.filter((_, i) => classify(results[i].status) !== 'ok') : ENDPOINTS

    for (let i = 0; i < eps.length; i++) {
      if (abortRef.current) break
      const ep = eps[i]
      const resolvedPath = ep.path.replace(':sampleMatchId', String(sampleMatchId ?? 1))
      const t0 = performance.now()
      let status = 0, msg = '', body: any = null, ok = false
      try {
        const res = await fetch(window.location.origin + resolvedPath, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` },
          signal: AbortSignal.timeout(8000),
        })
        status = res.status
        ok = res.ok
        try { body = await res.json(); msg = body?.message || (ok ? 'OK' : 'Erreur') } catch { msg = ok ? 'OK' : 'Erreur' }
      } catch (err: any) {
        msg = err?.name === 'TimeoutError' ? 'Timeout (8s)' : (err?.message || 'Réseau')
      }
      const ms = Math.round(performance.now() - t0)

      setResults(prev => prev.map(r =>
        r.method === ep.method && r.path === ep.path
          ? { ...r, status, ok, ms, msg, body }
          : r
      ))
      setProgress(Math.round(((i + 1) / eps.length) * 100))
    }

    setLastRun(new Date().toLocaleTimeString('fr-FR'))
    setRunning(false)
    loadServerDiag()
  }

  const stop = () => { abortRef.current = true }

  const exportData = (format: 'json' | 'csv' | 'txt') => {
    const ts = new Date().toISOString()
    let content = '', filename = '', type = ''

    if (format === 'json') {
      content = JSON.stringify({ timestamp: ts, results, serverDiag }, null, 2)
      filename = `diagnostic-${ts.slice(0,10)}.json`; type = 'application/json'
    } else if (format === 'csv') {
      const lines = ['Section,Méthode,Route,Label,Statut,OK,Temps(ms),Message']
      results.forEach(r => lines.push(`"${r.section}","${r.method}","${r.path}","${r.label}",${r.status ?? ''},${r.ok ?? ''},${r.ms ?? ''},"${r.msg}"`))
      content = lines.join('\n'); filename = `diagnostic-${ts.slice(0,10)}.csv`; type = 'text/csv'
    } else {
      const ok = results.filter(r => classify(r.status) === 'ok').length
      const err = results.filter(r => classify(r.status) === 'err').length
      const warn = results.filter(r => classify(r.status) === 'warn').length
      content = `MonClubHouse — Rapport diagnostic API\n${'='.repeat(40)}\nDate : ${new Date().toLocaleString('fr-FR')}\n\n`
      content += `RÉSUMÉ : ${ok} OK | ${warn} Auth | ${err} Erreur(s)\n\n`
      const sections: Record<string, EndpointResult[]> = {}
      results.forEach(r => { if (!sections[r.section]) sections[r.section] = []; sections[r.section].push(r) })
      for (const [sec, rows] of Object.entries(sections)) {
        content += `\n── ${sec} ${'─'.repeat(Math.max(0, 30 - sec.length))}\n`
        rows.forEach(r => {
          const icon = classify(r.status) === 'ok' ? '✓' : classify(r.status) === 'warn' ? '!' : '✗'
          content += `  ${icon} [${r.status ?? '?'}] ${r.method} ${r.path} (${r.ms ?? '?'}ms) — ${r.msg}\n`
        })
      }
      if (serverDiag) {
        content += `\n── Serveur ${'─'.repeat(30)}\n`
        content += `  Node.js : ${serverDiag.server.node_version}\n`
        content += `  Uptime : ${serverDiag.server.uptime_human}\n`
        content += `  Mémoire heap : ${serverDiag.server.memory.heap_used_mb}/${serverDiag.server.memory.heap_total_mb} MB\n`
        content += `  DB ping : ${serverDiag.database.ping_ms ?? '?'}ms\n`
      }
      filename = `diagnostic-${ts.slice(0,10)}.txt`; type = 'text/plain'
    }

    const a = document.createElement('a')
    a.href = URL.createObjectURL(new Blob([content], { type }))
    a.download = filename; a.click(); URL.revokeObjectURL(a.href)
  }

  // Stats
  const done    = results.filter(r => r.status !== null)
  const okCount = done.filter(r => classify(r.status) === 'ok').length
  const warnCount = done.filter(r => classify(r.status) === 'warn').length
  const errCount  = done.filter(r => classify(r.status) === 'err').length
  const avgMs = done.length ? Math.round(done.reduce((s, r) => s + (r.ms || 0), 0) / done.length) : 0
  const slowest = done.reduce((a: EndpointResult | null, r) => (!a || (r.ms || 0) > (a.ms || 0)) ? r : a, null)

  // Filtered list
  const sections = [...new Set(ENDPOINTS.map(e => e.section))]
  const filtered = (sec: string) => results
    .filter(r => r.section === sec)
    .filter(r => filter === 'all' || classify(r.status) === filter || (filter !== 'ok' && r.status === null))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-headline-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">bug_report</span>
          Diagnostic système
        </h2>
        <p className="text-body-md text-on-surface-variant">Superadmin — Test de toutes les routes API et état du serveur</p>
      </div>

      {/* Contrôles */}
      <div className="flex flex-wrap gap-3 items-center">
        {!running
          ? <button onClick={() => runAll(false)} className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
              <span className="material-symbols-outlined text-[18px]">play_arrow</span>Tester tout
            </button>
          : <button onClick={stop} className="flex items-center gap-2 bg-red-600 text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-red-700 transition-colors">
              <span className="material-symbols-outlined text-[18px]">stop</span>Arrêter
            </button>
        }
        <button onClick={() => runAll(true)} disabled={running} className="flex items-center gap-2 border border-outline-variant px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors disabled:opacity-40">
          <span className="material-symbols-outlined text-[18px]">replay</span>Rejouer erreurs
        </button>
        <button onClick={loadServerDiag} disabled={diagLoading} className="flex items-center gap-2 border border-outline-variant px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors disabled:opacity-40">
          <span className="material-symbols-outlined text-[18px]">refresh</span>Actualiser serveur
        </button>

        {/* Export group */}
        <div className="flex gap-2 ml-auto">
          <button onClick={() => exportData('json')} className="flex items-center gap-1.5 border border-outline-variant px-3 py-2 rounded-lg text-label-md hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[16px]">data_object</span>JSON
          </button>
          <button onClick={() => exportData('csv')} className="flex items-center gap-1.5 border border-outline-variant px-3 py-2 rounded-lg text-label-md hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[16px]">table_chart</span>CSV
          </button>
          <button onClick={() => exportData('txt')} className="flex items-center gap-1.5 border border-outline-variant px-3 py-2 rounded-lg text-label-md hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[16px]">description</span>Rapport
          </button>
        </div>
      </div>

      {/* Barre de progression */}
      {running && (
        <div className="h-1.5 bg-surface-container-low rounded-full overflow-hidden">
          <div className="h-full bg-primary transition-all duration-200 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      )}
      {lastRun && !running && (
        <p className="text-body-sm text-on-surface-variant">
          Dernière exécution : {lastRun} — <span className="text-green-600">{okCount} OK</span>, <span className="text-yellow-500">{warnCount} auth</span>, <span className="text-red-500">{errCount} erreur(s)</span>
        </p>
      )}

      {/* Stats rapides */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Routes OK',   value: okCount,   color: 'text-green-400', bg: 'bg-green-900/30 border-green-800/50' },
          { label: 'Auth 401',    value: warnCount, color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-800/50' },
          { label: 'Erreurs',     value: errCount,  color: 'text-red-400',    bg: 'bg-red-900/30 border-red-800/50' },
          { label: 'Temps moyen', value: done.length ? `${avgMs}ms` : '—', color: 'text-blue-400', bg: 'bg-blue-900/30 border-blue-800/50' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl p-4 text-center border ${s.bg}`}>
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-label-sm text-on-surface-variant mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Server info */}
      {serverDiag && (
        <div className="bg-surface-container-low border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
            <span className="text-label-lg font-semibold flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px] text-primary">dns</span>
              État du serveur
            </span>
            <span className="text-body-sm text-on-surface-variant">{serverDiag.server.uptime_human} uptime</span>
          </div>
          <div className="p-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            <InfoTile icon="memory" label="Heap mémoire" value={`${serverDiag.server.memory.heap_used_mb}/${serverDiag.server.memory.heap_total_mb} MB`} sub={`${serverDiag.server.memory.heap_pct}% utilisé`} warn={serverDiag.server.memory.heap_pct > 80} />
            <InfoTile icon="storage" label="RSS mémoire" value={`${serverDiag.server.memory.rss_mb} MB`} />
            <InfoTile icon="code" label="Node.js" value={serverDiag.server.node_version} sub={serverDiag.server.env} />
            <InfoTile icon="database" label="DB ping" value={serverDiag.database.ping_ms !== null ? `${serverDiag.database.ping_ms}ms` : 'Erreur'} warn={!serverDiag.database.ok} sub={serverDiag.database.ok ? serverDiag.database.dialect : serverDiag.database.error || '—'} />
            <InfoTile icon="speed" label="Load avg" value={serverDiag.server.os.load_avg[0].toString()} sub={`${serverDiag.server.os.cpus} CPU(s)`} warn={serverDiag.server.os.load_avg[0] > serverDiag.server.os.cpus} />
            <InfoTile icon="swap_horiz" label="RAM OS libre" value={`${serverDiag.server.os.free_mem_mb} MB`} sub={`/ ${serverDiag.server.os.total_mem_mb} MB`} />
            <InfoTile icon="schedule" label="Uptime" value={serverDiag.server.uptime_human} sub={`PID ${serverDiag.server.pid}`} />
            <InfoTile icon="cloud" label="Environnement" value={serverDiag.server.env} sub={serverDiag.server.app_url} />
          </div>

          {/* DB counts */}
          <div className="px-5 pb-5">
            <p className="text-label-md text-on-surface-variant mb-3">Comptages DB</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(serverDiag.database.counts).map(([k, v]) => (
                <span key={k} className={`px-3 py-1.5 rounded-lg text-label-md border ${v === null ? 'bg-red-900/30 text-red-300 border-red-800/50' : 'bg-surface-container text-on-surface border-[#e8e8f0]'}`}>
                  <span className="text-on-surface-variant">{k} : </span>
                  <span className="font-bold">{v !== null ? v : '⚠ erreur'}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Schema checks */}
          <div className="px-5 pb-5 border-t border-[#e8e8f0] pt-4">
            <p className="text-label-md text-on-surface-variant mb-3">Schéma DB</p>
            <div className="flex flex-wrap gap-2">
              {serverDiag.schema.map(s => (
                <span key={s.table} className={`px-2.5 py-1 rounded text-label-sm font-mono ${s.exists ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                  {s.exists ? '✓' : '✗'} {s.table}
                </span>
              ))}
            </div>
          </div>

          {/* Env vars */}
          <div className="px-5 pb-5 border-t border-[#e8e8f0] pt-4">
            <p className="text-label-md text-on-surface-variant mb-3">Variables d'environnement</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(serverDiag.env).map(([k, v]) => (
                <span key={k} className={`px-2.5 py-1 rounded text-label-sm font-mono ${v.startsWith('✓') ? 'bg-green-900/40 text-green-300' : 'bg-red-900/40 text-red-300'}`}>
                  {v.startsWith('✓') ? '✓' : '✗'} {k}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Gemini API test */}
      <div className="bg-surface-container-low border border-[#e8e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
          <span className="text-label-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">smart_toy</span>
            Test API Gemini
          </span>
          <button
            onClick={testGeminiApi}
            disabled={geminiLoading}
            className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
          >
            {geminiLoading
              ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">send</span>
            }
            {geminiLoading ? 'Test en cours…' : 'Tester Gemini'}
          </button>
        </div>
        <div className="p-5">
          {!geminiResult && !geminiLoading && (
            <p className="text-body-sm text-on-surface-variant">Cliquez sur "Tester Gemini" pour vérifier la clé API et la connectivité.</p>
          )}
          {geminiLoading && (
            <p className="text-body-sm text-on-surface-variant animate-pulse">Envoi d'une requête de test à l'API Gemini…</p>
          )}
          {geminiResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className={`rounded-lg px-4 py-3 border flex items-center gap-2 ${geminiResult.ok ? 'bg-green-900/20 border-green-800/40' : 'bg-red-900/20 border-red-800/40'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${geminiResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {geminiResult.ok ? 'check_circle' : 'error'}
                  </span>
                  <div>
                    <p className={`text-label-lg font-bold ${geminiResult.ok ? 'text-green-300' : 'text-red-300'}`}>
                      {geminiResult.ok ? 'Opérationnel' : 'Échec'}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">Statut</p>
                  </div>
                </div>
                {geminiResult.model && (
                  <InfoTile icon="model_training" label="Modèle" value={geminiResult.model} />
                )}
                {geminiResult.ms !== null && (
                  <InfoTile icon="speed" label="Latence" value={`${geminiResult.ms}ms`} warn={geminiResult.ms > 3000} />
                )}
                {geminiResult.response && (
                  <InfoTile icon="chat" label="Réponse IA" value={geminiResult.response} />
                )}
              </div>

              {/* Tokens */}
              {geminiResult.tokens && (
                <div className="flex flex-wrap gap-3">
                  <InfoTile icon="token" label="Tokens prompt" value={geminiResult.tokens.prompt !== null ? String(geminiResult.tokens.prompt) : '—'} />
                  <InfoTile icon="output" label="Tokens réponse" value={geminiResult.tokens.response !== null ? String(geminiResult.tokens.response) : '—'} />
                  <InfoTile icon="functions" label="Tokens total" value={geminiResult.tokens.total !== null ? String(geminiResult.tokens.total) : '—'} />
                </div>
              )}

              {/* Quota journalier */}
              {geminiResult.quota && (
                <div className="flex flex-wrap gap-3 items-center">
                  <InfoTile
                    icon="bar_chart"
                    label="Requêtes utilisées (auj.)"
                    value={`${geminiResult.quota.used} / ${geminiResult.quota.limit}`}
                    warn={geminiResult.quota.remaining === 0}
                  />
                  <InfoTile
                    icon="event_available"
                    label="Requêtes restantes"
                    value={String(geminiResult.quota.remaining)}
                    warn={geminiResult.quota.remaining === 0}
                  />
                  <div className="flex-1 min-w-[160px]">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Progression quota</p>
                    <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${geminiResult.quota.remaining === 0 ? 'bg-red-500' : geminiResult.quota.used / geminiResult.quota.limit > 0.8 ? 'bg-yellow-500' : 'bg-green-500'}`}
                        style={{ width: `${geminiResult.quota.limit > 0 ? Math.min(100, Math.round((geminiResult.quota.used / geminiResult.quota.limit) * 100)) : 0}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-on-surface-variant mt-0.5">
                      {geminiResult.quota.limit > 0 ? Math.round((geminiResult.quota.used / geminiResult.quota.limit) * 100) : 0}% utilisé — reset à minuit
                    </p>
                  </div>
                </div>
              )}

              {geminiResult.error && (
                <div className="rounded-lg px-4 py-3 border bg-red-900/20 border-red-800/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Erreur</p>
                  <p className="text-label-md text-red-300 font-mono break-all">{geminiResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stripe API test */}
      <div className="bg-surface-container-low border border-[#e8e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
          <span className="text-label-lg font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-[18px] text-primary">payments</span>
            Test API paiement (Stripe)
          </span>
          <button
            onClick={testStripeApi}
            disabled={stripeLoading}
            className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
          >
            {stripeLoading
              ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              : <span className="material-symbols-outlined text-[16px]">send</span>
            }
            {stripeLoading ? 'Test en cours…' : 'Tester Stripe'}
          </button>
        </div>
        <div className="p-5">
          {!stripeResult && !stripeLoading && (
            <p className="text-body-sm text-on-surface-variant">Vérifie la connectivité et la validité de la clé Stripe (lecture seule — aucune session de paiement créée).</p>
          )}
          {stripeLoading && (
            <p className="text-body-sm text-on-surface-variant animate-pulse">Appel en lecture seule à l'API Stripe (balance)…</p>
          )}
          {stripeResult && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-3">
                <div className={`rounded-lg px-4 py-3 border flex items-center gap-2 ${stripeResult.ok ? 'bg-green-900/20 border-green-800/40' : 'bg-red-900/20 border-red-800/40'}`}>
                  <span className={`material-symbols-outlined text-[20px] ${stripeResult.ok ? 'text-green-400' : 'text-red-400'}`}>
                    {stripeResult.ok ? 'check_circle' : 'error'}
                  </span>
                  <div>
                    <p className={`text-label-lg font-bold ${stripeResult.ok ? 'text-green-300' : 'text-red-300'}`}>
                      {stripeResult.ok ? 'Opérationnel' : 'Échec'}
                    </p>
                    <p className="text-[10px] text-on-surface-variant">Statut</p>
                  </div>
                </div>
                <InfoTile icon={stripeResult.enabled ? 'toggle_on' : 'toggle_off'} label="Abonnements activés" value={stripeResult.enabled ? 'Oui' : 'Non (SUBSCRIPTION_ENABLED=false)'} warn={!stripeResult.enabled} />
                <InfoTile icon={stripeResult.mode === 'live' ? 'warning' : 'science'} label="Mode Stripe" value={stripeResult.mode === 'live' ? 'LIVE (réel)' : 'Test'} warn={stripeResult.mode === 'live'} />
                {stripeResult.ms !== null && (
                  <InfoTile icon="speed" label="Latence" value={`${stripeResult.ms}ms`} warn={stripeResult.ms > 3000} />
                )}
              </div>

              {stripeResult.available && (
                <div className="flex flex-wrap gap-3">
                  {stripeResult.available.map(a => (
                    <InfoTile key={a.currency} icon="account_balance_wallet" label={`Solde ${a.currency.toUpperCase()}`} value={(a.amount / 100).toFixed(2)} />
                  ))}
                </div>
              )}

              {stripeResult.error && (
                <div className="rounded-lg px-4 py-3 border bg-red-900/20 border-red-800/40">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant mb-1">Erreur</p>
                  <p className="text-label-md text-red-300 font-mono break-all">{stripeResult.error}</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tests fonctionnels (email + notification) */}
      <div className="bg-surface-container-low border border-[#e8e8f0] rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-[#e8e8f0] flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-primary">science</span>
          <span className="text-label-lg font-semibold">Tests fonctionnels</span>
        </div>
        <div className="p-5 space-y-5">
          {/* Sélecteur utilisateur */}
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[220px] space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Utilisateur cible</label>
              <select
                value={testUserId}
                onChange={e => setTestUserId(e.target.value)}
                className="w-full px-3 py-2 border border-outline-variant rounded-lg text-body-md bg-white focus:outline-none focus:border-primary"
              >
                {diagUsers.length === 0
                  ? <option value="">Chargement…</option>
                  : diagUsers.map(u => (
                      <option key={u.id} value={u.id}>
                        {u.prenom} {u.nom} — {u.email}
                      </option>
                    ))
                }
              </select>
            </div>
          </div>

          {/* Test email */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">mail</span>
                <span className="text-label-lg font-semibold">Test envoi email (SMTP)</span>
              </div>
              <button
                onClick={runTestEmail}
                disabled={emailLoading || !testUserId}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {emailLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">send</span>
                }
                {emailLoading ? 'Envoi…' : 'Envoyer email test'}
              </button>
            </div>
            {emailResult ? (
              <div className={`px-4 py-3 flex flex-wrap gap-3 items-center ${emailResult.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <span className={`material-symbols-outlined text-[20px] ${emailResult.ok ? 'text-green-500' : 'text-red-500'}`}>
                  {emailResult.ok ? 'check_circle' : 'error'}
                </span>
                <span className={`text-label-md font-bold ${emailResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                  {emailResult.ok ? 'Email envoyé' : 'Échec'}
                </span>
                {emailResult.to && <span className="text-body-sm text-on-surface-variant font-mono">→ {emailResult.to}</span>}
                {emailResult.ms !== null && <span className="text-body-sm text-on-surface-variant">{emailResult.ms}ms</span>}
                {emailResult.error && <span className="text-body-sm text-red-600 font-mono">{emailResult.error}</span>}
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-on-surface-variant">Envoie un vrai email de test à l'utilisateur sélectionné via SMTP.</p>
            )}
          </div>

          {/* Test notification in-app */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">notifications</span>
                <span className="text-label-lg font-semibold">Test notification in-app</span>
              </div>
              <button
                onClick={runTestNotification}
                disabled={notifLoading || !testUserId}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {notifLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">send</span>
                }
                {notifLoading ? 'Envoi…' : 'Envoyer notification'}
              </button>
            </div>
            {notifResult ? (
              <div className={`px-4 py-3 flex flex-wrap gap-3 items-center ${notifResult.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <span className={`material-symbols-outlined text-[20px] ${notifResult.ok ? 'text-green-500' : 'text-red-500'}`}>
                  {notifResult.ok ? 'check_circle' : 'error'}
                </span>
                <span className={`text-label-md font-bold ${notifResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                  {notifResult.ok ? 'Notification créée' : 'Échec'}
                </span>
                {notifResult.to && <span className="text-body-sm text-on-surface-variant">→ {notifResult.to}</span>}
                {notifResult.ms !== null && <span className="text-body-sm text-on-surface-variant">{notifResult.ms}ms</span>}
                {notifResult.error && <span className="text-body-sm text-red-600 font-mono">{notifResult.error}</span>}
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-on-surface-variant">Crée une notification in-app visible dans la cloche de l'utilisateur sélectionné.</p>
            )}
          </div>

          {/* ── Convocation email ── */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">mark_email_unread</span>
                <div>
                  <span className="text-label-lg font-semibold">Test convocation par email</span>
                  <span className="ml-2 text-[10px] font-semibold text-white bg-primary px-2 py-0.5 rounded-full">convocations@monclubhouse.fr</span>
                </div>
              </div>
              <button
                onClick={runTestConvocEmail}
                disabled={convocEmailLoading || !testUserId}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {convocEmailLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">send</span>
                }
                {convocEmailLoading ? 'Envoi…' : 'Envoyer convocation'}
              </button>
            </div>
            {convocEmailResult ? (
              <div className={`px-4 py-3 flex flex-wrap gap-3 items-center ${convocEmailResult.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <span className={`material-symbols-outlined text-[20px] ${convocEmailResult.ok ? 'text-green-500' : 'text-red-500'}`}>
                  {convocEmailResult.ok ? 'check_circle' : 'error'}
                </span>
                <span className={`text-label-md font-bold ${convocEmailResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                  {convocEmailResult.ok ? 'Email de convocation envoyé' : 'Échec'}
                </span>
                {convocEmailResult.to && <span className="text-body-sm font-mono text-on-surface-variant">→ {convocEmailResult.to}</span>}
                {convocEmailResult.ms !== null && <span className="text-body-sm text-on-surface-variant">{convocEmailResult.ms}ms</span>}
                {convocEmailResult.error && <span className="text-body-sm text-red-600 font-mono">{convocEmailResult.error}</span>}
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-on-surface-variant">Envoie un email de convocation test (match fictif) à l'utilisateur sélectionné depuis <strong>convocations@monclubhouse.fr</strong>.</p>
            )}
          </div>

          {/* ── CRUD complet (GET + POST + UPDATE + DELETE) par ressource ── */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">sync_alt</span>
                <span className="text-label-lg font-semibold">Tests CRUD (GET / POST / UPDATE / DELETE)</span>
              </div>
              <button
                onClick={runCrudTests}
                disabled={crudRunning}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {crudRunning
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">play_arrow</span>
                }
                {crudRunning ? 'Test en cours…' : 'Lancer les tests'}
              </button>
            </div>
            <div className="divide-y divide-[#e8e8f0]">
              {CRUD_RESOURCES.map(res => {
                const state = crudResults[res.key]
                return (
                  <div key={res.key} className="px-4 py-3">
                    <p className="text-label-md font-semibold mb-2">{res.label}</p>
                    {state ? (
                      <div className="flex flex-wrap gap-3">
                        {(['get', 'post', 'update', 'delete'] as const).map(step => {
                          const s = state[step]
                          const label = step === 'delete' && res.softDelete ? 'DELETE (soft)' : step.toUpperCase()
                          if (!s) return (
                            <div key={step} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low">
                              <span className="inline-block w-3 h-3 rounded-full border-2 border-outline-variant border-t-transparent animate-spin" />
                              <span className="text-label-md font-bold text-on-surface-variant">{label}</span>
                            </div>
                          )
                          return (
                            <div key={step} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${s.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                              <span className={`material-symbols-outlined text-[18px] ${s.ok ? 'text-green-500' : 'text-red-500'}`}>
                                {s.ok ? 'check_circle' : 'error'}
                              </span>
                              <span className={`text-label-md font-bold ${s.ok ? 'text-green-700' : 'text-red-700'}`}>{label}</span>
                              {s.status !== null && <span className="text-body-sm text-on-surface-variant">{s.status}</span>}
                              {s.ms !== null && <span className="text-body-sm text-on-surface-variant">{s.ms}ms</span>}
                              {s.error && <span className="text-body-sm text-red-600 font-mono">{s.error}</span>}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-body-sm text-on-surface-variant">En attente du lancement du test.</p>
                    )}
                  </div>
                )
              })}
            </div>
            <p className="px-4 py-3 text-body-sm text-on-surface-variant border-t border-[#e8e8f0]">Chaque ressource est testée via ses vraies routes API (pas d'accès direct à la base) : création d'un enregistrement jetable (<span className="font-mono">__diag_test_*</span>), lecture de la liste, modification, puis suppression définitive. Aucune donnée réelle n'est affectée.</p>
          </div>

          {/* Test Google Drive */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">cloud_upload</span>
                <span className="text-label-lg font-semibold">Test connexion Google Drive</span>
              </div>
              <button
                onClick={runTestDrive}
                disabled={driveLoading}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {driveLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">cloud_upload</span>
                }
                {driveLoading ? 'Upload…' : 'Tester Drive'}
              </button>
            </div>
            {driveResult ? (
              <div className={`px-4 py-3 space-y-1 ${driveResult.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <div className="flex flex-wrap gap-3 items-center">
                  <span className={`material-symbols-outlined text-[20px] ${driveResult.ok ? 'text-green-500' : 'text-red-500'}`}>
                    {driveResult.ok ? 'check_circle' : 'error'}
                  </span>
                  <span className={`text-label-md font-bold ${driveResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                    {driveResult.ok ? 'Fichier uploadé sur Drive' : 'Échec'}
                  </span>
                  {driveResult.ms !== null && <span className="text-body-sm text-on-surface-variant">{driveResult.ms}ms</span>}
                  {driveResult.name && <span className="text-body-sm font-mono text-on-surface-variant">{driveResult.name}</span>}
                </div>
                {driveResult.url && (
                  <a href={driveResult.url} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary text-body-sm hover:underline">
                    <span className="material-symbols-outlined text-[14px]">open_in_new</span>
                    Voir le fichier sur Drive
                  </a>
                )}
                {driveResult.error && <p className="text-body-sm text-red-600 font-mono">{driveResult.error}</p>}
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-on-surface-variant">Upload un fichier texte de test dans le dossier _diagnostic de Google Drive via le refresh_token.</p>
            )}
          </div>

          {/* Test 2FA email */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">security</span>
                <span className="text-label-lg font-semibold">Test envoi code 2FA</span>
              </div>
              <button
                onClick={runTest2fa}
                disabled={twoFaLoading || !testUserId}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {twoFaLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">send</span>
                }
                {twoFaLoading ? 'Envoi…' : 'Envoyer code 2FA'}
              </button>
            </div>
            {twoFaResult ? (
              <div className={`px-4 py-3 flex flex-wrap gap-3 items-center ${twoFaResult.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <span className={`material-symbols-outlined text-[20px] ${twoFaResult.ok ? 'text-green-500' : 'text-red-500'}`}>
                  {twoFaResult.ok ? 'check_circle' : 'error'}
                </span>
                <span className={`text-label-md font-bold ${twoFaResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                  {twoFaResult.ok ? 'Code 2FA envoyé' : 'Échec'}
                </span>
                {twoFaResult.to && <span className="text-body-sm font-mono text-on-surface-variant">→ {twoFaResult.to}</span>}
                {twoFaResult.ms !== null && <span className="text-body-sm text-on-surface-variant">{twoFaResult.ms}ms</span>}
                {twoFaResult.error && <span className="text-body-sm text-red-600 font-mono">{twoFaResult.error}</span>}
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-on-surface-variant">Envoie un vrai email de code 2FA à 6 chiffres à l'utilisateur sélectionné.</p>
            )}
          </div>

          {/* Test vérification email */}
          <div className="rounded-xl border border-[#e8e8f0] bg-white overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-[18px] text-on-surface-variant">verified</span>
                <span className="text-label-lg font-semibold">Test email de vérification</span>
              </div>
              <button
                onClick={runTestVerifyEmail}
                disabled={verifyLoading || !testUserId}
                className="flex items-center gap-1.5 border border-outline-variant px-3 py-1.5 rounded-lg text-label-md hover:bg-surface-container transition-colors disabled:opacity-40"
              >
                {verifyLoading
                  ? <span className="inline-block w-3 h-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                  : <span className="material-symbols-outlined text-[16px]">send</span>
                }
                {verifyLoading ? 'Envoi…' : 'Envoyer lien vérif'}
              </button>
            </div>
            {verifyResult ? (
              <div className={`px-4 py-3 flex flex-wrap gap-3 items-center ${verifyResult.ok ? 'bg-green-900/10' : 'bg-red-900/10'}`}>
                <span className={`material-symbols-outlined text-[20px] ${verifyResult.ok ? 'text-green-500' : 'text-red-500'}`}>
                  {verifyResult.ok ? 'check_circle' : 'error'}
                </span>
                <span className={`text-label-md font-bold ${verifyResult.ok ? 'text-green-700' : 'text-red-700'}`}>
                  {verifyResult.ok ? 'Email de vérification envoyé' : 'Échec'}
                </span>
                {verifyResult.to && <span className="text-body-sm font-mono text-on-surface-variant">→ {verifyResult.to}</span>}
                {verifyResult.ms !== null && <span className="text-body-sm text-on-surface-variant">{verifyResult.ms}ms</span>}
                {verifyResult.error && <span className="text-body-sm text-red-600 font-mono">{verifyResult.error}</span>}
              </div>
            ) : (
              <p className="px-4 py-3 text-body-sm text-on-surface-variant">Envoie un lien de vérification d'email à l'utilisateur sélectionné (lien valable 24h).</p>
            )}
          </div>
        </div>
      </div>

      {/* Filtre */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-label-md text-on-surface-variant">Filtrer :</span>
        {[
          { key: 'all', label: `Tout (${results.length})` },
          { key: 'ok',  label: `OK (${okCount})` },
          { key: 'warn',label: `Auth (${warnCount})` },
          { key: 'err', label: `Erreurs (${errCount})` },
        ].map(f => (
          <button key={f.key} onClick={() => setFilter(f.key as any)}
            className={`px-3 py-1.5 rounded-full text-label-md transition-all ${filter === f.key ? 'bg-primary text-white' : 'border border-outline-variant text-on-surface-variant hover:bg-surface-container-low'}`}>
            {f.label}
          </button>
        ))}
        {slowest && done.length > 0 && (
          <span className="ml-auto text-body-sm text-on-surface-variant">
            Plus lente : <span className="font-mono text-yellow-400">{slowest.path} ({slowest.ms}ms)</span>
          </span>
        )}
      </div>

      {/* Résultats par section */}
      {sections.map(sec => {
        const rows = filtered(sec)
        if (rows.length === 0) return null
        return (
          <div key={sec} className="space-y-1">
            <p className="text-label-sm font-bold uppercase tracking-widest text-on-surface-variant px-1">{sec}</p>
            <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              {rows.map(r => {
                const cls = classify(r.status)
                const key = r.method + r.path
                const isExpanded = expandedRow === key
                return (
                  <div key={key} className="border-b border-[#e8e8f0] last:border-0">
                    <button onClick={() => setExpandedRow(isExpanded ? null : key)}
                      className="w-full px-5 py-3 flex items-center gap-3 hover:bg-surface-container-low/50 transition-colors text-left">
                      {/* Badge */}
                      {r.status === null
                        ? <span className="w-14 text-center shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border bg-blue-900/40 text-blue-400 border-blue-800">
                            {running ? <span className="inline-block w-3 h-3 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" /> : '—'}
                          </span>
                        : <span className={`w-14 text-center shrink-0 text-[10px] font-bold px-2 py-0.5 rounded border ${BADGE[cls]}`}>
                            {r.status}
                          </span>
                      }
                      <span className="text-[10px] font-bold text-on-surface-variant w-8 shrink-0">{r.method}</span>
                      <span className="font-mono text-[12px] text-primary flex-1 truncate">{r.path}</span>
                      <span className="text-body-sm text-on-surface-variant hidden sm:block shrink-0">{r.label}</span>
                      <span className={`text-[11px] font-medium shrink-0 ${TEXT[cls]}`}>{r.msg}</span>
                      {r.ms !== null && (
                        <span className={`text-[10px] font-mono shrink-0 ${r.ms > 500 ? 'text-yellow-400' : 'text-on-surface-variant'}`}>{r.ms}ms</span>
                      )}
                      <span className={`material-symbols-outlined text-[14px] text-on-surface-variant transition-transform ${isExpanded ? 'rotate-180' : ''}`}>expand_more</span>
                    </button>
                    {isExpanded && r.body !== undefined && (
                      <div className="px-5 pb-4 bg-surface-container-low/50 border-t border-[#e8e8f0]">
                        <pre className="text-[11px] text-on-surface-variant font-mono overflow-auto max-h-48 mt-2">
                          {JSON.stringify(r.body, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function InfoTile({ icon, label, value, sub, warn = false }: { icon: string; label: string; value: string; sub?: string; warn?: boolean }) {
  return (
    <div className={`rounded-lg p-3 border ${warn ? 'bg-red-900/20 border-red-800/40' : 'bg-white border-[#e8e8f0]'}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <span className={`material-symbols-outlined text-[14px] ${warn ? 'text-red-400' : 'text-primary'}`}>{icon}</span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-on-surface-variant">{label}</span>
      </div>
      <p className={`text-label-lg font-bold ${warn ? 'text-red-300' : 'text-on-surface'}`}>{value}</p>
      {sub && <p className="text-[10px] text-on-surface-variant truncate mt-0.5">{sub}</p>}
    </div>
  )
}
