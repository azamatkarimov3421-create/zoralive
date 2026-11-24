import { io, Socket } from 'socket.io-client';
import { getStoredUser, getToken, setStoredUser } from './api';
import { DEMO_USERS, MOCK_GIFTS, MOCK_ROOMS } from './mockData';
import { sendRoomMessageToSupabase, sendGiftInSupabase } from './supabaseSync';
import { LudoGameState, PkState, SeatState } from '../types';

let socketInstance: Socket | null = null;
const WS_URL = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const RPS_FACES = ['✊ Tosh', '✌️ Qaychi', '✋ Qog‘oz'];

class MockSocket {
  private handlers: Record<string, ((...args: any[]) => void)[]> = {};
  public connected = true;
  public auth: any = {};

  private currentSeats: SeatState[] = [];
  private roomTotalGifts = 18400;
  private activePk: PkState | null = null;
  private activeBox: any = null;
  private ludoGame: LudoGameState | null = null;

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
    const u = getStoredUser() || DEMO_USERS.user;

    setTimeout(() => {
      if (event === 'room:join') {
        const room = MOCK_ROOMS.find((r) => r.id === data.roomId) || MOCK_ROOMS[0];
        this.roomTotalGifts = room.totalGifts || 18400;
        const seatCount = room.seatCount || 8;
        this.currentSeats = Array.from({ length: seatCount }, (_, idx) => {
          if (idx === 0) {
            return {
              index: 0,
              userId: room.hostId,
              socketId: 'bot-host',
              displayName: room.hostName,
              avatar: room.hostAvatar,
              frame: room.hostFrame || 'frame-gold-1',
              vipLevel: room.hostVip || 10,
              isMuted: false,
              isLocked: false,
              isSpeaking: true,
              isDemoBot: true,
            };
          }
          if (idx === 1) {
            return {
              index: 1,
              userId: DEMO_USERS.laylo.id,
              socketId: 'bot-1',
              displayName: DEMO_USERS.laylo.displayName,
              avatar: DEMO_USERS.laylo.avatar,
              frame: DEMO_USERS.laylo.activeFrame,
              vipLevel: DEMO_USERS.laylo.vipLevel,
              isMuted: false,
              isLocked: false,
              isSpeaking: false,
              isDemoBot: true,
            };
          }
          if (idx === 2) {
            return {
              index: 2,
              userId: DEMO_USERS.agency.id,
              socketId: 'bot-2',
              displayName: DEMO_USERS.agency.displayName,
              avatar: DEMO_USERS.agency.avatar,
              frame: DEMO_USERS.agency.activeFrame,
              vipLevel: DEMO_USERS.agency.vipLevel,
              isMuted: false,
              isLocked: false,
              isSpeaking: false,
              isDemoBot: true,
            };
          }
          return {
            index: idx,
            userId: null,
            socketId: null,
            displayName: '',
            avatar: '',
            frame: '',
            vipLevel: 0,
            isMuted: false,
            isLocked: false,
            isSpeaking: false,
          };
        });

        this.activePk = room.hasPk
          ? {
              active: true,
              leftHostId: room.hostId,
              leftName: room.hostName,
              leftAvatar: room.hostAvatar,
              leftScore: 4800,
              rightHostId: DEMO_USERS.laylo.id,
              rightName: DEMO_USERS.laylo.displayName,
              rightAvatar: DEMO_USERS.laylo.avatar,
              rightScore: 4250,
              endsAt: Date.now() + 180 * 1000,
              durationSec: 180,
              winner: null,
            }
          : null;

        this.trigger('room:state', {
          seats: this.currentSeats,
          viewerCount: room.viewerCount || 142,
          viewers: Object.values(DEMO_USERS).map((x) => ({
            id: x.id,
            displayName: x.displayName,
            avatar: x.avatar,
            vipLevel: x.vipLevel,
            frame: x.activeFrame,
          })),
          topGifters: [
            { id: DEMO_USERS.admin.id, displayName: DEMO_USERS.admin.displayName, avatar: DEMO_USERS.admin.avatar, total: 19999 },
            { id: u.id, displayName: u.displayName, avatar: u.avatar, total: 8888 },
            { id: DEMO_USERS.agency.id, displayName: DEMO_USERS.agency.displayName, avatar: DEMO_USERS.agency.avatar, total: 5200 },
          ],
          messages: [
            {
              id: `sys_${Date.now()}`,
              type: 'SYSTEM',
              text: `✨ ${u.displayName} xonaga kirdi! Ajdarholar va sovg‘alar tayyor 🐉`,
              createdAt: new Date().toISOString(),
            },
          ],
          totalGifts: this.roomTotalGifts,
          notice: `Xush kelibsiz! ${room.title}`,
          luckyBox: this.activeBox,
          pk: this.activePk,
        });

        // Trigger equipped Dragon / VIP Entry Banner!
        if (u.activeRide) {
          setTimeout(() => {
            this.trigger('room:entry_ride', {
              displayName: u.displayName,
              avatar: u.avatar,
              vipLevel: u.vipLevel || 4,
              rideCode: u.activeRide,
            });
          }, 350);
        }
      } else if (event === 'seat:take') {
        const idx = Number(data.seatIndex);
        this.currentSeats = this.currentSeats.map((s) => {
          if (s.userId === u.id) {
            return { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false };
          }
          if (s.index === idx && !s.userId && !s.isLocked) {
            return {
              ...s,
              userId: u.id,
              socketId: 'local-me',
              displayName: u.displayName,
              avatar: u.avatar,
              frame: u.activeFrame || 'frame-gold-1',
              vipLevel: u.vipLevel || 4,
              isMuted: false,
              isSpeaking: true,
            };
          }
          return s;
        });
        this.trigger('room:seats', [...this.currentSeats]);
      } else if (event === 'seat:leave') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.userId === u.id
            ? { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false }
            : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
      } else if (event === 'seat:mute') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.userId === u.id ? { ...s, isMuted: Boolean(data.muted), isSpeaking: !data.muted } : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
      } else if (event === 'seat:lock') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.index === Number(data.seatIndex) ? { ...s, isLocked: !s.isLocked } : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
      } else if (event === 'seat:kick') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.index === Number(data.seatIndex)
            ? { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false }
            : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
      } else if (event === 'room:chat') {
        sendRoomMessageToSupabase(data.roomId || 'room_madina', u, String(data.text || ''));
        this.trigger('room:message', {
          id: `msg_${Date.now()}`,
          type: 'CHAT',
          userId: u.id,
          displayName: u.displayName,
          avatar: u.avatar,
          wealthLevel: u.wealthLevel,
          vipLevel: u.vipLevel,
          bubble: u.activeBubble || '',
          text: String(data.text || ''),
          createdAt: new Date().toISOString(),
        });
      } else if (event === 'room:gift') {
        const gift = MOCK_GIFTS.find((g) => g.id === data.giftId) || MOCK_GIFTS[0];
        const qty = Math.max(1, Number(data.quantity || 1));
        const totalCost = gift.price * qty;
        if (u.coins < totalCost) {
          this.trigger('room:error', { message: 'Tangalar yetarli emas — Hamyondan to‘ldiring' });
          return;
        }
        const nextCoins = u.coins - totalCost;
        setStoredUser({ ...u, coins: nextCoins });
        sendGiftInSupabase(
          u,
          data.receiverId || 'user_host_1',
          { id: gift.id, nameUz: gift.name_uz, price: gift.price, diamondsAward: gift.price / 2 },
          qty,
          data.roomId || 'room_madina'
        );
        this.roomTotalGifts += totalCost;

        const targetSeat = this.currentSeats.find((s) => s.userId === data.receiverId);
        const receiverName = targetSeat?.displayName || this.currentSeats[0]?.displayName || 'Host';

        this.trigger('wallet:updated', { coins: nextCoins });
        this.trigger('room:gift_received', {
          id: `g_${Date.now()}`,
          giftId: gift.id,
          giftName: gift.name_uz,
          giftIcon: gift.icon,
          effectType: gift.effect_type,
          accentColor: gift.accent_color,
          category: gift.category,
          quantity: qty,
          totalCost,
          senderId: u.id,
          senderName: u.displayName,
          senderAvatar: u.avatar,
          senderVip: u.vipLevel,
          receiverId: data.receiverId || 'host',
          receiverName,
          roomTotalGifts: this.roomTotalGifts,
        });
        this.trigger('room:message', {
          id: `gmsg_${Date.now()}`,
          type: 'GIFT',
          text: `${u.displayName} → ${receiverName}: ${gift.icon} ${gift.name_uz} ×${qty}`,
          createdAt: new Date().toISOString(),
        });

        if (this.activePk?.active) {
          if (data.pkSide === 'right') this.activePk.rightScore += totalCost;
          else this.activePk.leftScore += totalCost;
          this.trigger('pk:update', { ...this.activePk });
        }
      } else if (event === 'seat:reaction') {
        const mySeat = this.currentSeats.find((s) => s.userId === u.id);
        let emoji = data.emoji || '🔥';
        if (data.kind === 'dice') emoji = DICE_FACES[Math.floor(Math.random() * 6)];
        if (data.kind === 'rps') emoji = RPS_FACES[Math.floor(Math.random() * 3)];
        this.trigger('seat:reaction', {
          id: `react_${Date.now()}`,
          seatIndex: mySeat ? mySeat.index : -1,
          emoji,
          displayName: u.displayName,
        });
      } else if (event === 'room:sfx') {
        this.trigger('room:sfx', { effect: data.effect || 'applause', senderName: u.displayName });
      } else if (event === 'room:theme') {
        this.trigger('room:theme_changed', { theme: data.theme || 'light' });
      } else if (event === 'room:notice') {
        this.trigger('room:notice_changed', { notice: data.notice || '' });
      } else if (event === 'room:lucky_box_drop') {
        const totalCoins = Number(data.totalCoins || 500);
        if (u.coins < totalCoins) {
          this.trigger('room:error', { message: 'Tangalar yetarli emas' });
          return;
        }
        const nextCoins = u.coins - totalCoins;
        setStoredUser({ ...u, coins: nextCoins });
        this.trigger('wallet:updated', { coins: nextCoins });
        this.activeBox = {
          id: `box_${Date.now()}`,
          totalCoins,
          remainingSlots: Number(data.slots || 5),
          claimedUserIds: [],
        };
        this.trigger('room:lucky_box', { ...this.activeBox });
      } else if (event === 'room:lucky_box_claim') {
        if (!this.activeBox || this.activeBox.remainingSlots <= 0) return;
        const reward = Math.max(50, Math.round(this.activeBox.totalCoins / Math.max(1, this.activeBox.remainingSlots)));
        const nextCoins = u.coins + reward;
        setStoredUser({ ...u, coins: nextCoins });
        this.activeBox.remainingSlots -= 1;
        this.activeBox.claimedUserIds.push(u.id);
        this.trigger('wallet:updated', { coins: nextCoins });
        this.trigger('room:lucky_box_claimed', { reward });
        this.trigger('room:lucky_box', this.activeBox.remainingSlots > 0 ? { ...this.activeBox } : null);
      } else if (event === 'pk:start') {
        this.activePk = {
          active: true,
          leftHostId: u.id,
          leftName: u.displayName,
          leftAvatar: u.avatar,
          leftScore: 0,
          rightHostId: DEMO_USERS.host.id,
          rightName: DEMO_USERS.host.displayName,
          rightAvatar: DEMO_USERS.host.avatar,
          rightScore: 0,
          endsAt: Date.now() + 180 * 1000,
          durationSec: 180,
          winner: null,
        };
        this.trigger('pk:update', { ...this.activePk });
      } else if (event === 'dm:send') {
        this.trigger('dm:received', {
          id: `dm_${Date.now()}`,
          sender_id: u.id,
          receiver_id: data.receiverId,
          content: String(data.content || ''),
          created_at: new Date().toISOString(),
        });
      } else if (event === 'ludo:create') {
        const fee = Number(data.entryFee || 100);
        const count = Number(data.playerCount || 4);
        const colors: Array<'red' | 'green' | 'yellow' | 'blue'> = ['red', 'green', 'yellow', 'blue'];
        const bots = [DEMO_USERS.host, DEMO_USERS.laylo, DEMO_USERS.agency];
        this.ludoGame = {
          gameId: `ludo_${Date.now()}`,
          roomId: data.roomId,
          status: 'PLAYING',
          entryFee: fee,
          pot: fee * count,
          players: Array.from({ length: count }, (_, i) =>
            i === 0
              ? { id: u.id, name: u.displayName, avatar: u.avatar, color: colors[0], isBot: false, tokens: [-1, -1, -1, -1] }
              : {
                  id: bots[(i - 1) % bots.length].id,
                  name: bots[(i - 1) % bots.length].displayName,
                  avatar: bots[(i - 1) % bots.length].avatar,
                  color: colors[i],
                  isBot: true,
                  tokens: [-1, -1, -1, -1],
                }
          ),
          turnIndex: 0,
          dice: null,
          phase: 'ROLL',
          validMoves: [],
          winnerId: null,
          winnerName: null,
          lastEvent: 'O‘yin boshlandi! Zarikni tashlang 🎲',
          updatedAt: Date.now(),
        };
        this.trigger('ludo:state', { ...this.ludoGame });
      } else if (event === 'ludo:roll' && this.ludoGame) {
        const g = this.ludoGame;
        const dice = Math.floor(Math.random() * 6) + 1;
        const p = g.players[g.turnIndex];
        const valid = p.tokens
          .map((pos, idx) => (pos === -1 ? (dice === 6 ? idx : -1) : pos + dice <= 56 ? idx : -1))
          .filter((i) => i >= 0);
        g.dice = dice;
        if (valid.length === 0) {
          g.lastEvent = `${p.name} ${dice} tashladi — yurish yo‘q`;
          g.turnIndex = (g.turnIndex + 1) % g.players.length;
          g.phase = 'ROLL';
          g.validMoves = [];
          this.trigger('ludo:state', { ...g });
          this.runBotTurn();
        } else {
          g.phase = 'MOVE';
          g.validMoves = valid;
          g.lastEvent = `${p.name} ${dice} tashladi! Toshni tanlang`;
          this.trigger('ludo:state', { ...g });
        }
      } else if (event === 'ludo:move' && this.ludoGame) {
        const g = this.ludoGame;
        const p = g.players[g.turnIndex];
        const idx = Number(data.tokenIndex);
        const dice = g.dice || 1;
        if (p.tokens[idx] === -1 && dice === 6) p.tokens[idx] = 0;
        else if (p.tokens[idx] >= 0) p.tokens[idx] = Math.min(56, p.tokens[idx] + dice);
        g.phase = 'ROLL';
        g.validMoves = [];
        g.lastEvent = `${p.name} toshini yurdi`;
        if (p.tokens.every((t) => t === 56)) {
          g.status = 'FINISHED';
          g.winnerId = p.id;
          g.winnerName = p.name;
          g.lastEvent = `🏆 ${p.name} g‘olib bo‘ldi!`;
        } else if (dice !== 6) {
          g.turnIndex = (g.turnIndex + 1) % g.players.length;
        }
        this.trigger('ludo:state', { ...g });
        this.runBotTurn();
      }
    }, 35);

    return this;
  }

  private runBotTurn() {
    if (!this.ludoGame || this.ludoGame.status !== 'PLAYING') return;
    const g = this.ludoGame;
    const p = g.players[g.turnIndex];
    if (!p?.isBot) return;
    setTimeout(() => {
      if (!this.ludoGame || this.ludoGame.status !== 'PLAYING') return;
      const dice = Math.floor(Math.random() * 6) + 1;
      const valid = p.tokens
        .map((pos, idx) => (pos === -1 ? (dice === 6 ? idx : -1) : pos + dice <= 56 ? idx : -1))
        .filter((i) => i >= 0);
      g.dice = dice;
      if (valid.length > 0) {
        const pick = valid[0];
        if (p.tokens[pick] === -1 && dice === 6) p.tokens[pick] = 0;
        else p.tokens[pick] = Math.min(56, p.tokens[pick] + dice);
        g.lastEvent = `${p.name} ${dice} tashlab yurdi`;
      } else {
        g.lastEvent = `${p.name} ${dice} tashladi`;
      }
      if (dice !== 6) g.turnIndex = (g.turnIndex + 1) % g.players.length;
      g.phase = 'ROLL';
      g.validMoves = [];
      this.trigger('ludo:state', { ...g });
      this.runBotTurn();
    }, 650);
  }

  private trigger(event: string, ...args: any[]) {
    const list = this.handlers[event];
    if (list) {
      list.forEach((cb) => {
        try {
          cb(...args);
        } catch {
          // ignore
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
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

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
