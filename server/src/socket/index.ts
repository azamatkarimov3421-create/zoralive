import { Server as HttpServer } from 'node:http';
import { Server, Socket } from 'socket.io';
import { v4 as uuid } from 'uuid';
import { db } from '../db/database';
import { verifyToken } from '../middleware/auth';
import { calculateLevel } from '../services/level';
import { creditCoins, debitCoins, processGiftTransfer } from '../services/economy';
import { liveRoomMetrics } from '../routes/rooms';
import {
  LudoGameState,
  createLudoGame,
  addLudoPlayer,
  fillWithBotsAndStart,
  rollLudoDice,
  moveLudoToken,
  chooseBotToken,
} from '../services/ludo';

interface SeatState {
  index: number;
  userId: string | null;
  socketId: string | null;
  displayName: string;
  avatar: string;
  frame: string;
  vipLevel: number;
  isMuted: boolean;
  isLocked: boolean;
  isSpeaking: boolean;
  isDemoBot?: boolean;
}

interface PkState {
  active: boolean;
  leftHostId: string;
  leftName: string;
  leftAvatar: string;
  leftScore: number;
  rightHostId: string;
  rightName: string;
  rightAvatar: string;
  rightScore: number;
  endsAt: number;
  durationSec: number;
  winner: 'left' | 'right' | 'draw' | null;
}

interface RoomChatMessage {
  id: string;
  type: 'CHAT' | 'SYSTEM' | 'GIFT';
  userId?: string;
  displayName?: string;
  avatar?: string;
  wealthLevel?: number;
  vipLevel?: number;
  bubble?: string;
  text: string;
  createdAt: string;
}

interface LuckyBoxState {
  id: string;
  senderName: string;
  totalCoins: number;
  remainingCoins: number;
  totalSlots: number;
  remainingSlots: number;
  claimedUserIds: string[];
  expiresAt: number;
}

interface DrawState {
  active: boolean;
  drawerId: string;
  drawerName: string;
  word: string;
  hint: string;
  solvedBy: string | null;
}

interface LiveRoomState {
  roomId: string;
  hostId: string;
  theme: string;
  notice: string;
  seatCount: number;
  seats: SeatState[];
  viewers: Map<string, { socketId: string; userId: string; displayName: string; avatar: string; vipLevel: number; frame: string }>;
  gifters: Map<string, { userId: string; displayName: string; avatar: string; total: number }>;
  messages: RoomChatMessage[];
  pk: PkState | null;
  luckyBox: LuckyBoxState | null;
  draw: DrawState | null;
  pkTimer?: NodeJS.Timeout;
  pkBotTimer?: NodeJS.Timeout;
}

const DRAW_WORDS = [
  'Olma', 'Quyosh', 'Mashina', 'Uy', 'Mushuk', 'Telefon', 'Samolyot',
  'Gitara', 'Yulduz', 'Daraxt', 'Dengiz', 'Toj', 'Soat', 'Kitob', 'Gul', 'Baliq',
];

const roomsMap = new Map<string, LiveRoomState>();
const ludoGames = new Map<string, LudoGameState>();
const recentJoinAnnounce = new Map<string, number>();

function buildInitialSeats(roomRow: Record<string, any>): SeatState[] {
  const count = Math.max(4, Math.min(12, Number(roomRow.seat_count) || 8));
  const seats: SeatState[] = [];
  const host = db.prepare('SELECT * FROM users WHERE id = ?').get(roomRow.host_id);

  for (let i = 0; i < count; i++) {
    if (i === 0 && host) {
      seats.push({
        index: 0,
        userId: host.id,
        socketId: null,
        displayName: host.display_name,
        avatar: host.avatar,
        frame: host.active_frame || '',
        vipLevel: host.vip_level || 0,
        isMuted: false,
        isLocked: false,
        isSpeaking: false,
        isDemoBot: Boolean(host.is_demo),
      });
    } else {
      seats.push({
        index: i,
        userId: null,
        socketId: null,
        displayName: '',
        avatar: '',
        frame: '',
        vipLevel: 0,
        isMuted: false,
        isLocked: false,
        isSpeaking: false,
      });
    }
  }

  // Pre-populate 2 friendly demo guests on demo VOICE/GAME rooms so the party feels alive immediately
  if (roomRow.type !== 'VIDEO' && host?.is_demo && count >= 6) {
    const guests = db
      .prepare('SELECT * FROM users WHERE is_demo = 1 AND id != ? AND role != ? LIMIT 2')
      .all(roomRow.host_id, 'ADMIN');
    guests.forEach((g, idx) => {
      seats[idx + 1] = {
        index: idx + 1,
        userId: g.id,
        socketId: null,
        displayName: g.display_name,
        avatar: g.avatar,
        frame: g.active_frame || '',
        vipLevel: g.vip_level || 0,
        isMuted: idx === 1,
        isLocked: false,
        isSpeaking: idx === 0,
        isDemoBot: true,
      };
    });
  }

  return seats;
}

