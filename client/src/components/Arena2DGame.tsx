import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  Play,
  Plus,
  Trophy,
  Clock,
  LogOut,
  Copy,
  RefreshCw,
  Zap,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncProfileToSupabase } from '../lib/supabaseSync';
import { setStoredUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';

export interface Arena2DGameProps {
  initialRoomCode?: string;
  initialRoomTitle?: string;
  roomHostId?: string;
  compact?: boolean;
  onClose?: () => void;
  onInviteRoom?: () => void;
}

interface ArenaLobbyRoom {
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  playerCount: number;
  status: 'WAITING' | 'PLAYING';
  updatedAt: number;
}

interface ArenaPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;
  x: number;
  y: number;
  tx: number;
  ty: number;
  score: number;
  dashUntil: number;
  magnetUntil: number;
  isBot?: boolean;
}

interface ArenaItem {
  id: string;
  x: number;
  y: number;
  kind: 'COIN' | 'GEM' | 'MAGNET' | 'SPEED';
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
  size: number;
}

interface FloatingText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
}

const WORLD_W = 800;
const WORLD_H = 560;
const MATCH_SECONDS = 60;
const PLAYER_RADIUS = 18;
const COLORS = [
  '#f43f5e',
  '#38bdf8',
  '#fbbf24',
  '#34d399',
  '#a78bfa',
  '#fb7185',
  '#22d3ee',
  '#f97316',
];

function colorForId(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return COLORS[h % COLORS.length];
}

function createInitialItems(count = 18): ArenaItem[] {
  const items: ArenaItem[] = [];
  for (let i = 0; i < count; i++) {
    items.push(makeRandomItem());
  }
  return items;
}

function makeRandomItem(): ArenaItem {
  const r = Math.random();
  const kind: ArenaItem['kind'] =
    r < 0.72 ? 'COIN' : r < 0.88 ? 'GEM' : r < 0.94 ? 'MAGNET' : 'SPEED';
  return {
    id: `${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`,
    x: 42 + Math.random() * (WORLD_W - 84),
    y: 42 + Math.random() * (WORLD_H - 84),
    kind,
  };
}

