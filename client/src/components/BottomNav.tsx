import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Gamepad2, Plus, Trophy, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC<{ onGoLive: () => void }> = ({ onGoLive }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useAuth();

  const items = [
    { path: '/', label: t('navLive'), icon: Compass },
    { path: '/games', label: t('navGames'), icon: Gamepad2 },
    { path: '__LIVE__', label: '', icon: Plus },
    { path: '/social', label: t('navSocial'), icon: Trophy },
    { path: '/profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-2 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        if (item.path === '__LIVE__') {
          return (
            <button
              key="go-live"
              onClick={onGoLive}
              aria-label={t('goLive')}
              className="-mt-5 w-12 h-12 rounded-full btn-brand flex items-center justify-center ring-4 ring-white active:scale-95 transition"
            >
              <Plus className="w-6 h-6 text-white stroke-[2.6]" />
            </button>
          );
        }

        const active = location.pathname === item.path;
        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
              active ? 'text-[#ff3366]' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[2]'}`} />
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
