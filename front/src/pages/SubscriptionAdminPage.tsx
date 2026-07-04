import { useEffect, useState } from 'react'
import api from '../services/api'

type SubRow = {
  id: number
  owner_type: 'club' | 'user'
  owner: { id: number; nom: string; prenom?: string; email?: string } | null
  plan: string
  statut: string
  promo_code: string | null
  current_period_end: string | null
  createdAt: string
}

const STATUT_STYLE: Record<string, string> = {
  actif: 'bg-green-100 text-green-700',
  expire: 'bg-gray-100 text-gray-500',
  annule: 'bg-red-100 text-red-700',
  impaye: 'bg-orange-100 text-orange-700',
}

export default function SubscriptionAdminPage() {
  const role = localStorage.getItem('role')
  if (role !== 'superadmin') return (
    <div className="py-20 text-center text-on-surface-variant">
      <span className="material-symbols-outlined text-[56px] block mb-3 opacity-30">lock</span>
      <p className="text-headline-md">Accès réservé au Super Administrateur</p>
    </div>
  )

  const [subs, setSubs]       = useState<SubRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/subscription/admin').then(r => setSubs(r.data.data || [])).catch(() => setSubs([])).finally(() => setLoading(false))
  }, [])

  const actifs = subs.filter(s => s.statut === 'actif')
  const clubCount = actifs.filter(s => s.owner_type === 'club').length
  const userCount = actifs.filter(s => s.owner_type === 'user').length

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-headline-lg text-on-surface flex items-center gap-2">
          <span className="material-symbols-outlined text-[28px] text-primary">workspace_premium</span>
          Gestion des abonnements
        </h2>
        <p className="text-body-md text-on-surface-variant mt-1">Vue globale de tous les abonnements clubs et individuels.</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-on-surface">{actifs.length}</p>
          <p className="text-on-surface-variant text-label-md mt-0.5">Abonnements actifs</p>
        </div>
        <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{clubCount}</p>
          <p className="text-on-surface-variant text-label-md mt-0.5">Clubs</p>
        </div>
        <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-primary">{userCount}</p>
          <p className="text-on-surface-variant text-label-md mt-0.5">Individuels</p>
        </div>
      </div>

      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        {loading ? (
          <div className="p-8 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}
          </div>
        ) : subs.length === 0 ? (
          <div className="py-16 text-center text-on-surface-variant">
            <span className="material-symbols-outlined text-[48px] opacity-20 block mb-3">workspace_premium</span>
            <p className="text-body-md">Aucun abonnement pour le moment.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-body-sm">
              <thead>
                <tr className="bg-surface-container-low text-left">
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Titulaire</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Type</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Formule</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Code promo</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Échéance</th>
                  <th className="px-4 py-3 text-label-md text-on-surface-variant">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e8e8f0]">
                {subs.map(s => (
                  <tr key={s.id}>
                    <td className="px-4 py-3 text-on-surface">
                      {s.owner
                        ? (s.owner_type === 'club' ? s.owner.nom : `${s.owner.prenom} ${s.owner.nom}`)
                        : '—'}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant capitalize">{s.owner_type === 'club' ? 'Club' : 'Individuel'}</td>
                    <td className="px-4 py-3 text-on-surface-variant capitalize">{s.plan}</td>
                    <td className="px-4 py-3 text-on-surface-variant font-mono">{s.promo_code || '—'}</td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {s.current_period_end ? new Date(s.current_period_end).toLocaleDateString('fr-FR') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 rounded-full text-label-md ${STATUT_STYLE[s.statut] || 'bg-gray-100 text-gray-500'}`}>
                        {s.statut}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
