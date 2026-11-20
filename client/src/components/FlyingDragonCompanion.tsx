import React, { useEffect, useRef, useState } from 'react';
import { Flame, Sparkles, Upload, X, Volume2, VolumeX } from 'lucide-react';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
  maxLife: number;
}

const DRAGON_PRESETS = [
  {
    id: 'valtor',
    name: 'Valtor (Olov)',
    primaryColor: '#ef4444',
    secondaryColor: '#f97316',
    glowColor: 'rgba(239, 68, 68, 0.7)',
    eyeColor: '#fef08a',
    element: 'Olov',
  },
  {
    id: 'zepharion',
    name: 'Zepharion (Oltin)',
    primaryColor: '#eab308',
    secondaryColor: '#ca8a04',
    glowColor: 'rgba(234, 179, 8, 0.7)',
    eyeColor: '#67e8f9',
    element: 'Bo‘ron',
  },
  {
    id: 'nythera',
    name: 'Nythera (Kosmik)',
    primaryColor: '#a855f7',
    secondaryColor: '#6366f1',
    glowColor: 'rgba(168, 85, 247, 0.7)',
    eyeColor: '#f43f5e',
    element: 'Koinot',
  },
];

export const FlyingDragonCompanion: React.FC = () => {
  const [activePreset, setActivePreset] = useState(DRAGON_PRESETS[0]);
  const [customImage, setCustomImage] = useState<string | null>(() => localStorage.getItem('zoralive_custom_dragon'));
  const [isBreathingFire, setIsBreathingFire] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isPerched, setIsPerched] = useState(false);
  const [showControls, setShowControls] = useState(false);

  // Position & flight physics inside arena
  const [posX, setPosX] = useState(50); // percentage across container (20 to 80)
  const [posY, setPosY] = useState(55); // px from top (35 to 70)
  const [facingLeft, setFacingLeft] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animFrameRef = useRef<number | null>(null);
  const dragonBoxRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Sound generator using Web Audio API
  const playFireSound = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const bufferSize = ctx.sampleRate * 1.5;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(400, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1300, ctx.currentTime + 0.3);
      filter.frequency.exponentialRampToValueAtTime(180, ctx.currentTime + 1.3);
      filter.Q.value = 1.6;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.28, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.4);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } catch {
      // Audio playback blocked
    }
  };

  // Trigger fire breath
  const breatheFire = () => {
    if (isBreathingFire) return;
    setIsBreathingFire(true);
    playFireSound();
    setTimeout(() => {
      setIsBreathingFire(false);
    }, 2500);
  };

  // Smooth flight path loop
  useEffect(() => {
    if (isPerched) return;
    let t = 0;
    const interval = setInterval(() => {
      t += 0.04;
      const newX = 50 + Math.sin(t * 0.75) * 32;
      const newY = 56 + Math.cos(t * 1.4) * 16;
      setPosX(newX);
      setPosY(newY);

      // Facing direction
      const dx = Math.cos(t * 0.75);
      setFacingLeft(dx < 0);
    }, 50);

    return () => clearInterval(interval);
  }, [isPerched]);

  // Periodic automatic fire breathing (every 12 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      if (!isBreathingFire && Math.random() > 0.35) {
        breatheFire();
      }
    }, 12000);
    return () => clearInterval(timer);
  }, [isBreathingFire]);

  // Canvas particle engine for fire breath & embers
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let running = true;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Fire breathing emission
      if (isBreathingFire && dragonBoxRef.current && containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const dRect = dragonBoxRef.current.getBoundingClientRect();

        // Scale factors if canvas is stretched
        const scaleX = canvas.width / cRect.width;
        const scaleY = canvas.height / cRect.height;

        const mouthX = (facingLeft
          ? dRect.left - cRect.left + 15
          : dRect.right - cRect.left - 15) * scaleX;
        const mouthY = (dRect.top - cRect.top + dRect.height * 0.5) * scaleY;

        const fireColors = ['#ffffff', '#fef08a', '#f97316', '#ef4444', '#b91c1c'];
        const count = 6;

        for (let i = 0; i < count; i++) {
          const baseAngle = facingLeft ? Math.PI : 0;
          const spread = (Math.random() - 0.5) * 0.45;
          const angle = baseAngle + spread;
          const speed = (5 + Math.random() * 8) * scaleX;

          particlesRef.current.push({
            x: mouthX,
            y: mouthY + (Math.random() - 0.5) * 8 * scaleY,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed + (Math.random() - 0.5) * 2,
            size: 6 + Math.random() * 16,
            alpha: 1,
            color: fireColors[Math.floor(Math.random() * fireColors.length)],
            life: 0,
            maxLife: 24 + Math.random() * 16,
          });
        }
      }

      // Update & render particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy -= 0.12; // upward draft
        p.life++;
        p.alpha = 1 - p.life / p.maxLife;
        p.size *= 0.95;

        if (p.life >= p.maxLife || p.alpha <= 0) {
          particlesRef.current.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.alpha);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 14;

        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
        grad.addColorStop(0, p.color);
        grad.addColorStop(0.6, p.color);
        grad.addColorStop(1, 'transparent');

        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (running) {
        animFrameRef.current = requestAnimationFrame(render);
      }
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      running = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isBreathingFire, facingLeft]);

  // Handle custom file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = String(event.target?.result);
        setCustomImage(result);
        localStorage.setItem('zoralive_custom_dragon', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearCustomImage = () => {
    setCustomImage(null);
    localStorage.removeItem('zoralive_custom_dragon');
  };

  return (
    <div className="relative w-full mb-3 select-none">
      {/* Dragon Sky Arena Card */}
      <div
        ref={containerRef}
        className="relative w-full h-36 rounded-3xl overflow-hidden bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 border border-amber-400/35 shadow-lg flex flex-col justify-between p-3"
      >
        {/* Ambient Fire Aura Glow */}
        <div
          className="absolute -top-10 left-1/2 -translate-x-1/2 w-72 h-32 rounded-full blur-3xl pointer-events-none transition-opacity duration-300"
          style={{
            backgroundColor: isBreathingFire ? activePreset.primaryColor : activePreset.glowColor,
            opacity: isBreathingFire ? 0.45 : 0.2,
          }}
        />

        {/* Floating Stars / Sparks Background */}
        <div className="absolute inset-0 opacity-25 pointer-events-none bg-[radial-gradient(#fde047_1px,transparent_1px)] [background-size:16px_16px]" />

        {/* Top Header of Arena */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-amber-400/40 shadow-sm">
            <Flame className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span className="text-[10.5px] font-black text-amber-300 tracking-wide uppercase">
              {customImage ? 'MAXSUS AHDARCHA' : `${activePreset.name}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* Sound Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="p-1.5 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-slate-700 text-slate-300 transition"
              title={soundEnabled ? 'Ovozni o‘chirish' : 'Ovozni yoqish'}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
              )}
            </button>

            {/* Flight Mode Toggle */}
            <button
              onClick={() => setIsPerched(!isPerched)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-black transition border ${
                isPerched
                  ? 'bg-amber-400 text-slate-950 border-amber-300'
                  : 'bg-slate-900/80 text-slate-300 hover:text-white border-slate-700'
              }`}
            >
              {isPerched ? '🪺 Qo‘ngan' : '🦅 Uchmoqda'}
            </button>

            {/* Settings button */}
            <button
              onClick={() => setShowControls(!showControls)}
              className="px-2.5 py-1 rounded-full bg-slate-900/80 hover:bg-slate-800 border border-amber-400/40 text-amber-300 text-[10.5px] font-black flex items-center gap-1 transition"
            >
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Sozlash</span>
            </button>
          </div>
        </div>

        {/* Canvas for Particle Fire Embers */}
        <canvas
          ref={canvasRef}
          width={640}
          height={144}
          className="absolute inset-0 w-full h-full pointer-events-none z-20"
        />

        {/* Animated Flying Dragon */}
        <div
          ref={dragonBoxRef}
          onClick={breatheFire}
          className="absolute z-20 cursor-pointer transition-transform duration-200"
          style={{
            left: `${isPerched ? 80 : posX}%`,
            top: `${isPerched ? 62 : posY}px`,
            transform: `translate(-50%, -50%) scale(${isBreathingFire ? 1.18 : 1}) scaleX(${
              facingLeft ? -1 : 1
            })`,
            filter: isBreathingFire
              ? `drop-shadow(0 0 20px ${activePreset.primaryColor}) drop-shadow(0 0 35px #f59e0b)`
              : `drop-shadow(0 6px 14px rgba(0,0,0,0.5)) drop-shadow(0 0 10px ${activePreset.glowColor})`,
          }}
          title="Ajdarchani bosing — olov purkaydi! 🔥"
        >
          {customImage ? (
            <div className="relative w-24 h-24 flex items-center justify-center">
              <img
                src={customImage}
                alt="Custom Dragon"
                className={`w-full h-full object-contain filter drop-shadow-md ${
                  !isPerched ? 'animate-bounce' : ''
                }`}
                style={{ animationDuration: '2.4s' }}
              />
              {isBreathingFire && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-amber-400 blur-sm animate-ping" />
              )}
            </div>
          ) : (
            /* SVG Procedural Animated Dragon */
            <div className="relative w-28 h-24 flex items-center justify-center">
              <svg
                viewBox="0 0 200 160"
                className="w-full h-full overflow-visible"
                style={{
                  filter: isBreathingFire
                    ? 'brightness(1.25) contrast(1.15)'
                    : 'brightness(1)',
                }}
              >
                <defs>
                  <linearGradient id="dragonSkin" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor={activePreset.primaryColor} />
                    <stop offset="50%" stopColor={activePreset.secondaryColor} />
                    <stop offset="100%" stopColor="#1e1b4b" />
                  </linearGradient>

                  <linearGradient id="wingMembrane" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.85" />
                    <stop offset="60%" stopColor={activePreset.primaryColor} stopOpacity="0.9" />
                    <stop offset="100%" stopColor="#450a0a" stopOpacity="0.95" />
                  </linearGradient>

                  <radialGradient id="eyeGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#ffffff" />
                    <stop offset="40%" stopColor={activePreset.eyeColor} />
                    <stop offset="100%" stopColor="#000000" />
                  </radialGradient>
                </defs>

                {/* Back Wing */}
                <g
                  className="origin-[95px_75px]"
                  style={{
                    animation: !isPerched
                      ? 'wingFlapBack 0.42s ease-in-out infinite alternate'
                      : 'none',
                  }}
                >
                  <path
                    d="M 95 75 Q 70 20 40 15 Q 60 50 75 75 Z"
                    fill="url(#dragonSkin)"
                    stroke="#fbbf24"
                    strokeWidth="1"
                  />
                  <path
                    d="M 40 15 Q 15 25 10 50 Q 40 65 75 75 Q 50 45 40 15 Z"
                    fill="url(#wingMembrane)"
                    opacity="0.8"
                  />
                </g>

                {/* Dragon Tail (Swaying) */}
                <path
                  d="M 65 95 C 45 110, 30 115, 12 112 C 8 110, 5 105, 8 100 C 15 95, 35 90, 60 85 Z"
                  fill="url(#dragonSkin)"
                  className="origin-[65px_90px]"
                  style={{
                    animation: 'tailWave 1.3s ease-in-out infinite alternate',
                  }}
                />
                <polygon
                  points="12,112 0,118 6,106"
                  fill={activePreset.primaryColor}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                />

                {/* Torso & Underbelly */}
                <ellipse
                  cx="90"
                  cy="90"
                  rx="35"
                  ry="22"
                  fill="url(#dragonSkin)"
                  stroke="#f97316"
                  strokeWidth="1.5"
                />
                <path
                  d="M 80 92 Q 95 106 110 92 Q 95 86 80 92 Z"
                  fill="#fde047"
                  opacity="0.85"
                />

                {/* Dragon Head */}
                <g
                  className="origin-[115px_75px]"
                  style={{
                    transform: isBreathingFire ? 'rotate(-10deg)' : 'rotate(0deg)',
                    transition: 'transform 0.2s ease',
                  }}
                >
                  {/* Horns */}
                  <path
                    d="M 125 55 Q 140 25 160 18 Q 145 35 135 58 Z"
                    fill="#fbbf24"
                    stroke="#78350f"
                    strokeWidth="1"
                  />
                  <path
                    d="M 118 55 Q 128 32 142 26 Q 132 40 125 58 Z"
                    fill="#f59e0b"
                  />

                  {/* Head Base */}
                  <path
                    d="M 110 75 Q 130 52 155 58 Q 175 68 180 80 Q 155 92 125 88 Z"
                    fill="url(#dragonSkin)"
                    stroke="#f97316"
                    strokeWidth="1.5"
                  />

                  {/* Fiery Nostril */}
                  <circle
                    cx="174"
                    cy="75"
                    r="2.5"
                    fill={isBreathingFire ? '#fef08a' : '#450a0a'}
                  />

                  {/* Glowing Eye */}
                  <ellipse cx="146" cy="67" rx="5" ry="4" fill="url(#eyeGlow)" />
                  <ellipse cx="147" cy="67" rx="1.5" ry="3.5" fill="#000000" />

                  {/* Articulated Lower Jaw */}
                  <path
                    d="M 130 87 Q 155 88 175 82 Q 165 98 140 96 Z"
                    fill="#b91c1c"
                    stroke="#f97316"
                    strokeWidth="1"
                    style={{
                      transformOrigin: '130px 87px',
                      transform: isBreathingFire ? 'rotate(30deg)' : 'rotate(0deg)',
                      transition: 'transform 0.18s ease-in-out',
                    }}
                  />

                  {isBreathingFire && (
                    <circle
                      cx="170"
                      cy="83"
                      r="8"
                      fill="#fde047"
                      className="animate-ping"
                    />
                  )}
                </g>

                {/* Front Wing */}
                <g
                  className="origin-[95px_75px]"
                  style={{
                    animation: !isPerched
                      ? 'wingFlapFront 0.42s ease-in-out infinite alternate'
                      : 'none',
                  }}
                >
                  <path
                    d="M 95 75 Q 85 20 60 8 Q 80 40 95 75 Z"
                    fill="#fbbf24"
                    stroke="#78350f"
                    strokeWidth="1.5"
                  />
                  <path
                    d="M 60 8 Q 30 18 20 48 Q 50 68 95 75 Q 70 42 60 8 Z"
                    fill="url(#wingMembrane)"
                    stroke="#f97316"
                    strokeWidth="1"
                  />
                  <path
                    d="M 60 8 Q 45 35 55 60 M 60 8 Q 30 35 32 52"
                    stroke="#fbbf24"
                    strokeWidth="1.2"
                    fill="none"
                  />
                </g>

                {/* Claws */}
                <path
                  d="M 105 105 L 110 115 L 105 116 M 112 105 L 118 114"
                  stroke="#fbbf24"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Bottom Bar: Action Fire Button & Tip */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
            <span>Bosganda olov purkaydi</span>
          </div>

          <button
            onClick={breatheFire}
            disabled={isBreathingFire}
            className={`px-3 py-1.5 rounded-full text-xs font-black flex items-center gap-1.5 shadow-md transition-all active:scale-95 ${
              isBreathingFire
                ? 'bg-gradient-to-r from-red-600 to-amber-500 text-white animate-pulse ring-2 ring-amber-400'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 text-white hover:brightness-110 shadow-orange-500/30'
            }`}
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            <span>{isBreathingFire ? '🔥 Olov Purkamoqda!' : '🔥 Olov Purkash'}</span>
          </button>
        </div>
      </div>

      {/* Settings Modal */}
      {showControls && (
        <div className="mt-2 p-3 rounded-2xl bg-slate-950 text-white border border-amber-400/40 shadow-xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-amber-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Ajdarcha Ko‘rinishi & Fayl Yuklash</span>
            </div>
            <button
              onClick={() => setShowControls(false)}
              className="p-1 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Presets */}
          <div>
            <div className="text-[10.5px] font-bold text-slate-400 mb-1.5">
              Afsonaviy ajdarni tanlash:
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {DRAGON_PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActivePreset(p);
                    clearCustomImage();
                  }}
                  className={`p-2 rounded-xl text-left border transition ${
                    activePreset.id === p.id && !customImage
                      ? 'border-amber-400 bg-amber-500/25 text-white font-black'
                      : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                      style={{ backgroundColor: p.primaryColor }}
                    />
                    <span className="text-[10px] font-bold truncate">{p.name}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Custom File Upload */}
          <div className="pt-1 border-t border-slate-800/80">
            <div className="text-[10.5px] font-bold text-slate-400 mb-1.5 flex items-center justify-between">
              <span>O‘z animatsiyali ajdarchangiz (WebP / GIF / PNG):</span>
              {customImage && (
                <button
                  onClick={clearCustomImage}
                  className="text-[9.5px] text-rose-400 hover:underline"
                >
                  Asliga qaytarish
                </button>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 rounded-xl bg-slate-900 hover:bg-slate-850 border border-dashed border-slate-700 hover:border-amber-400 text-slate-300 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition"
            >
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>
                {customImage
                  ? 'Boshqa fayl tanlash'
                  : 'Fayl tanlash (Shaffof GIF / WebP / PNG)'}
              </span>
            </button>
            <p className="text-[9.5px] text-slate-400 mt-1">
              💡 Shaffof fonli (transparent) har qanday ajdarcha rasmi yoki GIF/WebP tashlasangiz, u ham xuddi shunday parvoz qiladi va olov purkaydi!
            </p>
          </div>
        </div>
      )}

      {/* Global CSS for Wings and Tail Animation */}
      <style>{`
        @keyframes wingFlapFront {
          0% {
            transform: rotate(-24deg) scaleY(1);
          }
          50% {
            transform: rotate(6deg) scaleY(0.68);
          }
          100% {
            transform: rotate(30deg) scaleY(1);
          }
        }
        @keyframes wingFlapBack {
          0% {
            transform: rotate(26deg) scaleY(1);
          }
          50% {
            transform: rotate(0deg) scaleY(0.72);
          }
          100% {
            transform: rotate(-20deg) scaleY(1);
          }
        }
        @keyframes tailWave {
          0% {
            transform: rotate(-8deg) skewX(-4deg);
          }
          100% {
            transform: rotate(12deg) skewX(5deg);
          }
        }
      `}</style>
    </div>
  );
};
