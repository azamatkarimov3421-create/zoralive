import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  Play,
  Plus,
  Trophy,
  Clock,
  CheckCircle2,
  XCircle,
  LogOut,
  Sparkles,
  Copy,
  RefreshCw,
} from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncProfileToSupabase } from '../lib/supabaseSync';
import { setStoredUser } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { Avatar } from './Avatar';
import { QUIZ_CATEGORIES, QuizQuestion, pickQuizQuestions } from '../lib/quizBank';

interface QuizLobbyRoom {
  code: string;
  title: string;
  hostId: string;
  hostName: string;
  category: string;
  rounds: number;
  playerCount: number;
  status: 'WAITING' | 'PLAYING';
  updatedAt: number;
}

interface QuizPlayer {
  id: string;
  name: string;
  avatar: string;
  score: number;
  answeredRound?: number;
}

const OPTION_COLORS = [
  'from-rose-500 to-pink-600 border-rose-300/60',
  'from-sky-500 to-blue-600 border-sky-300/60',
  'from-amber-400 to-orange-500 border-amber-200/70',
  'from-emerald-500 to-teal-600 border-emerald-300/60',
];
const OPTION_LETTERS = ['A', 'B', 'C', 'D'];
const ROUND_SECONDS = 15;

export interface TeamQuizGameProps {
  initialRoomCode?: string;
  initialRoomTitle?: string;
  roomHostId?: string;
  compact?: boolean;
  onClose?: () => void;
  onInviteRoom?: () => void;
}

