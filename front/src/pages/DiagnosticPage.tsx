import { useEffect, useRef, useState } from 'react'
import api from '../services/api'

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
  // Championnat
  { section: 'Championnat',    method: 'GET', path: '/api/championnat/equipes',    label: 'Équipes champ.' },
  // Votes & Arbitrage
  { section: 'Arbitrage',      method: 'GET', path: '/api/arbitrage/presences',    label: 'Présences arbitrage' },
  { section: 'Arbitrage',      method: 'GET', path: '/api/arbitrage/stats',        label: 'Stats arbitrage' },
]

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
      const t0 = performance.now()
      let status = 0, msg = '', body: any = null, ok = false
      try {
        const res = await fetch(window.location.origin + ep.path, {
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
