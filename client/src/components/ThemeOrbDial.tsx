import React, { useRef, useState } from 'react';
import { Sparkles, X, ChevronUp, ChevronRight, ChevronDown, ChevronLeft } from 'lucide-react';

export interface BgThemeOption {
  id: 'light' | 'ocean' | 'galaxy' | 'gold' | 'neon';
  label: string;
  image?: string;
  direction: 'top' | 'right' | 'bottom' | 'left';
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
  const [hoveredDir, setHoveredDir] = useState<BgThemeOption['direction'] | null>(null);
  const dragOriginRef = useRef<{ x: number; y: number } | null>(null);
  const didDragRef = useRef(false);

  const current = BG_THEMES.find((t) => t.id === activeTheme);

  const pick = (id: BgThemeOption['id']) => {
    onSelect(id);
    setHoveredDir(null);
    setOpen(false);
  };

  const posStyle: Record<BgThemeOption['direction'], string> = {
    top: 'translate(0px, -84px)',
    right: 'translate(84px, 0px)',
    bottom: 'translate(0px, 84px)',
    left: 'translate(-84px, 0px)',
  };

  const detectDirection = (dx: number, dy: number): BgThemeOption['direction'] | null => {
    if (Math.hypot(dx, dy) < 26) return null;
    if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'right' : 'left';
    return dy > 0 ? 'bottom' : 'top';
  };

  const handleOrbPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    dragOriginRef.current = { x: e.clientX, y: e.clientY };
    didDragRef.current = false;
    setOpen(true);
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handleOrbPointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!dragOriginRef.current) return;
    const dx = e.clientX - dragOriginRef.current.x;
    const dy = e.clientY - dragOriginRef.current.y;
    const dir = detectDirection(dx, dy);
    if (dir) didDragRef.current = true;
    setHoveredDir(dir);
  };

  const handleOrbPointerUp = () => {
    if (dragOriginRef.current && hoveredDir) {
      const target = BG_THEMES.find((t) => t.direction === hoveredDir);
      if (target) pick(target.id);
    }
    dragOriginRef.current = null;
    setHoveredDir(null);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onPointerDown={handleOrbPointerDown}
          onPointerMove={handleOrbPointerMove}
          onPointerUp={handleOrbPointerUp}
          title="Fonni tanlash (bosib suring yoki bosing)"
          className="absolute right-3 bottom-16 z-30 w-12 h-12 rounded-full bg-slate-950/78 backdrop-blur-2xl border-2 border-white/35 shadow-[0_10px_28px_rgba(0,0,0,0.45),inset_0_1px_0_rgba(255,255,255,0.3)] overflow-hidden flex items-center justify-center active:scale-90 transition-transform duration-200 cursor-pointer touch-none"
        >
          {current?.image ? (
            <img src={current.image} alt={current.label} className="w-full h-full object-cover opacity-90" />
          ) : (
            <Sparkles className="w-5 h-5 text-amber-300" />
          )}
          <span className="absolute inset-0 rounded-full ring-2 ring-inset ring-amber-300/45 pointer-events-none" />
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-xs flex items-center justify-center transition-opacity duration-200"
          onClick={() => {
            setHoveredDir(null);
            setOpen(false);
          }}
        >
          <div
            className="relative w-60 h-60 flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Subtle glowing dark orbital ring */}
            <div className="absolute w-44 h-44 rounded-full border border-white/20 bg-slate-950/35 backdrop-blur-md shadow-[0_0_50px_rgba(0,0,0,0.45)] pointer-events-none" />

            {/* Directional Guide Chevrons */}
            <ChevronUp className={`absolute -translate-y-[42px] w-4 h-4 transition ${hoveredDir === 'top' ? 'text-amber-300 scale-125' : 'text-white/45'}`} />
            <ChevronRight className={`absolute translate-x-[42px] w-4 h-4 transition ${hoveredDir === 'right' ? 'text-amber-300 scale-125' : 'text-white/45'}`} />
            <ChevronDown className={`absolute translate-y-[42px] w-4 h-4 transition ${hoveredDir === 'bottom' ? 'text-amber-300 scale-125' : 'text-white/45'}`} />
            <ChevronLeft className={`absolute -translate-x-[42px] w-4 h-4 transition ${hoveredDir === 'left' ? 'text-amber-300 scale-125' : 'text-white/45'}`} />

            {/* 4 Directional Theme Petals */}
            {BG_THEMES.map((th) => {
              const isSelected = activeTheme === th.id;
              const isHovered = hoveredDir === th.direction;
              return (
                <button
                  key={th.id}
                  type="button"
                  onClick={() => pick(th.id)}
                  style={{
                    transform: `${posStyle[th.direction]} scale(${isHovered ? 1.18 : isSelected ? 1.06 : 1})`,
                  }}
                  className={`absolute w-16 h-16 rounded-full overflow-hidden border-2 transition-all duration-300 ease-out shadow-2xl flex flex-col items-center justify-end cursor-pointer hover:scale-110 active:scale-95 ${
                    isHovered
                      ? 'border-amber-300 ring-4 ring-amber-400/65 shadow-[0_0_24px_rgba(251,191,36,0.65)]'
                      : isSelected
                      ? 'border-amber-300 ring-2 ring-amber-400/45'
                      : 'border-white/80'
                  }`}
                >
                  {th.image && <img src={th.image} alt={th.label} className="absolute inset-0 w-full h-full object-cover" />}
                  <span className="relative z-10 w-full bg-slate-950/70 backdrop-blur-xs text-[9.5px] font-black text-white py-0.5 text-center">
                    {th.label}
                  </span>
                </button>
              );
            })}

            {/* Center Obsidian Orb */}
            <button
              type="button"
              onClick={() => {
                if (didDragRef.current) {
                  didDragRef.current = false;
                  return;
                }
                if (activeTheme !== 'light') pick('light');
                else setOpen(false);
              }}
              className="relative z-20 w-14 h-14 rounded-full bg-slate-950/88 backdrop-blur-2xl border-2 border-white/45 shadow-2xl flex flex-col items-center justify-center text-white active:scale-90 transition cursor-pointer"
              title={activeTheme !== 'light' ? 'Standart fon' : 'Yopish'}
            >
              {activeTheme !== 'light' ? (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span className="text-[8.5px] font-black mt-0.5">Asl fon</span>
                </>
              ) : (
                <X className="w-5 h-5 text-white/85" />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
