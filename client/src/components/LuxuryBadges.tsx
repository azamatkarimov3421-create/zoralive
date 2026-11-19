import React from 'react';

export const STAGE_WALLPAPERS: Record<string, string> = {
  galaxy: '/assets/stage-galaxy.jpg',
  gold: '/assets/stage-palace.jpg',
  neon: '/assets/stage-neon.jpg',
  ocean: '/assets/stage-ocean.jpg',
};

export const LUXURY_GIFT_IMAGES: Record<string, string> = {
  'gift-crown': '/assets/gift-crown.jpg',
  'gift-car': '/assets/gift-car.jpg',
  'gift-yacht': '/assets/gift-yacht.jpg',
  'gift-dragon': '/assets/gift-dragon.jpg',
};

export function getStageWallpaper(theme?: string): string {
  return STAGE_WALLPAPERS[theme || 'galaxy'] || STAGE_WALLPAPERS.galaxy;
}

export function getGiftImage(giftId?: string): string | null {
  if (!giftId) return null;
  return LUXURY_GIFT_IMAGES[giftId] || null;
}

export const LiveWaveBars: React.FC<{ color?: string; className?: string }> = ({
  color = 'bg-cyan-300',
  className = '',
}) => (
  <span className={`inline-flex items-end gap-[2px] h-3 ${className}`} aria-hidden="true">
    <span className={`w-[2.5px] h-full rounded-full ${color} eq-bar-1`} />
    <span className={`w-[2.5px] h-full rounded-full ${color} eq-bar-2`} />
    <span className={`w-[2.5px] h-full rounded-full ${color} eq-bar-3`} />
  </span>
);

export const VipCrest: React.FC<{ level: number; size?: 'xs' | 'sm' | 'md' }> = ({
  level,
  size = 'xs',
}) => {
  if (!level || level <= 0) return null;

  const isImperial = level >= 5;
  const isGold = level >= 3;
  const styles = isImperial
    ? 'from-amber-200 via-yellow-400 to-purple-500 text-slate-950 border-yellow-200/90 shadow-[0_2px_10px_rgba(250,204,21,0.55)]'
    : isGold
    ? 'from-amber-200 via-amber-400 to-orange-500 text-slate-950 border-amber-100/80 shadow-[0_2px_8px_rgba(245,158,11,0.45)]'
    : 'from-slate-200 via-cyan-200 to-sky-400 text-slate-950 border-white/80 shadow-[0_2px_8px_rgba(56,189,248,0.4)]';

  const pad =
    size === 'md'
      ? 'px-2.5 py-0.5 text-[11px] gap-1'
      : size === 'sm'
      ? 'px-2 py-0.5 text-[10px] gap-1'
      : 'px-1.5 py-[1px] text-[9px] gap-0.5';

  return (
    <span
      className={`inline-flex items-center rounded-full bg-gradient-to-r ${styles} border font-black tracking-tight whitespace-nowrap ${pad}`}
    >
      <svg viewBox="0 0 16 16" className={size === 'md' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'} fill="currentColor">
        <path d="M2 12L1 5l4 3 3-5 3 5 4-3-1 7H2zm1 1.5h10V15H3v-1.5z" />
      </svg>
      <span>{isImperial ? `SVIP${level}` : `VIP${level}`}</span>
    </span>
  );
};

export const LevelPill: React.FC<{ level: number; variant?: 'wealth' | 'charm' }> = ({
  level,
  variant = 'wealth',
}) => {
  const cls =
    variant === 'charm'
      ? 'from-pink-500/90 to-purple-600/90 border-pink-300/40 text-white'
      : 'from-cyan-500/90 to-blue-600/90 border-cyan-300/40 text-white';
  return (
    <span
      className={`inline-flex items-center gap-0.5 px-1.5 py-[1px] rounded-full bg-gradient-to-r ${cls} border text-[9px] font-black tracking-tight`}
    >
      <span>{variant === 'charm' ? '♦' : '★'}</span>
      <span>Lv.{level}</span>
    </span>
  );
};

export const PodiumCrown: React.FC<{ rank: 1 | 2 | 3 }> = ({ rank }) => {
  const fill =
    rank === 1 ? '#fde047' : rank === 2 ? '#e2e8f0' : '#fb923c';
  const glow =
    rank === 1
      ? 'drop-shadow(0 0 10px rgba(250,204,21,0.9))'
      : rank === 2
      ? 'drop-shadow(0 0 8px rgba(226,232,240,0.75))'
      : 'drop-shadow(0 0 8px rgba(251,146,60,0.75))';

  return (
    <svg
      viewBox="0 0 36 24"
      className={rank === 1 ? 'w-9 h-6 -mb-1.5 z-20' : 'w-7 h-5 -mb-1 z-20'}
      style={{ filter: glow }}
    >
      <path
        d="M4 20L2 7l9 6 7-11 7 11 9-6-2 13H4z"
        fill={fill}
        stroke="#090a12"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="18" cy="14" r="2.2" fill="#090a12" fillOpacity="0.45" />
    </svg>
  );
};

export const PkVsCrest: React.FC = () => (
  <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-gradient-to-br from-amber-300 via-rose-500 to-purple-700 p-[2px] shadow-[0_0_24px_rgba(255,42,133,0.75)]">
    <div className="w-full h-full rounded-full bg-[#0a0c16] flex items-center justify-center">
      <span className="font-black italic text-sm bg-gradient-to-b from-amber-200 via-amber-400 to-rose-400 bg-clip-text text-transparent pr-0.5">
        VS
      </span>
    </div>
  </div>
);
