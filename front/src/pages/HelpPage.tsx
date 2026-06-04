import { useState } from 'react'

type Tab = 'documentation' | 'support' | 'tutoriels' | 'raccourcis'

// ── Données ────────────────────────────────────────────────────────────────────

const DOCS = [
  {
    title: 'Premiers pas',
    icon: 'rocket_launch',
    color: 'bg-primary/10 text-primary',
    items: [
      { q: 'Comment rejoindre mon club ?', a: 'Demandez un code d\'accès à votre dirigeant ou administrateur de club. Rendez-vous sur la page /join et saisissez ce code pour être rattaché à votre club et votre équipe.' },
      { q: 'Comment modifier mon profil ?', a: 'Cliquez sur "Paramètres" en bas du menu latéral. Vous pouvez y modifier votre nom, prénom, avatar et mot de passe.' },
      { q: 'Comment me connecter avec Google ?', a: 'Sur la page de connexion, cliquez sur "Continuer avec Google". Si c\'est votre première connexion, vous serez guidé pour rejoindre votre club.' },
    ],
  },
  {
    title: 'Calendrier & Événements',
    icon: 'calendar_today',
    color: 'bg-blue-100 text-blue-700',
    items: [
      { q: 'Comment créer un événement ?', a: 'Cliquez sur "Nouvel événement" dans le menu ou le bouton + du calendrier. Renseignez le type (match, entraînement…), l\'équipe, la date et l\'heure.' },
      { q: 'Comment filtrer le calendrier par équipe ?', a: 'Utilisez le menu déroulant en haut à droite du calendrier pour afficher uniquement les événements d\'une catégorie spécifique.' },
      { q: 'Comment répondre à une convocation ?', a: 'Rendez-vous sur la page "Convocations" et utilisez les boutons Présent / Absent pour chaque événement.' },
    ],
  },
  {
    title: 'Codes d\'accès',
    icon: 'key',
    color: 'bg-yellow-100 text-yellow-700',
    items: [
      { q: 'Comment générer un code d\'accès ?', a: 'Dans Administration > Codes d\'accès, cliquez sur "Générer un code". Choisissez le rôle (joueur, coach, parent, dirigeant) et la catégorie si nécessaire.' },
      { q: 'Un code est-il à usage unique ?', a: 'Non. Vous pouvez définir un nombre maximum d\'utilisations (50 par défaut). Chaque code peut être partagé par email, SMS ou lien.' },
      { q: 'Comment désactiver un code ?', a: 'Dans la liste des codes, cliquez sur l\'icône 🚫 à droite du code concerné. Il sera immédiatement désactivé.' },
    ],
  },
  {
    title: 'Résultats & Stats',
    icon: 'leaderboard',
    color: 'bg-green-100 text-green-700',
    items: [
      { q: 'Comment saisir un score ?', a: 'Sur la page d\'un match (Résultats > cliquer sur le match), utilisez le bouton "Saisir le score". Le match passe au statut "Terminé".' },
      { q: 'Les statistiques sont-elles calculées automatiquement ?', a: 'Oui. Le bilan victoires/nuls/défaites et les statistiques par équipe sont mis à jour dès qu\'un score est saisi.' },
    ],
  },
]

const TUTORIALS = [
  { icon: 'manage_accounts', color: 'bg-purple-100 text-purple-700', role: 'Administrateur / Dirigeant', steps: ['Créer votre club via /setup-club', 'Configurer les informations et terrains dans Mon Club', 'Créer vos équipes (Équipes > Créer)', 'Générer des codes d\'accès pour chaque rôle', 'Partager les codes aux joueurs, coachs et parents'] },
  { icon: 'sports', color: 'bg-blue-100 text-blue-700', role: 'Coach', steps: ['Rejoindre votre équipe avec le code fourni', 'Planifier les entraînements et matchs (Calendrier > +)', 'Envoyer des convocations aux joueurs', 'Saisir les compositions et résultats', 'Consulter les statistiques de votre équipe'] },
  { icon: 'sports_soccer', color: 'bg-green-100 text-green-700', role: 'Joueur', steps: ['Rejoindre votre équipe avec le code fourni par le club', 'Consulter les convocations et y répondre', 'Voir le calendrier de votre équipe', 'Utiliser le chat pour communiquer avec l\'équipe'] },
  { icon: 'family_restroom', color: 'bg-orange-100 text-orange-700', role: 'Parent', steps: ['Rejoindre le club avec votre code parent', 'Vous lier à votre enfant (joueur) lors de l\'inscription', 'Consulter les convocations de votre enfant', 'Accéder aux résultats et au calendrier'] },
]

