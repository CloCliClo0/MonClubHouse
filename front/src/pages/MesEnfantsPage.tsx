import { useEffect, useState } from 'react'
import api, { getApiErrorMessage } from '../services/api'
import BirthdateSelect from '../components/BirthdateSelect'

type Child = { id: number; nom: string; prenom: string; avatar?: string }

const NEW_CHILD_SENTINEL = '__nouvel_enfant__'

export default function MesEnfantsPage() {
  const [children, setChildren]     = useState<Child[]>([])
  const [allPlayers, setAllPlayers] = useState<Child[]>([])
  const [loading, setLoading]       = useState(true)

  // Création directe d'un enfant
  const [showCreate, setShowCreate] = useState(false)
  const [cNom, setCNom]             = useState('')
  const [cPrenom, setCPrenom]       = useState('')
  const [cDateNaiss, setCDateNaiss] = useState('')
  const [cPoste, setCPoste]         = useState('')
  const [cPiedFort, setCPiedFort]   = useState('')
  const [cTaille, setCTaille]       = useState('')
  const [creating, setCreating]     = useState(false)
  const [createError, setCreateError] = useState('')

  // Rattacher un enfant déjà inscrit dans le club (compte existant, pas encore lié)
  const [selectedChild, setSelectedChild] = useState<number | null>(null)
  const [linking, setLinking] = useState(false)
  const [linkMsg, setLinkMsg] = useState('')

  // Rejoindre une catégorie via un code d'invitation
  const [joinCode, setJoinCode]             = useState('')
  const [joinChildChoice, setJoinChildChoice] = useState('')
  const [jNom, setJNom]         = useState('')
  const [jPrenom, setJPrenom]   = useState('')
  const [jDateNaiss, setJDateNaiss] = useState('')
  const [joining, setJoining]   = useState(false)
  const [joinMsg, setJoinMsg]   = useState('')

  const load = () => {
    setLoading(true)
    Promise.all([
      api.get('/codes/my-children').then(r => setChildren(r.data.data || [])).catch(() => {}),
      api.get('/codes/club-players').then(r => setAllPlayers(r.data.data || [])).catch(() => {}),
    ]).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const resetCreateForm = () => {
    setCNom(''); setCPrenom(''); setCDateNaiss(''); setCPoste(''); setCPiedFort(''); setCTaille('')
  }

  const createChild = async () => {
    if (!cNom.trim() || !cPrenom.trim()) return
    setCreating(true); setCreateError('')
    try {
      await api.post('/codes/children', {
        nom: cNom.trim(), prenom: cPrenom.trim(), date_naissance: cDateNaiss || null,
        poste: cPoste || null, pied_fort: cPiedFort || null, taille: cTaille ? parseInt(cTaille) : null,
      })
      setShowCreate(false)
      resetCreateForm()
      load()
    } catch (err: any) {
      setCreateError(getApiErrorMessage(err))
    } finally { setCreating(false) }
  }

  const linkChild = async () => {
    if (!selectedChild) return
    setLinking(true); setLinkMsg('')
    try {
      const res = await api.post('/codes/link-child', { child_user_id: selectedChild })
      setLinkMsg(res.data.message)
      setSelectedChild(null)
      load()
    } catch (e: any) {
      setLinkMsg(getApiErrorMessage(e))
    } finally { setLinking(false) }
  }

  const joinCategory = async () => {
    if (!joinCode.trim() || !joinChildChoice) return
    setJoining(true); setJoinMsg('')
    try {
      let childId: number
      if (joinChildChoice === NEW_CHILD_SENTINEL) {
        if (!jNom.trim() || !jPrenom.trim()) {
          setJoinMsg('Nom et prénom du nouvel enfant requis')
          setJoining(false)
          return
        }
        const created = await api.post('/codes/children', { nom: jNom.trim(), prenom: jPrenom.trim(), date_naissance: jDateNaiss || null })
        childId = created.data.data.id
      } else {
        childId = Number(joinChildChoice)
      }
      const res = await api.post('/codes/join-child', { code: joinCode.trim().toUpperCase(), child_user_id: childId })
      setJoinMsg(res.data.message)
      setJoinCode(''); setJoinChildChoice(''); setJNom(''); setJPrenom(''); setJDateNaiss('')
      load()
    } catch (err: any) {
      setJoinMsg(getApiErrorMessage(err))
    } finally { setJoining(false) }
  }

  const unlinkedPlayers = allPlayers.filter(p => !children.find(c => c.id === p.id))

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-headline-lg text-on-surface">Mes enfants</h2>
        <p className="text-body-md text-on-surface-variant mt-1">Gérez les comptes de vos enfants et rattachez-les à leur catégorie.</p>
      </div>

      {/* Liste des enfants */}
      <section className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-[#e8e8f0] flex items-center justify-between">
          <div>
            <h5 className="text-headline-md">Mes enfants rattachés</h5>
            <p className="text-body-sm text-on-surface-variant">Vous recevez leurs convocations et suivez leurs matchs.</p>
          </div>
          <button onClick={() => setShowCreate(v => !v)}
            className="flex items-center gap-1.5 px-3 py-2 bg-primary text-white rounded-lg text-label-md hover:bg-primary-container transition-colors shrink-0">
            <span className="material-symbols-outlined text-[18px]">add</span>
            Ajouter un enfant
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">{[1, 2].map(i => <div key={i} className="h-12 bg-surface-container-low rounded-lg animate-pulse" />)}</div>
        ) : children.length === 0 ? (
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

        {/* Création d'un enfant */}
        {showCreate && (
          <div className="p-6 border-t border-[#e8e8f0] bg-surface-container-lowest space-y-4">
            <p className="text-label-lg text-on-surface">Nouvel enfant</p>
            {createError && (
              <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2.5 rounded-lg text-body-sm">
                <span className="material-symbols-outlined text-[18px]">error</span>{createError}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Prénom *</label>
                <input value={cPrenom} onChange={e => setCPrenom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Nom *</label>
                <input value={cNom} onChange={e => setCNom(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-on-surface-variant">Date de naissance</label>
              <BirthdateSelect value={cDateNaiss} onChange={setCDateNaiss} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Poste (optionnel)</label>
                <input value={cPoste} onChange={e => setCPoste(e.target.value)} placeholder="Défenseur, Gardien…"
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Pied fort (optionnel)</label>
                <select value={cPiedFort} onChange={e => setCPiedFort(e.target.value)}
                  className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary bg-white">
                  <option value="">Non précisé</option>
                  <option value="droit">Droit</option>
                  <option value="gauche">Gauche</option>
                  <option value="ambidextre">Ambidextre</option>
                </select>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-label-md text-on-surface-variant">Taille en cm (optionnel)</label>
              <input value={cTaille} onChange={e => setCTaille(e.target.value)} type="number" min="100" max="230" placeholder="Ex : 145"
                className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={() => { setShowCreate(false); resetCreateForm() }}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
                Annuler
              </button>
              <button onClick={createChild} disabled={!cNom.trim() || !cPrenom.trim() || creating}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
                {creating ? 'Création…' : 'Créer cet enfant'}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Rejoindre une catégorie via code d'invitation */}
      <section className="bg-white border border-[#e8e8f0] rounded-xl p-6">
        <h5 className="text-headline-md mb-1">Rattacher un enfant à une catégorie</h5>
        <p className="text-body-sm text-on-surface-variant mb-4">Saisissez le code d'invitation fourni par le coach ou le club, puis choisissez l'enfant concerné.</p>
        {joinMsg && (
          <div className={`mb-4 px-4 py-3 rounded-lg text-body-sm flex items-center gap-2 ${joinMsg.toLowerCase().includes('erreur') || joinMsg.toLowerCase().includes('requis') || joinMsg.toLowerCase().includes('invalide') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
            <span className="material-symbols-outlined text-[16px]">{joinMsg.toLowerCase().includes('erreur') ? 'error' : 'check_circle'}</span>
            {joinMsg}
          </div>
        )}
        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant">Code d'invitation</label>
            <input value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Ex : U15-A3F2B1"
              className="w-full px-4 py-3 border border-outline-variant rounded-xl text-body-md font-mono tracking-widest text-center focus:outline-none focus:border-primary uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-label-md text-on-surface-variant">Enfant concerné</label>
            <div className="relative">
              <select value={joinChildChoice} onChange={e => setJoinChildChoice(e.target.value)}
                className="w-full appearance-none px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary pr-10 bg-white">
                <option value="">Sélectionner un enfant</option>
                {children.map(c => <option key={c.id} value={c.id}>{c.prenom} {c.nom}</option>)}
                <option value={NEW_CHILD_SENTINEL}>+ Nouvel enfant</option>
              </select>
              <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none">expand_more</span>
            </div>
          </div>
          {joinChildChoice === NEW_CHILD_SENTINEL && (
            <div className="space-y-3 bg-surface-container-lowest rounded-xl p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Prénom *</label>
                  <input value={jPrenom} onChange={e => setJPrenom(e.target.value)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
                <div className="space-y-1">
                  <label className="text-label-md text-on-surface-variant">Nom *</label>
                  <input value={jNom} onChange={e => setJNom(e.target.value)}
                    className="w-full px-4 py-2.5 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-label-md text-on-surface-variant">Date de naissance</label>
                <BirthdateSelect value={jDateNaiss} onChange={setJDateNaiss} />
              </div>
            </div>
          )}
          <button onClick={joinCategory} disabled={!joinCode.trim() || !joinChildChoice || joining}
            className="px-6 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 flex items-center gap-2 transition-colors">
            {joining && <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>}
            <span className="material-symbols-outlined text-[18px]">group_add</span>
            Rattacher à cette catégorie
          </button>
        </div>
      </section>

      {/* Rattacher un compte déjà existant (créé par ailleurs, ex: import CSV) */}
      {unlinkedPlayers.length > 0 && (
        <section className="bg-white border border-[#e8e8f0] rounded-xl p-6">
          <h5 className="text-headline-md mb-1">Rattacher un compte déjà inscrit</h5>
          <p className="text-body-sm text-on-surface-variant mb-4">Un compte joueur de votre club existe déjà pour votre enfant (inscrit par le club) ? Sélectionnez-le ici.</p>
          {linkMsg && (
            <div className={`mb-4 px-4 py-3 rounded-lg text-body-sm flex items-center gap-2 ${linkMsg.toLowerCase().includes('erreur') ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-green-50 border border-green-200 text-green-700'}`}>
              <span className="material-symbols-outlined text-[16px]">{linkMsg.toLowerCase().includes('erreur') ? 'error' : 'check_circle'}</span>
              {linkMsg}
            </div>
          )}
          <div className="space-y-2 max-h-56 overflow-y-auto mb-4">
            {unlinkedPlayers.map(p => (
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
      )}
    </div>
  )
}