function getOrCreateRoomState(roomId: string, fallbackHostId?: string): LiveRoomState | null {
  const existing = roomsMap.get(roomId);
  if (existing) return existing;

  let row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
  if (!row) {
    // Support joining rooms stored in Supabase that aren't yet in local SQLite
    const hostUser =
      (fallbackHostId && db.prepare('SELECT * FROM users WHERE id = ?').get(fallbackHostId)) ||
      db.prepare('SELECT * FROM users LIMIT 1').get();
    if (!hostUser) return null;
    const maxNum = db.prepare('SELECT MAX(room_number) as m FROM rooms').get()?.m || 8900;
    db.prepare(`
      INSERT OR IGNORE INTO rooms (id, room_number, host_id, title, type, theme, cover, country, seat_count, is_live, created_at)
      VALUES (?, ?, ?, ?, 'VOICE', 'light', '/assets/stage-palace.jpg', 'UZ', 8, 1, ?)
    `).run(roomId, Number(maxNum) + 1, hostUser.id, `${hostUser.display_name} xonasi`, new Date().toISOString());
    row = db.prepare('SELECT * FROM rooms WHERE id = ?').get(roomId);
    if (!row) return null;
  }

  const state: LiveRoomState = {
    roomId,
    hostId: row.host_id,
    theme: row.theme || 'light',
    notice: row.notice || '',
    seatCount: Number(row.seat_count) || 8,
    seats: buildInitialSeats(row),
    viewers: new Map(),
    gifters: new Map(),
    messages: [
      {
        id: uuid(),
        type: 'SYSTEM',
        text: 'Xonaga xush kelibsiz',
        createdAt: new Date().toISOString(),
      },
    ],
    pk: null,
    luckyBox: null,
    draw: null,
  };
  roomsMap.set(roomId, state);
  return state;
}

function syncRoomMetrics(state: LiveRoomState) {
  const occupiedSeats = state.seats.filter((s) => Boolean(s.userId)).length;
  liveRoomMetrics.set(state.roomId, {
    viewers: state.viewers.size,
    hasPk: Boolean(state.pk?.active),
    occupiedSeats,
  });
}

function serializeRoom(state: LiveRoomState) {
  const row = db.prepare('SELECT total_gifts, viewer_boost FROM rooms WHERE id = ?').get(state.roomId);
  const topGifters = Array.from(state.gifters.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 15);
  return {
    roomId: state.roomId,
    theme: state.theme,
    notice: state.notice,
    seats: state.seats,
    viewerCount: (row?.viewer_boost || 0) + state.viewers.size,
    viewers: Array.from(state.viewers.values()),
    topGifters,
    messages: state.messages.slice(-40),
    totalGifts: row?.total_gifts || 0,
    pk: state.pk,
    luckyBox: state.luckyBox && state.luckyBox.remainingSlots > 0 ? state.luckyBox : null,
    draw: state.draw ? { ...state.draw, word: undefined } : null,
  };
}

