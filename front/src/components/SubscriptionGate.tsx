import { useState } from 'react'
import api from '../services/api'

type Props = {
  canBuyForClub: boolean
  variant?: 'modal' | 'page'
  onClose?: () => void
}

export default function SubscriptionGate({ canBuyForClub, variant = 'modal', onClose }: Props) {
  const [plan, setPlan]     = useState<'mensuel' | 'annuel'>('mensuel')
  const [scope, setScope]   = useState<'user' | 'club'>('user')
  const [promoCode, setPromoCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState('')

  const handleSubscribe = async () => {
    setLoading(true); setError('')
    try {
      const r = await api.post('/subscription/checkout', {
        plan, scope, promo_code: promoCode.trim() || undefined,
      })
      window.location.href = r.data.data.url
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la création du paiement.')
      setLoading(false)
    }
  }

  const content = (
    <div className={variant === 'modal' ? 'bg-white rounded-2xl max-w-lg w-full shadow-2xl' : 'bg-white border border-[#e8e8f0] rounded-2xl max-w-lg w-full shadow-sm'}>
      <div className="p-6 border-b border-[#e8e8f0] bg-gradient-to-r from-primary/5 to-primary/10 rounded-t-2xl">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
            <span className="material-symbols-outlined text-white text-[20px]">workspace_premium</span>
          </div>
          <div>
            <h2 className="text-headline-md text-on-surface">Abonnement MonClubHouse</h2>
            <p className="text-body-sm text-on-surface-variant">Choisissez votre formule pour continuer.</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-5">
        {canBuyForClub && (
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Pour qui ?</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setScope('user')}
                className={`px-4 py-3 rounded-lg text-label-lg border transition-colors ${scope === 'user' ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
                Moi seulement
              </button>
              <button onClick={() => setScope('club')}
                className={`px-4 py-3 rounded-lg text-label-lg border transition-colors ${scope === 'club' ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
                Tout le club
              </button>
            </div>
            {scope === 'club' && (
              <p className="text-body-sm text-on-surface-variant">Un seul achat couvre tous les membres de votre club — plus besoin d'abonnement individuel.</p>
            )}
          </div>
        )}

        <div className="space-y-1.5">
          <label className="text-label-md text-on-surface-variant">Formule</label>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setPlan('mensuel')}
              className={`px-4 py-3 rounded-lg text-label-lg border transition-colors ${plan === 'mensuel' ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
              Mensuel
            </button>
            <button onClick={() => setPlan('annuel')}
              className={`px-4 py-3 rounded-lg text-label-lg border transition-colors ${plan === 'annuel' ? 'bg-primary text-white border-primary' : 'border-outline-variant text-on-surface hover:bg-surface-container-low'}`}>
              Annuel
            </button>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-label-md text-on-surface-variant">Code promo (optionnel)</label>
          <input value={promoCode} onChange={e => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Ex : CODE-FCLEDOULIEU"
            className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
        </div>

        {error && <p className="text-body-sm text-error">{error}</p>}

        <button onClick={handleSubscribe} disabled={loading}
          className="w-full py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary/90 disabled:opacity-60 transition-colors flex items-center justify-center gap-2">
          {loading ? 'Redirection vers le paiement…' : 'S\'abonner'}
        </button>

        {variant === 'modal' && onClose && (
          <button onClick={onClose} className="w-full text-body-sm text-on-surface-variant hover:underline">
            Plus tard
          </button>
        )}
      </div>
    </div>
  )

  if (variant === 'page') return content

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      {content}
    </div>
  )
}
