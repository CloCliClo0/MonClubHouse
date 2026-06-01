import { useNavigate } from 'react-router-dom'

export default function Topbar() {
  const navigate = useNavigate()

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-260px)] h-[64px] bg-white border-b border-outline-variant flex justify-between items-center px-6 z-40">
      <div className="flex items-center gap-4 w-1/3">
        <div className="relative w-full max-w-[400px]">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            className="w-full pl-10 pr-4 py-2 bg-surface-container-low border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-body-md transition-all"
            placeholder="Rechercher..."
            type="text"
          />
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-3 border-r border-outline-variant pr-6">
          <button className="relative p-2 rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">notifications</span>
            <span className="absolute top-2 right-2 w-2 h-2 bg-error rounded-full" />
          </button>
          <button className="p-2 rounded-full hover:bg-surface-container-low transition-colors">
            <span className="material-symbols-outlined text-on-surface-variant">help</span>
          </button>
        </div>

        <button
          onClick={() => navigate('/profil')}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="text-right">
            <p className="text-label-lg text-on-surface leading-none">Julien Moreau</p>
            <p className="text-body-sm text-on-surface-variant">Admin Club</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary-container flex items-center justify-center text-white font-bold text-sm group-hover:ring-2 group-hover:ring-primary transition-all">
            JM
          </div>
        </button>
      </div>
    </header>
  )
}
