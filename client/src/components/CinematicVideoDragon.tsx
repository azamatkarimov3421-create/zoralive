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
  offsetX: 38,
  offsetY: 14,
};

interface CinematicVideoDragonProps {
  className?: string;
  onEnded?: () => void;
  /** Distance (px) from the avatar centre up to the top crest of the active VIP frame */
  frameTopPx?: number;
  /** Dynamic positioning and scale configuration */
  config?: DragonPositionConfig;
  /** Callback fired when user drags dragon on screen */
  onDragPositionChange?: (offsetX: number, offsetY: number) => void;
  /** Whether tuning/calibration mode is active */
  isTuning?: boolean;
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
  onDragPositionChange,
  isTuning = false,
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

  const finalScale = activeConfig.scale || 1.22;
  const finalScaleX = (activeConfig.scaleX || 1.38) * finalScale;
  const finalScaleY = (activeConfig.scaleY || 1.48) * finalScale;

  const videoRef = useRef<HTMLVideoElement>(null);
  const isReplayingRef = useRef(false);
  const [isEnded, setIsEnded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const dragStartRef = useRef({ pointerX: 0, pointerY: 0, initialOffsetX: 0, initialOffsetY: 0 });
  const hasMovedRef = useRef(false);

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

  // Pointer drag listeners for touch / mouse movement
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      initialOffsetX: activeConfig.offsetX ?? 38,
      initialOffsetY: activeConfig.offsetY ?? 14,
    };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.pointerX;
    const dy = e.clientY - dragStartRef.current.pointerY;

    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMovedRef.current = true;
    }

    if (hasMovedRef.current && onDragPositionChange) {
      const newX = Math.round(dragStartRef.current.initialOffsetX + dx);
      const newY = Math.round(dragStartRef.current.initialOffsetY + dy);
      onDragPositionChange(newX, newY);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    // Tap without dragging triggers replay
    if (!hasMovedRef.current) {
      handleReplay();
    }
  };

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
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      className={`select-none absolute z-0 flex items-center justify-center ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } group ${className}`}
      style={{
        width: `${currentBoxW}px`,
        height: `${currentBoxH}px`,
        left: '50%',
        top: '50%',
        transform: `translate3d(${-feetXPx + (activeConfig.offsetX ?? 38)}px, ${-(feetYPx + frameTopPx - CLAW_GRIP_PX) + (activeConfig.offsetY ?? 14)}px, 0) scale(${finalScaleX}, ${finalScaleY})`,
        transformOrigin: `${feetXPx}px ${feetYPx}px`,
        willChange: 'transform',
        touchAction: 'none',
      }}
      title="Ajdarni barmog‘ingiz bilan ushlab surishingiz yoki qayta uchirish uchun bosishingiz mumkin"
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

      {/* Visual cue when in tuning mode */}
      {isTuning && (
        <div className="absolute -top-7 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-0.5 rounded-full bg-amber-500/90 text-white font-black text-[10px] shadow-sm flex items-center gap-1 whitespace-nowrap animate-pulse border border-amber-300">
          <span>🖐️ Ushlab suring (Drag)</span>
        </div>
      )}
    </div>
  );
};
