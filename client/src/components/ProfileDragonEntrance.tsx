import React, { useEffect, useState } from 'react';

interface ProfileDragonEntranceProps {
  onAnimationComplete?: () => void;
  activeFrame?: string;
  vipLevel?: number;
}

// Tailored perch coordinates for all 12 VIP tiers for the Imperial Crest Dragon:
// Circles around the profile frame and perches symmetrically right on top of the VIP frame ("ramka ustiga qo‘nadi"),
// with 0% face/hair overlap and pure transparent background!
const VIP_PERCH_CONFIG: Record<
  number,
  { top: string; left: string; width: string; height: string }
> = {
  1: { top: '-49px', left: '0px', width: '96px', height: '51px' }, // Bronza Boshlang‘ich
  2: { top: '-50px', left: '0px', width: '97px', height: '52px' }, // Binafsha Kristall
  3: { top: '-51px', left: '-1px', width: '98px', height: '52px' }, // Oltin Zirh
  4: { top: '-53px', left: '-2px', width: '100px', height: '53px' }, // Bronza Ritsar
  5: { top: '-54px', left: '-2px', width: '101px', height: '54px' }, // Muzli Glatsial
  6: { top: '-55px', left: '-3px', width: '102px', height: '54px' }, // Olovli Oltin
  7: { top: '-57px', left: '-4px', width: '103px', height: '55px' }, // Oltin Qanotlar & Yulduz
  8: { top: '-57px', left: '-4px', width: '104px', height: '55px' }, // Zumrad Ajdarho Toji
  9: { top: '-59px', left: '-5px', width: '106px', height: '56px' }, // Oqqush & Ametist Toji
  10: { top: '-60px', left: '-6px', width: '107px', height: '57px' }, // Atirgul Imperator
  11: { top: '-61px', left: '-6px', width: '108px', height: '57px' }, // Kosmik Binafsha Hukmdor
  12: { top: '-63px', left: '-6px', width: '109px', height: '58px' }, // Ilohiy Oltin Ajdarho Shohi
};

export const ProfileDragonEntrance: React.FC<ProfileDragonEntranceProps> = ({
  onAnimationComplete,
  vipLevel = 1,
}) => {
  // Clamped VIP level (1 to 12)
  const currentVip = Math.min(12, Math.max(1, vipLevel || 1));
  const perch = VIP_PERCH_CONFIG[currentVip] || VIP_PERCH_CONFIG[1];

  // Phase: 'flying' (steady 4.0s flight from left to right with fire) -> 'perched' (exact VIP frame crest grip)
  const [phase, setPhase] = useState<'flying' | 'perched'>('flying');
  const [fireActive, setFireActive] = useState(false);

  // Sound generator using Web Audio API
  const playDragonRoar = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 2.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1400, ctx.currentTime + 0.5);
      filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.8);
      filter.Q.value = 1.9;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.9);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio autoplay policy
    }
  };

  // Full 4-second steady flight from left to right, landing on exact coordinates
  useEffect(() => {
    // Start fire glow & sound as it flies in
    const tSound = setTimeout(() => {
      setFireActive(true);
      playDragonRoar();
    }, 600);

    // End fire glow right as it approaches the landing frame
    const tFireOff = setTimeout(() => {
      setFireActive(false);
    }, 3200);

    // Touch down and perch directly on the VIP frame corner crest (at 4.0s)
    const tLand = setTimeout(() => {
      setPhase('perched');
      onAnimationComplete?.();
    }, 4000);

    return () => {
      clearTimeout(tSound);
      clearTimeout(tFireOff);
      clearTimeout(tLand);
    };
  }, []);

  // Manual interactive trigger when clicking the perched dragon
  const handleDragonClick = () => {
    if (phase !== 'perched') return;
    setPhase('flying');
    setFireActive(true);
    playDragonRoar();

    setTimeout(() => {
      setFireActive(false);
    }, 2800);

    setTimeout(() => {
      setPhase('perched');
    }, 3900);
  };

  return (
    <>
      {/* Ambient Flame Flash when dragon breathes fire */}
      {fireActive && (
        <div
          className="fixed inset-0 pointer-events-none z-50 transition-opacity duration-300"
          style={{
            background:
              'radial-gradient(circle at 50% 25%, rgba(245, 158, 11, 0.4) 0%, rgba(239, 68, 68, 0.25) 40%, transparent 75%)',
            mixBlendMode: 'screen',
            animation: 'screenFlameFlicker 0.16s ease-in-out infinite alternate',
          }}
        />
      )}

      {/* Dragon Entity */}
      {phase === 'perched' ? (
        /* Perched state: Sits majestically right on top of the VIP frame */
        <div
          onClick={handleDragonClick}
          className="absolute z-30 cursor-pointer pointer-events-auto transition-transform hover:scale-105 active:scale-95 group"
          style={{
            top: perch.top,
            left: perch.left,
            width: perch.width,
            height: perch.height,
            filter:
              'drop-shadow(0 4px 14px rgba(0,0,0,0.55)) drop-shadow(0 0 16px rgba(234, 179, 8, 0.5))',
            animation: 'dragonIdleBreathe 3s ease-in-out infinite alternate',
          }}
          title={`VIP ${currentVip} ramkaga qo‘ngan oltin ajdarho — bosing, yana aylanib uchadi! 🔥`}
        >
          <img
            src="/assets/dragon-perched.png"
            alt="Perched Dragon Companion"
            className="w-full h-full object-contain select-none pointer-events-none"
          />

          {/* Glowing ember spark */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 blur-[1px] animate-ping opacity-90" />
        </div>
      ) : (
        /* 4.0-second Circling Flight around avatar before landing on top of frame */
        <div
          className="pointer-events-none z-40"
          style={{
            position: 'absolute',
            width: perch.width,
            height: perch.height,
            animation: 'dragonCirclingEntrance 4.0s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards',
            filter:
              fireActive
                ? 'drop-shadow(0 0 30px #f59e0b) drop-shadow(0 0 50px #ef4444)'
                : 'drop-shadow(0 4px 12px rgba(0,0,0,0.45))',
          }}
        >
          <img
            src="/assets/dragon-fire-loop.webp"
            alt="Flying Fire Dragon"
            className="w-full h-full object-contain select-none"
          />
        </div>
      )}

      {/* Dynamic Keyframe Trajectory: Circles around the avatar frame and lands on top */}
      <style>{`
        @keyframes dragonCirclingEntrance {
          0% {
            top: -130px;
            left: -150px;
            transform: scale(0.65) rotate(-15deg);
            opacity: 0;
          }
          20% {
            top: -20px;
            left: 70px;
            transform: scale(0.9) rotate(15deg);
            opacity: 1;
          }
          45% {
            top: 45px;
            left: 20px;
            transform: scale(1.05) rotate(0deg);
            opacity: 1;
          }
          70% {
            top: -20px;
            left: -65px;
            transform: scale(1) rotate(-15deg);
            opacity: 1;
          }
          85% {
            top: -55px;
            left: -20px;
            transform: scale(1) rotate(-5deg);
            opacity: 1;
          }
          100% {
            top: ${perch.top};
            left: ${perch.left};
            transform: scale(1) rotate(0deg);
            opacity: 1;
          }
        }

        @keyframes dragonIdleBreathe {
          0% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-2px) scale(1.02);
          }
          100% {
            transform: translateY(0px) scale(1);
          }
        }

        @keyframes screenFlameFlicker {
          0% {
            opacity: 0.85;
          }
          100% {
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};
