import { useState } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import api from '../services/api'

type Tab = 'mon-profil' | 'securite' | 'notifications'

const notifs = [
  { id: 1, icon: 'payments', title: 'Paiement reçu - Licence Sénior', body: 'Le paiement de M. Lucas Bernard pour la saison 2024/2025 a été validé.', time: 'Il y a 10 minutes', read: false },
  { id: 2, icon: 'event', title: 'Nouvel événement créé', body: 'Tournoi inter-clubs U13 — Prévu le samedi 12 Octobre à 14:00.', time: 'Il y a 2 heures', read: false },
  { id: 3, icon: 'campaign', title: 'Actualité publiée', body: 'L\'article "Résultats de la semaine" est en ligne sur le portail public.', time: 'Hier à 18:30', read: true },
  { id: 4, icon: 'groups', title: 'Nouvelle demande d\'adhésion', body: 'Sophie Martin a soumis son dossier complet pour la section Tennis.', time: '3 Octobre 2024', read: true },
]

export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('mon-profil')
  const [successBanner, setSuccessBanner] = useState(false)

  const tabs: { key: Tab; label: string }[] = [
    { key: 'mon-profil', label: 'Mon Profil' },
    { key: 'securite', label: 'Sécurité' },
    { key: 'notifications', label: 'Notifications' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-display-lg text-on-surface mb-2">Réglages du compte</h2>
        <p className="text-on-surface-variant text-body-lg">
          Gérez vos informations personnelles et vos préférences de sécurité.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-outline-variant mb-6">
        {tabs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-6 py-4 text-label-lg transition-all ${
              tab === key
                ? 'text-primary border-b-2 border-primary'
                : 'text-on-surface-variant hover:text-primary'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Tab: Mon Profil */}
      {tab === 'mon-profil' && (
        <div className="space-y-6">
          <section className="bg-white border border-[#e8e8f0] rounded-lg p-6">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              {/* Avatar card */}
              <div className="w-full md:w-1/3 flex flex-col items-center text-center p-6 bg-surface-container-lowest rounded-xl border border-[#e8e8f0]">
                <div className="mb-4">
                  <PhotoUpload
                    type="avatar"
                    shape="circle"
                    size={144}
                    label="Changer la photo"
                    onSuccess={(url) => api.put('/profil', { avatar: url }).catch(() => {})}
                  />
                </div>
                <h4 className="text-headline-md">Jean-Marc Durand</h4>
                <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-md">
                  Administrateur Club
                </span>
                <div className="mt-4 flex flex-col items-center gap-2 text-on-surface-variant">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">mail</span>
                    <span className="text-body-sm">jm.durand@mch-sports.fr</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px]">location_on</span>
                    <span className="text-body-sm">Lyon, France</span>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="flex-1">
                <h5 className="text-headline-md mb-6">Informations personnelles</h5>
                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-label-md text-on-surface-variant">Prénom</label>
                      <input
                        defaultValue="Jean-Marc"
                        className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label-md text-on-surface-variant">Nom</label>
                      <input
                        defaultValue="Durand"
                        className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md"
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Numéro de téléphone</label>
                    <input
                      defaultValue="+33 6 12 34 56 78"
                      type="tel"
                      className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-label-md text-on-surface-variant">Date de naissance</label>
                    <input
                      defaultValue="1982-05-14"
                      type="date"
                      className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md"
                    />
                  </div>
                  <div className="pt-4 border-t border-[#e8e8f0] mt-6">
                    <h6 className="text-label-lg text-on-surface mb-4">Préférences de contact</h6>
                    <div className="space-y-3">
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input defaultChecked type="checkbox" className="w-5 h-5 rounded border-outline-variant accent-primary" />
                        <span className="text-body-md text-on-surface-variant">Recevoir les actualités du club par email</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <input defaultChecked type="checkbox" className="w-5 h-5 rounded border-outline-variant accent-primary" />
                        <span className="text-body-md text-on-surface-variant">Alertes de calendrier par SMS</span>
                      </label>
                    </div>
                  </div>
                  <div className="pt-6 flex justify-end gap-3">
                    <button type="button" className="px-6 py-2.5 border border-[#e8e8f0] rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
                      Annuler
                    </button>
                    <button type="submit" className="px-6 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:brightness-110 active:scale-95 transition-all">
                      Enregistrer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </section>
        </div>
      )}

      {/* Tab: Sécurité */}
      {tab === 'securite' && (
        <div className="space-y-6">
          {successBanner && (
            <div className="flex items-center gap-4 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg">
              <span className="material-symbols-outlined text-green-700">check_circle</span>
              <p className="text-body-md">Votre mot de passe a été mis à jour avec succès.</p>
              <button onClick={() => setSuccessBanner(false)} className="ml-auto">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          )}
          <section className="bg-white border border-[#e8e8f0] rounded-lg p-6 max-w-2xl">
            <div className="mb-8">
              <h5 className="text-headline-md mb-2">Changer le mot de passe</h5>
              <p className="text-on-surface-variant text-body-md">
                Assurez-vous d'utiliser un mot de passe fort d'au moins 12 caractères.
              </p>
            </div>
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault()
                setSuccessBanner(true)
              }}
            >
              {['Mot de passe actuel', 'Nouveau mot de passe', 'Confirmer le nouveau mot de passe'].map((label) => (
                <div key={label} className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">{label}</label>
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md"
                  />
                </div>
              ))}
              <div className="pt-6 flex justify-end">
                <button type="submit" className="px-8 py-3 bg-primary text-white rounded-lg text-label-lg hover:brightness-110 active:scale-95 transition-all">
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          </section>

          <section className="bg-white border border-[#e8e8f0] rounded-lg p-6 max-w-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-label-lg text-on-surface">Double Authentification (2FA)</h5>
                <p className="text-body-sm text-on-surface-variant">
                  Ajoutez une couche de sécurité supplémentaire à votre compte.
                </p>
              </div>
              <Toggle />
            </div>
          </section>
        </div>
      )}

      {/* Tab: Notifications */}
      {tab === 'notifications' && (
        <div className="space-y-6">
          <section className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#e8e8f0] flex justify-between items-center">
              <div>
                <h5 className="text-headline-md">Mes notifications</h5>
                <p className="text-on-surface-variant text-body-sm">
                  Consultez l'historique de vos alertes et messages club.
                </p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/5 rounded-lg text-label-md transition-colors">
                <span className="material-symbols-outlined text-[18px]">done_all</span>
                Tout marquer lu
              </button>
            </div>
            <div className="divide-y divide-[#e8e8f0]">
              {notifs.map((n) => (
                <div
                  key={n.id}
                  className={`p-6 flex gap-4 transition-colors cursor-pointer ${
                    !n.read ? 'bg-[#f0f7f4] hover:bg-primary/5' : 'bg-white hover:bg-surface-container-low opacity-80'
                  }`}
                >
                  <div
                    className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                      !n.read ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    <span className="material-symbols-outlined">{n.icon}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <h6 className="text-label-lg text-on-surface">{n.title}</h6>
                      {!n.read ? (
                        <span className="text-xs font-semibold text-primary uppercase tracking-wider">Nouveau</span>
                      ) : (
                        <span className="text-xs font-medium text-on-surface-variant">Lu</span>
                      )}
                    </div>
                    <p className="text-on-surface-variant text-body-md mb-2">{n.body}</p>
                    <p className="text-[11px] text-on-surface-variant/60 font-medium">{n.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="p-4 bg-surface-container-low flex justify-center">
              <button className="text-on-surface-variant text-label-md hover:text-primary transition-colors">
                Afficher les notifications plus anciennes
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

function Toggle() {
  const [on, setOn] = useState(false)
  return (
    <button
      onClick={() => setOn(!on)}
      className={`relative inline-block w-12 h-6 rounded-full transition-colors ${on ? 'bg-primary' : 'bg-surface-container-highest'}`}
    >
      <div
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-all ${on ? 'left-7' : 'left-1'}`}
      />
    </button>
  )
}
