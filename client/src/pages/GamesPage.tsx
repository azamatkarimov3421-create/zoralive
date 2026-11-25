import React from 'react';
import { Gamepad2, Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Arena2DGame } from '../components/Arena2DGame';

export const GamesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen app-shell pb-24">
      <header className="sticky top-0 z-30 glass-header px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center shadow-md">
              <Gamepad2 className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">2D O‘yinlar</h1>
              <p className="text-[10.5px] font-bold text-slate-500">Jamoaviy 2D jonli arena</p>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/80 text-amber-800 text-xs font-black shadow-2xs">
            <Coins className="w-3.5 h-3.5 text-amber-500" />
            <span>{(user?.coins || 0).toLocaleString()}</span>
          </div>
        </div>
      </header>

      <main className="px-3.5 pt-3.5 max-w-lg mx-auto">
        <Arena2DGame />
      </main>
    </div>
  );
};
