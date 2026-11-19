import React from 'react';
import { GiftEvent } from '../types';
import { getGiftImage } from './LuxuryBadges';

export const GiftOverlay: React.FC<{ gift: GiftEvent | null }> = ({ gift }) => {
  if (!gift) return null;

  const isLuxury = gift.effectType === 'fullscreen' || gift.category === 'LUXURY';
  const imgSrc = getGiftImage(gift.giftId);

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
