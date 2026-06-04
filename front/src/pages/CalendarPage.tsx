import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

type CalEvent = {
  id: number
  adversaire?: string
  date: string
  type: string
  statut: string
  equipe: { id: number; nom: string; categorie: string }
  terrain?: { nom: string }
}
type Equipe = { id: number; nom: string; categorie: string; coach_id?: number }

type ViewMode = 'mois' | 'semaine' | 'jour'
const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

export default function CalendarPage() {
  const navigate  = useNavigate()
  const role      = localStorage.getItem('role') || 'joueur'
  const userId    = parseInt(localStorage.getItem('userId') || '0')

  const [events, setEvents]   = useState<CalEvent[]>([])
  const [loading, setLoading] = useState(true)
  const [view, setView]       = useState<ViewMode>('mois')
  const [current, setCurrent] = useState(new Date())

  const [equipes, setEquipes]         = useState<Equipe[]>([])
  const [selectedEquipe, setSelectedEquipe] = useState<string>('all')

  // Chargement des équipes + détermination du filtre par défaut
  useEffect(() => {
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
    const y = current.getFullYear()
    const m = String(current.getMonth() + 1).padStart(2, '0')
    let url = `/matchs?month=${y}-${m}`
    if (selectedEquipe !== 'all') url += `&equipe_id=${selectedEquipe}`
    api.get(url)
      .then(r => setEvents(r.data.data || []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false))
  }, [current, selectedEquipe])

  const prevMonth = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() - 1, 1))
  const nextMonth = () => setCurrent(d => new Date(d.getFullYear(), d.getMonth() + 1, 1))
  const goToday   = () => setCurrent(new Date())

  const year  = current.getFullYear()
  const month = current.getMonth()
  const monthLabel = current.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

  const firstDay = new Date(year, month, 1).getDay()
  const offset   = firstDay === 0 ? 6 : firstDay - 1
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const daysInPrev  = new Date(year, month, 0).getDate()
  const today = new Date()

  const cells: { day: number; current: boolean }[] = []
  for (let i = offset - 1; i >= 0; i--) cells.push({ day: daysInPrev - i, current: false })
  for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, current: true })
  while (cells.length % 7 !== 0) cells.push({ day: cells.length - daysInMonth - offset + 1, current: false })

  const eventsForDay = (day: number) =>
    events.filter(e => new Date(e.date).getDate() === day && new Date(e.date).getMonth() === month)

  // Coach peut voir "tout le club" (pour org. terrains) + sa catégorie
  const showGlobalToggle = role === 'coach'

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Calendrier</h2>
          <p className="text-body-md text-on-surface-variant">
            {['admin', 'dirigeant'].includes(role) ? 'Tous les événements du club' : 'Vos événements'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Filtre équipe */}
          {equipes.length > 0 && (
            <select
              value={selectedEquipe}
              onChange={e => setSelectedEquipe(e.target.value)}
              className="px-3 py-2 border border-outline-variant rounded-lg text-body-md bg-white focus:outline-none focus:border-primary"
            >
              {(role === 'coach' || ['admin', 'dirigeant', 'superadmin'].includes(role)) && (
                <option value="all">Tout le club</option>
              )}
              {equipes.map(eq => (
                <option key={eq.id} value={eq.id}>{eq.categorie} — {eq.nom}</option>
              ))}
            </select>
          )}
          {/* Vues */}
          <div className="bg-white border border-outline-variant rounded-lg p-1 flex">
            {(['mois', 'semaine', 'jour'] as ViewMode[]).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-label-md capitalize transition-all ${
                  view === v ? 'bg-primary-container text-white' : 'text-on-surface-variant hover:bg-surface-container'
                }`}>
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
        {/* Header calendrier */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant">
          <div className="flex items-center gap-4">
            <h3 className="text-headline-md font-bold text-on-surface capitalize">{monthLabel}</h3>
            <div className="flex gap-1">
              <button onClick={prevMonth} className="p-1.5 hover:bg-surface-container rounded-md border border-outline-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_left</span>
              </button>
              <button onClick={nextMonth} className="p-1.5 hover:bg-surface-container rounded-md border border-outline-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>
            </div>
            <button onClick={goToday} className="px-3 py-1.5 border border-outline-variant rounded-md text-label-md hover:bg-surface-container transition-all">
              Aujourd'hui
            </button>
          </div>
          <div className="flex items-center gap-4">
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

        {/* Jours */}
        <div className="calendar-grid bg-surface-container-low border-b border-outline-variant">
          {DAYS.map(d => (
            <div key={d} className="py-3 text-center border-r border-outline-variant last:border-r-0">
              <span className="text-label-md text-on-surface-variant">{d}</span>
            </div>
          ))}
        </div>

        {/* Grille */}
        <div className="calendar-grid">
          {cells.map(({ day, current: isCurrent }, i) => {
            const isToday = isCurrent && day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
            const dayEvents = isCurrent ? eventsForDay(day) : []
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
                  {dayEvents.map(ev => (
                    <div key={ev.id}
                      onClick={() => navigate(`/resultats/${ev.id}`)}
                      className={`px-1.5 py-0.5 rounded text-[11px] font-semibold cursor-pointer truncate transition-colors ${
                        ev.type === 'match' || ev.type === 'amical' || ev.type === 'coupe'
                          ? 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
                          : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
                      }`}>
                      {ev.type === 'entrainement' ? '🏃' : '⚽'} {ev.adversaire || ev.equipe?.nom}
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats mois */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <span className="material-symbols-outlined text-primary">event_available</span>
            </div>
            <h4 className="text-headline-md text-on-surface">Événements ce mois</h4>
          </div>
          <p className="text-display-lg text-primary font-black">{events.length}</p>
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
            const next = events.filter(e => e.type !== 'entrainement' && new Date(e.date) >= new Date()).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())[0]
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
      </div>

      {/* FAB (coach et dirigeant uniquement) */}
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
