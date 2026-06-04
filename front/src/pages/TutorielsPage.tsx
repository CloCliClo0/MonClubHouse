import { useState } from 'react'

type Question = {
  id: string
  question: string
  icon: string
  steps: string[]
  tip?: string
}

type Category = {
  label: string
  icon: string
  color: string
  questions: Question[]
}

const CATEGORIES: Category[] = [
  {
    label: 'Mon compte',
    icon: 'account_circle',
    color: 'bg-purple-100 text-purple-700',
    questions: [
      {
        id: 'rejoindre',
        question: 'Comment rejoindre mon club ?',
        icon: 'key',
        steps: [
          'Demandez votre code d\'accès à votre dirigeant ou administrateur de club.',
          'Connectez-vous à MonClubHouse (ou créez un compte si ce n\'est pas encore fait).',
          'Allez sur la page /join ou cliquez sur "Rejoindre une équipe".',
          'Saisissez votre code et confirmez — vous êtes automatiquement rattaché à votre équipe.',
        ],
        tip: 'Le code ressemble à "U15-A3F2B1". Il vous est fourni par email ou SMS par votre club.',
      },
      {
        id: 'profil',
        question: 'Comment modifier mon profil ?',
        icon: 'edit',
        steps: [
          'Cliquez sur "Paramètres" en bas du menu latéral.',
          'Modifiez votre prénom, nom ou téléphone dans le formulaire.',
          'Cliquez sur "Enregistrer" pour sauvegarder les modifications.',
          'Pour changer votre photo, cliquez sur votre avatar puis "Modifier la photo".',
        ],
      },
      {
        id: 'mdp',
        question: 'Comment changer mon mot de passe ?',
        icon: 'lock',
        steps: [
          'Allez dans "Paramètres" (bas du menu).',
          'Faites défiler jusqu\'à la section "Sécurité".',
          'Saisissez votre mot de passe actuel, puis le nouveau (2 fois).',
          'Cliquez sur "Mettre à jour le mot de passe".',
        ],
        tip: 'Si vous vous êtes inscrit via Google, vous n\'avez pas de mot de passe — connectez-vous toujours via Google.',
      },
    ],
  },
  {
    label: 'Calendrier',
    icon: 'calendar_today',
    color: 'bg-blue-100 text-blue-700',
    questions: [
      {
        id: 'voir-calendrier',
        question: 'Comment voir le calendrier de mon équipe ?',
        icon: 'calendar_today',
        steps: [
          'Cliquez sur "Calendrier" dans le menu latéral.',
          'Le calendrier s\'affiche avec les matchs (vert) et entraînements (bleu).',
          'Utilisez le menu déroulant en haut pour filtrer par équipe/catégorie.',
          'Naviguez d\'un mois à l\'autre avec les flèches.',
        ],
        tip: 'Cliquez sur un événement pour accéder à son détail.',
      },
      {
        id: 'ajouter-evenement',
        question: 'Comment créer un événement ? (Coach / Dirigeant)',
        icon: 'add_circle',
        steps: [
          'Cliquez sur le bouton "+ Nouvel événement" dans le menu ou le "+" flottant du calendrier.',
          'Choisissez le type : Match, Entraînement, Tournoi, Plateau…',
          'Sélectionnez l\'équipe, la date, l\'heure et le terrain.',
          'Pour un match, renseignez l\'adversaire et la compétition.',
          'Confirmez — les convocations sont envoyées automatiquement.',
        ],
      },
    ],
  },
  {
    label: 'Convocations',
    icon: 'assignment_turned_in',
    color: 'bg-green-100 text-green-700',
    questions: [
      {
        id: 'voir-convocations',
        question: 'Comment voir mes convocations ?',
        icon: 'assignment_turned_in',
        steps: [
          'Cliquez sur "Convocations" dans le menu latéral.',
          'La liste de vos prochaines convocations s\'affiche avec la date, l\'équipe et l\'événement.',
          'Les convocations passées apparaissent en bas de la liste.',
        ],
      },
      {
        id: 'repondre-convocation',
        question: 'Comment répondre à une convocation ?',
        icon: 'how_to_reg',
        steps: [
          'Allez sur la page "Convocations".',
          'Trouvez la convocation concernée.',
          'Cliquez sur ✅ "Présent" ou ❌ "Absent".',
          'Vous pouvez ajouter un commentaire (ex : "Blessé", "En retard de 10 min").',
        ],
        tip: 'Répondez le plus tôt possible pour aider votre coach à préparer son effectif.',
      },
      {
        id: 'convocation-parent',
        question: 'Comment voir les convocations de mon enfant ? (Parent)',
        icon: 'family_restroom',
        steps: [
          'Connectez-vous avec votre compte parent.',
          'Allez sur "Convocations" — les convocations de votre enfant y sont listées.',
          'Vous pouvez répondre à sa place si votre enfant ne peut pas le faire.',
        ],
        tip: 'Si vous ne voyez pas les convocations, vérifiez que vous êtes bien lié à votre enfant (via le code parent).',
      },
    ],
  },
  {
    label: 'Messages',
    icon: 'chat',
    color: 'bg-indigo-100 text-indigo-700',
    questions: [
      {
        id: 'envoyer-message',
        question: 'Comment envoyer un message à mon équipe ?',
        icon: 'send',
        steps: [
          'Cliquez sur "Messages" dans le menu latéral.',
          'Sélectionnez le canal de votre équipe dans la liste de gauche.',
          'Tapez votre message dans le champ en bas et appuyez sur Entrée (ou cliquez sur Envoyer).',
        ],
      },
    ],
  },
  {
    label: 'Résultats',
    icon: 'leaderboard',
    color: 'bg-orange-100 text-orange-700',
    questions: [
      {
        id: 'voir-resultats',
        question: 'Comment voir les résultats de mon équipe ?',
        icon: 'leaderboard',
        steps: [
          'Cliquez sur "Résultats" dans le menu latéral.',
          'La liste des matchs passés s\'affiche avec les scores.',
          'Cliquez sur un match pour voir le détail (composition, buteurs…).',
        ],
      },
      {
        id: 'saisir-score',
        question: 'Comment saisir un score ? (Coach / Dirigeant)',
        icon: 'edit_note',
        steps: [
          'Allez sur "Résultats" et cliquez sur le match concerné.',
          'Cliquez sur "Saisir le score".',
          'Entrez le score de votre équipe et celui de l\'adversaire.',
          'Confirmez — le match passe au statut "Terminé" et les statistiques se mettent à jour.',
        ],
      },
    ],
  },
]