const SHORTCUTS: { category: string; items: { keys: string[]; action: string }[] }[] = [
  {
    category: 'Navigation',
    items: [
      { keys: ['G', 'D'], action: 'Aller au Tableau de bord' },
      { keys: ['G', 'C'], action: 'Aller au Calendrier' },
      { keys: ['G', 'M'], action: 'Aller aux Messages' },
      { keys: ['G', 'R'], action: 'Aller aux Résultats' },
    ],
  },
  {
    category: 'Actions',
    items: [
      { keys: ['N'], action: 'Nouvel événement' },
      { keys: ['?'], action: 'Ouvrir l\'aide' },
      { keys: ['Échap'], action: 'Fermer la fenêtre / modal' },
    ],
  },
  {
    category: 'Calendrier',
    items: [
      { keys: ['←'], action: 'Mois précédent' },
      { keys: ['→'], action: 'Mois suivant' },
      { keys: ['T'], action: 'Revenir à aujourd\'hui' },
    ],
  },
]

const VERSION = '1.0.0'
const RELEASE_DATE = 'Juin 2025'

// ── Composant ──────────────────────────────────────────────────────────────────

export default function HelpPage() {
  const [tab, setTab]   = useState<Tab>('documentation')
  const [openFaq, setOpenFaq] = useState<string | null>(null)

  const [supportForm, setSupportForm] = useState({ sujet: '', message: '', priorite: 'normal' })
  const [supportSent, setSupportSent] = useState(false)

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'documentation', label: 'Documentation', icon: 'menu_book'    },
    { key: 'support',       label: 'Support',        icon: 'headset_mic' },
    { key: 'tutoriels',     label: 'Tutoriels',      icon: 'school'      },
    { key: 'raccourcis',    label: 'Raccourcis',     icon: 'keyboard'    },
  ]

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface">Aide &amp; Ressources</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Documentation, support et guides d'utilisation de MonClubHouse.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-outline-variant mb-8 gap-1">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-3 text-label-lg transition-all ${
              tab === t.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            <span className="material-symbols-outlined text-[18px]">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Documentation ─────────────────────────────────────────────────────── */}
      {tab === 'documentation' && (
        <div className="space-y-6">
          {DOCS.map(section => (
            <div key={section.title} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${section.color}`}>
                  <span className="material-symbols-outlined text-[20px]">{section.icon}</span>
                </div>
                <h3 className="text-headline-md text-on-surface">{section.title}</h3>
              </div>
              <div className="divide-y divide-[#e8e8f0]">
                {section.items.map(item => (
                  <div key={item.q}>
                    <button
                      onClick={() => setOpenFaq(openFaq === item.q ? null : item.q)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-surface-container-low transition-colors"
                    >
                      <span className="text-body-md font-medium text-on-surface">{item.q}</span>
                      <span className={`material-symbols-outlined text-on-surface-variant text-[20px] transition-transform ${openFaq === item.q ? 'rotate-180' : ''}`}>
                        expand_more
                      </span>
                    </button>
                    {openFaq === item.q && (
                      <div className="px-6 pb-4 text-body-md text-on-surface-variant bg-surface-container-lowest border-t border-[#e8e8f0]">
                        <p className="pt-3">{item.a}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Support ───────────────────────────────────────────────────────────── */}
      {tab === 'support' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Infos contact */}
          <div className="space-y-4">
            {[
              { icon: 'mail',        color: 'bg-primary/10 text-primary',       title: 'Email',        desc: 'support@monclubhouse.fr', sub: 'Réponse sous 24h' },
              { icon: 'schedule',    color: 'bg-blue-100 text-blue-700',         title: 'Disponibilité', desc: 'Lun–Ven 9h–18h',         sub: 'Hors week-end' },
              { icon: 'bug_report',  color: 'bg-red-100 text-red-700',           title: 'Bug critique',  desc: 'Via le formulaire',       sub: 'Priorité élevée' },
            ].map(c => (
              <div key={c.title} className="bg-white border border-[#e8e8f0] rounded-xl p-5 flex items-start gap-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                  <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
                </div>
                <div>
                  <p className="text-label-lg text-on-surface font-semibold">{c.title}</p>
                  <p className="text-body-md text-on-surface">{c.desc}</p>
                  <p className="text-body-sm text-on-surface-variant">{c.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Formulaire */}
          <div className="md:col-span-2 bg-white border border-[#e8e8f0] rounded-xl p-6">
            {supportSent ? (
              <div className="text-center py-10">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="material-symbols-outlined text-green-600 text-[32px]">check_circle</span>
                </div>
                <h3 className="text-headline-md text-on-surface mb-2">Message envoyé !</h3>
                <p className="text-body-md text-on-surface-variant mb-6">Nous vous répondrons dans les 24h.</p>
                <button onClick={() => { setSupportSent(false); setSupportForm({ sujet: '', message: '', priorite: 'normal' }) }}
                  className="px-5 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">
                  Nouveau message
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-headline-md text-on-surface mb-5">Contacter le support</h3>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Sujet *</label>
                    <input
                      value={supportForm.sujet}
                      onChange={e => setSupportForm(f => ({ ...f, sujet: e.target.value }))}
                      placeholder="Ex : Problème de connexion, bug sur le calendrier…"
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Priorité</label>
                    <div className="flex gap-3">
                      {[
                        { v: 'normal', l: 'Normal',    color: 'border-blue-400 bg-blue-50 text-blue-700'   },
                        { v: 'haute',  l: 'Haute',     color: 'border-orange-400 bg-orange-50 text-orange-700' },
                        { v: 'urgent', l: 'Urgent',    color: 'border-red-400 bg-red-50 text-red-700'     },
                      ].map(p => (
                        <button
                          key={p.v}
                          onClick={() => setSupportForm(f => ({ ...f, priorite: p.v }))}
                          className={`flex-1 py-2 rounded-lg border-2 text-label-md font-semibold transition-all ${
                            supportForm.priorite === p.v ? p.color : 'border-outline-variant text-on-surface-variant hover:border-primary/30'
                          }`}
                        >
                          {p.l}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-label-md text-on-surface-variant">Message *</label>
                    <textarea
                      value={supportForm.message}
                      onChange={e => setSupportForm(f => ({ ...f, message: e.target.value }))}
                      rows={5}
                      placeholder="Décrivez votre problème en détail (navigateur, étapes pour reproduire…)"
                      className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all resize-none"
                    />
                  </div>
                  <button
                    onClick={() => supportForm.sujet && supportForm.message && setSupportSent(true)}
                    disabled={!supportForm.sujet || !supportForm.message}
                    className="w-full py-3 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-[20px]">send</span>
                    Envoyer le message
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── Tutoriels ─────────────────────────────────────────────────────────── */}
      {tab === 'tutoriels' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {TUTORIALS.map(tuto => (
            <div key={tuto.role} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${tuto.color}`}>
                  <span className="material-symbols-outlined text-[22px]">{tuto.icon}</span>
                </div>
                <h3 className="text-headline-md text-on-surface">{tuto.role}</h3>
              </div>
              <ol className="px-6 py-4 space-y-3">
                {tuto.steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-body-md text-on-surface-variant">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}

      {/* ── Raccourcis clavier ────────────────────────────────────────────────── */}
      {tab === 'raccourcis' && (
        <div className="space-y-5">
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-primary shrink-0">info</span>
            <p className="text-body-sm text-on-surface-variant">
              Les raccourcis clavier fonctionnent depuis n'importe quelle page de l'application, sauf quand un champ texte est actif.
            </p>
          </div>

          {SHORTCUTS.map(section => (
            <div key={section.category} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
              <div className="px-6 py-3 bg-surface-container-low border-b border-[#e8e8f0]">
                <h3 className="text-label-lg text-on-surface font-semibold">{section.category}</h3>
              </div>
              <div className="divide-y divide-[#e8e8f0]">
                {section.items.map(item => (
                  <div key={item.action} className="flex items-center justify-between px-6 py-3.5">
                    <span className="text-body-md text-on-surface">{item.action}</span>
                    <div className="flex items-center gap-1">
                      {item.keys.map((k, i) => (
                        <span key={k}>
                          <kbd className="inline-flex items-center justify-center min-w-[32px] h-8 px-2 bg-surface-container-low border border-outline-variant rounded-lg text-label-md font-mono text-on-surface shadow-sm">
                            {k}
                          </kbd>
                          {i < item.keys.length - 1 && (
                            <span className="mx-1 text-on-surface-variant text-body-sm">puis</span>
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
      )}

      {/* Footer version */}
      <div className="mt-10 pt-6 border-t border-outline-variant flex items-center justify-between text-body-sm text-on-surface-variant">
        <span>MonClubHouse v{VERSION} — {RELEASE_DATE}</span>
        <a href="mailto:support@monclubhouse.fr" className="hover:text-primary transition-colors flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">mail</span>
          support@monclubhouse.fr
        </a>
      </div>
    </div>
  )
}
