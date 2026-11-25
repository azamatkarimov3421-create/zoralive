import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  CheckCircle2,
  Briefcase,
  Shield,
  Crown,
  LogOut,
  Coins,
  Gem,
  Copy,
  Users,
  Pencil,
  X,
  Camera,
  History,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  Star,
  Heart,
  Eye,
  Gift,
  Send,
  ShoppingBag,
  HelpCircle,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import { syncProfileToSupabase } from '../lib/supabaseSync';
import { useAuth } from '../context/AuthContext';
import { useWorld } from '../context/WorldContext';
import { MILITARY_RANKS_10 } from '../lib/worldEcosystemData';
import { Avatar, getFrameScale } from '../components/Avatar';
import { CinematicVideoDragon } from '../components/CinematicVideoDragon';
import {
  DRAGON_THEMES,
  DEFAULT_DRAGON_THEME_ID,
  DragonThemeId,
  getDragonTheme,
} from '../lib/dragonThemes';
import { VipCrest } from '../components/LuxuryBadges';
import { Lang } from '../types';

function resizeAvatar(file: File, maxDim = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        const ratio = Math.min(1, maxDim / Math.max(img.width, img.height));
        cv.width = maxDim === 256 ? 256 : Math.round(img.width * ratio);
        cv.height = maxDim === 256 ? 256 : Math.round(img.height * ratio);
        if (maxDim === 256) {
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          cv.getContext('2d')?.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
        } else {
          cv.getContext('2d')?.drawImage(img, 0, 0, cv.width, cv.height);
        }
        resolve(cv.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = reject;
      img.src = String(r.result);
    };
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

const STUDIO_AVATARS = [
  '/assets/avatar-madina.jpg',
  '/assets/avatar-jasur.jpg',
  '/assets/avatar-laylo.jpg',
  '/assets/avatar-sardor.jpg',
  '/assets/avatar-abrorbek.jpg',
];

const COVER_PRESETS = [
  { id: 'galaxy', label: 'Galaxy', img: '/assets/stage-galaxy.jpg' },
  { id: 'palace', label: 'Saroy', img: '/assets/stage-palace.jpg' },
  { id: 'ocean', label: 'Okean', img: '/assets/stage-ocean.jpg' },
  { id: 'neon', label: 'Neon', img: '/assets/stage-neon.jpg' },
];

const COUNTRY_OPTIONS = [
  { code: 'UZ', flag: '🇺🇿', label: 'O‘zbekiston' },
  { code: 'KZ', flag: '🇰🇿', label: 'Qozog‘iston' },
  { code: 'RU', flag: '🇷🇺', label: 'Rossiya' },
  { code: 'TR', flag: '🇹🇷', label: 'Turkiya' },
  { code: 'US', flag: '🇺🇸', label: 'AQSh' },
];

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, lang, setLang, logout, toast } = useAuth();
  const { state: worldState } = useWorld();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');

  // Primary Curved Reference Tabs: Men haqimda | Shon-sharaf | Lahza
  const [mainSection, setMainSection] = useState<'about' | 'honor' | 'moments'>('about');

  // Inner Convenience Utility Tabs inside "Men haqimda"
  const [tab, setTab] = useState<'wallet' | 'clan' | 'tasks' | 'agency'>(
    rawTab === 'clan' || rawTab === 'tasks' || rawTab === 'agency' ? rawTab : 'wallet'
  );
  const currentRank = MILITARY_RANKS_10[worldState.rankLevel - 1] || MILITARY_RANKS_10[0];

  const [walletData, setWalletData] = useState<any>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [showThemes, setShowThemes] = useState(false);
  const [cpHelpOpen, setCpHelpOpen] = useState(false);
  const [payProvider, setPayProvider] = useState('Click');
  const [exchangeAmt, setExchangeAmt] = useState('100');

  const [tasks, setTasks] = useState<any[]>([]);
  const [myMoments, setMyMoments] = useState<any[]>([]);
  const [momentText, setMomentText] = useState('');
  const [momentImg, setMomentImg] = useState('');

  // Family / Clan state
  const [familyData, setFamilyData] = useState<any>(null);
  const [clanName, setClanName] = useState('');
  const [clanTag, setClanTag] = useState('');
  const [clanBadge, setClanBadge] = useState('👑');

  // Agency state
  const [agencyData, setAgencyData] = useState<any>(null);
  const [joinCode, setJoinCode] = useState('');
  const [newAgName, setNewAgName] = useState('');
  const [newAgCode, setNewAgCode] = useState('');

  // Custom Cover image persisted per-user
  const [coverUrl, setCoverUrl] = useState<string>(() => {
    try {
      return localStorage.getItem('zoralive_profile_cover') || '/assets/stage-galaxy.jpg';
    } catch {
      return '/assets/stage-galaxy.jpg';
    }
  });

  // Edit Profile Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');
  const [editCover, setEditCover] = useState('');
  const [editGender, setEditGender] = useState('male');
  const [editCountry, setEditCountry] = useState('UZ');

  // Real visitors counter (starts at 0, no fake demo numbers)
  const [visitorsCount] = useState<number>(() => {
    try {
      const key = `zoralive_visitors_${user?.id || 'me'}`;
      return Number(localStorage.getItem(key) || 0);
    } catch {
      return 0;
    }
  });

  useEffect(() => {
    try {
      localStorage.removeItem('zoralive_dragon_config');
    } catch {}
  }, []);

  const [dragonThemeId, setDragonThemeId] = useState<DragonThemeId>(() => {
    try {
      const saved = localStorage.getItem('zoralive_dragon_theme') as DragonThemeId | null;
      if (saved && DRAGON_THEMES.some((t) => t.id === saved)) return saved;
    } catch {}
    return DEFAULT_DRAGON_THEME_ID;
  });

  const selectDragonTheme = (id: DragonThemeId) => {
    setDragonThemeId(id);
    try {
      localStorage.setItem('zoralive_dragon_theme', id);
    } catch {}
    const spec = getDragonTheme(id);
    toast(`${spec.emoji} ${spec.nameUz} fon yoqildi`, 'success');
  };

  const loadTabData = async (currentTab = tab) => {
    try {
      if (currentTab === 'wallet') setWalletData(await api('/wallet'));
      else if (currentTab === 'clan') setFamilyData(await api('/families'));
      else if (currentTab === 'tasks') setTasks((await api('/tasks')).tasks || []);
      else if (currentTab === 'agency') setAgencyData(await api('/agency/me'));
    } catch {
      // ignore
    }
  };

  const loadMoments = async () => {
    try {
      const res = await api<{ moments: any[] }>('/moments');
      setMyMoments((res.moments || []).filter((m) => !user?.id || m.userId === user.id || m.user_id === user.id));
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  useEffect(() => {
    if (mainSection === 'moments') loadMoments();
  }, [mainSection]);

  if (!user) return null;

  const toggleGenderQuick = async () => {
    const nextGender = user.gender === 'female' ? 'male' : 'female';
    try {
      await syncProfileToSupabase({ id: user.id, gender: nextGender });
      await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ gender: nextGender }),
      }).catch(() => {});
      await refreshUser();
      toast(nextGender === 'female' ? 'Jins: ♀ Ayol tanlandi' : 'Jins: ♂ Erkak tanlandi', 'success');
    } catch {
      // ignore
    }
  };

  const openEditor = () => {
    setEditName(user.displayName);
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar);
    setEditCover(coverUrl);
    setEditGender(user.gender === 'female' ? 'female' : 'male');
    setEditCountry(user.country || 'UZ');
    setEditOpen(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanName = editName.trim() || user.displayName;
      if (editCover) {
        setCoverUrl(editCover);
        try {
          localStorage.setItem('zoralive_profile_cover', editCover);
        } catch {}
      }
      await syncProfileToSupabase({
        id: user.id,
        displayName: cleanName,
        bio: editBio,
        avatar: editAvatar,
        gender: editGender,
        country: editCountry,
      });
      await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({
          displayName: cleanName,
          bio: editBio,
          avatar: editAvatar,
          gender: editGender,
          country: editCountry,
        }),
      }).catch(() => {});
      await refreshUser();
      setEditOpen(false);
      toast('Profil saqlandi', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  const hasDragon = Boolean(user?.activeRide && user.activeRide.includes('dragon') && user.activeRide !== 'none');
  const dragonTheme = getDragonTheme(dragonThemeId);
  const countryFlag = COUNTRY_OPTIONS.find((c) => c.code === (user.country || 'UZ'))?.flag || '🇺🇿';
  const sentGiftsCoins = (walletData?.ledger || [])
    .filter((tx: any) => Number(tx.amount) < 0)
    .reduce((acc: number, tx: any) => acc + Math.abs(Number(tx.amount) || 0), 0);

  const statsAndLevelsBlock = (
    <div className={hasDragon ? 'space-y-3' : 'px-4 space-y-3'}>
      {/* 5-Stat Frosted Glass Card */}
      <div
        className={`rounded-3xl backdrop-blur-2xl border border-white/15 shadow-[0_12px_32px_rgba(0,0,0,0.35)] py-3 px-1.5 grid grid-cols-5 text-center gap-0.5 ${
          hasDragon ? 'bg-black/45' : 'bg-white/10'
        }`}
      >
        <button
          type="button"
          onClick={() => navigate('/social')}
          className="flex flex-col items-center gap-1 py-0.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
          <span className="text-xs font-black text-white">{user.followingCount ?? 0}</span>
          <span className="text-[10px] font-semibold text-white/70 leading-tight">Kuzatish</span>
        </button>

        <button
          type="button"
          onClick={() => navigate('/social')}
          className="flex flex-col items-center gap-1 py-0.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <Heart className="w-4 h-4 text-rose-400 fill-rose-400" />
          <span className="text-xs font-black text-white">{user.followersCount ?? 0}</span>
          <span className="text-[10px] font-semibold text-white/70 leading-tight">Muxlislar</span>
        </button>

        <div className="flex flex-col items-center gap-1 py-0.5">
          <Eye className="w-4 h-4 text-violet-400" />
          <span className="text-xs font-black text-white">{visitorsCount}</span>
          <span className="text-[10px] font-semibold text-white/70 leading-tight">Mehmonlar</span>
        </div>

        <button
          type="button"
          onClick={() => {
            setMainSection('about');
            setTab('wallet');
          }}
          className="flex flex-col items-center gap-1 py-0.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <Gift className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-black text-white">{(user.diamonds || 0).toLocaleString()}</span>
          <span className="text-[10px] font-semibold text-white/70 leading-tight">Qabul qilindi</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setMainSection('about');
            setTab('wallet');
          }}
          className="flex flex-col items-center gap-1 py-0.5 rounded-xl hover:bg-white/10 transition cursor-pointer"
        >
          <Send className="w-4 h-4 text-sky-400" />
          <span className="text-xs font-black text-white">{sentGiftsCoins.toLocaleString()}</span>
          <span className="text-[10px] font-semibold text-white/70 leading-tight">Yuborish</span>
        </button>
      </div>

      {/* 3 Compact Level Pills Row */}
      <div className="grid grid-cols-3 gap-2">
        <button
          type="button"
          onClick={() => setMainSection('honor')}
          className="rounded-2xl py-2 px-2 bg-gradient-to-br from-amber-500/25 to-orange-900/45 border border-amber-300/30 backdrop-blur-md flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition"
        >
          <span className="text-[10px] font-bold text-amber-200 truncate w-full text-center">Boylik qiymati</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/30 border border-amber-300/50 text-[11px] font-black text-amber-200">
            <span>{user.wealthLevel || 1}</span>
            <span>🪙</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('honor')}
          className="rounded-2xl py-2 px-2 bg-gradient-to-br from-fuchsia-500/25 to-purple-900/45 border border-fuchsia-300/30 backdrop-blur-md flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition"
        >
          <span className="text-[10px] font-bold text-fuchsia-200 truncate w-full text-center">Daromad darajasi</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/35 border border-rose-300/50 text-[11px] font-black text-rose-100">
            <span>💎</span>
            <span>{user.charmLevel || 1}</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => setMainSection('honor')}
          className="rounded-2xl py-2 px-2 bg-gradient-to-br from-teal-500/25 to-cyan-900/45 border border-cyan-300/30 backdrop-blur-md flex flex-col items-center gap-1 cursor-pointer active:scale-95 transition"
        >
          <span className="text-[10px] font-bold text-cyan-200 truncate w-full text-center">VIP & Unvon</span>
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-500/30 border border-cyan-300/50 text-[11px] font-black text-cyan-100">
            <span>{user.vipLevel > 0 ? `V${user.vipLevel}` : `Lv.${currentRank.level}`}</span>
            <span>🛡️</span>
          </span>
        </button>
      </div>
    </div>
  );

  return (
    <div
      className={
        hasDragon
          ? 'dragon-dark-surface relative min-h-screen bg-[#07070c] text-white overflow-x-clip pb-28'
          : 'dragon-dark-surface relative min-h-screen bg-gradient-to-b from-[#0b1030] via-[#10163d] to-[#161c4a] text-white overflow-x-clip pb-28'
      }
    >
      {/* Full-Page VIP Dragon Backdrop if dragon is equipped, otherwise scenic Top Cover Banner */}
      {hasDragon ? (
        <div className="pointer-events-none select-none absolute inset-0 z-0 overflow-clip">
          <div className="sticky top-0 w-full h-screen">
            <img
              src={dragonTheme.bgImage}
              alt={dragonTheme.nameUz}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.14) 30%, rgba(0,0,0,0.58) 64%, rgba(7,7,12,0.84) 100%)',
              }}
            />
            <div className="absolute inset-0" style={{ boxShadow: `inset 0 0 38px ${dragonTheme.dragonGlow}` }} />
          </div>
        </div>
      ) : (
        <>
          <div className="relative h-44 w-full overflow-hidden">
            <img src={coverUrl} alt="" className="w-full h-full object-cover object-center" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/15 to-[#0b1030]" />
          </div>
          {/* Top Overlay Navigation Bar: < Back | Shaxsiy ma'lumotlar kartasi | Edit & Logout */}
          <header className="absolute top-0 left-0 right-0 z-40 px-3.5 pt-3 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition cursor-pointer"
              title="Orqaga"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <span className="text-[13.5px] font-extrabold text-white tracking-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)] truncate">
              Shaxsiy ma’lumotlar kartasi
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={openEditor}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 border border-white/20 backdrop-blur-md flex items-center justify-center text-white active:scale-95 transition cursor-pointer"
                title="Profilni tahrirlash"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  navigate('/login');
                }}
                className="w-8 h-8 rounded-full bg-black/40 hover:bg-rose-500/70 border border-white/20 backdrop-blur-md flex items-center justify-center text-white/90 active:scale-95 transition cursor-pointer"
                title="Chiqish"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>
        </>
      )}

      {/* Main Content Container */}
      <div className={hasDragon ? 'relative z-20 px-3.5 pt-2.5 space-y-3.5' : 'relative z-20 -mt-11 space-y-3.5'}>
        {hasDragon ? (
          <>
            {/* Classic VIP Dragon Top Utility Bar */}
            <div className="relative z-40 flex items-center justify-between gap-2">
              <div className="flex gap-0.5 rounded-full p-1 border-2 bg-black/45 border-white/25 backdrop-blur-2xl">
                {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                  <button
                    key={l}
                    onClick={() => setLang(l)}
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                      lang === l ? 'bg-white text-slate-950 shadow-sm' : 'text-white/80 hover:text-white'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                {user.role === 'OWNER' && (
                  <button
                    onClick={() => navigate('/admin')}
                    className="px-3.5 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 border-2 shadow-sm transition active:scale-95 cursor-pointer bg-black/45 hover:bg-black/75 border-amber-300/60 text-amber-300 backdrop-blur-2xl"
                    title="Ega Paneli"
                  >
                    <Crown className="w-3.5 h-3.5 text-amber-400" />
                    <span>Ega Paneli</span>
                  </button>
                )}
                <button
                  onClick={async () => {
                    await logout();
                    navigate('/login');
                  }}
                  className="p-2 rounded-full border-2 transition active:scale-95 cursor-pointer bg-black/45 border-white/25 text-white/90 hover:text-rose-400 backdrop-blur-2xl"
                  title="Chiqish"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Restored Centered VIP Dragon Hero Stage (exact ee6b4f0 position & feel) */}
            <div className="relative flex flex-col items-center text-center pt-44 pb-2">
              <div className="relative z-20 p-2 flex items-center justify-center">
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size="xl"
                  frame={user.activeFrame}
                  vipLevel={user.vipLevel}
                />
                <CinematicVideoDragon
                  frameTopPx={40 * getFrameScale(user.activeFrame)}
                  glowColor={dragonTheme.dragonGlow}
                />
              </div>

              <div className="relative z-30 mt-3 flex items-center justify-center gap-2 flex-wrap">
                <h2 className="text-[20px] font-black italic text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                  {user.displayName}
                </h2>
                <button
                  type="button"
                  onClick={toggleGenderQuick}
                  title="Jinsni o‘zgartirish (Erkak / Ayol)"
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black shadow-sm active:scale-90 transition cursor-pointer ${
                    user.gender === 'female' ? 'bg-pink-500 text-white' : 'bg-sky-500 text-white'
                  }`}
                >
                  {user.gender === 'female' ? '♀' : '♂'}
                </button>
                {user.vipLevel > 0 && <VipCrest level={user.vipLevel} size="sm" />}
                <button
                  onClick={openEditor}
                  className="p-1.5 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white/90 backdrop-blur-md transition active:scale-95 cursor-pointer"
                  title="Tahrirlash"
                >
                  <Pencil className="w-3 h-3" />
                </button>
              </div>

              <div className="relative z-30 flex items-center justify-center gap-2 mt-1.5 flex-wrap">
                <button
                  onClick={() => {
                    navigator.clipboard?.writeText(String(user.uid));
                    toast(`ID: ${user.uid} nusxalandi`, 'info');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/80 via-emerald-600/85 to-emerald-700/90 border border-amber-300/70 text-[11px] font-black text-white shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <span className="px-1 rounded-full bg-amber-300 text-slate-950 text-[9px] font-black">ID</span>
                  <span>{user.uid}</span>
                  <Copy className="w-3 h-3 text-white/85" />
                </button>
                <span className="text-base leading-none">{countryFlag}</span>
                {user.role && user.role !== 'USER' && (
                  <button
                    type="button"
                    onClick={() => navigate('/staff-panel')}
                    className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-600/85 to-indigo-600/85 border border-fuchsia-300/60 text-[10px] font-black text-white shadow-sm cursor-pointer"
                  >
                    🛡️ {user.role}
                  </button>
                )}
              </div>

              {user.bio && (
                <p className="relative z-30 mt-1.5 text-xs font-semibold text-white/85 max-w-[280px] drop-shadow-xs">
                  {user.bio}
                </p>
              )}

              <div className="relative z-30 flex items-center justify-center gap-2 mt-2.5 flex-wrap">
                <div className="inline-flex items-center justify-center gap-3 px-3.5 py-1 rounded-full bg-black/45 border border-white/15 backdrop-blur-md text-xs text-white/90 font-semibold">
                  <span>
                    <b className="text-white font-black">{user.followersCount ?? 0}</b> obunachi
                  </span>
                  <span className="w-1 h-1 rounded-full bg-white/45" />
                  <span>
                    <b className="text-white font-black">{user.followingCount ?? 0}</b> obuna
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowThemes((v) => !v)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/50 hover:bg-black/70 border border-white/25 backdrop-blur-md text-[11px] font-black text-white transition active:scale-95 cursor-pointer"
                >
                  <span>{dragonTheme.emoji}</span>
                  <span>{dragonTheme.shortUz}</span>
                  {showThemes ? <ChevronUp className="w-3 h-3 text-white/75" /> : <ChevronDown className="w-3 h-3 text-white/75" />}
                </button>
              </div>

              {showThemes && (
                <div className="relative z-30 w-full mt-3 p-2 rounded-2xl bg-black/45 border border-white/20 backdrop-blur-xl">
                  <div className="grid grid-cols-3 gap-1.5">
                    {DRAGON_THEMES.map((t) => {
                      const isActive = t.id === dragonTheme.id;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            selectDragonTheme(t.id);
                            setShowThemes(false);
                          }}
                          className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[10.5px] font-black backdrop-blur-md transition active:scale-95 cursor-pointer ${
                            isActive
                              ? t.activePillClass
                              : 'bg-black/40 border-white/15 text-white/85 hover:bg-black/60 hover:border-white/35'
                          }`}
                          title={`${t.nameUz} — ${t.taglineUz}`}
                        >
                          <span className="text-xs leading-none">{t.emoji}</span>
                          <span className="truncate">{t.shortUz}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Shaxsiy Ma'lumotlar Kartasi Identity Block (Left-aligned like reference) */
          <div className="px-4 space-y-2.5">
            <div className="flex items-end justify-between gap-3">
              <div className="relative p-1 rounded-full bg-[#0b1030]/80 ring-2 ring-white/35 shadow-2xl">
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size="xl"
                  frame={user.activeFrame}
                  vipLevel={user.vipLevel}
                />
              </div>

              <div className="flex items-center gap-1.5 pb-1">
                {user.role === 'OWNER' && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin')}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-400 text-slate-950 text-[10.5px] font-black shadow-md cursor-pointer"
                  >
                    <Crown className="w-3 h-3" />
                    <span>Ega Paneli</span>
                  </button>
                )}
              </div>
            </div>

            {/* Name + Gender Symbol + VIP Crest */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-[19px] font-black italic tracking-wide text-white drop-shadow-xs">
                  {user.displayName}
                </h1>
                <button
                  type="button"
                  onClick={toggleGenderQuick}
                  title="Jinsni o‘zgartirish (Erkak / Ayol)"
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-black shadow-sm active:scale-90 transition cursor-pointer ${
                    user.gender === 'female' ? 'bg-pink-500 text-white' : 'bg-sky-500 text-white'
                  }`}
                >
                  {user.gender === 'female' ? '♀' : '♂'}
                </button>
                {user.vipLevel > 0 && <VipCrest level={user.vipLevel} size="sm" />}
              </div>

              {/* Ornate ID Pill + Copy + Flag */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(String(user.uid));
                    toast(`ID: ${user.uid} nusxalandi`, 'info');
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/80 via-emerald-600/85 to-emerald-700/90 border border-amber-300/70 text-[11px] font-black text-white shadow-sm active:scale-95 transition cursor-pointer"
                >
                  <span className="px-1 rounded-full bg-amber-300 text-slate-950 text-[9px] font-black">ID</span>
                  <span>{user.uid}</span>
                  <Copy className="w-3 h-3 text-white/85" />
                </button>
                <span className="text-base leading-none" title={user.country || 'UZ'}>
                  {countryFlag}
                </span>
                {user.role && user.role !== 'USER' && (
                  <button
                    type="button"
                    onClick={() => navigate('/staff-panel')}
                    className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-fuchsia-600/85 to-indigo-600/85 border border-fuchsia-300/60 text-[10px] font-black text-white shadow-sm cursor-pointer"
                  >
                    🛡️ {user.role}
                  </button>
                )}
                {agencyData?.myAgency && (
                  <span className="px-2.5 py-0.5 rounded-full bg-purple-600/70 border border-purple-300/50 text-[10px] font-black text-white">
                    Agency: {agencyData.myAgency.code}
                  </span>
                )}
              </div>

              {/* Bio */}
              <p className="text-xs font-semibold text-white/80 leading-snug">
                {user.bio || 'ZoraLive a’zosi ✨'}
              </p>
            </div>
          </div>
        )}

        {statsAndLevelsBlock}

        {/* Curved Bottom Sheet Container */}
        <div
          className={
            hasDragon
              ? 'rounded-3xl bg-black/42 backdrop-blur-xl border border-white/15 px-3.5 pt-3.5 pb-6 space-y-3.5'
              : 'rounded-t-[28px] bg-[#141a44]/88 backdrop-blur-2xl border-t border-white/15 px-3.5 pt-3.5 pb-6 space-y-3.5 min-h-[380px]'
          }
        >
          {/* 3 Main Profile Tabs */}
          <div className="flex items-center gap-6 px-1 border-b border-white/10 pb-2">
            {(
              [
                ['about', 'Men haqimda'],
                ['honor', 'Shon-sharaf'],
                ['moments', 'Lahza'],
              ] as const
            ).map(([k, label]) => {
              const active = mainSection === k;
              return (
                <button
                  key={k}
                  type="button"
                  onClick={() => setMainSection(k)}
                  className={`relative pb-1.5 text-[13.5px] font-black transition cursor-pointer ${
                    active ? 'text-white' : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  {label}
                  {active && (
                    <span className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 w-6 h-[3px] rounded-full bg-white shadow-[0_0_8px_#fff]" />
                  )}
                </button>
              );
            })}
          </div>

          {/* SECTION 1: MEN HAQIMDA */}
          {mainSection === 'about' && (
            <div className="space-y-3.5">
              {/* CP + Shop Banner Card (matching bottom of reference screenshot) */}
              <div className="rounded-3xl bg-gradient-to-br from-sky-500/20 via-indigo-600/20 to-fuchsia-500/20 border border-sky-300/30 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setCpHelpOpen((v) => !v)}
                    className="flex items-center gap-1.5 text-xs font-black text-white cursor-pointer"
                  >
                    <span>CP</span>
                    <HelpCircle className="w-3.5 h-3.5 text-white/75" />
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 border border-white/25 text-[11px] font-black text-white transition cursor-pointer"
                    title="Savdo do‘koniga o‘tish"
                  >
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-300" />
                    <span>Do‘kon</span>
                  </button>
                </div>

                {cpHelpOpen && (
                  <p className="text-[11px] font-semibold text-white/80 bg-black/30 rounded-xl px-3 py-1.5">
                    Do‘kon bo‘limidan VIP 1–12 imtiyozlar, ramkalar va afsonaviy Xaldris ajdarhosini tekinga oling.
                  </p>
                )}

                <div className="flex items-center justify-between gap-2 bg-black/25 border border-white/15 rounded-2xl p-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Avatar src={user.avatar} name={user.displayName} size="md" frame={user.activeFrame} vipLevel={user.vipLevel} />
                    <div className="min-w-0">
                      <div className="text-xs font-black text-white truncate">
                        {hasDragon ? '🐉 Xaldris faol' : 'Savdo va VIP markazi'}
                      </div>
                      <div className="text-[10.5px] font-semibold text-white/70 truncate">
                        {user.vipLevel > 0 ? `VIP ${user.vipLevel} • Maxsus ramka va chat` : 'VIP 1–12 va Xaldris ajdarhosi tekin'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/shop')}
                    className="px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 text-[10.5px] font-black shrink-0 cursor-pointer"
                  >
                    Ochish →
                  </button>
                </div>
              </div>

              {/* Appointed Staff Panel Shortcut */}
              {user.role && user.role !== 'USER' && (
                <button
                  type="button"
                  onClick={() => navigate('/staff-panel')}
                  className="w-full rounded-2xl px-3.5 py-2.5 bg-indigo-500/25 border border-indigo-300/40 text-white flex items-center justify-between gap-2 cursor-pointer transition active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-base">🛡️</span>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-black truncate">{user.role} — Boshqaruv Paneli</div>
                      <div className="text-[10px] font-semibold text-white/75">Vazifalar va quyi rollarni tayinlash</div>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-indigo-500 text-white text-[10px] font-black shrink-0">
                    Ochish →
                  </span>
                </button>
              )}

              {/* Utility Sub-Tabs: Hamyon | Klan | Vazifa | Agent */}
              <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-black/35 border border-white/15">
                {[
                  { id: 'wallet', label: 'Hamyon', icon: Wallet },
                  { id: 'clan', label: 'Klan', icon: Users },
                  { id: 'tasks', label: 'Vazifa', icon: CheckCircle2 },
                  { id: 'agency', label: 'Agent', icon: Briefcase },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id as any)}
                      className={`py-2 rounded-xl text-[11px] font-black flex flex-col items-center gap-0.5 transition cursor-pointer ${
                        tab === item.id
                          ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 shadow-md'
                          : 'text-white/75 hover:text-white'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* WALLET */}
              {tab === 'wallet' && (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-2.5">
                    <div className="rounded-2xl p-3 bg-amber-500/18 border border-amber-300/35">
                      <div className="text-xs font-bold flex items-center gap-1 text-amber-300">
                        <Coins className="w-3.5 h-3.5" /> Tangalar
                      </div>
                      <div className="text-xl font-black mt-0.5 text-white">{user.coins.toLocaleString()}</div>
                    </div>
                    <div className="rounded-2xl p-3 bg-sky-500/18 border border-sky-300/35">
                      <div className="text-xs font-bold flex items-center gap-1 text-sky-300">
                        <Gem className="w-3.5 h-3.5" /> Olmoslar
                      </div>
                      <div className="text-xl font-black mt-0.5 text-white">{user.diamonds.toLocaleString()}</div>
                    </div>
                  </div>

                  <div className="card-white rounded-2xl p-3.5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">To‘ldirish</span>
                      <div className="flex gap-1">
                        {['Click', 'Payme', 'Play'].map((prov) => (
                          <button
                            key={prov}
                            onClick={() => setPayProvider(prov)}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold cursor-pointer ${
                              payProvider === prov ? 'bg-amber-400 text-slate-950' : 'bg-white/15 text-white/80'
                            }`}
                          >
                            {prov}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      {(walletData?.packages || []).map((pkg: any) => (
                        <button
                          key={pkg.id}
                          onClick={async () => {
                            try {
                              const res = await api<{ added: number; coins?: number }>('/wallet/topup', {
                                method: 'POST',
                                body: JSON.stringify({ packageId: pkg.id, coins: pkg.coins, provider: payProvider }),
                              });
                              const nextCoins = res.coins !== undefined ? res.coins : (user.coins || 0) + res.added;
                              await syncProfileToSupabase({ id: user.id, coins: nextCoins });
                              toast(`+${res.added.toLocaleString()} 🪙`, 'success');
                              await refreshUser();
                              loadTabData('wallet');
                            } catch (err: any) {
                              toast(err.message, 'error');
                            }
                          }}
                          className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-left transition cursor-pointer"
                        >
                          <div className="text-sm font-black text-amber-300">🪙 {pkg.coins.toLocaleString()}</div>
                          <div className="text-[11px] font-extrabold text-emerald-300 mt-0.5">
                            {pkg.priceUzs ? `${pkg.priceUzs.toLocaleString()} so‘m` : 'Tekin (Bepul)'}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="card-white rounded-2xl p-3 flex gap-2">
                    <input
                      type="number"
                      min={10}
                      value={exchangeAmt}
                      onChange={(e) => setExchangeAmt(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl text-xs"
                    />
                    <button
                      onClick={async () => {
                        try {
                          const res = await api<{ coinsGain: number }>('/wallet/exchange', {
                            method: 'POST',
                            body: JSON.stringify({ diamonds: Number(exchangeAmt) }),
                          });
                          toast(`+${res.coinsGain} 🪙`, 'success');
                          await refreshUser();
                          loadTabData('wallet');
                        } catch (err: any) {
                          toast(err.message, 'error');
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
                      title="Olmoslarni tangaga almashtirish"
                    >
                      💎 → 🪙
                    </button>
                  </div>

                  {(() => {
                    const paymentRows = (walletData?.ledger || []).filter(
                      (tx: any) => !String(tx.description || '').startsWith('Do‘kon')
                    );
                    if (paymentRows.length === 0) return null;
                    return (
                      <div className="card-white rounded-2xl overflow-hidden">
                        <button
                          type="button"
                          onClick={() => setShowPaymentHistory((v) => !v)}
                          className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-white/90 hover:bg-white/10 transition cursor-pointer"
                        >
                          <span className="flex items-center gap-1.5">
                            <History className="w-3.5 h-3.5 text-amber-300" />
                            <span>To‘lovlar tarixi ({paymentRows.length})</span>
                          </span>
                          {showPaymentHistory ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {showPaymentHistory && (
                          <div className="divide-y divide-white/10 border-t border-white/10">
                            {paymentRows.slice(0, 12).map((tx: any) => (
                              <div key={tx.id} className="flex items-center justify-between text-xs px-3.5 py-2.5">
                                <span className="font-semibold text-white/80 truncate pr-2">{tx.description}</span>
                                <span className={`font-extrabold shrink-0 ${tx.amount > 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                                  {tx.amount > 0 ? `+${tx.amount}` : tx.amount} {tx.currency === 'COINS' ? '🪙' : '💎'}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* FAMILY / CLAN */}
              {tab === 'clan' && (
                <div className="space-y-3">
                  {familyData?.myFamily ? (
                    <div className="card-white rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="w-11 h-11 rounded-2xl bg-amber-400/20 border border-amber-300/40 flex items-center justify-center text-2xl">
                            {familyData.myFamily.badge}
                          </span>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-amber-400 text-slate-950 text-[10px] font-black">
                                {familyData.myFamily.tag}
                              </span>
                              <span className="text-sm font-black text-white">{familyData.myFamily.name}</span>
                            </div>
                            <div className="text-xs text-amber-300 font-bold mt-0.5">
                              ⭐ {Number(familyData.myFamily.honor_xp).toLocaleString()} ball
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={async () => {
                            await api('/families/leave', { method: 'POST' });
                            toast('Klandan chiqdingiz', 'info');
                            loadTabData('clan');
                          }}
                          className="px-3 py-1.5 rounded-full bg-rose-500/25 text-rose-200 text-xs font-bold cursor-pointer"
                        >
                          Chiqish
                        </button>
                      </div>

                      <div className="divide-y divide-white/10">
                        {(familyData.members || []).map((m: any) => (
                          <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                            <div className="flex items-center gap-2">
                              <Avatar src={m.avatar} name={m.displayName} size="xs" />
                              <span className="font-bold text-white">{m.displayName}</span>
                            </div>
                            <span className="font-bold text-white/70">Lv.{m.wealthLevel}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="card-white rounded-2xl p-4 space-y-2.5">
                      <div className="text-xs font-extrabold text-white">Yangi Klan Ochish</div>
                      <div className="flex gap-2">
                        {['👑', '⚡', '🔥', '💎', '🦁'].map((b) => (
                          <button
                            key={b}
                            type="button"
                            onClick={() => setClanBadge(b)}
                            className={`w-9 h-9 rounded-xl border text-lg cursor-pointer ${
                              clanBadge === b ? 'bg-amber-400/30 border-amber-300' : 'bg-white/10 border-white/15'
                            }`}
                          >
                            {b}
                          </button>
                        ))}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          value={clanTag}
                          onChange={(e) => setClanTag(e.target.value)}
                          placeholder="Teg (UZB)"
                          maxLength={5}
                          className="px-3 py-2 rounded-xl text-xs uppercase"
                        />
                        <input
                          value={clanName}
                          onChange={(e) => setClanName(e.target.value)}
                          placeholder="Klan nomi"
                          className="col-span-2 px-3 py-2 rounded-xl text-xs"
                        />
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api('/families/create', {
                              method: 'POST',
                              body: JSON.stringify({ name: clanName, tag: clanTag, badge: clanBadge }),
                            });
                            toast('Klan yaratildi', 'success');
                            loadTabData('clan');
                          } catch (err: any) {
                            toast(err.message, 'error');
                          }
                        }}
                        className="w-full py-2.5 rounded-full btn-brand text-xs font-extrabold cursor-pointer"
                      >
                        Klan Yaratish
                      </button>
                    </div>
                  )}

                  {(familyData?.families || []).length > 0 && (
                    <div className="card-white rounded-2xl divide-y divide-white/10 overflow-hidden">
                      {(familyData?.families || []).map((f: any) => (
                        <div key={f.id} className="px-3.5 py-3 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <span className="text-xl">{f.badge}</span>
                            <div className="min-w-0">
                              <div className="text-xs font-extrabold text-white truncate">
                                [{f.tag}] {f.name}
                              </div>
                              <div className="text-[10px] text-white/60">
                                {f.members_count} a’zo • ⭐ {Number(f.honor_xp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          {familyData?.myFamily?.id !== f.id && (
                            <button
                              onClick={async () => {
                                await api(`/families/${f.id}/join`, { method: 'POST' });
                                toast(`${f.name} klaniga qo‘shildingiz`, 'success');
                                loadTabData('clan');
                              }}
                              className="px-3 py-1.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black shrink-0 cursor-pointer"
                            >
                              Kirish
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TASKS */}
              {tab === 'tasks' && (
                <div className="card-white rounded-2xl divide-y divide-white/10 overflow-hidden">
                  {tasks.map((tk) => (
                    <div key={tk.code} className="px-3.5 py-3 flex items-center gap-3">
                      <span className="text-xl">{tk.icon}</span>
                      <div className="flex-1 min-w-0 text-xs font-extrabold text-white truncate">{tk.title}</div>
                      <button
                        disabled={tk.claimed}
                        onClick={async () => {
                          try {
                            const res = await api<{ reward: number }>('/tasks/claim', {
                              method: 'POST',
                              body: JSON.stringify({ code: tk.code }),
                            });
                            toast(`+${res.reward} 🪙`, 'success');
                            await refreshUser();
                            loadTabData('tasks');
                          } catch (err: any) {
                            toast(err.message, 'error');
                          }
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-extrabold cursor-pointer ${
                          tk.claimed ? 'bg-white/10 text-white/40' : 'btn-brand'
                        }`}
                      >
                        {tk.claimed ? '✓' : `+${tk.reward}`}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* AGENCY */}
              {tab === 'agency' && (
                <div className="space-y-3">
                  {agencyData?.myAgency ? (
                    <div className="card-white rounded-2xl p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="text-sm font-black text-white">{agencyData.myAgency.name}</div>
                          <div className="text-xs text-white/65">ID: {agencyData.myAgency.code}</div>
                        </div>
                        <button
                          onClick={async () => {
                            await api('/agency/leave', { method: 'POST' });
                            await refreshUser();
                            loadTabData('agency');
                          }}
                          className="px-3 py-1.5 rounded-full bg-rose-500/25 text-rose-200 text-xs font-bold cursor-pointer"
                        >
                          Chiqish
                        </button>
                      </div>
                      <div className="divide-y divide-white/10">
                        {(agencyData.roster || []).map((h: any) => (
                          <div key={h.id} className="py-2 flex items-center justify-between text-xs">
                            <span className="font-bold text-white">{h.displayName}</span>
                            <span className="font-extrabold text-sky-300">💎 {h.diamonds.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="card-white rounded-2xl p-4 space-y-2.5">
                        <div className="text-xs font-extrabold text-white">Agentlikka ulanish</div>
                        <div className="flex gap-2">
                          <input
                            value={joinCode}
                            onChange={(e) => setJoinCode(e.target.value)}
                            placeholder="Agentlik kodi"
                            className="flex-1 px-3 py-2 rounded-xl text-xs uppercase"
                          />
                          <button
                            onClick={async () => {
                              try {
                                await api('/agency/join', { method: 'POST', body: JSON.stringify({ code: joinCode }) });
                                await refreshUser();
                                loadTabData('agency');
                              } catch (err: any) {
                                toast(err.message, 'error');
                              }
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-400 text-slate-950 text-xs font-black cursor-pointer"
                          >
                            Ulanish
                          </button>
                        </div>
                      </div>

                      <div className="card-white rounded-2xl p-4 space-y-2">
                        <div className="text-xs font-extrabold text-white">Yangi agentlik</div>
                        <input value={newAgName} onChange={(e) => setNewAgName(e.target.value)} placeholder="Nomi" className="w-full px-3 py-2 rounded-xl text-xs" />
                        <input value={newAgCode} onChange={(e) => setNewAgCode(e.target.value)} placeholder="Kod (masalan: UZ01)" className="w-full px-3 py-2 rounded-xl text-xs uppercase" />
                        <button
                          onClick={async () => {
                            try {
                              await api('/agency/create', {
                                method: 'POST',
                                body: JSON.stringify({ name: newAgName, code: newAgCode }),
                              });
                              await refreshUser();
                              loadTabData('agency');
                            } catch (err: any) {
                              toast(err.message, 'error');
                            }
                          }}
                          className="w-full py-2.5 rounded-full btn-brand text-xs font-extrabold cursor-pointer"
                        >
                          Yaratish
                        </button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Language Switcher Row */}
              <div className="flex items-center justify-between px-3 py-2 rounded-2xl bg-black/30 border border-white/10">
                <span className="text-[11px] font-bold text-white/70">Ilova tili:</span>
                <div className="flex gap-1">
                  {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
                    <button
                      key={l}
                      onClick={() => setLang(l)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase transition cursor-pointer ${
                        lang === l ? 'bg-white text-slate-950' : 'text-white/70 hover:text-white'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: SHON-SHARAF (Honors & Badges) */}
          {mainSection === 'honor' && (
            <div className="space-y-3">
              <div className="card-white rounded-2xl p-3.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-9 h-9 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
                    <Shield className="w-4 h-4 text-amber-300" />
                  </span>
                  <div className="min-w-0">
                    <div className="text-[10px] font-black text-amber-300">HARBIY UNVON ({currentRank.level}/10)</div>
                    <div className="text-xs font-black text-white truncate">
                      {currentRank.badge} {currentRank.titleUz} — Turon Imperiyasi
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[11px] font-black text-sky-200 shrink-0">
                  💎 {worldState.worldGems}
                </span>
              </div>

              <div className="card-white rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-black text-white flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>Yutuqlar va Jihozlar</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                    <div className="text-[10px] text-white/65 font-bold">VIP Daraja</div>
                    <div className="text-sm font-black text-amber-300 mt-0.5">
                      {user.vipLevel > 0 ? `VIP ${user.vipLevel}` : 'Oddiy'}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white/10 border border-white/15 p-3">
                    <div className="text-[10px] text-white/65 font-bold">Ajdarho</div>
                    <div className="text-sm font-black text-rose-300 mt-0.5">
                      {hasDragon ? '🐉 Xaldris' : 'Yo‘q'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => navigate('/shop')}
                  className="w-full py-2.5 rounded-full btn-brand text-xs font-black cursor-pointer"
                >
                  Savdodan bepul jihoz olish →
                </button>
              </div>
            </div>
          )}

          {/* SECTION 3: LAHZA (Moments / Personal Posts) */}
          {mainSection === 'moments' && (
            <div className="space-y-3">
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!momentText.trim() && !momentImg) return;
                  try {
                    await api('/moments', {
                      method: 'POST',
                      body: JSON.stringify({ content: momentText.trim(), imageUrl: momentImg }),
                    });
                    setMomentText('');
                    setMomentImg('');
                    toast('Lahza joylandi ✨', 'success');
                    loadMoments();
                  } catch (err: any) {
                    toast(err.message, 'error');
                  }
                }}
                className="card-white rounded-2xl p-3 space-y-2"
              >
                <textarea
                  rows={2}
                  value={momentText}
                  onChange={(e) => setMomentText(e.target.value)}
                  placeholder="Yangi lahza ulashing..."
                  className="w-full resize-none rounded-xl p-2.5 text-xs bg-white/10 border border-white/15 text-white placeholder:text-white/50 focus:outline-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/15 text-white text-xs font-bold cursor-pointer">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Rasm</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const f = e.target.files?.[0];
                        if (f) setMomentImg(await resizeAvatar(f, 720));
                      }}
                    />
                  </label>
                  <button type="submit" className="px-4 py-1.5 rounded-full btn-brand text-xs font-extrabold cursor-pointer">
                    Joylash
                  </button>
                </div>
              </form>

              {myMoments.length === 0 ? (
                <div className="card-white rounded-2xl p-6 text-center text-xs font-semibold text-white/65">
                  Hozircha lahzalar yo‘q — birinchi postni joylang!
                </div>
              ) : (
                myMoments.map((m) => (
                  <div key={m.id} className="card-white rounded-2xl p-3.5 space-y-2">
                    <div className="flex items-center gap-2">
                      <Avatar src={user.avatar} name={user.displayName} size="sm" />
                      <div>
                        <div className="text-xs font-black text-white">{user.displayName}</div>
                        <div className="text-[10px] text-white/55">
                          {new Date(m.createdAt || Date.now()).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    {m.content && <p className="text-xs text-white/90">{m.content}</p>}
                    {m.imageUrl && (
                      <div className="rounded-xl overflow-hidden max-h-60">
                        <img src={m.imageUrl} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Profile Modal (Avatar, Cover, Name, Bio, Gender, Country) */}
      {editOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/65 backdrop-blur-xs"
          onClick={() => setEditOpen(false)}
        >
          <form
            onSubmit={saveProfile}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-[#131945] border-2 border-white/25 text-white rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-white">Profilni tahrirlash</span>
              <button type="button" onClick={() => setEditOpen(false)} className="p-1.5 rounded-full bg-white/15 text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar src={editAvatar} name={editName} size="xl" />
                <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center cursor-pointer shadow">
                  <Camera className="w-3.5 h-3.5" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setEditAvatar(await resizeAvatar(f));
                    }}
                  />
                </label>
              </div>
              <div className="flex gap-1.5">
                {STUDIO_AVATARS.map((av) => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setEditAvatar(av)}
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 cursor-pointer ${
                      editAvatar === av ? 'border-[#ff3366]' : 'border-transparent'
                    }`}
                  >
                    <img src={av} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            </div>

            {/* Cover Banner Selector */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[11px] font-bold text-white/80">
                <span>Muqova foni (Banner):</span>
                <label className="text-amber-300 cursor-pointer underline">
                  Yuklash
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const f = e.target.files?.[0];
                      if (f) setEditCover(await resizeAvatar(f, 800));
                    }}
                  />
                </label>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {COVER_PRESETS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setEditCover(c.img)}
                    className={`relative h-10 rounded-xl overflow-hidden border-2 text-[10px] font-black cursor-pointer ${
                      editCover === c.img ? 'border-amber-300' : 'border-white/20'
                    }`}
                  >
                    <img src={c.img} alt={c.label} className="w-full h-full object-cover" />
                    <span className="absolute inset-0 bg-black/40 flex items-center justify-center">{c.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <input
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ism"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none"
            />
            <input
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Bio"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/50 focus:outline-none"
            />

            <div className="grid grid-cols-2 gap-2">
              <div className="flex gap-1 bg-white/10 p-1 rounded-xl border border-white/15">
                {[
                  { id: 'male', label: '♂ Erkak' },
                  { id: 'female', label: '♀ Ayol' },
                ].map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setEditGender(g.id)}
                    className={`flex-1 py-1.5 rounded-lg text-[11px] font-black cursor-pointer transition ${
                      editGender === g.id
                        ? g.id === 'female'
                          ? 'bg-pink-500 text-white shadow-sm'
                          : 'bg-sky-500 text-white shadow-sm'
                        : 'text-white/70 hover:text-white'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>

              <select
                value={editCountry}
                onChange={(e) => setEditCountry(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white"
              >
                {COUNTRY_OPTIONS.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.flag} {c.label}
                  </option>
                ))}
              </select>
            </div>

            <button type="submit" className="w-full py-3 rounded-full btn-brand font-extrabold text-sm cursor-pointer">
              Saqlash
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
