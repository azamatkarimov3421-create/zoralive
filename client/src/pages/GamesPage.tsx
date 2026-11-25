import React from 'react';
import { Coins } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { TeamQuizGame } from '../components/TeamQuizGame';

export const GamesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="bg-transparent min-h-full px-3.5 pt-3 pb-24 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-black text-slate-900">Jamoaviy O‘yinlar</h1>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-400/20 backdrop-blur-md border-2 border-amber-300/70 text-amber-900 text-xs font-black">
          <Coins className="w-3.5 h-3.5 text-amber-600" />
          <span>{(user?.coins || 0).toLocaleString()}</span>
        </div>
      </div>

      <TeamQuizGame />
    </div>
  );
};
