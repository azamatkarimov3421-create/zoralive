import React from 'react';
import { VipCrest } from './LuxuryBadges';

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
  const frameClass = frame ? frame : 'ring-1 ring-slate-200';
  const initial = (name || 'Z').trim().charAt(0).toUpperCase();

  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      <div
        className={`${SIZE_MAP[size]} rounded-full overflow-hidden bg-slate-100 flex items-center justify-center ${frameClass} ${
          speaking ? 'speaking-ring' : ''
        } transition-all duration-300`}
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

      {vipLevel > 0 && (
        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 z-10">
          <VipCrest level={vipLevel} size="xs" />
        </div>
      )}
    </div>
  );
};
