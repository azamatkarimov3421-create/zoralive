import React from 'react';
import { Gamepad2 } from 'lucide-react';

export const GamesPage: React.FC = () => {
  return (
    <div className="min-h-screen app-shell pb-24">
      <header className="sticky top-0 z-30 glass-header px-4 pt-3.5 pb-3">
        <div className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-slate-900/10 text-slate-700 flex items-center justify-center">
            <Gamepad2 className="w-4 h-4" />
          </span>
          <div>
            <h1 className="text-base font-black text-slate-900 leading-tight">O‘yinlar</h1>
            <p className="text-[10.5px] font-bold text-slate-500">Bo‘lim tozalandi</p>
          </div>
        </div>
      </header>

      <main className="px-4 pt-12 max-w-md mx-auto">
        <div className="card-white rounded-3xl p-8 text-center space-y-2">
          <div className="w-14 h-14 mx-auto rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
            <Gamepad2 className="w-7 h-7" />
          </div>
          <h2 className="text-sm font-black text-slate-900">O‘yin maydoni bo‘sh</h2>
          <p className="text-xs font-semibold text-slate-500">
            Hozircha hech qanday o‘yin qo‘shilmagan.
          </p>
        </div>
      </main>
    </div>
  );
};
