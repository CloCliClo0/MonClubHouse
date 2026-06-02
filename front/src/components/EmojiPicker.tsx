import { useState } from 'react'

const EMOJI_CATEGORIES = [
  {
    label: '😀 Smileys',
    emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','😎','🤩','😏','😒','😞','😔','😟','😕','🙁','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓'],
  },
  {
    label: '⚽ Sport',
    emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🥏','🎱','🏓','🏸','🥊','🥋','⛳','🏹','🎣','🤿','🎿','🛷','🥌','🏒','🏑','🏏','🏋️','🤼','🤸','⛹️','🤺','🤾','🏌️','🏇','🧘','🏄','🚵','🚴','🏊','🤽','🚣','🧗','🤺','🎽','🥇','🥈','🥉','🏆','🎖️'],
  },
  {
    label: '👍 Gestes',
    emojis: ['👍','👎','👏','🙌','🤝','👋','🤚','✋','🖐','🖖','🤟','🤘','🤙','💪','🦾','🦵','🦶','👊','✊','🤛','🤜','👌','🤌','🤏','✌️','🤞','🤟','🤙','💅','🙏','✍️','💪','👈','👉','👆','👇','☝️','👍','👎','✊'],
  },
  {
    label: '🔥 Populaires',
    emojis: ['🔥','⚡','💥','🎉','🎊','🏆','⭐','💫','✨','🌟','💯','❤️','💚','🧡','💛','💙','💜','🖤','❤️‍🔥','💔','❣️','💕','💞','💓','💗','💖','💘','💝','🎯','💡','🔑','🚀','🌈','🌊','🌀','🌸','🍀','🦋','🎵','🎶','🎸','⚡','💪','🙏','🤝','🫶'],
  },
  {
    label: '📢 Club',
    emojis: ['📢','📣','🏟️','🎽','🎯','📋','📅','📆','⏰','⚠️','✅','❌','🔴','🟡','🟢','📊','📈','📉','🗓️','📌','📍','🔔','🔕','📧','📱','💬','🗨️','💭','🏠','🏡','🏢','🎪','🎠','🏋️','🏊','⛹️','🚶','🏃','🧑‍🤝‍🧑','👨‍👩‍👧‍👦'],
  },
]

type Props = {
  onSelect: (emoji: string) => void
  onClose: () => void
}

export default function EmojiPicker({ onSelect, onClose }: Props) {
  const [activeCategory, setActiveCategory] = useState(0)
  const [search, setSearch] = useState('')

  const filteredEmojis = search.trim()
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(search))
    : EMOJI_CATEGORIES[activeCategory].emojis

  return (
    <div className="absolute bottom-full mb-2 right-0 w-[320px] bg-white rounded-2xl shadow-2xl border border-[#e8e8f0] overflow-hidden z-50">
      {/* Search */}
      <div className="p-3 border-b border-[#e8e8f0]">
        <div className="relative">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-on-surface-variant text-[18px]">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un emoji…"
            className="w-full pl-8 pr-3 py-1.5 bg-surface-container-low rounded-lg text-body-sm focus:outline-none focus:ring-2 focus:ring-primary/20 border border-outline-variant"
            autoFocus
          />
        </div>
      </div>

      {/* Catégories */}
      {!search && (
        <div className="flex border-b border-[#e8e8f0]">
          {EMOJI_CATEGORIES.map((cat, i) => (
            <button
              key={i}
              onClick={() => setActiveCategory(i)}
              title={cat.label}
              className={`flex-1 py-2 text-base transition-all ${activeCategory === i ? 'bg-primary/10 border-b-2 border-primary' : 'hover:bg-surface-container-low'}`}
            >
              {cat.emojis[0]}
            </button>
          ))}
        </div>
      )}

      {/* Emojis grid */}
      <div className="p-2 h-48 overflow-y-auto">
        {!search && (
          <p className="text-label-md text-on-surface-variant px-1 mb-1.5">
            {EMOJI_CATEGORIES[activeCategory].label}
          </p>
        )}
        <div className="grid grid-cols-8 gap-0.5">
          {filteredEmojis.map((emoji, i) => (
            <button
              key={i}
              onClick={() => { onSelect(emoji); onClose() }}
              className="text-xl p-1.5 rounded-lg hover:bg-surface-container-low transition-colors leading-none"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
          {filteredEmojis.length === 0 && (
            <p className="col-span-8 text-center text-body-sm text-on-surface-variant py-6">Aucun emoji trouvé</p>
          )}
        </div>
      </div>
    </div>
  )
}
