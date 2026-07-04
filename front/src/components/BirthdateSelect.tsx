const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
}

// Remplace <input type="date"> : certains navigateurs/OS n'acceptent la saisie
// clavier que via les flèches de défilement (lent, frustrant). Trois <select>
// sont saisissables au clavier de façon fiable sur toutes les plateformes.
export default function BirthdateSelect({ value, onChange, className }: Props) {
  const [y, m, d] = value ? value.split('-') : ['', '', '']
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const emit = (part: 'y' | 'm' | 'd', val: string) => {
    const ny = part === 'y' ? val : y
    const nm = part === 'm' ? val : m
    const nd = part === 'd' ? val : d
    onChange(ny && nm && nd ? `${ny}-${nm.padStart(2, '0')}-${nd.padStart(2, '0')}` : '')
  }

  const selectClass = className || 'w-full px-3 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white'

  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={d ? String(parseInt(d, 10)) : ''} onChange={e => emit('d', e.target.value)} className={selectClass}>
        <option value="">Jour</option>
        {days.map(day => <option key={day} value={day}>{day}</option>)}
      </select>
      <select value={m ? String(parseInt(m, 10)) : ''} onChange={e => emit('m', e.target.value)} className={selectClass}>
        <option value="">Mois</option>
        {MOIS.map((mois, i) => <option key={mois} value={i + 1}>{mois}</option>)}
      </select>
      <select value={y} onChange={e => emit('y', e.target.value)} className={selectClass}>
        <option value="">Année</option>
        {years.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
    </div>
  )
}
