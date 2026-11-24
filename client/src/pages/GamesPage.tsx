import React from 'react';
import { Coins, Gamepad2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const GamesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-transparent min-h-full px-3.5 pt-3 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900">O‘yinlar</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 backdrop-blur-md border-2 border-amber-300/70 text-amber-900 text-xs font-black">
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          <span>{(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="bg-white/60 backdrop-blur-xl border-2 border-white/90 rounded-3xl p-8 text-center space-y-3 shadow-sm">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-900/10 flex items-center justify-center text-slate-700">
          <Gamepad2 className="w-7 h-7" />
        </div>
        <h2 className="text-base font-black text-slate-900">Yangi o‘yinlar tayyorlanmoqda</h2>
        <p className="text-xs font-semibold text-slate-600 max-w-[260px] mx-auto">
          Eski o‘yinlar olib tashlandi. Yangi o‘yinlar to‘plami tez kunda qo‘shiladi.
        </p>
      </div>
    </div>
  );
};
