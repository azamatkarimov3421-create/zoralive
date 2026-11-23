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
  scale: 0.78,
  scaleX: 1.38,
  scaleY: 1.48,
  boxWidth: 440,
  boxHeight: 222,
  offsetX: -13,
  offsetY: 1,
};

interface CinematicVideoDragonProps {
  className?: string;
  onEnded?: () => void;
  /** Distance (px) from the avatar centre up to the top crest of the active VIP frame */
  frameTopPx?: number;
  /** Dynamic positioning and scale configuration */
  config?: DragonPositionConfig;
  /** Ambient theme glow color behind the transparent dragon */
  glowColor?: string;
}

// Box & claw placement metrics on the final perched frame
const DRAGON_W = 440;
const DRAGON_H = 222;
const FEET_X_RATIO = 0.477; // claws centre (x)
const FEET_Y_RATIO = 0.907; // claws bottom (y)
const CLAW_GRIP_PX = 3; // claws grip subtly onto the crest

export const CinematicVideoDragon: React.FC<CinematicVideoDragonProps> = ({
  className = '',
  onEnded,
  frameTopPx = 50,
  config,
  glowColor = 'rgba(245, 158, 11, 0.45)',
}) => {
  const activeConfig = { ...DEFAULT_DRAGON_CONFIG, ...(config || {}) };

  const currentBoxW = activeConfig.boxWidth || DRAGON_W;
  const currentBoxH = activeConfig.boxHeight || DRAGON_H;

  const contentW = Math.min(currentBoxW, currentBoxH * (16 / 9));
  const contentH = contentW / (16 / 9);
  const feetXPx = (currentBoxW - contentW) / 2 + FEET_X_RATIO * contentW;
  const feetYPx = (currentBoxH - contentH) / 2 + FEET_Y_RATIO * contentH;

  const finalScale = activeConfig.scale || 0.78;
  const finalScaleX = (activeConfig.scaleX || 1.38) * finalScale;
  const finalScaleY = (activeConfig.scaleY || 1.48) * finalScale;

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
        setIsEnded(true);
      });
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = true;
    video.playsInline = true;

    const onTimeUpdate = () => {
      // Calm perched cutoff: at t >= 9.45s, switch cleanly to crisp static perched PNG (0% GPU/CPU)
      if (!isReplayingRef.current && video.currentTime >= 9.45 && !video.paused) {
        video.pause();
        setIsEnded(true);
        if (onEnded) onEnded();
      }
    };

    const onEndedHandler = () => {
      setIsEnded(true);
      if (onEnded) onEnded();
    };

    const onErrorHandler = () => {
      setIsEnded(true);
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    video.addEventListener('ended', onEndedHandler);
    video.addEventListener('error', onErrorHandler);

    video.play().catch(() => {
      setIsEnded(true);
    });

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('ended', onEndedHandler);
      video.removeEventListener('error', onErrorHandler);
    };
  }, [onEnded]);

  const filterStyle = `drop-shadow(0 5px 10px rgba(0,0,0,0.68)) drop-shadow(0 0 12px ${glowColor})`;

  return (
    <div
      className={`select-none pointer-events-none absolute z-25 flex items-center justify-center ${className}`}
      style={{
        width: `${currentBoxW}px`,
        height: `${currentBoxH}px`,
        left: '50%',
        top: '50%',
        transform: `translate3d(${-feetXPx + (activeConfig.offsetX ?? -13)}px, ${-(feetYPx + frameTopPx - CLAW_GRIP_PX) + (activeConfig.offsetY ?? 1)}px, 0) scale(${finalScaleX}, ${finalScaleY})`,
        transformOrigin: `${feetXPx}px ${feetYPx}px`,
        willChange: 'transform',
      }}
      aria-label="Kinematik Ajdarho (uchish, qo'nish va olov)"
    >
      {/* True Alpha-Channel VP9 WebM: 100% Native Compositor Transparency, Zero Lag on Dark Themes */}
      <video
        ref={videoRef}
        src="/assets/dragon_cinematic_alpha.webm"
        playsInline
        muted
        autoPlay
        preload="auto"
        className={`w-full h-full object-contain pointer-events-none transition-opacity duration-150 ${
          isEnded ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ filter: filterStyle }}
      />

      {/* Crisp Zero-CPU Perched Transparent PNG once flight settles */}
      <img
        src="/assets/dragon_perched_alpha.png"
        alt="VIP Ajdarho"
        draggable={false}
        className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-150 ${
          isEnded ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ filter: filterStyle }}
      />

      {/* Tight clickable hitbox right over dragon body for tap-to-replay without blocking surrounding UI */}
      <button
        type="button"
        onClick={handleReplay}
        title="Ajdarchani qayta uchirish uchun bosing!"
        aria-label="Ajdarchani qayta uchirish"
        className="pointer-events-auto absolute left-[28%] right-[20%] bottom-[6%] h-[42%] bg-transparent border-0 cursor-pointer rounded-full focus:outline-none"
      />
    </div>
  );
};
