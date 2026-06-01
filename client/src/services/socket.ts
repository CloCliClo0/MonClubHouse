import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    const token = localStorage.getItem('mch_access_token');
    socket = io('/', {
      auth: { token },
      transports: ['websocket', 'polling'],
      autoConnect: true
    });
    socket.on('connect', () => console.log('[Socket] connecté:', socket?.id));
    socket.on('disconnect', () => console.log('[Socket] déconnecté'));
    socket.on('error', (err: { message: string }) => console.error('[Socket] erreur:', err.message));
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
