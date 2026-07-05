import { useEffect, useState } from 'react'

const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
]

type Props = {
  value: string
  onChange: (value: string) => void
  className?: string
}

const parseValue = (v: string) => {
  const [yy, mm, dd] = v ? v.split('-') : ['', '', '']
  return { y: yy || '', m: mm ? String(parseInt(mm, 10)) : '', d: dd ? String(parseInt(dd, 10)) : '' }
}

// Remplace <input type="date"> : certains navigateurs/OS n'acceptent la saisie
// clavier que via les flèches de défilement (lent, frustrant). Trois <select>
// sont saisissables au clavier de façon fiable sur toutes les plateformes.
//
// État local nécessaire : tant que les 3 champs ne sont pas tous remplis, `value`
// (contrôlé par le parent) reste une chaîne vide — si jour/mois/année étaient
// dérivés directement de `value` à chaque rendu, choisir un seul champ (ex: le
// jour) appelait onChange('') (date incomplète), ce qui remettait `value` à ''
// et effaçait aussitôt la sélection au rendu suivant : impossible de renseigner
// les 3 champs un par un.
export default function BirthdateSelect({ value, onChange, className }: Props) {
  const [parts, setParts] = useState(() => parseValue(value))

  useEffect(() => {
    if (value) setParts(parseValue(value))
  }, [value])

  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 100 }, (_, i) => currentYear - i)
  const days = Array.from({ length: 31 }, (_, i) => i + 1)

  const emit = (part: 'y' | 'm' | 'd', val: string) => {
    const next = { ...parts, [part]: val }
    setParts(next)
    onChange(next.y && next.m && next.d ? `${next.y}-${next.m.padStart(2, '0')}-${next.d.padStart(2, '0')}` : '')
  }

  const selectClass = className || 'w-full px-3 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all bg-white'

  return (
    <div className="grid grid-cols-3 gap-2">
      <select value={parts.d} onChange={e => emit('d', e.target.value)} className={selectClass}>
        <option value="">Jour</option>
        {days.map(day => <option key={day} value={day}>{day}</option>)}
      </select>
      <select value={parts.m} onChange={e => emit('m', e.target.value)} className={selectClass}>
        <option value="">Mois</option>
        {MOIS.map((mois, i) => <option key={mois} value={i + 1}>{mois}</option>)}
      </select>
      <select value={parts.y} onChange={e => emit('y', e.target.value)} className={selectClass}>
        <option value="">Année</option>
        {years.map(year => <option key={year} value={year}>{year}</option>)}
      </select>
    </div>
  )
}
