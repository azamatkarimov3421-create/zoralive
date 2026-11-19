import React, { useEffect, useState } from 'react';
import { X, Coins } from 'lucide-react';
import { api } from '../lib/api';
import { GiftItem } from '../types';
import { useAuth } from '../context/AuthContext';
import { getGiftImage } from './LuxuryBadges';

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
  const [category, setCategory] = useState<'BASIC' | 'LUCKY' | 'LUXURY'>('LUXURY');
  const [selectedGiftId, setSelectedGiftId] = useState<string>('');
  const [qty, setQty] = useState<number>(1);
  const [recipientIdx, setRecipientIdx] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    api<{ gifts: GiftItem[] }>('/store/gifts')
      .then((res) => {
        setGifts(res.gifts);
        const lux = res.gifts.find((g) => g.category === 'LUXURY') || res.gifts[0];
        if (!selectedGiftId && lux) setSelectedGiftId(lux.id);
      })
      .catch(() => {});
  }, [open]);

  if (!open) return null;

  const filtered = gifts.filter((g) => g.category === category);
  const activeGift = gifts.find((g) => g.id === selectedGiftId) || filtered[0];
  const target = recipients[recipientIdx] || recipients[0];
  const totalCost = activeGift ? activeGift.price * qty : 0;

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
        <div className="flex gap-2 mb-3">
          {([
            ['LUXURY', 'Luxury'],
            ['LUCKY', 'Lucky'],
            ['BASIC', 'Oddiy'],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setCategory(key);
                const first = gifts.find((g) => g.category === key);
                if (first) setSelectedGiftId(first.id);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition ${
                category === key ? 'bg-[#ff3366] text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Gift Grid */}
        <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto no-scrollbar mb-3.5">
          {filtered.map((g) => {
            const selected = activeGift?.id === g.id;
            const img = getGiftImage(g.id);
            return (
              <button
                key={g.id}
                onClick={() => setSelectedGiftId(g.id)}
                className={`flex flex-col items-center p-2 rounded-2xl border transition ${
                  selected
                    ? 'bg-rose-50/70 border-[#ff3366]'
                    : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                }`}
              >
                {img ? (
                  <div className="w-12 h-12 mb-1 rounded-xl bg-slate-950 overflow-hidden flex items-center justify-center">
                    <img src={img} alt={g.name_uz} className="w-12 h-12 object-cover" />
                  </div>
                ) : (
                  <div className="w-11 h-11 mb-1 rounded-xl bg-white flex items-center justify-center text-2xl shadow-xs">
                    {g.icon}
                  </div>
                )}
                <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center">
                  {g.name_uz}
                </span>
                <span className="text-[10px] font-extrabold text-amber-600 mt-0.5">
                  🪙 {g.price.toLocaleString()}
                </span>
              </button>
            );
          })}
        </div>

        {/* Bottom Dock */}
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-slate-100">
          <button
            onClick={onOpenTopup}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold"
          >
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
            <span className="text-amber-600 font-black">+</span>
          </button>

          <div className="flex items-center gap-1">
            {COMBOS.map((c) => (
              <button
                key={c}
                onClick={() => setQty(c)}
                className={`px-2 py-1 rounded-full text-[11px] font-extrabold ${
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
              if (activeGift.category === 'LUXURY' || activeGift.effect_type === 'fullscreen') {
                onClose();
              }
            }}
            className="px-4 py-2 rounded-full btn-brand font-extrabold text-xs active:scale-95 transition disabled:opacity-50"
          >
            Yubor ({totalCost.toLocaleString()})
          </button>
        </div>
      </div>
    </div>
  );
};