export default function TutorielsPage() {
  const [selectedCat, setSelectedCat] = useState<string>(CATEGORIES[0].label)
  const [openQ, setOpenQ]             = useState<string | null>(null)

  const cat = CATEGORIES.find(c => c.label === selectedCat)!

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface">Tutoriels</h2>
        <p className="text-body-md text-on-surface-variant mt-1">
          Trouvez rapidement la réponse à votre question. Choisissez une catégorie ci-dessous.
        </p>
      </div>

      {/* Catégories */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {CATEGORIES.map(c => (
          <button
            key={c.label}
            onClick={() => { setSelectedCat(c.label); setOpenQ(null) }}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center ${
              selectedCat === c.label
                ? 'border-primary bg-primary/5'
                : 'border-[#e8e8f0] bg-white hover:border-primary/40'
            }`}
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedCat === c.label ? 'bg-primary/10 text-primary' : c.color}`}>
              <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
            </div>
            <span className={`text-label-md font-semibold ${selectedCat === c.label ? 'text-primary' : 'text-on-surface'}`}>
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Questions */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        <div className={`px-6 py-4 border-b border-[#e8e8f0] flex items-center gap-3`}>
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cat.color}`}>
            <span className="material-symbols-outlined text-[20px]">{cat.icon}</span>
          </div>
          <h3 className="text-headline-md text-on-surface">{cat.label}</h3>
          <span className="ml-auto text-label-md text-on-surface-variant">{cat.questions.length} question{cat.questions.length > 1 ? 's' : ''}</span>
        </div>

        <div className="divide-y divide-[#e8e8f0]">
          {cat.questions.map(q => (
            <div key={q.id}>
              <button
                onClick={() => setOpenQ(openQ === q.id ? null : q.id)}
                className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-surface-container-low transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-surface-container-low flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-on-surface-variant text-[18px]">{q.icon}</span>
                </div>
                <span className="flex-1 text-body-md font-medium text-on-surface">{q.question}</span>
                <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform shrink-0 ${openQ === q.id ? 'rotate-180' : ''}`}>
                  expand_more
                </span>
              </button>

              {openQ === q.id && (
                <div className="px-6 pb-6 bg-surface-container-lowest border-t border-[#e8e8f0]">
                  <ol className="mt-4 space-y-3">
                    {q.steps.map((step, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <span className="w-6 h-6 rounded-full bg-primary text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <span className="text-body-md text-on-surface-variant">{step}</span>
                      </li>
                    ))}
                  </ol>
                  {q.tip && (
                    <div className="mt-4 flex items-start gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                      <span className="material-symbols-outlined text-primary text-[16px] shrink-0 mt-0.5">lightbulb</span>
                      <p className="text-body-sm text-on-surface-variant">{q.tip}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA support */}
      <div className="mt-6 bg-white border border-[#e8e8f0] rounded-xl p-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-on-surface-variant text-[24px]">help_outline</span>
          <div>
            <p className="text-label-lg text-on-surface">Vous n'avez pas trouvé la réponse ?</p>
            <p className="text-body-sm text-on-surface-variant">Notre équipe support est disponible pour vous aider.</p>
          </div>
        </div>
        <a href="/aide/support"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg text-label-md hover:bg-primary-container transition-colors shrink-0">
          <span className="material-symbols-outlined text-[18px]">headset_mic</span>
          Contacter le support
        </a>
      </div>
    </div>
  )
}
