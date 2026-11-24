import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Users, Shield, RefreshCw, Swords, Search, X, Crown, Plus, Lock, KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { fetchRoomsFromSupabase } from '../lib/supabaseSync';
import { getRoomSettings } from '../lib/roomSettings';
import { useAuth } from '../context/AuthContext';
import { RoomSummary } from '../types';
import { LiveWaveBars, VipCrest, getStageWallpaper } from '../components/LuxuryBadges';
import { Avatar } from '../components/Avatar';
import { MYTHIC_DRAGONS } from '../lib/mythicCatalog';

export const HomePage: React.FC<{ onGoLive?: () => void }> = ({ onGoLive }) => {
  const { user, toast } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'VOICE' | 'VIDEO' | 'GAME' | 'FOLLOWING'>('ALL');
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [lockedRoomPrompt, setLockedRoomPrompt] = useState<RoomSummary | null>(null);
  const [passInput, setPassInput] = useState('');

  // Preload dragon thumbnails cleanly in background so GiftDrawer opens instantaneously
  useEffect(() => {
    MYTHIC_DRAGONS.forEach((d) => {
      const img = new Image();
      img.src = d.image;
    });
  }, []);

  const loadRooms = async (q = searchQ) => {
    setLoading(true);
    try {
      const base = filter === 'FOLLOWING' ? '?following=1' : `?type=${filter}`;
      const qs = q.trim() ? `${base}&q=${encodeURIComponent(q.trim())}` : base;
      const [res, supaRooms] = await Promise.all([
        api<{ rooms: RoomSummary[] }>(`/rooms${qs}`).catch(() => ({ rooms: [] as RoomSummary[] })),
        fetchRoomsFromSupabase().catch(() => null),
      ]);
      const source = supaRooms !== null ? supaRooms : res.rooms || [];
      const combined: RoomSummary[] = [];
      const seen = new Set<string>();
      for (const r of source) {
        if (seen.has(r.id)) continue;
        if (filter !== 'ALL' && filter !== 'FOLLOWING' && r.type !== filter) continue;
        if (q.trim()) {
          const ql = q.trim().toLowerCase();
          if (
            !r.title.toLowerCase().includes(ql) &&
            !r.hostName.toLowerCase().includes(ql) &&
            !String(r.roomNumber).includes(ql)
          ) {
            continue;
          }
        }
        seen.add(r.id);
        combined.push(r);
      }
      setRooms(combined);
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
    const localCfg = getRoomSettings(r.id);
    const isLocked = Boolean(localCfg?.isLocked ?? r.isLocked);
    const roomPassword = localCfg?.password ?? r.roomPassword ?? '';
    const maxCap = localCfg?.maxCapacity ?? r.maxCapacity ?? r.seatCount ?? 0;

    if (r.hostId !== user?.id) {
      if (maxCap > 0 && r.viewerCount >= maxCap) {
        toast(`Xona to‘lgan (${maxCap} kishi)`, 'info');
        return;
      }
      if (isLocked) {
        if (!roomPassword) {
          toast('Bu xona muallif tomonidan qulflangan 🔒', 'info');
          return;
        }
        setLockedRoomPrompt({ ...r, isLocked, roomPassword });
        setPassInput('');
        return;
      }
    }

    if (r.type === 'VIDEO') navigate(`/video/${r.id}`);
    else navigate(`/voice/${r.id}`);
  };

  return (
    <div className="bg-transparent min-h-full pb-24">
      {/* Sticky Translucent Crystal Glass Top Header */}
      <header className="sticky top-0 z-30 bg-white/46 backdrop-blur-2xl px-3.5 pt-3 pb-2.5 border-b-2 border-white/75 shadow-[0_6px_24px_rgba(15,23,42,0.08)] space-y-2">
        <div className="flex items-center justify-between gap-2 min-w-0">
          {/* Primary Ziigo-style Top Tabs */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1 overflow-x-auto no-scrollbar">
            {(
              [
                ['ALL', 'Ommabop'],
                ['VOICE', 'Ovozli'],
                ['VIDEO', 'Video'],
                ['GAME', 'O‘yin'],
                ['FOLLOWING', 'Obuna'],
              ] as const
            ).map(([key, label]) => {
              const active = filter === key;
              return (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`relative pb-1 whitespace-nowrap transition ${
                    active ? 'text-[15px] font-black text-slate-950' : 'text-[13px] font-bold text-slate-400 hover:text-slate-700'
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-5 h-[3px] rounded-full bg-gradient-to-r from-[#ff3366] to-amber-400" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1 shrink-0">
            {onGoLive && (
              <button
                onClick={onGoLive}
                className="p-1.5 rounded-full btn-brand text-white shadow-xs"
                title="Yangi Ovozli / Video xona ochish"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.8]" />
              </button>
            )}

            <button
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen && searchQ) {
                  setSearchQ('');
                  loadRooms('');
                }
              }}
              className="p-1.5 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
              aria-label="Qidirish"
            >
              {searchOpen ? <X className="w-3.5 h-3.5" /> : <Search className="w-3.5 h-3.5" />}
            </button>

            <button
              onClick={() => navigate('/admin')}
              className="p-1.5 rounded-full bg-slate-900 text-amber-300 hover:bg-slate-800"
              title="Owner & 7 Boshqaruv Paneli"
            >
              <Shield className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={() => navigate('/profile?tab=wallet')}
              className="flex items-center gap-1 px-2 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-[10.5px] font-black"
            >
              <Coins className="w-3 h-3 text-amber-500" />
              <span>{(user?.coins || 0).toLocaleString()}</span>
            </button>
          </div>
        </div>

        {/* Expandable Search Input */}
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
              placeholder="Xona nomi, ID yoki host qidiring..."
              className="flex-1 bg-transparent text-xs text-slate-900 focus:outline-none"
            />
          </div>
        )}
      </header>

      <div className="px-3.5 pt-3 space-y-4">
        {/* Active Live Hosts Row (1:1 Crisp Animated Frames!) */}
        {!searchOpen && rooms.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5 text-amber-500" />
                <span className="text-xs font-black text-slate-900">Top Jonli Hostlar</span>
              </div>
              <button
                onClick={() => loadRooms(searchQ)}
                className="flex items-center gap-1 text-[11px] font-bold text-slate-400 hover:text-slate-700"
              >
                <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                <span>Yangilash</span>
              </button>
            </div>

            <div className="flex items-center gap-3.5 overflow-x-auto no-scrollbar py-2 px-1">
              {rooms.slice(0, 6).map((r) => (
                <button
                  key={`story-${r.id}`}
                  onClick={() => openRoom(r)}
                  className="flex flex-col items-center gap-2 shrink-0"
                >
                  <Avatar
                    src={r.hostAvatar}
                    name={r.hostName}
                    size="md"
                    frame={r.hostFrame}
                    vipLevel={r.hostVip}
                    hideVipBadge
                  />
                  <span className="text-[11px] font-bold text-slate-700 truncate max-w-[60px]">
                    {r.hostName.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Razor-Sharp 2-Column Live Room Cards (Zero Distortion!) */}
        {loading && rooms.length === 0 ? (
          <div className="grid grid-cols-2 gap-2.5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="aspect-[4/5] rounded-3xl bg-white/38 backdrop-blur-xl border-2 border-white/70 animate-pulse" />
            ))}
          </div>
        ) : rooms.length === 0 ? (
          <div className="py-12 px-4 text-center space-y-3 rounded-3xl bg-white/46 backdrop-blur-xl border-2 border-white/80 shadow-sm">
            <div className="text-sm font-black text-slate-800">Hozircha jonli efir xonalari yo‘q</div>
            {onGoLive && (
              <button
                onClick={onGoLive}
                className="px-5 py-2.5 rounded-full btn-brand text-xs font-black shadow-md active:scale-95 transition cursor-pointer"
              >
                🎙️ Birinchi Jonli Efirni Ochish
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2.5">
            {rooms.map((r) => (
              <button
                key={r.id}
                onClick={() => openRoom(r)}
                className="group relative aspect-[4/5] rounded-3xl overflow-hidden text-left bg-slate-900 active:scale-[0.98] transition flex flex-col justify-between p-2.5 shadow-lg border-2 border-white/75"
              >
                <img
                  src={r.hostAvatar || getStageWallpaper(r.theme)}
                  alt={r.hostName}
                  loading="eager"
                  className="absolute inset-0 w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/15 to-black/30" />

                {/* Top Badges */}
                <div className="relative z-10 flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-black text-white backdrop-blur-md ${
                        r.type === 'VIDEO'
                          ? 'bg-[#ff3366]/90'
                          : r.type === 'GAME'
                          ? 'bg-emerald-500/90'
                          : 'bg-slate-900/75'
                      }`}
                    >
                      <LiveWaveBars color="bg-white" className="h-2" />
                      <span>{r.type === 'VIDEO' ? 'LIVE' : r.type === 'GAME' ? 'O‘YIN' : 'OVOZLI'}</span>
                    </span>

                    {r.hasPk && (
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-400 text-[9px] font-black text-slate-950">
                        <Swords className="w-2.5 h-2.5" /> PK
                      </span>
                    )}
                    {(getRoomSettings(r.id)?.isLocked || r.isLocked) && (
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-400 text-slate-950">
                        <Lock className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white">
                    <Users className="w-2.5 h-2.5" />
                    <span>
                      {r.viewerCount}
                      {(getRoomSettings(r.id)?.maxCapacity || r.maxCapacity) ? `/${getRoomSettings(r.id)?.maxCapacity || r.maxCapacity}` : ''}
                    </span>
                  </span>
                </div>

                {/* Bottom Room Title & Host Strip */}
                <div className="relative z-10 space-y-1">
                  <div className="text-[12px] font-extrabold text-white leading-snug line-clamp-2 drop-shadow-xs">
                    {r.title}
                  </div>
                  <div className="flex items-center justify-between gap-1 pt-0.5">
                    <span className="text-[10px] font-semibold text-white/85 truncate">{r.hostName}</span>
                    {r.hostVip > 0 && <VipCrest level={r.hostVip} size="xs" />}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {lockedRoomPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-sm p-4"
          onClick={() => setLockedRoomPrompt(null)}
        >
          <form
            onClick={(e) => e.stopPropagation()}
            onSubmit={(e) => {
              e.preventDefault();
              if (passInput.trim() !== (lockedRoomPrompt.roomPassword || '')) {
                toast('Parol noto‘g‘ri!', 'error');
                return;
              }
              const target = lockedRoomPrompt;
              setLockedRoomPrompt(null);
              if (target.type === 'VIDEO') navigate(`/video/${target.id}`);
              else navigate(`/voice/${target.id}`);
            }}
            className="w-full max-w-xs bg-white/90 backdrop-blur-2xl border-2 border-white rounded-3xl p-4 space-y-3 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-sm font-black text-slate-900">
                <Lock className="w-4 h-4 text-amber-500" />
                <span>Parolni kiriting</span>
              </div>
              <button
                type="button"
                onClick={() => setLockedRoomPrompt(null)}
                className="p-1 rounded-full bg-slate-100 text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[11px] font-semibold text-slate-500 truncate">{lockedRoomPrompt.title}</p>
            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl px-3 py-2">
              <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
              <input
                autoFocus
                value={passInput}
                onChange={(e) => setPassInput(e.target.value)}
                placeholder="Xona paroli..."
                className="flex-1 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
            <button type="submit" className="w-full py-2.5 rounded-full btn-brand text-xs font-black cursor-pointer">
              Kirish
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
