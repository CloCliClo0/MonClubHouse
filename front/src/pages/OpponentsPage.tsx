import { useState } from 'react'

type Category = 'Seniors' | 'U19' | 'U17' | 'U15' | 'U13' | 'U11' | 'U9' | 'U7' | 'Féminines'

type Opponent = {
  id: number
  nom: string
  categorie: Category
  ville: string
  contact: string
  telephone: string
  couleur: string
  matchsJoues: number
  victoires: number
  nuls: number
  defaites: number
}

const CATEGORIES: Category[] = ['Seniors', 'U19', 'U17', 'U15', 'U13', 'U11', 'U9', 'U7', 'Féminines']

const INITIAL_OPPONENTS: Opponent[] = [
  { id: 1,  nom: 'Red Star FC',        categorie: 'Seniors',  ville: 'Paris',       contact: 'jean@redstar.fr',  telephone: '06 12 34 56 78', couleur: '#dc2626', matchsJoues: 6, victoires: 4, nuls: 1, defaites: 1 },
  { id: 2,  nom: 'AJ Lyon',            categorie: 'Seniors',  ville: 'Lyon',        contact: '',                  telephone: '04 78 00 00 00', couleur: '#d97706', matchsJoues: 4, victoires: 3, nuls: 0, defaites: 1 },
  { id: 3,  nom: 'FC Villeurbanne',    categorie: 'Seniors',  ville: 'Villeurbanne',contact: '',                  telephone: '',               couleur: '#7c3aed', matchsJoues: 3, victoires: 1, nuls: 1, defaites: 1 },
  { id: 4,  nom: 'Olympique Givors',   categorie: 'Seniors',  ville: 'Givors',      contact: '',                  telephone: '',               couleur: '#0891b2', matchsJoues: 2, victoires: 2, nuls: 0, defaites: 0 },
  { id: 5,  nom: 'Red Star U19',       categorie: 'U19',      ville: 'Paris',       contact: '',                  telephone: '',               couleur: '#dc2626', matchsJoues: 3, victoires: 2, nuls: 1, defaites: 0 },
  { id: 6,  nom: 'FC Lyon U19',        categorie: 'U19',      ville: 'Lyon',        contact: '',                  telephone: '',               couleur: '#d97706', matchsJoues: 2, victoires: 1, nuls: 0, defaites: 1 },
  { id: 7,  nom: 'ES Décines U15',     categorie: 'U15',      ville: 'Décines',     contact: '',                  telephone: '',               couleur: '#16a34a', matchsJoues: 4, victoires: 3, nuls: 0, defaites: 1 },
  { id: 8,  nom: 'FC Bron U13',        categorie: 'U13',      ville: 'Bron',        contact: '',                  telephone: '',               couleur: '#0369a1', matchsJoues: 5, victoires: 4, nuls: 1, defaites: 0 },
]

const COULEURS = ['#dc2626','#d97706','#16a34a','#0369a1','#7c3aed','#db2777','#0891b2','#64748b','#1b4332','#92400e']

type ModalState = { open: false } | { open: true; editing: Opponent | null }

const BLANK: Omit<Opponent, 'id' | 'matchsJoues' | 'victoires' | 'nuls' | 'defaites'> = {
  nom: '', categorie: 'Seniors', ville: '', contact: '', telephone: '', couleur: '#1b4332',
}

