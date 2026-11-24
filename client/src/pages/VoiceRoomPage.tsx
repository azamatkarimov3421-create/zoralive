import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Mic,
  MicOff,
  Gift,
  Gamepad2,
  Send,
  Lock,
  Unlock,
  UserX,
  Flag,
  Palette,
  Crown,
  Heart,
  X,
  Plus,
  Smile,
  Music,
  MoreHorizontal,
  Share2,
  VolumeX,
  Power,
  PackageOpen,
  Megaphone,
} from 'lucide-react';
import { api } from '../lib/api';
import { getSocket, getMyPeerId } from '../lib/socket';
import {
  sendRoomMessageToSupabase,
  fetchRoomMessagesFromSupabase,
  subscribeToRoomMessages,
} from '../lib/supabaseSync';
import { useAuth } from '../context/AuthContext';
import { useWorld } from '../context/WorldContext';
import { GiftEvent, RoomChatMessage, SeatState } from '../types';
import { Avatar } from '../components/Avatar';
import { GiftDrawer } from '../components/GiftDrawer';
import { GiftOverlay } from '../components/GiftOverlay';
import { EntryBanner, EntryRideEvent } from '../components/EntryBanner';
import { LuckyWheelGame } from '../components/LuckyWheelGame';
import { LudoGame } from '../components/LudoGame';
import { DrawGuessGame } from '../components/DrawGuessGame';
import { LiveWaveBars, getStageWallpaper } from '../components/LuxuryBadges';
import { ANIMATED_FRAMES, getAnimatedFrameUrl } from '../lib/mythicCatalog';
import { sfx } from '../lib/sound';

const THEME_OPTIONS = [
  { id: 'light', label: 'Oq' },
  { id: 'galaxy', label: 'Galaxy' },
  { id: 'gold', label: 'Saroy' },
  { id: 'ocean', label: 'Okean' },
];

const QUICK_EMOJIS = ['😂', '❤️', '🔥', '👏', '😮', '🎉', '😎', '👑'];
const DJ_EFFECTS = [
  { id: 'applause', label: '👏 Qarsak' },
  { id: 'laugh', label: '😂 Kulgu' },
  { id: 'drum', label: '🥁 Baraban' },
  { id: 'fanfare', label: '🎺 Fanfara' },
];

