import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type CalEvent = {
  id: number
  adversaire?: string
  date: string
  type: string
  statut: string
  equipe?: { id: number; nom: string; categorie?: { id: number; nom: string } | null }
  terrain?: { nom: string }
  statut_convoc?: string
}
type Equipe = { id: number; nom: string; categorie?: { id: number; nom: string } | null; coach_id?: number }
type ViewMode = 'mois' | 'semaine' | 'jour'

const DAYS_SHORT = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

function getWeekDays(date: Date): Date[] {
  const d = new Date(date)
  const day = d.getDay() || 7
  d.setDate(d.getDate() - day + 1)
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(d)
    dd.setDate(d.getDate() + i)
    return dd
  })
}

export default function CalendarPage() {
  const navigate = useNavigate()
  const role     = localStorage.getItem('role') || 'joueur'
  const userId   = parseInt(localStorage.getItem('userId') || '0')
  const isPlayer = ['joueur', 'parent'].includes(role)

  const [events, setEvents]               = useState<CalEvent[]>([])
  const [loading, setLoading]             = useState(true)
  const [view, setView]                   = useState<ViewMode>('mois')
  const [current, setCurrent]             = useState(new Date())
  const [equipes, setEquipes]             = useState<Equipe[]>([])
  const [selectedEquipe, setSelectedEquipe] = useState<string>('all')

  useEffect(() => {
    if (isPlayer) return
    api.get('/equipes').then(r => {
      const list: Equipe[] = r.data.data || []
      setEquipes(list)
      if (role === 'coach' && userId) {
        const mine = list.find(e => e.coach_id === userId)
        if (mine) setSelectedEquipe(String(mine.id))
      }
    }).catch(() => {})
  }, [])

  useEffect(() => {
    setLoading(true)
    if (isPlayer) {
      api.get('/licencies/mes-convocations')
        .then(r => {
          const convocs = r.data.data || []
          const mapped: CalEvent[] = convocs
            .filter((c: any) => c.match)
            .map((c: any) => ({
              id: c.match.id,
              date: c.match.date,
              type: c.match.type,
              adversaire: c.match.adversaire,
              statut: c.match.statut,
              statut_convoc: c.statut,
            }))
          setEvents(mapped)
        })
        .catch(() => setEvents([]))
        .finally(() => setLoading(false))
    } else {
      const y = current.getFullYear()
      const m = String(current.getMonth() + 1).padStart(2, '0')
      let url = `/matchs?month=${y}-${m}`
      if (selectedEquipe !== 'all') url += `&equipe_id=${selectedEquipe}`
      api.get(url)
        .then(r => setEvents(r.data.data || []))
        .catch(() => setEvents([]))
        .finally(() => setLoading(false))
    }
  }, [current, selectedEquipe])

  const prev = () => {
    if (view === 'mois')    setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
    if (view === 'semaine') setCurrent(d => { const dd = new Date(d); dd.setDate(d.getDate() - 7); return dd })
    if (view === 'jour')    setCurrent(d => { const dd = new Date(d); dd.setDate(d.getDate() - 1); return dd })
  }
  const next = () => {
    if (view === 'mois')    setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
    if (view === 'semaine') setCurrent(d => { const dd = new Date(d); dd.setDate(d.getDate() + 7); return dd })
    if (view === 'jour')    setCurrent(d => { const dd = new Date(d); dd.setDate(d.getDate() + 1); return dd })
  }
  const goToday = () => setCurrent(new Date())

  const year  = current.getFullYear()
  const month = current.getMonth()

  const periodLabel = useMemo(() => {
    if (view === 'mois') return current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
    if (view === 'jour') return current.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const week = getWeekDays(current)
    const f = week[0].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
    const t = week[6].toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
    return `${f} – ${t}`
  }, [view, current])

  // Month grid
  const firstDay    = new Date(year, month, 1).getDay()
  const offset      = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const today       = new Date()

  const cells: { day: number; current: boolean }[] = []
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - offset + 1, current: false })

  const eventsForDate = (y: number, m: number, d: number) =>
    events.filter(e => {
      const ed = new Date(e.date)
      return ed.getFullYear() === y && ed.getMonth() === m && ed.getDate() === d
    })

  const typeColor = (type: string) =>
    ['match', 'amical', 'coupe', 'tournoi'].includes(type)
      ? 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
      : type === 'entrainement'
        ? 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
        : 'bg-gray-50 border border-gray-200 text-gray-700 hover:bg-gray-100'

  const EventChip = ({ ev }: { ev: CalEvent }) => (
    <div
      onClick={() => navigate(`/evenements/${ev.id}`)}
      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer truncate transition-colors ${typeColor(ev.type)}`}
    >
      {ev.type === 'entrainement' ? '🏃' : '⚽'} {ev.adversaire || ev.equipe?.nom || ev.type}
    </div>
  )

  const weekDays = getWeekDays(current)

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-3">
        <div>
          <h2 className="text-headline-lg text-on-surface">Calendrier</h2>
          <p className="text-body-md text-on-surface-variant">
            {isPlayer ? 'Vos convocations' : ['admin', 'dirigeant'].includes(role) ? 'Tous les événements du club' : 'Vos événements'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {!isPlayer && equipes.length > 0 && (
            <select
              value={selectedEquipe}
              onChange={e => setSelectedEquipe(e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-lg text-body-md bg-white focus:outline-none focus:border-primary flex-1 sm:flex-none"
            >
              {['admin', 'dirigeant', 'superadmin', 'coach'].includes(role) && (
                <option value="all">Tout le club</option>
              )}
              {equipes.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.categorie?.nom ? `${eq.categorie.nom} — ` : ''}{eq.nom}</option>
              ))}
            </select>
          )}
          <div className="bg-white border border-outline-variant rounded-lg p-1 flex">
            {(['mois', 'semaine', 'jour'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1.5 rounded-md text-label-md capitalize transition-all ${
                  view === v ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:bg-surface-container'
                }`}>
                {v === 'mois' ? 'Mois' : v === 'semaine' ? 'Semaine' : 'Jour'}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
        {/* Header navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 sm:px-6 py-4 border-b border-outline-variant gap-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h3 className="text-headline-md font-bold text-on-surface capitalize">{periodLabel}</h3>
            <div className="flex gap-1">
              <button onClick={prev} className="p-1.5 hover:bg-surface-container rounded-md border border-outline-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_left</span>
              </button>
              <button onClick={next} className="p-1.5 hover:bg-surface-container rounded-md border border-outline-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>
            </div>
            <button onClick={goToday} className="px-3 py-1.5 border border-outline-variant rounded-md text-label-md hover:bg-surface-container transition-all">
              Aujourd'hui
            </button>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-primary/20 border border-primary/40" />
              <span className="text-label-md text-on-surface-variant">Matchs</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-100 border border-blue-300" />
              <span className="text-label-md text-on-surface-variant">Entraînements</span>
            </div>
          </div>
        </div>

        {/* Vue Mois */}
        {view === 'mois' && (
          <>
            <div className="calendar-grid bg-surface-container-low border-b border-outline-variant">
              {DAYS_SHORT.map(d => (
                <div key={d} className="py-3 text-center border-r border-outline-variant last:border-r-0">
                  <span className="text-label-md text-on-surface-variant">{d}</span>
                </div>
              ))}
            </div>
            <div className="calendar-grid">
              {cells.map(({ day, current: isCurrent }, i) => {
                const isToday = isCurrent && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
                const dayEvents = isCurrent ? eventsForDate(year, month, day) : []
                const isLast = i >= cells.length - 7
                return (
                  <div key={i}
                    className={`day-cell p-2 border-r border-outline-variant last:border-r-0 ${!isLast ? 'border-b' : ''} ${
                      !isCurrent ? 'bg-surface-container-lowest opacity-40' : ''
                    } ${isToday ? 'bg-primary/5 border-2 border-primary relative' : ''}`}>
                    <span className={`text-label-md ${isToday ? 'text-primary font-bold' : 'text-on-surface-variant'}`}>{day}</span>
                    {isToday && (
                      <span className="absolute top-2 right-2 text-[10px] font-black text-primary bg-primary-fixed px-1 rounded">
                        AUJOURD'HUI
                      </span>
                    )}
                    {loading && isCurrent && i < 7 && (
                      <div className="mt-1 h-5 bg-surface-container-low rounded animate-pulse" />
                    )}
                    <div className="mt-1 space-y-1">
                      {dayEvents.map(ev => <EventChip key={ev.id} ev={ev} />)}
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Vue Semaine */}
        {view === 'semaine' && (
          <>
            <div className="grid grid-cols-7 bg-surface-container-low border-b border-outline-variant">
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString()
                return (
                  <div key={i} className="py-3 text-center border-r border-outline-variant last:border-r-0">
                    <p className="text-label-sm text-on-surface-variant">{DAYS_SHORT[i]}</p>
                    <p className={`text-label-lg font-bold mt-0.5 ${isToday ? 'text-primary' : 'text-on-surface'}`}>
                      {d.getDate()}
                    </p>
                  </div>
                )
              })}
            </div>
            <div className="grid grid-cols-7 min-h-[300px]">
              {weekDays.map((d, i) => {
                const isToday = d.toDateString() === today.toDateString()
                const dayEvents = eventsForDate(d.getFullYear(), d.getMonth(), d.getDate())
                return (
                  <div key={i} className={`p-2 border-r border-outline-variant last:border-r-0 min-h-[120px] ${isToday ? 'bg-primary/5' : ''}`}>
                    {loading && i === 0 && (
                      <div className="h-5 bg-surface-container-low rounded animate-pulse mt-1" />
                    )}
                    <div className="space-y-1">
                      {dayEvents.map(ev => <EventChip key={ev.id} ev={ev} />)}
                    </div>
                    {dayEvents.length === 0 && !loading && (
                      <p className="text-[11px] text-on-surface-variant/30 mt-2 text-center">—</p>
                    )}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Vue Jour */}
        {view === 'jour' && (
          <div className="p-6">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}
              </div>
            ) : (() => {
              const dayEvents = eventsForDate(current.getFullYear(), current.getMonth(), current.getDate())
              return dayEvents.length === 0 ? (
                <div className="py-12 text-center text-on-surface-variant">
                  <span className="material-symbols-outlined text-[48px] block mb-3 opacity-30">event_busy</span>
                  <p>Aucun événement ce jour</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {dayEvents.map(ev => (
                    <div key={ev.id}
                      onClick={() => navigate(`/evenements/${ev.id}`)}
                      className="flex items-start gap-4 p-4 border border-outline-variant rounded-xl hover:bg-surface-container-low cursor-pointer transition-colors">
                      <div className={`p-3 rounded-xl ${ev.type === 'entrainement' ? 'bg-blue-50' : 'bg-primary/10'}`}>
                        <span className="material-symbols-outlined text-[24px]">
                          {ev.type === 'entrainement' ? 'fitness_center' : 'sports_soccer'}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-label-lg font-semibold text-on-surface">
                          {ev.type === 'entrainement' ? 'Entraînement' : `vs ${ev.adversaire || '?'}`}
                        </p>
                        <p className="text-body-sm text-on-surface-variant">
                          {new Date(ev.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          {ev.terrain && ` · ${ev.terrain.nom}`}
                        </p>
                        {ev.equipe && <p className="text-body-sm text-on-surface-variant">{ev.equipe.nom}</p>}
                      </div>
                      <span className={`px-2 py-1 rounded text-label-sm font-medium ${
                        ev.statut === 'programme' ? 'bg-blue-50 text-blue-700' :
                        ev.statut === 'termine'   ? 'bg-green-50 text-green-700' :
                        'bg-gray-50 text-gray-700'
                      }`}>
                        {ev.statut}
                      </span>
                    </div>
                  ))}
                </div>
              )
            })()}
          </div>
        )}
      </div>

      {/* Stats (vue mois uniquement) */}
      {view === 'mois' && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">event_available</span>
              </div>
              <h4 className="text-headline-md text-on-surface">
                {isPlayer ? 'Mes convocations' : 'Événements ce mois'}
              </h4>
            </div>
            <p className="text-display-lg text-primary font-black">
              {isPlayer
                ? events.filter(e => {
                    const d = new Date(e.date)
                    return d.getFullYear() === year && d.getMonth() === month
                  }).length
                : events.length
              }
            </p>
            <p className="text-body-sm text-on-surface-variant mt-2">
              {events.filter(e => e.type === 'entrainement').length} entraînement(s),{' '}
              {events.filter(e => e.type !== 'entrainement').length} match(s)
            </p>
          </div>
          <div className="bg-white p-6 rounded-xl border border-outline-variant">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <span className="material-symbols-outlined text-secondary">notifications_active</span>
              </div>
              <h4 className="text-headline-md text-on-surface">Prochain match</h4>
            </div>
            {(() => {
              const next = events
                .filter(e => e.type !== 'entrainement' && new Date(e.date) >= new Date())
                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
              return next ? (
                <>
                  <p className="text-body-lg font-semibold text-on-surface mt-2">
                    {new Date(next.date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </p>
                  <p className="text-body-md text-on-surface-variant">vs {next.adversaire}</p>
                </>
              ) : <p className="text-body-md text-on-surface-variant mt-2">Aucun match programmé</p>
            })()}
          </div>
          {!isPlayer && (
            <div className="bg-white p-6 rounded-xl border border-outline-variant">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-tertiary-container/10 rounded-lg">
                  <span className="material-symbols-outlined text-tertiary-container">groups</span>
                </div>
                <h4 className="text-headline-md text-on-surface">Équipes actives</h4>
              </div>
              <p className="text-display-lg text-primary font-black">
                {Array.from(new Set(events.map(e => e.equipe?.nom))).filter(Boolean).length}
              </p>
              <p className="text-body-sm text-on-surface-variant mt-2">avec des événements ce mois</p>
            </div>
          )}
        </div>
      )}

      {['coach', 'dirigeant', 'admin'].includes(role) && (
        <button onClick={() => navigate('/evenements/creer')}
          className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
          <span className="material-symbols-outlined">calendar_add_on</span>
          <span className="absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded text-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
            Nouvel événement
          </span>
        </button>
      )}
    </div>
  )
}
