import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Users, Swords, Gift, Send, Video, VideoOff, Heart, Trophy } from 'lucide-react';
import { api } from '../lib/api';
import { getSocket, getMyPeerId } from '../lib/socket';
import {
  sendRoomMessageToSupabase,
  fetchRoomMessagesFromSupabase,
  subscribeToRoomMessages,
} from '../lib/supabaseSync';
import { useAuth } from '../context/AuthContext';
import { GiftEvent, PkState, RoomChatMessage } from '../types';
import { Avatar } from '../components/Avatar';
import { VideoCanvas } from '../components/VideoCanvas';
import { GiftDrawer } from '../components/GiftDrawer';
import { GiftOverlay } from '../components/GiftOverlay';
import { EntryBanner, EntryRideEvent } from '../components/EntryBanner';
import { PkVsCrest } from '../components/LuxuryBadges';
import { sfx } from '../lib/sound';

const MAX_DIRECT_WEBRTC_PEERS = 8;

export const VideoRoomPage: React.FC = () => {
  const { id: roomId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateCoinsLocally, toast } = useAuth();

  const [roomMeta, setRoomMeta] = useState<any>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [totalGifts, setTotalGifts] = useState(0);
  const [messages, setMessages] = useState<RoomChatMessage[]>([]);
  const [chatText, setChatText] = useState('');
  const [pk, setPk] = useState<PkState | null>(null);
  const [pkRemaining, setPkRemaining] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [remoteLeftStream, setRemoteLeftStream] = useState<MediaStream | null>(null);
  const [remoteRightStream, setRemoteRightStream] = useState<MediaStream | null>(null);
  const [leftRelayFrame, setLeftRelayFrame] = useState<string | null>(null);
  const [rightRelayFrame, setRightRelayFrame] = useState<string | null>(null);

  const [giftDrawerOpen, setGiftDrawerOpen] = useState(false);
  const [activeGiftAnim, setActiveGiftAnim] = useState<GiftEvent | null>(null);
  const [entryRide, setEntryRide] = useState<EntryRideEvent | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const peerSidesRef = useRef<Map<string, 'left' | 'right'>>(new Map());
  const pkRef = useRef<PkState | null>(null);
  const roomMetaRef = useRef<any>(null);
  const viewerCountRef = useRef<number>(1);
  const relayTimerRef = useRef<number | null>(null);

  useEffect(() => {
    pkRef.current = pk;
  }, [pk]);

  useEffect(() => {
    roomMetaRef.current = roomMeta;
  }, [roomMeta]);

  useEffect(() => {
    viewerCountRef.current = viewerCount;
  }, [viewerCount]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  useEffect(() => {
    if (!pk?.active) {
      setPkRemaining(0);
      return;
    }
    const tick = () => setPkRemaining(Math.max(0, Math.ceil((pk.endsAt - Date.now()) / 1000)));
    tick();
    const t = setInterval(tick, 500);
    return () => clearInterval(t);
  }, [pk?.active, pk?.endsAt]);

  useEffect(() => {
    if (!roomId) return;
    api<{ room: any }>(`/rooms/${roomId}`)
      .then((res) => {
        setRoomMeta(res.room);
        setIsFollowing(Boolean(res.room.isFollowing));
      })
      .catch((err) => {
        toast(err.message, 'error');
        navigate('/');
      });

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
        const combined = [...prev];
        for (const m of mapped) {
          const isDup = combined.some(
            (x) =>
              x.id === m.id ||
              (x.userId === m.userId &&
                x.text === m.text &&
                Math.abs(Date.parse(x.createdAt || '') - Date.parse(m.createdAt || '')) < 4000)
          );
          if (!isDup) combined.push(m);
        }
        return combined.slice(-45);
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
          : [...prev.slice(-45), incoming]
      );
    });

    const socket = getSocket();
    socket.emit('room:join', { roomId });

    const onState = (s: any) => {
      setViewerCount(s.viewerCount || 0);
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
        return merged.slice(-45);
      });
      setTotalGifts(s.totalGifts || 0);
      setPk(s.pk || null);
    };
    const onViewers = ({ viewerCount: vc }: { viewerCount: number }) => {
      setViewerCount(vc);
      // If we are broadcasting locally, announce stream presence to newly arrived viewers
      if (localStreamRef.current && roomId) {
        const mySide = pkRef.current?.rightHostId === user?.id ? 'right' : 'left';
        socket.emit('video:host_status', { roomId, live: true, side: mySide });
      }
    };
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
          : [...prev.slice(-45), msg]
      );
    const onPk = (nextPk: PkState | null) => {
      setPk(nextPk);
      if (nextPk?.active) sfx.pkHorn();
      if (nextPk && !nextPk.active && nextPk.winner) sfx.win();
      if (!nextPk) {
        setRemoteRightStream(null);
        setRightRelayFrame(null);
      }
    };
    const onGift = (g: GiftEvent) => {
      setTotalGifts(g.roomTotalGifts);
      setActiveGiftAnim(g);
      sfx.gift(g.effectType === 'fullscreen' || g.category === 'LUXURY');
      setTimeout(() => setActiveGiftAnim((c) => (c?.id === g.id ? null : c)), 3300);
    };
    const onRide = (ev: any) => {
      const id = String(Date.now());
      setEntryRide({ ...ev, id });
      setTimeout(() => setEntryRide((c) => (c?.id === id ? null : c)), 3700);
    };
    const onWallet = ({ coins }: { coins: number }) => updateCoinsLocally(coins);
    const onErr = ({ message }: { message: string }) => toast(message, 'error');

    const createVideoPeer = (targetPeerId: string, initiator: boolean, side: 'left' | 'right' = 'left') => {
      peersRef.current.get(targetPeerId)?.close();
      const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
      peerSidesRef.current.set(targetPeerId, side);

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((tr) => pc.addTrack(tr, localStreamRef.current!));
      }
      pc.onicecandidate = (ev) => {
        if (ev.candidate) socket.emit('rtc:ice', { to: targetPeerId, candidate: ev.candidate });
      };
      pc.ontrack = (ev) => {
        const remoteStream = ev.streams[0];
        if (!remoteStream) return;
        const assignedSide = peerSidesRef.current.get(targetPeerId) || 'left';
        if (assignedSide === 'right') setRemoteRightStream(remoteStream);
        else setRemoteLeftStream(remoteStream);
      };
      peersRef.current.set(targetPeerId, pc);
      if (initiator) {
        pc.createOffer()
          .then((offer) => pc.setLocalDescription(offer).then(() => offer))
          .then((offer) => socket.emit('rtc:offer', { to: targetPeerId, sdp: offer, side }))
          .catch(() => {});
      }
      return pc;
    };

    const onHostStatus = ({ from, live, side }: { from: string; live: boolean; side?: 'left' | 'right' }) => {
      if (!from || from === getMyPeerId()) return;
      const targetSide = side || 'left';
      if (!live) {
        if (targetSide === 'right') {
          setRemoteRightStream(null);
          setRightRelayFrame(null);
        } else {
          setRemoteLeftStream(null);
          setLeftRelayFrame(null);
        }
        return;
      }
      peerSidesRef.current.set(from, targetSide);
      if (!peersRef.current.has(from)) {
        socket.emit('video:request', { to: from, side: targetSide });
      }
    };

    const onVideoRequest = ({ from }: { from: string }) => {
      if (!from || from === getMyPeerId() || !localStreamRef.current) return;
      // Direct WebRTC up to MAX_DIRECT_WEBRTC_PEERS viewers; overflow viewers get adaptive relay frames
      if (peersRef.current.size >= MAX_DIRECT_WEBRTC_PEERS) return;
      const mySide = pkRef.current?.rightHostId === user?.id ? 'right' : 'left';
      createVideoPeer(from, true, mySide);
    };

    const onOffer = async ({ from, sdp, side }: { from: string; sdp: RTCSessionDescriptionInit; side?: 'left' | 'right' }) => {
      if (!from || from === getMyPeerId()) return;
      const pc = createVideoPeer(from, false, side || peerSidesRef.current.get(from) || 'left');
      await pc.setRemoteDescription(new RTCSessionDescription(sdp));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit('rtc:answer', { to: from, sdp: answer });
    };

    const onAnswer = async ({ from, sdp }: { from: string; sdp: RTCSessionDescriptionInit }) => {
      const pc = peersRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(sdp)).catch(() => {});
    };

    const onIce = async ({ from, candidate }: { from: string; candidate: RTCIceCandidateInit }) => {
      const pc = peersRef.current.get(from);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate)).catch(() => {});
    };

    const onRelayFrame = ({ from, frame, side }: { from: string; frame: string; side?: 'left' | 'right' }) => {
      if (!from || from === getMyPeerId() || !frame) return;
      if (side === 'right') setRightRelayFrame(frame);
      else setLeftRelayFrame(frame);
    };

    const onPeerLeft = ({ socketId }: { socketId: string }) => {
      peersRef.current.get(socketId)?.close();
      peersRef.current.delete(socketId);
    };

    // Request active video streams shortly after entering room
    const reqTimer = window.setTimeout(() => {
      socket.emit('video:request', { roomId });
    }, 550);

    socket.on('room:state', onState);
    socket.on('room:viewers', onViewers);
    socket.on('room:message', onMsg);
    socket.on('pk:update', onPk);
    socket.on('room:gift_received', onGift);
    socket.on('room:entry_ride', onRide);
    socket.on('wallet:updated', onWallet);
    socket.on('room:error', onErr);
    socket.on('video:host_status', onHostStatus);
    socket.on('video:request', onVideoRequest);
    socket.on('video:relay_frame', onRelayFrame);
    socket.on('rtc:offer', onOffer);
    socket.on('rtc:answer', onAnswer);
    socket.on('rtc:ice', onIce);
    socket.on('rtc:peer_left', onPeerLeft);

    return () => {
      window.clearTimeout(reqTimer);
      if (relayTimerRef.current) window.clearInterval(relayTimerRef.current);
      socket.emit('room:leave');
      socket.off('room:state', onState);
      socket.off('room:viewers', onViewers);
      socket.off('room:message', onMsg);
      socket.off('pk:update', onPk);
      socket.off('room:gift_received', onGift);
      socket.off('room:entry_ride', onRide);
      socket.off('wallet:updated', onWallet);
      socket.off('room:error', onErr);
      socket.off('video:host_status', onHostStatus);
      socket.off('video:request', onVideoRequest);
      socket.off('video:relay_frame', onRelayFrame);
      socket.off('rtc:offer', onOffer);
      socket.off('rtc:answer', onAnswer);
      socket.off('rtc:ice', onIce);
      socket.off('rtc:peer_left', onPeerLeft);
      unsubSupaChat();
      for (const pc of peersRef.current.values()) pc.close();
      peersRef.current.clear();
      localStreamRef.current?.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
    };
  }, [roomId]);

  const startAdaptiveRelay = (stream: MediaStream) => {
    if (relayTimerRef.current) window.clearInterval(relayTimerRef.current);
    const vid = document.createElement('video');
    vid.muted = true;
    vid.playsInline = true;
    vid.srcObject = stream;
    vid.play().catch(() => {});
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    relayTimerRef.current = window.setInterval(() => {
      if (!localStreamRef.current || !ctx || vid.videoWidth === 0) return;
      // Only broadcast adaptive frames when overflow viewers (>8) or remote viewers are present
      if (viewerCountRef.current <= 1 && peersRef.current.size === 0) return;
      const w = 320;
      const h = Math.max(180, Math.round((vid.videoHeight / vid.videoWidth) * w));
      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(vid, 0, 0, w, h);
      const frame = canvas.toDataURL('image/jpeg', 0.52);
      const mySide = pkRef.current?.rightHostId === user?.id ? 'right' : 'left';
      getSocket().emit('video:relay_frame', { roomId, frame, side: mySide });
    }, 330);
  };

  const toggleCamera = async () => {
    const socket = getSocket();
    const mySide = pkRef.current?.rightHostId === user?.id ? 'right' : 'left';
    if (localStreamRef.current) {
      if (relayTimerRef.current) {
        window.clearInterval(relayTimerRef.current);
        relayTimerRef.current = null;
      }
      localStreamRef.current.getTracks().forEach((tr) => tr.stop());
      localStreamRef.current = null;
      setCameraStream(null);
      for (const pc of peersRef.current.values()) pc.close();
      peersRef.current.clear();
      socket.emit('video:host_status', { roomId, live: false, side: mySide });
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 960 }, frameRate: { ideal: 24 } },
        audio: true,
      });
      localStreamRef.current = stream;
      setCameraStream(stream);
      socket.emit('video:host_status', { roomId, live: true, side: mySide });
      startAdaptiveRelay(stream);
    } catch {
      toast('Kamera ulanmadi', 'info');
    }
  };

  const sendChat = (e: React.FormEvent) => {
    e.preventDefault();
    const text = chatText.trim();
    if (!text || !roomId) return;
    setChatText('');

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
    setMessages((prev) => [...prev.slice(-45), optimisticMsg]);

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

  const formatTimer = (sec: number) =>
    `${String(Math.floor(sec / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`;

  const leftPct = pk
    ? pk.leftScore + pk.rightScore === 0
      ? 50
      : Math.max(12, Math.min(88, Math.round((pk.leftScore / (pk.leftScore + pk.rightScore)) * 100)))
    : 50;

  const recipients = pk?.active
    ? [
        { id: pk.leftHostId, name: pk.leftName, avatar: pk.leftAvatar, pkSide: 'left' as const },
        { id: pk.rightHostId, name: pk.rightName, avatar: pk.rightAvatar, pkSide: 'right' as const },
      ]
    : roomMeta?.host
    ? [{ id: roomMeta.host.id, name: roomMeta.host.displayName, avatar: roomMeta.host.avatar }]
    : [];

  return (
    <div className="min-h-screen flex flex-col bg-transparent relative overflow-hidden">
      <EntryBanner event={entryRide} />
      <GiftOverlay gift={activeGiftAnim} />

      {/* Header */}
      <header className="px-3 py-2.5 bg-white/65 backdrop-blur-2xl border-b border-white/85 flex items-center justify-between gap-2 z-30">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar src={roomMeta?.host?.avatar} name={roomMeta?.host?.displayName} size="sm" />
          <div className="min-w-0">
            <div className="text-xs font-extrabold text-slate-900 truncate max-w-[140px]">
              {roomMeta?.title || roomMeta?.host?.displayName}
            </div>
            <div className="text-[10px] font-bold text-amber-600">🪙 {totalGifts.toLocaleString()}</div>
          </div>
          {roomMeta?.hostId !== user?.id && (
            <button
              onClick={toggleFollow}
              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${isFollowing ? 'bg-slate-100 text-slate-600' : 'btn-brand'}`}
            >
              {isFollowing ? '✓' : 'Obuna'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <span className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-100 text-xs font-bold text-slate-700">
            <Users className="w-3.5 h-3.5 text-[#ff3366]" />
            {viewerCount}
          </span>
          <button onClick={toggleCamera} className="p-2 rounded-full bg-slate-100 text-slate-700">
            {cameraStream ? <Video className="w-4 h-4 text-emerald-600" /> : <VideoOff className="w-4 h-4" />}
          </button>
          <button onClick={() => navigate('/')} className="p-2 rounded-full bg-slate-100 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Video / PK Stage */}
      <div className="relative flex-1 flex flex-col">
        {pk ? (
          <div className="p-2.5 space-y-2">
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-2.5">
              <div className="flex items-center justify-between text-xs font-black mb-1.5">
                <span className="text-sky-600">{pk.leftScore.toLocaleString()}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#ff3366] text-white text-[11px]">
                  {pk.active ? `PK ${formatTimer(pkRemaining)}` : 'TUGADI'}
                </span>
                <span className="text-[#ff3366]">{pk.rightScore.toLocaleString()}</span>
              </div>
              <div className="h-3 rounded-full bg-slate-200 overflow-hidden flex">
                <div className="bg-sky-500 transition-all duration-500" style={{ width: `${leftPct}%` }} />
                <div className="bg-[#ff3366] transition-all duration-500 flex-1" />
              </div>
            </div>

            <div className="relative grid grid-cols-2 gap-1 h-72 rounded-2xl overflow-hidden">
              <VideoCanvas
                stream={roomMeta?.hostId === user?.id || pk.leftHostId === user?.id ? cameraStream : remoteLeftStream}
                relayFrame={leftRelayFrame}
                hostName={pk.leftName}
                hostAvatar={pk.leftAvatar}
                label="MEZBON"
                muted={roomMeta?.hostId === user?.id || pk.leftHostId === user?.id}
                compact
              />
              <VideoCanvas
                stream={pk.rightHostId === user?.id ? cameraStream : remoteRightStream}
                relayFrame={rightRelayFrame}
                hostName={pk.rightName}
                hostAvatar={pk.rightAvatar}
                label="RAQIB"
                muted={pk.rightHostId === user?.id}
                compact
              />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                <PkVsCrest />
              </div>
              {pk.active && !pk.rightHostId && user?.id !== pk.leftHostId && (
                <button
                  type="button"
                  onClick={() => getSocket().emit('pk:join_rival', { roomId })}
                  className="absolute bottom-3 right-3 z-30 px-3 py-1.5 rounded-full btn-brand text-[11px] font-black shadow-lg cursor-pointer"
                >
                  ⚔️ PK ga chiqish
                </button>
              )}
            </div>

            {!pk.active && pk.winner && (
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-2.5 text-center text-xs font-extrabold text-amber-800 flex items-center justify-center gap-1.5">
                <Trophy className="w-4 h-4 text-amber-500" />
                <span>{pk.winner === 'left' ? `${pk.leftName} g‘olib` : pk.winner === 'right' ? `${pk.rightName} g‘olib` : 'Durang'}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="h-[52vh] w-full">
            <VideoCanvas
              stream={roomMeta?.hostId === user?.id ? cameraStream : remoteLeftStream}
              relayFrame={leftRelayFrame}
              hostName={roomMeta?.host?.displayName || 'Host'}
              hostAvatar={roomMeta?.host?.avatar || ''}
              muted={roomMeta?.hostId === user?.id}
            />
          </div>
        )}

        {/* Chat */}
        <div className="flex-1 px-3 py-2 overflow-y-auto no-scrollbar max-h-[26vh] space-y-1.5 bg-transparent">
          {messages.map((m) => (
            <div key={m.id}>
              {m.type === 'SYSTEM' ? (
                <span className="inline-block px-2.5 py-1 rounded-xl bg-white/70 backdrop-blur-md border border-white/85 text-[11px] text-slate-600">
                  {m.text}
                </span>
              ) : m.type === 'GIFT' ? (
                <span className="inline-block px-2.5 py-1 rounded-xl bg-amber-50/85 backdrop-blur-md border border-amber-200 text-[11px] text-amber-700 font-bold">
                  🎁 {m.text}
                </span>
              ) : (
                <div className={`inline-block px-3 py-1.5 rounded-2xl text-xs ${m.bubble || 'bg-white/75 backdrop-blur-md border border-white/90 text-slate-900'}`}>
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
        </div>
      </div>

      {/* Bottom Dock */}
      <footer className="px-3 py-2.5 bg-white/65 backdrop-blur-2xl border-t border-white/85 flex items-center gap-1.5 z-20">
        <form onSubmit={sendChat} className="flex-1 flex items-center gap-1.5 bg-white/75 border border-white/90 rounded-full px-3 py-1.5">
          <input
            value={chatText}
            onChange={(e) => setChatText(e.target.value)}
            placeholder="Yozing..."
            className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none min-w-0"
          />
          <button type="submit" className="text-[#ff3366]">
            <Send className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={() => {
            if (!roomId) return;
            if (pk?.active) getSocket().emit('pk:stop', { roomId });
            else getSocket().emit('pk:start', { roomId, durationSec: 90 });
          }}
          className={`px-3 py-2 rounded-full text-xs font-extrabold flex items-center gap-1 ${
            pk?.active ? 'bg-slate-900 text-white' : 'btn-brand'
          }`}
        >
          <Swords className="w-3.5 h-3.5" />
          <span>{pk?.active ? 'Stop' : 'PK'}</span>
        </button>

        <button
          onClick={() => {
            if (!roomMeta?.hostId || !roomId) return;
            getSocket().emit('room:gift', { roomId, receiverId: roomMeta.hostId, giftId: 'gift-heart', quantity: 1, pkSide: 'left' });
          }}
          className="p-2.5 rounded-full bg-rose-50 text-[#ff3366]"
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
        onSend={({ giftId, quantity, receiverId, pkSide }) => {
          getSocket().emit('room:gift', { roomId, receiverId, giftId, quantity, pkSide });
        }}
      />
    </div>
  );
};