export const VoiceRoomPage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateCoinsLocally, toast } = useAuth();
  const { joinVoiceRoomMeta } = useWorld();

  const [roomMeta, setRoomMeta] = useState<any>(null);
  const [theme, setTheme] = useState('light');
  const [roomFrame, setRoomFrame] = useState('');
  const [notice, setNotice] = useState('');
  const [seats, setSeats] = useState<SeatState[]>([]);
  const [viewerCount, setViewerCount] = useState(0);
  const [viewersList, setViewersList] = useState<any[]>([]);
  const [topGifters, setTopGifters] = useState<any[]>([]);
  const [totalGifts, setTotalGifts] = useState(0);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [isFollowing, setIsFollowing] = useState(false);

  // New interactive conveniences
  const [seatReactions, setSeatReactions] = useState<Record<number, { id: string; emoji: string }>>({});
  const [luckyBox, setLuckyBox] = useState<any>(null);
  const [musicOn, setMusicOn] = useState(false);

  // Drawers / sheets
  const [giftDrawerOpen, setGiftDrawerOpen] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<GiftEvent | null>(null);
  const [entryRide, setEntryRide] = useState<EntryRideEvent | null>(null);
  const [miniGame, setMiniGame] = useState<null | 'wheel' | 'ludo' | 'draw'>(null);
  const [modSeat, setModSeat] = useState<SeatState | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [reactOpen, setReactOpen] = useState(false);
  const [musicOpen, setMusicOpen] = useState(false);
  const [viewersOpen, setViewersOpen] = useState(false);
  const [viewersTab, setViewersTab] = useState<'online' | 'gifters'>('online');
  const [toolsOpen, setToolsOpen] = useState(false);
  const [noticeDraft, setNoticeDraft] = useState('');

  const [micMuted, setMicMuted] = useState(false);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const speakingTimerRef = useRef<number | null>(null);

  const isHost = roomMeta?.hostId === user?.id || user?.role === 'ADMIN';
  const mySeat = seats.find((s) => s.userId === user?.id);
  const isLight = theme === 'light';

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const stopAudio = () => {
    sfx.stopMusic();
    setMusicOn(false);
    if (speakingTimerRef.current) {
      window.clearInterval(speakingTimerRef.current);
      speakingTimerRef.current = null;
    }
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    for (const pc of peersRef.current.values()) pc.close();
    peersRef.current.clear();
  };

  const ensureLocalMic = async () => {
    if (localStreamRef.current) return localStreamRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const src = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        src.connect(analyser);
        const data = new Uint8Array(analyser.frequencyBinCount);
        let lastSpeaking = false;

        speakingTimerRef.current = window.setInterval(() => {
          analyser.getByteFrequencyData(data);
          const avg = data.reduce((a, b) => a + b, 0) / data.length;
          const nowSpeaking = avg > 18 && !micMuted;
          if (nowSpeaking !== lastSpeaking && roomId) {
            lastSpeaking = nowSpeaking;
            getSocket().emit('seat:speaking', { roomId, speaking: nowSpeaking });
          }
        }, 300);
      } catch {
        // optional
      }
      return stream;
    } catch {
      toast('Mikrofon ulanmadi', 'info');
      return null;
    }
  };

  const createPeer = (targetSocketId: string, initiator: boolean) => {
    const socket = getSocket();
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current!));
    }
    pc.onicecandidate = (e) => {
      if (e.candidate) socket.emit('rtc:ice', { to: targetSocketId, candidate: e.candidate });
    };
    pc.ontrack = (e) => {
      const audio = document.createElement('audio');
      audio.srcObject = e.streams[0];
      audio.autoplay = true;
      audio.dataset.peer = targetSocketId;
      audioContainerRef.current?.appendChild(audio);
    };
    peersRef.current.set(targetSocketId, pc);
    if (initiator) {
      pc.createOffer()
        .then((offer) => pc.setLocalDescription(offer).then(() => offer))
        .then((offer) => socket.emit('rtc:offer', { to: targetSocketId, sdp: offer }))
        .catch(() => {});
    }
    return pc;
  };

  useEffect(() => {
    if (!roomId) return;
    api<{ room: any }>(`/rooms/${roomId}`)
      .then((res) => {
        setRoomMeta(res.room);
        joinVoiceRoomMeta(roomId, res.room.title || 'Do‘stlar xonasi');
        setNotice(res.room.notice || '');
        setNoticeDraft(res.room.notice || '');
        setIsFollowing(Boolean(res.room.isFollowing));
      })
      .catch((err) => {
        toast(err.message, 'error');
        navigate('/');
      });

    // Load persistent chat history & subscribe to live Supabase Realtime messages
    fetchRoomMessagesFromSupabase(roomId).then((rows) => {
      if (!rows || rows.length === 0) return;
      const mapped: RoomChatMessage[] = rows.map((r: any) => ({
        id: String(r.id),
        type: r.message_type === 'GIFT' ? 'GIFT' : r.message_type === 'SYSTEM' ? 'SYSTEM' : 'CHAT',
        userId: r.user_id,
        displayName: r.user_name || 'Foydalanuvchi',
        avatar: r.user_avatar || '',
        vipLevel: Number(r.vip_level) || 0,
        text: r.content || '',
        createdAt: r.created_at || new Date().toISOString(),
      }));
      setMessages((prev) => {
        const existingIds = new Set(prev.map((x) => x.id));
        const combined = [...prev];
        for (const m of mapped) {
          const isDup = combined.some(
            (x) =>
              existingIds.has(m.id) ||
              (x.userId === m.userId &&
                x.text === m.text &&
                Math.abs(Date.parse(x.createdAt || '') - Date.parse(m.createdAt || '')) < 4000)
          );
          if (!isDup) combined.push(m);
        }
        return combined.slice(-55);
      });
    });

    const unsubSupaChat = subscribeToRoomMessages(roomId, (r: any) => {
      const incoming: RoomChatMessage = {
        id: String(r.id),
        type: r.message_type === 'GIFT' ? 'GIFT' : r.message_type === 'SYSTEM' ? 'SYSTEM' : 'CHAT',
        userId: r.user_id,
        displayName: r.user_name || 'Foydalanuvchi',
        avatar: r.user_avatar || '',
        vipLevel: Number(r.vip_level) || 0,
        text: r.content || '',
        createdAt: r.created_at || new Date().toISOString(),
      };
      setMessages((prev) =>
        prev.some(
          (m) =>
            m.id === incoming.id ||
            (m.userId === incoming.userId &&
              m.text === incoming.text &&
              Math.abs(Date.parse(m.createdAt || '') - Date.parse(incoming.createdAt || '')) < 4000)
        )
          ? prev
          : [...prev.slice(-55), incoming]
      );
    });

    const socket = getSocket();
    socket.emit('room:join', { roomId });

    const onState = (s: any) => {
      setSeats(s.seats || []);
      setViewerCount(s.viewerCount || 0);
      setViewersList(s.viewers || []);
      setTopGifters(s.topGifters || []);
      setMessages((prev) => {
        const serverMsgs: RoomChatMessage[] = s.messages || [];
        if (prev.length === 0) return serverMsgs;
        const merged = [...serverMsgs];
        for (const p of prev) {
          if (
            !merged.some(
              (x) =>
                x.id === p.id ||
                (x.userId === p.userId &&
                  x.text === p.text &&
                  Math.abs(Date.parse(x.createdAt || '') - Date.parse(p.createdAt || '')) < 4000)
            )
          ) {
            merged.push(p);
          }
        }
        return merged.slice(-55);
      });
      setTotalGifts(s.totalGifts || 0);
      if (s.notice !== undefined) {
        setNotice(s.notice);
        setNoticeDraft(s.notice);
      }
      setLuckyBox(s.luckyBox || null);
    };
    const onSeats = (nextSeats: SeatState[]) => setSeats(nextSeats);
    const onViewers = ({ viewerCount: vc, viewers }: { viewerCount: number; viewers: any[] }) => {
      setViewerCount(vc);
      setViewersList(viewers || []);
      // Automatically offer live audio to new peers when local mic is streaming (capped at 10 WebRTC peers)
      if (localStreamRef.current && Array.isArray(viewers)) {
        const selfPeer = getMyPeerId();
        viewers.forEach((v: any) => {
          if (
            v?.peerId &&
            v.peerId !== selfPeer &&
            peersRef.current.size < 10 &&
            !peersRef.current.has(v.peerId)
          ) {
            createPeer(v.peerId, true);
          }
        });
      }
    };
    const onTopGifters = (list: any[]) => setTopGifters(list || []);
    const onMsg = (msg: RoomChatMessage) =>
      setMessages((prev) =>
        prev.some(
          (m) =>
            m.id === msg.id ||
            (m.userId === msg.userId &&
              m.text === msg.text &&
              Math.abs(Date.parse(m.createdAt || '') - Date.parse(msg.createdAt || '')) < 4000)
        )
          ? prev
          : [...prev.slice(-50), msg]
      );
    const onTheme = ({ theme: nextT }: { theme: string }) => setTheme(nextT);
    const onNotice = ({ notice: n }: { notice: string }) => {
      setNotice(n);
      setNoticeDraft(n);
    };
    const onReaction = (r: { id: string; seatIndex: number; emoji: string; displayName: string }) => {
      if (r.seatIndex >= 0) {
        setSeatReactions((prev) => ({ ...prev, [r.seatIndex]: { id: r.id, emoji: r.emoji } }));
        setTimeout(() => {
          setSeatReactions((prev) => {
            if (prev[r.seatIndex]?.id !== r.id) return prev;
            const copy = { ...prev };
            delete copy[r.seatIndex];
            return copy;
          });
        }, 3200);
      } else {
        toast(`${r.displayName}: ${r.emoji}`, 'info');
      }
      if (r.emoji.includes('⚀') || r.emoji.includes('⚁') || r.emoji.includes('⚂') || r.emoji.includes('⚃') || r.emoji.includes('⚄') || r.emoji.includes('⚅')) {
        sfx.dice();
      }
    };
    const onSfx = ({ effect, senderName }: { effect: string; senderName: string }) => {
      sfx.dj(effect);
      toast(`🎵 ${senderName}: ${effect}`, 'info');
    };
    const onLuckyBox = (box: any) => setLuckyBox(box);
    const onLuckyClaimed = ({ reward }: { reward: number }) => {
      sfx.win();
      toast(`🎁 Sandiqdan +${reward} tanga oldingiz!`, 'success');
    };
    const onGift = (g: GiftEvent) => {
      setTotalGifts(g.roomTotalGifts);
      setActiveGiftAnim(g);
      sfx.gift(g.effectType === 'fullscreen' || g.category === 'LUXURY');
      setTimeout(() => setActiveGiftAnim((curr) => (curr?.id === g.id ? null : curr)), 3900);
    };
    const onRide = (ev: any) => {
      const id = String(Date.now());
      setEntryRide({ ...ev, id });
      setTimeout(() => setEntryRide((curr) => (curr?.id === id ? null : curr)), 3700);
    };
    const onWallet = ({ coins }: { coins: number }) => updateCoinsLocally(coins);
    const onErr = ({ message }: { message: string }) => toast(message, 'error');
    const onOffer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(from) || createPeer(from, false);
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('rtc:answer', { to: from, sdp: answer });
    };
    const onAnswer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp));
    };
    const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(from);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    };
    const onPeerLeft = ({ socketId }: { socketId: string }) => {
      peersRef.current.get(socketId)?.close();
      peersRef.current.delete(socketId);
      audioContainerRef.current?.querySelector(`[data-peer="${socketId}"]`)?.remove();
    };

    socket.on('room:state', onState);
    socket.on('room:seats', onSeats);
    socket.on('room:viewers', onViewers);
    socket.on('room:top_gifters', onTopGifters);
    socket.on('room:message', onMsg);
    socket.on('room:theme_changed', onTheme);
    socket.on('room:notice_changed', onNotice);
    socket.on('seat:reaction', onReaction);
    socket.on('room:sfx', onSfx);
    socket.on('room:lucky_box', onLuckyBox);
    socket.on('room:lucky_box_claimed', onLuckyClaimed);
    socket.on('room:gift_received', onGift);
    socket.on('room:entry_ride', onRide);
    socket.on('wallet:updated', onWallet);
    socket.on('room:error', onErr);
    socket.on('rtc:offer', onOffer);
    socket.on('rtc:answer', onAnswer);
    socket.on('rtc:ice', onIce);
    socket.on('rtc:peer_left', onPeerLeft);

    return () => {
      socket.emit('room:leave');
      socket.off('room:state', onState);
      socket.off('room:seats', onSeats);
      socket.off('room:viewers', onViewers);
      socket.off('room:top_gifters', onTopGifters);
      socket.off('room:message', onMsg);
      socket.off('room:theme_changed', onTheme);
      socket.off('room:notice_changed', onNotice);
      socket.off('seat:reaction', onReaction);
      socket.off('room:sfx', onSfx);
      socket.off('room:lucky_box', onLuckyBox);
      socket.off('room:lucky_box_claimed', onLuckyClaimed);
      socket.off('room:gift_received', onGift);
      socket.off('room:entry_ride', onRide);
      socket.off('wallet:updated', onWallet);
      socket.off('room:error', onErr);
      socket.off('rtc:offer', onOffer);
      socket.off('rtc:answer', onAnswer);
      socket.off('rtc:ice', onIce);
      socket.off('rtc:peer_left', onPeerLeft);
      unsubSupaChat();
      stopAudio();
    };
  }, [roomId]);

  const handleSeatClick = async (seat: SeatState) => {
    if (!roomId) return;
    if (isHost && seat.index !== 0 && (seat.userId || seat.isLocked)) {
      setModSeat(seat);
      return;
    }
    if (seat.isLocked) {
      toast('O‘rin qulflangan', 'info');
      return;
    }
    if (seat.userId === user?.id) {
      if (seat.index !== 0) {
        getSocket().emit('seat:leave', { roomId });
        stopAudio();
      }
      return;
    }
    if (!seat.userId) {
      await ensureLocalMic();
      getSocket().emit('seat:take', { roomId, seatIndex: seat.index });
      const selfPeer = getMyPeerId();
      viewersList.forEach((v: any) => {
        if (v?.peerId && v.peerId !== selfPeer && peersRef.current.size < 10 && !peersRef.current.has(v.peerId)) {
          createPeer(v.peerId, true);
        }
      });
      seats.forEach((other) => {
        if (other.socketId && other.socketId !== selfPeer && other.userId && other.userId !== user?.id && !peersRef.current.has(other.socketId)) {
          createPeer(other.socketId, true);
        }
      });
    } else {
      setGiftDrawerOpen(true);
    }
  };

  const toggleMic = async () => {
    if (!roomId) return;
    if (!mySeat) {
      const empty = seats.find((s) => !s.userId && !s.isLocked);
      if (empty) await handleSeatClick(empty);
      return;
    }
    const nextMuted = !micMuted;
    setMicMuted(nextMuted);
    localStreamRef.current?.getAudioTracks().forEach((tr) => {
      tr.enabled = !nextMuted;
    });
    getSocket().emit('seat:mute', { roomId, muted: nextMuted });
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatText.trim();
    if (!text || !roomId) return;
    setChatText('');

    // Optimistic instantaneous message with user's real name and status
    const optimisticMsg: RoomChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: 'CHAT',
      userId: user?.id || 'guest',
      displayName: user?.displayName || user?.username || 'Mehmon',
      avatar: user?.avatar || '/assets/avatar-jasur.jpg',
      wealthLevel: user?.wealthLevel || 1,
      vipLevel: user?.vipLevel || 0,
      bubble: user?.activeBubble || '',
      text,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev.slice(-50), optimisticMsg]);

    getSocket().emit('room:chat', { roomId, text });
    if (user) {
      sendRoomMessageToSupabase(roomId, user, text).catch(() => {});
    }
  };

  const toggleFollow = async () => {
    if (!roomMeta?.hostId) return;
    const res = await api<{ following: boolean }>(`/users/${roomMeta.hostId}/follow`, { method: 'POST' });
    setIsFollowing(res.following);
  };

  const toggleBgMusic = () => {
    if (musicOn) {
      sfx.stopMusic();
      setMusicOn(false);
    } else {
      sfx.startMusic();
      setMusicOn(true);
    }
  };

  const recipients = [
    ...(roomMeta?.host
      ? [{ id: roomMeta.host.id, name: roomMeta.host.displayName, avatar: roomMeta.host.avatar }]
      : []),
    ...seats
      .filter((s) => s.userId && s.userId !== roomMeta?.hostId)
      .map((s) => ({ id: s.userId!, name: s.displayName, avatar: s.avatar })),
  ];

  const hostSeat = seats[0];
  const guestSeats = seats.slice(1);
  const alreadyClaimedBox = luckyBox && user ? luckyBox.claimedUserIds?.includes(user.id) : false;

  return (
    <div className={`min-h-screen flex flex-col justify-between relative overflow-hidden ${isLight ? 'bg-transparent text-slate-900' : 'bg-[#090a12] text-white'}`}>
      {!isLight && (
        <>
          <img src={getStageWallpaper(theme)} alt="" className="absolute inset-0 w-full h-full object-cover opacity-75" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/90" />
        </>
      )}

      <div ref={audioContainerRef} className="hidden" />
      <EntryBanner event={entryRide} />
      <GiftOverlay gift={activeGiftAnim} />

      {/* Top Header */}
      <header className="px-3 pt-3 pb-1.5 flex items-center justify-between gap-2 relative z-20">
        <div className={`flex items-center gap-2 min-w-0 rounded-full pl-1.5 pr-3 py-1 ${isLight ? 'bg-white/65 backdrop-blur-xl border border-white/85 shadow-xs' : 'glass-dark'}`}>
          <Avatar src={roomMeta?.host?.avatar} name={roomMeta?.host?.displayName} size="sm" />
          <div className="min-w-0">
            <div className={`text-xs font-extrabold truncate max-w-[122px] ${isLight ? 'text-slate-900' : 'text-white'}`}>
              {roomMeta?.title || 'Ovozli xona'}
            </div>
            <div className={`text-[10px] font-bold ${isLight ? 'text-amber-600' : 'text-amber-300'}`}>
              🪙 {totalGifts.toLocaleString()}
            </div>
          </div>
          {roomMeta?.hostId !== user?.id && (
            <button
              onClick={toggleFollow}
              className={`ml-0.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                isFollowing ? 'bg-slate-100 text-slate-600' : 'btn-brand'
              }`}
            >
              {isFollowing ? '✓' : 'Obuna'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => setViewersOpen(true)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-bold ${isLight ? 'bg-white/65 backdrop-blur-xl border border-white/85 text-slate-700' : 'glass-dark text-white'}`}
          >
            <Users className="w-3.5 h-3.5 text-[#ff3366]" />
            {viewerCount}
          </button>
          <button
            onClick={() => setThemePickerOpen((v) => !v)}
            className={`p-2 rounded-full ${isLight ? 'bg-white border border-slate-200/80 text-slate-600' : 'glass-dark text-white'}`}
          >
            <Palette className="w-4 h-4" />
          </button>
          <button
            onClick={() => setToolsOpen(true)}
            className={`p-2 rounded-full ${isLight ? 'bg-white border border-slate-200/80 text-slate-600' : 'glass-dark text-white'}`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/')}
            className={`p-2 rounded-full ${isLight ? 'bg-white border border-slate-200/80 text-slate-700' : 'glass-dark text-white'}`}
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Seamless Jump to World / Balkon Battle while keeping Voice Active (Section 8) */}
      <div className="px-3 pb-1.5 flex items-center gap-1.5 relative z-20 overflow-x-auto no-scrollbar">
        <button
          onClick={() => navigate('/games')}
          className="px-2.5 py-1 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[10px] font-black shadow-xs shrink-0"
        >
          🔥 Balkon Jangi (Ovoz saqlanadi)
        </button>
        <button
          onClick={() => navigate('/world')}
          className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[10px] font-black shadow-xs shrink-0"
        >
          🗺️ World • 10 Qit’a
        </button>
        <button
          onClick={() => navigate('/market')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 border ${
            isLight ? 'bg-white border-slate-200 text-slate-700' : 'glass-dark border-white/15 text-white'
          }`}
        >
          🛍️ Market
        </button>
      </div>

      {/* Pinned Room Notice + Active Lucky Coin Box */}
      {(notice || luckyBox) && (
        <div className="px-3 pb-1 flex items-center justify-between gap-2 relative z-20">
          {notice ? (
            <div className={`flex-1 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold truncate ${isLight ? 'bg-white border border-slate-200 text-slate-600' : 'glass-dark text-slate-200'}`}>
              <Megaphone className="w-3 h-3 text-[#ff3366] shrink-0" />
              <span className="truncate">{notice}</span>
            </div>
          ) : (
            <div />
          )}

          {luckyBox && (
            <button
              disabled={alreadyClaimedBox}
              onClick={() => getSocket().emit('room:lucky_box_claim', { roomId })}
              className="shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shadow-md animate-bounce disabled:animate-none disabled:opacity-60"
            >
              <PackageOpen className="w-3.5 h-3.5" />
              <span>{alreadyClaimedBox ? 'Olindi' : `Olish (${luckyBox.remainingSlots})`}</span>
            </button>
          )}
        </div>
      )}

      {themePickerOpen && (
        <div className="mx-3 mb-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-2.5 relative z-20">
          <div className="flex items-center justify-around gap-1">
            {THEME_OPTIONS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id);
                  if (isHost) getSocket().emit('room:theme', { roomId, theme: t.id });
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold ${
                  theme === t.id ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="border-t border-slate-100 pt-2">
            <div className="text-[10px] font-extrabold text-slate-400 mb-1.5 px-1">🖼️ Xona Ramkasi (Animatsiyali):</div>
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
              <button
                onClick={() => {
                  setRoomFrame('');
                  setThemePickerOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold shrink-0 border ${
                  !roomFrame ? 'bg-slate-900 text-white border-slate-900' : 'bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                Yo‘q
              </button>
              {ANIMATED_FRAMES.map((fr) => (
                <button
                  key={fr.code}
                  onClick={() => {
                    setRoomFrame(fr.code);
                    setThemePickerOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-xl text-[10px] font-bold shrink-0 border ${
                    roomFrame === fr.code ? 'bg-rose-50 text-[#ff3366] border-[#ff3366]' : 'bg-slate-50 text-slate-700 border-slate-200'
                  }`}
                >
                  <img src={fr.webp} alt="" className="w-6 h-6 object-contain" />
                  <span>{fr.nameUz.split(' ')[0]}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Host Seat + Guest Mic Grid (with Live Seat Emoji / Dice / RPS Reactions) */}
      <section className="px-3 py-2 relative z-10 space-y-5">
        {hostSeat && (
          <div className="flex flex-col items-center">
            <button onClick={() => handleSeatClick(hostSeat)} className="flex flex-col items-center relative">
              {seatReactions[0] && (
                <span className="absolute -top-8 z-30 px-2.5 py-0.5 rounded-full bg-white shadow-lg border border-slate-200 text-base font-black text-slate-900 animate-bounce">
                  {seatReactions[0].emoji}
                </span>
              )}
              <div className="relative">
                <Avatar
                  src={hostSeat.avatar}
                  name={hostSeat.displayName}
                  size="lg"
                  frame={roomFrame || hostSeat.frame || 'frame-gold-1'}
                  vipLevel={hostSeat.vipLevel}
                  speaking={hostSeat.isSpeaking && !hostSeat.isMuted}
                />
                <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-amber-400 text-white flex items-center justify-center shadow">
                  <Crown className="w-3 h-3" />
                </span>
              </div>
              <div className="mt-2.5 flex items-center gap-1.5">
                {hostSeat.isSpeaking && !hostSeat.isMuted && <LiveWaveBars color="bg-[#ff3366]" />}
                <span className={`text-xs font-extrabold ${isLight ? 'text-slate-900' : 'text-white'}`}>
                  {hostSeat.displayName}
                </span>
              </div>
            </button>
          </div>
        )}

        <div className="grid grid-cols-4 gap-y-4 gap-x-2">
          {guestSeats.map((seat) => {
            const occupied = Boolean(seat.userId);
            const reaction = seatReactions[seat.index];
            return (
              <button
                key={seat.index}
                onClick={() => handleSeatClick(seat)}
                className="flex flex-col items-center gap-1.5 relative"
              >
                {reaction && (
                  <span className="absolute -top-7 z-30 px-2 py-0.5 rounded-full bg-white shadow-md border border-slate-200 text-sm font-black text-slate-900 animate-bounce">
                    {reaction.emoji}
                  </span>
                )}
                <div className="relative">
                  {occupied ? (
                    <Avatar
                      src={seat.avatar}
                      name={seat.displayName}
                      size="md"
                      frame={seat.frame}
                      vipLevel={seat.vipLevel}
                      speaking={seat.isSpeaking && !seat.isMuted}
                    />
                  ) : (
                    <div
                      className={`w-13 h-13 rounded-full flex items-center justify-center border border-dashed transition ${
                        seat.isLocked
                          ? 'bg-rose-50 border-rose-300 text-rose-400'
                          : isLight
                          ? 'bg-white border-slate-300 text-slate-400 hover:border-[#ff3366] hover:text-[#ff3366]'
                          : 'bg-white/10 border-white/25 text-white/70'
                      }`}
                    >
                      {seat.isLocked ? <Lock className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                    </div>
                  )}

                  {occupied && seat.isMuted && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center border-2 border-white">
                      <MicOff className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-bold truncate max-w-[78px] ${isLight ? 'text-slate-600' : 'text-slate-200'}`}>
                  {occupied ? seat.displayName.split(' ')[0] : seat.isLocked ? 'Qulf' : `${seat.index}`}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Live Chat */}
      <section className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar max-h-[28vh] space-y-1.5 relative z-10">
        {messages.map((m) => (
          <div key={m.id} className="flex items-start">
            {m.type === 'SYSTEM' ? (
              <span className={`px-2.5 py-1 rounded-xl text-[11px] font-medium ${isLight ? 'bg-white text-slate-500 border border-slate-200/70' : 'bg-black/45 text-slate-200'}`}>
                {m.text}
              </span>
            ) : m.type === 'GIFT' ? (
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-700 font-bold">
                🎁 {m.text}
              </span>
            ) : (
              <div
                className={`px-3 py-1.5 rounded-2xl text-xs max-w-[88%] ${
                  m.bubble ? m.bubble : isLight ? 'bg-white border border-slate-200/70 text-slate-800' : 'bg-black/45 text-white'
                }`}
              >
                {m.vipLevel && m.vipLevel > 0 ? (
                  <span className="inline-block mr-1 px-1.5 py-0.2 rounded-md bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 text-[9px] font-black shadow-xs">
                    V{m.vipLevel}
                  </span>
                ) : null}
                <span className="font-extrabold text-[#ff3366] mr-1.5">{m.displayName}:</span>
                <span>{m.text}</span>
              </div>
            )}
          </div>
        ))}
        <div ref={chatEndRef} />
      </section>

      {/* Seat Emoji / Dice / RPS Quick Bar */}
      {reactOpen && (
        <div className="mx-3 mb-2 p-2.5 rounded-2xl bg-white/75 backdrop-blur-2xl border border-white/90 shadow-lg flex items-center justify-between gap-1.5 overflow-x-auto no-scrollbar relative z-20">
          {QUICK_EMOJIS.map((em) => (
            <button
              key={em}
              onClick={() => {
                getSocket().emit('seat:reaction', { roomId, kind: 'emoji', emoji: em });
                setReactOpen(false);
              }}
              className="text-xl hover:scale-125 transition px-1"
            >
              {em}
            </button>
          ))}
          <button
            onClick={() => {
              getSocket().emit('seat:reaction', { roomId, kind: 'dice' });
              setReactOpen(false);
            }}
            className="px-2.5 py-1 rounded-full bg-slate-900 text-white text-[11px] font-extrabold shrink-0"
          >
            🎲 Zarik
          </button>
          <button
            onClick={() => {
              getSocket().emit('seat:reaction', { roomId, kind: 'rps' });
              setReactOpen(false);
            }}
            className="px-2.5 py-1 rounded-full bg-rose-50 text-[#ff3366] text-[11px] font-extrabold shrink-0"
          >
            ✊✋✌️
          </button>
        </div>
      )}

      {/* DJ Soundboard & Room Music Bar */}
      {musicOpen && (
        <div className="mx-3 mb-2 p-2.5 rounded-2xl bg-white border border-slate-200 shadow-lg space-y-2 relative z-20">
          <div className="flex items-center justify-between">
            <button
              onClick={toggleBgMusic}
              className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${
                musicOn ? 'bg-[#ff3366] text-white' : 'bg-slate-100 text-slate-700'
              }`}
            >
              {musicOn ? '⏸ Fon musiqasi ON' : '▶ Fon musiqasi'}
            </button>
            <button onClick={() => setMusicOpen(false)} className="p-1 rounded-full bg-slate-100 text-slate-500">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {DJ_EFFECTS.map((ef) => (
              <button
                key={ef.id}
                onClick={() => getSocket().emit('room:sfx', { roomId, effect: ef.id })}
                className="py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] font-bold text-slate-800"
              >
                {ef.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Dock */}
      <footer className={`px-2.5 py-2.5 relative z-20 flex items-center gap-1.5 ${isLight ? 'bg-white border-t border-slate-200/80' : 'glass-dark border-t border-white/10'}`}>
        <form onSubmit={sendChat} className={`flex-1 flex items-center gap-1 rounded-full px-3 py-1.5 ${isLight ? 'bg-slate-100' : 'bg-white/10'}`}>
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Yozing..."
            className={`flex-1 bg-transparent text-xs focus:outline-none min-w-0 ${isLight ? 'text-slate-900 placeholder:text-slate-400' : 'text-white placeholder:text-slate-400'}`}
          />
          <button type="submit" className="text-[#ff3366]">
            <Send className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={toggleMic}
          className={`p-2 rounded-full transition ${
            mySeat && !micMuted ? 'bg-slate-900 text-white' : isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white'
          }`}
        >
          {mySeat && !micMuted ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
        </button>

        <button
          onClick={() => {
            setReactOpen((v) => !v);
            setMusicOpen(false);
          }}
          className={`p-2 rounded-full ${reactOpen ? 'bg-slate-900 text-white' : isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white'}`}
          title="Emoji & Zarik"
        >
          <Smile className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setMusicOpen((v) => !v);
            setReactOpen(false);
          }}
          className={`p-2 rounded-full ${musicOn || musicOpen ? 'bg-[#ff3366] text-white' : isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white'}`}
          title="Musiqa & DJ"
        >
          <Music className="w-4 h-4" />
        </button>

        <button
          onClick={() => setMiniGame('wheel')}
          className={`p-2 rounded-full ${isLight ? 'bg-slate-100 text-slate-700' : 'bg-white/10 text-white'}`}
          title="O‘yinlar"
        >
          <Gamepad2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            if (!roomMeta?.hostId || !roomId) return;
            getSocket().emit('room:gift', { roomId, receiverId: roomMeta.hostId, giftId: 'gift-rose', quantity: 1 });
          }}
          className="p-2 rounded-full bg-rose-50 text-[#ff3366]"
          title="Atirgul"
        >
          <Heart className="w-4 h-4 fill-current" />
        </button>

        <button onClick={() => setGiftDrawerOpen(true)} className="p-2.5 rounded-full btn-brand">
          <Gift className="w-4 h-4" />
        </button>
      </footer>

      <GiftDrawer
        open={giftDrawerOpen}
        onClose={() => setGiftDrawerOpen(false)}
        recipients={recipients}
        onOpenTopup={() => navigate('/profile?tab=wallet')}
        onSend={({ giftId, quantity, receiverId }) => {
          getSocket().emit('room:gift', { roomId, receiverId, giftId, quantity });
        }}
      />

      {/* In-Room 3 Mini-Games Drawer */}
      {miniGame && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45" onClick={() => setMiniGame(null)}>
          <div className="w-full max-w-md max-h-[86vh] overflow-y-auto bg-white rounded-t-3xl p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex gap-1.5">
                {[
                  ['wheel', 'Wheel'],
                  ['ludo', 'Ludo'],
                  ['draw', 'Chiz va Top'],
                ].map(([k, lbl]) => (
                  <button
                    key={k}
                    onClick={() => setMiniGame(k as any)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold ${miniGame === k ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
              <button onClick={() => setMiniGame(null)} className="p-1.5 rounded-full bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>
            {miniGame === 'wheel' ? (
              <LuckyWheelGame roomId={roomId} compact />
            ) : miniGame === 'ludo' ? (
              <LudoGame roomId={roomId} compact />
            ) : (
              <DrawGuessGame roomId={roomId} compact />
            )}
          </div>
        </div>
      )}

      {/* Audience & Top Gifters Sheet */}
      {viewersOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45" onClick={() => setViewersOpen(false)}>
          <div className="w-full max-w-md max-h-[70vh] overflow-y-auto bg-white rounded-t-3xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                <button
                  onClick={() => setViewersTab('online')}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${viewersTab === 'online' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Onlayn ({viewerCount})
                </button>
                <button
                  onClick={() => setViewersTab('gifters')}
                  className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${viewersTab === 'gifters' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  Top Saxiylar
                </button>
              </div>
              <button onClick={() => setViewersOpen(false)} className="p-1.5 rounded-full bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {viewersTab === 'online' ? (
              <div className="divide-y divide-slate-100">
                {viewersList.map((v) => (
                  <div key={v.socketId} className="py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <Avatar src={v.avatar} name={v.displayName} size="sm" vipLevel={v.vipLevel} />
                      <span className="text-xs font-extrabold text-slate-900">{v.displayName}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {topGifters.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-400">Hali sovg‘a yuborilmagan</div>
                ) : (
                  topGifters.map((g, idx) => (
                    <div key={g.userId} className="py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 text-xs font-black text-slate-400">{idx + 1}</span>
                        <Avatar src={g.avatar} name={g.displayName} size="sm" />
                        <span className="text-xs font-extrabold text-slate-900">{g.displayName}</span>
                      </div>
                      <span className="text-xs font-black text-amber-600">🪙 {g.total.toLocaleString()}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Room Tools & Settings Sheet (Lucky Box, Share, Notice, Mute All, Close) */}
      {toolsOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45" onClick={() => setToolsOpen(false)}>
          <div className="w-full max-w-md bg-white rounded-t-3xl p-4 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Xona qulayliklari</span>
              <button onClick={() => setToolsOpen(false)} className="p-1.5 rounded-full bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lucky Coin Box Drop */}
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 space-y-2">
              <div className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">
                <PackageOpen className="w-4 h-4" /> Omad Sandig‘i tashlash (5 kishi)
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[200, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => {
                      getSocket().emit('room:lucky_box_drop', { roomId, totalCoins: amt, slots: 5 });
                      setToolsOpen(false);
                    }}
                    className="py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black"
                  >
                    🪙 {amt}
                  </button>
                ))}
              </div>
            </div>

            {/* Host Room Notice */}
            {isHost && (
              <div className="flex gap-2">
                <input
                  value={noticeDraft}
                  onChange={(e) => setNoticeDraft(e.target.value)}
                  placeholder="Xona e’loni..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-100 text-xs text-slate-900"
                />
                <button
                  onClick={() => {
                    getSocket().emit('room:notice', { roomId, notice: noticeDraft });
                    toast('E’lon saqlandi', 'success');
                    setToolsOpen(false);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
                >
                  Saqlash
                </button>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  toast(`Xona havolasi nusxalandi (ID: ${roomMeta?.roomNumber})`, 'success');
                  setToolsOpen(false);
                }}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> Ulashish
              </button>

              <button
                onClick={async () => {
                  const r = window.prompt('Shikoyat sababi:');
                  if (!r || !roomId) return;
                  await api(`/rooms/${roomId}/report`, { method: 'POST', body: JSON.stringify({ reason: r }) });
                  toast('Yuborildi', 'success');
                  setToolsOpen(false);
                }}
                className="py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Flag className="w-3.5 h-3.5" /> Shikoyat
              </button>

              {isHost && (
                <>
                  <button
                    onClick={() => {
                      getSocket().emit('room:mute_all', { roomId });
                      toast('Barcha mehmonlar ovozi o‘chirildi', 'info');
                      setToolsOpen(false);
                    }}
                    className="py-2.5 rounded-xl bg-amber-50 text-amber-800 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <VolumeX className="w-3.5 h-3.5" /> Hammani jim
                  </button>

                  <button
                    onClick={async () => {
                      if (!roomId) return;
                      await api(`/rooms/${roomId}/close`, { method: 'POST' });
                      toast('Xona yopildi', 'info');
                      navigate('/');
                    }}
                    className="py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Power className="w-3.5 h-3.5" /> Xonani yopish
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Host Seat Moderation Modal */}
      {modSeat && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/45" onClick={() => setModSeat(null)}>
          <div className="w-full max-w-xs bg-white rounded-3xl p-4 space-y-2 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-extrabold text-center text-slate-900">{modSeat.index}-o‘rin</div>
            {modSeat.userId && (
              <>
                <button
                  onClick={() => {
                    getSocket().emit('seat:moderate', { roomId, seatIndex: modSeat.index, action: 'mute' });
                    setModSeat(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-800 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <MicOff className="w-4 h-4" />
                  <span>{modSeat.isMuted ? 'Ovozni yoqish' : 'Ovozni o‘chirish'}</span>
                </button>
                <button
                  onClick={() => {
                    getSocket().emit('seat:moderate', { roomId, seatIndex: modSeat.index, action: 'kick' });
                    setModSeat(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center gap-2"
                >
                  <UserX className="w-4 h-4" />
                  <span>Tushirish</span>
                </button>
              </>
            )}
            <button
              onClick={() => {
                getSocket().emit('seat:moderate', {
                  roomId,
                  seatIndex: modSeat.index,
                  action: modSeat.isLocked ? 'unlock' : 'lock',
                });
                setModSeat(null);
              }}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2"
            >
              {modSeat.isLocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span>{modSeat.isLocked ? 'Ochish' : 'Qulflash'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
