import React, { useEffect, useState } from 'react';
import { X, Mic, Video, Gamepad2 } from 'lucide-react';
import { api } from '../lib/api';
import { createRoomInSupabase } from '../lib/supabaseSync';
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

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ open, onClose, onCreated }) => {
  const { user, toast } = useAuth();
  const [title, setTitle] = useState(`${user?.displayName || 'Mening'} xonasi`);
  const [type, setType] = useState<'VOICE' | 'VIDEO' | 'GAME'>('VOICE');
  const [theme, setTheme] = useState('light');
  const [seatCount, setSeatCount] = useState(8);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open && user?.displayName) {
      setTitle(`${user.displayName} xonasi`);
    }
  }, [open, user?.displayName]);

  if (!open) return null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await api<{ room: { id: string; type: string; title?: string } }>('/rooms', {
        method: 'POST',
        body: JSON.stringify({ title, type, theme, seatCount }),
      });
      if (user && res.room?.id) {
        await createRoomInSupabase(user, title || `${user.displayName} xonasi`, type, res.room.id);
      }
      toast('Xona ochildi', 'success');
      onCreated(res.room);
      onClose();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/45 backdrop-blur-xs" onClick={onClose}>
      <form
        onSubmit={submit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border border-slate-100"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-extrabold text-slate-900">Yangi xona</h3>
          <button type="button" onClick={onClose} className="p-1.5 rounded-full bg-slate-100 text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { id: 'VOICE', label: 'Ovozli', icon: Mic },
            { id: 'VIDEO', label: 'Video', icon: Video },
            { id: 'GAME', label: 'O‘yin', icon: Gamepad2 },
          ].map((item) => {
            const Icon = item.icon;
            const active = type === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setType(item.id as any)}
                className={`py-3 rounded-2xl border flex flex-col items-center gap-1 transition ${
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
          className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 focus:outline-none focus:border-[#ff3366] mb-3.5"
        />

        {type !== 'VIDEO' && (
          <div className="grid grid-cols-3 gap-2 mb-3.5">
            {[6, 8, 12].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setSeatCount(n)}
                className={`py-2 rounded-xl text-xs font-bold border ${
                  seatCount === n
                    ? 'bg-slate-900 border-slate-900 text-white'
                    : 'bg-slate-50 border-slate-200 text-slate-600'
                }`}
              >
                {n} o‘rin
              </button>
            ))}
          </div>
        )}

        <div className="grid grid-cols-4 gap-2 mb-5">
          {THEMES.map((th) => (
            <button
              key={th.id}
              type="button"
              onClick={() => setTheme(th.id)}
              className={`relative h-12 rounded-xl overflow-hidden text-[11px] font-bold border-2 transition ${
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
          className="w-full py-3 rounded-full btn-brand font-extrabold text-sm active:scale-98 transition disabled:opacity-60"
        >
          {busy ? '...' : 'Boshlash'}
        </button>
      </form>
    </div>
  );
};
