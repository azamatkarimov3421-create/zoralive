import React, { useEffect, useState } from 'react';
import { X, Coins } from 'lucide-react';
import { api } from '../lib/api';
import { GiftItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { getGiftImage } from './LuxuryBadges';
import { DRAGON_BY_GIFT_ID } from '../lib/mythicCatalog';

interface RecipientOption {
  id: string;
  name: string;
  avatar?: string;
  pkSide?: 'left' | 'right';
}

interface GiftDrawerProps {
  open: boolean;
  onClose: () => void;
  recipients: RecipientOption[];
  onSend: (payload: { giftId: string; quantity: number; receiverId: string; pkSide?: 'left' | 'right' }) => void;
  onOpenTopup?: () => void;
}

const COMBOS = [1, 10, 66, 99];

export const GiftDrawer: React.FC<GiftDrawerProps> = ({
  open,
  onClose,
  recipients,
  onSend,
  onOpenTopup,
}) => {
  const { user } = useAuth();
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [category, setCategory] = useState<'DRAGON' | 'LUXURY' | 'LUCKY' | 'BASIC'>('DRAGON');
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [recipientIdx, setRecipientIdx] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    api<{ gifts: GiftItem[] }>('/store/gifts')
      .then((res) => {
        setGifts(res.gifts || []);
        const drg = (res.gifts || []).find((g) => Boolean(DRAGON_BY_GIFT_ID[g.id]));
        const first = drg || (res.gifts || [])[0];
        if (!selectedGiftId && first) setSelectedGiftId(first.id);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const filtered =
    category === 'DRAGON'
      ? gifts.filter((g) => Boolean(DRAGON_BY_GIFT_ID[g.id]))
      : gifts.filter((g) => g.category === category && !DRAGON_BY_GIFT_ID[g.id]);

  const activeGift = gifts.find((g) => g.id === selectedGiftId) || filtered[0];
  const target = recipients[recipientIdx] || recipients[0];
  const totalCost = activeGift ? activeGift.price * qty : 0;
  const activeDragon = activeGift ? DRAGON_BY_GIFT_ID[activeGift.id] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/45 backdrop-blur-xs" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white rounded-t-3xl p-4 pb-5 shadow-2xl border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-9 h-1 rounded-full bg-slate-200 mx-auto mb-3" />

        {/* Recipient Row */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {recipients.map((r, idx) => (
              <button
                key={r.id + (r.pkSide || '')}
                onClick={() => setRecipientIdx(idx)}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-xs font-bold shrink-0 border transition ${
                  idx === recipientIdx
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-100 border-transparent text-slate-700'
                }`}
              >
                {r.avatar && <img src={r.avatar} alt="" className="w-5 h-5 rounded-full object-cover object-top" />}
                <span>{r.name}</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500 ml-2">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex gap-1.5 mb-3 overflow-x-auto no-scrollbar">
          {([
            ['DRAGON', '🐉 Ajdarho (10)'],
            ['LUXURY', 'Luxury'],
            ['LUCKY', 'Lucky'],
            ['BASIC', 'Oddiy'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setCategory(key);
                const list =
                  key === 'DRAGON'
                    ? gifts.filter((g) => Boolean(DRAGON_BY_GIFT_ID[g.id]))
                    : gifts.filter((g) => g.category === key && !DRAGON_BY_GIFT_ID[g.id]);
                if (list[0]) setSelectedGiftId(list[0].id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                category === key ? 'bg-[#ff3366] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Selected Dragon Quick Power Strip */}
        {activeDragon && (
          <div className="mb-2.5 px-3 py-2 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center gap-2.5">
            <img src={activeDragon.image} alt={activeDragon.name} className="w-10 h-10 rounded-xl object-cover shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-slate-900">{activeDragon.name}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-black">
                  {activeDragon.elementUz}
                </span>
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                {activeDragon.titleUz} • {activeDragon.powerUz}
              </p>
            </div>
          </div>
        )}

        {/* Gift Grid */}
        <div className={`grid ${category === 'DRAGON' ? 'grid-cols-3' : 'grid-cols-4'} gap-2 max-h-56 overflow-y-auto no-scrollbar mb-3.5`}>
          {filtered.map((g) => {
            const selected = activeGift?.id === g.id;
            const img = getGiftImage(g.id);
            const drg = DRAGON_BY_GIFT_ID[g.id];
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGiftId(g.id)}
                className={`flex flex-col items-center p-2 rounded-2xl border transition ${
                  selected
                    ? 'bg-rose-50 border-[#ff3366] ring-1 ring-[#ff3366]/30'
                    : 'bg-slate-50 border-transparent hover:bg-slate-100'
                }`}
              >
                {img ? (
                  <img
                    src={img}
                    alt={g.name_uz}
                    className={`${drg ? 'w-14 h-14 rounded-xl' : 'w-11 h-11 rounded-xl'} object-cover mb-1`}
                  />
                ) : (
                  <span className="text-2xl my-1">{g.icon}</span>
                )}
                <span className="text-[10px] font-extrabold text-slate-900 truncate w-full text-center">
                  {drg ? drg.name : g.name_uz}
                </span>
                {drg && (
                  <span className="text-[9px] font-semibold text-slate-500 truncate w-full text-center">
                    {drg.elementUz}
                  </span>
                )}
                <span className="text-[10px] font-extrabold text-amber-600 mt-0.5">
                  🪙 {g.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Action Row */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <button
            onClick={onOpenTopup}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
          </button>

          <div className="flex items-center gap-1">
            {COMBOS.map((c) => (
              <button
                key={c}
                onClick={() => setQty(c)}
                className={`px-2 py-1 rounded-full text-[11px] font-extrabold transition ${
                  qty === c ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                }`}
              >
                ×{c}
              </button>
            ))}
          </div>

          <button
            disabled={!activeGift || !target}
            onClick={() => {
              if (!activeGift || !target) return;
              onSend({
                giftId: activeGift.id,
                quantity: qty,
                receiverId: target.id,
                pkSide: target.pkSide,
              });
              onClose();
            }}
            className="px-4 py-2 rounded-full btn-brand text-xs font-extrabold disabled:opacity-40"
          >
            Yuborish {totalCost > 0 ? `(${totalCost.toLocaleString()})` : ''}
          </button>
        </div>
      </div>
    </div>
  );
};
