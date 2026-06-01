import { useState } from 'react'

type Response = 'present' | 'absent' | 'incertain' | 'sans_reponse'

type Player = {
  id: number
  name: string
  position: string
  number: number
  email: string
  response: Response
  notif_email: boolean
  selected: boolean
}

const INITIAL_PLAYERS: Player[] = [
  { id: 1, name: 'Lucas Bertin',    position: 'Attaquant', number: 9,  email: 'l.bertin@mch.fr',    response: 'present',       notif_email: true,  selected: true  },
  { id: 2, name: 'Cédric Lefebvre', position: 'Milieu',    number: 8,  email: 'c.lefebvre@mch.fr',  response: 'present',       notif_email: true,  selected: true  },
  { id: 3, name: 'Antoine Moreau',  position: 'Défenseur', number: 4,  email: 'a.moreau@mch.fr',    response: 'sans_reponse',  notif_email: true,  selected: true  },
  { id: 4, name: 'Marc Rousseau',   position: 'Gardien',   number: 1,  email: 'm.rousseau@mch.fr',  response: 'absent',        notif_email: false, selected: true  },
  { id: 5, name: 'Baptiste Girard', position: 'Défenseur', number: 5,  email: 'b.girard@mch.fr',    response: 'present',       notif_email: true,  selected: true  },
  { id: 6, name: 'Julien Fontaine', position: 'Milieu',    number: 6,  email: 'j.fontaine@mch.fr',  response: 'sans_reponse',  notif_email: true,  selected: true  },
  { id: 7, name: 'Nicolas Perrin',  position: 'Attaquant', number: 11, email: 'n.perrin@mch.fr',    response: 'present',       notif_email: true,  selected: true  },
  { id: 8, name: 'Théo Blanchard',  position: 'Milieu',    number: 10, email: 't.blanchard@mch.fr', response: 'sans_reponse',  notif_email: false, selected: true  },
  { id: 9, name: 'Sébastien Mard',  position: 'Défenseur', number: 3,  email: 's.mard@mch.fr',      response: 'incertain',     notif_email: true,  selected: false },
  { id: 10, name: 'Kevin Arnaud',   position: 'Milieu',    number: 7,  email: 'k.arnaud@mch.fr',    response: 'sans_reponse',  notif_email: true,  selected: false },
]

const BADGE: Record<Response, { label: string; bg: string; text: string; icon: string; dot: string }> = {
  present:       { label: 'Présent',    bg: 'bg-green-100',  text: 'text-green-700',  icon: 'check_circle', dot: 'bg-green-500' },
  absent:        { label: 'Absent',     bg: 'bg-red-100',    text: 'text-red-700',    icon: 'cancel',       dot: 'bg-red-500'   },
  incertain:     { label: 'Incertain',  bg: 'bg-yellow-100', text: 'text-yellow-700', icon: 'help',         dot: 'bg-yellow-400'},
  sans_reponse:  { label: 'En attente', bg: 'bg-orange-100', text: 'text-orange-700', icon: 'schedule',     dot: 'bg-orange-400'},
}

type SendStep = 'idle' | 'preview' | 'sending' | 'done'

