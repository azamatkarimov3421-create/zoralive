import React, { useState } from 'react';
import { Crown, Flame, Shield, Zap, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { syncProfileToSupabase } from '../lib/supabaseSync';
import {
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

export const MythicVaultSection: React.FC<MythicVaultSectionProps> = ({
  storeItems,
  onReloadStore,
  initialFilter = 'VIP',
  darkSurface = false,
}) => {
  const { user, refreshUser, toast } = useAuth();
  const [filter, setFilter] = useState<'VIP' | 'DRAGON' | 'FRAME' | 'CRYSTAL' | 'RIDE' | 'BUBBLE'>(initialFilter);
  const [inspectDragon, setInspectDragon] = useState<MythicDragon | null>(null);

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

  const tabs: Array<[typeof filter, string]> = [
    ['VIP', '👑 VIP 1-12 Panellar'],
    ['DRAGON', '🐉 Ajdarho (1)'],
  ];

  const featuredDragon = MYTHIC_DRAGONS.find((d) => d.id === 'xaldris') || MYTHIC_DRAGONS[0];
  const activeFilter: 'VIP' | 'DRAGON' = filter === 'DRAGON' ? 'DRAGON' : 'VIP';

  return (
    <div className="space-y-3.5">
      {/* Category Segmented Tabs */}
      <div
        className={`grid grid-cols-2 gap-1.5 p-1.5 rounded-2xl border-2 ${
          darkSurface
            ? 'bg-black/45 border-white/25 backdrop-blur-2xl'
            : 'bg-white/55 border-white/85 backdrop-blur-xl shadow-xs'
        }`}
      >
        {tabs.map(([k, lbl]) => (
          <button
            key={k}
            onClick={() => setFilter(k)}
            className={`py-2.5 px-3 rounded-xl text-xs font-black whitespace-nowrap transition cursor-pointer ${
              activeFilter === k
                ? darkSurface
                  ? 'bg-amber-400 text-slate-950 shadow-md'
                  : 'bg-slate-900 text-white shadow-md'
                : darkSurface
                ? 'text-white/80 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {lbl}
          </button>
        ))}
      </div>

      {/* 1. VIP 1-12 PRIVILEGE CENTER */}
      {activeFilter === 'VIP' && (
        <div className="space-y-3">
          {/* Current VIP Status Banner */}
          <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-950/90 via-indigo-950/90 to-purple-950/90 backdrop-blur-xl text-white shadow-lg border-2 border-amber-300/45">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user.avatar}
                  name={user.displayName}
                  size="md"
                  frame={user.activeFrame || undefined}
                  vipLevel={user.vipLevel || 0}
                />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-black">VIP 1–12 Imtiyozlar</span>
                    {(user.vipLevel || 0) > 0 && <VipCrest level={user.vipLevel} size="xs" />}
                  </div>
                  <p className="text-[11px] text-amber-200/90 mt-0.5">
                    Joriy daraja: <span className="font-black text-white">VIP {user.vipLevel || 0}</span> / 12
                  </p>
                </div>
              </div>
              <Crown className="w-6 h-6 text-amber-300 shrink-0" />
            </div>

            <div className="mt-3 h-1.5 w-full rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-amber-300 via-rose-400 to-purple-400 transition-all duration-500"
                style={{ width: `${Math.min(100, Math.round(((user.vipLevel || 0) / 12) * 100))}%` }}
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
                  className={`rounded-3xl p-4 border-2 transition ${
                    isCosmic
                      ? 'bg-gradient-to-br from-slate-950/92 via-purple-950/90 to-rose-950/92 backdrop-blur-2xl text-white border-amber-300/55 shadow-lg'
                      : isCurrent
                      ? 'bg-amber-100/75 backdrop-blur-2xl border-amber-400 shadow-md'
                      : 'bg-white/62 backdrop-blur-2xl border-white/90 shadow-[0_10px_28px_-8px_rgba(15,23,42,0.12),inset_0_1.5px_0_rgba(255,255,255,0.95)]'
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
                    <span className={`text-[11px] font-extrabold ${isCosmic ? 'text-emerald-300' : 'text-emerald-600'}`}>
                      {tier.price === 0 ? '🎁 Tekin (Ochiq)' : `🪙 ${tier.price.toLocaleString()} tanga`}
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

      {/* 2. SINGLE FEATURED DRAGON */}
      {activeFilter === 'DRAGON' && featuredDragon && (() => {
        const d = featuredDragon;
        const isEquipped = user.activeRide === d.rideCode;
        const isOwned = ownedCodes.has(d.rideCode) || isEquipped;
        return (
          <div className="space-y-3">
            <div className="card-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md">
              <button onClick={() => setInspectDragon(d)} className="text-left group w-full block">
                <div className="relative h-56 w-full overflow-hidden bg-slate-950">
                  <img
                    src={d.image}
                    alt={d.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-black/25" />
                  <span
                    className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-black text-white bg-gradient-to-r ${d.gradient} shadow`}
                  >
                    🐉 {d.elementUz}
                  </span>
                  <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/70 text-amber-300 text-[10px] font-black border border-amber-400/30">
                    Yagona Afsonaviy Ajdarho
                  </span>
                  <div className="absolute bottom-3 left-4 right-4 text-white">
                    <div className="text-xl font-black leading-tight">{d.name}</div>
                    <div className="text-xs font-bold text-amber-200 mt-0.5">{d.titleUz}</div>
                  </div>
                </div>
              </button>

              <div className="p-4 space-y-3">
                <div className="bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3 flex items-start gap-2">
                  <Flame className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-[10px] font-bold text-amber-700">Kuchi va Ta’siri</div>
                    <div className="text-xs font-extrabold text-slate-900">{d.powerUz}</div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {d.abilitiesUz.map((ab) => (
                    <span
                      key={ab}
                      className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold"
                    >
                      ✦ {ab}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setInspectDragon(d)}
                    className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-extrabold"
                  >
                    Batafsil
                  </button>
                  <button
                    onClick={() =>
                      buyOrEquip(`st-drg-${d.id}`, 'RIDE', d.rideCode, d.ridePrice, isOwned, isEquipped)
                    }
                    className={`flex-1 py-2.5 rounded-full text-xs font-extrabold ${
                      isEquipped
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : isOwned
                        ? 'bg-slate-900 text-white'
                        : 'btn-brand'
                    }`}
                  >
                    {isEquipped
                      ? '✓ Faol Ajdarho'
                      : isOwned
                      ? 'Taqish'
                      : d.ridePrice === 0
                      ? '🐉 Tekin Olish'
                      : `🐉 Sotib olish (🪙 ${d.ridePrice.toLocaleString()})`}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

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
                  : inspectDragon.ridePrice === 0
                  ? '🐉 Tekin olish va taqish'
                  : `🐉 Kirish ajdarhosi qilib olish (🪙 ${inspectDragon.ridePrice.toLocaleString()})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
