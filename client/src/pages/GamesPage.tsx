import React, { useState } from 'react';
import { Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LudoGame } from '../components/LudoGame';
import { LuckyWheelGame } from '../components/LuckyWheelGame';
import { DrawGuessGame } from '../components/DrawGuessGame';

export const GamesPage: React.FC = () => {
  const { user } = useAuth();
  const [activeGame, setActiveGame] = useState<'ludo' | 'wheel' | 'draw'>('ludo');

  return (
    <div className="bg-transparent min-h-full px-3.5 pt-3 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900">O‘yinlar</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 backdrop-blur-md border-2 border-amber-300/70 text-amber-900 text-xs font-black">
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          <span>{(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1.5 bg-white/55 backdrop-blur-xl border-2 border-white/90 p-1.5 rounded-3xl shadow-xs">
        {[
          ['ludo', '🎲 Ludo'],
          ['wheel', '🎡 Wheel'],
          ['draw', '🎨 Chiz'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveGame(id as any)}
            className={`py-2 rounded-2xl text-xs font-black transition cursor-pointer ${
              activeGame === id ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeGame === 'ludo' ? (
        <LudoGame />
      ) : activeGame === 'wheel' ? (
        <LuckyWheelGame />
      ) : (
        <DrawGuessGame />
      )}
    </div>
  );
};
