import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/context/SocketContext';
import { Loader, EmptyState } from '@/components/ui/Loader';
import api from '@/services/api';
import type { Channel, Message } from '@/types';

export const Chat: React.FC = () => {
  const { user } = useAuth();
  const socket = useSocket();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout>>();

  // Charger les canaux
  useEffect(() => {
    api.get<{ data: Channel[] }>('/chat/channels').then(r => {
      setChannels(r.data.data);
      if (r.data.data.length > 0) setActiveChannel(r.data.data[0]);
    });
  }, []);

  // Charger les messages du canal actif
  useEffect(() => {
    if (!activeChannel) return;
    setLoadingMsg(true);
    api.get<{ data: Message[] }>(`/chat/channels/${activeChannel.id}/messages`)
      .then(r => { setMessages(r.data.data); })
      .finally(() => setLoadingMsg(false));
  }, [activeChannel]);

  // Socket.io
  useEffect(() => {
    if (!socket || !activeChannel) return;
    socket.emit('channel:join', { channel_id: activeChannel.id });

    const onMsg = (msg: Message) => {
      if (msg.channel_id === activeChannel.id) {
        setMessages(prev => [...prev, msg]);
      }
    };

    const onTyping = ({ nom, channel_id }: { nom: string; channel_id: number }) => {
      if (channel_id === activeChannel.id) {
        setTyping(`${nom} écrit...`);
        clearTimeout(typingTimer.current);
        typingTimer.current = setTimeout(() => setTyping(null), 3000);
      }
    };

    socket.on('message:new', onMsg);
    socket.on('typing:user', onTyping);
    return () => {
      socket.off('message:new', onMsg);
      socket.off('typing:user', onTyping);
    };
  }, [socket, activeChannel]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim() || !socket || !activeChannel) return;
    socket.emit('message:send', { channel_id: activeChannel.id, contenu: input.trim() });
    setInput('');
  };

  const handleTyping = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    if (socket && activeChannel) {
      socket.emit('typing:start', { channel_id: activeChannel.id });
      clearTimeout(typingTimer.current);
      typingTimer.current = setTimeout(() => socket.emit('typing:stop', { channel_id: activeChannel.id }), 2000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - var(--topbar-h) - 56px)', background: '#fff', borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow)' }}>
      {/* Channels sidebar */}
      <div style={{ width: 260, borderRight: '1px solid var(--grey-200)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--grey-200)', fontWeight: 700, fontSize: '.95rem' }}>
          Canaux
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {channels.map(ch => (
            <button
              key={ch.id}
              onClick={() => setActiveChannel(ch)}
              style={{
                width: '100%', padding: '12px 20px', border: 'none', cursor: 'pointer',
                textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10,
                background: activeChannel?.id === ch.id ? 'var(--grey-100)' : 'transparent',
                transition: 'background var(--transition)'
              }}
            >
              <span style={{ fontSize: '1rem' }}>
                {ch.type === 'equipe' ? '⚽' : ch.type === 'club' ? '🏠' : ch.type === 'dirigeants' ? '👔' : '💬'}
              </span>
              <div>
                <div style={{ fontWeight: 600, fontSize: '.9rem' }}>{ch.nom}</div>
                <div style={{ fontSize: '.74rem', color: 'var(--grey-400)', textTransform: 'capitalize' }}>{ch.type}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeChannel ? (
          <>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--grey-200)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.1rem' }}>
                {activeChannel.type === 'equipe' ? '⚽' : activeChannel.type === 'club' ? '🏠' : '💬'}
              </span>
              {activeChannel.nom}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {loadingMsg ? <Loader /> : messages.length === 0 ? (
                <EmptyState title="Aucun message" message="Soyez le premier à écrire !" icon="💬" />
              ) : messages.map(msg => {
                const isOwn = msg.sender_id === user?.id;
                return (
                  <div key={msg.id} style={{ display: 'flex', gap: 10, flexDirection: isOwn ? 'row-reverse' : 'row' }}>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: '.78rem', flexShrink: 0 }}>
                      {msg.sender?.avatar
                        ? <img src={msg.sender.avatar} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        : `${msg.sender?.prenom?.[0] || ''}${msg.sender?.nom?.[0] || ''}`
                      }
                    </div>
                    <div style={{ maxWidth: '60%' }}>
                      <div style={{ fontSize: '.75rem', fontWeight: 700, color: 'var(--grey-400)', marginBottom: 3, textAlign: isOwn ? 'right' : 'left' }}>
                        {isOwn ? 'Vous' : `${msg.sender?.prenom} ${msg.sender?.nom}`}
                      </div>
                      <div style={{
                        background: isOwn ? 'var(--primary)' : 'var(--grey-100)',
                        color: isOwn ? '#fff' : 'var(--dark)',
                        padding: '10px 14px',
                        borderRadius: isOwn ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        fontSize: '.9rem', lineHeight: 1.5
                      }}>
                        {msg.contenu}
                      </div>
                      <div style={{ fontSize: '.7rem', color: 'var(--grey-400)', marginTop: 3, textAlign: isOwn ? 'right' : 'left' }}>
                        {new Date(msg.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
              {typing && <p style={{ fontSize: '.8rem', color: 'var(--grey-400)', fontStyle: 'italic' }}>{typing}</p>}
              <div ref={messagesEndRef} />
            </div>

            <div style={{ padding: '16px 20px', borderTop: '1px solid var(--grey-200)', display: 'flex', gap: 10, alignItems: 'flex-end' }}>
              <textarea
                value={input}
                onChange={handleTyping}
                onKeyDown={handleKeyDown}
                placeholder="Écrire un message... (Entrée pour envoyer)"
                rows={1}
                style={{
                  flex: 1, padding: '10px 14px', border: '1.5px solid var(--grey-200)',
                  borderRadius: 24, fontSize: '.92rem', resize: 'none',
                  fontFamily: 'inherit', outline: 'none', maxHeight: 120, overflowY: 'auto'
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                style={{
                  width: 42, height: 42, borderRadius: '50%',
                  background: input.trim() ? 'var(--primary)' : 'var(--grey-200)',
                  border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                  color: '#fff', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background var(--transition)'
                }}
              >
                ➤
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EmptyState title="Sélectionnez un canal" message="Choisissez un canal dans la liste pour commencer à discuter." icon="💬" />
          </div>
        )}
      </div>
    </div>
  );
};
