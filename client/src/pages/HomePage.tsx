import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Coins, Users, Shield, RefreshCw, Swords, Search, X, ChevronRight, Crown, Plus } from 'lucide-react';
import { api } from '../lib/api';
import { fetchRoomsFromSupabase } from '../lib/supabaseSync';
import { useAuth } from '../context/AuthContext';
import { RoomSummary } from '../types';
import { LiveWaveBars, VipCrest, getStageWallpaper } from '../components/LuxuryBadges';
import { Avatar } from '../components/Avatar';
import { MYTHIC_DRAGONS } from '../lib/mythicCatalog';

const HERO_BANNERS = [
  {
    id: 'balcony-battle',
    to: '/games',
    badge: 'ODAMLARSIZ • BALKON ARENASI',
    title: 'Ajdarho vs Ajdarho Jangi 🔥',
    subtitle: '1-Tomon vs 2-Tomon • Balkonga chiqib olov purkash • Evolyutsiya',
    image: '/assets/balcony-dragon-poster.jpg',
    gradient: 'from-slate-950/90 via-slate-900/55 to-transparent',
    pillCls: 'bg-gradient-to-r from-orange-500 to-amber-400 text-slate-950',
  },
  {
    id: 'world-map',
    to: '/world',
    badge: '10 QIT’A • DAVLATLAR',
    title: 'Umumiy Dunyo & Mayning',
    subtitle: '10 ta Kristall koni, Davlatlar urushi, 20 ta Maxluqni do‘stlashtirish',
    image: '/assets/dragons/xaldris.jpg',
    gradient: 'from-purple-950/92 via-indigo-950/65 to-transparent',
    pillCls: 'bg-emerald-400 text-slate-950',
  },
  {
    id: 'dragons',
    to: '/shop',
    badge: 'VIP 1–12 • YAGONA AJDARHO',
    title: 'VIP Panellar & Ajdarho',
    subtitle: 'Xaldris afsonaviy ajdarhosi va VIP 1–12 imtiyozlar',
    image: '/assets/dragons/xaldris.jpg',
    gradient: 'from-slate-950/90 via-slate-900/60 to-transparent',
    pillCls: 'bg-amber-400 text-slate-950',
  },
];

export const HomePage: React.FC<{ onGoLive?: () => void }> = ({ onGoLive }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'ALL' | 'VOICE' | 'VIDEO' | 'GAME' | 'FOLLOWING'>('ALL');
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [bannerIdx, setBannerIdx] = useState(0);

  // Preload dragon thumbnails cleanly in background so GiftDrawer opens instantaneously
  useEffect(() => {
    MYTHIC_DRAGONS.forEach((d) => {
      const img = new Image();
      img.src = d.image;
    });
  }, []);

  // Auto-cycle hero promo banner like Ziigo / Bigo Live
  useEffect(() => {
    const id = window.setInterval(() => {
      setBannerIdx((prev) => (prev + 1) % HERO_BANNERS.length);
    }, 4500);
    return () => window.clearInterval(id);
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
      const source = supaRooms && supaRooms.length > 0 ? supaRooms : res.rooms || [];
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
    if (r.type === 'VIDEO') navigate(`/video/${r.id}`);
    else navigate(`/voice/${r.id}`);
  };

  const activeBanner = HERO_BANNERS[bannerIdx];

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
        {/* Ziigo-style Hero Event Banner Carousel */}
        {!searchOpen && (
          <div className="space-y-2.5">
            <button
              onClick={() => navigate(activeBanner.to)}
              className="relative w-full h-[116px] rounded-3xl overflow-hidden text-left shadow-lg border-2 border-white/80 block group"
            >
              <img
                src={activeBanner.image}
                alt={activeBanner.title}
                loading="eager"
                className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${activeBanner.gradient}`} />

              <div className="relative z-10 h-full px-4 py-3 flex flex-col justify-between max-w-[82%]">
                <span className={`w-fit px-2 py-0.5 rounded-full text-[9px] font-black tracking-wide ${activeBanner.pillCls}`}>
                  {activeBanner.badge}
                </span>
                <div>
                  <div className="text-[15px] font-black text-white leading-tight drop-shadow-xs">
                    {activeBanner.title}
                  </div>
                  <div className="text-[11px] font-medium text-white/90 truncate mt-0.5">
                    {activeBanner.subtitle}
                  </div>
                </div>
              </div>

              <span className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center">
                <ChevronRight className="w-4 h-4" />
              </span>

              {/* Slide Dots */}
              <div className="absolute bottom-2 right-3 flex items-center gap-1 z-10">
                {HERO_BANNERS.map((b, idx) => (
                  <span
                    key={b.id}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === bannerIdx ? 'w-4 bg-white' : 'w-1.5 bg-white/45'
                    }`}
                  />
                ))}
              </div>
            </button>

            {/* 4 Clean Compact Shortcut Pills */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { to: '/games', icon: '🔥', label: 'Balkon Jangi' },
                { to: '/world', icon: '🗺️', label: '10 Qit’a' },
                { to: '/market', icon: '🛍️', label: 'Market' },
                { to: '/admin', icon: '👑', label: '7 Panel' },
              ].map((item) => (
                <button
                  key={item.to}
                  onClick={() => navigate(item.to)}
                  className="flex flex-col items-center justify-center gap-1 py-2.5 rounded-2xl bg-white/46 backdrop-blur-xl border-2 border-white/80 hover:bg-white/70 shadow-xs active:scale-95 transition cursor-pointer"
                >
                  <span className="text-lg leading-none">{item.icon}</span>
                  <span className="text-[10px] font-black text-slate-800">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
                  </div>

                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/50 backdrop-blur-md text-[10px] font-bold text-white">
                    <Users className="w-2.5 h-2.5" />
                    <span>{r.viewerCount}</span>
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
    </div>
  );
};
