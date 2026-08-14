// Combine une date (YYYY-MM-DD) et une heure (HH:MM) saisies en heure locale du navigateur
// en un instant UTC non-ambigu (ISO avec suffixe Z), pour éviter tout décalage de fuseau
// horaire lors de l'enregistrement côté serveur.
export function localDateTimeToISO(date: string, heure: string): string | null {
  if (!date || !heure) return null
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = heure.split(':').map(Number)
  if (!y || !m || !d || Number.isNaN(hh) || Number.isNaN(mm)) return null
  return new Date(y, m - 1, d, hh, mm, 0).toISOString()
}
