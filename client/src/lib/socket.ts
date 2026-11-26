import { io, Socket } from 'socket.io-client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getStoredUser, getToken, setStoredUser } from './api';
import { MOCK_GIFTS } from './mockData';
import { supabase, isSupabaseConfigured } from './supabase';
import { fetchRoomByIdFromSupabase, sendGiftInSupabase, syncProfileToSupabase, saveDirectMessageToSupabase } from './supabaseSync';
import { LudoGameState, PkState, SeatState } from '../types';

let socketInstance: Socket | null = null;
const WS_URL = (import.meta.env.VITE_WS_URL || import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

const DICE_FACES = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
const RPS_FACES = ['✊ Tosh', '✌️ Qaychi', '✋ Qog‘oz'];

const TAB_SESSION_ID = Math.random().toString(36).slice(2, 8);

export function getMyPeerId(): string {
  const u = getStoredUser();
  return `${u?.id || 'guest'}_${TAB_SESSION_ID}`;
}

class SupabaseRealtimeSocket {
  private handlers: Record<string, ((...args: any[]) => void)[]> = {};
  public connected = true;
  public auth: any = {};

  private currentRoomId: string | null = null;
  private roomChannel: RealtimeChannel | null = null;
  private globalChannel: RealtimeChannel | null = null;

  private currentSeats: SeatState[] = [];
  private roomTotalGifts = 0;
  private activePk: PkState | null = null;
  private activeBox: any = null;
  private ludoGame: LudoGameState | null = null;
  private drawSecretWord = '';
  private drawState: any = null;
  private mySeatIndex: number | null = null;

  constructor() {
    this.ensureGlobalChannel();
  }

  private ensureGlobalChannel() {
    if (!isSupabaseConfigured || this.globalChannel) return;
    try {
      this.globalChannel = supabase.channel('zoralive:global', {
        config: { broadcast: { self: false } },
      });
      this.globalChannel
        .on('broadcast', { event: 'dm:msg' }, ({ payload }) => {
          const u = getStoredUser();
          if (!payload || !u) return;
          if (payload.receiver_id === u.id || payload.sender_id === u.id) {
            this.persistDmLocally(payload);
            this.trigger('dm:received', payload);
          }
        })
        .subscribe();
    } catch {
      // fallback safely to local
    }
  }

  private persistDmLocally(dmPayload: any) {
    try {
      const key = [dmPayload.sender_id, dmPayload.receiver_id].sort().join('__');
      const dmStore = JSON.parse(localStorage.getItem('zoralive_dms_v1') || '{}');
      const existing: any[] = dmStore[key] || [];
      if (!existing.some((m) => m.id === dmPayload.id)) {
        dmStore[key] = [...existing, dmPayload].slice(-60);
        localStorage.setItem('zoralive_dms_v1', JSON.stringify(dmStore));
      }
    } catch {
      // ignore
    }
  }

  private leaveCurrentRoomChannel() {
    if (this.roomChannel) {
      try {
        this.roomChannel.untrack();
        supabase.removeChannel(this.roomChannel);
      } catch {
        // ignore
      }
      this.roomChannel = null;
    }
    this.currentRoomId = null;
    this.mySeatIndex = null;
  }

  private broadcastRoom(event: string, payload: any) {
    if (!this.roomChannel) return;
    this.roomChannel
      .send({
        type: 'broadcast',
        event,
        payload,
      })
      .catch(() => {});
  }

  private syncPresenceMeta(extra: Record<string, any> = {}) {
    const u = getStoredUser();
    if (!this.roomChannel || !u) return;
    this.roomChannel
      .track({
        id: u.id,
        peerId: getMyPeerId(),
        displayName: u.displayName,
        avatar: u.avatar,
        vipLevel: u.vipLevel || 0,
        frame: u.activeFrame || '',
        seatIndex: this.mySeatIndex,
        ...extra,
      })
      .catch(() => {});
  }

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
    if (!u) return this;
    const myPeerId = getMyPeerId();

    // Fast path for high-frequency WebRTC / Video relay packets (zero artificial delay)
    if (
      event === 'rtc:offer' ||
      event === 'rtc:answer' ||
      event === 'rtc:ice' ||
      event === 'video:request' ||
      event === 'video:host_status' ||
      event === 'video:relay_frame'
    ) {
      this.broadcastRoom(event, { ...data, from: myPeerId, userId: u.id });
      return this;
    }

    setTimeout(async () => {
      if (event === 'room:join') {
        const roomId = data.roomId || 'room_live';
        if (this.currentRoomId && this.currentRoomId !== roomId) {
          this.leaveCurrentRoomChannel();
        }
        this.currentRoomId = roomId;

        const supaRoom = await fetchRoomByIdFromSupabase(roomId);
        const room = supaRoom || {
          id: roomId,
          hostId: u.id,
          hostName: u.displayName,
          hostAvatar: u.avatar,
          hostFrame: u.activeFrame || '',
          hostVip: u.vipLevel || 0,
          title: `${u.displayName} xonasi`,
          seatCount: 8,
          viewerCount: 1,
          totalGifts: 0,
          hasPk: false,
        };
        this.roomTotalGifts = room.totalGifts || 0;
        const seatCount = room.seatCount || 8;
        this.currentSeats = Array.from({ length: seatCount }, (_, idx) => {
          if (idx === 0) {
            return {
              index: 0,
              userId: room.hostId,
              socketId: room.hostId === u.id ? myPeerId : `host_${room.hostId}`,
              displayName: room.hostName,
              avatar: room.hostAvatar,
              frame: room.hostFrame || '',
              vipLevel: room.hostVip || 0,
              isMuted: false,
              isLocked: false,
              isSpeaking: false,
              isDemoBot: false,
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
              leftScore: 0,
              rightHostId: '',
              rightName: 'Raqib kutilmoqda...',
              rightAvatar: '',
              rightScore: 0,
              endsAt: Date.now() + 180 * 1000,
              durationSec: 180,
              winner: null,
            }
          : null;

        this.trigger('room:state', {
          seats: this.currentSeats,
          viewerCount: Math.max(1, room.viewerCount || 1),
          viewers: [
            {
              id: u.id,
              displayName: u.displayName,
              avatar: u.avatar,
              vipLevel: u.vipLevel || 0,
              frame: u.activeFrame || '',
            },
          ],
          topGifters: [],
          messages: [
            {
              id: `sys_${Date.now()}`,
              type: 'SYSTEM',
              text: `✨ ${u.displayName} xonaga kirdi!`,
              createdAt: new Date().toISOString(),
            },
          ],
          totalGifts: this.roomTotalGifts,
          notice: `Xush kelibsiz! ${room.title}`,
          luckyBox: this.activeBox,
          pk: this.activePk,
        });

        // Connect live Supabase Realtime room channel
        if (isSupabaseConfigured && !this.roomChannel) {
          const ch = supabase.channel(`zoralive:room:${roomId}`, {
            config: { presence: { key: myPeerId }, broadcast: { self: false } },
          });

          ch.on('presence', { event: 'sync' }, () => {
            const pState = ch.presenceState();
            const viewersMap = new Map<string, any>();
            const onlinePeers = new Set<string>();
            Object.entries(pState).forEach(([peerKey, entries]: [string, any]) => {
              onlinePeers.add(peerKey);
              const first = Array.isArray(entries) ? entries[0] : entries;
              if (first?.id) viewersMap.set(first.id, first);
            });
            const viewers = Array.from(viewersMap.values());
            const count = Math.max(1, viewers.length);
            this.trigger('room:viewers', { viewerCount: count, viewers });

            // Keep live viewer_count updated in Supabase if host
            if (room.hostId === u.id) {
              supabase.from('rooms').update({ viewer_count: count }).eq('id', roomId).then(() => {});
            }
          })
            .on('presence', { event: 'leave' }, ({ key }: any) => {
              this.trigger('rtc:peer_left', { socketId: key });
              // Free seat if disconnected peer owned a seat
              const hadSeat = this.currentSeats.some((s) => s.socketId === key && s.index !== 0);
              if (hadSeat) {
                this.currentSeats = this.currentSeats.map((s) =>
                  s.socketId === key && s.index !== 0
                    ? { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false }
                    : s
                );
                this.trigger('room:seats', [...this.currentSeats]);
              }
            })
            .on('broadcast', { event: 'room:seats' }, ({ payload }) => {
              if (Array.isArray(payload?.seats)) {
                this.currentSeats = payload.seats;
                this.trigger('room:seats', [...this.currentSeats]);
              }
            })
            .on('broadcast', { event: 'room:message' }, ({ payload }) => {
              if (payload) this.trigger('room:message', payload);
            })
            .on('broadcast', { event: 'room:gift_received' }, ({ payload }) => {
              if (payload) {
                this.roomTotalGifts = Math.max(this.roomTotalGifts, Number(payload.roomTotalGifts || 0));
                this.trigger('room:gift_received', payload);
              }
            })
            .on('broadcast', { event: 'pk:update' }, ({ payload }) => {
              this.activePk = payload?.pk ?? null;
              this.trigger('pk:update', this.activePk ? { ...this.activePk } : null);
            })
            .on('broadcast', { event: 'seat:reaction' }, ({ payload }) => {
              if (payload) this.trigger('seat:reaction', payload);
            })
            .on('broadcast', { event: 'room:sfx' }, ({ payload }) => {
              if (payload) this.trigger('room:sfx', payload);
            })
            .on('broadcast', { event: 'room:theme_changed' }, ({ payload }) => {
              if (payload) this.trigger('room:theme_changed', payload);
            })
            .on('broadcast', { event: 'room:notice_changed' }, ({ payload }) => {
              if (payload) this.trigger('room:notice_changed', payload);
            })
            .on('broadcast', { event: 'room:schedule_close' }, ({ payload }) => {
              if (payload) this.trigger('room:schedule_close', payload);
            })
            .on('broadcast', { event: 'room:closed' }, ({ payload }) => {
              if (payload) this.trigger('room:closed', payload);
            })
            .on('broadcast', { event: 'room:transfer_host' }, ({ payload }) => {
              if (payload) this.trigger('room:transfer_host', payload);
            })
            .on('broadcast', { event: 'room:lucky_box' }, ({ payload }) => {
              this.activeBox = payload?.box ?? null;
              this.trigger('room:lucky_box', this.activeBox);
            })
            .on('broadcast', { event: 'room:entry_ride' }, ({ payload }) => {
              if (payload) this.trigger('room:entry_ride', payload);
            })
            .on('broadcast', { event: 'rtc:offer' }, ({ payload }) => {
              if (!payload?.to || payload.to === myPeerId) this.trigger('rtc:offer', payload);
            })
            .on('broadcast', { event: 'rtc:answer' }, ({ payload }) => {
              if (!payload?.to || payload.to === myPeerId) this.trigger('rtc:answer', payload);
            })
            .on('broadcast', { event: 'rtc:ice' }, ({ payload }) => {
              if (!payload?.to || payload.to === myPeerId) this.trigger('rtc:ice', payload);
            })
            .on('broadcast', { event: 'video:request' }, ({ payload }) => {
              this.trigger('video:request', payload);
            })
            .on('broadcast', { event: 'video:host_status' }, ({ payload }) => {
              this.trigger('video:host_status', payload);
            })
            .on('broadcast', { event: 'video:relay_frame' }, ({ payload }) => {
              this.trigger('video:relay_frame', payload);
            })
            .on('broadcast', { event: 'draw:state' }, ({ payload }) => {
              this.drawState = payload?.state ?? null;
              if (payload?.secretWord !== undefined) this.drawSecretWord = payload.secretWord;
              if (this.drawState) this.trigger('draw:state', this.drawState);
            })
            .on('broadcast', { event: 'draw:stroke' }, ({ payload }) => {
              if (payload?.stroke) this.trigger('draw:stroke', payload.stroke);
            })
            .on('broadcast', { event: 'draw:clear' }, () => {
              this.trigger('draw:clear');
            })
            .on('broadcast', { event: 'draw:solved' }, ({ payload }) => {
              if (payload) {
                this.drawState = payload.state ?? this.drawState;
                this.trigger('draw:solved', payload.result);
              }
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                this.syncPresenceMeta();
                // Announce entry ride to everyone in room if equipped
                if (u.activeRide && u.activeRide !== 'none') {
                  const ev = {
                    displayName: u.displayName,
                    avatar: u.avatar,
                    vipLevel: u.vipLevel || 0,
                    rideCode: u.activeRide,
                  };
                  this.broadcastRoom('room:entry_ride', ev);
                }
              }
            });

          this.roomChannel = ch;
        }

        if (u.activeRide && u.activeRide !== 'none') {
          setTimeout(() => {
            this.trigger('room:entry_ride', {
              displayName: u.displayName,
              avatar: u.avatar,
              vipLevel: u.vipLevel || 0,
              rideCode: u.activeRide,
            });
          }, 350);
        }
      } else if (event === 'room:leave') {
        this.leaveCurrentRoomChannel();
      } else if (event === 'seat:take') {
        const idx = Number(data.seatIndex);
        this.mySeatIndex = idx;
        this.currentSeats = this.currentSeats.map((s) => {
          if (s.userId === u.id) {
            return { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false };
          }
          if (s.index === idx && !s.userId && !s.isLocked) {
            return {
              ...s,
              userId: u.id,
              socketId: myPeerId,
              displayName: u.displayName,
              avatar: u.avatar,
              frame: u.activeFrame || '',
              vipLevel: u.vipLevel || 0,
              isMuted: false,
              isSpeaking: true,
            };
          }
          return s;
        });
        this.syncPresenceMeta();
        this.trigger('room:seats', [...this.currentSeats]);
        this.broadcastRoom('room:seats', { seats: this.currentSeats });
      } else if (event === 'seat:leave') {
        this.mySeatIndex = null;
        this.currentSeats = this.currentSeats.map((s) =>
          s.userId === u.id
            ? { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false }
            : s
        );
        this.syncPresenceMeta();
        this.trigger('room:seats', [...this.currentSeats]);
        this.broadcastRoom('room:seats', { seats: this.currentSeats });
      } else if (event === 'seat:mute') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.userId === u.id ? { ...s, isMuted: Boolean(data.muted), isSpeaking: !data.muted } : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
        this.broadcastRoom('room:seats', { seats: this.currentSeats });
      } else if (event === 'seat:speaking') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.userId === u.id ? { ...s, isSpeaking: Boolean(data.speaking) && !s.isMuted } : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
        this.broadcastRoom('room:seats', { seats: this.currentSeats });
      } else if (event === 'seat:lock') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.index === Number(data.seatIndex) ? { ...s, isLocked: !s.isLocked } : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
        this.broadcastRoom('room:seats', { seats: this.currentSeats });
      } else if (event === 'seat:kick') {
        this.currentSeats = this.currentSeats.map((s) =>
          s.index === Number(data.seatIndex)
            ? { ...s, userId: null, socketId: null, displayName: '', avatar: '', frame: '', vipLevel: 0, isMuted: false, isSpeaking: false }
            : s
        );
        this.trigger('room:seats', [...this.currentSeats]);
        this.broadcastRoom('room:seats', { seats: this.currentSeats });
      } else if (event === 'room:chat') {
        const msg = {
          id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          type: 'CHAT',
          userId: u.id,
          displayName: u.displayName,
          avatar: u.avatar,
          wealthLevel: u.wealthLevel,
          vipLevel: u.vipLevel,
          bubble: u.activeBubble || '',
          text: String(data.text || ''),
          createdAt: new Date().toISOString(),
        };
        this.trigger('room:message', msg);
        this.broadcastRoom('room:message', msg);
      } else if (event === 'room:gift') {
        const gift = MOCK_GIFTS.find((g) => g.id === data.giftId) || MOCK_GIFTS[0];
        const qty = Math.max(1, Number(data.quantity || 1));
        const pkPoints = Math.max(10, gift.category === 'LUXURY' ? 500 : gift.category === 'LUCKY' ? 150 : 25) * qty;
        const nextCoins = u.coins || 0;
        setStoredUser({ ...u, coins: nextCoins });
        sendGiftInSupabase(
          u,
          data.receiverId || 'user_host_1',
          { id: gift.id, nameUz: gift.name_uz, price: 0, diamondsAward: 50 },
          qty,
          data.roomId || this.currentRoomId || 'room_madina'
        );
        this.roomTotalGifts += pkPoints;

        const targetSeat = this.currentSeats.find((s) => s.userId === data.receiverId);
        const receiverName = targetSeat?.displayName || this.currentSeats[0]?.displayName || 'Host';

        const giftEventPayload = {
          id: `g_${Date.now()}`,
          giftId: gift.id,
          giftName: gift.name_uz,
          giftIcon: gift.icon,
          effectType: gift.effect_type,
          accentColor: gift.accent_color,
          category: gift.category,
          quantity: qty,
          totalCost: 0,
          senderId: u.id,
          senderName: u.displayName,
          senderAvatar: u.avatar,
          senderVip: u.vipLevel,
          receiverId: data.receiverId || 'host',
          receiverName,
          roomTotalGifts: this.roomTotalGifts,
        };
        const giftChatPayload = {
          id: `gmsg_${Date.now()}`,
          type: 'GIFT',
          text: `${u.displayName} → ${receiverName}: ${gift.icon} ${gift.name_uz} ×${qty}`,
          createdAt: new Date().toISOString(),
        };

        this.trigger('wallet:updated', { coins: nextCoins });
        this.trigger('room:gift_received', giftEventPayload);
        this.trigger('room:message', giftChatPayload);
        this.broadcastRoom('room:gift_received', giftEventPayload);
        this.broadcastRoom('room:message', giftChatPayload);

        if (this.activePk?.active) {
          if (data.pkSide === 'right') this.activePk.rightScore += pkPoints;
          else this.activePk.leftScore += pkPoints;
          this.trigger('pk:update', { ...this.activePk });
          this.broadcastRoom('pk:update', { pk: this.activePk });
        }
      } else if (event === 'seat:reaction') {
        const mySeat = this.currentSeats.find((s) => s.userId === u.id);
        let emoji = data.emoji || '🔥';
        if (data.kind === 'dice') emoji = DICE_FACES[Math.floor(Math.random() * 6)];
        if (data.kind === 'rps') emoji = RPS_FACES[Math.floor(Math.random() * 3)];
        const reactPayload = {
          id: `react_${Date.now()}`,
          seatIndex: mySeat ? mySeat.index : -1,
          emoji,
          displayName: u.displayName,
        };
        this.trigger('seat:reaction', reactPayload);
        this.broadcastRoom('seat:reaction', reactPayload);
      } else if (event === 'room:sfx') {
        const sfxPayload = { effect: data.effect || 'applause', senderName: u.displayName };
        this.trigger('room:sfx', sfxPayload);
        this.broadcastRoom('room:sfx', sfxPayload);
      } else if (event === 'room:theme') {
        const themePayload = { theme: data.theme || 'light' };
        this.trigger('room:theme_changed', themePayload);
        this.broadcastRoom('room:theme_changed', themePayload);
      } else if (event === 'room:notice') {
        const noticePayload = { notice: data.notice || '' };
        this.trigger('room:notice_changed', noticePayload);
        this.broadcastRoom('room:notice_changed', noticePayload);
      } else if (event === 'room:schedule_close') {
        const payload = { roomId: data.roomId || this.currentRoomId, closesAt: Number(data.closesAt) || 0 };
        this.trigger('room:schedule_close', payload);
        this.broadcastRoom('room:schedule_close', payload);
      } else if (event === 'room:close_now') {
        const payload = { roomId: data.roomId || this.currentRoomId };
        this.trigger('room:closed', payload);
        this.broadcastRoom('room:closed', payload);
      } else if (event === 'room:transfer_host') {
        const payload = {
          roomId: data.roomId || this.currentRoomId,
          newHostId: data.newHostId,
          newHostName: data.newHostName,
        };
        this.trigger('room:transfer_host', payload);
        this.broadcastRoom('room:transfer_host', payload);
      } else if (event === 'room:lucky_box_drop') {
        const totalCoins = Number(data.totalCoins || 500);
        const nextCoins = u.coins || 0;
        setStoredUser({ ...u, coins: nextCoins });
        this.trigger('wallet:updated', { coins: nextCoins });
        this.activeBox = {
          id: `box_${Date.now()}`,
          totalCoins,
          remainingSlots: Number(data.slots || 5),
          claimedUserIds: [],
        };
        this.trigger('room:lucky_box', { ...this.activeBox });
        this.broadcastRoom('room:lucky_box', { box: this.activeBox });
      } else if (event === 'room:lucky_box_claim') {
        if (!this.activeBox || this.activeBox.remainingSlots <= 0) return;
        const reward = Math.max(50, Math.round(this.activeBox.totalCoins / Math.max(1, this.activeBox.remainingSlots)));
        const nextCoins = u.coins + reward;
        setStoredUser({ ...u, coins: nextCoins });
        this.activeBox.remainingSlots -= 1;
        this.activeBox.claimedUserIds.push(u.id);
        this.trigger('wallet:updated', { coins: nextCoins });
        this.trigger('room:lucky_box_claimed', { reward });
        const nextBox = this.activeBox.remainingSlots > 0 ? { ...this.activeBox } : null;
        this.trigger('room:lucky_box', nextBox);
        this.broadcastRoom('room:lucky_box', { box: nextBox });
      } else if (event === 'pk:start') {
        const dur = Number(data.durationSec || 90);
        this.activePk = {
          active: true,
          leftHostId: u.id,
          leftName: u.displayName,
          leftAvatar: u.avatar,
          leftScore: 0,
          rightHostId: '',
          rightName: 'Raqib kutilmoqda...',
          rightAvatar: '',
          rightScore: 0,
          endsAt: Date.now() + dur * 1000,
          durationSec: dur,
          winner: null,
        };
        this.trigger('pk:update', { ...this.activePk });
        this.broadcastRoom('pk:update', { pk: this.activePk });
      } else if (event === 'pk:join_rival') {
        if (!this.activePk?.active) return;
        this.activePk = {
          ...this.activePk,
          rightHostId: u.id,
          rightName: u.displayName,
          rightAvatar: u.avatar,
        };
        this.trigger('pk:update', { ...this.activePk });
        this.broadcastRoom('pk:update', { pk: this.activePk });
      } else if (event === 'pk:stop') {
        if (this.activePk) {
          const winner =
            this.activePk.leftScore > this.activePk.rightScore
              ? 'left'
              : this.activePk.rightScore > this.activePk.leftScore
              ? 'right'
              : 'draw';
          this.activePk = { ...this.activePk, active: false, winner };
          this.trigger('pk:update', { ...this.activePk });
          this.broadcastRoom('pk:update', { pk: this.activePk });
        }
      } else if (event === 'dm:send') {
        const dmPayload = {
          id: `dm_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
          sender_id: u.id,
          receiver_id: data.receiverId,
          content: String(data.content || ''),
          created_at: new Date().toISOString(),
        };
        this.persistDmLocally(dmPayload);
        saveDirectMessageToSupabase(dmPayload).catch(() => {});
        this.trigger('dm:received', dmPayload);
        this.ensureGlobalChannel();
        this.globalChannel?.send({ type: 'broadcast', event: 'dm:msg', payload: dmPayload }).catch(() => {});
      } else if (event === 'ludo:create') {
        const fee = Number(data.entryFee || 100);
        const count = Number(data.playerCount || 4);
        const colors: Array<'red' | 'green' | 'yellow' | 'blue'> = ['red', 'green', 'yellow', 'blue'];
        const bots = [
          { id: 'bot_1', displayName: 'O‘yinchi 2', avatar: '' },
          { id: 'bot_2', displayName: 'O‘yinchi 3', avatar: '' },
          { id: 'bot_3', displayName: 'O‘yinchi 4', avatar: '' },
        ];
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
          g.lastEvent = `🏆 ${p.name} g‘olib bo‘ldi! (+${g.pot} 🪙)`;
          if (p.id === u.id && g.pot > 0) {
            const nextCoins = (u.coins || 0) + g.pot;
            setStoredUser({ ...u, coins: nextCoins });
            syncProfileToSupabase({ id: u.id, coins: nextCoins });
            this.trigger('wallet:updated', { coins: nextCoins });
          }
        } else if (dice !== 6) {
          g.turnIndex = (g.turnIndex + 1) % g.players.length;
        }
        this.trigger('ludo:state', { ...g });
        this.runBotTurn();
      } else if (event === 'draw:start') {
        const words = ['Olma', 'Quyosh', 'Mashina', 'Uy', 'Mushuk', 'Samolyot', 'Yulduz', 'Daraxt', 'Toj', 'Ajdarho'];
        const w = words[Math.floor(Math.random() * words.length)];
        this.drawSecretWord = w;
        this.drawState = {
          active: true,
          drawerId: u.id,
          drawerName: u.displayName,
          hint: `${w[0]} ${'_ '.repeat(Math.max(1, w.length - 1)).trim()} (${w.length})`,
          solvedBy: null,
        };
        this.trigger('draw:state', this.drawState);
        this.trigger('draw:word', { word: w });
        this.broadcastRoom('draw:state', { state: this.drawState, secretWord: w });
      } else if (event === 'draw:stroke') {
        this.broadcastRoom('draw:stroke', { stroke: data.stroke });
      } else if (event === 'draw:clear') {
        this.broadcastRoom('draw:clear', {});
      } else if (event === 'draw:guess') {
        const guess = String(data.guess || '').trim().toLowerCase();
        if (this.drawState?.active && this.drawSecretWord && guess === this.drawSecretWord.toLowerCase()) {
          const reward = 50;
          const nextCoins = (u.coins || 0) + reward;
          setStoredUser({ ...u, coins: nextCoins });
          syncProfileToSupabase({ id: u.id, coins: nextCoins });
          this.trigger('wallet:updated', { coins: nextCoins });
          this.drawState = { ...this.drawState, active: false, solvedBy: u.displayName };
          const result = { winnerName: u.displayName, word: this.drawSecretWord, reward };
          this.trigger('draw:solved', result);
          this.broadcastRoom('draw:solved', { state: this.drawState, result });
        }
      }
    }, 20);

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
    this.ensureGlobalChannel();
    return this;
  }

  disconnect() {
    this.connected = false;
    this.leaveCurrentRoomChannel();
    return this;
  }
}

export function getSocket(): Socket {
  const isLocal =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  if (!WS_URL && (isSupabaseConfigured || !isLocal)) {
    if (!socketInstance) {
      socketInstance = new SupabaseRealtimeSocket() as unknown as Socket;
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
