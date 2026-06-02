import { useState, useRef, useEffect } from 'react'
import api from '../services/api'
import EmojiPicker from '../components/EmojiPicker'

type Channel = { id: number; nom: string; type: string; icon?: string }
type Message = { id: number; sender_id: number; sender?: { nom: string; prenom: string }; contenu: string; created_at: string; mine?: boolean }

const TYPE_ICON: Record<string, string> = {
  equipe: 'sports_soccer', club: 'house', dirigeants: 'badge', prive: 'lock', groupe: 'forum',
}

type ChannelModal = { open: false } | { open: true }
type InfoModal    = { open: false } | { open: true; channel: Channel }

function isMediaUrl(s: string) {
  return s.startsWith('/uploads/') ||
    s.includes('drive.google.com') ||
    /^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)(\?.*)?$/i.test(s)
}

function MessageContent({ contenu, mine }: { contenu: string; mine?: boolean }) {
  if (isMediaUrl(contenu)) {
    return (
      <a href={contenu} target="_blank" rel="noreferrer">
        <img
          src={contenu}
          alt="Image"
          className="max-w-[240px] max-h-48 rounded-lg object-cover cursor-pointer hover:opacity-90 transition-opacity"
        />
      </a>
    )
  }
  return <p className="text-body-md">{contenu}</p>
}

