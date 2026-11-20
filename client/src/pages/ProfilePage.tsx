import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Wallet,
  ShoppingBag,
  CheckCircle2,
  Briefcase,
  Shield,
  LogOut,
  Coins,
  Gem,
  Copy,
  Users,
  Pencil,
  X,
  Camera,
} from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useWorld } from '../context/WorldContext';
import { MILITARY_RANKS_10 } from '../lib/worldEcosystemData';
import { Avatar } from '../components/Avatar';
import { VipCrest } from '../components/LuxuryBadges';
import { MythicVaultSection } from '../components/MythicVaultSection';
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
  const [tab, setTab] = useState<'wallet' | 'store' | 'clan' | 'tasks' | 'agency'>((searchParams.get('tab') as any) || 'store');
  const currentRank = MILITARY_RANKS_10[worldState.rankLevel - 1] || MILITARY_RANKS_10[0];

  const [walletData, setWalletData] = useState<any>(null);
  const [payProvider, setPayProvider] = useState('Click');
  const [exchangeAmt, setExchangeAmt] = useState('100');
  const [withdrawDiamonds, setWithdrawDiamonds] = useState('500');
  const [withdrawMethod, setWithdrawMethod] = useState('USDT_TRC20');
  const [withdrawDest, setWithdrawDest] = useState('');
  const [kycName, setKycName] = useState('');

  const [storeItems, setStoreItems] = useState<any[]>([]);
  const initialSub = (searchParams.get('sub') as 'VIP' | 'DRAGON' | 'FRAME' | 'CRYSTAL' | 'RIDE' | 'BUBBLE') || 'VIP';
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

  const loadTabData = async (currentTab = tab) => {
    try {
      if (currentTab === 'wallet') setWalletData(await api('/wallet'));
      else if (currentTab === 'store') setStoreItems((await api('/store/items')).items || []);
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
      await api('/users/profile', {
        method: 'PUT',
        body: JSON.stringify({ displayName: editName, bio: editBio, avatar: editAvatar }),
      });
      await refreshUser();
      setEditOpen(false);
      toast('Profil saqlandi', 'success');
    } catch (err: any) {
      toast(err.message, 'error');
    }
  };

  return (
    <div className="bg-white min-h-full px-3.5 pt-2 pb-8 space-y-3">
      {/* Top Utility Bar */}
      <div className="flex items-center justify-between pb-1">
        <div className="flex gap-0.5 bg-slate-100 rounded-full p-0.5">
          {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                lang === l ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="flex gap-1.5">
          {user.role === 'ADMIN' && (
            <button onClick={() => navigate('/admin')} className="p-2 rounded-full bg-slate-900 text-white" title="Admin">
              <Shield className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={logout} className="p-2 rounded-full bg-slate-100 text-slate-600 hover:text-rose-600" title="Chiqish">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Centered Hero Profile Section (Lowered with plenty of room for flying & perched dragon) */}
      <div className="flex flex-col items-center text-center pt-8 pb-3 border-b border-slate-100 relative">
        <div className="relative p-2 flex items-center justify-center">
          <Avatar src={user.avatar} name={user.displayName} size="xl" frame={user.activeFrame} vipLevel={user.vipLevel} />
        </div>

        <div className="mt-2.5 flex items-center justify-center gap-2">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">{user.displayName}</h2>
          <button onClick={openEditor} className="p-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 transition" title="Tahrirlash">
            <Pencil className="w-3 h-3" />
          </button>
        </div>

        <button
          onClick={() => {
            navigator.clipboard?.writeText(String(user.uid));
            toast(`ID: ${user.uid}`, 'info');
          }}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 mt-1 font-semibold group"
        >
          <span className="px-2 py-0.5 rounded-md bg-slate-100 group-hover:bg-slate-200 text-[11px] font-bold text-slate-700 transition">ID {user.uid}</span>
          <Copy className="w-3 h-3 text-slate-400 group-hover:text-slate-600" />
        </button>

        <div className="flex items-center justify-center gap-4 mt-2 text-xs text-slate-500 font-medium">
          <span><b className="text-slate-900">{user.followersCount ?? 0}</b> obunachi</span>
          <span className="w-1 h-1 rounded-full bg-slate-300" />
          <span><b className="text-slate-900">{user.followingCount ?? 0}</b> obuna</span>
        </div>
      </div>

      {/* Military Rank (1-10) & 7-Role Governance Portal */}
      <div className="rounded-3xl p-3 bg-gradient-to-r from-slate-950 via-indigo-950 to-slate-900 text-white border border-amber-400/35 flex items-center justify-between gap-2 shadow-sm">
        <div className="min-w-0">
          <div className="text-[10px] font-black text-amber-300">
            HARBIY UNVON ({currentRank.level}/10) • 💎 {worldState.worldGems} WORLD GEM
          </div>
          <div className="text-xs font-black truncate mt-0.5">
            {currentRank.badge} {currentRank.titleUz} — Turon Imperiyasi
          </div>
        </div>
        <button
          onClick={() => navigate('/admin')}
          className="px-3 py-2 rounded-full bg-amber-400 text-slate-950 text-[10.5px] font-black shrink-0 flex items-center gap-1 hover:bg-amber-300 transition"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Owner & 7 Panel</span>
        </button>
      </div>

      {/* 5 Compact Tabs */}
      <div className="grid grid-cols-5 gap-1 bg-slate-100 p-1 rounded-full">
        {[
          { id: 'store', label: 'Sovg‘a/VIP', icon: ShoppingBag },
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
              className={`py-2 rounded-full text-[10px] font-extrabold flex flex-col items-center gap-0.5 transition ${
                tab === item.id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
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
                {['Click', 'Payme', 'Play', 'USDT'].map((prov) => (
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
                      const res = await api<{ added: number }>('/wallet/topup', {
                        method: 'POST',
                        body: JSON.stringify({ packageId: pkg.id, provider: payProvider }),
                      });
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
                  <div className="text-xs font-extrabold text-slate-900 mt-1">{pkg.priceUzs.toLocaleString()} so‘m</div>
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
            >
              💎 → 🪙
            </button>
          </div>

          <form
            onSubmit={async (e) => {
              e.preventDefault();
              try {
                const res = await api<{ usdAmount: number }>('/wallet/withdraw', {
                  method: 'POST',
                  body: JSON.stringify({
                    diamonds: Number(withdrawDiamonds),
                    method: withdrawMethod,
                    destination: withdrawDest,
                    kycFullName: kycName,
                  }),
                });
                toast(`$${res.usdAmount} so‘rov yuborildi`, 'success');
                setWithdrawDest('');
                await refreshUser();
                loadTabData('wallet');
              } catch (err: any) {
                toast(err.message, 'error');
              }
            }}
            className="card-white rounded-2xl p-3.5 space-y-2"
          >
            <div className="text-xs font-extrabold text-slate-900">Pul yechish (min 500 💎)</div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                min={500}
                value={withdrawDiamonds}
                onChange={(e) => setWithdrawDiamonds(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
              <select
                value={withdrawMethod}
                onChange={(e) => setWithdrawMethod(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              >
                <option value="USDT_TRC20">USDT TRC-20</option>
                <option value="UZCARD">Uzcard / Humo</option>
                <option value="BINANCE">Binance</option>
              </select>
            </div>
            <input required value={kycName} onChange={(e) => setKycName(e.target.value)} placeholder="Ism-familiya" className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
            <input required value={withdrawDest} onChange={(e) => setWithdrawDest(e.target.value)} placeholder="Karta / Hamyon" className="w-full px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs" />
            <button type="submit" className="w-full py-2.5 rounded-full btn-brand font-extrabold text-xs">
              Yechish (${(Number(withdrawDiamonds || 0) / 100).toFixed(2)})
            </button>
          </form>

          {walletData?.ledger?.length > 0 && (
            <div className="card-white rounded-2xl divide-y divide-slate-100 overflow-hidden">
              {walletData.ledger.slice(0, 10).map((tx: any) => (
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
      )}

      {/* STORE — VIP 1-12, 10 MYTHIC DRAGONS, 12 ANIMATED FRAMES & 4 CRYSTAL ENERGIES */}
      {tab === 'store' && (
        <MythicVaultSection
          storeItems={storeItems}
          onReloadStore={() => loadTabData('store')}
          initialFilter={initialSub}
        />
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
  );
};
