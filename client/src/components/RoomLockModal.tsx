import React, { useEffect, useState } from 'react';
import { KeyRound, Lock, Unlock, Users, X } from 'lucide-react';
import { RoomAccessSettings } from '../lib/roomSettings';

interface RoomLockModalProps {
  open: boolean;
  onClose: () => void;
  settings: RoomAccessSettings;
  onSave: (next: RoomAccessSettings) => void;
}

export const RoomLockModal: React.FC<RoomLockModalProps> = ({ open, onClose, settings, onSave }) => {
  const [isLocked, setIsLocked] = useState(settings.isLocked);
  const [password, setPassword] = useState(settings.password);
  const [maxCapacity, setMaxCapacity] = useState(settings.maxCapacity);

  useEffect(() => {
    if (open) {
      setIsLocked(settings.isLocked);
      setPassword(settings.password);
      setMaxCapacity(settings.maxCapacity);
    }
  }, [open, settings.isLocked, settings.password, settings.maxCapacity]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-sm p-3"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm bg-white/90 backdrop-blur-2xl border-2 border-white rounded-3xl p-4 space-y-3.5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Xona qulfi, parol va sig‘im</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-2xl p-3">
          <div className="flex items-center gap-2">
            {isLocked ? <Lock className="w-4 h-4 text-amber-600" /> : <Unlock className="w-4 h-4 text-emerald-600" />}
            <div>
              <div className="text-xs font-black text-slate-900">{isLocked ? 'Xona qulflangan' : 'Xona ochiq'}</div>
              <div className="text-[10px] font-semibold text-slate-500">
                {isLocked ? 'Kirish uchun parol talab qilinadi' : 'Hamma kira oladi'}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsLocked((v) => !v)}
            className={`px-3 py-1.5 rounded-full text-[11px] font-black cursor-pointer ${
              isLocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {isLocked ? 'Yoqilgan' : 'Qulflash'}
          </button>
        </div>

        {isLocked && (
          <div className="flex items-center gap-2 bg-slate-50 border border-amber-200 rounded-2xl px-3 py-2">
            <KeyRound className="w-4 h-4 text-amber-500 shrink-0" />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={24}
              placeholder="Parolni kiriting (masalan: 1234)"
              className="flex-1 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
            />
          </div>
        )}

        <div className="flex items-center justify-between gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-3 py-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#ff3366]" />
            <span>Maksimal odam soni:</span>
          </span>
          <input
            type="number"
            min={2}
            max={100}
            value={maxCapacity}
            onChange={(e) => setMaxCapacity(Math.max(2, Math.min(100, Number(e.target.value) || 2)))}
            className="w-16 text-center bg-white border border-slate-200 rounded-xl py-1 text-xs font-black text-slate-900 focus:outline-none"
          />
        </div>

        <button
          type="button"
          onClick={() => {
            onSave({
              isLocked,
              password: isLocked ? password.trim() : '',
              maxCapacity,
            });
            onClose();
          }}
          className="w-full py-2.5 rounded-full btn-brand text-xs font-black cursor-pointer"
        >
          Saqlash
        </button>
      </div>
    </div>
  );
};
