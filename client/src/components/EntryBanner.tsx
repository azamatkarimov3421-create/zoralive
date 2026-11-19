import React from 'react';

export interface EntryRideEvent {
  id: string;
  displayName: string;
  avatar: string;
  vipLevel: number;
  rideCode: string;
}

const RIDE_META: Record<string, { icon: string; label: string; bg: string }> = {
  'ride-lambo': {
    icon: '🏎️',
    label: 'Neon Sportkar',
    bg: 'from-cyan-500/90 via-blue-600/90 to-indigo-700/90 border-cyan-300/60',
  },
  'ride-unicorn': {
    icon: '🦄',
    label: 'Yulduzli Pegas',
    bg: 'from-pink-500/90 via-fuchsia-600/90 to-purple-700/90 border-pink-300/60',
  },
  'ride-jet': {
    icon: '✈️',
    label: 'Shaxsiy Layner',
    bg: 'from-indigo-500/90 via-violet-600/90 to-cyan-600/90 border-indigo-300/60',
  },
  'ride-dragon': {
    icon: '🐉',
    label: 'Oltin Ajdarho',
    bg: 'from-amber-500/95 via-orange-600/95 to-red-700/95 border-yellow-300/80',
  },
};

export const EntryBanner: React.FC<{ event: EntryRideEvent | null }> = ({ event }) => {
  if (!event) return null;
  const meta = RIDE_META[event.rideCode] || RIDE_META['ride-lambo'];

  return (
    <div className="pointer-events-none fixed top-20 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md overflow-hidden">
      <div
        key={event.id}
        className={`animate-ride-glide flex items-center gap-3 px-4 py-2.5 rounded-full bg-gradient-to-r ${meta.bg} border shadow-2xl`}
      >
        <span className="text-2xl drop-shadow">{meta.icon}</span>
        <img
          src={event.avatar}
          alt={event.displayName}
          className="w-8 h-8 rounded-full border-2 border-white/80 bg-slate-900"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            {event.vipLevel > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-black/30 text-[10px] font-black text-amber-200">
                VIP{event.vipLevel}
              </span>
            )}
            <span className="font-bold text-sm text-white truncate">{event.displayName}</span>
          </div>
          <p className="text-[11px] text-white/90 truncate">{meta.label} bilan xonaga kirdi!</p>
        </div>
        <span className="text-lg">✨</span>
      </div>
    </div>
  );
};
