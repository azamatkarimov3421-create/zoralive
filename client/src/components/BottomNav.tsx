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
    Boolean(user?.activeRide && user.activeRide.includes('dragon') && user.activeRide !== 'none');

  const items = [
    { path: '/', label: t('navLive'), icon: Compass },
    { path: '/games', label: t('navGames'), icon: Gamepad2 },
    { path: '__LIVE__', label: t('goLive'), icon: Plus, center: true },
    { path: '/shop', label: t('navShop'), icon: ShoppingBag },
    { path: '/profile', label: t('navProfile'), icon: User },
  ];

  return (
    <div className="sticky bottom-2.5 z-30 px-3 pointer-events-none">
      <nav
        className={`pointer-events-auto rounded-3xl backdrop-blur-2xl border-2 px-2 py-1.5 flex items-center justify-around transition-all duration-300 ${
          isDarkDragonProfile
            ? 'bg-black/42 border-white/28 shadow-[0_14px_36px_rgba(0,0,0,0.55),inset_0_1.5px_0_rgba(255,255,255,0.25)]'
            : 'bg-white/46 border-white/85 shadow-[0_14px_36px_rgba(15,23,42,0.14),inset_0_2px_0_rgba(255,255,255,0.95)]'
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
                className="flex flex-col items-center -mt-5 group cursor-pointer"
              >
                <span
                  className={`w-12 h-12 rounded-full btn-brand flex items-center justify-center ring-4 shadow-xl active:scale-95 transition ${
                    isDarkDragonProfile ? 'ring-black/60' : 'ring-white/85'
                  }`}
                >
                  <Plus className="w-6 h-6 text-white stroke-[3]" />
                </span>
                <span
                  className={`text-[10.5px] font-black mt-0.5 ${
                    isDarkDragonProfile ? 'text-white/90' : 'text-slate-800'
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition cursor-pointer ${
                active
                  ? isDarkDragonProfile
                    ? 'bg-amber-400/20 text-amber-300 border border-amber-300/35'
                    : 'bg-[#ff3366]/12 text-[#ff2d68] border border-[#ff3366]/20'
                  : isDarkDragonProfile
                  ? 'text-white/65 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Icon className={`w-5 h-5 ${active ? 'stroke-[2.7]' : 'stroke-[2.2]'}`} />
              <span className="text-[10.5px] font-black tracking-tight">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};