export default function ChatPage() {
  const [channels, setChannels]     = useState<Channel[]>([])
  const [activeId, setActiveId]     = useState<number | null>(null)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [loadingCh, setLoadingCh]   = useState(true)
  const [loadingMsg, setLoadingMsg] = useState(false)
  const [channelModal, setChannelModal] = useState<ChannelModal>({ open: false })
  const [infoModal, setInfoModal]       = useState<InfoModal>({ open: false })
  const [newCh, setNewCh]           = useState({ nom: '', type: 'equipe' })
  const [saving, setSaving]         = useState(false)
  const [showEmoji, setShowEmoji]   = useState(false)
  const [uploading, setUploading]   = useState(false)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const emojiPickerRef = useRef<HTMLDivElement>(null)

  // Ferme l'emoji picker au clic extérieur
  useEffect(() => {
    if (!showEmoji) return
    const handler = (e: MouseEvent) => {
      if (
        !emojiPickerRef.current?.contains(e.target as Node) &&
        !emojiButtonRef.current?.contains(e.target as Node)
      ) {
        setShowEmoji(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showEmoji])

  const loadChannels = () => {
    setLoadingCh(true)
    api.get('/chat/channels')
      .then(r => setChannels(r.data.data || []))
      .catch(() => setChannels([]))
      .finally(() => setLoadingCh(false))
  }

  const loadMessages = (channelId: number) => {
    setLoadingMsg(true)
    api.get(`/chat/channels/${channelId}/messages`)
      .then(r => {
        const msgs = (r.data.data || []).map((m: Message) => ({
          ...m,
          mine: m.sender_id === parseInt(localStorage.getItem('userId') || '0'),
        }))
        setMessages(msgs)
        setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMsg(false))
  }

  useEffect(() => { loadChannels() }, [])

  useEffect(() => {
    if (activeId) loadMessages(activeId)
  }, [activeId])

  const sendMessage = async () => {
    if (!input.trim() || !activeId) return
    const text = input.trim()
    setInput('')
    const temp: Message = {
      id: Date.now(), sender_id: 0, contenu: text,
      created_at: new Date().toISOString(), mine: true,
    }
    setMessages(prev => [...prev, temp])
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    await api.post('/chat/messages', { channel_id: activeId, contenu: text }).catch(() => {})
    loadMessages(activeId)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !activeId) return
    e.target.value = ''

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post('/upload/chat', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (res.data.success) {
        // Envoie l'URL comme message (image ou lien selon le type)
        const url = res.data.url as string
        await api.post('/chat/messages', { channel_id: activeId, contenu: url }).catch(() => {})
        loadMessages(activeId)
      }
    } catch {
      // Fallback : affiche le nom du fichier dans la zone de saisie
      setInput(prev => prev + ` [${file.name}]`)
    } finally {
      setUploading(false)
    }
  }

  const createChannel = async () => {
    if (!newCh.nom.trim()) return
    setSaving(true)
    try {
      await api.post('/chat/channels', newCh)
      loadChannels()
      setChannelModal({ open: false })
      setNewCh({ nom: '', type: 'equipe' })
    } finally {
      setSaving(false)
    }
  }

  const activeChannel = channels.find(c => c.id === activeId)

  return (
    // Wrapper relative pour positionner l'emoji picker en dehors du conteneur overflow-hidden
    <div className="h-[calc(100vh-64px-48px)] relative">
      <div className="bg-white rounded-xl border border-outline-variant flex h-full shadow-sm overflow-hidden">

        {/* Canaux */}
        <div className="w-[260px] border-r border-outline-variant flex flex-col bg-white shrink-0">
          <div className="p-4 border-b border-outline-variant flex justify-between items-center">
            <h2 className="text-headline-md text-on-surface">Canaux</h2>
            <button onClick={() => setChannelModal({ open: true })}
              className="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-primary transition-colors"
              title="Créer un canal">
              <span className="material-symbols-outlined text-[20px]">add_circle</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingCh ? (
              <div className="space-y-2 p-2">
                {[1,2,3].map(i => <div key={i} className="h-14 bg-surface-container-low rounded-lg animate-pulse" />)}
              </div>
            ) : channels.length === 0 ? (
              <div className="p-4 text-center text-on-surface-variant">
                <span className="material-symbols-outlined text-[36px] block mb-2 opacity-30">chat</span>
                <p className="text-body-sm">Aucun canal</p>
                <button onClick={() => setChannelModal({ open: true })} className="text-primary text-label-md hover:underline mt-1">Créer un canal</button>
              </div>
            ) : (
              channels.map(ch => (
                <button key={ch.id} onClick={() => setActiveId(ch.id)}
                  className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-all ${
                    activeId === ch.id ? 'bg-[#f4f4f6] border-l-4 border-primary' : 'hover:bg-[#f4f4f6]/50'
                  }`}>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                    activeId === ch.id ? 'bg-primary/10 text-primary' : 'bg-surface-container text-on-surface-variant'
                  }`}>
                    <span className={`material-symbols-outlined ${activeId === ch.id ? 'filled-icon' : ''}`}>
                      {TYPE_ICON[ch.type] || 'chat'}
                    </span>
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-label-lg text-on-surface truncate">{ch.nom}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium capitalize">{ch.type}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Zone chat */}
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-on-surface-variant gap-3">
            <span className="material-symbols-outlined text-[56px] opacity-20">forum</span>
            <p className="text-body-lg">Sélectionnez un canal pour commencer</p>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-w-0">
            {/* Header canal */}
            <div className="h-[64px] px-6 border-b border-outline-variant flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center">
                  <span className="material-symbols-outlined text-[18px]">{TYPE_ICON[activeChannel?.type || ''] || 'chat'}</span>
                </div>
                <h3 className="text-headline-md leading-none">{activeChannel?.nom}</h3>
              </div>
              <div className="flex items-center gap-1">
                <button className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant">
                  <span className="material-symbols-outlined">search</span>
                </button>
                <button
                  onClick={() => activeChannel && setInfoModal({ open: true, channel: activeChannel })}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors text-on-surface-variant"
                  title="Informations du canal">
                  <span className="material-symbols-outlined">more_vert</span>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 bg-white">
              {loadingMsg ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => <div key={i} className={`flex gap-3 ${i % 2 === 0 ? 'flex-row-reverse' : ''}`}>
                    <div className="w-9 h-9 rounded-full bg-surface-container-low animate-pulse shrink-0" />
                    <div className={`h-16 rounded-2xl bg-surface-container-low animate-pulse ${i % 2 === 0 ? 'w-48' : 'w-64'}`} />
                  </div>)}
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[40px] block mb-2 opacity-30">chat_bubble</span>
                  <p className="text-body-md">Aucun message — soyez le premier !</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-4 py-2">
                    <div className="flex-1 h-px bg-outline-variant/30" />
                    <span className="text-[11px] font-bold text-on-surface-variant/50 uppercase tracking-widest">Messages</span>
                    <div className="flex-1 h-px bg-outline-variant/30" />
                  </div>
                  {messages.map(msg => (
                    <div key={msg.id} className={`flex gap-3 max-w-[80%] ${msg.mine ? 'flex-row-reverse ml-auto' : ''}`}>
                      <div className={`w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold text-xs ${msg.mine ? 'bg-primary-container' : 'bg-secondary-container text-on-secondary-container'}`}>
                        {msg.sender ? `${msg.sender.prenom?.[0]}${msg.sender.nom?.[0]}` : 'U'}
                      </div>
                      <div className={`flex flex-col ${msg.mine ? 'items-end' : ''}`}>
                        <p className={`text-[12px] font-bold text-on-surface-variant mb-1 ${msg.mine ? 'mr-1' : 'ml-1'}`}>
                          {msg.mine ? 'Vous' : msg.sender ? `${msg.sender.prenom} ${msg.sender.nom}` : 'Utilisateur'}
                        </p>
                        <div className={`p-3 px-4 rounded-2xl border shadow-sm ${msg.mine ? 'bg-[#2d6a4f] text-white rounded-tr-none shadow-md border-transparent' : 'bg-[#f4f4f6] text-on-surface rounded-tl-none border-outline-variant/20'}`}>
                          <MessageContent contenu={msg.contenu} mine={msg.mine} />
                        </div>
                        <span className={`text-[10px] text-on-surface-variant/60 mt-1 ${msg.mine ? 'mr-1' : 'ml-1'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-outline-variant">
              <div className="flex items-end gap-2 bg-[#f4f4f6] p-2 rounded-[24px] border border-outline-variant/30 focus-within:border-primary/50 focus-within:bg-white transition-all shadow-sm">
                {/* + fichier/photo */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-10 h-10 flex items-center justify-center text-on-surface-variant hover:text-primary transition-colors shrink-0 disabled:opacity-40"
                  title="Joindre un fichier ou une photo"
                >
                  {uploading
                    ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <span className="material-symbols-outlined">add</span>
                  }
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />

                <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown} rows={1}
                  className="flex-1 bg-transparent border-none resize-none py-2.5 px-1 text-body-md focus:ring-0 outline-none placeholder:text-on-surface-variant/50 min-h-[44px] max-h-[120px]"
                  placeholder="Écrivez votre message…" />

                {/* Bouton emoji — positionné pour que le picker s'affiche en dehors du overflow-hidden */}
                <button
                  ref={emojiButtonRef}
                  onClick={() => setShowEmoji(v => !v)}
                  className={`w-10 h-10 flex items-center justify-center transition-colors shrink-0 ${showEmoji ? 'text-primary' : 'text-on-surface-variant hover:text-primary'}`}
                  title="Emojis"
                >
                  <span className="material-symbols-outlined">mood</span>
                </button>

                <button onClick={sendMessage} disabled={!input.trim()}
                  className="w-10 h-10 bg-[#2d6a4f] text-white rounded-full flex items-center justify-center hover:bg-primary active:scale-95 transition-all shrink-0 shadow-lg disabled:opacity-40">
                  <span className="material-symbols-outlined filled-icon ml-0.5">send</span>
                </button>
              </div>
              <p className="text-[10px] text-center mt-2 text-on-surface-variant/40">Entrée pour envoyer</p>
            </div>
          </div>
        )}
      </div>

      {/* Emoji picker EN DEHORS du conteneur overflow-hidden pour éviter le clipping */}
      {showEmoji && (
        <div ref={emojiPickerRef} className="absolute bottom-[88px] right-4 z-50">
          <EmojiPicker
            onSelect={(emoji) => setInput(prev => prev + emoji)}
            onClose={() => setShowEmoji(false)}
          />
        </div>
      )}

      {/* ── Modal Créer canal ────────────────────────────────────── */}
      {channelModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setChannelModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">Nouveau canal</h3>
              <button onClick={() => setChannelModal({ open: false })} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Nom du canal *</label>
                <input value={newCh.nom} onChange={e => setNewCh(f => ({ ...f, nom: e.target.value }))}
                  placeholder="Ex : Équipe U15, Entraîneurs…"
                  className="w-full px-4 py-3 border border-outline-variant rounded-lg text-body-md focus:outline-none focus:border-primary transition-all" />
              </div>
              <div className="space-y-1.5">
                <label className="text-label-md text-on-surface-variant">Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {Object.entries(TYPE_ICON).map(([type, icon]) => (
                    <button key={type} type="button" onClick={() => setNewCh(f => ({ ...f, type }))}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border-2 transition-all text-label-md capitalize ${
                        newCh.type === type ? 'border-primary bg-primary/10 text-primary' : 'border-[#e8e8f0] text-on-surface-variant hover:border-primary/40'
                      }`}>
                      <span className="material-symbols-outlined text-[22px]">{icon}</span>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-[#e8e8f0] flex justify-end gap-3">
              <button onClick={() => setChannelModal({ open: false })}
                className="px-4 py-2.5 border border-outline-variant rounded-lg text-label-lg hover:bg-surface-container-low">Annuler</button>
              <button onClick={createChannel} disabled={saving || !newCh.nom.trim()}
                className="px-5 py-2.5 bg-primary text-white rounded-lg text-label-lg hover:bg-primary-container disabled:opacity-40 flex items-center gap-2">
                {saving ? <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> : null}
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Infos canal ────────────────────────────────────── */}
      {infoModal.open && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setInfoModal({ open: false })}>
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-[#e8e8f0] flex items-center justify-between">
              <h3 className="text-headline-md">Informations du canal</h3>
              <button onClick={() => setInfoModal({ open: false })} className="text-on-surface-variant hover:text-on-surface">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-4 p-4 bg-surface-container-low rounded-xl">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                  <span className="material-symbols-outlined text-[24px]">{TYPE_ICON[infoModal.channel.type] || 'chat'}</span>
                </div>
                <div>
                  <p className="text-label-lg text-on-surface font-bold">{infoModal.channel.nom}</p>
                  <p className="text-body-sm text-on-surface-variant capitalize">{infoModal.channel.type}</p>
                </div>
              </div>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors text-left">
                  <span className="material-symbols-outlined text-on-surface-variant">edit</span>
                  <span className="text-label-lg text-on-surface">Renommer le canal</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors text-left">
                  <span className="material-symbols-outlined text-on-surface-variant">person_add</span>
                  <span className="text-label-lg text-on-surface">Ajouter des membres</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-surface-container-low transition-colors text-left">
                  <span className="material-symbols-outlined text-on-surface-variant">notifications_off</span>
                  <span className="text-label-lg text-on-surface">Désactiver les notifications</span>
                </button>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-red-50 transition-colors text-left">
                  <span className="material-symbols-outlined text-error">exit_to_app</span>
                  <span className="text-label-lg text-error">Quitter le canal</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
