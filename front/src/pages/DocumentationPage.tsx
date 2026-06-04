export default function DocumentationPage() {
  const FEATURES = [
    {
      icon: 'calendar_today', color: 'bg-blue-50 text-blue-600', title: 'Calendrier',
      desc: 'Consultez tous les matchs et entraînements de votre équipe. Filtrez par catégorie et naviguez de mois en mois.',
      details: ['Vue mensuelle claire avec codes couleur (matchs en vert, entraînements en bleu)', 'Filtre par équipe/catégorie', 'Accès rapide au détail de chaque événement'],
    },
    {
      icon: 'assignment_turned_in', color: 'bg-green-50 text-green-600', title: 'Convocations',
      desc: 'Répondez aux convocations de votre coach pour indiquer votre disponibilité.',
      details: ['Répondre Présent / Absent en un clic', 'Ajoutez un commentaire (blessure, retard…)', 'Notifications email automatiques'],
    },
    {
      icon: 'chat', color: 'bg-purple-50 text-purple-600', title: 'Messages',
      desc: 'Communiquez en temps réel avec votre équipe via le chat intégré.',
      details: ['Chat en temps réel par équipe', 'Envoi de messages texte', 'Historique complet des conversations'],
    },
    {
      icon: 'leaderboard', color: 'bg-orange-50 text-orange-600', title: 'Résultats',
      desc: 'Suivez les scores et bilans de votre équipe au fil de la saison.',
      details: ['Résultats de tous les matchs', 'Bilan victoires / nuls / défaites', 'Statistiques de buts par équipe'],
    },
    {
      icon: 'bar_chart', color: 'bg-red-50 text-red-600', title: 'Statistiques',
      desc: 'Visualisez les performances de l\'équipe et des joueurs sur la saison.',
      details: ['Stats globales de l\'équipe', 'Top buteurs', 'Évolution des performances'],
    },
    {
      icon: 'format_list_numbered', color: 'bg-indigo-50 text-indigo-600', title: 'Composition',
      desc: 'Consultez la composition tactique de votre équipe pour chaque match.',
      details: ['Formation tactique visuelle', 'Positionnement de chaque joueur', 'Exportable par le coach'],
    },
  ]

  const ROLES = [
    { icon: 'sports_soccer', color: 'text-green-600 bg-green-50', role: 'Joueur', access: ['Calendrier (son équipe)', 'Convocations', 'Messages', 'Résultats', 'Composition'] },
    { icon: 'family_restroom', color: 'text-orange-600 bg-orange-50', role: 'Parent', access: ['Calendrier (équipe de l\'enfant)', 'Convocations', 'Messages', 'Résultats'] },
    { icon: 'sports', color: 'text-blue-600 bg-blue-50', role: 'Coach', access: ['Calendrier complet', 'Convocations (gestion)', 'Composition', 'Résultats', 'Statistiques', 'Messages'] },
    { icon: 'manage_accounts', color: 'text-primary bg-primary/10', role: 'Dirigeant', access: ['Mon Club (infos, terrains)', 'Équipes', 'Calendrier global', 'Adversaires', 'Résultats', 'Statistiques', 'Messages'] },
  ]

  return (
    <div className="max-w-4xl mx-auto space-y-10">
      {/* Hero */}
      <div className="bg-white border border-[#e8e8f0] rounded-2xl p-8 flex items-center gap-6">
        <div className="w-16 h-16 bg-primary-container rounded-2xl flex items-center justify-center shrink-0">
          <span className="text-white font-black text-2xl tracking-tight">MCH</span>
        </div>
        <div>
          <h2 className="text-headline-lg text-on-surface">Documentation MonClubHouse</h2>
          <p className="text-body-md text-on-surface-variant mt-1">
            MonClubHouse est la plateforme de gestion de club sportif. Calendriers, convocations, résultats et communication — tout au même endroit.
          </p>
        </div>
      </div>

      {/* Fonctionnalités */}
      <section>
        <h3 className="text-headline-md text-on-surface mb-4">Fonctionnalités</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {FEATURES.map(f => (
            <div key={f.title} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${f.color}`}>
                  <span className="material-symbols-outlined text-[22px]">{f.icon}</span>
                </div>
                <h4 className="text-label-lg text-on-surface font-semibold">{f.title}</h4>
              </div>
              <p className="text-body-sm text-on-surface-variant mb-3">{f.desc}</p>
              <ul className="space-y-1">
                {f.details.map(d => (
                  <li key={d} className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                    <span className="material-symbols-outlined text-primary text-[14px] mt-0.5 shrink-0">check_circle</span>
                    {d}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Accès par rôle */}
      <section>
        <h3 className="text-headline-md text-on-surface mb-4">Accès selon votre rôle</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROLES.map(r => (
            <div key={r.role} className="bg-white border border-[#e8e8f0] rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${r.color}`}>
                  <span className="material-symbols-outlined text-[20px]">{r.icon}</span>
                </div>
                <span className="text-label-lg text-on-surface font-semibold">{r.role}</span>
              </div>
              <ul className="space-y-1.5">
                {r.access.map(a => (
                  <li key={a} className="flex items-center gap-2 text-body-sm text-on-surface-variant">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Rejoindre un club */}
      <section className="bg-primary/5 border border-primary/20 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-[22px]">key</span>
          </div>
          <div>
            <h4 className="text-label-lg text-on-surface font-semibold mb-1">Comment rejoindre votre club ?</h4>
            <p className="text-body-sm text-on-surface-variant">
              Demandez votre <strong>code d'accès</strong> à votre dirigeant ou administrateur de club.
              Rendez-vous sur <strong>/join</strong> et saisissez ce code pour être automatiquement rattaché à votre équipe avec le bon rôle.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
