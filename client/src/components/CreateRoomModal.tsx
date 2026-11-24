import React, { useEffect, useState } from 'react';
import { X, Mic, Video, Lock, Unlock, Users, KeyRound } from 'lucide-react';
import { api } from '../lib/api';
import { createRoomInSupabase } from '../lib/supabaseSync';
import { saveRoomSettings } from '../lib/roomSettings';
import { useAuth } from '../context/AuthContext';

interface CreateRoomModalProps {
  open: boolean;
  onClose: () => void;
  onCreated: (room: { id: string; type: string }) => void;
}

const THEMES = [
  { id: 'light', label: 'Oq minimal', cls: 'bg-gradient-to-br from-slate-50 to-rose-50 text-slate-800 border-slate-200' },
  { id: 'galaxy', label: 'Galaxy', img: '/assets/stage-galaxy.jpg' },
  { id: 'gold', label: 'Saroy', img: '/assets/stage-palace.jpg' },
  { id: 'ocean', label: 'Okean', img: '/assets/stage-ocean.jpg' },
];

const CAPACITY_PRESETS = [2, 4, 6, 8, 12, 20];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ open, onClose, onCreated }) => {
  const { user, toast } = useAuth();
  const [title, setTitle] = useState(`${user?.displayName || 'Mening'} xonasi`);
  const [type, setType] = useState<'VOICE' | 'VIDEO'>('VOICE');
  const [theme, setTheme] = useState('light');
  const [seatCount, setSeatCount] = useState(8);
  const [customCapacity, setCustomCapacity] = useState('');
  const [isLocked, setIsLocked] = useState(false);
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && user?.displayName) {
      setTitle(`${user.displayName} xonasi`);
    }
  }, [open, user?.displayName]);

  if (!open) return null;

  const finalCapacity = customCapacity.trim()
    ? Math.max(2, Math.min(100, Number(customCapacity) || 8))
    : seatCount;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const cleanPass = isLocked ? password.trim() : '';
      const res = await api<{ room: { id: string; type: string; title?: string } }>('/rooms', {
        method: 'POST',
        body: JSON.stringify({
          title,
          type,
          theme,
          seatCount: finalCapacity,
          maxCapacity: finalCapacity,
          isLocked,
          password: cleanPass,
        }),
      });
      if (res.room?.id) {
        saveRoomSettings(res.room.id, {
          maxCapacity: finalCapacity,
          isLocked,
          password: cleanPass,
        });
        if (user) {
          await createRoomInSupabase(user, title || `${user.displayName} xonasi`, type, res.room.id);
        }
      }
      toast(isLocked ? 'Qulflangan xona ochildi 🔒' : 'Xona ochildi', 'success');
      onCreated(res.room);
      onClose();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-xs"
      onClick={onClose}
    >
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white/90 backdrop-blur-2xl rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-2 border-white space-y-3.5"
      >
        <div className="flex items-center justify-between">
          <h3 className="text-base font-extrabold text-slate-900">Yangi xona</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-600 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {[
            { id: 'VOICE', label: 'Ovozli', icon: Mic },
            { id: 'VIDEO', label: 'Video', icon: Video },
          ].map((item) => {
            const Icon = item.icon;
            const active = type === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id as any)}
                className={`py-2.5 rounded-2xl border flex flex-col items-center gap-1 transition cursor-pointer ${
                  active
                    ? 'bg-rose-50 border-[#ff3366] text-[#ff3366]'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-bold">{item.label}</span>
              </button>
            );
          })}
        </div>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          maxLength={64}
          placeholder="Xona nomi"
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#ff3366]"
        />

        {/* Capacity selector (any number 2..100) */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#ff3366]" />
              <span>Necha kishilik xona:</span>
            </span>
            <span className="text-xs font-black text-[#ff3366]">{finalCapacity} kishi</span>
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {CAPACITY_PRESETS.map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => {
                  setSeatCount(n);
                  setCustomCapacity('');
                }}
                className={`py-1.5 rounded-xl text-[11px] font-bold border cursor-pointer ${
                  !customCapacity && seatCount === n
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-white border-slate-200 text-slate-600'
                }`}
              >
                {n}
              </button>
            ))}
          </div>
          <input
            type="number"
            min={2}
            max={100}
            value={customCapacity}
            onChange={(e) => setCustomCapacity(e.target.value)}
            placeholder="Yoki o‘zingiz kiriting (2 – 100 kishi)..."
            className="w-full px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:border-[#ff3366]"
          />
        </div>

        {/* Lock & Password */}
        <div className="bg-slate-50/90 border border-slate-200/80 rounded-2xl p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              {isLocked ? (
                <Lock className="w-4 h-4 text-amber-600" />
              ) : (
                <Unlock className="w-4 h-4 text-emerald-600" />
              )}
              <div>
                <div className="text-xs font-extrabold text-slate-800">
                  {isLocked ? 'Qulflangan xona' : 'Ochiq xona'}
                </div>
                <div className="text-[10px] font-semibold text-slate-500">
                  {isLocked ? 'Faqat parol bilan yoki ruxsat bilan kiriladi' : 'Hamma erkin kira oladi'}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsLocked((v) => !v)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition cursor-pointer ${
                isLocked ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {isLocked ? 'Qulf yoqilgan' : 'Qulflash'}
            </button>
          </div>

          {isLocked && (
            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-xl px-3 py-2">
              <KeyRound className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                maxLength={24}
                placeholder="Parol o‘rnating (ixtiyoriy, masalan: 1234)"
                className="flex-1 bg-transparent text-xs font-bold text-slate-900 focus:outline-none"
              />
            </div>
          )}
        </div>

        <div className="grid grid-cols-4 gap-2">
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={`relative h-11 rounded-xl overflow-hidden text-[11px] font-bold border-2 transition cursor-pointer ${
                theme === th.id ? 'border-[#ff3366]' : 'border-transparent'
              } ${th.cls || 'text-white'}`}
            >
              {th.img && <img src={th.img} alt="" className="absolute inset-0 w-full h-full object-cover" />}
              <div className={`absolute inset-0 flex items-center justify-center ${th.img ? 'bg-black/35' : ''}`}>
                <span>{th.label}</span>
              </div>
            </button>
          ))}
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 rounded-full btn-brand font-extrabold text-sm active:scale-98 transition disabled:opacity-60 cursor-pointer"
        >
          {busy ? '...' : 'Boshlash'}
        </button>
      </form>
    </div>
  );
};
