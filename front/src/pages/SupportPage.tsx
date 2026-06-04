import { useState } from 'react'

export default function SupportPage() {
  const [form, setForm]   = useState({ nom: '', email: '', sujet: '', message: '', priorite: 'normal' })
  const [sent, setSent]   = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // Simulation envoi — en prod: appel API ou mailto
    await new Promise(r => setTimeout(r, 900))
    setLoading(false)
    setSent(true)
  }

  if (sent) {
    return (
      <div className="max-w-lg mx-auto text-center py-20">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <span className="material-symbols-outlined text-green-600 text-[40px]">check_circle</span>
        </div>
        <h2 className="text-headline-lg text-on-surface mb-2">Message envoyé !</h2>
        <p className="text-body-lg text-on-surface-variant mb-2">Nous avons bien reçu votre demande.</p>
        <p className="text-body-md text-on-surface-variant mb-8">Une réponse vous sera envoyée à <strong>{form.email || 'votre adresse email'}</strong> sous 24h.</p>
        <button
          onClick={() => { setSent(false); setForm({ nom: '', email: '', sujet: '', message: '', priorite: 'normal' }) }}
          className="px-6 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low transition-colors"
        >
          Nouveau message
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface">Contacter le support</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Notre équipe vous répond sous 24h, du lundi au vendredi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Infos */}
        <div className="space-y-4">
          {[
            {
              icon: 'mail', color: 'bg-primary/10 text-primary',
              title: 'Email direct',
              line1: 'contact@monclubhouse.fr',
              line2: 'Pour toute demande générale',
              href: 'mailto:contact@monclubhouse.fr',
            },
            {
              icon: 'schedule', color: 'bg-blue-100 text-blue-600',
              title: 'Disponibilité',
              line1: 'Lun – Ven, 9h – 18h',
              line2: 'Réponse sous 24h ouvrées',
              href: null,
            },
            {
              icon: 'priority_high', color: 'bg-red-100 text-red-600',
              title: 'Urgence / Bug bloquant',
              line1: 'Priorité "Urgent" dans le formulaire',
              line2: 'Traité en priorité',
              href: null,
            },
          ].map(c => (
            <div key={c.title} className={`bg-white border border-[#e8e8f0] rounded-xl p-5 flex items-start gap-4 ${c.href ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
              onClick={() => c.href && window.open(c.href)}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${c.color}`}>
                <span className="material-symbols-outlined text-[20px]">{c.icon}</span>
              </div>
              <div>
                <p className="text-label-lg text-on-surface font-semibold">{c.title}</p>
                <p className={`text-body-sm font-medium mt-0.5 ${c.href ? 'text-primary' : 'text-on-surface'}`}>{c.line1}</p>
                <p className="text-body-sm text-on-surface-variant">{c.line2}</p>
              </div>
            </div>
          ))}

          {/* Lien email direct */}
          <a
            href="mailto:contact@monclubhouse.fr?subject=Support MonClubHouse"
            className="w-full flex items-center justify-center gap-2 py-3 border-2 border-dashed border-outline-variant rounded-xl text-label-md text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span>
            Ouvrir dans votre messagerie
          </a>
        </div>

        {/* Formulaire */}
        <div className="md:col-span-2 bg-white border border-[#e8e8f0] rounded-xl p-6">
          <h3 className="text-headline-md text-on-surface mb-5">Formulaire de contact</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom</label>
                <input
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Jean Dupont"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Email *</label>
                <input
                  type="email"
                  required
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  placeholder="jean@email.com"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Sujet *</label>
              <input
                required
                value={form.sujet}
                onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                placeholder="Ex : Problème de connexion, bug sur le calendrier…"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Priorité</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { v: 'normal', l: 'Normal', icon: 'info', cls: 'border-blue-300 bg-blue-50 text-blue-700' },
                  { v: 'haute',  l: 'Haute',  icon: 'warning', cls: 'border-orange-300 bg-orange-50 text-orange-700' },
                  { v: 'urgent', l: 'Urgent', icon: 'error',   cls: 'border-red-300 bg-red-50 text-red-700' },
                ].map(p => (
                  <button type="button" key={p.v}
                    onClick={() => setForm(f => ({ ...f, priorite: p.v }))}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-label-md font-semibold transition-all ${
                      form.priorite === p.v ? p.cls : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                    {p.l}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-label-md text-on-surface-variant">Message *</label>
              <textarea
                required
                value={form.message}
                onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                rows={5}
                placeholder="Décrivez votre problème en détail : navigateur utilisé, étapes pour reproduire le bug, capture d'écran disponible…"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-60 transition-colors flex items-center justify-center gap-2"
            >
              {loading
                ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                : <span className="material-symbols-outlined text-[20px]">send</span>
              }
              {loading ? 'Envoi…' : 'Envoyer le message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
