import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Compass, Gamepad2, Plus, ShoppingBag, User } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const BottomNav: React.FC<{ onGoLive?: () => void }> = ({ onGoLive }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, user } = useAuth();
  const [tappedKey, setTappedKey] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const isDarkDragonProfile =
    location.pathname === '/profile' &&
    Boolean(user?.activeRide && user.activeRide.includes('dragon') && user.activeRide !== 'none');

  const triggerWaterTap = (key: string) => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setTappedKey(null);
    requestAnimationFrame(() => {
      setTappedKey(key);
      timerRef.current = window.setTimeout(() => setTappedKey(null), 540);
    });
  };

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
          const isTapped = tappedKey === item.path;

          if (item.center) {
            return (
              <button
                key="go-live"
                onClick={() => {
                  triggerWaterTap('__LIVE__');
                  onGoLive?.();
                }}
                aria-label={item.label}
                className={`relative flex flex-col items-center -mt-5 group cursor-pointer ${
                  isTapped ? 'animate-water-jelly' : ''
                }`}
              >
                <span
                  className={`relative overflow-hidden w-12 h-12 rounded-full btn-brand flex items-center justify-center ring-4 shadow-xl transition-transform duration-200 ${
                    isDarkDragonProfile ? 'ring-black/60' : 'ring-white/85'
                  }`}
                >
                  {isTapped && (
                    <span className="absolute inset-0 rounded-full bg-white/55 animate-water-ripple pointer-events-none" />
                  )}
                  <Plus className="w-6 h-6 text-white stroke-[3] relative z-10" />
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
              onClick={() => {
                triggerWaterTap(item.path);
                navigate(item.path);
              }}
              className={`relative overflow-hidden flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-2xl transition-all duration-300 cursor-pointer ${
                isTapped ? 'animate-water-jelly' : ''
              } ${
                active
                  ? isDarkDragonProfile
                    ? 'bg-amber-400/22 text-amber-300 border border-amber-300/40 -translate-y-0.5 scale-[1.05] shadow-[0_6px_16px_rgba(251,191,36,0.22)]'
                    : 'bg-gradient-to-b from-[#ff3366]/16 to-sky-400/12 text-[#ff2d68] border border-white/90 -translate-y-0.5 scale-[1.05] shadow-[0_6px_16px_rgba(56,189,248,0.22)]'
                  : isDarkDragonProfile
                  ? 'text-white/65 hover:text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {isTapped && (
                <span
                  className={`absolute inset-0 rounded-2xl animate-water-ripple pointer-events-none ${
                    isDarkDragonProfile
                      ? 'bg-amber-300/35 ring-2 ring-amber-200/60'
                      : 'bg-sky-300/45 ring-2 ring-white/85'
                  }`}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-transform duration-300 ${
                  active ? 'stroke-[2.7] scale-110' : 'stroke-[2.2]'
                }`}
              />
              <span className="text-[10.5px] font-black tracking-tight relative z-10">{item.label}</span>
              {active && (
                <span
                  className={`w-1.5 h-1.5 rounded-full relative z-10 ${
                    isDarkDragonProfile ? 'bg-amber-300 shadow-[0_0_8px_#fcd34d]' : 'bg-[#ff2d68] shadow-[0_0_8px_#ff2d68]'
                  }`}
                />
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
};
