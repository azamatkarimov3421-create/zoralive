import React from 'react';
import { GiftEvent } from '../types';
import { getGiftImage } from './LuxuryBadges';
import { DRAGON_BY_GIFT_ID } from '../lib/mythicCatalog';

export const GiftOverlay: React.FC<{ gift: GiftEvent | null }> = ({ gift }) => {
  if (!gift) return null;

  const dragon = DRAGON_BY_GIFT_ID[gift.giftId];
  const isLuxury = Boolean(dragon) || gift.effectType === 'fullscreen' || gift.category === 'LUXURY';
  const imgSrc = getGiftImage(gift.giftId);

  if (dragon) {
    return (
      <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/35 backdrop-blur-[2px]">
        <div
          key={gift.id}
          className={`animate-dragon-arrive relative w-full max-w-xs rounded-3xl overflow-hidden bg-slate-950 border-2 shadow-2xl text-white`}
          style={{ borderColor: dragon.accent, boxShadow: `0 0 42px ${dragon.accent}66` }}
        >
          <div className="relative h-56 w-full overflow-hidden">
            <img src={dragon.image} alt={dragon.name} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent" />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wide bg-gradient-to-r ${dragon.gradient} text-white shadow`}
              >
                🐉 {dragon.elementUz}
              </span>
              <span className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur text-[10px] font-bold text-amber-300">
                {dragon.sizeUz}
              </span>
            </div>
            <span className="absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full bg-[#ff3366] text-white font-black text-xs shadow">
              ×{gift.quantity}
            </span>
          </div>

          <div className="px-4 pb-4 -mt-6 relative z-10 text-center space-y-1.5">
            <div className="text-xl font-black tracking-tight">{dragon.name}</div>
            <div className="text-xs font-bold text-amber-300">{dragon.titleUz}</div>
            <p className="text-[11px] text-slate-300 leading-snug">{dragon.powerUz}</p>
            <div className="flex flex-wrap justify-center gap-1 pt-1">
              {dragon.abilitiesUz.map((ab) => (
                <span key={ab} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-semibold text-white/90">
                  ✦ {ab}
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-white/10 text-xs font-extrabold text-amber-200">
              {gift.senderName} → {gift.receiverName}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div
        key={gift.id}
        className={`animate-gift-pop relative flex flex-col items-center text-center ${
          isLuxury
            ? 'px-7 py-6 rounded-3xl bg-slate-950/92 border border-amber-300/50 shadow-2xl max-w-xs w-full text-white'
            : 'px-5 py-3.5 rounded-2xl bg-white border border-slate-200 shadow-xl text-slate-900'
        }`}
      >
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={gift.giftName}
            className="w-40 h-40 object-contain mix-blend-screen my-1"
          />
        ) : (
          <div className="text-5xl my-1">{gift.giftIcon}</div>
        )}

        <div className="flex items-center gap-2 mt-1">
          <span className="font-black text-base">{gift.giftName}</span>
          <span className="px-2 py-0.5 rounded-full bg-[#ff3366] text-white font-black text-xs">
            ×{gift.quantity}
          </span>
        </div>

        <div className={`mt-1.5 text-xs font-bold ${isLuxury ? 'text-amber-300' : 'text-slate-600'}`}>
          {gift.senderName} → {gift.receiverName}
        </div>
      </div>
    </div>
  );
};
