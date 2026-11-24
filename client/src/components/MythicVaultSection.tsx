import React, { useState } from 'react';
import { Sparkles, Check, Crown, Flame, Shield, Zap, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { syncProfileToSupabase } from '../lib/supabaseSync';
import {
  ANIMATED_FRAMES,
  CRYSTAL_ENERGIES,
  MYTHIC_DRAGONS,
  VIP_LEVELS_1_TO_12,
  MythicDragon,
} from '../lib/mythicCatalog';
import { Avatar } from './Avatar';
import { VipCrest } from './LuxuryBadges';

interface MythicVaultSectionProps {
  storeItems: any[];
  onReloadStore: () => void;
  initialFilter?: 'FRAME' | 'DRAGON' | 'CRYSTAL' | 'VIP' | 'RIDE' | 'BUBBLE';
  darkSurface?: boolean;
}

const CRYSTAL_KEY = 'zoralive_active_crystal';
const CRYSTAL_CHARGED_KEY = 'zoralive_crystal_charged';

export const MythicVaultSection: React.FC<MythicVaultSectionProps> = ({
  storeItems,
  onReloadStore,
  initialFilter = 'VIP',
  darkSurface = false,
}) => {
  const { user, refreshUser, updateCoinsLocally, toast } = useAuth();
  const [filter, setFilter] = useState<'VIP' | 'DRAGON' | 'FRAME' | 'CRYSTAL' | 'RIDE' | 'BUBBLE'>(initialFilter);
  const [inspectDragon, setInspectDragon] = useState<MythicDragon | null>(null);
  const [activeCrystal, setActiveCrystal] = useState<string>(() => localStorage.getItem(CRYSTAL_KEY) || 'crystal-amethyst');
  const [chargedToday, setChargedToday] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(CRYSTAL_CHARGED_KEY) || '{}');
    } catch {
      return {};
    }
  });

  if (!user) return null;

  const ownedCodes = new Set(storeItems.filter((i) => i.owned).map((i) => i.code));

  const buyOrEquip = async (itemId: string, itemType: string, code: string, price: number, isOwned: boolean, isEquipped: boolean) => {
    try {
      let res: any;
      if (isOwned && itemType !== 'VIP') {
        res = await api('/store/equip', {
          method: 'POST',
          body: JSON.stringify({ itemType, itemCode: isEquipped ? '' : code }),
        });
        toast(isEquipped ? 'Yechib qo‘yildi' : 'Faollashtirildi ✨', 'success');
      } else {
        const vipMeta =
          itemType === 'VIP'
            ? VIP_LEVELS_1_TO_12.find((v) => `vip-${v.level}` === code)
            : null;
        res = await api('/store/buy', {
          method: 'POST',
          body: JSON.stringify({
            itemId,
            code,
            itemType,
            price,
            nameUz: vipMeta ? `VIP ${vipMeta.level} — ${vipMeta.tierName}` : code,
            frameCode: vipMeta?.frameCode,
            bubbleCode: vipMeta?.bubbleCode,
          }),
        });
        toast('Muvaffaqiyatli faollashtirildi! 🎉', 'success');
      }
      if (res?.user) {
        await syncProfileToSupabase({
          id: user.id,
          coins: res.user.coins,
          vipLevel: res.user.vipLevel,
          activeFrame: res.user.activeFrame,
          activeRide: res.user.activeRide,
          activeBubble: res.user.activeBubble,
        });
      }
      await refreshUser();
      onReloadStore();
    } catch (err: any) {
      toast(err.message || 'Xatolik', 'error');
    }
  };

  const handleChargeCrystal = (c: (typeof CRYSTAL_ENERGIES)[number]) => {
    if (chargedToday[c.code]) {
      setActiveCrystal(c.code);
      localStorage.setItem(CRYSTAL_KEY, c.code);
      toast(`${c.nameUz} faol kristall etib tanlandi ✨`, 'success');
      return;
    }
    const next = { ...chargedToday, [c.code]: true };
    setChargedToday(next);
    localStorage.setItem(CRYSTAL_CHARGED_KEY, JSON.stringify(next));
    setActiveCrystal(c.code);
    localStorage.setItem(CRYSTAL_KEY, c.code);
    updateCoinsLocally((user.coins || 0) + c.bonusCoins);
    toast(`💎 ${c.nameUz} energiyasi olindi: +${c.bonusCoins} tanga!`, 'success');
  };

  const tabs: Array<[typeof filter, string]> = [
    ['VIP', '👑 VIP 1-12 Panellar'],
    ['DRAGON', '🐉 Ajdarholar (10)'],
    ['FRAME', '🖼️ Siken / Ramka (12)'],
    ['CRYSTAL', '💎 Kristall (4)'],
    ['RIDE', '🏎️ Boshqa Ulovlar'],
    ['BUBBLE', '💬 Chat Pufak'],
  ];

  return (
    <div className="space-y-3.5">
      {/* Category Pills */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
        {tabs.map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`px-3 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition ${
              filter === k
                ? darkSurface
                  ? 'bg-amber-400 text-slate-950 shadow-[0_0_12px_rgba(251,191,36,0.45)]'
                  : 'bg-slate-900 text-white shadow-xs'
                : darkSurface
                ? 'bg-black/50 border border-white/15 text-white/85 hover:bg-black/70 backdrop-blur-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* 1. VIP 1-12 PRIVILEGE CENTER */}
      {filter === 'VIP' && (
        <div className="space-y-3">
          {/* Current VIP Status Banner */}
          <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-purple-950 text-white shadow-md border border-amber-400/30">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size="md"
                  frame={user.activeFrame || 'frame-gold-1'}
                  vipLevel={user.vipLevel || 1}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black">VIP 1–12 Imtiyozlar</span>
                    <VipCrest level={user.vipLevel || 1} size="xs" />
                  </div>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">
                    Joriy daraja: <span className="font-black text-white">VIP {user.vipLevel || 1}</span> / 12
                  </p>
                </div>
              </div>
              <Crown className="w-6 h-6 text-amber-300 shrink-0" />
            </div>

            <div className="mt-3 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-purple-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((user.vipLevel || 1) / 12) * 100))}%` }}
              />
            </div>
          </div>

          {/* All 12 VIP Levels List */}
          <div className="space-y-2.5">
            {VIP_LEVELS_1_TO_12.map((tier) => {
              const unlocked = (user.vipLevel || 0) >= tier.level;
              const isCurrent = (user.vipLevel || 0) === tier.level;
              const isCosmic = tier.level >= 11;
              return (
                <div
                  key={tier.level}
                  className={`rounded-2xl p-3.5 border transition ${
                    isCosmic
                      ? 'bg-gradient-to-br from-slate-950 via-purple-950 to-rose-950 text-white border-amber-400/50 shadow-md'
                      : isCurrent
                      ? 'bg-amber-50/70 border-amber-300'
                      : 'bg-white border-slate-200/80'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 p-1">
                      <Avatar
                        src={user.avatar}
                        name={user.displayName}
                        size="sm"
                        frame={tier.frameCode}
                        vipLevel={tier.hasRingEffect ? tier.level : 0}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <VipCrest level={tier.level} size="sm" />
                        <span className={`text-xs font-black ${isCosmic ? 'text-amber-200' : 'text-slate-900'}`}>
                          {tier.tierName}
                        </span>
                        {tier.hasRingEffect && (
                          <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-500 text-[9px] font-black">
                            Ring Aura
                          </span>
                        )}
                      </div>

                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {tier.rewardsUz.map((rw) => (
                          <span
                            key={rw}
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              isCosmic ? 'bg-white/10 text-white/90' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            ✦ {rw}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-200/40">
                    <span className={`text-[11px] font-extrabold ${isCosmic ? 'text-amber-300' : 'text-amber-600'}`}>
                      🪙 {tier.price.toLocaleString()} tanga
                    </span>

                    <button
                      onClick={() =>
                        buyOrEquip(
                          `st-vip-${tier.level}`,
                          'VIP',
                          `vip-${tier.level}`,
                          tier.price,
                          false,
                          isCurrent
                        )
                      }
                      className={`px-4 py-1.5 rounded-full text-xs font-extrabold transition ${
                        isCurrent
                          ? 'bg-emerald-500 text-white'
                          : unlocked
                          ? isCosmic
                            ? 'bg-white/15 text-white hover:bg-white/25'
                            : 'bg-slate-100 text-slate-700'
                          : 'btn-brand'
                      }`}
                    >
                      {isCurrent ? '✓ Faol daraja' : unlocked ? 'Qayta taqish' : `VIP ${tier.level} olish`}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. ALL 10 MYTHICAL DRAGONS */}
      {filter === 'DRAGON' && (
        <div className="grid grid-cols-2 gap-2.5">
          {MYTHIC_DRAGONS.map((d) => {
            const isEquipped = user.activeRide === d.rideCode;
            const isOwned = ownedCodes.has(d.rideCode) || isEquipped;
            return (
              <div
                key={d.id}
                className="card-white rounded-2xl overflow-hidden flex flex-col justify-between border border-slate-200/80"
              >
                <button onClick={() => setInspectDragon(d)} className="text-left group">
                  <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                    <img
                      src={d.image}
                      alt={d.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/20" />
                    <span
                      className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-black text-white bg-gradient-to-r ${d.gradient} shadow`}
                    >
                      {d.elementUz}
                    </span>
                    {d.vipUnlock && (
                      <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-full bg-black/65 text-amber-300 text-[9px] font-black">
                        VIP{d.vipUnlock}
                      </span>
                    )}
                    <div className="absolute bottom-2 left-2 right-2">
                      <div className="text-sm font-black text-white leading-tight">{d.name}</div>
                      <div className="text-[10px] font-semibold text-amber-200 truncate">{d.titleUz}</div>
                    </div>
                  </div>
                </button>

                <div className="p-2.5 space-y-2">
                  <div className="text-[10px] text-slate-500 line-clamp-2 min-h-[28px]">{d.powerUz}</div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => setInspectDragon(d)}
                      className="px-2.5 py-1.5 rounded-full bg-slate-100 text-slate-700 text-[10px] font-extrabold"
                    >
                      Batafsil
                    </button>
                    <button
                      onClick={() =>
                        buyOrEquip(`st-drg-${d.id}`, 'RIDE', d.rideCode, d.ridePrice, isOwned, isEquipped)
                      }
                      className={`flex-1 py-1.5 rounded-full text-[10px] font-extrabold ${
                        isEquipped
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isOwned
                          ? 'bg-slate-900 text-white'
                          : 'btn-brand'
                      }`}
                    >
                      {isEquipped ? '✓ Faol' : isOwned ? 'Taqish' : `🪙 ${d.ridePrice.toLocaleString()}`}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 3. ALL 12 ANIMATED LUXURY FRAMES */}
      {filter === 'FRAME' && (
        <div className="grid grid-cols-2 gap-2.5">
          {ANIMATED_FRAMES.map((fr) => {
            const isEquipped = user.activeFrame === fr.code;
            const isOwned = ownedCodes.has(fr.code) || isEquipped;
            return (
              <div key={fr.id} className="card-white rounded-2xl p-3 flex flex-col items-center justify-between gap-2.5">
                <span className="self-end px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[9px] font-black">
                  {fr.badge}
                </span>

                <div className="py-3.5 px-2 flex items-center justify-center min-h-[92px]">
                  <Avatar src={user.avatar} name={user.displayName} size="lg" frame={fr.code} />
                </div>

                <div className="text-center">
                  <div className="text-xs font-extrabold text-slate-900">{fr.nameUz}</div>
                  <div className="text-[10px] text-slate-400">Animatsiyali SVGA/WebP</div>
                </div>

                <button
                  onClick={() => buyOrEquip(fr.id, 'FRAME', fr.code, fr.price, isOwned, isEquipped)}
                  className={`w-full py-2 rounded-full text-xs font-extrabold transition ${
                    isEquipped
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isOwned
                      ? 'bg-slate-900 text-white'
                      : 'btn-brand'
                  }`}
                >
                  {isEquipped ? '✓ Taqilgan' : isOwned ? 'Taqish' : `🪙 ${fr.price.toLocaleString()}`}
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. CRYSTAL ENERGY SYSTEM (4 ANIMATED CRYSTALS) */}
      {filter === 'CRYSTAL' && (
        <div className="space-y-3">
          {CRYSTAL_ENERGIES.map((c) => {
            const isActive = activeCrystal === c.code;
            const claimed = Boolean(chargedToday[c.code]);
            return (
              <div
                key={c.id}
                className={`rounded-3xl overflow-hidden border transition shadow-xs ${
                  isActive ? 'border-amber-400 ring-2 ring-amber-300/40' : 'border-slate-200'
                }`}
              >
                <div className="relative h-40 w-full bg-slate-950 overflow-hidden">
                  <img src={c.webp} alt={c.nameUz} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-black/25" />
                  <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${c.gradient}`}>
                      💎 {c.elementUz}
                    </span>
                    {isActive && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-black flex items-center gap-0.5">
                        <Check className="w-3 h-3" /> Faol
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-2.5 left-3 right-3 text-white">
                    <div className="text-base font-black">{c.nameUz}</div>
                    <div className="text-[11px] text-amber-200 font-bold">{c.benefitUz}</div>
                  </div>
                </div>

                <div className="p-3 bg-white flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-slate-600">
                    <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    <span>{c.auraUz}</span>
                  </div>

                  <button
                    onClick={() => handleChargeCrystal(c)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold shrink-0 ${
                      claimed
                        ? isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-900 text-white'
                        : 'btn-brand'
                    }`}
                  >
                    {claimed ? (isActive ? '✓ Faol Aura' : 'Faollashtirish') : `⚡ Quvvat (+${c.bonusCoins} 🪙)`}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 5. RIDES & 6. CHAT BUBBLES */}
      {(filter === 'RIDE' || filter === 'BUBBLE') && (
        <div className="grid grid-cols-2 gap-2.5">
          {storeItems
            .filter((i) => i.type === filter)
            .map((item) => {
              const isEquipped = user.activeRide === item.code || user.activeBubble === item.code;
              return (
                <div key={item.id} className="card-white rounded-2xl p-3 flex flex-col justify-between gap-2.5">
                  <div className="flex flex-col items-center py-2">
                    {item.type === 'BUBBLE' ? (
                      <span className={`px-3.5 py-1.5 rounded-2xl text-[11px] font-bold ${item.code}`}>
                        Salom ZoraLive! ✨
                      </span>
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-slate-950 overflow-hidden flex items-center justify-center">
                        <img
                          src={item.image || (item.code === 'ride-dragon' ? '/assets/gift-dragon.jpg' : '/assets/gift-car.jpg')}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="text-xs font-extrabold text-slate-900 mt-2 text-center">{item.name_uz}</div>
                  </div>

                  <button
                    onClick={() => buyOrEquip(item.id, item.type, item.code, item.price, Boolean(item.owned), isEquipped)}
                    className={`w-full py-2 rounded-full text-xs font-extrabold ${
                      isEquipped
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.owned
                        ? 'bg-slate-900 text-white'
                        : 'btn-brand'
                    }`}
                  >
                    {isEquipped ? '✓ Faol' : item.owned ? 'Taqish' : `🪙 ${Number(item.price || 0).toLocaleString()}`}
                  </button>
                </div>
              );
            })}
        </div>
      )}

      {/* DRAGON FULL LORE & ATTRIBUTES MODAL */}
      {inspectDragon && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-3"
          onClick={() => setInspectDragon(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-56 w-full bg-slate-950">
              <img src={inspectDragon.image} alt={inspectDragon.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
              <button
                onClick={() => setInspectDragon(null)}
                className="absolute top-3 right-3 p-1.5 rounded-full bg-black/55 text-white"
              >
                <X className="w-4 h-4" />
              </button>
              <span
                className={`absolute top-3 left-3 px-2.5 py-0.5 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${inspectDragon.gradient}`}
              >
                🐉 {inspectDragon.elementUz}
              </span>
              <div className="absolute bottom-3 left-4 right-4 text-white">
                <h3 className="text-xl font-black leading-tight">{inspectDragon.name}</h3>
                <p className="text-xs font-bold text-amber-300">{inspectDragon.titleUz}</p>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold">Rangi</div>
                  <div className="text-[11px] font-extrabold text-slate-900 mt-0.5">{inspectDragon.colorUz}</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold">Elementi</div>
                  <div className="text-[11px] font-extrabold text-slate-900 mt-0.5">{inspectDragon.elementUz}</div>
                </div>
                <div className="bg-slate-50 rounded-2xl p-2 border border-slate-100">
                  <div className="text-[10px] text-slate-400 font-bold">Hajmi</div>
                  <div className="text-[11px] font-extrabold text-slate-900 mt-0.5">{inspectDragon.sizeUz}</div>
                </div>
              </div>

              <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 flex items-start gap-2">
                <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="text-[10px] font-bold text-amber-700">Kuchi</div>
                  <div className="text-xs font-extrabold text-slate-900">{inspectDragon.powerUz}</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-[11px] font-extrabold text-slate-500 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-[#ff3366]" />
                  <span>Maxsus xususiyatlari:</span>
                </div>
                {inspectDragon.abilitiesUz.map((ab) => (
                  <div key={ab} className="flex items-center gap-2 text-xs font-bold text-slate-800 bg-slate-50 px-3 py-2 rounded-xl">
                    <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                    <span>{ab}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => {
                  const isEq = user.activeRide === inspectDragon.rideCode;
                  const isOwn = ownedCodes.has(inspectDragon.rideCode) || isEq;
                  buyOrEquip(
                    `st-drg-${inspectDragon.id}`,
                    'RIDE',
                    inspectDragon.rideCode,
                    inspectDragon.ridePrice,
                    isOwn,
                    isEq
                  );
                  setInspectDragon(null);
                }}
                className="w-full py-2.5 rounded-full btn-brand text-xs font-extrabold"
              >
                {user.activeRide === inspectDragon.rideCode
                  ? '✓ Hozirgi kirish ajdarhosi'
                  : `🐉 Kirish ajdarhosi qilib olish (🪙 ${inspectDragon.ridePrice.toLocaleString()})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
