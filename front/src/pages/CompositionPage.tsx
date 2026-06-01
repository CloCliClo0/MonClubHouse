import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

type Player = {
  id: number
  name: string
  number: number
  position: string
  x: number
  y: number
}

// Matchs à venir avec convocations validées
const UPCOMING_MATCHES = [
  { id: 1,  label: 'MCH Seniors A vs Red Star FC',      date: 'Sam. 7 juin 2025 · 15:30', equipe: 'Seniors A',   terrain: 'Stade Municipal',   competition: 'Division 3'   },
  { id: 6,  label: 'MCH Seniors A vs Paris FC B',        date: 'Sam. 14 juin 2025 · 14:00',equipe: 'Seniors A',   terrain: 'Stade Annexe',      competition: 'Division 3'   },
  { id: 9,  label: 'MCH U19 vs Red Star U19',            date: 'Dim. 8 juin 2025 · 10:00', equipe: 'U19',         terrain: 'Terrain A',         competition: 'U19 Régional' },
  { id: 11, label: 'MCH U15 vs ES Décines',              date: 'Sam. 7 juin 2025 · 11:00', equipe: 'U15',         terrain: 'Terrain B',         competition: 'U15 District' },
]

const FIELD_POSITIONS: Record<string, Player[]> = {
  '4-3-3': [
    { id: 1,  name: 'M. Rousseau',   number: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  name: 'B. Girard',     number: 5,  position: 'DG',  x: 15, y: 70 },
    { id: 3,  name: 'A. Moreau',     number: 4,  position: 'DCG', x: 35, y: 73 },
    { id: 4,  name: 'T. Dupuis',     number: 3,  position: 'DCD', x: 65, y: 73 },
    { id: 5,  name: 'R. Denis',      number: 2,  position: 'DD',  x: 85, y: 70 },
    { id: 6,  name: 'C. Lefebvre',   number: 8,  position: 'MG',  x: 20, y: 50 },
    { id: 7,  name: 'J. Fontaine',   number: 6,  position: 'MC',  x: 50, y: 52 },
    { id: 8,  name: 'T. Blanchard',  number: 10, position: 'MD',  x: 80, y: 50 },
    { id: 9,  name: 'N. Perrin',     number: 11, position: 'AG',  x: 20, y: 28 },
    { id: 10, name: 'L. Bertin',     number: 9,  position: 'AT',  x: 50, y: 22 },
    { id: 11, name: 'S. Mathieu',    number: 7,  position: 'AD',  x: 80, y: 28 },
  ],
  '4-4-2': [
    { id: 1,  name: 'M. Rousseau',   number: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  name: 'B. Girard',     number: 5,  position: 'DG',  x: 15, y: 70 },
    { id: 3,  name: 'A. Moreau',     number: 4,  position: 'DCG', x: 35, y: 73 },
    { id: 4,  name: 'T. Dupuis',     number: 3,  position: 'DCD', x: 65, y: 73 },
    { id: 5,  name: 'R. Denis',      number: 2,  position: 'DD',  x: 85, y: 70 },
    { id: 6,  name: 'C. Lefebvre',   number: 8,  position: 'MG',  x: 20, y: 48 },
    { id: 7,  name: 'J. Fontaine',   number: 6,  position: 'MCG', x: 38, y: 48 },
    { id: 8,  name: 'T. Blanchard',  number: 10, position: 'MCD', x: 62, y: 48 },
    { id: 9,  name: 'S. Mathieu',    number: 7,  position: 'MD',  x: 80, y: 48 },
    { id: 10, name: 'L. Bertin',     number: 9,  position: 'ATG', x: 38, y: 24 },
    { id: 11, name: 'N. Perrin',     number: 11, position: 'ATD', x: 62, y: 24 },
  ],
  '4-2-3-1': [
    { id: 1,  name: 'M. Rousseau',   number: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  name: 'B. Girard',     number: 5,  position: 'DG',  x: 15, y: 70 },
    { id: 3,  name: 'A. Moreau',     number: 4,  position: 'DCG', x: 35, y: 73 },
    { id: 4,  name: 'T. Dupuis',     number: 3,  position: 'DCD', x: 65, y: 73 },
    { id: 5,  name: 'R. Denis',      number: 2,  position: 'DD',  x: 85, y: 70 },
    { id: 6,  name: 'C. Lefebvre',   number: 8,  position: 'MDG', x: 33, y: 56 },
    { id: 7,  name: 'J. Fontaine',   number: 6,  position: 'MDD', x: 67, y: 56 },
    { id: 8,  name: 'T. Blanchard',  number: 10, position: 'MC',  x: 50, y: 40 },
    { id: 9,  name: 'N. Perrin',     number: 11, position: 'MG',  x: 22, y: 33 },
    { id: 10, name: 'S. Mathieu',    number: 7,  position: 'MD',  x: 78, y: 33 },
    { id: 11, name: 'L. Bertin',     number: 9,  position: 'AT',  x: 50, y: 20 },
  ],
  '3-5-2': [
    { id: 1,  name: 'M. Rousseau',   number: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  name: 'B. Girard',     number: 5,  position: 'DG',  x: 22, y: 73 },
    { id: 3,  name: 'A. Moreau',     number: 4,  position: 'DC',  x: 50, y: 76 },
    { id: 4,  name: 'R. Denis',      number: 2,  position: 'DD',  x: 78, y: 73 },
    { id: 5,  name: 'T. Dupuis',     number: 3,  position: 'PG',  x: 10, y: 50 },
    { id: 6,  name: 'C. Lefebvre',   number: 8,  position: 'MCG', x: 30, y: 50 },
    { id: 7,  name: 'J. Fontaine',   number: 6,  position: 'MC',  x: 50, y: 50 },
    { id: 8,  name: 'T. Blanchard',  number: 10, position: 'MCD', x: 70, y: 50 },
    { id: 9,  name: 'S. Mathieu',    number: 7,  position: 'PD',  x: 90, y: 50 },
    { id: 10, name: 'L. Bertin',     number: 9,  position: 'ATG', x: 38, y: 24 },
    { id: 11, name: 'N. Perrin',     number: 11, position: 'ATD', x: 62, y: 24 },
  ],
  '5-3-2': [
    { id: 1,  name: 'M. Rousseau',   number: 1,  position: 'GB',  x: 50, y: 90 },
    { id: 2,  name: 'T. Dupuis',     number: 3,  position: 'DLG', x: 12, y: 70 },
    { id: 3,  name: 'B. Girard',     number: 5,  position: 'DCG', x: 30, y: 74 },
    { id: 4,  name: 'A. Moreau',     number: 4,  position: 'DC',  x: 50, y: 77 },
    { id: 5,  name: 'R. Denis',      number: 2,  position: 'DCD', x: 70, y: 74 },
    { id: 6,  name: 'S. Mathieu',    number: 7,  position: 'DLD', x: 88, y: 70 },
    { id: 7,  name: 'C. Lefebvre',   number: 8,  position: 'MCG', x: 28, y: 50 },
    { id: 8,  name: 'J. Fontaine',   number: 6,  position: 'MC',  x: 50, y: 50 },
    { id: 9,  name: 'T. Blanchard',  number: 10, position: 'MCD', x: 72, y: 50 },
    { id: 10, name: 'L. Bertin',     number: 9,  position: 'ATG', x: 36, y: 25 },
    { id: 11, name: 'N. Perrin',     number: 11, position: 'ATD', x: 64, y: 25 },
  ],
}

