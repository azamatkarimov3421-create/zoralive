import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Gamepad2, Plus, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC<{ onGoLive?: () => void }> = ({ onGoLive }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, user } = useAuth();
  const isDarkDragonProfile =
    location.pathname === '/profile' &&
    Boolean(user?.activeRide?.includes('dragon') || (user?.vipLevel && user.vipLevel >= 1));

  const items = [
    { path: '/', label: t('navLive'), icon: Compass },
    { path: '/games', label: t('navGames'), icon: Gamepad2 },
    { path: '__LIVE__', label: t('goLive'), icon: Plus, center: true },
    { path: '/shop', label: t('navShop'), icon: ShoppingBag },
    { path: '/profile', label: t('navProfile'), icon: User },
  ];

  return (
    <nav
      className={`sticky bottom-0 z-30 backdrop-blur-xl border-t px-2 py-1.5 flex items-center justify-around transition-colors duration-300 ${
        isDarkDragonProfile
          ? 'bg-[#09090f]/90 border-white/15'
          : 'bg-white/95 border-slate-200/80'
      }`}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        if (item.center) {
          return (
            <button
              key="go-live"
              onClick={onGoLive}
              aria-label={item.label}
              className="flex flex-col items-center -mt-4 group"
            >
              <span
                className={`w-12 h-12 rounded-full btn-brand flex items-center justify-center ring-4 shadow-lg active:scale-95 transition ${
                  isDarkDragonProfile ? 'ring-[#09090f]' : 'ring-white'
                }`}
              >
                <Plus className="w-6 h-6 text-white stroke-[2.6]" />
              </span>
              <span
                className={`text-[10px] font-black mt-0.5 ${
                  isDarkDragonProfile ? 'text-white/80' : 'text-slate-600'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        }

        return (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition ${
              active
                ? isDarkDragonProfile
                  ? 'text-amber-400'
                  : 'text-[#ff3366]'
                : isDarkDragonProfile
                ? 'text-white/55 hover:text-white/90'
                : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <Icon className={`w-5 h-5 ${active ? 'stroke-[2.4]' : 'stroke-[2]'}`} />
            <span className="text-[10px] font-extrabold">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
