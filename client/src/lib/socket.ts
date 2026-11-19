import { io, Socket } from 'socket.io-client';
import { getStoredUser, getToken } from './api';

let socketInstance: Socket | null = null;
const WS_URL = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

class MockSocket {
  private handlers: Record<string, ((...args: any[]) => void)[]> = {};
  public connected = true;
  public auth: any = {};

  on(event: string, handler: (...args: any[]) => void) {
    if (!this.handlers[event]) this.handlers[event] = [];
    this.handlers[event].push(handler);
    return this;
  }

  off(event: string, handler?: (...args: any[]) => void) {
    if (!handler) {
      delete this.handlers[event];
    } else if (this.handlers[event]) {
      this.handlers[event] = this.handlers[event].filter((h) => h !== handler);
    }
    return this;
  }

  emit(event: string, ...args: any[]) {
    const data = args[0] || {};
    const u = getStoredUser();

    // Simulate in-memory room events for demo/preview without backend
    setTimeout(() => {
      if (event === 'room:join') {
        this.trigger('room:state', {
          seats: [
            { index: 0, user: { id: 'u_h', displayName: 'Madina 🎵', avatar: '/assets/avatar-madina.jpg' }, muted: false },
            { index: 1, user: null, muted: false },
            { index: 2, user: null, muted: false },
            { index: 3, user: null, muted: false },
            { index: 4, user: null, muted: false },
            { index: 5, user: null, muted: false },
            { index: 6, user: null, muted: false },
            { index: 7, user: null, muted: false },
          ],
          viewers: [
            { id: 'v1', displayName: 'Abrorbek (VIP)', avatar: '/assets/avatar-abrorbek.jpg' },
            { id: 'v2', displayName: 'Laylo', avatar: '/assets/avatar-laylo.jpg' },
          ],
          pk: {
            active: true,
            blueScore: 1840,
            redScore: 2150,
            remainingSeconds: 145,
          },
        });
      } else if (event === 'room:chat') {
        this.trigger('room:chat', {
          id: `msg_${Date.now()}`,
          user: u || { displayName: 'Mehmon', avatar: '/assets/avatar-abrorbek.jpg' },
          text: data.text || '',
          createdAt: new Date().toISOString(),
        });
      } else if (event === 'room:gift') {
        this.trigger('room:gift', {
          sender: u || { displayName: 'VIP Mehmon', avatar: '/assets/avatar-abrorbek.jpg' },
          gift: data.gift,
          combo: 1,
        });
      } else if (event === 'room:reaction') {
        this.trigger('room:reaction', {
          userId: u?.id || 'guest',
          user: u,
          type: data.type,
          value: data.value,
        });
      } else if (event === 'room:take_seat') {
        this.trigger('room:seat_update', {
          index: data.index,
          user: u,
        });
      } else if (event === 'room:leave_seat') {
        this.trigger('room:seat_update', {
          index: data.index,
          user: null,
        });
      } else if (event === 'ludo:roll') {
        this.trigger('ludo:rolled', {
          value: Math.floor(Math.random() * 6) + 1,
          player: u?.displayName || 'Siz',
        });
      } else if (event === 'draw:stroke') {
        this.trigger('draw:stroke', data);
      }
    }, 40);

    return this;
  }

  private trigger(event: string, ...args: any[]) {
    const list = this.handlers[event];
    if (list) {
      list.forEach((cb) => {
        try {
          cb(...args);
        } catch {
          // ignore callback error
        }
      });
    }
  }

  connect() {
    this.connected = true;
    return this;
  }

  disconnect() {
    this.connected = false;
    return this;
  }
}

export function getSocket(): Socket {
  const isLocal = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  
  // If no backend URL configured and not on localhost: use virtual mock socket
  if (!WS_URL && !isLocal) {
    if (!socketInstance) {
      socketInstance = new MockSocket() as unknown as Socket;
    }
    return socketInstance;
  }

  const token = getToken();
  if (socketInstance && socketInstance.connected) {
    return socketInstance;
  }
  if (socketInstance) {
    socketInstance.auth = { token };
    socketInstance.connect();
    return socketInstance;
  }

  socketInstance = io(WS_URL || '/', {
    auth: { token },
    transports: ['websocket', 'polling'],
    autoConnect: true,
    reconnectionAttempts: 3,
  });
  return socketInstance;
}

export function resetSocket(): void {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
