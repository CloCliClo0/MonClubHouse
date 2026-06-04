import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const SECTIONS = [
  {
    title: 'Navigation rapide',
    icon: 'travel_explore',
    shortcuts: [
      { keys: ['G', 'C'], desc: 'Aller au Calendrier' },
      { keys: ['G', 'M'], desc: 'Aller aux Messages' },
      { keys: ['G', 'R'], desc: 'Aller aux Résultats' },
      { keys: ['G', 'P'], desc: 'Aller au Profil / Paramètres' },
      { keys: ['G', 'A'], desc: 'Aller à l\'Administration' },
    ],
  },
  {
    title: 'Actions globales',
    icon: 'bolt',
    shortcuts: [
      { keys: ['N'], desc: 'Créer un nouvel événement' },
      { keys: ['?'], desc: 'Ouvrir l\'aide' },
      { keys: ['Échap'], desc: 'Fermer le modal / annuler' },
      { keys: ['Ctrl', 'K'], desc: 'Recherche rapide (à venir)' },
    ],
  },
  {
    title: 'Calendrier',
    icon: 'calendar_today',
    shortcuts: [
      { keys: ['←'], desc: 'Mois précédent' },
      { keys: ['→'], desc: 'Mois suivant' },
      { keys: ['T'], desc: 'Revenir à aujourd\'hui' },
    ],
  },
  {
    title: 'Formulaires',
    icon: 'edit_note',
    shortcuts: [
      { keys: ['Ctrl', 'Entrée'], desc: 'Valider / Soumettre le formulaire' },
      { keys: ['Tab'], desc: 'Passer au champ suivant' },
      { keys: ['Maj', 'Tab'], desc: 'Revenir au champ précédent' },
    ],
  },
]

function Kbd({ children }: { children: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[36px] h-8 px-2.5 bg-white border border-[#d0d0d8] rounded-lg text-label-md font-mono text-on-surface shadow-[0_2px_0_#c0c0c8] text-[13px]">
      {children}
    </kbd>
  )
}

export default function RaccourcisPage() {
  const navigate = useNavigate()
  const [lastKey, setLastKey] = useState<string | null>(null)

  useEffect(() => {
    let gPressed = false
    let gTimer: ReturnType<typeof setTimeout>

    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return

      if (gPressed) {
        gPressed = false
        clearTimeout(gTimer)
        setLastKey(null)
        if (e.key === 'c') { navigate('/calendrier'); return }
        if (e.key === 'm') { navigate('/messages');   return }
        if (e.key === 'r') { navigate('/resultats');  return }
        if (e.key === 'p') { navigate('/profil');     return }
        if (e.key === 'a') { navigate('/admin');      return }
        return
      }

      if (e.key === 'g') {
        gPressed = true
        setLastKey('G')
        gTimer = setTimeout(() => { gPressed = false; setLastKey(null) }, 1500)
        return
      }
      if (e.key === 'n') { navigate('/evenements/creer');  return }
      if (e.key === '?') { navigate('/aide/raccourcis');   return }
      if (e.key === 'Escape') { window.history.back();     return }
    }

    window.addEventListener('keydown', handler)
    return () => { window.removeEventListener('keydown', handler); clearTimeout(gTimer) }
  }, [navigate])

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface">Raccourcis clavier</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Naviguez plus vite dans MonClubHouse. Les raccourcis sont actifs sur toutes les pages, sauf quand un champ texte est sélectionné.
        </p>
      </div>

      {/* Info */}
      <div className="flex items-start gap-3 bg-primary/5 border border-primary/20 rounded-xl p-4 mb-8">
        <span className="material-symbols-outlined text-primary shrink-0">keyboard</span>
        <div className="text-body-sm text-on-surface-variant">
          <strong className="text-on-surface">Cette page est interactive.</strong> Les raccourcis listés ci-dessous sont déjà actifs — essayez-les maintenant !
          <br />
          <span className="italic">Ex : appuyez sur <Kbd>G</Kbd> puis <Kbd>C</Kbd> pour aller au Calendrier.</span>
          {lastKey && (
            <span className="ml-2 px-2 py-0.5 bg-primary/10 text-primary rounded text-[11px] font-bold">
              En attente de la 2e touche…
            </span>
          )}
        </div>
      </div>

      <div className="space-y-5">
        {SECTIONS.map(section => (
          <div key={section.title} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-3.5 bg-surface-container-low border-b border-[#e8e8f0]">
              <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{section.icon}</span>
              <h3 className="text-label-lg text-on-surface font-semibold">{section.title}</h3>
            </div>

            {/* Lignes */}
            <div className="divide-y divide-[#e8e8f0]">
              {section.shortcuts.map(sc => (
                <div key={sc.desc} className="flex items-center justify-between px-6 py-3.5">
                  <span className="text-body-md text-on-surface">{sc.desc}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {sc.keys.map((k, i) => (
                      <span key={k} className="flex items-center gap-1.5">
                        <Kbd>{k}</Kbd>
                        {i < sc.keys.length - 1 && (
                          <span className="text-[11px] text-on-surface-variant font-medium">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Note séquences */}
      <div className="mt-6 bg-surface-container-low rounded-xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-on-surface-variant text-[18px] shrink-0 mt-0.5">info</span>
        <p className="text-body-sm text-on-surface-variant">
          Les raccourcis de navigation utilisant <Kbd>G</Kbd> sont des <strong>séquences</strong> : appuyez d'abord sur <Kbd>G</Kbd>, relâchez, puis appuyez sur la deuxième touche dans la seconde qui suit.
        </p>
      </div>
    </div>
  )
}
