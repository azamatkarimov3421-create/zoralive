import React from 'react';
import { DRAGON_BY_RIDE_CODE } from '../lib/mythicCatalog';
import { VipCrest } from './LuxuryBadges';

export interface EntryRideEvent {
  id: string;
  displayName: string;
  avatar: string;
  vipLevel: number;
  rideCode: string;
}

const RIDE_META: Record<string, { icon: string; label: string; bg: string; img?: string }> = {
  'ride-horse': {
    icon: '🐎',
    label: 'Zirhli Ritsar Oti (VIP 5)',
    bg: 'from-amber-600/95 via-orange-600/95 to-stone-800/95 border-amber-300/70',
  },
  'ride-mecha': {
    icon: '🦾',
    label: 'Mexa Ajdarho (VIP 6)',
    bg: 'from-indigo-600/95 via-purple-600/95 to-slate-900/95 border-indigo-300/70',
  },
  'ride-lambo': {
    icon: '🏎️',
    label: 'Lyuks Sport Avto (VIP 7)',
    bg: 'from-cyan-500/95 via-blue-600/95 to-indigo-700/95 border-cyan-300/70',
    img: '/assets/gift-car.jpg',
  },
  'ride-unicorn': {
    icon: '🦄',
    label: 'Yulduzli Pegas',
    bg: 'from-pink-500/95 via-fuchsia-600/95 to-purple-700/95 border-pink-300/70',
  },
  'ride-jet': {
    icon: '✈️',
    label: 'Shaxsiy Layner (VIP 8)',
    bg: 'from-indigo-500/95 via-violet-600/95 to-cyan-600/95 border-indigo-300/70',
  },
  'ride-dragon': {
    icon: '🐉',
    label: 'Oltin Ajdarho',
    bg: 'from-amber-500/95 via-orange-600/95 to-red-700/95 border-yellow-300/80',
    img: '/assets/gift-dragon.jpg',
  },
};

export const EntryBanner: React.FC<{ event: EntryRideEvent | null }> = ({ event }) => {
  if (!event) return null;

  const dragon = DRAGON_BY_RIDE_CODE[event.rideCode];
  const meta = dragon
    ? {
        icon: '🐉',
        label: `${dragon.name} — ${dragon.titleUz}`,
        bg: `${dragon.gradient} border-yellow-300/85`,
        img: dragon.image,
      }
    : RIDE_META[event.rideCode] || RIDE_META['ride-lambo'];

  const isDivine = event.vipLevel >= 12 || event.rideCode === 'ride-dragon-xaldris';

  return (
    <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md overflow-hidden">
      <div
        key={event.id}
        className={`animate-ride-glide flex items-center gap-2.5 px-3.5 py-2.5 rounded-full bg-gradient-to-r ${meta.bg} border-2 shadow-2xl ${
          isDivine ? 'ring-2 ring-amber-300/90' : ''
        }`}
      >
        {meta.img ? (
          <img src={meta.img} alt="" className="w-10 h-10 rounded-full object-cover border-2 border-amber-200 shrink-0 shadow" />
        ) : (
          <span className="text-2xl drop-shadow">{meta.icon}</span>
        )}
        <img
          src={event.avatar}
          alt={event.displayName}
          className="w-8 h-8 rounded-full border-2 border-white/85 object-cover object-top bg-slate-900 shrink-0"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {event.vipLevel > 0 && <VipCrest level={event.vipLevel} size="xs" />}
            <span className="font-black text-xs text-white truncate drop-shadow">{event.displayName}</span>
          </div>
          <p className="text-[11px] font-bold text-white/95 truncate">
            {isDivine ? '👑 VIP 12 Ilohiy Kirish: ' : ''}
            {meta.label}
          </p>
        </div>
        <span className="text-lg">✨</span>
      </div>
    </div>
  );
};