export const TeamQuizGame: React.FC<TeamQuizGameProps> = ({
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
  const [lobbyRooms, setLobbyRooms] = useState<QuizLobbyRoom[]>([]);
  const [createTitle, setCreateTitle] = useState('');
  const [category, setCategory] = useState<'ALL' | 'WORLD' | 'SPORT' | 'LOGIC'>('ALL');
  const [roundCount, setRoundCount] = useState<number>(5);
  const [joinCodeInput, setJoinCodeInput] = useState('');

  // Active Game Room state
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomTitle, setRoomTitle] = useState('');
  const [hostId, setHostId] = useState<string>('');
  const [phase, setPhase] = useState<'WAITING' | 'QUESTION' | 'REVEAL' | 'FINISHED'>('WAITING');
  const [players, setPlayers] = useState<QuizPlayer[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [roundIdx, setRoundIdx] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [rewarded, setRewarded] = useState(false);

  const lobbyChRef = useRef<any>(null);
  const gameChRef = useRef<any>(null);
  const hostIdRef = useRef('');
  const playersRef = useRef<QuizPlayer[]>([]);
  const questionsRef = useRef<QuizQuestion[]>([]);
  const roundIdxRef = useRef(0);
  const phaseRef = useRef(phase);

  useEffect(() => {
    hostIdRef.current = hostId;
  }, [hostId]);
  useEffect(() => {
    playersRef.current = players;
  }, [players]);
  useEffect(() => {
    questionsRef.current = questions;
  }, [questions]);
  useEffect(() => {
    roundIdxRef.current = roundIdx;
  }, [roundIdx]);
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const isHost = Boolean(user && hostId === user.id);

  // 1. Subscribe to Global Quiz Lobby (discover open games in real time)
  useEffect(() => {
    if (!isSupabaseConfigured) return;
    const ch = supabase
      .channel('zoralive:quiz_lobby', { config: { broadcast: { self: true } } })
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
  }, []);

  // Announce room periodically if host is in WAITING/PLAYING (public lobby only)
  useEffect(() => {
    if (compact || !roomCode || !isHost || phase === 'FINISHED') return;
    const announce = () => {
      lobbyChRef.current?.send({
        type: 'broadcast',
        event: 'lobby:announce',
        payload: {
          code: roomCode,
          title: roomTitle,
          hostId,
          hostName: user?.displayName || 'Host',
          category,
          rounds: roundCount,
          playerCount: Math.max(1, playersRef.current.length),
          status: phase === 'WAITING' ? 'WAITING' : 'PLAYING',
          updatedAt: Date.now(),
        },
      });
    };
    announce();
    const id = window.setInterval(announce, 5000);
    return () => window.clearInterval(id);
  }, [roomCode, isHost, phase, roomTitle, hostId, category, roundCount, user?.displayName]);

  // 2. Join a Game Room Channel (Presence + Broadcast)
  const enterRoom = (code: string, title: string, ownerId: string) => {
    if (!user) return;
    if (gameChRef.current) {
      supabase.removeChannel(gameChRef.current);
      gameChRef.current = null;
    }

    const cleanCode = code.trim().toUpperCase();
    setRoomCode(cleanCode);
    setRoomTitle(title || `Viktorina #${cleanCode}`);
    setHostId(ownerId);
    setPhase('WAITING');
    setQuestions([]);
    setRoundIdx(0);
    setSelectedOpt(null);
    setRewarded(false);
    setPlayers([{ id: user.id, name: user.displayName, avatar: user.avatar, score: 0 }]);

    if (!isSupabaseConfigured) return;

    const ch = supabase
      .channel(`zoralive:quiz_${cleanCode}`, {
        config: { broadcast: { self: true }, presence: { key: user.id } },
      })
      .on('presence', { event: 'sync' }, () => {
        const state = ch.presenceState();
        const presentUsers: QuizPlayer[] = [];
        for (const key of Object.keys(state)) {
          const entry: any = state[key]?.[0];
          if (!entry?.id) continue;
          const existing = playersRef.current.find((p) => p.id === entry.id);
          presentUsers.push({
            id: entry.id,
            name: entry.name || 'O‘yinchi',
            avatar: entry.avatar || '',
            score: existing?.score || 0,
            answeredRound: existing?.answeredRound,
          });
        }
        if (presentUsers.length > 0) {
          setPlayers(presentUsers);
        }
      })
      .on('broadcast', { event: 'quiz:start' }, ({ payload }) => {
        if (!payload?.questions) return;
        setHostId(payload.hostId || ownerId);
        setRoomTitle(payload.title || title);
        setQuestions(payload.questions);
        setRoundIdx(0);
        setSelectedOpt(null);
        setTimeLeft(ROUND_SECONDS);
        setRewarded(false);
        setPlayers((prev) => prev.map((p) => ({ ...p, score: 0, answeredRound: undefined })));
        setPhase('QUESTION');
      })
      .on('broadcast', { event: 'quiz:answer' }, ({ payload }) => {
        if (!payload?.userId) return;
        setPlayers((prev) => {
          const exists = prev.some((p) => p.id === payload.userId);
          const next = exists
            ? prev.map((p) =>
                p.id === payload.userId
                  ? { ...p, score: p.score + (Number(payload.points) || 0), answeredRound: payload.roundIdx }
                  : p
              )
            : [
                ...prev,
                {
                  id: payload.userId,
                  name: payload.name || 'O‘yinchi',
                  avatar: payload.avatar || '',
                  score: Number(payload.points) || 0,
                  answeredRound: payload.roundIdx,
                },
              ];
          return next.sort((a, b) => b.score - a.score);
        });
      })
      .on('broadcast', { event: 'quiz:next' }, ({ payload }) => {
        const nextIdx = Number(payload?.roundIdx || 0);
        if (nextIdx >= questionsRef.current.length) {
          setPhase('FINISHED');
        } else {
          setRoundIdx(nextIdx);
          setSelectedOpt(null);
          setTimeLeft(ROUND_SECONDS);
          setPhase('QUESTION');
        }
      })
      .on('broadcast', { event: 'quiz:reveal' }, () => {
        setPhase('REVEAL');
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

  // Auto-join shared Voice/Video room game channel when embedded
  useEffect(() => {
    if (!initialRoomCode || !user || autoJoinedRef.current) return;
    autoJoinedRef.current = true;
    enterRoom(initialRoomCode, initialRoomTitle || 'Xona O‘yini', roomHostId || user.id);
  }, [initialRoomCode, initialRoomTitle, roomHostId, user?.id]);

  useEffect(() => {
    return () => {
      if (gameChRef.current) supabase.removeChannel(gameChRef.current);
    };
  }, []);

  // 3. Round Countdown Timer
  useEffect(() => {
    if (phase !== 'QUESTION') return;
    if (timeLeft <= 0) {
      if (isHost) {
        gameChRef.current?.send({ type: 'broadcast', event: 'quiz:reveal', payload: {} });
      }
      setPhase('REVEAL');
      return;
    }
    const t = window.setTimeout(() => setTimeLeft((s) => Math.max(0, s - 1)), 1000);
    return () => window.clearTimeout(t);
  }, [phase, timeLeft, isHost]);

  // Auto-advance from REVEAL after 3.5s (host drives transition so everyone stays synced)
  useEffect(() => {
    if (phase !== 'REVEAL' || !isHost) return;
    const t = window.setTimeout(() => {
      const nextIdx = roundIdxRef.current + 1;
      if (gameChRef.current) {
        gameChRef.current.send({ type: 'broadcast', event: 'quiz:next', payload: { roundIdx: nextIdx } });
      } else {
        if (nextIdx >= questionsRef.current.length) setPhase('FINISHED');
        else {
          setRoundIdx(nextIdx);
          setSelectedOpt(null);
          setTimeLeft(ROUND_SECONDS);
          setPhase('QUESTION');
        }
      }
    }, 3500);
    return () => window.clearTimeout(t);
  }, [phase, isHost]);

  // 4. Award real coins on FINISHED
  useEffect(() => {
    if (phase !== 'FINISHED' || rewarded || !user) return;
    setRewarded(true);
    const sorted = [...playersRef.current].sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex((p) => p.id === user.id);
    const prize = myRank === 0 ? 500 : myRank === 1 ? 300 : myRank === 2 ? 150 : 50;
    const nextCoins = (user.coins || 0) + prize;
    setStoredUser({ ...user, coins: nextCoins });
    syncProfileToSupabase({ id: user.id, coins: nextCoins })
      .then(() => refreshUser())
      .catch(() => {});
    toast(`O‘yin yakunlandi! +${prize} 🪙 mukofot qo‘shildi`, 'success');
  }, [phase, rewarded, user]);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const code = String(Math.floor(1000 + Math.random() * 9000));
    const title = createTitle.trim() || `${user.displayName} Viktorinasi`;
    enterRoom(code, title, user.id);
  };

  const handleStartMatch = () => {
    const qs = pickQuizQuestions(category, roundCount);
    const payload = { hostId: user?.id, title: roomTitle, questions: qs };
    if (gameChRef.current) {
      gameChRef.current.send({ type: 'broadcast', event: 'quiz:start', payload });
    } else {
      setQuestions(qs);
      setRoundIdx(0);
      setSelectedOpt(null);
      setTimeLeft(ROUND_SECONDS);
      setPhase('QUESTION');
    }
  };

  const handleAnswer = (optIdx: number) => {
    if (phase !== 'QUESTION' || selectedOpt !== null || !user) return;
    setSelectedOpt(optIdx);
    const curQ = questions[roundIdx];
    const isCorrect = curQ && optIdx === curQ.correct;
    const points = isCorrect ? 100 + timeLeft * 10 : 0;

    if (gameChRef.current) {
      gameChRef.current.send({
        type: 'broadcast',
        event: 'quiz:answer',
        payload: {
          userId: user.id,
          name: user.displayName,
          avatar: user.avatar || '',
          roundIdx,
          points,
        },
      });
    } else {
      setPlayers((prev) =>
        prev
          .map((p) => (p.id === user.id ? { ...p, score: p.score + points, answeredRound: roundIdx } : p))
          .sort((a, b) => b.score - a.score)
      );
    }

    // If solo player, reveal immediately after 600ms
    if (playersRef.current.length <= 1) {
      window.setTimeout(() => setPhase('REVEAL'), 600);
    }
  };

  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const currentQuestion = questions[roundIdx];

  // VIEW 1: LOBBY (Create or Join a Multiplayer Game)
  if (!roomCode) {
    return (
      <div className="space-y-4">
        {/* Hero Card */}
        <div className="rounded-3xl p-4 bg-gradient-to-br from-indigo-950 via-violet-950 to-slate-950 text-white border-2 border-indigo-400/35 shadow-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
              ⚡ 1 – 100+ KISHILIK JAMOAVIY O‘YIN
            </span>
            <Sparkles className="w-4 h-4 text-amber-300" />
          </div>
          <h2 className="text-base font-black leading-tight">Tezkor Bilimdon Arenasi</h2>
          <p className="text-[11.5px] font-medium text-white/75">
            Bir kishi o‘yin ochadi — 2, 8, 12 yoki 28+ kishi birdan qo‘shilib jonli bellashadi! Tez va to‘g‘ri javobga yuqori ball va tanga beriladi.
          </p>
        </div>

        {/* Create New Multiplayer Game */}
        <form onSubmit={handleCreateRoom} className="card-white rounded-3xl p-4 space-y-3">
          <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
            <Plus className="w-4 h-4 text-[#ff3366]" />
            <span>Yangi Jamoaviy O‘yin Ochish</span>
          </div>

          <input
            value={createTitle}
            onChange={(e) => setCreateTitle(e.target.value)}
            maxLength={40}
            placeholder="O‘yin nomi (masalan: Do‘stlar bellashuvi)"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-white/80 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none focus:border-[#ff3366]"
          />

          <div className="grid grid-cols-4 gap-1.5">
            {QUIZ_CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategory(c.id)}
                className={`py-2 rounded-xl text-[10.5px] font-black border transition cursor-pointer ${
                  category === c.id
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-white/75 border-slate-200 text-slate-700'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] font-bold text-slate-600">Savollar soni:</span>
            <div className="flex gap-1.5">
              {[5, 8, 10].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setRoundCount(n)}
                  className={`px-3 py-1 rounded-full text-[11px] font-black border cursor-pointer ${
                    roundCount === n
                      ? 'bg-[#ff3366] border-[#ff3366] text-white'
                      : 'bg-white/80 border-slate-200 text-slate-700'
                  }`}
                >
                  {n} ta
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5 shadow-lg active:scale-98 transition cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>O‘yin xonasini ochish</span>
          </button>
        </form>

        {/* Join by 4-digit code */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!joinCodeInput.trim()) return;
            enterRoom(joinCodeInput.trim(), `Viktorina #${joinCodeInput.trim()}`, '');
            setJoinCodeInput('');
          }}
          className="card-white rounded-3xl p-3.5 flex items-center gap-2"
        >
          <input
            value={joinCodeInput}
            onChange={(e) => setJoinCodeInput(e.target.value)}
            maxLength={6}
            placeholder="4 xonali xona kodi (masalan: 4821)"
            className="flex-1 px-3 py-2 rounded-xl bg-white/80 border border-slate-200 text-xs font-bold text-slate-900 focus:outline-none"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-black shrink-0 cursor-pointer"
          >
            Qo‘shilish
          </button>
        </form>

        {/* Active Open Rooms List */}
        <div className="card-white rounded-3xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-600" />
              <span>Ochiq jamoaviy o‘yinlar ({lobbyRooms.length})</span>
            </span>
            <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
          </div>

          {lobbyRooms.length === 0 ? (
            <p className="text-center py-4 text-xs font-semibold text-slate-500">
              Hozircha ochiq o‘yin yo‘q — yuqoridan birinchi bo‘lib oching!
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
                      Kod: #{r.code} • {r.hostName} • 👥 {r.playerCount} kishi • {r.rounds} savol
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

  // VIEW 2: ACTIVE MULTIPLAYER GAME ROOM
  return (
    <div className="space-y-3.5">
      {/* Room Header */}
      <div className="card-white rounded-3xl p-3.5 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <div className="text-xs font-black text-slate-900 truncate">{roomTitle}</div>
          <div className="flex items-center gap-2 mt-0.5">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(roomCode);
                toast(`Xona kodi nusxalandi: ${roomCode}`, 'info');
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-black cursor-pointer"
            >
              <span>Kod: {roomCode}</span>
              <Copy className="w-2.5 h-2.5" />
            </button>
            <span className="inline-flex items-center gap-1 text-[10.5px] font-black text-emerald-700">
              <Users className="w-3 h-3" /> {players.length} kishi
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
        <div className="card-white rounded-3xl p-4 space-y-4">
          <div className="text-center space-y-1">
            <div className="text-sm font-black text-slate-900">Ishtirokchilar yig‘ilmoqda...</div>
            <p className="text-[11px] font-semibold text-slate-500">
              Do‘stlaringizga <b>{roomCode}</b> kodini ayting — 1 kishidan 100+ kishigacha qo‘shilishi mumkin
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center max-h-44 overflow-y-auto py-1">
            {players.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-white border border-slate-200 shadow-2xs"
              >
                <Avatar src={p.avatar} name={p.name} size="xs" />
                <span className="text-[11px] font-extrabold text-slate-800 max-w-[90px] truncate">{p.name}</span>
                {p.id === hostId && <span className="text-[10px]">👑</span>}
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
                  <span>📢 Xonadagilarni o‘yinga chaqirish</span>
                </button>
              )}
              <button
                type="button"
                onClick={handleStartMatch}
                className="w-full py-3 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>O‘yinni boshlash ({players.length} kishi)</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-2.5 rounded-2xl bg-indigo-50 text-indigo-700 text-xs font-extrabold">
              Xona egasi o‘yinni boshlashini kuting...
            </div>
          )}
        </div>
      )}

      {/* QUESTION / REVEAL */}
      {(phase === 'QUESTION' || phase === 'REVEAL') && currentQuestion && (
        <div className="space-y-3">
          {/* Progress & Timer */}
          <div className="card-white rounded-3xl p-4 space-y-3">
            <div className="flex items-center justify-between text-xs font-black">
              <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10.5px]">
                Savol {roundIdx + 1} / {questions.length}
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  timeLeft <= 5 ? 'bg-rose-100 text-rose-700 animate-pulse' : 'bg-amber-100 text-amber-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{phase === 'REVEAL' ? 'Natija' : `${timeLeft}s`}</span>
              </span>
            </div>

            <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#ff3366] to-amber-400 transition-all duration-1000"
                style={{ width: `${(timeLeft / ROUND_SECONDS) * 100}%` }}
              />
            </div>

            <h3 className="text-[15px] font-black text-slate-900 leading-snug pt-1">
              {currentQuestion.q}
            </h3>

            <div className="grid grid-cols-1 gap-2 pt-1">
              {currentQuestion.options.map((opt, idx) => {
                const isSelected = selectedOpt === idx;
                const isRight = idx === currentQuestion.correct;
                const showResult = phase === 'REVEAL' || selectedOpt !== null;

                let stateCls = `bg-gradient-to-r ${OPTION_COLORS[idx]} text-white`;
                if (showResult) {
                  if (isRight) stateCls = 'bg-emerald-500 text-white ring-4 ring-emerald-300/70';
                  else if (isSelected) stateCls = 'bg-rose-600 text-white opacity-95';
                  else stateCls = 'bg-slate-200/80 text-slate-500 border-slate-200';
                }

                return (
                  <button
                    key={idx}
                    type="button"
                    disabled={phase !== 'QUESTION' || selectedOpt !== null}
                    onClick={() => handleAnswer(idx)}
                    className={`w-full px-3.5 py-3 rounded-2xl border-2 text-left text-xs font-black flex items-center justify-between gap-2 transition active:scale-[0.98] cursor-pointer ${stateCls}`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-6 h-6 rounded-lg bg-black/20 flex items-center justify-center text-[11px] shrink-0">
                        {OPTION_LETTERS[idx]}
                      </span>
                      <span className="truncate">{opt}</span>
                    </div>
                    {showResult && isRight && <CheckCircle2 className="w-4 h-4 shrink-0" />}
                    {showResult && isSelected && !isRight && <XCircle className="w-4 h-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Mini Scoreboard */}
          <div className="card-white rounded-3xl p-3.5 space-y-2">
            <div className="text-[11px] font-black text-slate-700 flex items-center justify-between">
              <span>Jonli reyting</span>
              <span>{players.filter((p) => p.answeredRound === roundIdx).length}/{players.length} javob berdi</span>
            </div>
            <div className="space-y-1 max-h-36 overflow-y-auto no-scrollbar">
              {sortedPlayers.slice(0, 10).map((p, idx) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs ${
                    p.id === user?.id ? 'bg-amber-50 border border-amber-200' : 'bg-white/70'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-5 text-center font-black text-slate-500">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <Avatar src={p.avatar} name={p.name} size="xs" />
                    <span className="font-bold text-slate-900 truncate">{p.name}</span>
                  </div>
                  <span className="font-black text-indigo-700 shrink-0">{p.score} ball</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* FINISHED PODIUM */}
      {phase === 'FINISHED' && (
        <div className="card-white rounded-3xl p-5 space-y-4 text-center">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-400/20 border-2 border-amber-300 flex items-center justify-center text-amber-600">
            <Trophy className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-black text-slate-900">Bellashuv yakunlandi!</h3>
            <p className="text-xs font-semibold text-slate-500">
              G‘oliblarga tanga mukofotlari avtomatik qo‘shildi
            </p>
          </div>

          <div className="space-y-1.5 text-left max-h-56 overflow-y-auto no-scrollbar">
            {sortedPlayers.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center justify-between px-3 py-2 rounded-2xl border ${
                  idx === 0
                    ? 'bg-amber-50 border-amber-300'
                    : p.id === user?.id
                    ? 'bg-indigo-50 border-indigo-200'
                    : 'bg-white/80 border-slate-100'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-6 text-center text-sm font-black">
                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`}
                  </span>
                  <Avatar src={p.avatar} name={p.name} size="sm" />
                  <span className="text-xs font-black text-slate-900 truncate">{p.name}</span>
                </div>
                <span className="text-xs font-black text-indigo-700 shrink-0">{p.score} ball</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            {isHost ? (
              <button
                type="button"
                onClick={handleStartMatch}
                className="py-2.5 rounded-full btn-brand text-xs font-black cursor-pointer"
              >
                Qayta o‘ynash
              </button>
            ) : (
              <div className="py-2.5 rounded-full bg-slate-100 text-slate-500 text-xs font-bold">
                Mezbonni kuting
              </div>
            )}
            <button
              type="button"
              onClick={leaveRoom}
              className="py-2.5 rounded-full bg-slate-900 text-white text-xs font-black cursor-pointer"
            >
              Chiqish
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
