import React, { useEffect, useRef } from 'react';
import { LiveWaveBars } from './LuxuryBadges';
import { Avatar } from './Avatar';

interface VideoCanvasProps {
  stream: MediaStream | null;
  relayFrame?: string | null;
  hostName: string;
  hostAvatar: string;
  hostFrame?: string;
  hostVip?: number;
  label?: string;
  accent?: string;
  muted?: boolean;
  compact?: boolean;
}

export const VideoCanvas: React.FC<VideoCanvasProps> = ({
  stream,
  relayFrame = null,
  hostName,
  hostAvatar,
  hostFrame,
  hostVip,
  label,
  muted = false,
  compact = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(() => {});
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-[#0a0b14] flex flex-col items-center justify-center">
      {stream ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={muted}
          className={`w-full h-full object-cover ${muted ? 'scale-x-[-1]' : ''}`}
        />
      ) : relayFrame ? (
        <>
          <img src={relayFrame} alt={hostName} className="w-full h-full object-cover" />
          <div className="absolute bottom-2.5 right-2.5 z-20 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/20 text-[9.5px] font-black text-emerald-300 flex items-center gap-1">
            <LiveWaveBars color="bg-emerald-400" className="h-2" />
            <span>LIVE OQIM</span>
          </div>
        </>
      ) : (
        <>
          {/* Full-bleed photographic live stream studio feed fallback */}
          {hostAvatar && (
            <img
              src={hostAvatar}
              alt={hostName}
              className="absolute inset-0 w-full h-full object-cover object-top scale-105"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#070810] via-black/20 to-black/45" />

          {!compact && (
            <div className="relative z-10 mt-auto mb-16 flex flex-col items-center gap-1.5 px-4 text-center">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-white/15 text-[10px] font-extrabold text-white tracking-wide">
                <LiveWaveBars color="bg-rose-400" />
                <span>HD JONLI EFIR</span>
              </div>
            </div>
          )}

          {compact && (
            <div className="relative z-10 mt-auto mb-2.5 flex flex-col items-center gap-1 px-2 text-center">
              <span className="px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-extrabold text-white truncate max-w-[140px] border border-white/15">
                {hostName}
              </span>
            </div>
          )}
        </>
      )}

      {!stream && !relayFrame && !hostAvatar && (
        <div className="relative z-10 flex flex-col items-center gap-2">
          <Avatar name={hostName} size={compact ? 'lg' : 'xl'} frame={hostFrame} vipLevel={hostVip} speaking />
          <span className="font-extrabold text-sm text-white">{hostName}</span>
        </div>
      )}

      {label && (
        <div className="absolute top-2.5 left-2.5 z-20 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-black tracking-wider text-white border border-white/20 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
          <span>{label}</span>
        </div>
      )}
    </div>
  );
};
