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
    <div className="bg-white min-h-full px-3.5 pt-3 pb-8 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900">O‘yinlar</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-extrabold">
          <Coins className="w-3.5 h-3.5 text-amber-500" />
          <span>{(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-full">
        {[
          ['ludo', '🎲 Ludo'],
          ['wheel', '🎡 Wheel'],
          ['draw', '🎨 Chiz'],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setActiveGame(id as any)}
            className={`py-2 rounded-full text-xs font-extrabold transition ${
              activeGame === id ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
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
