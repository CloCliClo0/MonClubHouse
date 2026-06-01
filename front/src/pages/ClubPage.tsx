import { useState } from 'react'

const clubInfo = {
  nom: 'MonClubHouse FC',
  logo: 'MCH',
  description: 'Club de football multisports fondé en 1987, acteur majeur du sport local à Lyon. Nous formons les champions de demain avec des valeurs de fair-play, de dépassement de soi et de convivialité.',
  adresse: '12 Rue du Stade',
  ville: 'Lyon',
  code_postal: '69001',
  telephone: '+33 4 78 12 34 56',
  email: 'contact@monclubhouse.fr',
  site_web: 'www.monclubhouse.fr',
  numero_affiliation: 'FFF-2024-06931',
  couleur_primaire: '#0f5238',
  couleur_secondaire: '#3f6653',
}

const clubStats = [
  { label: 'Membres', value: '1 248', icon: 'groups' },
  { label: 'Équipes', value: '32', icon: 'sports_soccer' },
  { label: 'Terrains', value: '4', icon: 'stadium' },
  { label: 'Saisons', value: '37', icon: 'emoji_events' },
]

const terrains = [
  { id: 1, nom: 'Stade Municipal', type: 'Synthétique', capacite: 500, address: '12 Rue du Stade, Lyon' },
  { id: 2, nom: 'Terrain Annexe A', type: 'Gazon naturel', capacite: 200, address: '14 Rue du Stade, Lyon' },
  { id: 3, nom: 'Terrain Annexe B', type: 'Gazon naturel', capacite: 200, address: '16 Rue du Stade, Lyon' },
  { id: 4, nom: 'Salle Multi-sports', type: 'Salle couverte', capacite: 150, address: '18 Rue du Stade, Lyon' },
]

export default function ClubPage() {
  const [editMode, setEditMode] = useState(false)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Mon Club</h2>
          <p className="text-body-md text-on-surface-variant">Gérez les informations et paramètres de votre club</p>
        </div>
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-label-lg transition-colors ${
            editMode ? 'bg-primary text-white hover:bg-primary-container' : 'border border-outline-variant text-on-surface hover:bg-surface-container-low'
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">{editMode ? 'save' : 'edit'}</span>
          {editMode ? 'Enregistrer' : 'Modifier'}
        </button>
      </div>

      {/* Club Header Card */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden mb-6">
        <div className="h-24" style={{ background: 'linear-gradient(135deg, #0f5238 0%, #3f6653 100%)' }} />
        <div className="px-6 pb-6">
          <div className="flex items-end gap-5 -mt-10 mb-6">
            <div className="w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-lg flex items-center justify-center text-primary font-black text-2xl">
              {clubInfo.logo}
            </div>
            <div className="mb-2">
              <h2 className="text-headline-lg text-on-surface">{clubInfo.nom}</h2>
              <p className="text-body-md text-on-surface-variant">{clubInfo.ville} • {clubInfo.numero_affiliation}</p>
            </div>
          </div>
          <p className="text-body-md text-on-surface-variant">{clubInfo.description}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {clubStats.map((s) => (
          <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-lg p-4 text-center">
            <span className="material-symbols-outlined text-primary text-[32px]">{s.icon}</span>
            <p className="text-display-lg text-primary font-black mt-1">{s.value}</p>
            <p className="text-label-md text-on-surface-variant">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Infos générales */}
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#e8e8f0]">
            <h4 className="text-headline-md">Informations générales</h4>
          </div>
          <div className="p-5 space-y-4">
            {[
              { label: 'Adresse', icon: 'location_on', value: `${clubInfo.adresse}, ${clubInfo.code_postal} ${clubInfo.ville}` },
              { label: 'Téléphone', icon: 'phone', value: clubInfo.telephone },
              { label: 'Email', icon: 'mail', value: clubInfo.email },
              { label: 'Site web', icon: 'public', value: clubInfo.site_web },
              { label: 'N° affiliation', icon: 'badge', value: clubInfo.numero_affiliation },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <span className="material-symbols-outlined text-primary text-[18px]">{item.icon}</span>
                </div>
                <div>
                  <p className="text-label-md text-on-surface-variant">{item.label}</p>
                  {editMode ? (
                    <input
                      defaultValue={item.value}
                      className="text-body-md text-on-surface border-b border-outline-variant focus:outline-none focus:border-primary w-full mt-0.5"
                    />
                  ) : (
                    <p className="text-body-md text-on-surface">{item.value}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Terrains */}
        <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
          <div className="p-5 border-b border-[#e8e8f0] flex justify-between items-center">
            <h4 className="text-headline-md">Terrains & Installations</h4>
            <button className="text-primary text-label-md hover:underline flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Ajouter
            </button>
          </div>
          <div className="divide-y divide-[#e8e8f0]">
            {terrains.map((t) => (
              <div key={t.id} className="p-4 flex items-center gap-4 hover:bg-surface-container-low transition-colors">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-[20px]">stadium</span>
                </div>
                <div className="flex-1">
                  <p className="text-label-lg text-on-surface">{t.nom}</p>
                  <p className="text-body-sm text-on-surface-variant">{t.type} • {t.capacite} places</p>
                </div>
                <button className="text-on-surface-variant hover:text-on-surface transition-colors">
                  <span className="material-symbols-outlined text-[20px]">edit</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
