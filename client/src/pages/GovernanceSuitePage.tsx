import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  Shield,
  Database,
  Users,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Megaphone,
  Link2,
  Server,
  UserCheck,
  Award,
  FileText,
  Ban,
  Calendar,
  Coins,
  Gem,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import { useWorld } from '../context/WorldContext';
import { useAuth } from '../context/AuthContext';
import { setStoredUser } from '../lib/api';
import {
  fetchAllProfilesFromSupabase,
  syncProfileToSupabase,
  fetchRoomsFromSupabase,
  closeRoomInSupabase,
  sendRoomMessageToSupabase,
} from '../lib/supabaseSync';
import { VIP_LEVELS_1_TO_12 } from '../lib/mythicCatalog';
import { Avatar } from '../components/Avatar';
import { RoomSummary, User } from '../types';
import {
  APP_GOVERNANCE_ROLES,
  CONTINENTS_10,
  DATABASE_24_TABLES,
  MILITARY_RANKS_10,
  TECH_STACK_SPECS,
} from '../lib/worldEcosystemData';

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');
const EGA_PANEL_PIN = '3434';
const EGA_UNLOCK_KEY = 'zoralive_ega_unlocked';

type PanelRole = 'OWNER' | 'MANAGER' | 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'HOST' | 'BOSHLOVCHI';

