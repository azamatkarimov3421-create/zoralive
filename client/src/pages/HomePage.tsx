import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Users, Shield, RefreshCw, Swords, Search, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { RoomSummary } from '../types';
import { LiveWaveBars, getStageWallpaper } from '../components/LuxuryBadges';
import { getAnimatedFrameUrl } from '../lib/mythicCatalog';

export const HomePage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'VOICE' | 'VIDEO' | 'GAME' | 'FOLLOWING'>('ALL');
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');

  const loadRooms = async (q = searchQ) => {
    setLoading(true);
    try {
      const base = filter === 'FOLLOWING' ? '?following=1' : `?type=${filter}`;
      const qs = q.trim() ? `${base}&q=${encodeURIComponent(q.trim())}` : base;
      const res = await api<{ rooms: RoomSummary[] }>(`/rooms${qs}`);
      setRooms(res.rooms);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRooms(searchQ);
  }, [filter]);

  const openRoom = (r: RoomSummary) => {
    if (r.type === 'VIDEO') navigate(`/video/${r.id}`);
    else navigate(`/voice/${r.id}`);
  };

  return (
    <div className="bg-white min-h-full px-3.5 pt-3 pb-6 space-y-3.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <img src="/icon.svg" alt="ZoraLive" className="w-8 h-8 rounded-xl" />
          <span className="text-lg font-black tracking-tight text-slate-900">ZoraLive</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              setSearchOpen((v) => !v);
              if (searchOpen && searchQ) {
                setSearchQ('');
                loadRooms('');
              }
            }}
            className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            aria-label="Qidirish"
          >
            {searchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
          </button>
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              title="Admin"
            >
              <Shield className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => navigate('/profile?tab=wallet')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200/80 text-amber-700 text-xs font-extrabold"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
          </button>
        </div>
      </div>

      {/* Expandable Room Search */}
      {searchOpen && (
        <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3.5 py-2">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            autoFocus
            value={searchQ}
            onChange={(e) => {
              setSearchQ(e.target.value);
              loadRooms(e.target.value);
            }}
            placeholder="Xona nomi, ID yoki host..."
            className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
          />
        </div>
      )}

      {/* Live Hosts Strip */}
      {!searchOpen && rooms.length > 0 && (
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
          {rooms.slice(0, 6).map((r) => (
            <button
              key={`story-${r.id}`}
              onClick={() => openRoom(r)}
              className="flex flex-col items-center gap-1 shrink-0"
            >
              <div className="relative p-[2px] rounded-full bg-gradient-to-tr from-[#ff3366] to-amber-400">
                <div className="w-13 h-13 rounded-full overflow-hidden border-2 border-white bg-slate-100">
                  <img src={r.hostAvatar} alt={r.hostName} className="w-full h-full object-cover object-top" />
                </div>
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-[#ff3366] ring-2 ring-white" />
              </div>
              <span className="text-[11px] font-semibold text-slate-700 truncate max-w-[58px]">
                {r.hostName.split(' ')[0]}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Mythic Vault Quick Pills (VIP 1-12, 10 Dragons, 12 Animated Frames, 4 Crystal Energies) */}
      {!searchOpen && (
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { sub: 'VIP', icon: '👑', label: 'VIP 1-12', cls: 'bg-amber-50 border-amber-200/80 text-amber-800' },
            { sub: 'DRAGON', icon: '🐉', label: 'Ajdarho', cls: 'bg-rose-50 border-rose-200/80 text-rose-700' },
            { sub: 'FRAME', icon: '🖼️', label: 'Ramka', cls: 'bg-purple-50 border-purple-200/80 text-purple-700' },
            { sub: 'CRYSTAL', icon: '💎', label: 'Kristall', cls: 'bg-emerald-50 border-emerald-200/80 text-emerald-700' },
          ].map((btn) => (
            <button
              key={btn.sub}
              onClick={() => navigate(`/profile?tab=store&sub=${btn.sub}`)}
              className={`flex items-center justify-center gap-1 py-2 rounded-2xl border text-[11px] font-extrabold transition active:scale-95 ${btn.cls}`}
            >
              <span>{btn.icon}</span>
              <span>{btn.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Underline Category Tabs */}
      <div className="flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-4 overflow-x-auto no-scrollbar">
          {(
            [
              ['ALL', 'Hammasi'],
              ['VOICE', 'Ovozli'],
              ['VIDEO', 'Video'],
              ['GAME', 'O‘yin'],
              ['FOLLOWING', 'Obuna'],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`pb-2.5 text-xs font-extrabold whitespace-nowrap border-b-2 transition ${
                filter === key
                  ? 'text-slate-900 border-[#ff3366]'
                  : 'text-slate-400 border-transparent hover:text-slate-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button
          onClick={() => loadRooms(searchQ)}
          className="pb-2 pl-2 text-slate-400 hover:text-slate-700 shrink-0"
          aria-label="Yangilash"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* 4:5 Photo Cards */}
      {loading && rooms.length === 0 ? (
        <div className="grid grid-cols-2 gap-2.5">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="aspect-[4/5] rounded-2xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <div className="py-16 text-center text-sm font-semibold text-slate-400">Xonalar topilmadi</div>
      ) : (
        <div className="grid grid-cols-2 gap-2.5">
          {rooms.map((r) => {
            const roomFrameUrl = getAnimatedFrameUrl(r.hostFrame);
            return (
              <button
                key={r.id}
                onClick={() => openRoom(r)}
                className="group relative aspect-[4/5] rounded-2xl overflow-hidden text-left bg-slate-100 active:scale-[0.98] transition flex flex-col justify-between p-2.5 shadow-xs"
              >
                <img
                  src={r.hostAvatar || getStageWallpaper(r.theme)}
                  alt={r.hostName}
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-transparent to-black/25" />
                {roomFrameUrl && (
                  <img
                    src={roomFrameUrl}
                    alt=""
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 w-full h-full object-fill z-20 opacity-95"
                  />
                )}

                <div className="relative z-10 flex items-center justify-between gap-1 px-0.5 pt-0.5">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold text-white backdrop-blur-md ${
                      r.type === 'VIDEO'
                        ? 'bg-[#ff3366]/85'
                        : r.type === 'GAME'
                        ? 'bg-emerald-500/85'
                        : 'bg-slate-900/65'
                    }`}
                  >
                    <LiveWaveBars color="bg-white" className="h-2" />
                    <span>{r.type === 'VIDEO' ? 'LIVE' : r.type === 'GAME' ? 'GAME' : 'PARTY'}</span>
                  </span>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/45 backdrop-blur-md text-[10px] font-bold text-white">
                    <Users className="w-2.5 h-2.5" />
                    <span>{r.viewerCount}</span>
                  </span>
                </div>

                {r.hasPk && (
                  <span className="relative z-10 w-fit inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#ff3366] text-[9px] font-black text-white">
                    <Swords className="w-2.5 h-2.5" /> PK
                  </span>
                )}

                <div className="relative z-10 space-y-0.5 px-0.5 pb-0.5">
                  <div className="text-xs font-extrabold text-white line-clamp-1 drop-shadow-xs">{r.title}</div>
                  <div className="text-[10px] font-medium text-white/80 truncate">{r.hostName}</div>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
