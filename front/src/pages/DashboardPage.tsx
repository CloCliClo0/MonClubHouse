import { Link } from 'react-router-dom'

export default function DashboardPage() {
  const stats = [
    {
      label: 'Membres',
      value: '1 248',
      sub: '+12% ce mois',
      subColor: 'text-primary',
      icon: 'groups',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      border: 'border-l-primary',
    },
    {
      label: 'Équipes',
      value: '32',
      sub: 'Tous actifs',
      subColor: 'text-blue-500',
      icon: 'sports_soccer',
      iconBg: 'bg-blue-50',
      iconColor: 'text-blue-500',
      border: 'border-l-blue-500',
    },
    {
      label: 'Matchs',
      value: '14',
      sub: 'Prévus ce weekend',
      subColor: 'text-orange-500',
      icon: 'event_available',
      iconBg: 'bg-orange-50',
      iconColor: 'text-orange-500',
      border: 'border-l-orange-500',
    },
    {
      label: 'Notifications',
      value: '8',
      sub: 'À traiter urgemment',
      subColor: 'text-error',
      icon: 'campaign',
      iconBg: 'bg-red-50',
      iconColor: 'text-error',
      border: 'border-l-error',
    },
  ]

  const events = [
    { day: 'SAM', icon: 'sports_soccer', iconBg: 'bg-orange-100 text-orange-700', title: 'MCH U19 vs Red Star FC', sub: 'Stade Municipal • 15:30', badge: 'Match', badgeClass: 'bg-green-100 text-green-700' },
    { day: 'LUN', icon: 'fitness_center', iconBg: 'bg-blue-100 text-blue-700', title: 'Entraînement Seniors A', sub: 'Terrain Annexe • 19:00', badge: 'Entraînement', badgeClass: 'bg-blue-100 text-blue-700' },
    { day: 'MAR', icon: 'groups', iconBg: 'bg-tertiary-fixed text-tertiary', title: 'Réunion de Bureau', sub: 'Siège Club • 20:30', badge: 'Réunion', badgeClass: 'bg-slate-100 text-slate-700' },
  ]

  const notifications = [
    { unread: true, icon: 'mail', iconBg: 'bg-white border border-blue-100', iconColor: 'text-blue-500', title: 'Nouveau message reçu', body: "L'entraîneur des U15 a envoyé le rapport de match du weekend dernier...", time: 'Il y a 10 min', timeColor: 'text-blue-500' },
    { unread: false, icon: 'payments', iconBg: 'bg-surface-container-low', iconColor: 'text-on-surface-variant', title: 'Paiement validé', body: 'La cotisation de Thomas Dubois a été reçue via Stripe.', time: 'Il y a 2 heures', timeColor: 'text-on-surface-variant/60' },
    { unread: false, icon: 'person_add', iconBg: 'bg-surface-container-low', iconColor: 'text-on-surface-variant', title: 'Nouveau membre', body: "Sarah Martin vient de rejoindre l'équipe féminine Seniors.", time: 'Hier, 18:45', timeColor: 'text-on-surface-variant/60' },
  ]

  const quickActions = [
    { icon: 'assignment_turned_in', label: 'Convocations', to: '/convocations' },
    { icon: 'forum', label: 'Chat', to: '/messages' },
    { icon: 'leaderboard', label: 'Résultats', to: '/resultats' },
    { icon: 'account_circle', label: 'Profil', to: '/profil' },
  ]

  const bars = [
    { h: '40%', val: 24, label: 'Jan', active: false },
    { h: '60%', val: 38, label: 'Fév', active: false },
    { h: '55%', val: 32, label: 'Mar', active: false },
    { h: '80%', val: 56, label: 'Avr', active: false },
    { h: '70%', val: 48, label: 'Mai', active: false },
    { h: '95%', val: 62, label: 'Juin', active: true },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-10">
        <h2 className="text-display-lg text-on-surface">Bonjour Julien 👋</h2>
        <p className="text-body-lg text-on-surface-variant mt-2">
          Voici ce qui se passe dans votre club aujourd'hui.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`bg-white border border-[#e8e8f0] p-6 rounded-lg border-l-4 ${s.border} shadow-sm hover:shadow-md transition-shadow`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-on-surface-variant text-label-md uppercase tracking-wider">{s.label}</p>
                <h3 className="text-headline-lg text-on-surface mt-2">{s.value}</h3>
                <p className={`${s.subColor} text-label-md flex items-center gap-1 mt-1`}>
                  {s.label === 'Membres' && (
                    <span className="material-symbols-outlined text-[14px]">trending_up</span>
                  )}
                  {s.sub}
                </p>
              </div>
              <div className={`${s.iconBg} p-3 rounded-full`}>
                <span className={`material-symbols-outlined ${s.iconColor}`}>{s.icon}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Prochains événements */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#e8e8f0] flex justify-between items-center">
            <h4 className="text-headline-md">Prochains événements</h4>
            <button className="text-primary text-label-md hover:underline">Voir tout</button>
          </div>
          <div className="flex-1 divide-y divide-[#e8e8f0]">
            {events.map((ev, i) => (
              <div key={i} className="p-4 hover:bg-surface-container-low transition-colors flex items-center gap-4">
                <div className={`w-12 h-12 rounded-lg ${ev.iconBg} flex flex-col items-center justify-center`}>
                  <span className={`material-symbols-outlined text-[20px]`}>{ev.icon}</span>
                  <span className="text-[10px] font-bold uppercase">{ev.day}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-lg text-on-surface truncate">{ev.title}</p>
                  <p className="text-body-sm text-on-surface-variant">{ev.sub}</p>
                </div>
                <span className={`px-2 py-1 ${ev.badgeClass} rounded text-label-md text-[11px]`}>
                  {ev.badge}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Notifications récentes */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b border-[#e8e8f0] flex justify-between items-center">
            <h4 className="text-headline-md">Notifications récentes</h4>
            <button className="text-primary text-label-md hover:underline">Marquer comme lu</button>
          </div>
          <div className="flex-1 divide-y divide-[#e8e8f0]">
            {notifications.map((n, i) => (
              <div
                key={i}
                className={`p-4 flex gap-4 ${n.unread ? 'bg-blue-50/50 border-l-4 border-blue-500' : 'hover:bg-surface-container-low'} transition-colors`}
              >
                <div className={`${n.iconBg} p-2 rounded-full h-fit`}>
                  <span className={`material-symbols-outlined ${n.iconColor}`}>{n.icon}</span>
                </div>
                <div>
                  <p className="text-label-lg text-on-surface">{n.title}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1 line-clamp-2">{n.body}</p>
                  <p className={`text-body-sm ${n.timeColor} mt-1 font-semibold`}>{n.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Accès rapides */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden flex flex-col p-6">
          <h4 className="text-headline-md mb-6">Accès rapides</h4>
          <div className="grid grid-cols-2 gap-4 flex-1">
            {quickActions.map((qa) => (
              <Link
                key={qa.label}
                to={qa.to}
                className="group bg-surface-container-low hover:bg-primary hover:text-white border border-[#e8e8f0] rounded-xl p-4 flex flex-col items-center justify-center gap-3 transition-all duration-300"
              >
                <span className="material-symbols-outlined text-[32px] text-primary group-hover:text-white transition-colors">
                  {qa.icon}
                </span>
                <span className="text-label-lg">{qa.label}</span>
              </Link>
            ))}
          </div>
          <div className="mt-6 p-4 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-4">
            <span className="material-symbols-outlined text-primary">lightbulb</span>
            <p className="text-body-sm text-on-surface">
              Astuce&nbsp;: Vous pouvez glisser-déposer les tuiles pour réorganiser vos accès rapides.
            </p>
          </div>
        </div>
      </div>

      {/* Stats visuel */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inscriptions */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-headline-md">Inscriptions mensuelles</h4>
            <select className="bg-surface-container-low border-none rounded p-1 text-label-md text-on-surface focus:outline-none">
              <option>6 derniers mois</option>
              <option>Cette année</option>
            </select>
          </div>
          <div className="h-48 flex items-end justify-between gap-2 px-2">
            {bars.map((b) => (
              <div key={b.label} className="w-full flex flex-col items-center gap-1">
                <div
                  className={`w-full ${b.active ? 'bg-primary' : 'bg-primary/10'} rounded-t-sm relative group cursor-pointer`}
                  style={{ height: b.h }}
                >
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-inverse-surface text-white text-[10px] px-1.5 py-0.5 rounded whitespace-nowrap">
                    {b.val}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-4 text-on-surface-variant text-label-md">
            {bars.map((b) => (
              <span key={b.label}>{b.label}</span>
            ))}
          </div>
        </div>

        {/* Licences */}
        <div className="bg-white border border-[#e8e8f0] rounded-lg p-6 flex flex-col justify-between">
          <div>
            <h4 className="text-headline-md mb-2">État des licences</h4>
            <p className="text-body-sm text-on-surface-variant mb-6">
              Suivi de la validation documentaire des membres.
            </p>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Validées', pct: '85%', color: 'bg-primary', width: 'w-[85%]' },
              { label: 'En attente', pct: '10%', color: 'bg-orange-400', width: 'w-[10%]' },
              { label: 'Manquantes', pct: '5%', color: 'bg-error', width: 'w-[5%]' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-label-md mb-1">
                  <span>{item.label}</span>
                  <span>{item.pct}</span>
                </div>
                <div className="w-full bg-surface-container-low h-2 rounded-full overflow-hidden">
                  <div className={`${item.color} h-full ${item.width}`} />
                </div>
              </div>
            ))}
          </div>
          <button className="mt-6 w-full py-2 border border-outline-variant rounded-lg text-label-lg text-on-surface hover:bg-surface-container-low transition-colors">
            Relancer les retardataires
          </button>
        </div>
      </div>
    </div>
  )
}
