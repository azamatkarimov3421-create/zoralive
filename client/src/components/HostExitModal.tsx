import React, { useState } from 'react';
import { Clock, Power, ShieldCheck, X } from 'lucide-react';
import { Avatar } from './Avatar';

export interface HostCandidate {
  id: string;
  displayName: string;
  avatar?: string;
}

interface HostExitModalProps {
  open: boolean;
  onClose: () => void;
  candidates: HostCandidate[];
  onCloseNow: () => void;
  onScheduleClose: (minutes: number) => void;
  onTransferHost: (candidate: HostCandidate) => void;
}

const PRESET_MINUTES = [1, 5, 15, 30, 60];

export const HostExitModal: React.FC<HostExitModalProps> = ({
  open,
  onClose,
  candidates,
  onCloseNow,
  onScheduleClose,
  onTransferHost,
}) => {
  const [minutes, setMinutes] = useState(15);
  const [customMin, setCustomMin] = useState('');

  if (!open) return null;

  const activeMinutes = customMin.trim() ? Math.max(1, Number(customMin) || 1) : minutes;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white/88 backdrop-blur-2xl border-2 border-white rounded-3xl p-4 space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black text-slate-900">Xonani boshqarish va chiqish</h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Hozir yopishingiz, taymer qo‘yishingiz yoki adminga topshirishingiz mumkin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Close immediately */}
        <button
          type="button"
          onClick={onCloseNow}
          className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 text-white text-xs font-black flex items-center justify-center gap-2 shadow-md active:scale-95 transition cursor-pointer"
        >
          <Power className="w-4 h-4" />
          <span>Xonani hozir yopib chiqish</span>
        </button>

        {/* 2. Countdown timer */}
        <div className="bg-white/70 border border-white rounded-2xl p-3 space-y-2.5">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <Clock className="w-4 h-4 text-amber-500" />
            <span>Taymer bilan avtomatik yopish</span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {PRESET_MINUTES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => {
                  setMinutes(m);
                  setCustomMin('');
                }}
                className={`py-1.5 rounded-xl text-[11px] font-black transition cursor-pointer ${
                  !customMin && minutes === m
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {m} daq
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={1440}
              value={customMin}
              onChange={(e) => setCustomMin(e.target.value)}
              placeholder="Boshqa vaqt (daqiqa)..."
              className="flex-1 bg-slate-100/90 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => onScheduleClose(activeMinutes)}
              className="px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shrink-0 cursor-pointer"
            >
              {activeMinutes} daq qo‘yish
            </button>
          </div>
        </div>

        {/* 3. Transfer to Admin / User */}
        <div className="bg-white/70 border border-white rounded-2xl p-3 space-y-2">
          <div className="flex items-center gap-1.5 text-xs font-black text-slate-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Admin yoki ishtirokchiga topshirib chiqish</span>
          </div>

          {candidates.length === 0 ? (
            <p className="text-[11px] font-semibold text-slate-500">
              Hozir xonada boshqa ishtirokchi yo‘q. Xonani yopish yoki taymer qo‘yishingiz mumkin.
            </p>
          ) : (
            <div className="max-h-32 overflow-y-auto space-y-1.5 no-scrollbar">
              {candidates.map((c) => (
                <div
                  key={c.id}
                  className="flex items-center justify-between gap-2 bg-white/80 border border-slate-100 rounded-xl px-2.5 py-1.5"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={c.avatar} name={c.displayName} size="xs" />
                    <span className="text-xs font-bold text-slate-900 truncate">{c.displayName}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onTransferHost(c)}
                    className="px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-black shrink-0 cursor-pointer"
                  >
                    Topshirish
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
