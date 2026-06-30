import { useState, useEffect } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Topbar from './Topbar'
import { getToken } from '../../services/auth'
import api from '../../services/api'
import PhotoUpload from '../PhotoUpload'

type ProfileData = {
  date_naissance: string | null
  poste: string | null
  pied_fort: string | null
  taille: number | null
  telephone: string | null
  avatar: string | null
  role: string
}

const ROLES_REQUIRING_PROFILE = ['joueur', 'parent', 'coach', 'dirigeant']
const PLAYER_ROLES = ['joueur', 'coach']

function isProfileComplete(p: ProfileData): boolean {
  if (!ROLES_REQUIRING_PROFILE.includes(p.role)) return true
  if (!p.date_naissance) return false
  if (PLAYER_ROLES.includes(p.role) && (!p.poste || !p.pied_fort || !p.taille)) return false
  return true
}

function ProfileCompleteModal({ onDone }: { onDone: () => void }) {
  const role = localStorage.getItem('role') || 'joueur'
  const isPlayer = PLAYER_ROLES.includes(role)

  const [dateNaiss, setDateNaiss]   = useState('')
  const [poste, setPoste]           = useState('')
  const [piedFort, setPiedFort]     = useState('')
  const [taille, setTaille]         = useState('')
  const [telephone, setTelephone]   = useState('')
  const [avatar, setAvatar]         = useState<string | null>(null)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')

  const canSubmit = !!dateNaiss && (!isPlayer || (!!poste && !!piedFort && !!taille))

  const handleSave = async () => {
    if (!canSubmit) return
    setSaving(true); setError('')
    try {
      await api.put('/profil', {
        date_naissance: dateNaiss,
        telephone: telephone || null,
        poste: poste || null,
        pied_fort: piedFort || null,
        taille: taille ? parseInt(taille) : null,
        avatar: avatar || undefined,
      })
      onDone()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erreur lors de la sauvegarde.')
    } finally { setSaving(false) }
  }

  return (
    <div className="fixed inset-0 bg-black/70 z-[200] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-[#e8e8f0] bg-gradient-to-r from-primary/5 to-primary/10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-[20px]">person_add</span>
            </div>
            <div>
              <h2 className="text-headline-md text-on-surface">Complétez votre profil</h2>
              <p className="text-body-sm text-on-surface-variant">Bienvenue ! Quelques infos sont nécessaires pour continuer.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Photo */}
          <div className="flex flex-col items-center gap-3 pb-4 border-b border-[#e8e8f0]">
            <PhotoUpload
              type="avatar" shape="circle" size={96}
              currentUrl={avatar || undefined}
              label="Ajouter une photo"
              onSuccess={(url) => setAvatar(url)}
            />
            <p className="text-body-sm text-on-surface-variant">Photo de profil (optionnel)</p>
          </div>

          {/* Date de naissance */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant flex items-center gap-1">
              Date de naissance
              <span className="text-error">*</span>
            </label>
            <input type="date" value={dateNaiss} onChange={e => setDateNaiss(e.target.value)} required
              className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          {/* Téléphone */}
          <div className="space-y-1.5">
            <label className="text-label-md text-on-surface-variant">Téléphone</label>
            <input type="tel" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="+33 6 12 34 56 78"
              className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
          </div>

          {/* Champs spécifiques joueur/coach */}
          {isPlayer && (
            <>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant flex items-center gap-1">
                  Poste
                  <span className="text-error">*</span>
                </label>
                <input type="text" value={poste} onChange={e => setPoste(e.target.value)} placeholder="Gardien, Défenseur, Milieu, Attaquant…"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant flex items-center gap-1">
                    Pied fort
                    <span className="text-error">*</span>
                  </label>
                  <select value={piedFort} onChange={e => setPiedFort(e.target.value)} required
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all bg-white">
                    <option value="">Choisir…</option>
                    <option value="droit">Droit</option>
                    <option value="gauche">Gauche</option>
                    <option value="ambidextre">Ambidextre</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant flex items-center gap-1">
                    Taille (cm)
                    <span className="text-error">*</span>
                  </label>
                  <input type="number" min="100" max="230" value={taille} onChange={e => setTaille(e.target.value)} placeholder="Ex : 178"
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-body-sm text-red-700">
              <span className="material-symbols-outlined text-[16px]">error</span>
              {error}
            </div>
          )}

          <p className="text-body-sm text-on-surface-variant text-center">
            Les champs marqués <span className="text-error">*</span> sont obligatoires
          </p>
        </div>

        <div className="p-6 border-t border-[#e8e8f0]">
          <button onClick={handleSave} disabled={!canSubmit || saving}
            className="w-full flex items-center justify-center gap-2 py-3 bg-primary text-white rounded-xl text-label-lg hover:bg-primary/90 disabled:opacity-40 transition-colors">
            {saving
              ? <span className="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
              : <span className="material-symbols-outlined text-[20px]">check_circle</span>}
            {saving ? 'Enregistrement…' : 'Enregistrer et continuer'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AppLayout() {
  if (!getToken()) return <Navigate to="/login" replace />

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showProfileModal, setShowProfileModal] = useState(false)
  const [profileChecked, setProfileChecked] = useState(false)

  useEffect(() => {
    const role = localStorage.getItem('role') || 'joueur'
    if (!ROLES_REQUIRING_PROFILE.includes(role)) {
      setProfileChecked(true)
      return
    }
    api.get('/profil').then(res => {
      const u = res.data.data
      if (!isProfileComplete({ ...u, role })) {
        setShowProfileModal(true)
      }
    }).catch(() => {}).finally(() => setProfileChecked(true))
  }, [])

  return (
    <div className="min-h-screen bg-[#f4f4f6]">
      {showProfileModal && (
        <ProfileCompleteModal onDone={() => setShowProfileModal(false)} />
      )}

      {/* Overlay mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Topbar onMenuToggle={() => setSidebarOpen(v => !v)} />

      <main className="lg:ml-[260px] px-4 lg:px-6 pt-[64px] pb-4 lg:pb-6 min-h-screen">
        <div className="max-w-[1280px] mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
