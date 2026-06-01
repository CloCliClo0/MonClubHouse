import { useState, useRef, useEffect } from 'react'

type Message = {
  id: number
  sender: string
  text: string
  mine: boolean
  time: string
}

const channels = [
  { id: 1, name: 'Equipe A Seniors', icon: 'sports_soccer', type: '⚽ team', active: true },
  { id: 2, name: 'MCH Global Club', icon: 'house', type: '🏠 club', active: false },
  { id: 3, name: 'Comité Directeur', icon: 'badge', type: '👔 directors', active: false },
  { id: 4, name: 'Discussions Générales', icon: 'forum', type: '💬 general', active: false },
]

const initialMessages: Message[] = [
  { id: 1, sender: 'Lucas Bertin', text: "Salut tout le monde ! Est-ce qu'on confirme l'entraînement de demain soir à 19h ? ⚽", mine: false, time: '09:42' },
  { id: 2, sender: 'Cédric Lefebvre', text: 'Pour moi c\'est bon, je serai là ! On fait une séance physique ou tactique ?', mine: false, time: '09:45' },
  { id: 3, sender: 'Thomas Müller (Vous)', text: "Salut l'équipe ! Oui c'est confirmé. On va mixer : 30 min de physique pour commencer puis on enchaîne sur la tactique de placement pour le match de dimanche.", mine: true, time: '10:05' },
]

export default function ChatPage() {
  const [activeChannel, setActiveChannel] = useState(1)
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = () => {
    if (!input.trim()) return
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now(),
        sender: 'Thomas Müller (Vous)',
        text: input.trim(),
        mine: true,
        time: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="h-[calc(100vh-64px-48px)]">
      <div className="bg-white rounded-xl border border-outline-variant flex overflow-hidden h-full shadow-sm">
        {/* Channels Left Panel */}
        <div className="w-[260px] border-r border-outline-variant flex flex-col bg-white shrink-0">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center bg-white">
            <h2 className="text-headline-md text-on-surface">Canaux</h2>
            <button className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {channels.map((ch) => (
              <button
                key={ch.id}
                onClick={() => setActiveChannel(ch.id)}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
                  activeChannel === ch.id
                    ? 'bg-[#f4f4f6] border-l-4 border-primary'
                    : 'hover:bg-[#f4f4f6]/50 group'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    activeChannel === ch.id
                      ? 'bg-primary/10 text-primary'
                      : 'bg-surface-container text-on-surface-variant'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined ${activeChannel === ch.id ? 'filled-icon' : ''}`}
                  >
                    {ch.icon}
                  </span>
                </div>
                <div className="overflow-hidden">
                  <p className="text-label-lg text-on-surface truncate">{ch.name}</p>
                  <p className="text-[11px] text-on-surface-variant font-medium">{ch.type}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Right Panel */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header */}
          <div className="h-[64px] px-6 border-b border-outline-variant flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[18px]">sports_soccer</span>
              </div>
              <div>
                <h3 className="text-headline-md leading-none">
                  {channels.find((c) => c.id === activeChannel)?.name}
                </h3>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span className="text-[11px] text-on-surface-variant font-medium">12 membres en ligne</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">search</span>
              </button>
              <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                <span className="material-symbols-outlined">more_vert</span>
              </button>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-white">
            {/* Day Divider */}
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-outline-variant/30" />
              <span className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-widest">
                Aujourd'hui
              </span>
              <div className="flex-1 h-px bg-outline-variant/30" />
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[80%] ${msg.mine ? 'flex-row-reverse ml-auto' : ''}`}
              >
                <div
                  className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${
                    msg.mine ? 'bg-primary-container' : 'bg-secondary-container text-on-secondary-container'
                  }`}
                >
                  {msg.sender.slice(0, 2).toUpperCase()}
                </div>
                <div className={`flex flex-col ${msg.mine ? 'items-end' : ''}`}>
                  <p className={`text-[12px] font-bold text-on-surface-variant mb-1 ${msg.mine ? 'mr-1' : 'ml-1'}`}>
                    {msg.sender}
                  </p>
                  <div
                    className={`p-3 px-4 rounded-2xl border shadow-sm ${
                      msg.mine
                        ? 'bg-[#2d6a4f] text-white rounded-tr-none shadow-md border-transparent'
                        : 'bg-[#f4f4f6] text-on-surface rounded-tl-none border-outline-variant/20'
                    }`}
                  >
                    <p className="text-body-md">{msg.text}</p>
                  </div>
                  <span className={`text-[10px] text-on-surface-variant/60 mt-1 ${msg.mine ? 'mr-1' : 'ml-1'}`}>
                    {msg.time}
                  </span>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Bar */}
          <div className="p-4 bg-white border-t border-outline-variant">
            <div className="flex items-end gap-3 bg-[#f4f4f6] p-2 rounded-[24px] border border-outline-variant/30 focus-within:border-primary/50 focus-within:bg-white transition-all shadow-sm">
              <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">add</span>
              </button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 bg-transparent border-none resize-none py-2.5 px-1 text-body-md focus:ring-0 outline-none placeholder:text-on-surface-variant/50 min-h-[44px] max-h-[120px]"
                placeholder="Écrivez votre message..."
                rows={1}
              />
              <button className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors">
                <span className="material-symbols-outlined">mood</span>
              </button>
              <button
                onClick={sendMessage}
                className="w-10 h-10 bg-[#2d6a4f] text-white rounded-full flex items-center justify-center hover:bg-primary active:scale-95 transition-all shrink-0 shadow-lg"
              >
                <span className="material-symbols-outlined filled-icon ml-0.5">send</span>
              </button>
            </div>
            <p className="text-[10px] text-center mt-2 text-on-surface-variant/40">
              Appuyez sur Entrée pour envoyer
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
