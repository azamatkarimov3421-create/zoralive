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
}

const SIZE_MAP = {
  xs: 'w-7 h-7',
  sm: 'w-10 h-10',
  md: 'w-13 h-13',
  lg: 'w-16 h-16',
  xl: 'w-20 h-20',
  '2xl': 'w-24 h-24',
};

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = 'Z',
  size = 'md',
  frame = '',
  vipLevel = 0,
  speaking = false,
  className = '',
}) => {
  const [imgError, setImgError] = React.useState(false);
  const animatedFrameUrl = getAnimatedFrameUrl(frame);
  const cssFrameClass = !animatedFrameUrl && frame ? frame : 'ring-1 ring-slate-200';
  const initial = (name || 'Z').trim().charAt(0).toUpperCase();
  const hasVipRing = vipLevel >= 8;

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {/* VIP 8+ Golden Ring Effect */}
      {hasVipRing && (
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-1.5 rounded-full border-2 border-amber-300/90 vip-ring-aura"
        />
      )}

      <div
        className={`${SIZE_MAP[size]} ${
          animatedFrameUrl ? 'rounded-xl' : 'rounded-full'
        } overflow-hidden bg-slate-100 flex items-center justify-center ${cssFrameClass} ${
          speaking ? 'speaking-ring' : ''
        } transition-all duration-300 relative z-10`}
      >
        {src && !imgError ? (
          <img
            src={src}
            alt={name}
            className="w-full h-full object-cover object-top"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <span className="font-bold text-slate-600 text-sm select-none">{initial}</span>
        )}
      </div>

      {/* Animated Transparent Luxury Frame Overlay (from user's SVGA/WebP frames) */}
      {animatedFrameUrl && (
        <img
          src={animatedFrameUrl}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute -inset-[18%] w-[136%] h-[136%] max-w-none object-contain z-20 drop-shadow-md"
        />
      )}

      {vipLevel > 0 && size !== 'xs' && size !== 'sm' && (
        <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 z-30">
          <VipCrest level={vipLevel} size="xs" />
        </div>
      )}
    </div>
  );
};
