import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { MessageCircle, Globe, Swords, Store, Gift } from 'lucide-react';

export const BottomNav: React.FC<{ onGoLive?: () => void }> = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const items = [
    { path: '/', label: 'Chat', icon: MessageCircle },
    { path: '/world', label: 'World', icon: Globe },
    { path: '/games', label: 'Jang', icon: Swords, center: true },
    { path: '/market', label: 'Market', icon: Store },
    { path: '/profile', label: 'Sovg‘a', icon: Gift },
  ];

  return (
    <nav className="sticky bottom-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-2 py-1.5 flex items-center justify-around">
      {items.map((item) => {
        const Icon = item.icon;
        const active = location.pathname === item.path;

        if (item.center) {
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              aria-label={item.label}
              className="flex flex-col items-center -mt-4 group"
            >
              <span
                className={`w-12 h-12 rounded-full flex items-center justify-center ring-4 ring-white shadow-lg transition active:scale-95 ${
                  active
                    ? 'bg-gradient-to-tr from-amber-500 via-red-500 to-[#ff3366] text-white'
                    : 'btn-brand text-white'
                }`}
              >
                <Icon className="w-5 h-5 stroke-[2.4]" />
              </span>
              <span className={`text-[10px] font-black mt-0.5 ${active ? 'text-[#ff3366]' : 'text-slate-600'}`}>
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
              active ? 'text-[#ff3366]' : 'text-slate-400 hover:text-slate-700'
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
