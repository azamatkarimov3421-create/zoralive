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

function resizeAvatar(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const img = new Image();
      img.onload = () => {
        const cv = document.createElement('canvas');
        cv.width = 256;
        cv.height = 256;
        const size = Math.min(img.width, img.height);
        const sx = (img.width - size) / 2;
        const sy = (img.height - size) / 2;
        cv.getContext('2d')?.drawImage(img, sx, sy, size, size, 0, 0, 256, 256);
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

export const ProfilePage: React.FC = () => {
  const { user, refreshUser, lang, setLang, logout, toast } = useAuth();
  const { state: worldState } = useWorld();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawTab = searchParams.get('tab');
  const [tab, setTab] = useState<'wallet' | 'clan' | 'tasks' | 'agency'>(
    rawTab === 'clan' || rawTab === 'tasks' || rawTab === 'agency' ? rawTab : 'wallet'
  );
  const currentRank = MILITARY_RANKS_10[worldState.rankLevel - 1] || MILITARY_RANKS_10[0];

  const [walletData, setWalletData] = useState<any>(null);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [payProvider, setPayProvider] = useState('Click');
  const [exchangeAmt, setExchangeAmt] = useState('100');

  const [tasks, setTasks] = useState<any[]>([]);

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

  // Edit Profile Modal
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  // Permanent dragon calibration locked in code for all users
  useEffect(() => {
    try {
      localStorage.removeItem('zoralive_dragon_config');
    } catch {}
  }, []);

  // 6 luxury dragon profile background themes (default: #1 Qora-oltin)
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

  useEffect(() => {
    loadTabData(tab);
  }, [tab]);

  if (!user) return null;

  const openEditor = () => {
    setEditName(user.displayName);
    setEditBio(user.bio || '');
    setEditAvatar(user.avatar);
    setEditOpen(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const cleanName = editName.trim() || user.displayName;
      await syncProfileToSupabase({
        id: user.id,
        displayName: cleanName,
        bio: editBio,
        avatar: editAvatar,
      });
      await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName: cleanName, bio: editBio, avatar: editAvatar }),
      }).catch(() => {});
      await refreshUser();
      setEditOpen(false);
      toast('Profil saqlandi', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  // Dragon only displays for users who actually have an active dragon ride equipped
  const hasDragon = Boolean(user?.activeRide && user.activeRide.includes('dragon') && user.activeRide !== 'none');
  const dragonTheme = getDragonTheme(dragonThemeId);

  return (
    <div
      className={
        hasDragon
          ? 'relative min-h-screen bg-[#07070c] overflow-x-clip pb-24'
          : 'bg-slate-50/70 min-h-full px-3.5 pt-3 pb-24 space-y-3'
      }
    >
      {/* Full-Page Edge-to-Edge VIP Dragon Background Artwork */}
      {hasDragon && (
        <div className="pointer-events-none select-none absolute inset-0 z-0 overflow-clip">
          <div className="sticky top-0 w-full h-screen">
            <img
              src={dragonTheme.bgImage}
              alt={dragonTheme.nameUz}
              className="w-full h-full object-cover object-center transition-all duration-500"
            />
            {/* Balanced atmospheric scrim: vivid radiant top rays & dramatic bottom depth */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  'linear-gradient(180deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.14) 30%, rgba(0,0,0,0.58) 64%, rgba(7,7,12,0.84) 100%)',
              }}
            />
            <div
              className="absolute inset-0"
              style={{
                boxShadow: `inset 0 0 38px ${dragonTheme.dragonGlow}`,
              }}
            />
          </div>
        </div>
      )}

      <div className={hasDragon ? 'relative z-10 px-3.5 pt-2.5 space-y-3' : 'space-y-3'}>
        {/* Top Utility Bar: Single clean row for Language switcher, Ega Paneli, and Logout */}
        <div className="relative z-40 flex items-center justify-between gap-2">
          <div
            className={`flex gap-0.5 rounded-full p-0.5 ${
              hasDragon
                ? 'bg-black/50 border border-white/15 backdrop-blur-md'
                : 'bg-white border border-slate-200/80 shadow-2xs'
            }`}
          >
            {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
              <button
                key={l}
                onClick={() => setLang(l)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase transition cursor-pointer ${
                  lang === l
                    ? hasDragon
                      ? 'bg-white text-slate-950 shadow-xs'
                      : 'bg-slate-900 text-white shadow-xs'
                    : hasDragon
                    ? 'text-white/75 hover:text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {l}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => navigate('/admin')}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black flex items-center gap-1.5 shadow-2xs transition active:scale-95 cursor-pointer ${
                hasDragon
                  ? 'bg-black/55 hover:bg-black/80 border border-amber-400/50 text-amber-300 backdrop-blur-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-white'
              }`}
              title="Ega Paneli"
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Ega Paneli</span>
            </button>
            <button
              onClick={async () => {
                await logout();
                navigate('/login');
              }}
              className={`p-2 rounded-full transition active:scale-95 cursor-pointer ${
                hasDragon
                  ? 'bg-black/50 border border-white/15 text-white/85 hover:text-rose-400 backdrop-blur-md'
                  : 'bg-white border border-slate-200/80 text-slate-600 hover:text-rose-600 shadow-2xs'
              }`}
              title="Chiqish"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Hero Profile Stage: Seamless Full-Bleed VIP Dragon Experience for Dragon Owners */}
        {hasDragon ? (
          <div className="relative flex flex-col items-center text-center pt-44 pb-2">
            {/* Avatar + VIP Frame + True-Alpha Cinematic Dragon */}
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

            {/* High-Contrast Luxury Profile Identity */}
            <div className="relative z-30 mt-3 flex items-center justify-center gap-2">
              <h2 className="text-[20px] font-black text-white tracking-tight drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)]">
                {user.displayName}
              </h2>
              {user.vipLevel > 0 && <VipCrest level={user.vipLevel} size="sm" />}
              <button
                onClick={openEditor}
                className="p-1.5 rounded-full bg-black/50 hover:bg-black/75 border border-white/20 text-white/90 backdrop-blur-md transition active:scale-95 cursor-pointer"
                title="Tahrirlash"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={() => {
                navigator.clipboard?.writeText(String(user.uid));
                toast(`ID: ${user.uid}`, 'info');
              }}
              className="relative z-30 inline-flex items-center gap-1.5 mt-1.5 px-3 py-1 rounded-full bg-black/50 hover:bg-black/70 border border-white/15 backdrop-blur-md text-xs text-white/90 font-bold transition active:scale-95 cursor-pointer"
            >
              <span className="text-[11px] font-extrabold tracking-wide">ID {user.uid}</span>
              <Copy className="w-3 h-3 text-white/70" />
            </button>

            <div className="relative z-30 inline-flex items-center justify-center gap-3.5 mt-2 px-4 py-1 rounded-full bg-black/45 border border-white/10 backdrop-blur-md text-xs text-white/85 font-semibold">
              <span>
                <b className="text-white font-black">{user.followersCount ?? 0}</b> obunachi
              </span>
              <span className="w-1 h-1 rounded-full bg-white/45" />
              <span>
                <b className="text-white font-black">{user.followingCount ?? 0}</b> obuna
              </span>
            </div>

            {/* 6-Variant VIP Dragon Theme Selector Strip */}
            <div className="relative z-30 w-full mt-4">
              <div className="grid grid-cols-3 gap-1.5">
                {DRAGON_THEMES.map((t) => {
                  const isActive = t.id === dragonTheme.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => selectDragonTheme(t.id)}
                      className={`flex items-center justify-center gap-1 py-1.5 px-2 rounded-xl border text-[10.5px] font-extrabold backdrop-blur-md transition active:scale-95 cursor-pointer ${
                        isActive
                          ? t.activePillClass
                          : 'bg-black/45 border-white/15 text-white/80 hover:bg-black/65 hover:border-white/30'
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
          </div>
        ) : (
          <div className="rounded-3xl bg-gradient-to-b from-indigo-50/75 via-white to-white border border-slate-200/80 px-4 pt-5 pb-4 shadow-xs flex flex-col items-center text-center">
            <div className="relative p-1 rounded-full ring-4 ring-white shadow-sm">
              <Avatar src={user.avatar} name={user.displayName} size="xl" frame={user.activeFrame} vipLevel={user.vipLevel} />
            </div>

            <div className="mt-3 flex items-center justify-center gap-1.5">
              <h2 className="text-lg font-black text-slate-900 tracking-tight">{user.displayName}</h2>
              {user.vipLevel > 0 && <VipCrest level={user.vipLevel} size="sm" />}
              <button
                onClick={openEditor}
                className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                title="Tahrirlash"
              >
                <Pencil className="w-3 h-3" />
              </button>
            </div>

            {user.bio && (
              <p className="mt-1 text-xs text-slate-500 max-w-[260px] line-clamp-2">{user.bio}</p>
            )}

            <div className="mt-2 flex items-center justify-center gap-2.5 flex-wrap text-xs text-slate-500 font-medium">
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(String(user.uid));
                  toast(`ID: ${user.uid}`, 'info');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition cursor-pointer"
              >
                <span>ID {user.uid}</span>
                <Copy className="w-3 h-3 text-slate-400" />
              </button>
              <span><b className="text-slate-900">{user.followersCount ?? 0}</b> obunachi</span>
              <span className="w-1 h-1 rounded-full bg-slate-300" />
              <span><b className="text-slate-900">{user.followingCount ?? 0}</b> obuna</span>
            </div>

            {/* Balance Quick Summary */}
            <div className="mt-3.5 pt-3 border-t border-slate-100 w-full grid grid-cols-2 gap-2">
              <button
                onClick={() => setTab('wallet')}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-amber-50/90 hover:bg-amber-100/80 border border-amber-200/70 transition cursor-pointer"
              >
                <Coins className="w-4 h-4 text-amber-500 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold text-amber-700">Tangalar</div>
                  <div className="text-xs font-black text-slate-900">{(user.coins ?? 0).toLocaleString()}</div>
                </div>
              </button>
              <button
                onClick={() => setTab('wallet')}
                className="flex items-center justify-center gap-2 py-2 px-3 rounded-2xl bg-sky-50/90 hover:bg-sky-100/80 border border-sky-200/70 transition cursor-pointer"
              >
                <Gem className="w-4 h-4 text-sky-500 shrink-0" />
                <div className="text-left leading-tight">
                  <div className="text-[10px] font-bold text-sky-700">Olmoslar</div>
                  <div className="text-xs font-black text-slate-900">{(user.diamonds ?? 0).toLocaleString()}</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Dragon Shop Prompt (Only shown if user does not own/equip a dragon) */}
        {!hasDragon && (
          <button
            type="button"
            onClick={() => navigate('/shop')}
            className="w-full text-left px-3.5 py-2.5 rounded-2xl bg-white border border-amber-200/80 shadow-2xs flex items-center justify-between gap-2.5 cursor-pointer hover:border-amber-300 transition active:scale-[0.99]"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-9 h-9 rounded-xl bg-amber-50 border border-amber-200/70 flex items-center justify-center text-xl shrink-0">
                🐉
              </span>
              <div className="min-w-0">
                <div className="text-xs font-black text-slate-900 truncate">Ajdarho o‘rnatilmagan</div>
                <div className="text-[10.5px] font-medium text-slate-500 truncate">Do‘kondan Xaldris ajdarhosini oling</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-slate-900 text-amber-300 text-[10px] font-black shrink-0">
              Do‘kon →
            </span>
          </button>
        )}

        {/* Military Rank (1-10) & World Gem Summary (Clean, no duplicate Admin button) */}
        <div
          className={`rounded-2xl px-3.5 py-2.5 text-white flex items-center justify-between gap-2 shadow-xs ${
            hasDragon
              ? 'bg-black/55 backdrop-blur-md border'
              : 'bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 border border-slate-800'
          }`}
          style={hasDragon ? { borderColor: dragonTheme.borderColor } : undefined}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center text-sm shrink-0">
              <Shield className="w-4 h-4 text-amber-300" />
            </span>
            <div className="min-w-0">
              <div className="text-[10px] font-extrabold text-amber-300 tracking-wide">
                HARBIY UNVON ({currentRank.level}/10)
              </div>
              <div className="text-xs font-black truncate">
                {currentRank.badge} {currentRank.titleUz} — Turon Imperiyasi
              </div>
            </div>
          </div>
          <div className="px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-[10.5px] font-black text-sky-200 shrink-0">
            💎 {worldState.worldGems}
          </div>
        </div>

        {/* 4 Compact Profile Tabs (VIP Panels live strictly in Savdo/Shop) */}
        <div
          className={`grid grid-cols-4 gap-1 p-1 rounded-2xl border ${
            hasDragon
              ? 'bg-black/55 border-white/15 backdrop-blur-md'
              : 'bg-white border-slate-200/80 shadow-2xs'
          }`}
        >
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
                className={`py-2 rounded-xl text-[10.5px] font-extrabold flex flex-col items-center gap-0.5 transition cursor-pointer ${
                  tab === item.id
                    ? hasDragon
                      ? 'bg-white text-slate-950 shadow-sm'
                      : 'bg-slate-900 text-white shadow-xs'
                    : hasDragon
                    ? 'text-white/75 hover:text-white'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

      {/* WALLET */}
      {tab === 'wallet' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-2xl p-3.5 bg-amber-50 border border-amber-200/80">
              <div className="text-xs text-amber-700 font-bold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5" /> Tangalar
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{user.coins.toLocaleString()}</div>
            </div>
            <div className="rounded-2xl p-3.5 bg-sky-50 border border-sky-200/80">
              <div className="text-xs text-sky-700 font-bold flex items-center gap-1">
                <Gem className="w-3.5 h-3.5" /> Olmoslar
              </div>
              <div className="text-2xl font-black text-slate-900 mt-1">{user.diamonds.toLocaleString()}</div>
            </div>
          </div>

          <div className="card-white rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-900">To‘ldirish</span>
              <div className="flex gap-1">
                {['Click', 'Payme', 'Play'].map((prov) => (
                  <button
                    key={prov}
                    onClick={() => setPayProvider(prov)}
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      payProvider === prov ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
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
                  className="p-3 rounded-2xl bg-slate-50 hover:bg-slate-100 border border-slate-200/70 text-left transition"
                >
                  <div className="text-sm font-black text-amber-600">🪙 {pkg.coins.toLocaleString()}</div>
                  <div className="text-xs font-extrabold text-emerald-600 mt-1">
                    {pkg.priceUzs ? `${pkg.priceUzs.toLocaleString()} so‘m` : 'Tekin (Bepul)'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="card-white rounded-2xl p-3.5 flex gap-2">
            <input
              type="number"
              min={10}
              value={exchangeAmt}
              onChange={(e) => setExchangeAmt(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900"
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
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
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
                  className="w-full px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
                >
                  <span className="flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5 text-slate-500" />
                    <span>To‘lovlar tarixi ({paymentRows.length})</span>
                  </span>
                  {showPaymentHistory ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>
                {showPaymentHistory && (
                  <div className="divide-y divide-slate-100 border-t border-slate-100">
                    {paymentRows.slice(0, 12).map((tx: any) => (
                      <div key={tx.id} className="flex items-center justify-between text-xs px-3.5 py-2.5">
                        <span className="font-semibold text-slate-700 truncate pr-2">{tx.description}</span>
                        <span className={`font-extrabold shrink-0 ${tx.amount > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
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
        <div className="space-y-3.5">
          {familyData?.myFamily ? (
            <div className="card-white rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-2xl">
                    {familyData.myFamily.badge}
                  </span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 rounded bg-slate-900 text-white text-[10px] font-black">
                        {familyData.myFamily.tag}
                      </span>
                      <span className="text-sm font-black text-slate-900">{familyData.myFamily.name}</span>
                    </div>
                    <div className="text-xs text-amber-600 font-bold mt-0.5">
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
                  className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold"
                >
                  Chiqish
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {(familyData.members || []).map((m: any) => (
                  <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Avatar src={m.avatar} name={m.displayName} size="xs" />
                      <span className="font-bold text-slate-800">{m.displayName}</span>
                    </div>
                    <span className="font-bold text-slate-500">Lv.{m.wealthLevel}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="card-white rounded-2xl p-4 space-y-2.5">
              <div className="text-xs font-extrabold text-slate-900">Yangi Klan Ochish</div>
              <div className="flex gap-2">
                {['👑', '⚡', '🔥', '💎', '🦁'].map((b) => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => setClanBadge(b)}
                    className={`w-9 h-9 rounded-xl border text-lg ${
                      clanBadge === b ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-200'
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
                  className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs uppercase"
                />
                <input
                  value={clanName}
                  onChange={(e) => setClanName(e.target.value)}
                  placeholder="Klan nomi"
                  className="col-span-2 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
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
                className="w-full py-2.5 rounded-full btn-brand text-xs font-extrabold"
              >
                Klan Yaratish
              </button>
            </div>
          )}

          <div className="card-white rounded-2xl divide-y divide-slate-100 overflow-hidden">
            {(familyData?.families || []).map((f: any) => (
              <div key={f.id} className="px-3.5 py-3 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="text-xl">{f.badge}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-slate-900 truncate">
                      [{f.tag}] {f.name}
                    </div>
                    <div className="text-[10px] text-slate-400">
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
                    className="px-3 py-1.5 rounded-full bg-slate-900 text-white text-[11px] font-bold shrink-0"
                  >
                    Kirish
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TASKS */}
      {tab === 'tasks' && (
        <div className="card-white rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {tasks.map((tk) => (
            <div key={tk.code} className="px-3.5 py-3 flex items-center gap-3">
              <span className="text-xl">{tk.icon}</span>
              <div className="flex-1 min-w-0 text-xs font-extrabold text-slate-800 truncate">{tk.title}</div>
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
                className={`px-3 py-1.5 rounded-full text-xs font-extrabold ${
                  tk.claimed ? 'bg-slate-100 text-slate-400' : 'btn-brand'
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
                  <div className="text-sm font-black text-slate-900">{agencyData.myAgency.name}</div>
                  <div className="text-xs text-slate-500">ID: {agencyData.myAgency.code}</div>
                </div>
                <button
                  onClick={async () => {
                    await api('/agency/leave', { method: 'POST' });
                    await refreshUser();
                    loadTabData('agency');
                  }}
                  className="px-3 py-1.5 rounded-full bg-rose-50 text-rose-600 text-xs font-bold"
                >
                  Chiqish
                </button>
              </div>
              <div className="divide-y divide-slate-100">
                {(agencyData.roster || []).map((h: any) => (
                  <div key={h.id} className="py-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800">{h.displayName}</span>
                    <span className="font-extrabold text-sky-600">💎 {h.diamonds.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="card-white rounded-2xl p-4 space-y-2.5">
                <div className="text-xs font-extrabold text-slate-900">Agentlik (ZORA77 / TASH01)</div>
                <div className="flex gap-2">
                  <input
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    placeholder="Agency ID"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs uppercase"
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
                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-extrabold"
                  >
                    Ulanish
                  </button>
                </div>
              </div>

              <div className="card-white rounded-2xl p-4 space-y-2">
                <div className="text-xs font-extrabold text-slate-900">Yangi agentlik</div>
                <input value={newAgName} onChange={(e) => setNewAgName(e.target.value)} placeholder="Nomi" className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
                <input value={newAgCode} onChange={(e) => setNewAgCode(e.target.value)} placeholder="Kod (SAM01)" className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs uppercase" />
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
                  className="w-full py-2.5 rounded-full btn-brand text-xs font-extrabold"
                >
                  Yaratish
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Profile Edit Modal (with Real Photo Avatar Upload) */}
      {editOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45" onClick={() => setEditOpen(false)}>
          <form
            onSubmit={saveProfile}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 space-y-3.5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-extrabold text-slate-900">Profilni tahrirlash</span>
              <button type="button" onClick={() => setEditOpen(false)} className="p-1.5 rounded-full bg-slate-100 text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-col items-center gap-2">
              <div className="relative">
                <Avatar src={editAvatar} name={editName} size="xl" />
                <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center cursor-pointer shadow">
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
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 ${
                      editAvatar === av ? 'border-[#ff3366]' : 'border-transparent'
                    }`}
                  >
                    <img src={av} alt="" className="w-full h-full object-cover object-top" />
                  </button>
                ))}
              </div>
            </div>

            <input
              required
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder="Ism"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
            <input
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder="Bio"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />

            <button type="submit" className="w-full py-3 rounded-full btn-brand font-extrabold text-sm">
              Saqlash
            </button>
          </form>
        </div>
      )}
      </div>
    </div>
  );
};
