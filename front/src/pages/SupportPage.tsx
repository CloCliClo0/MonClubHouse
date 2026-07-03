import { useEffect, useState } from 'react'
import api from '../services/api'

type Priorite = 'normal' | 'haute' | 'urgent'
type Statut   = 'ouvert' | 'en_cours' | 'resolu' | 'ferme'

type Ticket = {
  id: number
  sujet: string
  message: string
  priorite: Priorite
  statut: Statut
  reponse: string | null
  createdAt: string
  updatedAt: string
  repondant?: { nom: string; prenom: string } | null
}

const PRIORITE_CFG: Record<Priorite, { label: string; icon: string; cls: string }> = {
  normal: { label: 'Normal', icon: 'info',     cls: 'border-blue-300 bg-blue-50 text-blue-700' },
  haute:  { label: 'Haute',  icon: 'warning',  cls: 'border-orange-300 bg-orange-50 text-orange-700' },
  urgent: { label: 'Urgent', icon: 'error',    cls: 'border-red-300 bg-red-50 text-red-700' },
}

const STATUT_CFG: Record<Statut, { label: string; cls: string }> = {
  ouvert:   { label: 'Ouvert',   cls: 'bg-blue-100 text-blue-700' },
  en_cours: { label: 'En cours', cls: 'bg-orange-100 text-orange-700' },
  resolu:   { label: 'Résolu',   cls: 'bg-green-100 text-green-700' },
  ferme:    { label: 'Fermé',    cls: 'bg-slate-100 text-slate-600' },
}