export const Arena2DGame: React.FC<Arena2DGameProps> = ({
  initialRoomCode,
  initialRoomTitle,
  roomHostId,
  compact = false,
  onClose,
  onInviteRoom,
}) => {
  const { user, refreshUser, toast } = useAuth();
  const autoJoinedRef = useRef(false);

  // Lobby state
  const [lobbyRooms, setLobbyRooms] = useState<ArenaLobbyRoom[]>([]);
  const [createTitle, setCreateTitle] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Active room state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomTitle, setRoomTitle] = useState('');
  const [hostId, setHostId] = useState('');
  const [phase, setPhase] = useState<'WAITING' | 'PLAYING' | 'FINISHED'>('WAITING');
  const [timeLeft, setTimeLeft] = useState(MATCH_SECONDS);
  const [leaderboard, setLeaderboard] = useState<ArenaPlayer[]>([]);
  const [dashCooldown, setDashCooldown] = useState(0);
  const [rewarded, setRewarded] = useState(false);

  // Realtime refs
  const lobbyChRef = useRef<any>(null);
  const gameChRef = useRef<any>(null);
  const phaseRef = useRef(phase);
  const hostIdRef = useRef(hostId);

  // 2D Engine Refs (60 FPS without React re-render overhead)
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const playersMapRef = useRef<Map<string, ArenaPlayer>>(new Map());
  const itemsRef = useRef<ArenaItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatersRef = useRef<FloatingText[]>([]);
  const keysRef = useRef<Set<string>>(new Set());
  const joyRef = useRef<{ active: boolean; ox: number; oy: number; dx: number; dy: number }>({
    active: false,
    ox: 0,
    oy: 0,
    dx: 0,
    dy: 0,
  });
  const dashReadyAtRef = useRef<number>(0);

  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  useEffect(() => {
    hostIdRef.current = hostId;
  }, [hostId]);

  const isHost = Boolean(user && hostId === user.id);

  // 1. Global Lobby Discovery
  useEffect(() => {
    if (!isSupabaseConfigured || compact) return;
    const ch = supabase
      .channel('zoralive:arena2d_lobby', { config: { broadcast: { self: true } } })
      .on('broadcast', { event: 'lobby:announce' }, ({ payload }) => {
        if (!payload?.code) return;
        setLobbyRooms((prev) => {
          const filtered = prev.filter((r) => r.code !== payload.code && Date.now() - r.updatedAt < 45_000);
          if (payload.closed) return filtered;
          return [{ ...payload, updatedAt: Date.now() }, ...filtered].slice(0, 12);
        });
      })
      .subscribe();
    lobbyChRef.current = ch;

    const cleanup = window.setInterval(() => {
      setLobbyRooms((prev) => prev.filter((r) => Date.now() - r.updatedAt < 45_000));
    }, 10_000);

    return () => {
      window.clearInterval(cleanup);
      supabase.removeChannel(ch);
      lobbyChRef.current = null;
    };
  }, [compact]);

  // Announce open public room
  useEffect(() => {
    if (compact || !roomCode || !isHost || phase === 'FINISHED') return;
    const announce = () => {
      const realCount = Array.from(playersMapRef.current.values()).filter((p) => !p.isBot).length;
      lobbyChRef.current?.send({
        type: 'broadcast',
        event: 'lobby:announce',
        payload: {
          code: roomCode,
          title: roomTitle,
          hostId,
          hostName: user?.displayName || 'Host',
          playerCount: Math.max(1, realCount),
          status: phase === 'WAITING' ? 'WAITING' : 'PLAYING',
          updatedAt: Date.now(),
        },
      });
    };
    announce();
    const id = window.setInterval(announce, 5000);
    return () => window.clearInterval(id);
  }, [compact, roomCode, isHost, phase, roomTitle, hostId, user?.displayName]);

  const syncLeaderboard = () => {
    const arr = Array.from(playersMapRef.current.values()).sort((a, b) => b.score - a.score);
    setLeaderboard(arr);
  };

  const spawnParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const spd = 1.5 + Math.random() * 3.8;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * spd,
        vy: Math.sin(angle) * spd,
        life: 1,
        color,
        size: 2.5 + Math.random() * 3.5,
      });
    }
  };

  const addFloater = (x: number, y: number, text: string, color: string) => {
    floatersRef.current.push({ x, y, text, color, life: 1 });
  };

  // 2. Enter 2D Arena Room
  const enterRoom = (code: string, title: string, ownerId: string) => {
    if (!user) return;
    if (gameChRef.current) {
      supabase.removeChannel(gameChRef.current);
      gameChRef.current = null;
    }

    const cleanCode = code.trim().toUpperCase();
    setRoomCode(cleanCode);
    setRoomTitle(title || `2D Arena #${cleanCode}`);
    setHostId(ownerId);
    setPhase('WAITING');
    setTimeLeft(MATCH_SECONDS);
    setRewarded(false);

    const map = new Map<string, ArenaPlayer>();
    const startX = 120 + Math.random() * (WORLD_W - 240);
    const startY = 100 + Math.random() * (WORLD_H - 200);
    map.set(user.id, {
      id: user.id,
      name: user.displayName,
      avatar: user.avatar || '',
      color: colorForId(user.id),
      x: startX,
      y: startY,
      tx: startX,
      ty: startY,
      score: 0,
      dashUntil: 0,
      magnetUntil: 0,
    });
    playersMapRef.current = map;
    itemsRef.current = createInitialItems(18);
    particlesRef.current = [];
    floatersRef.current = [];
    syncLeaderboard();

    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`zoralive:arena2d_${cleanCode}`, {
        config: { broadcast: { self: true }, presence: { key: user.id } },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const presentIds = new Set<string>();
        for (const key of Object.keys(state)) {
          const entry: any = state[key]?.[0];
          if (!entry?.id) continue;
          presentIds.add(entry.id);
          if (!playersMapRef.current.has(entry.id)) {
            const rx = 120 + Math.random() * (WORLD_W - 240);
            const ry = 100 + Math.random() * (WORLD_H - 200);
            playersMapRef.current.set(entry.id, {
              id: entry.id,
              name: entry.name || 'O‘yinchi',
              avatar: entry.avatar || '',
              color: colorForId(entry.id),
              x: rx,
              y: ry,
              tx: rx,
              ty: ry,
              score: 0,
              dashUntil: 0,
              magnetUntil: 0,
            });
          }
        }
        // Remove left real players (keep bots)
        for (const [pid, p] of Array.from(playersMapRef.current.entries())) {
          if (!p.isBot && pid !== user.id && !presentIds.has(pid)) {
            playersMapRef.current.delete(pid);
          }
        }
        syncLeaderboard();
      })
      .on('broadcast', { event: 'arena:start' }, ({ payload }) => {
        if (!payload) return;
        setHostId(payload.hostId || ownerId);
        if (payload.title) setRoomTitle(payload.title);
        itemsRef.current = Array.isArray(payload.items) ? payload.items : createInitialItems(20);
        // Reset scores & remove old bots
        for (const [pid, p] of Array.from(playersMapRef.current.entries())) {
          if (p.isBot) {
            playersMapRef.current.delete(pid);
          } else {
            p.score = 0;
            p.dashUntil = 0;
            p.magnetUntil = 0;
          }
        }
        // Add 3 fun 2D bots if playing solo so arena is immediately lively
        const realPlayersCount = playersMapRef.current.size;
        if (realPlayersCount <= 1 && payload.withBots) {
          const botNames = ['Bot Amir', 'Bot Laylo', 'Bot Timur'];
          botNames.forEach((bn, i) => {
            const bx = 140 + i * 240;
            const by = 140 + (i % 2) * 240;
            playersMapRef.current.set(`bot_${i}`, {
              id: `bot_${i}`,
              name: bn,
              avatar: '',
              color: COLORS[(i + 2) % COLORS.length],
              x: bx,
              y: by,
              tx: bx,
              ty: by,
              score: 0,
              dashUntil: 0,
              magnetUntil: 0,
              isBot: true,
            });
          });
        }
        setTimeLeft(MATCH_SECONDS);
        setRewarded(false);
        setPhase('PLAYING');
        syncLeaderboard();
      })
      .on('broadcast', { event: 'arena:pos' }, ({ payload }) => {
        if (!payload?.id || payload.id === user.id) return;
        const existing = playersMapRef.current.get(payload.id);
        if (existing) {
          existing.tx = payload.x;
          existing.ty = payload.y;
          existing.score = Math.max(existing.score, Number(payload.score) || 0);
          existing.dashUntil = payload.dashUntil || 0;
          existing.magnetUntil = payload.magnetUntil || 0;
        } else {
          playersMapRef.current.set(payload.id, {
            id: payload.id,
            name: payload.name || 'O‘yinchi',
            avatar: payload.avatar || '',
            color: colorForId(payload.id),
            x: payload.x,
            y: payload.y,
            tx: payload.x,
            ty: payload.y,
            score: Number(payload.score) || 0,
            dashUntil: payload.dashUntil || 0,
            magnetUntil: payload.magnetUntil || 0,
          });
        }
      })
      .on('broadcast', { event: 'arena:collect' }, ({ payload }) => {
        if (!payload?.itemId) return;
        const idx = itemsRef.current.findIndex((it) => it.id === payload.itemId);
        if (idx !== -1) {
          const it = itemsRef.current[idx];
          itemsRef.current.splice(idx, 1);
          spawnParticles(it.x, it.y, it.kind === 'GEM' ? '#38bdf8' : '#fbbf24', 8);
        }
        if (payload.replacement) {
          itemsRef.current.push(payload.replacement);
        }
        if (payload.userId && payload.userId !== user.id) {
          const p = playersMapRef.current.get(payload.userId);
          if (p) p.score = Math.max(p.score, Number(payload.newScore) || p.score);
        }
      })
      .on('broadcast', { event: 'arena:finish' }, () => {
        setPhase('FINISHED');
        syncLeaderboard();
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await ch.track({
            id: user.id,
            name: user.displayName,
            avatar: user.avatar || '',
          });
        }
      });

    gameChRef.current = ch;
  };

  const leaveRoom = () => {
    if (!compact && isHost && roomCode) {
      lobbyChRef.current?.send({
        type: 'broadcast',
        event: 'lobby:announce',
        payload: { code: roomCode, closed: true },
      });
    }
    if (gameChRef.current) {
      supabase.removeChannel(gameChRef.current);
      gameChRef.current = null;
    }
    setRoomCode(null);
    setPhase('WAITING');
    onClose?.();
  };

  // Auto-join shared Voice/Video room arena
  useEffect(() => {
    if (!initialRoomCode || !user || autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    enterRoom(initialRoomCode, initialRoomTitle || 'Xona 2D Arenasi', roomHostId || user.id);
  }, [initialRoomCode, initialRoomTitle, roomHostId, user?.id]);

  useEffect(() => {
    return () => {
      if (gameChRef.current) supabase.removeChannel(gameChRef.current);
    };
  }, []);

  // 3. Match Countdown Timer
  useEffect(() => {
    if (phase !== 'PLAYING') return;
    if (timeLeft <= 0) {
      if (isHost && gameChRef.current) {
        gameChRef.current.send({ type: 'broadcast', event: 'arena:finish', payload: {} });
      }
      setPhase('FINISHED');
      syncLeaderboard();
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [phase, timeLeft, isHost]);

  // 4. Award Real Coins when Match Finishes
  useEffect(() => {
    if (phase !== 'FINISHED' || rewarded || !user) return;
    setRewarded(true);
    const sorted = Array.from(playersMapRef.current.values()).sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex((p) => p.id === user.id);
    const prize = myRank === 0 ? 500 : myRank === 1 ? 300 : myRank === 2 ? 150 : 50;
    const nextCoins = (user.coins || 0) + prize;
    setStoredUser({ ...user, coins: nextCoins });
    syncProfileToSupabase({ id: user.id, coins: nextCoins })
      .then(() => refreshUser())
      .catch(() => {});
    toast(`2D Arena yakunlandi! +${prize} 🪙 mukofot qo‘shildi`, 'success');
  }, [phase, rewarded, user]);

  // 5. Trigger Dash Boost
  const triggerDash = () => {
    if (phaseRef.current !== 'PLAYING' || !user) return;
    const now = Date.now();
    if (now < dashReadyAtRef.current) return;
    const me = playersMapRef.current.get(user.id);
    if (!me) return;
    me.dashUntil = now + 900;
    dashReadyAtRef.current = now + 3500;
    setDashCooldown(3);
    spawnParticles(me.x, me.y, '#38bdf8', 14);
    addFloater(me.x, me.y - 20, '⚡ TEZLIK!', '#38bdf8');
  };

  // Dash cooldown UI tick
  useEffect(() => {
    if (dashCooldown <= 0) return;
    const t = window.setTimeout(() => setDashCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [dashCooldown]);

  // Keyboard listeners
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        keysRef.current.add(k);
      }
      if (e.code === 'Space' && phaseRef.current === 'PLAYING') {
        e.preventDefault();
        triggerDash();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, [user?.id]);

  // 6. Main 60 FPS 2D Canvas Game Loop
  useEffect(() => {
    if (phase !== 'PLAYING' || !user) return;
    let rafId = 0;
    let lastNetSend = 0;
    let lastUiSync = 0;
    let lastTime = performance.now();

    const step = (nowPerf: number) => {
      const dt = Math.min(0.05, (nowPerf - lastTime) / 1000);
      lastTime = nowPerf;
      const now = Date.now();

      const me = playersMapRef.current.get(user.id);
      if (me) {
        let vx = 0;
        let vy = 0;
        const keys = keysRef.current;
        if (keys.has('w') || keys.has('arrowup')) vy -= 1;
        if (keys.has('s') || keys.has('arrowdown')) vy += 1;
        if (keys.has('a') || keys.has('arrowleft')) vx -= 1;
        if (keys.has('d') || keys.has('arrowright')) vx += 1;

        if (joyRef.current.active) {
          vx = joyRef.current.dx;
          vy = joyRef.current.dy;
        }

        const mag = Math.hypot(vx, vy);
        if (mag > 0.05) {
          const nx = vx / Math.max(1, mag);
          const ny = vy / Math.max(1, mag);
          const speed = now < me.dashUntil ? 360 : 210;
          me.x = Math.max(PLAYER_RADIUS, Math.min(WORLD_W - PLAYER_RADIUS, me.x + nx * speed * dt));
          me.y = Math.max(PLAYER_RADIUS, Math.min(WORLD_H - PLAYER_RADIUS, me.y + ny * speed * dt));
          me.tx = me.x;
          me.ty = me.y;
        }

        // Magnet pull & Item collection for ME
        const hasMagnet = now < me.magnetUntil;
        for (let i = itemsRef.current.length - 1; i >= 0; i--) {
          const it = itemsRef.current[i];
          const dist = Math.hypot(me.x - it.x, me.y - it.y);
          if (hasMagnet && dist < 130 && dist > 1) {
            it.x += ((me.x - it.x) / dist) * 260 * dt;
            it.y += ((me.y - it.y) / dist) * 260 * dt;
          }
          if (dist < PLAYER_RADIUS + 13) {
            itemsRef.current.splice(i, 1);
            let pts = 10;
            if (it.kind === 'GEM') {
              pts = 35;
              spawnParticles(it.x, it.y, '#38bdf8', 14);
              addFloater(it.x, it.y, '+35 💎', '#38bdf8');
            } else if (it.kind === 'MAGNET') {
              pts = 15;
              me.magnetUntil = now + 6000;
              spawnParticles(it.x, it.y, '#a78bfa', 14);
              addFloater(it.x, it.y, '🧲 MAGNIT!', '#c4b5fd');
            } else if (it.kind === 'SPEED') {
              pts = 15;
              me.dashUntil = now + 4500;
              spawnParticles(it.x, it.y, '#34d399', 14);
              addFloater(it.x, it.y, '⚡ TEZLIK!', '#34d399');
            } else {
              spawnParticles(it.x, it.y, '#fbbf24', 9);
              addFloater(it.x, it.y, '+10 🪙', '#fbbf24');
            }
            me.score += pts;
            const replacement = makeRandomItem();
            itemsRef.current.push(replacement);
            gameChRef.current?.send({
              type: 'broadcast',
              event: 'arena:collect',
              payload: {
                itemId: it.id,
                userId: user.id,
                newScore: me.score,
                replacement,
              },
            });
          }
        }

        // Network position sync (~12 Hz)
        if (nowPerf - lastNetSend > 85) {
          lastNetSend = nowPerf;
          gameChRef.current?.send({
            type: 'broadcast',
            event: 'arena:pos',
            payload: {
              id: user.id,
              name: me.name,
              avatar: me.avatar,
              x: Math.round(me.x),
              y: Math.round(me.y),
              score: me.score,
              dashUntil: me.dashUntil,
              magnetUntil: me.magnetUntil,
            },
          });
        }
      }

      // Smoothly interpolate remote players & animate solo bots
      for (const p of playersMapRef.current.values()) {
        if (p.id === user.id) continue;
        if (p.isBot) {
          // Bot seeks nearest item
          let nearest: ArenaItem | null = null;
          let bestD = Infinity;
          for (const it of itemsRef.current) {
            const d = Math.hypot(p.x - it.x, p.y - it.y);
            if (d < bestD) {
              bestD = d;
              nearest = it;
            }
          }
          if (nearest && bestD > 2) {
            const spd = 148;
            p.x += ((nearest.x - p.x) / bestD) * spd * dt;
            p.y += ((nearest.y - p.y) / bestD) * spd * dt;
            if (bestD < PLAYER_RADIUS + 12) {
              const idx = itemsRef.current.indexOf(nearest);
              if (idx !== -1) {
                itemsRef.current.splice(idx, 1);
                itemsRef.current.push(makeRandomItem());
                p.score += nearest.kind === 'GEM' ? 35 : 10;
                spawnParticles(nearest.x, nearest.y, '#fbbf24', 7);
              }
            }
          }
        } else {
          p.x += (p.tx - p.x) * Math.min(1, dt * 11);
          p.y += (p.ty - p.y) * Math.min(1, dt * 11);
        }
      }

      // Update particles & floating texts
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.life -= dt * 2.2;
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }
      for (let i = floatersRef.current.length - 1; i >= 0; i--) {
        const ft = floatersRef.current[i];
        ft.y -= dt * 36;
        ft.life -= dt * 1.4;
        if (ft.life <= 0) floatersRef.current.splice(i, 1);
      }

      // Update React leaderboard HUD ~3 times/sec
      if (nowPerf - lastUiSync > 350) {
        lastUiSync = nowPerf;
        syncLeaderboard();
      }

      // RENDER 2D CANVAS
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        // Dark neon arena background
        const bgGrad = ctx.createRadialGradient(
          WORLD_W / 2,
          WORLD_H / 2,
          40,
          WORLD_W / 2,
          WORLD_H / 2,
          WORLD_W * 0.72
        );
        bgGrad.addColorStop(0, '#0f172a');
        bgGrad.addColorStop(1, '#020617');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, WORLD_W, WORLD_H);

        // Arena 2D grid
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.09)';
        ctx.lineWidth = 1;
        for (let gx = 40; gx < WORLD_W; gx += 40) {
          ctx.beginPath();
          ctx.moveTo(gx, 0);
          ctx.lineTo(gx, WORLD_H);
          ctx.stroke();
        }
        for (let gy = 40; gy < WORLD_H; gy += 40) {
          ctx.beginPath();
          ctx.moveTo(0, gy);
          ctx.lineTo(WORLD_W, gy);
          ctx.stroke();
        }

        // Glowing border
        ctx.strokeStyle = 'rgba(251, 191, 36, 0.35)';
        ctx.lineWidth = 4;
        ctx.strokeRect(4, 4, WORLD_W - 8, WORLD_H - 8);

        // Draw collectibles
        const pulse = Math.sin(nowPerf * 0.006) * 2.2;
        for (const it of itemsRef.current) {
          ctx.save();
          if (it.kind === 'COIN') {
            ctx.beginPath();
            ctx.arc(it.x, it.y, 10 + pulse * 0.4, 0, Math.PI * 2);
            ctx.fillStyle = '#fbbf24';
            ctx.shadowColor = '#f59e0b';
            ctx.shadowBlur = 12;
            ctx.fill();
            ctx.fillStyle = '#fef3c7';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('★', it.x, it.y + 0.5);
          } else if (it.kind === 'GEM') {
            ctx.translate(it.x, it.y);
            ctx.rotate(Math.PI / 4);
            ctx.fillStyle = '#38bdf8';
            ctx.shadowColor = '#0ea5e9';
            ctx.shadowBlur = 16;
            const s = 13 + pulse * 0.5;
            ctx.fillRect(-s / 2, -s / 2, s, s);
          } else if (it.kind === 'MAGNET') {
            ctx.beginPath();
            ctx.arc(it.x, it.y, 13, 0, Math.PI * 2);
            ctx.fillStyle = '#a78bfa';
            ctx.shadowColor = '#8b5cf6';
            ctx.shadowBlur = 14;
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('M', it.x, it.y + 0.5);
          } else {
            ctx.beginPath();
            ctx.arc(it.x, it.y, 13, 0, Math.PI * 2);
            ctx.fillStyle = '#34d399';
            ctx.shadowColor = '#10b981';
            ctx.shadowBlur = 14;
            ctx.fill();
            ctx.fillStyle = '#022c22';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('⚡', it.x, it.y + 0.5);
          }
          ctx.restore();
        }

        // Draw particles
        for (const pt of particlesRef.current) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, pt.life);
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        // Determine current leader
        let leaderId = '';
        let topScore = -1;
        for (const p of playersMapRef.current.values()) {
          if (p.score > topScore) {
            topScore = p.score;
            leaderId = p.id;
          }
        }

        // Draw players
        for (const p of playersMapRef.current.values()) {
          const isMe = p.id === user.id;
          const isDashing = now < p.dashUntil;
          const isMagnet = now < p.magnetUntil;

          ctx.save();
          // Magnet ring
          if (isMagnet) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 58 + pulse * 2, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(167, 139, 250, 0.35)';
            ctx.lineWidth = 2;
            ctx.stroke();
          }
          // Dash aura
          if (isDashing) {
            ctx.beginPath();
            ctx.arc(p.x, p.y, PLAYER_RADIUS + 8, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(56, 189, 248, 0.28)';
            ctx.fill();
          }

          // Character body
          ctx.beginPath();
          ctx.arc(p.x, p.y, PLAYER_RADIUS, 0, Math.PI * 2);
          ctx.fillStyle = p.color;
          ctx.shadowColor = p.color;
          ctx.shadowBlur = isMe ? 18 : 10;
          ctx.fill();
          ctx.lineWidth = isMe ? 3.5 : 2;
          ctx.strokeStyle = isMe ? '#ffffff' : 'rgba(255,255,255,0.65)';
          ctx.stroke();

          // Initials
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText((p.name || 'U').slice(0, 2).toUpperCase(), p.x, p.y + 0.5);

          // Crown for #1 leader
          if (p.id === leaderId && topScore > 0) {
            ctx.font = '15px sans-serif';
            ctx.fillText('👑', p.x, p.y - PLAYER_RADIUS - 18);
          }

          // Name + score label
          ctx.font = 'bold 11px sans-serif';
          ctx.fillStyle = isMe ? '#fde047' : '#e2e8f0';
          ctx.fillText(`${p.name.slice(0, 10)} (${p.score})`, p.x, p.y + PLAYER_RADIUS + 14);
          ctx.restore();
        }

        // Draw floating score popups
        for (const ft of floatersRef.current) {
          ctx.save();
          ctx.globalAlpha = Math.max(0, ft.life);
          ctx.font = 'bold 14px sans-serif';
          ctx.fillStyle = ft.color;
          ctx.textAlign = 'center';
          ctx.fillText(ft.text, ft.x, ft.y);
          ctx.restore();
        }

        // Draw subtle virtual joystick when dragging
        if (joyRef.current.active) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(joyRef.current.ox, joyRef.current.oy, 36, 0, Math.PI * 2);
          ctx.strokeStyle = 'rgba(255,255,255,0.32)';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.beginPath();
          ctx.arc(
            joyRef.current.ox + joyRef.current.dx * 28,
            joyRef.current.oy + joyRef.current.dy * 28,
            15,
            0,
            Math.PI * 2
          );
          ctx.fillStyle = 'rgba(255,255,255,0.55)';
          ctx.fill();
          ctx.restore();
        }
      }

      rafId = window.requestAnimationFrame(step);
    };

    rafId = window.requestAnimationFrame(step);
    return () => window.cancelAnimationFrame(rafId);
  }, [phase, user?.id]);

  // Pointer/Touch joystick handlers on 2D canvas
  const getCanvasPoint = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * WORLD_W,
      y: ((e.clientY - rect.top) / rect.height) * WORLD_H,
    };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    const pt = getCanvasPoint(e);
    joyRef.current = { active: true, ox: pt.x, oy: pt.y, dx: 0, dy: 0 };
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!joyRef.current.active) return;
    const pt = getCanvasPoint(e);
    const rx = pt.x - joyRef.current.ox;
    const ry = pt.y - joyRef.current.oy;
    const dist = Math.hypot(rx, ry);
    const maxR = 45;
    if (dist > 3) {
      const clamped = Math.min(dist, maxR) / maxR;
      joyRef.current.dx = (rx / dist) * clamped;
      joyRef.current.dy = (ry / dist) * clamped;
    } else {
      joyRef.current.dx = 0;
      joyRef.current.dy = 0;
    }
  };

  const handlePointerUp = () => {
    joyRef.current.active = false;
    joyRef.current.dx = 0;
    joyRef.current.dy = 0;
  };

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const title = createTitle.trim() || `${user.displayName} 2D Arenasi`;
    enterRoom(code, title, user.id);
  };

  const handleStartMatch = () => {
    const items = createInitialItems(20);
    const payload = {
      hostId: user?.id,
      title: roomTitle,
      items,
      withBots: playersMapRef.current.size <= 1,
    };
    if (gameChRef.current) {
      gameChRef.current.send({ type: 'broadcast', event: 'arena:start', payload });
    } else {
      itemsRef.current = items;
      setTimeLeft(MATCH_SECONDS);
      setRewarded(false);
      setPhase('PLAYING');
    }
  };

  // VIEW 1: PUBLIC LOBBY
  if (!roomCode) {
    return (
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-3xl p-4 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white shadow-xl border border-indigo-400/25">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/30 text-[10px] font-black tracking-wide text-amber-200 mb-1.5">
                <Gamepad2 className="w-3 h-3" /> 2D JONLI ARENA • 1 – 50+ KISHI
              </div>
              <h2 className="text-lg font-black leading-tight">2D Oltin Arena</h2>
              <p className="text-[11.5px] text-white/80 font-medium mt-0.5">
                2D maydonda yuguring, oltin va olmos yig‘ing, magnit hamda tezlik kuchlarini oling!
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-2xl shrink-0 shadow-lg">
              🕹️
            </div>
          </div>
        </div>

        {/* Create New 2D Arena */}
        <form onSubmit={handleCreateRoom} className="card-white rounded-3xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-indigo-600" /> Yangi 2D o‘yin xonasi ochish
            </span>
            <span className="text-[10px] font-bold text-emerald-600">60 soniyalik jang</span>
          </div>
          <input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            placeholder="Arena nomi (masalan: Do‘stlar 2D jangi)"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/90 border border-slate-200 text-xs font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-400"
          />
          <button
            type="submit"
            className="w-full py-3 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>2D Arena ochish va boshlash</span>
          </button>
        </form>

        {/* Join by 4-digit code */}
        <div className="card-white rounded-3xl p-4 space-y-2.5">
          <div className="text-xs font-black text-slate-900">Kod orqali 2D arenaga qo‘shilish</div>
          <div className="flex gap-2">
            <input
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
              placeholder="4 xonali kod (masalan: 4821)"
              maxLength={10}
              className="flex-1 px-3.5 py-2 rounded-2xl bg-white/90 border border-slate-200 text-xs font-extrabold tracking-widest text-slate-900 placeholder:text-slate-400 placeholder:tracking-normal focus:outline-none focus:border-indigo-400"
            />
            <button
              type="button"
              onClick={() => {
                if (!joinCodeInput.trim()) return toast('O‘yin kodini kiriting', 'info');
                enterRoom(joinCodeInput.trim(), `2D Arena #${joinCodeInput.trim()}`, '');
              }}
              className="px-5 py-2 rounded-2xl bg-slate-900 text-white text-xs font-black cursor-pointer"
            >
              Kirish
            </button>
          </div>
        </div>

        {/* Live Open Arenas */}
        <div className="card-white rounded-3xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Ochiq 2D arenalar ({lobbyRooms.length})</span>
            </span>
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </div>
          {lobbyRooms.length === 0 ? (
            <p className="text-center py-4 text-xs font-semibold text-slate-500">
              Hozircha ochiq 2D arena yo‘q — yuqoridan birinchi bo‘lib oching!
            </p>
          ) : (
            <div className="space-y-2">
              {lobbyRooms.map((r) => (
                <div
                  key={r.code}
                  className="flex items-center justify-between gap-2 bg-white/80 border border-slate-100 rounded-2xl px-3 py-2.5"
                >
                  <div className="min-w-0">
                    <div className="text-xs font-black text-slate-900 truncate">{r.title}</div>
                    <div className="text-[10px] font-bold text-slate-500">
                      Kod: #{r.code} • {r.hostName} • 👥 {r.playerCount} kishi
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => enterRoom(r.code, r.title, r.hostId)}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white text-[11px] font-black shrink-0 cursor-pointer"
                  >
                    Kirish
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  // VIEW 2: ACTIVE 2D ARENA
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="card-white rounded-3xl p-3 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-900 truncate">{roomTitle}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(roomCode);
                toast(`Arena kodi nusxalandi: ${roomCode}`, 'info');
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black cursor-pointer"
            >
              <span>Kod: {roomCode}</span>
              <Copy className="w-2.5 h-2.5" />
            </button>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-700">
              <Users className="w-3 h-3" /> {leaderboard.length} kishi
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={leaveRoom}
          className="px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-300 text-rose-700 text-[11px] font-black flex items-center gap-1 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Chiqish</span>
        </button>
      </div>

      {/* WAITING LOBBY */}
      {phase === 'WAITING' && (
        <div className="card-white rounded-3xl p-4 space-y-3.5">
          <div className="text-center space-y-1">
            <div className="text-sm font-black text-slate-900">2D Oltin Arena — Tayyormisiz?</div>
            <p className="text-[11px] font-semibold text-slate-500">
              Ekranni barmoq bilan suring (yoki WASD) va 60 soniyada eng ko‘p oltin ★ va olmos 💎 yig‘ing!
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5 justify-center max-h-36 overflow-y-auto py-1">
            {leaderboard.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-slate-200 shadow-2xs"
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                <Avatar src={p.avatar} name={p.name} size="xs" />
                <span className="text-[11px] font-extrabold text-slate-800 max-w-[85px] truncate">{p.name}</span>
              </div>
            ))}
          </div>

          {isHost || compact ? (
            <div className="space-y-2">
              {onInviteRoom && (
                <button
                  type="button"
                  onClick={onInviteRoom}
                  className="w-full py-2.5 rounded-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>📢 Xonadagilarni 2D o‘yinga chaqirish</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleStartMatch}
                className="w-full py-3 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>2D Jangni boshlash ({leaderboard.length} kishi)</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-extrabold">
              Xona egasi 2D o‘yinni boshlashini kuting...
            </div>
          )}
        </div>
      )}

      {/* ACTIVE 2D CANVAS */}
      {phase === 'PLAYING' && (
        <div className="space-y-2.5">
          {/* HUD Bar */}
          <div className="flex items-center justify-between gap-2 px-1">
            <span
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-black ${
                timeLeft <= 10 ? 'bg-rose-500 text-white animate-pulse' : 'bg-slate-900 text-amber-300'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{timeLeft}s</span>
            </span>

            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {leaderboard.slice(0, 3).map((p, idx) => (
                <span
                  key={p.id}
                  className="px-2.5 py-1 rounded-full bg-slate-900/90 text-white text-[10.5px] font-black whitespace-nowrap"
                >
                  {idx === 0 ? '👑' : `#${idx + 1}`} {p.name.slice(0, 8)}: {p.score}
                </span>
              ))}
            </div>
          </div>

          {/* 2D Canvas */}
          <div className="relative rounded-3xl overflow-hidden border-2 border-indigo-400/40 shadow-2xl bg-slate-950 touch-none select-none">
            <canvas
              ref={canvasRef}
              width={WORLD_W}
              height={WORLD_H}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              className="w-full h-auto block cursor-crosshair touch-none"
            />
            <button
              type="button"
              onClick={triggerDash}
              disabled={dashCooldown > 0}
              className={`absolute bottom-3 right-3 px-3.5 py-2 rounded-full text-xs font-black flex items-center gap-1 shadow-xl border cursor-pointer transition active:scale-95 ${
                dashCooldown > 0
                  ? 'bg-slate-900/75 border-white/15 text-slate-400'
                  : 'bg-gradient-to-r from-sky-400 to-indigo-600 border-white/50 text-white'
              }`}
            >
              <Zap className="w-3.5 h-3.5 fill-current" />
              <span>{dashCooldown > 0 ? `${dashCooldown}s` : 'TEZLIK'}</span>
            </button>
          </div>

          <p className="text-center text-[10.5px] font-bold text-slate-500">
            🕹️ Ekranda barmoq bilan surib boshqaring • ★ +10 • 💎 +35 • M Magnit • ⚡ Tezlik
          </p>
        </div>
      )}

      {/* FINISHED PODIUM */}
      {phase === 'FINISHED' && (
        <div className="card-white rounded-3xl p-4 space-y-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-100 text-amber-500 mx-auto shadow-inner">
            <Trophy className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">2D Jang Yakunlandi!</h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Mukofot tangalari barcha ishtirokchilar hisobiga avtomatik qo‘shildi
            </p>
          </div>

          <div className="space-y-1.5 text-left">
            {leaderboard.slice(0, 8).map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2 rounded-2xl border ${
                  idx === 0
                    ? 'bg-amber-50 border-amber-300'
                    : idx === 1
                    ? 'bg-slate-50 border-slate-200'
                    : idx === 2
                    ? 'bg-orange-50/70 border-orange-200'
                    : 'bg-white border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-sm font-black w-6 text-center">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                  </span>
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                  <span className="text-xs font-extrabold text-slate-900 truncate">{p.name}</span>
                </div>
                <span className="text-xs font-black text-indigo-700 shrink-0">{p.score} ball</span>
              </div>
            ))}
          </div>

          <div className="flex gap-2">
            {(isHost || compact) && (
              <button
                type="button"
                onClick={handleStartMatch}
                className="flex-1 py-3 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Yana o‘ynash</span>
              </button>
            )}
            <button
              type="button"
              onClick={leaveRoom}
              className="px-5 py-3 rounded-full bg-slate-900 text-white text-xs font-black cursor-pointer"
            >
              Chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
