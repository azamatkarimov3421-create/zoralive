import React, { useEffect, useRef, useState, useCallback } from 'react';

export interface DragonPositionConfig {
  scale: number;
  scaleX: number;
  scaleY: number;
  boxWidth: number;
  boxHeight: number;
  offsetX: number;
  offsetY: number;
}

export const DEFAULT_DRAGON_CONFIG: DragonPositionConfig = {
  scale: 1.22,
  scaleX: 1.38,
  scaleY: 1.48,
  boxWidth: 440,
  boxHeight: 222,
  offsetX: 18,
  offsetY: 4,
};

interface CinematicVideoDragonProps {
  className?: string;
  onEnded?: () => void;
  /** Distance (px) from the avatar centre up to the top crest of the active VIP frame */
  frameTopPx?: number;
  /** Dynamic positioning and scale configuration */
  config?: DragonPositionConfig;
}

// Box & claw placement metrics on the final perched frame
const DRAGON_W = 396;
const DRAGON_H = 196;
const FEET_X_RATIO = 0.477; // claws centre (x)
const FEET_Y_RATIO = 0.907; // claws bottom (y)
const CLAW_GRIP_PX = 3; // claws grip subtly onto the crest

export const CinematicVideoDragon: React.FC<CinematicVideoDragonProps> = ({
  className = '',
  onEnded,
  frameTopPx = 50,
  config,
}) => {
  const [localConfig, setLocalConfig] = useState<DragonPositionConfig>(() => {
    try {
      const saved = localStorage.getItem('zoralive_dragon_config');
      if (saved) return { ...DEFAULT_DRAGON_CONFIG, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_DRAGON_CONFIG;
  });

  const activeConfig = { ...DEFAULT_DRAGON_CONFIG, ...(config || localConfig) };

  const currentBoxW = activeConfig.boxWidth || DRAGON_W;
  const currentBoxH = activeConfig.boxHeight || DRAGON_H;

  const contentW = Math.min(currentBoxW, currentBoxH * (16 / 9));
  const contentH = contentW / (16 / 9);
  const feetXPx = (currentBoxW - contentW) / 2 + FEET_X_RATIO * contentW;
  const feetYPx = (currentBoxH - contentH) / 2 + FEET_Y_RATIO * contentH;

  const finalScale = activeConfig.scale || 1.0;
  const finalScaleX = (activeConfig.scaleX || 1.0) * finalScale;
  const finalScaleY = (activeConfig.scaleY || 1.0) * finalScale;

  const videoRef = useRef<HTMLVideoElement>(null);
  const isReplayingRef = useRef(false);
  const [isEnded, setIsEnded] = useState(false);

  // Handle click/tap to restart the flight sequence instantly
  const handleReplay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    isReplayingRef.current = true;
    setIsEnded(false);
    video.currentTime = 0;
    video
      .play()
      .then(() => {
        setTimeout(() => {
          isReplayingRef.current = false;
        }, 400);
      })
      .catch(() => {
        isReplayingRef.current = false;
      });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const onTimeUpdate = () => {
      // Calm perched cutoff: at t >= 9.5s, dragon is stably perched on frame crest
      if (!isReplayingRef.current && video.currentTime >= 9.5 && !video.paused) {
        video.pause();
        setIsEnded(true);
        if (onEnded) onEnded();
      }
    };

    const onEndedHandler = () => {
      setIsEnded(true);
      if (onEnded) onEnded();
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEndedHandler);

    video.play().catch(() => {});

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEndedHandler);
    };
  }, [onEnded]);

  return (
    <div
      onClick={handleReplay}
      className={`select-none absolute z-25 flex items-center justify-center cursor-pointer group ${className}`}
      style={{
        width: `${DRAGON_W}px`,
        height: `${DRAGON_H}px`,
        left: '50%',
        top: '50%',
        transform: `translate3d(${-feetXPx + (activeConfig.offsetX || 0)}px, ${-(feetYPx + frameTopPx - CLAW_GRIP_PX) + (activeConfig.offsetY || 0)}px, 0) scale(${activeConfig.scale || 1.0})`,
        transformOrigin: `${feetXPx}px ${feetYPx}px`,
        willChange: 'transform',
      }}
      title="Ajdarchani qayta uchirish uchun bosing!"
      aria-label="Kinematik Ajdarho (uchish, qo'nish va olov)"
    >
      {/* 100% Native Hardware-Accelerated Video (Zero WebGL, Zero JS texture stalls) */}
      <video
        ref={videoRef}
        src="/assets/dragon_cinematic_flight.mp4"
        playsInline
        muted
        autoPlay
        preload="auto"
        className="w-full h-full object-contain pointer-events-none"
        style={{
          mixBlendMode: 'multiply',
          filter: 'contrast(1.02) brightness(1.01)',
        }}
      />
    </div>
  );
};