export default function SupportPage() {
  const [form, setForm]     = useState({ sujet: '', message: '', priorite: 'normal' as Priorite })
  const [sending, setSending] = useState(false)
  const [sent, setSent]     = useState(false)
  const [error, setError]   = useState('')

  const [tickets, setTickets]   = useState<Ticket[]>([])
  const [ticketsLoading, setTicketsLoading] = useState(true)
  const [expanded, setExpanded] = useState<number | null>(null)

  const loadTickets = () => {
    api.get('/support/mes-tickets')
      .then(r => setTickets(r.data.data || []))
      .catch(() => setTickets([]))
      .finally(() => setTicketsLoading(false))
  }

  useEffect(() => { loadTickets() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSending(true)
    try {
      await api.post('/support', form)
      setSent(true)
      setForm({ sujet: '', message: '', priorite: 'normal' })
      loadTickets()
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Erreur lors de l\'envoi.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-headline-lg text-on-surface">Contacter le support</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Notre équipe vous répond sous 24h, du lundi au vendredi.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {/* Infos */}
        <div className="space-y-4">
          {[
            { icon: 'mail',         color: 'bg-primary/10 text-primary',   title: 'Email direct',           line1: 'contact@monclubhouse.fr',      line2: 'Pour toute demande générale', href: 'mailto:contact@monclubhouse.fr' },
            { icon: 'schedule',     color: 'bg-blue-100 text-blue-600',    title: 'Disponibilité',           line1: 'Lun – Ven, 9h – 18h',         line2: 'Réponse sous 24h ouvrées',   href: null },
            { icon: 'priority_high',color: 'bg-red-100 text-red-600',      title: 'Urgence / Bug bloquant',  line1: 'Priorité "Urgent"',            line2: 'Traité en priorité',          href: null },
          ].map(c => (
            <div key={c.title}
              className={`bg-white border border-[#e8e8f0] rounded-xl p-5 flex items-start gap-4 ${c.href ? 'cursor-pointer hover:border-primary/40 transition-colors' : ''}`}
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
        </div>

        {/* Formulaire */}
        <div className="md:col-span-2 bg-white border border-[#e8e8f0] rounded-xl p-6">
          {sent ? (
            <div className="text-center py-10">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="material-symbols-outlined text-green-600 text-[36px]">check_circle</span>
              </div>
              <h3 className="text-headline-md text-on-surface mb-2">Demande envoyée !</h3>
              <p className="text-body-md text-on-surface-variant mb-6">Nous avons bien reçu votre message. Vous serez informé de notre réponse.</p>
              <button onClick={() => setSent(false)}
                className="px-5 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low transition-colors">
                Nouvelle demande
              </button>
            </div>
          ) : (
            <>
              <h3 className="text-headline-md text-on-surface mb-5">Nouvelle demande</h3>
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 px-4 py-3 rounded-lg mb-4 text-red-700 text-body-sm">
                  <span className="material-symbols-outlined text-[18px]">error</span>
                  {error}
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Sujet *</label>
                  <input required value={form.sujet} onChange={e => setForm(f => ({ ...f, sujet: e.target.value }))}
                    placeholder="Ex : Problème de connexion, bug sur le calendrier…"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Priorité</label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.entries(PRIORITE_CFG) as [Priorite, typeof PRIORITE_CFG[Priorite]][]).map(([v, p]) => (
                      <button type="button" key={v}
                        onClick={() => setForm(f => ({ ...f, priorite: v }))}
                        className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-label-md font-semibold transition-all ${
                          form.priorite === v ? p.cls : 'border-outline-variant text-on-surface-variant hover:border-primary/40'
                        }`}>
                        <span className="material-symbols-outlined text-[16px]">{p.icon}</span>
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Message *</label>
                  <textarea required value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
                    rows={5} placeholder="Décrivez votre problème en détail : navigateur, étapes pour reproduire, capture d'écran disponible…"
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all resize-none" />
                </div>

                <button type="submit" disabled={sending}
                  className="w-full py-3 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
                  {sending
                    ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <span className="material-symbols-outlined text-[20px]">send</span>
                  }
                  {sending ? 'Envoi…' : 'Envoyer la demande'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {/* Mes tickets précédents */}
      <div>
        <h3 className="text-headline-md text-on-surface mb-4">Mes demandes précédentes</h3>

        {ticketsLoading ? (
          <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
        ) : tickets.length === 0 ? (
          <div className="py-12 text-center bg-white border border-[#e8e8f0] rounded-xl text-on-surface-variant">
            <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">inbox</span>
            <p className="text-body-md">Aucune demande pour l'instant.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map(t => {
              const statut = STATUT_CFG[t.statut]
              const priorite = PRIORITE_CFG[t.priorite]
              const isOpen = expanded === t.id
              return (
                <div key={t.id} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
                  <button onClick={() => setExpanded(isOpen ? null : t.id)}
                    className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-surface-container-low/50 transition-colors">
                    <span className={`material-symbols-outlined text-[18px] ${
                      t.priorite === 'urgent' ? 'text-red-500' : t.priorite === 'haute' ? 'text-orange-500' : 'text-blue-500'
                    }`}>{priorite.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-label-lg text-on-surface truncate">{t.sujet}</p>
                      <p className="text-body-sm text-on-surface-variant">
                        {new Date(t.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-label-md font-semibold shrink-0 ${statut.cls}`}>{statut.label}</span>
                    <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                      {isOpen ? 'expand_less' : 'expand_more'}
                    </span>
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 border-t border-[#e8e8f0] pt-4 space-y-3">
                      <div className="bg-surface-container-low rounded-lg p-4">
                        <p className="text-label-md text-on-surface-variant mb-1">Votre message</p>
                        <p className="text-body-md text-on-surface whitespace-pre-wrap">{t.message}</p>
                      </div>
                      {t.reponse ? (
                        <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="material-symbols-outlined text-primary text-[16px]">support_agent</span>
                            <p className="text-label-md text-primary font-semibold">
                              Réponse du support
                              {t.repondant && <span className="font-normal text-on-surface-variant"> · {t.repondant.prenom} {t.repondant.nom}</span>}
                            </p>
                          </div>
                          <p className="text-body-md text-on-surface whitespace-pre-wrap">{t.reponse}</p>
                        </div>
                      ) : (
                        <p className="text-body-sm text-on-surface-variant italic flex items-center gap-1.5">
                          <span className="material-symbols-outlined text-[16px]">hourglass_empty</span>
                          En attente de réponse du support…
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
