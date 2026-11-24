import React, { useState } from 'react';
import { Sparkles, X } from 'lucide-react';

export interface BgThemeOption {
  id: 'light' | 'ocean' | 'galaxy' | 'gold' | 'neon';
  label: string;
  image?: string;
  direction?: 'top' | 'right' | 'bottom' | 'left';
}

export const BG_THEMES: BgThemeOption[] = [
  { id: 'ocean', label: 'Okean', image: '/assets/stage-ocean.jpg', direction: 'top' },
  { id: 'galaxy', label: 'Galaxy', image: '/assets/stage-galaxy.jpg', direction: 'right' },
  { id: 'gold', label: 'Saroy', image: '/assets/stage-palace.jpg', direction: 'bottom' },
  { id: 'neon', label: 'Neon', image: '/assets/stage-neon.jpg', direction: 'left' },
];

interface ThemeOrbDialProps {
  activeTheme: string;
  onSelect: (id: BgThemeOption['id']) => void;
}

export const ThemeOrbDial: React.FC<ThemeOrbDialProps> = ({ activeTheme, onSelect }) => {
  const [open, setOpen] = useState(false);
  const current = BG_THEMES.find((t) => t.id === activeTheme);

  const pick = (id: BgThemeOption['id']) => {
    onSelect(id);
    setOpen(false);
  };

  const posClass: Record<NonNullable<BgThemeOption['direction']>, string> = {
    top: '-translate-y-[74px] translate-x-0',
    right: 'translate-x-[74px] translate-y-0',
    bottom: 'translate-y-[74px] translate-x-0',
    left: '-translate-x-[74px] translate-y-0',
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          title="VIP Xona foni"
          className="fixed right-3.5 bottom-20 z-30 w-11 h-11 rounded-full border-2 border-amber-300 shadow-[0_8px_24px_rgba(15,23,42,0.3)] overflow-hidden flex items-center justify-center bg-white/75 backdrop-blur-xl active:scale-90 transition cursor-pointer"
        >
          {current?.image ? (
            <img src={current.image} alt={current.label} className="w-full h-full object-cover" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-500" />
          )}
          <span className="absolute inset-0 ring-2 ring-inset ring-white/70 rounded-full pointer-events-none" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[3px] flex items-center justify-center"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative w-52 h-52 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {BG_THEMES.map((th) => {
              const isSelected = activeTheme === th.id;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => pick(th.id)}
                  className={`absolute ${posClass[th.direction!]} w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 shadow-xl flex flex-col items-center justify-end cursor-pointer hover:scale-110 active:scale-95 ${
                    isSelected
                      ? 'border-amber-300 ring-4 ring-amber-400/50 scale-105'
                      : 'border-white/90'
                  }`}
                >
                  {th.image && <img src={th.image} alt={th.label} className="absolute inset-0 w-full h-full object-cover" />}
                  <span className="relative z-10 w-full bg-black/55 backdrop-blur-xs text-[9.5px] font-black text-white py-0.5 text-center">
                    {th.label}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              onClick={() => {
                if (activeTheme !== 'light') pick('light');
                else setOpen(false);
              }}
              className="relative z-20 w-14 h-14 rounded-full bg-white/88 backdrop-blur-2xl border-2 border-white shadow-2xl flex flex-col items-center justify-center text-slate-800 active:scale-90 transition cursor-pointer"
              title={activeTheme !== 'light' ? 'Standart fon' : 'Yopish'}
            >
              {activeTheme !== 'light' ? (
                <>
                  <Sparkles className="w-4 h-4 text-[#ff3366]" />
                  <span className="text-[8.5px] font-black mt-0.5">Oq fon</span>
                </>
              ) : (
                <X className="w-5 h-5 text-slate-700" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