export const GovernanceSuitePage: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser, refreshUser, toast } = useAuth();
  const {
    state,
    worldCoins,
    promoteRank,
    toggleEmergencyStop,
    toggleManagerPermission,
    addAuditLog,
  } = useWorld();

  const [unlocked, setUnlocked] = useState<boolean>(() => sessionStorage.getItem(EGA_UNLOCK_KEY) === EGA_PANEL_PIN);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const [roleTab, setRoleTab] = useState<PanelRole>('OWNER');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [liveUsers, setLiveUsers] = useState<User[]>([]);
  const [liveRooms, setLiveRooms] = useState<RoomSummary[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [broadcastText, setBroadcastText] = useState('');
  const [loadingLive, setLoadingLive] = useState(false);

  const loadLiveSupabaseData = async () => {
    setLoadingLive(true);
    try {
      const [profiles, rooms] = await Promise.all([
        fetchAllProfilesFromSupabase(),
        fetchRoomsFromSupabase(),
      ]);
      setLiveUsers(profiles || []);
      setLiveRooms(rooms || []);
    } finally {
      setLoadingLive(false);
    }
  };

  useEffect(() => {
    if (unlocked) {
      loadLiveSupabaseData();
    }
  }, [unlocked]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === EGA_PANEL_PIN) {
      sessionStorage.setItem(EGA_UNLOCK_KEY, EGA_PANEL_PIN);
      setUnlocked(true);
      setPinError('');
      setPinInput('');
      toast('👑 Ega Paneliga muvaffaqiyatli kirdingiz!', 'success');
    } else {
      setPinError('Kod noto‘g‘ri! Ega Paneliga kirish taqiqlangan.');
      toast('Kod noto‘g‘ri!', 'error');
    }
  };

  const handleLockPanel = () => {
    sessionStorage.removeItem(EGA_UNLOCK_KEY);
    setUnlocked(false);
    setPinInput('');
    toast('🔒 Ega Paneli qulflandi', 'info');
  };

  const updateMemberLive = async (target: User, patch: Partial<User>, actionDesc: string) => {
    const merged: User = { ...target, ...patch };
    await syncProfileToSupabase({ id: target.id, ...patch });
    const isLocal =
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    if (isLocal || API_BASE) {
      try {
        const url = API_BASE ? `${API_BASE}/api/auth/sync` : '/api/auth/sync';
        await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(merged),
        });
      } catch {
        // ignore if serverless
      }
    }
    setLiveUsers((prev) => prev.map((u) => (u.id === target.id ? merged : u)));
    if (currentUser?.id === target.id) {
      setStoredUser(merged);
      await refreshUser();
    }
    addAuditLog(currentUser?.displayName || 'LOYIHA EGASI', 'OWNER', `${target.displayName}: ${actionDesc}`, true);
    toast(`✅ ${target.displayName}: ${actionDesc}`, 'success');
  };

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = broadcastText.trim();
    if (!msg) return;
    setBroadcastText('');
    const sender: User =
      currentUser || {
        id: 'owner_sys',
        uid: 100000,
        username: 'owner',
        displayName: '👑 Ega Boshqaruvi',
        avatar: '',
        bio: '',
        country: 'UZ',
        gender: 'other',
        role: 'ADMIN',
        coins: 0,
        diamonds: 0,
        wealthXp: 0,
        charmXp: 0,
        wealthLevel: 1,
        wealthProgress: 0,
        wealthNextXp: 1500,
        charmLevel: 1,
        charmProgress: 0,
        charmNextXp: 1200,
        vipLevel: 12,
        vipExpiresAt: null,
        activeFrame: '',
        activeRide: '',
        activeBubble: '',
        agencyId: null,
        isBanned: false,
        hostedMinutes: 0,
      };
    for (const r of liveRooms) {
      await sendRoomMessageToSupabase(r.id, sender, `📢 EGA E’LONI: ${msg}`, 'SYSTEM');
    }
    addAuditLog(sender.displayName, 'OWNER', `Umumiy e’lon yuborildi: ${msg}`, true);
    toast('📢 Umumiy e’lon barcha jonli xonalarga yuborildi!', 'success');
  };

  const handleCloseLiveRoom = async (r: RoomSummary) => {
    await closeRoomInSupabase(r.id);
    setLiveRooms((prev) => prev.filter((x) => x.id !== r.id));
    addAuditLog(currentUser?.displayName || 'LOYIHA EGASI', 'OWNER', `Xona yopildi: ${r.title}`, true);
    toast(`Xona yopildi: ${r.title}`, 'info');
  };
  const [staffList, setStaffList] = useState<Array<{ id: string; name: string; role: string; status: string }>>([]);
  const [eventTitle, setEventTitle] = useState('');
  const [events, setEvents] = useState<Array<{ id: string; title: string; time: string; players: number }>>([]);
  const [complaints, setComplaints] = useState<Array<{ id: string; user: string; reason: string; status: string }>>([]);

  const totalElements = Object.values(state.elements).reduce((a, b) => a + b, 0);
  const currentRankMeta = MILITARY_RANKS_10[state.rankLevel - 1] || MILITARY_RANKS_10[0];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setEvents((prev) => [
      { id: `ev-${Date.now()}`, title: eventTitle.trim(), time: 'Hozir e’lon qilindi', players: 12 },
      ...prev,
    ]);
    addAuditLog('Host', 'HOST', `Yangi tadbir/jang jadvali ochildi: ${eventTitle.trim()}`);
    toast('Tadbir va jang jadvali e’lon qilindi! 🎤', 'success');
    setEventTitle('');
  };

  if (!unlocked) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-5 relative overflow-hidden">
        <div className="pointer-events-none absolute -top-36 -left-36 w-80 h-80 bg-amber-500/20 rounded-full blur-[120px]" />
        <div className="pointer-events-none absolute -bottom-36 -right-36 w-80 h-80 bg-indigo-500/20 rounded-full blur-[120px]" />

        <button
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Orqaga</span>
        </button>

        <form
          onSubmit={handleUnlockSubmit}
          className="w-full max-w-xs bg-slate-900/90 border border-amber-400/35 rounded-3xl p-6 shadow-2xl space-y-4 relative z-10 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-yellow-600 text-slate-950 flex items-center justify-center mx-auto shadow-lg">
            <Lock className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white flex items-center justify-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>Ega Paneli Himoyalangan</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Kirish uchun Ega maxfiy kodini kiriting
            </p>
          </div>

          <input
            type="password"
            inputMode="numeric"
            autoFocus
            value={pinInput}
            onChange={(e) => {
              setPinInput(e.target.value);
              if (pinError) setPinError('');
            }}
            placeholder="Maxfiy parol"
            className="w-full px-4 py-3 rounded-2xl bg-black/50 border border-white/15 text-center text-base font-black tracking-[0.35em] text-white placeholder:text-slate-500 placeholder:tracking-normal placeholder:text-xs focus:outline-none focus:border-amber-400"
          />

          {pinError && (
            <div className="text-[11px] font-bold text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded-xl px-3 py-2">
              {pinError}
            </div>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 active:scale-98 transition cursor-pointer"
          >
            Panelni ochish →
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent text-slate-900 pb-10">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>ZoraLive 7-Rolli Boshqaruv Markazi</span>
            </div>
            <div className="text-[10.5px] font-bold text-slate-500">
              Owner • Manager • Super Admin • Admin • Agent • Host • Boshlovchi
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {state.emergencyStopped && (
            <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
              TEXNIK TO‘XTATILGAN
            </span>
          )}
          <button
            onClick={handleLockPanel}
            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-900 text-amber-300 text-[11px] font-black hover:bg-slate-800 cursor-pointer"
          >
            <Lock className="w-3 h-3" />
            <span>Qulflash</span>
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-3.5 pt-4 space-y-4">
        {/* 7-Role Panel Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {APP_GOVERNANCE_ROLES.filter((r) => r.code !== 'ASKAR').map((r) => {
            const active = roleTab === r.code;
            return (
              <button
                key={r.code}
                onClick={() => setRoleTab(r.code as PanelRole)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{r.badge}</span>
                <span>{r.code === 'OWNER' ? 'Owner (Siz)' : r.titleUz}</span>
              </button>
            );
          })}
        </div>

        {/* 1. OWNER PANEL (SIZNING MAXSUS PANELINGIZ) */}
        {roleTab === 'OWNER' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border border-amber-400/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    YAKUNIY VA MUTLAQ EGALIK NAZORATI
                  </span>
                  <h2 className="text-lg font-black mt-1">👑 LOYIHA EGASI — SIZNING PANELINGIZ</h2>
                  <p className="text-xs text-slate-300">
                    Manager sizning ruxsatingizsiz egani o‘zgartira olmaydi. Kritik operatsiyalar 2-bosqichli tasdiqlash (2FA) bilan himoyalangan.
                  </p>
                </div>
              </div>

              {/* Live Supabase Counters */}
              <div className="grid grid-cols-4 gap-2 pt-1">
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-amber-200 font-bold">Jami A’zolar</div>
                  <div className="text-base font-black">{liveUsers.length}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-emerald-200 font-bold">Jonli Xonalar</div>
                  <div className="text-base font-black">{liveRooms.length}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-purple-200 font-bold">Ajdarho Egalari</div>
                  <div className="text-base font-black">
                    {liveUsers.filter((u) => u.activeRide && u.activeRide.includes('dragon') && u.activeRide !== 'none').length}
                  </div>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-cyan-200 font-bold">VIP A’zolar</div>
                  <div className="text-base font-black">{liveUsers.filter((u) => u.vipLevel > 0).length}</div>
                </div>
              </div>
            </div>

            {/* LIVE SUPABASE USERS MANAGEMENT (COINS, VIP, DRAGONS, ROLES) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-amber-500" />
                    <span>Jonli Foydalanuvchilar Boshqaruvi (Supabase Baza)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Har bir foydalanuvchining haqiqiy ismi, tangasi, VIP darajasi va ajdarhosini shu yerdan boshqaring
                  </p>
                </div>
                <button
                  onClick={loadLiveSupabaseData}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingLive ? 'animate-spin' : ''}`} />
                  <span>Yangilash</span>
                </button>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Ism, username yoki ID orqali qidirish..."
                  className="w-full pl-9 pr-4 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-0.5">
                {liveUsers
                  .filter((u) => {
                    const q = userSearch.trim().toLowerCase();
                    if (!q) return true;
                    return (
                      u.displayName.toLowerCase().includes(q) ||
                      u.username.toLowerCase().includes(q) ||
                      String(u.uid).includes(q)
                    );
                  })
                  .map((u) => {
                    const hasDrg = Boolean(u.activeRide && u.activeRide.includes('dragon') && u.activeRide !== 'none');
                    return (
                      <div
                        key={u.id}
                        className="p-3 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar src={u.avatar} name={u.displayName} size="sm" frame={u.activeFrame} vipLevel={u.vipLevel} />
                            <div className="min-w-0">
                              <div className="text-xs font-black text-slate-900 truncate flex items-center gap-1.5">
                                <span>{u.displayName}</span>
                                {currentUser?.id === u.id && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[9px] font-black">
                                    SIZ
                                  </span>
                                )}
                                {u.isBanned && (
                                  <span className="px-1.5 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[9px] font-black">
                                    BLOKLANGAN
                                  </span>
                                )}
                              </div>
                              <div className="text-[10.5px] font-bold text-slate-500">
                                ID {u.uid} • @{u.username} • 🪙 {u.coins.toLocaleString()} • 💎 {u.diamonds.toLocaleString()}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-wrap">
                            <button
                              onClick={() =>
                                updateMemberLive(
                                  u,
                                  { coins: (u.coins || 0) + 10000 },
                                  '+10,000 tanga berildi'
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-800 text-[10.5px] font-black cursor-pointer"
                            >
                              +10K 🪙
                            </button>
                            <button
                              onClick={() =>
                                updateMemberLive(
                                  u,
                                  { coins: (u.coins || 0) + 100000 },
                                  '+100,000 tanga berildi'
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-[10.5px] font-black cursor-pointer"
                            >
                              +100K 🪙
                            </button>
                            <button
                              onClick={() =>
                                updateMemberLive(
                                  u,
                                  { diamonds: (u.diamonds || 0) + 1000 },
                                  '+1,000 olmos berildi'
                                )
                              }
                              className="px-2.5 py-1 rounded-xl bg-sky-100 hover:bg-sky-200 text-sky-800 text-[10.5px] font-black cursor-pointer"
                            >
                              +1K 💎
                            </button>
                            {currentUser?.id !== u.id && (
                              <>
                                <button
                                  onClick={() =>
                                    updateMemberLive(
                                      u,
                                      { coins: Math.max(0, (u.coins || 0) - 1000) },
                                      'Jazo: -1,000 tanga jarima'
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-xl bg-orange-100 hover:bg-orange-200 text-orange-800 text-[10.5px] font-black cursor-pointer"
                                  title="Jazo berish (-1,000 tanga)"
                                >
                                  Jazo -1K
                                </button>
                                <button
                                  onClick={() =>
                                    updateMemberLive(
                                      u,
                                      { isBanned: !u.isBanned },
                                      !u.isBanned ? 'Foydalanuvchi bloklandi 🚫' : 'Blokdan ochildi ✅'
                                    )
                                  }
                                  className={`px-2.5 py-1 rounded-xl text-[10.5px] font-black cursor-pointer ${
                                    u.isBanned
                                      ? 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800'
                                      : 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                                  }`}
                                >
                                  {u.isBanned ? 'Blokdan ochish' : 'Bloklash'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* VIP, Dragon & Role Selectors */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1.5 border-t border-slate-200/70">
                          <label className="text-[10px] font-extrabold text-slate-600 flex flex-col gap-1">
                            <span>👑 VIP Darajasi:</span>
                            <select
                              value={u.vipLevel || 0}
                              onChange={(e) => {
                                const lvl = Number(e.target.value);
                                const vipMeta = lvl > 0 ? VIP_LEVELS_1_TO_12[lvl - 1] : null;
                                updateMemberLive(
                                  u,
                                  {
                                    vipLevel: lvl,
                                    activeFrame: vipMeta ? vipMeta.frameCode : '',
                                    activeBubble: vipMeta ? vipMeta.bubbleCode : '',
                                  },
                                  lvl > 0 ? `VIP ${lvl} berildi` : 'VIP olib tashlandi'
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                            >
                              <option value={0}>VIP yo‘q (Oddiy)</option>
                              {VIP_LEVELS_1_TO_12.map((v) => (
                                <option key={v.level} value={v.level}>
                                  VIP {v.level} — {v.tierName}
                                </option>
                              ))}
                            </select>
                          </label>

                          <label className="text-[10px] font-extrabold text-slate-600 flex flex-col gap-1">
                            <span>🐉 Ajdarho ({hasDrg ? 'Bor' : 'Yo‘q'}):</span>
                            <select
                              value={hasDrg ? u.activeRide : ''}
                              onChange={(e) => {
                                const code = e.target.value;
                                updateMemberLive(
                                  u,
                                  { activeRide: code },
                                  code ? `Ajdarho berildi (${code.replace('ride-dragon-', '')})` : 'Ajdarho olib tashlandi'
                                );
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                            >
                              <option value="">Yo‘q (Ajdarhosiz)</option>
                              <option value="ride-dragon-xaldris">🐉 Afsonaviy Ajdarho (Xaldris)</option>
                            </select>
                          </label>

                          <label className="text-[10px] font-extrabold text-slate-600 flex flex-col gap-1">
                            <span>🛡️ Tizim Roli:</span>
                            <select
                              value={u.role || 'USER'}
                              onChange={(e) => {
                                const nextRole = e.target.value as any;
                                updateMemberLive(u, { role: nextRole }, `Roli ${nextRole} etib belgilandi`);
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-900"
                            >
                              <option value="USER">Oddiy Foydalanuvchi</option>
                              <option value="HOST">Host (Efir Boshlovchisi)</option>
                              <option value="AGENT">Agent</option>
                              <option value="ADMIN">Admin</option>
                              <option value="SUPER_ADMIN">Super Admin</option>
                              <option value="MANAGER">Manager</option>
                              <option value="OWNER">Owner (Ega)</option>
                            </select>
                          </label>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* LIVE ROOMS & GLOBAL BROADCAST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Megaphone className="w-4 h-4 text-amber-500" />
                  <span>Umumiy Ega E’loni (Barcha Jonli Xonalar Chatiga)</span>
                </div>
                <form onSubmit={handleBroadcast} className="flex gap-2">
                  <input
                    value={broadcastText}
                    onChange={(e) => setBroadcastText(e.target.value)}
                    placeholder="Barcha foydalanuvchilarga e’lon yozing..."
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-slate-900 text-amber-300 text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Yuborish</span>
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-900">Faol Jonli Xonalar ({liveRooms.length}):</div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {liveRooms.length === 0 ? (
                    <div className="text-xs text-slate-400 font-semibold py-2">Hozircha jonli xonalar yo‘q</div>
                  ) : (
                    liveRooms.map((r) => (
                      <div key={r.id} className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-2 rounded-xl text-xs">
                        <div className="min-w-0">
                          <div className="font-black text-slate-900 truncate">{r.title}</div>
                          <div className="text-[10px] text-slate-500 font-bold">Boshlovchi: {r.hostName}</div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={() => navigate(r.type === 'VIDEO' ? `/video/${r.id}` : `/voice/${r.id}`)}
                            className="px-2.5 py-1 rounded-lg bg-emerald-500 text-white text-[10px] font-black cursor-pointer"
                          >
                            Kirish
                          </button>
                          <button
                            onClick={() => handleCloseLiveRoom(r)}
                            className="px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 text-[10px] font-black cursor-pointer"
                          >
                            Yopish
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* EGA MONITORING: YANGI QO‘SHILGANLAR & SO‘NGGI HARAKATLAR */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Kimlar qo‘shildi ({liveUsers.length} jami foydalanuvchi)</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {[...liveUsers]
                    .sort((a, b) => (b.uid || 0) - (a.uid || 0))
                    .slice(0, 10)
                    .map((u) => (
                      <div key={u.id} className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px]">
                        <span className="font-black text-slate-900 truncate">{u.displayName} (@{u.username})</span>
                        <span className="text-[10px] font-bold text-slate-500 shrink-0">
                          ID {u.uid} • {u.role} {u.isBanned ? '🚫' : ''}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-600" />
                  <span>Nimalar bo‘lyapti (Monitoring jurnali)</span>
                </div>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {state.auditLogs.slice(0, 12).map((log) => (
                    <div key={log.id} className="flex items-center justify-between gap-2 bg-slate-50 px-3 py-1.5 rounded-xl text-[11px]">
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 mr-1">[{log.actor}]</span>
                        <span className="font-semibold text-slate-700">{log.actionUz}</span>
                      </div>
                      <span className="text-[9.5px] font-bold text-slate-400 shrink-0">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Manager Permissions Control + Emergency Stop with 2FA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Manager Vakolatlarini Boshqarish</span>
                </div>
                {(
                  [
                    ['manageAdmins', 'Adminlarni boshqarish'],
                    ['assignAgents', 'Agentlarni tayinlash'],
                    ['controlRooms', 'Chat va xonalarni nazorat qilish'],
                    ['viewReports', 'Hisobot va shikoyatlarni ko‘rish'],
                  ] as const
                ).map(([k, lbl]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{lbl}</span>
                    <button
                      onClick={() => toggleManagerPermission(k)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        state.managerPermissions[k]
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {state.managerPermissions[k] ? 'RUXSAT BOR' : 'O‘CHIQ'}
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-bold text-rose-600">Loyiha Egasini (Owner) o‘zgartirish</span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black">
                    🔒 TAQIQLANGAN
                  </span>
                </div>
              </div>

              {/* 2FA Emergency Technical Stop */}
              <div className="bg-white rounded-3xl p-4 border border-rose-200 space-y-3">
                <div className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Favqulodda Texnik To‘xtatish (2-Bosqichli Tasdiqlash)</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Kritik texnik to‘xtatish amaliyoti uchun Ega PIN kodini kiriting.
                </p>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value)}
                    placeholder="PIN kod"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                  <button
                    onClick={() => {
                      if (toggleEmergencyStop(twoFaCode)) setTwoFaCode('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black text-white ${
                      state.emergencyStopped ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {state.emergencyStopped ? 'Qayta yoqish' : 'To‘xtatish'}
                  </button>
                </div>

                {/* Staff Appointment / Removal */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-black text-slate-800">Xodimlarni tayinlash / olish:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {staffList.map((st) => (
                      <div key={st.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl">
                        <span className="font-bold">
                          {st.name} <b className="text-indigo-600">({st.role})</b>
                        </span>
                        <button
                          onClick={() => {
                            setStaffList((prev) =>
                              prev.map((x) =>
                                x.id === st.id ? { ...x, status: x.status === 'FAOL' ? 'CHETLATILGAN' : 'FAOL' } : x
                              )
                            );
                            addAuditLog('LOYIHA EGASI (SIZ)', 'OWNER', `${st.name} (${st.role}) holati o‘zgartirildi`, true);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                            st.status === 'FAOL' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {st.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Audit Log */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2">
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Barcha Harakatlar Tarixi (Audit Log)</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {state.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[11px] border ${
                      log.critical ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-black text-slate-900">{log.actor}</span>{' '}
                      <span className="text-[9.5px] font-bold text-indigo-600">[{log.role}]</span> — {log.actionUz}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. MANAGER PANEL */}
        {roleTab === 'MANAGER' && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">🏛️ Manager Operatsion Paneli</h3>
                  <p className="text-xs text-slate-500">Barcha bo‘limlar, davlatlar holati, adminlar va agentlar boshqaruvi</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black">
                  Owner tomonidan tayinlangan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Davlatlar</div>
                  <div className="text-lg font-black text-slate-900">{state.kingdoms.length}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Qit’alar</div>
                  <div className="text-lg font-black text-slate-900">{CONTINENTS_10.length}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Ovozli Xonalar</div>
                  <div className="text-lg font-black text-emerald-600">185 faol</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Shikoyatlar</div>
                  <div className="text-lg font-black text-rose-600">{complaints.filter((c) => c.status === 'OCHIQ').length} ochiq</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-black text-slate-800">Davlatlar Holati Monitoringi:</div>
                {state.kingdoms.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-black">
                      {k.flag} {k.nameUz}
                    </span>
                    <span className="font-bold text-slate-600">
                      {k.soldiersCount} askar • {k.agentsCount} agent • {k.territoriesCount} hudud
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SUPER ADMIN PANEL (TECHNICAL + 24 DATABASE TABLES) */}
        {roleTab === 'SUPER_ADMIN' && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">🛡️ Super Admin — Texnik Tizim va Server Holati</h3>
                  <p className="text-xs text-slate-500">Yagona akkaunt sessiyasi: Chat + Ovozli xona + World + Jang</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TECH_STACK_SPECS.map((t) => (
                  <div key={t.systemUz} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[9.5px] font-bold text-slate-400">{t.systemUz}</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{t.tech}</div>
                    <span className="inline-block mt-1 px-1.5 py-[1px] rounded-full bg-emerald-100 text-emerald-700 text-[8.5px] font-black">
                      ● {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 24 Database Tables Schema Inspector (Section 12) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>PostgreSQL Ma’lumotlar Bazasi — {DATABASE_24_TABLES.length} ta O‘zaro Bog‘langan Jadval</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600">Sinxronlangan ✓</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto">
                {DATABASE_24_TABLES.map((tbl) => (
                  <div
                    key={tbl.table}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                  >
                    <div>
                      <span className="font-black text-indigo-700">{tbl.table}</span>
                      <div className="text-[10px] text-slate-500">{tbl.purposeUz}</div>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                      {tbl.rows.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. ADMIN PANEL */}
        {roleTab === 'ADMIN' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" /> ⚖️ Admin Moderatsiya Paneli
            </h3>
            <div className="space-y-2">
              {complaints.map((cp) => (
                <div key={cp.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div>
                    <div className="text-xs font-black text-slate-900">Foydalanuvchi: {cp.user}</div>
                    <div className="text-[11px] text-slate-500">Sabab: {cp.reason}</div>
                  </div>
                  {cp.status === 'OCHIQ' ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setComplaints((prev) => prev.map((x) => (x.id === cp.id ? { ...x, status: 'OGOHLANTIRILDI' } : x)));
                          addAuditLog('Admin', 'ADMIN', `${cp.user} ga ogohlantirish berildi`);
                          toast('Ogohlantirish yuborildi', 'info');
                        }}
                        className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black"
                      >
                        Ogohlantirish
                      </button>
                      <button
                        onClick={() => {
                          setComplaints((prev) => prev.map((x) => (x.id === cp.id ? { ...x, status: 'BLOKLANDI' } : x)));
                          addAuditLog('Admin', 'ADMIN', `${cp.user} chatdan bloklandi`);
                          toast('Foydalanuvchi bloklandi', 'success');
                        }}
                        className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" /> Bloklash
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                      {cp.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. AGENT PANEL (MILITARY RANKS 1-10 & KINGDOM ARMY) */}
        {roleTab === 'AGENT' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-500" /> 🎖️ Agent — Davlat va Harbiy Unvonlar Paneli
                </h3>
                <p className="text-xs text-slate-500">
                  Joriy unvon: <b>{currentRankMeta.badge} {currentRankMeta.level}. {currentRankMeta.titleUz}</b> ({state.serviceXp} XP)
                </p>
              </div>
            </div>

            {/* All 10 Military Ranks Table (Section 7) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MILITARY_RANKS_10.map((r) => {
                const isCur = state.rankLevel === r.level;
                return (
                  <div
                    key={r.level}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                      isCur ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {r.level}. {r.badge} {r.titleUz}
                      </div>
                      <div className="text-[10px] text-slate-500">{r.perksUz}</div>
                    </div>
                    <button
                      disabled={isCur}
                      onClick={() => promoteRank(r.level, 'Agent Paneli')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                        isCur ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isCur ? 'Joriy ✓' : 'Berish'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. HOST PANEL (EVENTS & BATTLE SCHEDULE) */}
        {roleTab === 'HOST' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-rose-500" /> 🎤 Host — Tadbirlar va Jang Jadvali Paneli
            </h3>
            <form onSubmit={handleCreateEvent} className="flex gap-2">
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Yangi Balkon Jangi yoki Turnir nomi..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
              <button type="submit" className="px-4 py-2 rounded-xl btn-brand text-xs font-black">
                Tadbir ochish
              </button>
            </form>
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-black text-slate-900">{ev.title}</div>
                    <div className="text-[10.5px] text-slate-500">🕒 {ev.time} • 👥 {ev.players} ishtirokchi</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#ff3366] text-[10px] font-black flex items-center gap-1">
                    <Megaphone className="w-3 h-3" /> E’lon qilingan
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. BOSHLOVCHI PANEL (RECRUITING & REFERRAL) */}
        {roleTab === 'BOSHLOVCHI' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-5 h-5 text-sky-500" /> 📣 Boshlovchi — Yangi Askarlar Jalb Qilish Paneli
            </h3>
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-black text-sky-700">SHAXSIY TAKLIF HAVOLASI</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  https://zoralive.vercel.app/?ref=BOSHLOVCHI_TURON_77
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('https://zoralive.vercel.app/?ref=BOSHLOVCHI_TURON_77');
                  toast('Taklif havolasi nusxalandi! 📋', 'success');
                }}
                className="px-3 py-1.5 rounded-full bg-sky-600 text-white text-[10.5px] font-black shrink-0 flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" /> Nusxalash
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { name: 'Bekzod R.', kingdom: 'Turon Imperiyasi', rank: 'Rekrut', status: 'Tasdiqlangan' },
                { name: 'Shahlo M.', kingdom: 'Sylvanna Zumrad Davlati', rank: 'Oddiy askar', status: 'Tasdiqlangan' },
                { name: 'Timur A.', kingdom: 'Turon Imperiyasi', rank: 'Rekrut', status: 'Ro‘yxatda' },
              ].map((rec, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <div className="font-black text-slate-900">{rec.name}</div>
                    <div className="text-[10px] text-slate-500">🏰 {rec.kingdom} • {rec.rank}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
