import { useState, useEffect } from 'react'
import PhotoUpload from '../components/PhotoUpload'
import api from '../services/api'

type Tab = 'mon-profil' | 'securite' | 'notifications' | 'mes-enfants'
type Child = { id: number; nom: string; prenom: string; avatar?: string }
type UserData = {
  id: number; nom: string; prenom: string; email: string
  telephone: string | null; date_naissance: string | null
  role: string; avatar: string | null
  notif_email: boolean; notif_push: boolean
}
type Notif = { id: number; titre: string; contenu: string; type: string; lu: boolean; created_at: string }

const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Super Administrateur', admin: 'Administrateur',
  dirigeant: 'Dirigeant', coach: 'Coach',
  joueur: 'Joueur', parent: 'Parent', visiteur: 'Visiteur',
}

export default function ProfilePage() {
  const [tab, setTab]   = useState<Tab>('mon-profil')
  const role = localStorage.getItem('role') || 'joueur'

  // User data + form
  const [user, setUser]     = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [prenom, setPrenom]   = useState('')
  const [nom, setNom]         = useState('')
  const [telephone, setTel]   = useState('')
  const [dateNaiss, setDate]  = useState('')
  const [poste, setPoste]     = useState('')
  const [piedFort, setPiedFort] = useState('')
  const [taille, setTaille]   = useState('')
  const [notifEmail, setNotifEmail] = useState(true)
  const [notifPush, setNotifPush]   = useState(true)
  const [saving, setSaving]   = useState(false)

  // Password
  const [oldPwd, setOldPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confPwd, setConf]  = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

  // Notifications réelles
  const [notifs, setNotifs]     = useState<Notif[]>([])
  const [notifsLoad, setNotifsLoad] = useState(false)

  // Parent-enfants
  const [children, setChildren]     = useState<Child[]>([])
  const [allPlayers, setAllPlayers] = useState<Child[]>([])
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  const [linking, setLinking] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')

  // Feedback global
  const [success, setSuccess] = useState('')
  const [error, setError]     = useState('')

  const flash = (msg: string, isErr = false) => {
    if (isErr) { setError(msg); setSuccess('') }
    else       { setSuccess(msg); setError('') }
    setTimeout(() => { setSuccess(''); setError('') }, 4000)
  }

  const loadUser = async () => {
    try {
      const res = await api.get('/profil')
      const u: UserData = res.data.data
      setUser(u)
      setPrenom(u.prenom || '')
      setNom(u.nom || '')
      setTel(u.telephone || '')
      setPoste((u as any).poste || '')
      setPiedFort((u as any).pied_fort || '')
      setTaille((u as any).taille ? String((u as any).taille) : '')
      setDate(u.date_naissance || '')
      setNotifEmail(u.notif_email !== false)
      setNotifPush(u.notif_push !== false)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadUser() }, [])

  useEffect(() => {
    if (tab === 'notifications') {
      setNotifsLoad(true)
      api.get('/profil/notifications?limit=20')
        .then(r => {
          const d = r.data.data
          setNotifs(Array.isArray(d) ? d : (d?.notifications ?? []))
        })
        .catch(() => {})
        .finally(() => setNotifsLoad(false))
    }
    if (tab === 'mes-enfants' && role === 'parent') {
      api.get('/codes/my-children').then(r => setChildren(r.data.data || [])).catch(() => {})
      api.get('/codes/club-players').then(r => setAllPlayers(r.data.data || [])).catch(() => {})
    }
  }, [tab])

  const handleSaveProfil = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put('/profil', { prenom, nom, telephone: telephone || null, date_naissance: dateNaiss || null, poste: poste || null, pied_fort: piedFort || null, taille: taille ? parseInt(taille) : null, notif_email: notifEmail, notif_push: notifPush })
      localStorage.setItem('prenom', prenom)
      await loadUser()
      flash('Profil mis à jour avec succès.')
    } catch (err: any) {
      flash(err.response?.data?.message || 'Erreur lors de la sauvegarde.', true)
    } finally { setSaving(false) }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (newPwd.length < 8)  { flash('Nouveau mot de passe trop court (8 min.).', true); return }
    if (newPwd !== confPwd) { flash('Les mots de passe ne correspondent pas.', true); return }
    setPwdSaving(true)
    try {
      await api.put('/profil/password', { ancien_password: oldPwd, nouveau_password: newPwd })
      setOldPwd(''); setNewPwd(''); setConf('')
      flash('Mot de passe mis à jour.')
    } catch (err: any) {
      flash(err.response?.data?.message || 'Ancien mot de passe incorrect.', true)
    } finally { setPwdSaving(false) }
  }

  const linkChild = async () => {
    if (!selectedChild) return
    setLinking(true); setLinkMsg('')
    try {
      const res = await api.post('/codes/link-child', { child_user_id: selectedChild })
      setLinkMsg(res.data.message)
      api.get('/codes/my-children').then(r => setChildren(r.data.data || [])).catch(() => {})
      setSelectedChild(null)
    } catch (e: any) {
      setLinkMsg(e.response?.data?.message || 'Erreur')
    } finally { setLinking(false) }
  }

  const markAllRead = async () => {
    try {
      await api.patch('/profil/notifications/toutes-lues')
      setNotifs(prev => prev.map(n => ({ ...n, lu: true })))
    } catch {}
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'mon-profil', label: 'Mon Profil' },
    ...(role === 'parent' ? [{ key: 'mes-enfants' as Tab, label: 'Mes enfants' }] : []),
    { key: 'securite', label: 'Sécurité' },
    { key: 'notifications', label: 'Notifications' },
  ]

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-display-lg text-on-surface mb-2">Réglages du compte</h2>
        <p className="text-on-surface-variant text-body-lg">Gérez vos informations personnelles et vos préférences.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center border-b border-outline-variant mb-6">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => { setTab(key); setError(''); setSuccess('') }}
            className={`px-6 py-4 text-label-lg transition-all ${
              tab === key ? 'text-primary border-b-2 border-primary' : 'text-on-surface-variant hover:text-primary'
            }`}>
            {label}
          </button>
        ))}
      </div>

      {/* Feedback */}
      {success && (
        <div className="mb-4 flex items-center gap-3 bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg text-body-md">
          <span className="material-symbols-outlined text-green-600">check_circle</span>
          {success}
        </div>
      )}
      {error && (
        <div className="mb-4 flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-body-md">
          <span className="material-symbols-outlined">error</span>
          {error}
        </div>
      )}

      {/* ── Mon Profil ──────────────────────────────────────────────────── */}
      {tab === 'mon-profil' && (
        <div className="space-y-6">
          <section className="bg-white border border-[#e8e8f0] rounded-lg p-6">
            {loading ? (
              <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
            ) : (
              <div className="flex flex-col md:flex-row gap-8 items-start">
                {/* Avatar */}
                <div className="w-full md:w-1/3 flex flex-col items-center text-center p-6 bg-surface-container-lowest rounded-xl border border-[#e8e8f0]">
                  <div className="mb-4">
                    <PhotoUpload
                      type="avatar" shape="circle" size={144}
                      currentUrl={user?.avatar || undefined}
                      label="Changer la photo"
                      onSuccess={async (url) => {
                        await api.put('/profil', { avatar: url }).catch(() => {})
                        await loadUser()
                      }}
                    />
                  </div>
                  <h4 className="text-headline-md">{user?.prenom} {user?.nom}</h4>
                  <span className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-secondary-container text-on-secondary-container text-label-md">
                    {ROLE_LABELS[user?.role || ''] || user?.role}
                  </span>
                  <div className="mt-4 flex flex-col items-center gap-2 text-on-surface-variant">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-[16px]">mail</span>
                      <span className="text-body-sm">{user?.email}</span>
                    </div>
                    {user?.telephone && (
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-[16px]">phone</span>
                        <span className="text-body-sm">{user.telephone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Form */}
                <div className="flex-1">
                  <h5 className="text-headline-md mb-6">Informations personnelles</h5>
                  <form className="space-y-4" onSubmit={handleSaveProfil}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-label-md text-on-surface-variant">Prénom</label>
                        <input value={prenom} onChange={e => setPrenom(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-md text-on-surface-variant">Nom</label>
                        <input value={nom} onChange={e => setNom(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-label-md text-on-surface-variant">Téléphone</label>
                      <input value={telephone} onChange={e => setTel(e.target.value)} type="tel" placeholder="+33 6 12 34 56 78"
                        className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-label-md text-on-surface-variant">Date de naissance</label>
                      <input value={dateNaiss} onChange={e => setDate(e.target.value)} type="date"
                        className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-label-md text-on-surface-variant">Poste</label>
                        <input value={poste} onChange={e => setPoste(e.target.value)} type="text" placeholder="Défenseur, Gardien…"
                          className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-label-md text-on-surface-variant">Pied fort</label>
                        <select value={piedFort} onChange={e => setPiedFort(e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary transition-all text-body-md">
                          <option value="">Non précisé</option>
                          <option value="droit">Droit</option>
                          <option value="gauche">Gauche</option>
                          <option value="ambidextre">Ambidextre</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-label-md text-on-surface-variant">Taille (cm)</label>
                      <input value={taille} onChange={e => setTaille(e.target.value)} type="number" min="100" max="230" placeholder="Ex : 178"
                        className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
                    </div>
                    <div className="pt-4 border-t border-[#e8e8f0] mt-2">
                      <h6 className="text-label-lg text-on-surface mb-3">Préférences de contact</h6>
                      <div className="space-y-2">
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={notifEmail} onChange={e => setNotifEmail(e.target.checked)}
                            className="w-5 h-5 rounded border-outline-variant accent-primary" />
                          <span className="text-body-md text-on-surface-variant">Recevoir les actualités du club par email</span>
                        </label>
                        <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" checked={notifPush} onChange={e => setNotifPush(e.target.checked)}
                            className="w-5 h-5 rounded border-outline-variant accent-primary" />
                          <span className="text-body-md text-on-surface-variant">Alertes de calendrier (SMS / push)</span>
                        </label>
                      </div>
                    </div>
                    <div className="pt-6 flex justify-end gap-3">
                      <button type="button" onClick={loadUser}
                        className="px-6 py-2.5 border border-[#e8e8f0] rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
                        Annuler
                      </button>
                      <button type="submit" disabled={saving}
                        className="px-6 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                        {saving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                        Enregistrer
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Mes enfants (parents) ────────────────────────────────────────── */}
      {tab === 'mes-enfants' && (
        <div className="space-y-6 max-w-2xl">
          <section className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e8e8f0]">
              <h5 className="text-headline-md">Mes enfants rattachés</h5>
              <p className="text-body-sm text-on-surface-variant">Vous recevez leurs convocations et suivez leurs matchs.</p>
            </div>
            {children.length === 0 ? (
              <div className="py-10 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">child_care</span>
                <p className="text-body-md">Aucun enfant rattaché pour le moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {children.map(c => (
                  <div key={c.id} className="px-6 py-3 flex items-center gap-3">
                    {c.avatar
                      ? <img src={c.avatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                      : <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center font-bold text-white text-sm">{c.prenom?.[0]}{c.nom?.[0]}</div>
                    }
                    <p className="text-label-lg text-on-surface">{c.prenom} {c.nom}</p>
                    <span className="ml-auto px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-label-md">Joueur</span>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="bg-white border border-[#e8e8f0] rounded-xl p-6">
            <h5 className="text-headline-md mb-1">Rattacher un enfant</h5>
            <p className="text-body-sm text-on-surface-variant mb-4">Sélectionnez le joueur inscrit dans votre club.</p>
            {linkMsg && (
              <div className={`mb-4 px-4 py-3 rounded-lg text-body-sm flex items-center gap-2 ${linkMsg.toLowerCase().includes('erreur') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
                <span className="material-symbols-outlined text-[16px]">{linkMsg.toLowerCase().includes('erreur') ? 'error' : 'check_circle'}</span>
                {linkMsg}
              </div>
            )}
            <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
              {allPlayers.filter(p => !children.find(c => c.id === p.id)).map(p => (
                <button key={p.id} onClick={() => setSelectedChild(p.id)}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                    selectedChild === p.id ? 'border-primary bg-primary/5' : 'border-[#e8e8f0] hover:border-primary/40'
                  }`}>
                  {p.avatar
                    ? <img src={p.avatar} className="w-8 h-8 rounded-full object-cover" alt="" />
                    : <div className="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center text-on-surface-variant text-xs font-bold">{p.prenom?.[0]}{p.nom?.[0]}</div>
                  }
                  <span className="text-label-lg text-on-surface">{p.prenom} {p.nom}</span>
                  {selectedChild === p.id && <span className="ml-auto material-symbols-outlined text-primary text-[20px]">check_circle</span>}
                </button>
              ))}
            </div>
            <button onClick={linkChild} disabled={!selectedChild || linking}
              className="px-6 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:brightness-110 disabled:opacity-50 flex items-center gap-2 transition-all">
              {linking && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
              <span className="material-symbols-outlined text-[18px]">link</span>
              Rattacher cet enfant
            </button>
          </section>
        </div>
      )}

      {/* ── Sécurité ────────────────────────────────────────────────────── */}
      {tab === 'securite' && (
        <div className="space-y-6">
          <section className="bg-white border border-[#e8e8f0] rounded-lg p-6 max-w-2xl">
            <div className="mb-6">
              <h5 className="text-headline-md mb-1">Changer le mot de passe</h5>
              <p className="text-on-surface-variant text-body-md">Utilisez un mot de passe fort d'au moins 8 caractères.</p>
            </div>
            <form className="space-y-4" onSubmit={handleChangePassword}>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Mot de passe actuel</label>
                <input type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} placeholder="••••••••••••" required
                  className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Nouveau mot de passe</label>
                <input type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} placeholder="••••••••••••" required
                  className="w-full px-4 py-3 bg-white border border-[#e8e8f0] rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-body-md" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Confirmer le nouveau mot de passe</label>
                <input type="password" value={confPwd} onChange={e => setConf(e.target.value)} placeholder="••••••••••••" required
                  className={`w-full px-4 py-3 bg-white border rounded-lg focus:outline-none focus:ring-2 transition-all text-body-md ${
                    confPwd && confPwd !== newPwd ? 'border-error focus:border-error focus:ring-error/20' : 'border-[#e8e8f0] focus:border-primary focus:ring-primary/20'
                  }`} />
                {confPwd && confPwd !== newPwd && <p className="text-error text-body-sm">Les mots de passe ne correspondent pas</p>}
              </div>
              <div className="pt-4 flex justify-end">
                <button type="submit" disabled={pwdSaving || !oldPwd || !newPwd || !confPwd}
                  className="px-8 py-3 bg-primary text-white rounded-lg text-label-lg hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2">
                  {pwdSaving && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
                  Mettre à jour le mot de passe
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* ── Notifications ───────────────────────────────────────────────── */}
      {tab === 'notifications' && (
        <div className="space-y-6">
          <section className="bg-white border border-[#e8e8f0] rounded-lg overflow-hidden">
            <div className="p-6 border-b border-[#e8e8f0] flex justify-between items-center">
              <div>
                <h5 className="text-headline-md">Mes notifications</h5>
                <p className="text-on-surface-variant text-body-sm">Alertes et messages de votre club.</p>
              </div>
              {notifs.some(n => !n.lu) && (
                <button onClick={markAllRead}
                  className="flex items-center gap-2 px-4 py-2 text-primary hover:bg-primary/5 rounded-lg text-label-md transition-colors">
                  <span className="material-symbols-outlined text-[18px]">done_all</span>
                  Tout marquer lu
                </button>
              )}
            </div>
            {notifsLoad ? (
              <div className="p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-surface-container-low rounded-xl animate-pulse" />)}</div>
            ) : notifs.length === 0 ? (
              <div className="py-16 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">notifications_off</span>
                <p className="text-body-md">Aucune notification pour le moment.</p>
              </div>
            ) : (
              <div className="divide-y divide-[#e8e8f0]">
                {notifs.map(n => (
                  <div key={n.id}
                    className={`p-5 flex gap-4 transition-colors cursor-pointer ${!n.lu ? 'bg-[#f0f7f4] hover:bg-primary/5' : 'bg-white hover:bg-surface-container-low opacity-80'}`}>
                    <div className={`shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${!n.lu ? 'bg-primary-fixed text-primary' : 'bg-surface-container text-on-surface-variant'}`}>
                      <span className="material-symbols-outlined">notifications</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h6 className="text-label-lg text-on-surface">{n.titre}</h6>
                        {!n.lu ? (
                          <span className="text-xs font-semibold text-primary uppercase tracking-wider">Nouveau</span>
                        ) : (
                          <span className="text-xs font-medium text-on-surface-variant">Lu</span>
                        )}
                      </div>
                      <p className="text-on-surface-variant text-body-md mb-1">{n.contenu}</p>
                      <p className="text-[11px] text-on-surface-variant/60 font-medium">
                        {new Date(n.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  )
}