export default function ConvocationsPage() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS)
  const [sendEmail, setSendEmail] = useState(true)
  const [instructions, setInstructions] = useState('')
  const [sendStep, setSendStep] = useState<SendStep>('idle')
  const [emailReport, setEmailReport] = useState<{ sent: number; failed: number } | null>(null)
  const [showEmailPreview, setShowEmailPreview] = useState(false)
  const [expandedPlayer, setExpandedPlayer] = useState<number | null>(null)

  const selected   = players.filter(p => p.selected)
  const notSelected = players.filter(p => !p.selected)

  const stats = {
    present:      selected.filter(p => p.response === 'present').length,
    absent:       selected.filter(p => p.response === 'absent').length,
    incertain:    selected.filter(p => p.response === 'incertain').length,
    sans_reponse: selected.filter(p => p.response === 'sans_reponse').length,
  }

  const emailCount = selected.filter(p => p.notif_email).length

  const toggleSelect = (id: number) =>
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, selected: !p.selected } : p))

  const toggleAllSelected = () => {
    const allSelected = players.every(p => p.selected)
    setPlayers(prev => prev.map(p => ({ ...p, selected: !allSelected })))
  }

  const updateResponse = (id: number, response: Response) =>
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, response } : p))

  const toggleEmailPref = (id: number) =>
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, notif_email: !p.notif_email } : p))

  const handleSend = async () => {
    setSendStep('sending')
    // Simulation appel API — à remplacer par fetch('/api/matchs/1/convocations', {...})
    await new Promise(r => setTimeout(r, 1800))
    setEmailReport({ sent: emailCount, failed: selected.filter(p => !p.notif_email).length })
    setSendStep('done')
  }

  return (
    <div>
      {/* ── Titre ─────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Convocations</h2>
          <p className="text-body-md text-on-surface-variant">
            Gérez les présences et envoyez les convocations par email
          </p>
        </div>
        <button
          onClick={() => setSendStep('preview')}
          className="flex items-center gap-2 bg-primary text-white px-5 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors shadow-sm"
        >
          <span className="material-symbols-outlined text-[20px]">send</span>
          Envoyer les convocations
        </button>
      </div>

      {/* ── Match Card ─────────────────────────────────────────────── */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-5 mb-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0">
              <span className="material-symbols-outlined text-[22px]">sports_soccer</span>
              <span className="text-[10px] font-black uppercase">SAM</span>
            </div>
            <div>
              <h3 className="text-headline-md text-on-surface">MCH Seniors A vs Red Star FC</h3>
              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-body-sm text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                  Samedi 7 juin 2025 · 15:30
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">location_on</span>
                  Stade Municipal
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[14px]">emoji_events</span>
                  Division 3
                </span>
              </div>
            </div>
          </div>
          <span className="px-3 py-1.5 bg-green-100 text-green-700 rounded-full text-label-md font-semibold">
            Match officiel
          </span>
        </div>
      </div>

      {/* ── Stats ──────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
        {[
          { key: 'present',      label: 'Présents',    color: 'text-green-600', border: 'border-l-green-500'  },
          { key: 'absent',       label: 'Absents',     color: 'text-error',     border: 'border-l-error'      },
          { key: 'incertain',    label: 'Incertains',  color: 'text-yellow-600',border: 'border-l-yellow-400' },
          { key: 'sans_reponse', label: 'En attente',  color: 'text-orange-500',border: 'border-l-orange-400' },
        ].map(s => (
          <div key={s.key} className={`bg-white border border-[#e8e8f0] border-l-4 ${s.border} rounded-lg p-4 text-center`}>
            <p className={`text-display-lg font-black ${s.color}`}>{stats[s.key as keyof typeof stats]}</p>
            <p className="text-label-md text-on-surface-variant mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* ── Liste joueurs ────────────────────────────────────────── */}
        <div className="lg:col-span-2 bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-4 border-b border-[#e8e8f0] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h4 className="text-headline-md">
                Joueurs convoqués
                <span className="ml-2 text-label-md text-on-surface-variant font-normal">({selected.length})</span>
              </h4>
            </div>
            <button
              onClick={toggleAllSelected}
              className="text-primary text-label-md hover:underline"
            >
              {players.every(p => p.selected) ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          </div>

          <div className="divide-y divide-[#e8e8f0]">
            {players.map(player => {
              const badge = BADGE[player.response]
              const isExpanded = expandedPlayer === player.id

              return (
                <div key={player.id} className={`transition-colors ${player.selected ? '' : 'opacity-50'}`}>
                  <div className="p-4 flex items-center gap-3 hover:bg-surface-container-low">
                    {/* Checkbox sélection */}
                    <input
                      type="checkbox"
                      checked={player.selected}
                      onChange={() => toggleSelect(player.id)}
                      className="w-4 h-4 accent-primary shrink-0 cursor-pointer"
                    />

                    {/* Avatar numéro */}
                    <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm shrink-0">
                      #{player.number}
                    </div>

                    {/* Infos */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-label-lg text-on-surface">{player.name}</p>
                        <span className="text-label-md text-on-surface-variant bg-surface-container-low px-2 py-0.5 rounded">
                          {player.position}
                        </span>
                      </div>
                      <p className="text-body-sm text-on-surface-variant mt-0.5">{player.email}</p>
                    </div>

                    {/* Badge réponse */}
                    <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full text-label-md ${badge.bg} ${badge.text}`}>
                      <span className="material-symbols-outlined text-[14px]">{badge.icon}</span>
                      {badge.label}
                    </div>

                    {/* Icône email */}
                    <button
                      onClick={() => toggleEmailPref(player.id)}
                      title={player.notif_email ? 'Email activé — cliquer pour désactiver' : 'Email désactivé — cliquer pour activer'}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                        player.notif_email ? 'text-primary hover:bg-primary/10' : 'text-on-surface-variant/40 hover:bg-surface-container'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {player.notif_email ? 'mark_email_read' : 'mail_off'}
                      </span>
                    </button>

                    {/* Actions présence */}
                    <div className="flex gap-1">
                      <button
                        onClick={() => updateResponse(player.id, 'present')}
                        title="Présent"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          player.response === 'present' ? 'bg-green-500 text-white' : 'hover:bg-green-100 text-green-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">check</span>
                      </button>
                      <button
                        onClick={() => updateResponse(player.id, 'absent')}
                        title="Absent"
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          player.response === 'absent' ? 'bg-red-500 text-white' : 'hover:bg-red-100 text-red-600'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                      <button
                        onClick={() => setExpandedPlayer(isExpanded ? null : player.id)}
                        title="Voir plus"
                        className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container text-on-surface-variant transition-colors"
                      >
                        <span className="material-symbols-outlined text-[18px]">
                          {isExpanded ? 'expand_less' : 'more_vert'}
                        </span>
                      </button>
                    </div>
                  </div>

                  {/* Panel étendu */}
                  {isExpanded && (
                    <div className="px-14 pb-4 bg-surface-container-low/50 flex flex-wrap gap-2">
                      {(['present', 'absent', 'incertain'] as const).map(r => {
                        const b = BADGE[r]
                        return (
                          <button
                            key={r}
                            onClick={() => updateResponse(player.id, r)}
                            className={`px-3 py-1.5 rounded-full text-label-md transition-all ${
                              player.response === r ? `${b.bg} ${b.text} font-semibold` : 'bg-white border border-outline-variant text-on-surface-variant hover:bg-surface-container'
                            }`}
                          >
                            {b.label}
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Panneau droit : email + instructions ─────────────────── */}
        <div className="space-y-4">

          {/* Notifications email */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary">mail</span>
                </div>
                <div>
                  <p className="text-label-lg text-on-surface">Envoi par email</p>
                  <p className="text-body-sm text-on-surface-variant">Via Hostinger Mail</p>
                </div>
              </div>
              <Toggle on={sendEmail} onChange={setSendEmail} />
            </div>

            {sendEmail && (
              <div className="space-y-3 pt-3 border-t border-[#e8e8f0]">
                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Joueurs avec email activé</span>
                  <span className="font-semibold text-primary">{emailCount} / {selected.length}</span>
                </div>

                <div className="flex items-center justify-between text-body-sm">
                  <span className="text-on-surface-variant">Expéditeur</span>
                  <span className="font-medium text-on-surface text-[12px]">convocations@monclubhouse.fr</span>
                </div>

                {/* Barre de progression */}
                <div className="space-y-1">
                  <div className="w-full h-2 bg-surface-container-low rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: selected.length ? `${(emailCount / selected.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <p className="text-body-sm text-on-surface-variant">
                    {selected.filter(p => !p.notif_email).length > 0 && (
                      <span className="text-orange-500">
                        {selected.filter(p => !p.notif_email).length} joueur(s) sans email activé —{' '}
                        <button
                          onClick={() => setPlayers(prev => prev.map(p => p.selected ? { ...p, notif_email: true } : p))}
                          className="underline hover:text-orange-700"
                        >
                          Activer pour tous
                        </button>
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => setShowEmailPreview(true)}
                  className="w-full flex items-center justify-center gap-2 border border-outline-variant rounded-lg py-2 text-label-md text-on-surface hover:bg-surface-container-low transition-colors"
                >
                  <span className="material-symbols-outlined text-[18px]">preview</span>
                  Aperçu de l'email
                </button>
              </div>
            )}

            {!sendEmail && (
              <div className="mt-3 pt-3 border-t border-[#e8e8f0]">
                <p className="text-body-sm text-on-surface-variant text-center">
                  Les joueurs ne recevront pas d'email. Seule la notification in-app sera envoyée.
                </p>
              </div>
            )}
          </div>

          {/* Instructions coach */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-yellow-50 rounded-xl flex items-center justify-center">
                <span className="material-symbols-outlined text-yellow-600">edit_note</span>
              </div>
              <div>
                <p className="text-label-lg text-on-surface">Instructions du coach</p>
                <p className="text-body-sm text-on-surface-variant">Incluses dans l'email</p>
              </div>
            </div>
            <textarea
              value={instructions}
              onChange={e => setInstructions(e.target.value)}
              className="w-full border border-outline-variant rounded-lg px-3 py-2.5 text-body-md text-on-surface focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all resize-none"
              rows={4}
              placeholder="Ex : Soyez présents 30 min avant le coup d'envoi. Amenez vos équipements complets..."
            />
            <p className="text-body-sm text-on-surface-variant mt-1.5">
              {instructions.length}/300 caractères
            </p>
          </div>

          {/* Récapitulatif */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 space-y-2">
            <p className="text-label-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">summarize</span>
              Récapitulatif
            </p>
            <ul className="space-y-1.5 text-body-sm text-on-surface">
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Joueurs convoqués</span>
                <span className="font-semibold">{selected.length}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Emails à envoyer</span>
                <span className="font-semibold">{sendEmail ? emailCount : 0}</span>
              </li>
              <li className="flex justify-between">
                <span className="text-on-surface-variant">Notifs in-app</span>
                <span className="font-semibold">{selected.length}</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── Modal : Aperçu email ───────────────────────────────────── */}
      {showEmailPreview && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowEmailPreview(false)}>
          <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-headline-md">Aperçu de l'email</h3>
              <button onClick={() => setShowEmailPreview(false)} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            {/* Miniature email */}
            <div className="p-5 bg-[#f4f4f6]">
              <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-[#e8e8f0]">
                {/* Header vert */}
                <div style={{ background: 'linear-gradient(135deg,#1b4332 0%,#2d6a4f 100%)' }} className="px-6 py-8 text-center">
                  <div className="inline-block bg-white/15 rounded-xl px-5 py-2.5 mb-3">
                    <span className="text-white font-black text-xl">MCH</span>
                  </div>
                  <p className="text-white/70 text-xs uppercase tracking-widest font-semibold">MonClubHouse FC</p>
                </div>
                {/* Contenu */}
                <div className="p-6 text-center">
                  <span className="inline-block bg-green-100 text-green-700 text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4">
                    Match
                  </span>
                  <h2 className="text-headline-md text-on-surface mb-1">Tu es convoqué(e) !</h2>
                  <p className="text-body-md text-on-surface-variant mb-5">MCH Seniors A vs Red Star FC</p>
                  <div className="bg-[#f8fffe] border border-[#bfc9c1] rounded-xl overflow-hidden text-left mb-6">
                    {[
                      { icon: '📅', label: 'Date', value: 'Samedi 7 juin 2025' },
                      { icon: '⏰', label: 'Heure', value: '15:30' },
                      { icon: '📍', label: 'Lieu', value: 'Stade Municipal' },
                      { icon: '⚽', label: 'Adversaire', value: 'Red Star FC' },
                    ].map((row, i, arr) => (
                      <div key={row.label} className={`px-5 py-4 flex items-center gap-3 ${i < arr.length - 1 ? 'border-b border-[#e8e8f0]' : ''}`}>
                        <span className="text-xl">{row.icon}</span>
                        <div>
                          <p className="text-label-md text-on-surface-variant">{row.label}</p>
                          <p className="text-label-lg text-on-surface">{row.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {instructions && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-left mb-5">
                      <p className="text-label-md text-yellow-800 font-bold mb-1">📋 Instructions du coach</p>
                      <p className="text-body-sm text-yellow-700">{instructions}</p>
                    </div>
                  )}
                  <div className="flex gap-3 justify-center">
                    <div className="bg-primary text-white font-bold text-sm px-6 py-3 rounded-xl">
                      ✅ Je serai là
                    </div>
                    <div className="bg-white text-on-surface font-bold text-sm px-6 py-3 rounded-xl border border-[#bfc9c1]">
                      ❌ Je serai absent
                    </div>
                  </div>
                </div>
                {/* Footer */}
                <div className="bg-[#f4f4f6] px-6 py-4 text-center border-t border-[#e8e8f0]">
                  <p className="text-body-sm text-on-surface-variant">
                    Envoyé par MonClubHouse FC via la plateforme MonClubHouse
                  </p>
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setShowEmailPreview(false)} className="px-4 py-2 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">
                Fermer
              </button>
              <button
                onClick={() => { setShowEmailPreview(false); setSendStep('preview') }}
                className="px-4 py-2 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container"
              >
                Envoyer maintenant
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal : Confirmation envoi ─────────────────────────────── */}
      {(sendStep === 'preview' || sendStep === 'sending' || sendStep === 'done') && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden">
            {sendStep !== 'done' && (
              <>
                <div className="p-6 border-b border-[#e8e8f0]">
                  <h3 className="text-headline-md text-on-surface">Confirmer l'envoi</h3>
                  <p className="text-body-md text-on-surface-variant mt-1">
                    Les convocations seront envoyées aux joueurs sélectionnés.
                  </p>
                </div>
                <div className="p-6 space-y-3">
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Joueurs convoqués</span>
                    <span className="font-semibold text-on-surface">{selected.length}</span>
                  </div>
                  <div className="flex justify-between text-body-md">
                    <span className="text-on-surface-variant">Notifications in-app</span>
                    <span className="font-semibold text-on-surface">{selected.length}</span>
                  </div>
                  {sendEmail && (
                    <div className="flex justify-between text-body-md">
                      <span className="text-on-surface-variant flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[16px] text-primary">mail</span>
                        Emails Hostinger
                      </span>
                      <span className="font-semibold text-primary">{emailCount} emails</span>
                    </div>
                  )}
                  {!sendEmail && (
                    <div className="flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg p-3 text-body-sm text-orange-700">
                      <span className="material-symbols-outlined text-[18px]">info</span>
                      Envoi email désactivé — notification in-app uniquement.
                    </div>
                  )}
                  {sendEmail && (
                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg p-3 text-body-sm text-primary">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                      Expéditeur : <strong>convocations@monclubhouse.fr</strong>
                    </div>
                  )}
                </div>
                <div className="p-6 border-t border-[#e8e8f0] flex justify-end gap-3">
                  <button
                    onClick={() => setSendStep('idle')}
                    disabled={sendStep === 'sending'}
                    className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg text-on-surface hover:bg-surface-container-low disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={sendStep === 'sending'}
                    className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-70 flex items-center gap-2"
                  >
                    {sendStep === 'sending' ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                        </svg>
                        Envoi en cours…
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">send</span>
                        Confirmer l'envoi
                      </>
                    )}
                  </button>
                </div>
              </>
            )}

            {sendStep === 'done' && emailReport && (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
                  <span className="material-symbols-outlined text-green-600 text-[36px]">check_circle</span>
                </div>
                <h3 className="text-headline-md text-on-surface mb-2">Convocations envoyées !</h3>
                <p className="text-body-md text-on-surface-variant mb-6">
                  Les joueurs ont été notifiés avec succès.
                </p>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                    <p className="text-2xl font-black text-green-600">{emailReport.sent}</p>
                    <p className="text-label-md text-green-700 mt-0.5">Emails envoyés</p>
                  </div>
                  <div className={`${emailReport.failed > 0 ? 'bg-orange-50 border-orange-200' : 'bg-surface-container-low border-[#e8e8f0]'} border rounded-xl p-4`}>
                    <p className={`text-2xl font-black ${emailReport.failed > 0 ? 'text-orange-600' : 'text-on-surface-variant'}`}>
                      {emailReport.failed}
                    </p>
                    <p className={`text-label-md mt-0.5 ${emailReport.failed > 0 ? 'text-orange-700' : 'text-on-surface-variant'}`}>
                      Sans email
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setSendStep('idle'); setEmailReport(null) }}
                  className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary-container transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={`relative inline-flex w-12 h-6 rounded-full transition-colors duration-200 ${on ? 'bg-primary' : 'bg-surface-container-highest'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all duration-200 ${on ? 'left-7' : 'left-1'}`}
      />
    </button>
  )
}
