import { useState } from 'react'

type ViewMode = 'mois' | 'semaine' | 'jour'

const DAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']

const events: Record<number, { text: string; type: 'match' | 'training' }[]> = {
  2: [{ text: '🏃 Entraîn. U15', type: 'training' }],
  4: [{ text: '🏃 Entraîn. Séniors', type: 'training' }],
  7: [{ text: '⚽ vs Rival', type: 'match' }],
  9: [{ text: '🏃 Entraîn. U15', type: 'training' }],
  11: [{ text: '🏃 Entraîn. Séniors', type: 'training' }],
  14: [{ text: '⚽ Derby Local', type: 'match' }],
  17: [{ text: '🏃 Entraîn. Spécifique', type: 'training' }],
  21: [{ text: '⚽ vs Paris FC', type: 'match' }],
  28: [{ text: '⚽ Tournoi Été', type: 'match' }],
}

const prevDays = [26, 27, 28, 29, 30, 31]
const today = 7

export default function CalendarPage() {
  const [view, setView] = useState<ViewMode>('mois')

  const allDays = [
    ...prevDays.map((d) => ({ day: d, current: false })),
    ...Array.from({ length: 29 }, (_, i) => ({ day: i + 1, current: true })),
  ]

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Calendrier</h2>
          <p className="text-body-md text-on-surface-variant">
            Gérez les matchs et les entraînements du mois
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="bg-white border border-outline-variant rounded-lg p-1 flex">
            {(['mois', 'semaine', 'jour'] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-4 py-1.5 rounded-md text-label-md font-semibold capitalize transition-all ${
                  view === v
                    ? 'bg-primary-container text-white'
                    : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {v.charAt(0).toUpperCase() + v.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Card */}
      <div className="bg-white border border-outline-variant rounded-xl overflow-hidden">
        {/* Calendar Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-outline-variant bg-white">
          <div className="flex items-center gap-4">
            <h3 className="text-headline-md font-bold text-on-surface">Juin 2025</h3>
            <div className="flex gap-1">
              <button className="p-1.5 hover:bg-surface-container rounded-md border border-outline-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_left</span>
              </button>
              <button className="p-1.5 hover:bg-surface-container rounded-md border border-outline-variant transition-colors">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">chevron_right</span>
              </button>
            </div>
            <button className="px-3 py-1.5 border border-outline-variant rounded-md text-label-md hover:bg-surface-container transition-all">
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

        {/* Days header */}
        <div className="calendar-grid bg-surface-container-low border-b border-outline-variant">
          {DAYS.map((d) => (
            <div key={d} className="py-3 text-center border-r border-outline-variant last:border-r-0">
              <span className="text-label-md text-on-surface-variant">{d}</span>
            </div>
          ))}
        </div>

        {/* Grid body */}
        <div className="calendar-grid bg-white">
          {allDays.map(({ day, current }, i) => {
            const isToday = current && day === today
            const dayEvents = current ? events[day] : []
            const isLast = i >= allDays.length - 7

            return (
              <div
                key={i}
                className={`day-cell p-2 border-r border-outline-variant last:border-r-0 ${!isLast ? 'border-b' : ''} ${
                  !current ? 'bg-surface-container-lowest opacity-40' : ''
                } ${isToday ? 'bg-primary/5 border-2 border-primary relative' : ''}`}
              >
                <span
                  className={`text-label-md ${
                    isToday ? 'text-primary font-bold' : 'text-on-surface-variant'
                  }`}
                >
                  {day}
                </span>
                {isToday && (
                  <span className="absolute top-2 right-2 text-[10px] font-black text-primary bg-primary-fixed px-1 rounded">
                    AUJOURD'HUI
                  </span>
                )}
                {dayEvents && (
                  <div className="mt-2 space-y-1">
                    {dayEvents.map((ev, j) => (
                      <div
                        key={j}
                        className={`px-2 py-1 rounded text-body-sm font-semibold cursor-pointer transition-colors ${
                          ev.type === 'match'
                            ? 'bg-primary/10 border border-primary/30 text-primary hover:bg-primary/20'
                            : 'bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        {ev.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <span className="material-symbols-outlined text-primary">event_available</span>
              </div>
              <h4 className="text-headline-md text-on-surface">Événements ce mois</h4>
            </div>
            <p className="text-display-lg text-primary">12</p>
          </div>
          <p className="text-body-sm text-on-surface-variant mt-4">8 entraînements, 4 matchs officiels prévus.</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-secondary/10 rounded-lg">
                <span className="material-symbols-outlined text-secondary">notifications_active</span>
              </div>
              <h4 className="text-headline-md text-on-surface">Prochain match</h4>
            </div>
            <p className="text-body-lg font-semibold text-on-surface mt-2">Aujourd'hui, 15:30</p>
            <p className="text-body-md text-on-surface-variant">Stade Municipal vs Rival Club</p>
          </div>
          <button className="text-primary text-label-md hover:underline flex items-center gap-1 mt-4">
            Détails du match
            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl border border-outline-variant flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-tertiary-container/10 rounded-lg">
                <span className="material-symbols-outlined text-tertiary-container">groups</span>
              </div>
              <h4 className="text-headline-md text-on-surface">Disponibilités</h4>
            </div>
            <p className="text-body-lg font-semibold text-on-surface">88% validés</p>
            <p className="text-body-sm text-on-surface-variant">Moyenne de présence aux entraînements.</p>
          </div>
        </div>
      </div>

      {/* FAB */}
      <button className="fixed bottom-8 right-8 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 group">
        <span className="material-symbols-outlined">calendar_add_on</span>
        <span className="absolute right-full mr-4 bg-inverse-surface text-inverse-on-surface px-3 py-1 rounded text-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity">
          Nouvel événement
        </span>
      </button>
    </div>
  )
}