export function attachSocketServer(httpServer: HttpServer, corsOrigin: string) {
  const io = new Server(httpServer, {
    cors: {
      origin: corsOrigin === '*' ? true : [corsOrigin, 'http://localhost:5173', 'http://127.0.0.1:5173'],
      credentials: true,
    },
  });

  // Gentle ambient speaking simulation for demo bots in active voice rooms
  setInterval(() => {
    for (const state of roomsMap.values()) {
      if (state.viewers.size === 0) continue;
      let changed = false;
      for (const s of state.seats) {
        if (s.isDemoBot && !s.isMuted) {
          const next = Math.random() > 0.55;
          if (s.isSpeaking !== next) {
            s.isSpeaking = next;
            changed = true;
          }
        }
      }
      if (changed) {
        io.to(`room:${state.roomId}`).emit('room:seats', state.seats);
      }
    }
  }, 2200);

  io.use((socket, next) => {
    const token = String(socket.handshake.auth?.token || '');
    const decoded = verifyToken(token);
    if (!decoded) {
      next(new Error('Unauthorized'));
      return;
    }
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(decoded.userId);
    if (!user || user.is_banned) {
      next(new Error('Unauthorized'));
      return;
    }
    socket.data.userId = user.id;
    next();
  });

  function getFreshUser(userId: string) {
    return db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  }

  function scheduleLudoBotTurn(gameId: string) {
    const game = ludoGames.get(gameId);
    if (!game || game.status !== 'PLAYING') return;
    const current = game.players[game.turnIndex];
    if (!current || !current.isBot) return;

    setTimeout(() => {
      const g = ludoGames.get(gameId);
      if (!g || g.status !== 'PLAYING') return;
      const activePlayer = g.players[g.turnIndex];
      if (!activePlayer || !activePlayer.isBot) return;

      const rolled = rollLudoDice(g, activePlayer.id);
      io.to(`ludo:${gameId}`).emit('ludo:state', rolled.state);

      if (rolled.autoSkipped) {
        scheduleLudoBotTurn(gameId);
        return;
      }

      setTimeout(() => {
        const g2 = ludoGames.get(gameId);
        if (!g2 || g2.status !== 'PLAYING' || g2.phase !== 'MOVE') return;
        const tokenIdx = chooseBotToken(g2);
        const moved = moveLudoToken(g2, activePlayer.id, tokenIdx);
        io.to(`ludo:${gameId}`).emit('ludo:state', moved.state);

        if (!moved.finished) {
          scheduleLudoBotTurn(gameId);
        }
      }, 650);
    }, 700);
  }

  io.on('connection', (socket: Socket) => {
    const userId: string = socket.data.userId;
    socket.join(`user:${userId}`);

    let currentRoomId: string | null = null;

    function leaveCurrentRoom() {
      if (!currentRoomId) return;
      const state = roomsMap.get(currentRoomId);
      if (state) {
        state.viewers.delete(socket.id);
        let seatsChanged = false;
        for (const s of state.seats) {
          if (s.socketId === socket.id && !s.isDemoBot) {
            s.userId = null;
            s.socketId = null;
            s.displayName = '';
            s.avatar = '';
            s.frame = '';
            s.vipLevel = 0;
            s.isSpeaking = false;
            seatsChanged = true;
          }
        }
        syncRoomMetrics(state);
        socket.leave(`room:${currentRoomId}`);
        io.to(`room:${currentRoomId}`).emit('rtc:peer_left', { socketId: socket.id });
        if (seatsChanged) {
          io.to(`room:${currentRoomId}`).emit('room:seats', state.seats);
        }
        io.to(`room:${currentRoomId}`).emit('room:viewers', {
          viewerCount: serializeRoom(state).viewerCount,
          viewers: Array.from(state.viewers.values()),
        });
      }
      currentRoomId = null;
    }

    socket.on('room:join', ({ roomId }: { roomId: string }) => {
      if (currentRoomId && currentRoomId !== roomId) {
        leaveCurrentRoom();
      }
      const user = getFreshUser(userId);
      const state = getOrCreateRoomState(roomId);
      if (!user || !state) {
        socket.emit('room:error', { message: 'Xona topilmadi' });
        return;
      }

      currentRoomId = roomId;
      socket.join(`room:${roomId}`);

      state.viewers.set(socket.id, {
        socketId: socket.id,
        userId: user.id,
        displayName: user.display_name,
        avatar: user.avatar,
        vipLevel: user.vip_level || 0,
        frame: user.active_frame || '',
      });

      // If the real host joins their own room, bind socketId to seat 0
      if (state.hostId === user.id && state.seats[0]) {
        state.seats[0].userId = user.id;
        state.seats[0].socketId = socket.id;
        state.seats[0].displayName = user.display_name;
        state.seats[0].avatar = user.avatar;
        state.seats[0].frame = user.active_frame || '';
        state.seats[0].vipLevel = user.vip_level || 0;
        state.seats[0].isDemoBot = false;
      }

      syncRoomMetrics(state);

      // Emit full room state to joining client
      socket.emit('room:state', serializeRoom(state));

      // Notify existing peers for WebRTC audio/video mesh
      const otherSocketIds = Array.from(state.viewers.keys()).filter((sid) => sid !== socket.id);
      socket.emit('rtc:peers', { peers: otherSocketIds });

      // Broadcast entry message + VIP/Entry Ride animation (throttled per user+room to avoid StrictMode double-join)
      const joinKey = `${roomId}:${user.id}`;
      const lastAnnounce = recentJoinAnnounce.get(joinKey) || 0;
      const nowMs = Date.now();
      if (nowMs - lastAnnounce > 4000) {
        recentJoinAnnounce.set(joinKey, nowMs);
        const joinMsg: RoomChatMessage = {
          id: uuid(),
          type: 'SYSTEM',
          userId: user.id,
          displayName: user.display_name,
          vipLevel: user.vip_level || 0,
          text: `${user.display_name} xonaga kirdi ✨`,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(joinMsg);
        if (state.messages.length > 60) state.messages.shift();
        io.to(`room:${roomId}`).emit('room:message', joinMsg);

        if (user.active_ride || Number(user.vip_level) > 0) {
          io.to(`room:${roomId}`).emit('room:entry_ride', {
            userId: user.id,
            displayName: user.display_name,
            avatar: user.avatar,
            vipLevel: user.vip_level || 0,
            rideCode: user.active_ride || 'ride-lambo',
          });
        }
      }

      io.to(`room:${roomId}`).emit('room:viewers', {
        viewerCount: serializeRoom(state).viewerCount,
        viewers: Array.from(state.viewers.values()),
      });
    });

    socket.on('room:leave', () => {
      leaveCurrentRoom();
    });

    socket.on('seat:take', ({ roomId, seatIndex }: { roomId: string; seatIndex: number }) => {
      const state = roomsMap.get(roomId);
      const user = getFreshUser(userId);
      if (!state || !user) return;
      const seat = state.seats[seatIndex];
      if (!seat || seat.isLocked) {
        socket.emit('room:error', { message: 'Bu mikrofon o‘rni qulflangan' });
        return;
      }
      if (seat.userId && seat.userId !== user.id) {
        socket.emit('room:error', { message: 'Bu o‘rin band' });
        return;
      }

      // Remove from previous seat if seated elsewhere
      for (const s of state.seats) {
        if (s.userId === user.id && s.index !== seatIndex) {
          s.userId = null;
          s.socketId = null;
          s.displayName = '';
          s.avatar = '';
          s.frame = '';
          s.vipLevel = 0;
          s.isSpeaking = false;
        }
      }

      seat.userId = user.id;
      seat.socketId = socket.id;
      seat.displayName = user.display_name;
      seat.avatar = user.avatar;
      seat.frame = user.active_frame || '';
      seat.vipLevel = user.vip_level || 0;
      seat.isMuted = false;
      seat.isDemoBot = false;

      syncRoomMetrics(state);
      io.to(`room:${roomId}`).emit('room:seats', state.seats);
    });

    socket.on('seat:leave', ({ roomId }: { roomId: string }) => {
      const state = roomsMap.get(roomId);
      if (!state) return;
      for (const s of state.seats) {
        if (s.userId === userId && s.index !== 0) {
          s.userId = null;
          s.socketId = null;
          s.displayName = '';
          s.avatar = '';
          s.frame = '';
          s.vipLevel = 0;
          s.isSpeaking = false;
        }
      }
      syncRoomMetrics(state);
      io.to(`room:${roomId}`).emit('room:seats', state.seats);
    });

    socket.on('seat:mute', ({ roomId, muted }: { roomId: string; muted: boolean }) => {
      const state = roomsMap.get(roomId);
      if (!state) return;
      for (const s of state.seats) {
        if (s.userId === userId) {
          s.isMuted = Boolean(muted);
          if (muted) s.isSpeaking = false;
        }
      }
      io.to(`room:${roomId}`).emit('room:seats', state.seats);
    });

    socket.on('seat:speaking', ({ roomId, speaking }: { roomId: string; speaking: boolean }) => {
      const state = roomsMap.get(roomId);
      if (!state) return;
      for (const s of state.seats) {
        if (s.userId === userId && !s.isMuted) {
          s.isSpeaking = Boolean(speaking);
        }
      }
      io.to(`room:${roomId}`).emit('room:seats', state.seats);
    });

    socket.on(
      'seat:moderate',
      ({ roomId, seatIndex, action }: { roomId: string; seatIndex: number; action: 'lock' | 'unlock' | 'kick' | 'mute' }) => {
        const state = roomsMap.get(roomId);
        const actor = getFreshUser(userId);
        if (!state || !actor) return;
        if (state.hostId !== actor.id && actor.role !== 'ADMIN') {
          socket.emit('room:error', { message: 'Faqat xona egasi o‘rinlarni boshqara oladi' });
          return;
        }
        const seat = state.seats[seatIndex];
        if (!seat || seatIndex === 0) return;

        if (action === 'lock') {
          seat.isLocked = true;
          seat.userId = null;
          seat.socketId = null;
          seat.displayName = '';
          seat.avatar = '';
          seat.isDemoBot = false;
        } else if (action === 'unlock') {
          seat.isLocked = false;
        } else if (action === 'kick') {
          seat.userId = null;
          seat.socketId = null;
          seat.displayName = '';
          seat.avatar = '';
          seat.isDemoBot = false;
        } else if (action === 'mute') {
          seat.isMuted = !seat.isMuted;
          if (seat.isMuted) seat.isSpeaking = false;
        }

        syncRoomMetrics(state);
        io.to(`room:${roomId}`).emit('room:seats', state.seats);
      }
    );

    socket.on('room:theme', ({ roomId, theme }: { roomId: string; theme: string }) => {
      const state = roomsMap.get(roomId);
      if (!state) return;
      state.theme = theme;
      db.prepare('UPDATE rooms SET theme = ? WHERE id = ?').run(theme, roomId);
      io.to(`room:${roomId}`).emit('room:theme_changed', { theme });
    });

    socket.on('room:notice', ({ roomId, notice }: { roomId: string; notice: string }) => {
      const state = roomsMap.get(roomId);
      const actor = getFreshUser(userId);
      if (!state || !actor) return;
      if (state.hostId !== actor.id && actor.role !== 'ADMIN') return;
      const clean = String(notice || '').trim().slice(0, 120);
      state.notice = clean;
      db.prepare('UPDATE rooms SET notice = ? WHERE id = ?').run(clean, roomId);
      io.to(`room:${roomId}`).emit('room:notice_changed', { notice: clean });
    });

    socket.on('room:mute_all', ({ roomId }: { roomId: string }) => {
      const state = roomsMap.get(roomId);
      const actor = getFreshUser(userId);
      if (!state || !actor) return;
      if (state.hostId !== actor.id && actor.role !== 'ADMIN') return;
      for (const s of state.seats) {
        if (s.index !== 0 && s.userId) {
          s.isMuted = true;
          s.isSpeaking = false;
        }
      }
      io.to(`room:${roomId}`).emit('room:seats', state.seats);
    });

    // Seat Emoji / Dice / Rock-Paper-Scissors Reactions
    socket.on('seat:reaction', ({ roomId, kind, emoji }: { roomId: string; kind?: 'emoji' | 'dice' | 'rps'; emoji?: string }) => {
      const state = roomsMap.get(roomId);
      const user = getFreshUser(userId);
      if (!state || !user) return;
      const seat = state.seats.find((s) => s.userId === userId);
      let displayEmoji = String(emoji || '❤️').slice(0, 8);
      if (kind === 'dice') {
        const faces = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
        const roll = Math.floor(Math.random() * 6);
        displayEmoji = `${faces[roll]} ${roll + 1}`;
      } else if (kind === 'rps') {
        const picks = ['✊', '✋', '✌️'];
        displayEmoji = picks[Math.floor(Math.random() * 3)];
      }
      io.to(`room:${roomId}`).emit('seat:reaction', {
        id: uuid(),
        userId: user.id,
        displayName: user.display_name,
        seatIndex: seat ? seat.index : -1,
        emoji: displayEmoji,
      });
    });

    // DJ Soundboard FX synced across room
    socket.on('room:sfx', ({ roomId, effect }: { roomId: string; effect: string }) => {
      const user = getFreshUser(userId);
      if (!user) return;
      io.to(`room:${roomId}`).emit('room:sfx', {
        effect: String(effect || 'applause'),
        senderName: user.display_name,
      });
    });

    // Lucky Coin Box (Omad Sandig'i / Red Packet)
    socket.on('room:lucky_box_drop', ({ roomId, totalCoins, slots }: { roomId: string; totalCoins: number; slots: number }) => {
      try {
        const state = roomsMap.get(roomId);
        const user = getFreshUser(userId);
        if (!state || !user) return;
        const coins = Math.max(100, Math.min(20000, Math.floor(Number(totalCoins) || 200)));
        const count = Math.max(2, Math.min(20, Math.floor(Number(slots) || 5)));
        const res = debitCoins(user.id, coins, 'GIFT_SEND', `Omad sandig‘i (${coins} tanga / ${count} kishi)`, roomId);

        state.luckyBox = {
          id: uuid(),
          senderName: user.display_name,
          totalCoins: coins,
          remainingCoins: coins,
          totalSlots: count,
          remainingSlots: count,
          claimedUserIds: [],
          expiresAt: Date.now() + 5 * 60 * 1000,
        };
        socket.emit('wallet:updated', { coins: res.coins });
        io.to(`room:${roomId}`).emit('room:lucky_box', state.luckyBox);
        const note: RoomChatMessage = {
          id: uuid(),
          type: 'GIFT',
          text: `${user.display_name} ${coins} tangali Omad Sandig‘ini tashladi! (${count} kishi)`,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(note);
        io.to(`room:${roomId}`).emit('room:message', note);
      } catch (err: any) {
        socket.emit('room:error', { message: err.message });
      }
    });

    socket.on('room:lucky_box_claim', ({ roomId }: { roomId: string }) => {
      const state = roomsMap.get(roomId);
      const user = getFreshUser(userId);
      if (!state || !user || !state.luckyBox) return;
      const box = state.luckyBox;
      if (box.remainingSlots <= 0 || box.remainingCoins <= 0) {
        socket.emit('room:error', { message: 'Sandiq bo‘shab qoldi' });
        return;
      }
      if (box.claimedUserIds.includes(user.id)) {
        socket.emit('room:error', { message: 'Siz allaqachon oldingiz' });
        return;
      }

      const avg = box.remainingCoins / box.remainingSlots;
      const reward =
        box.remainingSlots === 1
          ? box.remainingCoins
          : Math.max(1, Math.min(box.remainingCoins - (box.remainingSlots - 1), Math.floor(avg * (0.5 + Math.random()))));

      box.remainingCoins -= reward;
      box.remainingSlots -= 1;
      box.claimedUserIds.push(user.id);

      const credited = creditCoins(user.id, reward, 'GAME_WIN', `Omad sandig‘idan yutuq (+${reward})`, roomId);
      socket.emit('wallet:updated', { coins: credited.coins });
      socket.emit('room:lucky_box_claimed', { reward });

      const note: RoomChatMessage = {
        id: uuid(),
        type: 'SYSTEM',
        text: `🎁 ${user.display_name} sandiqdan +${reward} tanga oldi`,
        createdAt: new Date().toISOString(),
      };
      state.messages.push(note);
      io.to(`room:${roomId}`).emit('room:message', note);

      if (box.remainingSlots <= 0) {
        state.luckyBox = null;
      }
      io.to(`room:${roomId}`).emit('room:lucky_box', state.luckyBox);
    });

    // Draw & Guess (Chiz va Top) Real-Time Canvas Game
    socket.on('draw:start', ({ roomId }: { roomId: string }) => {
      const state = roomsMap.get(roomId);
      const user = getFreshUser(userId);
      if (!state || !user) return;
      const word = DRAW_WORDS[Math.floor(Math.random() * DRAW_WORDS.length)];
      const hint = `${word[0]}${' _'.repeat(Math.max(1, word.length - 1))} (${word.length})`;
      state.draw = {
        active: true,
        drawerId: user.id,
        drawerName: user.display_name,
        word,
        hint,
        solvedBy: null,
      };
      // Send secret word ONLY to drawer, public hint to room
      socket.emit('draw:word', { word });
      io.to(`room:${roomId}`).emit('draw:state', { ...state.draw, word: undefined });
      io.to(`room:${roomId}`).emit('draw:clear');
    });

    socket.on('draw:stroke', ({ roomId, stroke }: { roomId: string; stroke: any }) => {
      socket.to(`room:${roomId}`).emit('draw:stroke', stroke);
    });

    socket.on('draw:clear', ({ roomId }: { roomId: string }) => {
      io.to(`room:${roomId}`).emit('draw:clear');
    });

    socket.on('draw:guess', ({ roomId, guess }: { roomId: string; guess: string }) => {
      const state = roomsMap.get(roomId);
      const user = getFreshUser(userId);
      if (!state || !user || !state.draw || !state.draw.active || state.draw.solvedBy) return;
      const g = String(guess || '').trim().toLowerCase();
      if (g === state.draw.word.toLowerCase()) {
        state.draw.solvedBy = user.display_name;
        state.draw.active = false;
        const w = creditCoins(user.id, 50, 'GAME_WIN', `Chiz va Top g‘alabasi: ${state.draw.word}`, roomId);
        socket.emit('wallet:updated', { coins: w.coins });
        io.to(`room:${roomId}`).emit('draw:solved', {
          winnerName: user.display_name,
          word: state.draw.word,
          reward: 50,
        });
        const note: RoomChatMessage = {
          id: uuid(),
          type: 'GIFT',
          text: `🎨 ${user.display_name} "${state.draw.word}" so‘zini topdi! (+50 🪙)`,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(note);
        io.to(`room:${roomId}`).emit('room:message', note);
      }
    });

    socket.on('room:chat', ({ roomId, text }: { roomId: string; text: string }) => {
      const state = roomsMap.get(roomId);
      const user = getFreshUser(userId);
      const clean = String(text || '').trim().slice(0, 260);
      if (!state || !user || !clean) return;

      const msg: RoomChatMessage = {
        id: uuid(),
        type: 'CHAT',
        userId: user.id,
        displayName: user.display_name,
        avatar: user.avatar,
        wealthLevel: calculateLevel(user.wealth_xp).level,
        vipLevel: user.vip_level || 0,
        bubble: user.active_bubble || '',
        text: clean,
        createdAt: new Date().toISOString(),
      };
      state.messages.push(msg);
      if (state.messages.length > 60) state.messages.shift();
      io.to(`room:${roomId}`).emit('room:message', msg);

      // Auto-check Draw & Guess answer from room chat
      if (state.draw?.active && !state.draw.solvedBy && clean.toLowerCase() === state.draw.word.toLowerCase()) {
        state.draw.solvedBy = user.display_name;
        state.draw.active = false;
        const w = creditCoins(user.id, 50, 'GAME_WIN', `Chiz va Top g‘alabasi: ${state.draw.word}`, roomId);
        socket.emit('wallet:updated', { coins: w.coins });
        io.to(`room:${roomId}`).emit('draw:solved', {
          winnerName: user.display_name,
          word: state.draw.word,
          reward: 50,
        });
        const winNote: RoomChatMessage = {
          id: uuid(),
          type: 'GIFT',
          text: `🎨 ${user.display_name} "${state.draw.word}" so‘zini topdi! (+50 🪙)`,
          createdAt: new Date().toISOString(),
        };
        state.messages.push(winNote);
        io.to(`room:${roomId}`).emit('room:message', winNote);
      }
    });

    socket.on(
      'room:gift',
      ({
        roomId,
        receiverId,
        giftId,
        quantity,
        pkSide,
      }: {
        roomId: string;
        receiverId: string;
        giftId: string;
        quantity: number;
        pkSide?: 'left' | 'right';
      }) => {
        try {
          const state = roomsMap.get(roomId);
          if (!state) return;
          const targetId = receiverId || state.hostId;
          const result = processGiftTransfer({
            senderId: userId,
            receiverId: targetId,
            giftId,
            quantity,
            roomId,
          });

          // Update PK Battle score if active
          if (state.pk?.active) {
            if (pkSide === 'right' || targetId === state.pk.rightHostId) {
              state.pk.rightScore += result.totalCost;
            } else {
              state.pk.leftScore += result.totalCost;
            }
            io.to(`room:${roomId}`).emit('pk:update', state.pk);
          }

          const roomRow = db.prepare('SELECT total_gifts FROM rooms WHERE id = ?').get(roomId);
          const giftEvent = {
            id: uuid(),
            giftId: result.gift.id,
            giftName: result.gift.name_uz,
            giftIcon: result.gift.icon,
            effectType: result.gift.effect_type,
            accentColor: result.gift.accent_color,
            category: result.gift.category,
            quantity: result.quantity,
            totalCost: result.totalCost,
            senderId: userId,
            senderName: result.senderName,
            senderAvatar: result.senderAvatar,
            senderVip: result.senderVip,
            receiverId: targetId,
            receiverName: result.receiverName,
            roomTotalGifts: roomRow?.total_gifts || 0,
          };

          const chatNote: RoomChatMessage = {
            id: uuid(),
            type: 'GIFT',
            userId,
            displayName: result.senderName,
            vipLevel: result.senderVip,
            text: `${result.senderName} -> ${result.receiverName} ga ${result.gift.icon} ${result.gift.name_uz} x${result.quantity} yubordi!`,
            createdAt: new Date().toISOString(),
          };
          state.messages.push(chatNote);

          // Track per-room top gifters
          const prevGifter = state.gifters.get(userId);
          state.gifters.set(userId, {
            userId,
            displayName: result.senderName,
            avatar: result.senderAvatar,
            total: (prevGifter?.total || 0) + result.totalCost,
          });
          const topGifters = Array.from(state.gifters.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 15);

          io.to(`room:${roomId}`).emit('room:gift_received', giftEvent);
          io.to(`room:${roomId}`).emit('room:top_gifters', topGifters);
          io.to(`room:${roomId}`).emit('room:message', chatNote);
          socket.emit('wallet:updated', { coins: result.senderCoins });
        } catch (err: any) {
          socket.emit('room:error', { message: err.message || 'Sovg‘a yuborilmadi' });
        }
      }
    );

    // PK Battle Controls
    socket.on('pk:start', ({ roomId, durationSec }: { roomId: string; durationSec?: number }) => {
      const state = roomsMap.get(roomId);
      if (!state) return;

      if (state.pkTimer) clearTimeout(state.pkTimer);
      if (state.pkBotTimer) clearInterval(state.pkBotTimer);

      const leftHost = db.prepare('SELECT * FROM users WHERE id = ?').get(state.hostId);
      const rival =
        db.prepare('SELECT * FROM users WHERE id != ? AND role = ? ORDER BY RANDOM() LIMIT 1').get(state.hostId, 'HOST') ||
        db.prepare('SELECT * FROM users WHERE id != ? LIMIT 1').get(state.hostId);

      const duration = Math.max(30, Math.min(300, Number(durationSec) || 90));
      state.pk = {
        active: true,
        leftHostId: leftHost?.id || state.hostId,
        leftName: leftHost?.display_name || 'Host',
        leftAvatar: leftHost?.avatar || '',
        leftScore: 0,
        rightHostId: rival?.id || 'rival-bot',
        rightName: rival?.display_name || 'Rival Star 🔥',
        rightAvatar: rival?.avatar || 'https://api.dicebear.com/9.x/avataaars/svg?seed=RivalStar',
        rightScore: 0,
        endsAt: Date.now() + duration * 1000,
        durationSec: duration,
        winner: null,
      };

      syncRoomMetrics(state);
      io.to(`room:${roomId}`).emit('pk:update', state.pk);

      // Light simulated rival audience gifts so solo testing feels dynamic & competitive
      state.pkBotTimer = setInterval(() => {
        if (!state.pk || !state.pk.active) return;
        if (Math.random() > 0.45) {
          state.pk.rightScore += [25, 50, 99, 150][Math.floor(Math.random() * 4)];
          io.to(`room:${roomId}`).emit('pk:update', state.pk);
        }
      }, 6500);

      state.pkTimer = setTimeout(() => {
        if (!state.pk || !state.pk.active) return;
        if (state.pkBotTimer) clearInterval(state.pkBotTimer);
        state.pk.active = false;
        state.pk.winner =
          state.pk.leftScore > state.pk.rightScore
            ? 'left'
            : state.pk.rightScore > state.pk.leftScore
            ? 'right'
            : 'draw';
        syncRoomMetrics(state);
        io.to(`room:${roomId}`).emit('pk:update', state.pk);
      }, duration * 1000);
    });

    socket.on('pk:stop', ({ roomId }: { roomId: string }) => {
      const state = roomsMap.get(roomId);
      if (!state || !state.pk) return;
      if (state.pkTimer) clearTimeout(state.pkTimer);
      if (state.pkBotTimer) clearInterval(state.pkBotTimer);
      state.pk = null;
      syncRoomMetrics(state);
      io.to(`room:${roomId}`).emit('pk:update', null);
    });

    // WebRTC Signaling (Voice & Video P2P)
    socket.on('rtc:offer', ({ to, sdp }: { to: string; sdp: any }) => {
      io.to(to).emit('rtc:offer', { from: socket.id, sdp });
    });

    socket.on('rtc:answer', ({ to, sdp }: { to: string; sdp: any }) => {
      io.to(to).emit('rtc:answer', { from: socket.id, sdp });
    });

    socket.on('rtc:ice', ({ to, candidate }: { to: string; candidate: any }) => {
      io.to(to).emit('rtc:ice', { from: socket.id, candidate });
    });

    // Ludo Multiplayer + AI Bots
    socket.on(
      'ludo:create',
      ({ entryFee, roomId, playerCount }: { entryFee?: number; roomId?: string; playerCount?: number }) => {
        const user = getFreshUser(userId);
        if (!user) return;
        const fee = [0, 50, 100, 500].includes(Number(entryFee)) ? Number(entryFee) : 100;
        if (fee > 0) {
          try {
            const res = debitCoins(user.id, fee, 'GAME_BET', `Ludo o‘yini kirish (${fee} tanga)`);
            socket.emit('wallet:updated', { coins: res.coins });
          } catch (err: any) {
            socket.emit('ludo:error', { message: err.message });
            return;
          }
        }

        const gameId = roomId ? `room-ludo-${roomId}` : `ludo-${uuid().slice(0, 6)}`;
        const game = createLudoGame(
          gameId,
          { id: user.id, name: user.display_name, avatar: user.avatar },
          fee,
          roomId
        );
        fillWithBotsAndStart(game, playerCount || 4);
        ludoGames.set(gameId, game);
        socket.join(`ludo:${gameId}`);
        io.to(`ludo:${gameId}`).emit('ludo:state', game);
      }
    );

    socket.on('ludo:join', ({ gameId }: { gameId: string }) => {
      const game = ludoGames.get(gameId);
      const user = getFreshUser(userId);
      if (!game || !user) return;
      socket.join(`ludo:${gameId}`);
      if (game.status === 'WAITING') {
        addLudoPlayer(game, { id: user.id, name: user.display_name, avatar: user.avatar });
      }
      io.to(`ludo:${gameId}`).emit('ludo:state', game);
    });

    socket.on('ludo:roll', ({ gameId }: { gameId: string }) => {
      const game = ludoGames.get(gameId);
      if (!game) return;
      const result = rollLudoDice(game, userId);
      io.to(`ludo:${gameId}`).emit('ludo:state', result.state);
      if (result.autoSkipped) {
        scheduleLudoBotTurn(gameId);
      }
    });

    socket.on('ludo:move', ({ gameId, tokenIndex }: { gameId: string; tokenIndex: number }) => {
      const game = ludoGames.get(gameId);
      if (!game) return;
      const result = moveLudoToken(game, userId, Number(tokenIndex));
      if (result.finished && result.state.winnerId === userId && result.state.pot > 0) {
        try {
          const w = creditCoins(userId, result.state.pot, 'GAME_WIN', `Ludo g‘alabasi (+${result.state.pot} tanga)`);
          socket.emit('wallet:updated', { coins: w.coins });
        } catch {
          // ignore
        }
      }
      io.to(`ludo:${gameId}`).emit('ludo:state', result.state);
      if (!result.finished) {
        scheduleLudoBotTurn(gameId);
      }
    });

    // Real-time 1v1 Direct Messaging
    socket.on('dm:send', ({ receiverId, content }: { receiverId: string; content: string }) => {
      const clean = String(content || '').trim().slice(0, 500);
      if (!clean || !receiverId) return;
      const id = uuid();
      const now = new Date().toISOString();
      db.prepare(
        `INSERT INTO direct_messages (id, sender_id, receiver_id, content, msg_type, created_at)
         VALUES (?, ?, ?, ?, 'TEXT', ?)`
      ).run(id, userId, receiverId, clean, now);

      const payload = {
        id,
        sender_id: userId,
        receiver_id: receiverId,
        content: clean,
        msg_type: 'TEXT',
        created_at: now,
      };
      io.to(`user:${receiverId}`).emit('dm:received', payload);
      socket.emit('dm:received', payload);
    });

    socket.on('disconnect', () => {
      leaveCurrentRoom();
    });
  });

  return io;
}
