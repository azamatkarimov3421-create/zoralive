import React from 'react';
import { VipCrest } from './LuxuryBadges';
import { getAnimatedFrameUrl } from '../lib/mythicCatalog';

interface AvatarProps {
  src?: string;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  frame?: string;
  vipLevel?: number;
  speaking?: boolean;
  className?: string;
  hideVipBadge?: boolean;
}

const SIZE_MAP = {
  xs: 'w-7 h-7',
  sm: 'w-10 h-10',
  md: 'w-12 h-12',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24',
};

// Progressive escalation config for VIP 1-12 frames:
// As level goes 1 -> 12: thicker, more colorful, bigger ("kattaroq shohli bulib kuchaysin")
const FRAME_TIER_STYLES: Record<string, { scale: string; dropShadow: string; auraClass?: string }> = {
  // VIP 1-3: Sleek metallic starter frames
  'frame-obsidian-gold': { scale: 'w-[122%] h-[122%]', dropShadow: 'drop-shadow-[0_2px_8px_rgba(180,83,9,0.35)]' },
  'frame-crystal-violet': { scale: 'w-[122%] h-[122%]', dropShadow: 'drop-shadow-[0_2px_8px_rgba(139,92,246,0.35)]' },
  'frame-palace-gold': { scale: 'w-[124%] h-[124%]', dropShadow: 'drop-shadow-[0_2px_8px_rgba(234,179,8,0.4)]' },

  // VIP 4-6: Thick & colorful knight/elemental frames
  'frame-bronze-3': { scale: 'w-[128%] h-[128%]', dropShadow: 'drop-shadow-[0_3px_12px_rgba(217,119,6,0.45)]' },
  'frame-frost-2': { scale: 'w-[128%] h-[128%]', dropShadow: 'drop-shadow-[0_3px_12px_rgba(56,189,248,0.5)]' },
  'frame-inferno-1': { scale: 'w-[130%] h-[130%]', dropShadow: 'drop-shadow-[0_4px_14px_rgba(239,68,68,0.55)]' },

  // VIP 7-9: Grand Winged, Emerald Dragon & Swan Tiara
  'frame-golden-wings': { scale: 'w-[132%] h-[132%]', dropShadow: 'drop-shadow-[0_4px_16px_rgba(245,158,11,0.6)]', auraClass: 'vip-aura-gold' },
  'frame-emerald-crown': { scale: 'w-[132%] h-[132%]', dropShadow: 'drop-shadow-[0_4px_16px_rgba(16,185,129,0.6)]', auraClass: 'vip-aura-emerald' },
  'frame-amethyst-spark': { scale: 'w-[134%] h-[134%]', dropShadow: 'drop-shadow-[0_4px_16px_rgba(168,85,247,0.6)]', auraClass: 'vip-aura-purple' },

  // VIP 10-12: Colossal Imperial Crowns & Supreme God-Tier Dragon Horns
  'frame-rose-3': { scale: 'w-[136%] h-[136%]', dropShadow: 'drop-shadow-[0_6px_20px_rgba(251,113,133,0.65)]', auraClass: 'vip-aura-rose' },
  'frame-violet-2': { scale: 'w-[138%] h-[138%]', dropShadow: 'drop-shadow-[0_6px_22px_rgba(192,38,211,0.7)]', auraClass: 'vip-aura-violet' },
  'frame-gold-1': { scale: 'w-[140%] h-[140%]', dropShadow: 'drop-shadow-[0_6px_24px_rgba(234,179,8,0.85)]', auraClass: 'vip-aura-god' },
};

/** Returns the rendered frame size relative to the avatar (e.g. 1.4 for 140%). 1 = no frame overlay. */
export function getFrameScale(frame?: string): number {
  if (!frame || !getAnimatedFrameUrl(frame)) return 1.08; // CSS ring frames hug the avatar
  const style = FRAME_TIER_STYLES[frame];
  const m = style?.scale.match(/w-\[(\d+)%\]/);
  return m ? Number(m[1]) / 100 : 1.24;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Z',
  size = 'md',
  frame = '',
  vipLevel = 0,
  speaking = false,
  className = '',
  hideVipBadge = false,
}) => {
  const [imgError, setImgError] = React.useState(false);
  const animatedFrameUrl = getAnimatedFrameUrl(frame);
  const cssFrameClass = !animatedFrameUrl && frame ? frame : '';
  const initial = (name || 'Z').trim().charAt(0).toUpperCase();

  const tierStyle = frame && FRAME_TIER_STYLES[frame]
    ? FRAME_TIER_STYLES[frame]
    : { scale: 'w-[124%] h-[124%]', dropShadow: 'drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]' };

  const activeAuraClass = tierStyle.auraClass || (vipLevel >= 8 ? 'vip-ring-aura' : '');

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* Tier-Specific Radiant Halo Aura Ring */}
      {activeAuraClass && size !== 'xs' && (
        <span
          aria-hidden="true"
          className={`pointer-events-none absolute -inset-1 rounded-full border border-white/40 ${activeAuraClass}`}
        />
      )}

      <div
        className={`${SIZE_MAP[size]} ${
          animatedFrameUrl ? 'rounded-[20%]' : 'rounded-full'
        } overflow-hidden bg-slate-100 flex items-center justify-center ${cssFrameClass} ${
          speaking ? 'speaking-ring' : ''
        } transition-all duration-300 relative z-10 shadow-xs`}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover object-top select-none"
            loading="eager"
            decoding="async"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-bold text-slate-600 text-sm select-none">{initial}</span>
        )}
      </div>

      {/* Dead-centered, pixel-perfect frame overlay with escalating size, thick border & crown */}
      {animatedFrameUrl && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-20">
          <img
            src={animatedFrameUrl}
            alt=""
            aria-hidden="true"
            loading="eager"
            className={`${tierStyle.scale} max-w-none object-contain select-none filter ${tierStyle.dropShadow}`}
          />
        </div>
      )}

      {!hideVipBadge && vipLevel > 0 && size !== 'xs' && size !== 'sm' && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
          <VipCrest level={vipLevel} size="xs" />
        </div>
      )}
    </div>
  );
};