const BENCH = [
  { id: 12, name: 'F. Blanc',   number: 16, position: 'GB'  },
  { id: 13, name: 'P. Roux',    number: 14, position: 'DEF' },
  { id: 14, name: 'K. Martin',  number: 15, position: 'MIL' },
  { id: 15, name: 'E. Léger',   number: 17, position: 'ATT' },
]

const FORMATIONS = ['4-3-3', '4-4-2', '4-2-3-1', '3-5-2', '5-3-2']

export default function CompositionPage() {
  const navigate = useNavigate()
  const [selectedMatchId, setSelectedMatchId] = useState<number | null>(null)
  const [formation, setFormation]   = useState('4-3-3')
  const [selected, setSelected]     = useState<number | null>(null)
  const [saved, setSaved]           = useState(false)

  const match = UPCOMING_MATCHES.find(m => m.id === selectedMatchId)
  const fieldPlayers = FIELD_POSITIONS[formation] || FIELD_POSITIONS['4-3-3']

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  // ── Sélection du match ────────────────────────────────────────────────────
  if (!selectedMatchId) {
    return (
      <div>
        <div className="mb-6">
          <h2 className="text-headline-lg text-on-surface">Composition</h2>
          <p className="text-body-md text-on-surface-variant mt-1">Choisissez le match pour lequel préparer la composition</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {UPCOMING_MATCHES.map(m => (
            <button
              key={m.id}
              onClick={() => setSelectedMatchId(m.id)}
              className="bg-white border border-[#e8e8f0] rounded-xl p-5 text-left hover:border-primary/50 hover:shadow-md transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex flex-col items-center justify-center text-primary shrink-0 group-hover:bg-primary group-hover:text-white transition-all">
                  <span className="material-symbols-outlined text-[20px]">sports_soccer</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-label-lg text-on-surface font-bold truncate">{m.label}</p>
                  <p className="text-body-sm text-on-surface-variant mt-1">{m.date}</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{m.equipe}</span>
                    <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant">{m.competition}</span>
                    <span className="px-2 py-0.5 bg-surface-container-low rounded text-label-md text-on-surface-variant flex items-center gap-1">
                      <span className="material-symbols-outlined text-[12px]">location_on</span>
                      {m.terrain}
                    </span>
                  </div>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant group-hover:text-primary transition-colors">arrow_forward</span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-6 bg-surface-container-low border border-outline-variant rounded-xl p-4 flex items-center gap-3 text-body-sm text-on-surface-variant">
          <span className="material-symbols-outlined text-primary">info</span>
          Seuls les matchs avec des convocations actives apparaissent ici.
          <button onClick={() => navigate('/evenements/creer')} className="ml-auto text-primary hover:underline text-label-md">
            Créer un match →
          </button>
        </div>
      </div>
    )
  }

  // ── Éditeur de composition ────────────────────────────────────────────────
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => setSelectedMatchId(null)}
            className="flex items-center gap-1.5 text-on-surface-variant hover:text-on-surface text-label-md mb-2 transition-colors">
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Choisir un autre match
          </button>
          <h2 className="text-headline-lg text-on-surface">Composition</h2>
          <p className="text-body-md text-on-surface-variant">{match?.label} · {match?.date}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFormation('4-3-3')}
            className="flex items-center gap-2 border border-outline-variant text-on-surface px-4 py-2.5 rounded-lg text-label-lg hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-[20px]">restart_alt</span>
            Réinitialiser
          </button>
          <button onClick={handleSave}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-label-lg transition-colors ${
              saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary-container'
            }`}>
            <span className="material-symbols-outlined text-[20px]">{saved ? 'check' : 'save'}</span>
            {saved ? 'Enregistré !' : 'Enregistrer'}
          </button>
        </div>
      </div>

      {/* Info match */}
      <div className="bg-white border border-[#e8e8f0] rounded-xl p-4 mb-5 flex flex-wrap items-center gap-4 text-body-sm text-on-surface-variant">
        {[
          { icon: 'sports_soccer', val: match?.label },
          { icon: 'calendar_today', val: match?.date?.split(' · ')[0] },
          { icon: 'schedule', val: match?.date?.split(' · ')[1] },
          { icon: 'location_on', val: match?.terrain },
          { icon: 'emoji_events', val: match?.competition },
        ].map((item, i) => item.val && (
          <span key={i} className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px] text-primary">{item.icon}</span>
            {item.val}
          </span>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Terrain */}
        <div className="lg:col-span-2 bg-white border border-[#e8e8f0] rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-headline-md">Disposition sur le terrain</h3>
            <div className="flex items-center gap-2">
              <span className="text-label-md text-on-surface-variant">Formation :</span>
              <select value={formation} onChange={e => { setFormation(e.target.value); setSelected(null) }}
                className="border border-outline-variant rounded-lg px-3 py-1.5 text-label-md text-on-surface focus:outline-none focus:border-primary">
                {FORMATIONS.map(f => <option key={f}>{f}</option>)}
              </select>
            </div>
          </div>

          {/* Pitch */}
          <div className="relative rounded-xl overflow-hidden"
            style={{ background: 'linear-gradient(180deg,#2d6a4f 0%,#1b4332 50%,#2d6a4f 100%)', aspectRatio: '7/10' }}>
            {/* Lignes */}
            <div className="absolute inset-[6%] border-2 border-white/25 rounded" />
            <div className="absolute left-[6%] right-[6%] top-[50%] border-t-2 border-white/25" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[20%] aspect-square rounded-full border-2 border-white/25" />
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/30 rounded-full" />
            <div className="absolute left-[25%] right-[25%] top-[6%] h-[14%] border-2 border-white/25 border-t-0" />
            <div className="absolute left-[25%] right-[25%] bottom-[6%] h-[14%] border-2 border-white/25 border-b-0" />
            <div className="absolute left-[38%] right-[38%] top-[5%] h-[3%] border-2 border-white/40 border-t-0 bg-white/10" />
            <div className="absolute left-[38%] right-[38%] bottom-[5%] h-[3%] border-2 border-white/40 border-b-0 bg-white/10" />

            {/* Label équipe / adv */}
            <div className="absolute top-[3%] left-1/2 -translate-x-1/2 text-white/40 text-[10px] font-bold uppercase tracking-widest">
              {match?.label.split(' vs ')[1]}
            </div>
            <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
              {match?.equipe}
            </div>

            {/* Joueurs */}
            {fieldPlayers.map(p => (
              <button key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                className="absolute flex flex-col items-center gap-0.5 -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px] shadow-lg transition-all ${
                  selected === p.id
                    ? 'bg-yellow-400 text-black scale-125 ring-2 ring-yellow-300'
                    : 'bg-white/90 text-primary group-hover:bg-white group-hover:scale-110'
                }`}>
                  {p.number}
                </div>
                <div className="bg-black/60 text-white text-[9px] font-bold px-1 py-0.5 rounded whitespace-nowrap">
                  {p.name.split(' ').pop()}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Sidebar joueurs */}
        <div className="space-y-4">
          {/* Onze */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0] flex items-center justify-between">
              <h4 className="text-headline-md">Onze titulaire</h4>
              <span className="text-label-md text-on-surface-variant">{formation}</span>
            </div>
            <div className="divide-y divide-[#e8e8f0] max-h-[280px] overflow-y-auto">
              {fieldPlayers.map(p => (
                <div key={p.id} onClick={() => setSelected(selected === p.id ? null : p.id)}
                  className={`px-4 py-2.5 flex items-center gap-3 cursor-pointer transition-colors ${
                    selected === p.id ? 'bg-yellow-50' : 'hover:bg-surface-container-low'
                  }`}>
                  <span className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center ${
                    selected === p.id ? 'bg-yellow-400 text-yellow-900' : 'bg-primary text-white'
                  }`}>{p.number}</span>
                  <div className="flex-1">
                    <span className="text-label-lg text-on-surface">{p.name}</span>
                  </div>
                  <span className="text-label-md text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded text-[11px]">
                    {p.position}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Remplaçants */}
          <div className="bg-white border border-[#e8e8f0] rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-[#e8e8f0]">
              <h4 className="text-headline-md">Remplaçants</h4>
            </div>
            <div className="divide-y divide-[#e8e8f0]">
              {BENCH.map(p => (
                <div key={p.id} className="px-4 py-2.5 flex items-center gap-3 hover:bg-surface-container-low transition-colors">
                  <span className="w-6 h-6 rounded-full bg-surface-container text-on-surface-variant text-[11px] font-bold flex items-center justify-center">
                    {p.number}
                  </span>
                  <div className="flex-1">
                    <span className="text-label-lg text-on-surface">{p.name}</span>
                  </div>
                  <span className="text-label-md text-on-surface-variant bg-surface-container-low px-1.5 py-0.5 rounded text-[11px]">
                    {p.position}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Actions rapides */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2 text-body-sm text-on-surface-variant">
            <p className="text-label-lg text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-[18px]">tips_and_updates</span>
              Conseils
            </p>
            <p>Cliquez sur un joueur sur le terrain ou dans la liste pour le sélectionner (surligné en jaune).</p>
            <p>Changez de formation avec le menu déroulant — les positions s'adaptent automatiquement.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
