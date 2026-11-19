import React, { useEffect, useState } from 'react';
import { X, Coins, ChevronRight, Sparkles } from 'lucide-react';
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
        const list = res.gifts || [];
        setGifts(list);
        const drg = list.find((g) => Boolean(DRAGON_BY_GIFT_ID[g.id]));
        const first = drg || list[0];
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
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 backdrop-blur-[2px]" onClick={onClose}>
      <div
        className="w-full max-w-[430px] bg-white rounded-t-3xl pt-3 pb-4 shadow-2xl border-t border-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Handle */}
        <div className="w-10 h-1 rounded-full bg-slate-200 mx-auto mb-2.5" />

        {/* Ziigo Row 1: Recipient Selector Bar */}
        <div className="px-3.5 pb-2.5 flex items-center justify-between gap-2 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-extrabold text-slate-400 shrink-0 mr-0.5">Kimga:</span>
            {recipients.map((r, idx) => (
              <button
                key={r.id + (r.pkSide || '')}
                onClick={() => setRecipientIdx(idx)}
                className={`flex items-center gap-1.5 pl-1 pr-2.5 py-1 rounded-full text-[11px] font-extrabold shrink-0 border transition ${
                  idx === recipientIdx
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-100 border-transparent text-slate-700'
                }`}
              >
                {r.avatar && (
                  <img src={r.avatar} alt="" loading="eager" className="w-5 h-5 rounded-full object-cover object-top" />
                )}
                <span>{r.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-500 shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Ziigo Row 2: Clean Category Underline Tabs */}
        <div className="px-3.5 pt-2.5 flex items-center gap-4 border-b border-slate-100 overflow-x-auto no-scrollbar">
          {([
            ['DRAGON', '🐉 Ajdarho'],
            ['LUXURY', '👑 Luxury'],
            ['LUCKY', '🍀 Omad'],
            ['BASIC', '🌹 Oddiy'],
          ] as const).map(([key, label]) => {
            const active = category === key;
            return (
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
                className={`pb-2 text-xs font-extrabold whitespace-nowrap border-b-2 transition ${
                  active ? 'text-[#ff3366] border-[#ff3366]' : 'text-slate-400 border-transparent hover:text-slate-700'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {/* Selected Dragon Info Strip */}
        {activeDragon && (
          <div className="mx-3.5 mt-2.5 px-2.5 py-2 rounded-2xl bg-slate-950 text-white flex items-center gap-2.5 shadow-xs">
            <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-amber-400/40">
              <img src={activeDragon.image} alt={activeDragon.name} loading="eager" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black">{activeDragon.name}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-[9px] font-black">
                  {activeDragon.elementUz}
                </span>
                <span className="text-[9px] text-slate-400 font-bold">• {activeDragon.sizeUz}</span>
              </div>
              <p className="text-[10px] text-slate-300 truncate mt-0.5">
                {activeDragon.titleUz} — {activeDragon.powerUz}
              </p>
            </div>
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
          </div>
        )}

        {/* Ziigo 4-Column Crisp Gift Grid */}
        <div className="px-3.5 py-3 grid grid-cols-4 gap-2 max-h-60 overflow-y-auto no-scrollbar">
          {filtered.map((g) => {
            const selected = activeGift?.id === g.id;
            const img = getGiftImage(g.id);
            const drg = DRAGON_BY_GIFT_ID[g.id];
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGiftId(g.id)}
                className={`flex flex-col items-center p-1.5 rounded-2xl border transition ${
                  selected
                    ? 'bg-rose-50/90 border-[#ff3366] ring-1 ring-[#ff3366]/35 shadow-xs'
                    : 'bg-slate-50/90 border-slate-100 hover:bg-slate-100'
                }`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 flex items-center justify-center mb-1 shrink-0 shadow-xs">
                  {img ? (
                    <img
                      src={img}
                      alt={g.name_uz}
                      loading="eager"
                      decoding="sync"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-2xl">{g.icon}</span>
                  )}
                </div>
                <span className="text-[10px] font-extrabold text-slate-900 truncate w-full text-center leading-tight">
                  {drg ? drg.name : g.name_uz}
                </span>
                <span className="text-[10px] font-black text-amber-600 mt-0.5 leading-none">
                  🪙 {g.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Ziigo Bottom Balance + Combo + Send Bar */}
        <div className="px-3.5 pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2">
          <button
            onClick={onOpenTopup}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200/90 text-amber-800 text-xs font-black shrink-0"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
            <ChevronRight className="w-3 h-3 text-amber-500" />
          </button>

          <div className="flex items-center gap-1">
            {COMBOS.map((c) => (
              <button
                key={c}
                onClick={() => setQty(c)}
                className={`px-2 py-1 rounded-full text-[10px] font-black transition ${
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
            className="px-4 py-2 rounded-full btn-brand text-xs font-black shrink-0 disabled:opacity-40"
          >
            Yuborish
          </button>
        </div>
      </div>
    </div>
  );
};