export default function OpponentsPage() {
  const [opponents, setOpponents] = useState<Opponent[]>(INITIAL_OPPONENTS)
  const [activeCategory, setActiveCategory] = useState<Category | 'Tous'>('Tous')
  const [search, setSearch]                 = useState('')
  const [modal, setModal]                   = useState<ModalState>({ open: false })
  const [form, setForm]                     = useState({ ...BLANK })
  const [deleteConfirm, setDeleteConfirm]  = useState<number | null>(null)

  const filtered = opponents.filter(o => {
    const matchCat  = activeCategory === 'Tous' || o.categorie === activeCategory
    const matchSearch = o.nom.toLowerCase().includes(search.toLowerCase()) || o.ville.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const openAdd = () => {
    setForm({ ...BLANK })
    setModal({ open: true, editing: null })
  }

  const openEdit = (o: Opponent) => {
    setForm({ nom: o.nom, categorie: o.categorie, ville: o.ville, contact: o.contact, telephone: o.telephone, couleur: o.couleur })
    setModal({ open: true, editing: o })
  }

  const handleSave = () => {
    if (!form.nom.trim()) return
    if (modal.open && modal.editing) {
      setOpponents(prev => prev.map(o => o.id === modal.editing!.id ? { ...o, ...form } : o))
    } else {
      setOpponents(prev => [...prev, {
        id: Date.now(), ...form,
        matchsJoues: 0, victoires: 0, nuls: 0, defaites: 0,
      }])
    }
    setModal({ open: false })
  }

  const handleDelete = (id: number) => {
    setOpponents(prev => prev.filter(o => o.id !== id))
    setDeleteConfirm(null)
  }

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = opponents.filter(o => o.categorie === cat).length
    return acc
  }, {} as Record<string, number>)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-headline-lg text-on-surface">Adversaires</h2>
          <p className="text-body-md text-on-surface-variant">Gérez les clubs adversaires par catégorie</p>
        </div>
        <button onClick={openAdd}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg text-label-lg hover:bg-primary-container transition-colors">
          <span className="material-symbols-outlined text-[20px]">add</span>
          Ajouter un adversaire
        </button>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total adversaires', value: opponents.length,                              icon: 'groups',         color: 'text-primary',        bg: 'bg-primary/10'   },
          { label: 'Catégories',        value: CATEGORIES.filter(c => categoryCounts[c] > 0).length, icon: 'category', color: 'text-blue-600',  bg: 'bg-blue-50'      },
          { label: 'Matchs joués',      value: opponents.reduce((s, o) => s + o.matchsJoues, 0),     icon: 'sports_soccer', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Bilan (V)',         value: opponents.reduce((s, o) => s + o.victoires, 0),        icon: 'emoji_events',  color: 'text-green-600',  bg: 'bg-green-50'  },
        ].map(s => (
          <div key={s.label} className="bg-white border border-[#e8e8f0] rounded-xl p-4 flex items-center gap-3">
            <div className={`${s.bg} p-3 rounded-xl`}>
              <span className={`material-symbols-outlined ${s.color}`}>{s.icon}</span>
            </div>
            <div>
              <p className={`text-headline-md font-black ${s.color}`}>{s.value}</p>
              <p className="text-label-md text-on-surface-variant">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-5 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">search</span>
          <input value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all"
            placeholder="Rechercher un club, une ville…" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['Tous', ...CATEGORIES] as const).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat as any)}
              className={`px-3 py-1.5 rounded-full text-label-md transition-all flex items-center gap-1 ${
                activeCategory === cat ? 'bg-primary text-white' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container border border-outline-variant'
              }`}>
              {cat}
              {cat !== 'Tous' && categoryCounts[cat] > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-white/20' : 'bg-surface-container'}`}>
                  {categoryCounts[cat]}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Grille adversaires */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(o => {
          const pct = o.matchsJoues ? Math.round((o.victoires / o.matchsJoues) * 100) : 0
          return (
            <div key={o.id} className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden hover:shadow-md transition-shadow group">
              <div className="h-2" style={{ backgroundColor: o.couleur }} />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-black text-sm" style={{ backgroundColor: o.couleur }}>
                      {o.nom.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-label-lg text-on-surface font-bold">{o.nom}</h3>
                      {o.ville && <p className="text-body-sm text-on-surface-variant">{o.ville}</p>}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant text-[11px]">
                    {o.categorie}
                  </span>
                </div>

                {o.matchsJoues > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-label-md text-on-surface-variant mb-1">
                      <span>{o.matchsJoues} match{o.matchsJoues > 1 ? 's' : ''}</span>
                      <span className="text-primary font-semibold">{pct}% victoires</span>
                    </div>
                    <div className="flex gap-1 h-2 rounded-full overflow-hidden">
                      <div className="bg-green-500 rounded-full" style={{ width: `${(o.victoires / o.matchsJoues) * 100}%` }} />
                      <div className="bg-orange-400 rounded-full" style={{ width: `${(o.nuls / o.matchsJoues) * 100}%` }} />
                      <div className="bg-red-500 rounded-full flex-1" />
                    </div>
                    <div className="flex gap-4 mt-2 text-body-sm">
                      <span className="text-green-600 font-semibold">{o.victoires}V</span>
                      <span className="text-orange-500 font-semibold">{o.nuls}N</span>
                      <span className="text-red-600 font-semibold">{o.defaites}D</span>
                    </div>
                  </div>
                )}

                {(o.contact || o.telephone) && (
                  <div className="text-body-sm text-on-surface-variant space-y-1 border-t border-[#e8e8f0] pt-3 mb-3">
                    {o.telephone && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">phone</span>
                        {o.telephone}
                      </div>
                    )}
                    {o.contact && (
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-[14px]">mail</span>
                        {o.contact}
                      </div>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-3 border-t border-[#e8e8f0]">
                  <button onClick={() => openEdit(o)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-outline-variant rounded-lg text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
                    <span className="material-symbols-outlined text-[16px]">edit</span>
                    Modifier
                  </button>
                  <button onClick={() => setDeleteConfirm(o.id)}
                    className="w-9 h-9 flex items-center justify-center border border-outline-variant rounded-lg text-on-surface-variant hover:bg-red-50 hover:text-error hover:border-error/30 transition-colors">
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16 text-on-surface-variant">
          <span className="material-symbols-outlined text-[48px] mb-3 block">groups</span>
          <p className="text-body-lg">Aucun adversaire trouvé</p>
        </div>
      )}

      {/* ── Modal Ajouter / Modifier ──────────────────────────────── */}
      {modal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">{modal.editing ? 'Modifier l\'adversaire' : 'Ajouter un adversaire'}</h3>
              <button onClick={() => setModal({ open: false })} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom du club *</label>
                <input value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Red Star FC"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Catégorie *</label>
                  <div className="relative">
                    <select value={form.categorie} onChange={e => setForm(f => ({ ...f, categorie: e.target.value as Category }))}
                      className="w-full appearance-none px-3 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all pr-8">
                      {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                    </select>
                    <span className="material-symbols-outlined absolute right-2 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none text-[18px]">expand_more</span>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Ville</label>
                  <input value={form.ville} onChange={e => setForm(f => ({ ...f, ville: e.target.value }))}
                    placeholder="Ex : Lyon"
                    className="w-full px-3 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Téléphone</label>
                  <input value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    placeholder="06 12 34 56 78"
                    className="w-full px-3 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-label-md text-on-surface-variant">Email contact</label>
                  <input value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    placeholder="contact@club.fr"
                    className="w-full px-3 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-label-md text-on-surface-variant">Couleur du club</label>
                <div className="flex gap-2 flex-wrap">
                  {COULEURS.map(c => (
                    <button key={c} onClick={() => setForm(f => ({ ...f, couleur: c }))}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${form.couleur === c ? 'border-on-surface scale-110' : 'border-white'}`}
                      style={{ backgroundColor: c }} />
                  ))}
                  <input type="color" value={form.couleur} onChange={e => setForm(f => ({ ...f, couleur: e.target.value }))}
                    className="w-8 h-8 rounded-full border-2 border-outline-variant cursor-pointer" title="Couleur personnalisée" />
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setModal({ open: false })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">
                Annuler
              </button>
              <button onClick={handleSave} disabled={!form.nom.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 transition-colors">
                {modal.editing ? 'Enregistrer' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Confirm suppression ───────────────────────────────────── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl p-6 text-center">
            <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="material-symbols-outlined text-error text-[28px]">delete</span>
            </div>
            <h3 className="text-headline-md mb-2">Supprimer cet adversaire ?</h3>
            <p className="text-body-md text-on-surface-variant mb-6">
              L'historique des matchs contre cet adversaire sera conservé.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-outline-variant rounded-xl text-label-lg hover:bg-surface-container-low">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-2.5 bg-error text-white rounded-xl text-label-lg hover:opacity-90">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
