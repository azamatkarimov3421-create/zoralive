import React, { useEffect, useRef, useState } from 'react';
import {
  Flame,
  Shield,
  Swords,
  Sparkles,
  Zap,
  Crown,
  RotateCcw,
  ArrowUpCircle,
  Gamepad2,
  Play,
  Volume2,
} from 'lucide-react';
import { MYTHIC_DRAGONS, MythicDragon } from '../lib/mythicCatalog';
import { CONTINENTS_10 } from '../lib/worldEcosystemData';
import { useWorld } from '../context/WorldContext';
import { useAuth } from '../context/AuthContext';
import { LuckyWheelGame } from '../components/LuckyWheelGame';
import { LudoGame } from '../components/LudoGame';
import { DrawGuessGame } from '../components/DrawGuessGame';
import { sfx } from '../lib/sound';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  color: string;
  life: number;
}

interface FloatingText {
  id: number;
  side: 'left' | 'right' | 'center';
  text: string;
  color: string;
}

const ELEMENT_COLORS: Record<string, [string, string, string]> = {
  Havo: ['#38bdf8', '#fde047', '#ffffff'],
  Kosmos: ['#a855f7', '#6366f1', '#f0abfc'],
  'Olov va lava': ['#ff4500', '#ff9500', '#fde047'],
  Tabiat: ['#10b981', '#84cc16', '#bbf7d0'],
  Suv: ['#06b6d4', '#3b82f6', '#bae6fd'],
  Soya: ['#9333ea', '#475569', '#e2e8f0'],
  'Yorug‘lik va kristall': ['#facc15', '#fbbf24', '#ffffff'],
  Elektr: ['#3b82f6', '#38bdf8', '#fef08a'],
  'O‘lim': ['#94a3b8', '#cbd5e1', '#f8fafc'],
  'Barcha elementlar': ['#ff3366', '#facc15', '#38bdf8'],
};

export const DragonArenaPage: React.FC = () => {
  const { toast } = useAuth();
  const { state, evolveDragon, recordBattleWin, setUserPresence } = useWorld();

  const [mainTab, setMainTab] = useState<'ARENA' | 'EVOLUTION' | 'MINIGAMES'>('ARENA');
  const [miniTab, setMiniTab] = useState<'wheel' | 'ludo' | 'draw'>('wheel');

  // 3v3 Dragon Squads (Side 1 vs Side 2 — ZERO humans!)
  const [leftSquadIds, setLeftSquadIds] = useState<string[]>(['valtor', 'thalassor', 'zepharion']);
  const [rightSquadIds, setRightSquadIds] = useState<string[]>(['sylvanna', 'drakthar', 'nythera']);
  const [leftActiveIdx, setLeftActiveIdx] = useState(0);
  const [rightActiveIdx, setRightActiveIdx] = useState(0);

  const leftDragon: MythicDragon =
    MYTHIC_DRAGONS.find((d) => d.id === leftSquadIds[leftActiveIdx]) || MYTHIC_DRAGONS[2];
  const rightDragon: MythicDragon =
    MYTHIC_DRAGONS.find((d) => d.id === rightSquadIds[rightActiveIdx]) || MYTHIC_DRAGONS[3];

  const leftStage = state.dragonStages[leftDragon.id] || 1;
  const rightStage = state.dragonStages[rightDragon.id] || 1;
  const leftMaxHp = 1800 + leftStage * 450 + state.equippedGearIds.length * 120;
  const rightMaxHp = 1900 + rightStage * 420;

  const [leftHp, setLeftHp] = useState(leftMaxHp);
  const [rightHp, setRightHp] = useState(rightMaxHp);
  const [leftEnergy, setLeftEnergy] = useState(65);
  const [rightEnergy, setRightEnergy] = useState(55);
  const [leftShield, setLeftShield] = useState(false);
  const [rightShield, setRightShield] = useState(false);
  const [roundNum, setRoundNum] = useState(1);
  const [cooldowns, setCooldowns] = useState<[number, number, number, number]>([0, 0, 0, 0]);
  const [balconyFireMode, setBalconyFireMode] = useState<null | 'left' | 'right'>(null);
  const [shaking, setShaking] = useState(false);
  const [winner, setWinner] = useState<null | 'left' | 'right'>(null);
  const [autoBattle, setAutoBattle] = useState(false);
  const [battleLog, setBattleLog] = useState<string[]>([
    '🐉 Balkon Arenasi tayyor! Odamlarsiz sof Ajdarho vs Ajdarho jangi.',
  ]);
  const [floaters, setFloaters] = useState<FloatingText[]>([]);

  // Live 60fps Elemental Fire Breath Particle Canvas
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);

  useEffect(() => {
    setUserPresence('JANGDA');
    return () => setUserPresence('OVOZLI_SUHBATDA');
  }, [setUserPresence]);

  useEffect(() => {
    setLeftHp(leftMaxHp);
    setRightHp(rightMaxHp);
    setWinner(null);
    setRoundNum(1);
    setCooldowns([0, 0, 0, 0]);
  }, [leftActiveIdx, rightActiveIdx, leftMaxHp, rightMaxHp]);

  // Particle Animation Loop
  useEffect(() => {
    let rafId = 0;
    const render = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          const list = particlesRef.current;
          for (let i = list.length - 1; i >= 0; i--) {
            const p = list[i];
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.025;
            p.alpha = Math.max(0, p.life);
            p.size *= 0.985;
            if (p.life <= 0) {
              list.splice(i, 1);
              continue;
            }
            ctx.save();
            ctx.globalCompositeOperation = 'lighter';
            ctx.globalAlpha = p.alpha;
            const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
            grad.addColorStop(0, '#ffffff');
            grad.addColorStop(0.35, p.color);
            grad.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        }
      }
      rafId = requestAnimationFrame(render);
    };
    rafId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const spawnBreathStream = (fromSide: 'left' | 'right', elementUz: string, isBalconyUltimate = false) => {
    const palette = ELEMENT_COLORS[elementUz] || ['#ff4500', '#ff9500', '#fde047'];
    const count = isBalconyUltimate ? 75 : 42;
    for (let i = 0; i < count; i++) {
      const startX = isBalconyUltimate ? 210 + (Math.random() - 0.5) * 40 : fromSide === 'left' ? 95 : 325;
      const startY = isBalconyUltimate ? 68 + (Math.random() - 0.5) * 20 : 128 + (Math.random() - 0.5) * 24;
      const targetX = fromSide === 'left' ? 325 : 95;
      const targetY = isBalconyUltimate ? 185 : 132;
      const dx = targetX - startX;
      const dy = targetY - startY;
      const speed = 0.045 + Math.random() * 0.055;
      particlesRef.current.push({
        x: startX,
        y: startY,
        vx: dx * speed + (Math.random() - 0.5) * 2.4,
        vy: dy * speed + (Math.random() - 0.5) * 2.2,
        size: isBalconyUltimate ? 16 + Math.random() * 18 : 10 + Math.random() * 12,
        alpha: 1,
        color: palette[i % palette.length],
        life: 0.75 + Math.random() * 0.45,
      });
    }
  };

  const pushFloater = (side: 'left' | 'right' | 'center', text: string, color: string) => {
    const id = Date.now() + Math.random();
    setFloaters((prev) => [...prev.slice(-4), { id, side, text, color }]);
    setTimeout(() => {
      setFloaters((prev) => prev.filter((f) => f.id !== id));
    }, 1250);
  };

  const triggerEnemyCounter = (currentRightHp: number) => {
    if (currentRightHp <= 0) return;
    setTimeout(() => {
      const enemyUlt = rightEnergy >= 60;
      const baseDmg = enemyUlt ? 340 + rightStage * 60 : 185 + rightStage * 40;
      const finalDmg = leftShield ? Math.round(baseDmg * 0.35) : baseDmg;

      if (enemyUlt) {
        setBalconyFireMode('right');
        setTimeout(() => setBalconyFireMode(null), 1650);
        setRightEnergy(15);
      } else {
        setRightEnergy((e) => Math.min(100, e + 28));
      }

      spawnBreathStream('right', rightDragon.elementUz, enemyUlt);
      setShaking(true);
      setTimeout(() => setShaking(false), 320);

      if (leftShield) {
        pushFloater('left', `🛡️ -${finalDmg} (Qalqon)`, 'text-amber-300');
        setLeftShield(false);
      } else {
        pushFloater('left', `-${finalDmg} 🔥`, 'text-rose-400');
      }

      setBattleLog((prev) => [
        `🐉 ${rightDragon.name} ${enemyUlt ? 'Balkonga chiqib olov purkadi' : 'element zarbasi berdi'}: -${finalDmg} HP`,
        ...prev.slice(0, 6),
      ]);

      setLeftHp((hp) => {
        const next = Math.max(0, hp - finalDmg);
        if (next === 0) {
          setWinner('right');
          setAutoBattle(false);
          toast(`${rightDragon.name} g‘alaba qozondi! Qayta urinib ko‘ring.`, 'info');
        }
        return next;
      });
    }, 780);
  };

  const useSkill = (skillIdx: 0 | 1 | 2 | 3) => {
    if (winner || cooldowns[skillIdx] > 0) return;

    // Decrement other cooldowns and set new cooldown
    const nextCd: [number, number, number, number] = [
      Math.max(0, cooldowns[0] - 1),
      Math.max(0, cooldowns[1] - 1),
      Math.max(0, cooldowns[2] - 1),
      Math.max(0, cooldowns[3] - 1),
    ];

    if (skillIdx === 3 && leftEnergy < 60) {
      toast('Afsonaviy Portlash uchun kamida 60% energiya kerak!', 'info');
      return;
    }

    setRoundNum((r) => r + 1);

    // Skill 3 = Shield & Heal
    if (skillIdx === 2) {
      nextCd[2] = 2;
      setCooldowns(nextCd);
      setLeftShield(true);
      const heal = 260 + leftStage * 60;
      setLeftHp((hp) => Math.min(leftMaxHp, hp + heal));
      setLeftEnergy((e) => Math.min(100, e + 20));
      sfx.gift(false);
      pushFloater('left', `🛡️ +${heal} HP`, 'text-emerald-300');
      setBattleLog((prev) => [`🛡️ ${leftDragon.name} Billur Qalqonni faollashtirdi (+${heal} HP)`, ...prev.slice(0, 6)]);
      triggerEnemyCounter(rightHp);
      return;
    }

    // Offensive skills: 0 (Element Strike), 1 (Balcony Fire!), 3 (Ultimate Blast)
    const isBalconyFire = skillIdx === 1 || skillIdx === 3;
    if (skillIdx === 1) nextCd[1] = 2;
    if (skillIdx === 3) nextCd[3] = 3;
    setCooldowns(nextCd);

    const gearPower = state.equippedGearIds.length * 45;
    const rawDmg =
      skillIdx === 0
        ? 230 + leftStage * 55 + gearPower
        : skillIdx === 1
        ? 390 + leftStage * 85 + gearPower
        : 560 + leftStage * 110 + gearPower;

    const dmg = rightShield ? Math.round(rawDmg * 0.45) : rawDmg;
    setRightShield(false);

    if (isBalconyFire) {
      setBalconyFireMode('left');
      setTimeout(() => setBalconyFireMode(null), 1900);
      sfx.pkHorn();
    } else {
      sfx.gift(false);
    }

    if (skillIdx === 3) setLeftEnergy(10);
    else setLeftEnergy((e) => Math.min(100, e + (skillIdx === 1 ? 30 : 25)));

    spawnBreathStream('left', leftDragon.elementUz, isBalconyFire);
    setShaking(true);
    setTimeout(() => setShaking(false), 360);

    pushFloater(
      'right',
      isBalconyFire ? `🔥 -${dmg} BALKON OLOVI!` : `-${dmg} ⚡`,
      isBalconyFire ? 'text-amber-300' : 'text-cyan-300'
    );

    setBattleLog((prev) => [
      `🔥 ${leftDragon.name} ${isBalconyFire ? 'balkonga chiqib olov purkadi' : 'hujum qildi'}: -${dmg} HP!`,
      ...prev.slice(0, 6),
    ]);

    const nextRightHp = Math.max(0, rightHp - dmg);
    setRightHp(nextRightHp);

    if (nextRightHp <= 0) {
      setWinner('left');
      setAutoBattle(false);
      sfx.win();
      const cont = CONTINENTS_10.find((c) => c.dragonId === leftDragon.id);
      recordBattleWin(850, 15, 220, cont?.resourceCode);
      toast(`🏆 G‘ALABA! +850 WORLD COIN, +15 GEM, +18 ${cont?.resourceNameUz || 'Kristall'}`, 'success');
    } else {
      triggerEnemyCounter(nextRightHp);
    }
  };

  // Auto-Battle loop
  useEffect(() => {
    if (!autoBattle || winner) return;
    const timer = window.setInterval(() => {
      if (leftEnergy >= 60 && cooldowns[3] === 0) useSkill(3);
      else if (cooldowns[1] === 0) useSkill(1);
      else if (leftHp < leftMaxHp * 0.45 && cooldowns[2] === 0) useSkill(2);
      else useSkill(0);
    }, 1850);
    return () => window.clearInterval(timer);
  }, [autoBattle, winner, leftEnergy, cooldowns, leftHp, leftMaxHp, rightHp]);

  const resetBattle = () => {
    setLeftHp(leftMaxHp);
    setRightHp(rightMaxHp);
    setLeftEnergy(65);
    setRightEnergy(55);
    setLeftShield(false);
    setRightShield(false);
    setRoundNum(1);
    setCooldowns([0, 0, 0, 0]);
    setWinner(null);
    setBalconyFireMode(null);
    setBattleLog([`⚔️ Yangi Balkon Jangi boshlandi: ${leftDragon.name} VS ${rightDragon.name}!`]);
  };

  const leftHpPct = Math.round((leftHp / leftMaxHp) * 100);
  const rightHpPct = Math.round((rightHp / rightMaxHp) * 100);

  return (
    <div className="bg-white min-h-full pb-6">
      {/* Top Sub-Navigation */}
      <div className="px-3.5 pt-2.5 pb-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-white sticky top-[46px] z-30">
        <div className="flex items-center gap-1.5">
          {(
            [
              ['ARENA', '🐉 Balkon Jangi'],
              ['EVOLUTION', '✨ Evolyutsiya'],
              ['MINIGAMES', '🎮 Mini-O‘yinlar'],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              onClick={() => setMainTab(k)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-black transition ${
                mainTab === k
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-[#ff3366] text-[9.5px] font-black">
          ODAMLARSIZ • 1v1
        </span>
      </div>

      {/* TAB 1: PURE DRAGON BALCONY ARENA (NO HUMANS!) */}
      {mainTab === 'ARENA' && (
        <div className="px-3 pt-3 space-y-3">
          {/* CINEMATIC BALCONY BATTLE STAGE */}
          <div
            className={`relative rounded-3xl overflow-hidden bg-slate-950 border border-slate-800 shadow-xl select-none ${
              shaking ? 'animate-pulse' : ''
            }`}
          >
            {/* 1:1 VIDEO-STYLE TOP VS HUD BAR */}
            <div className="relative z-30 px-2.5 pt-2.5 pb-1.5 bg-gradient-to-b from-slate-950/90 via-slate-950/65 to-transparent">
              <div className="flex items-center justify-between gap-1.5">
                {/* Left Dragon Crest + Bars */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  <div className="relative w-10 h-10 rotate-45 rounded-lg overflow-hidden border-2 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.65)] shrink-0 ml-1">
                    <img
                      src={leftDragon.image}
                      alt={leftDragon.name}
                      className="-rotate-45 scale-135 w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pl-1">
                    <div className="flex items-center justify-between text-[10px] font-black text-white">
                      <span className="truncate">{leftDragon.name}</span>
                      <span className="text-sky-300">{leftHp}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden border border-white/15">
                      <div
                        className="h-full bg-gradient-to-r from-sky-400 via-cyan-300 to-blue-500 transition-all duration-300"
                        style={{ width: `${leftHpPct}%` }}
                      />
                    </div>
                    <div className="mt-0.5 h-1 w-3/4 bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-400 transition-all duration-300"
                        style={{ width: `${leftEnergy}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Center VS Golden Emblem */}
                <div className="flex flex-col items-center shrink-0 px-1">
                  <span className="text-[15px] font-black italic tracking-tighter bg-gradient-to-b from-yellow-200 via-amber-400 to-orange-500 bg-clip-text text-transparent drop-shadow">
                    VS
                  </span>
                  <span className="text-[8.5px] font-black text-amber-200/90 bg-black/50 px-1.5 rounded-full">
                    V{roundNum}
                  </span>
                </div>

                {/* Right Dragon Crest + Bars */}
                <div className="flex items-center gap-1.5 flex-1 min-w-0 flex-row-reverse">
                  <div className="relative w-10 h-10 rotate-45 rounded-lg overflow-hidden border-2 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.65)] shrink-0 mr-1">
                    <img
                      src={rightDragon.image}
                      alt={rightDragon.name}
                      className="-rotate-45 scale-135 w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-1 text-right">
                    <div className="flex items-center justify-between flex-row-reverse text-[10px] font-black text-white">
                      <span className="truncate">{rightDragon.name}</span>
                      <span className="text-emerald-300">{rightHp}</span>
                    </div>
                    <div className="h-2 w-full bg-slate-800/90 rounded-full overflow-hidden border border-white/15">
                      <div
                        className="h-full ml-auto bg-gradient-to-l from-emerald-400 via-lime-400 to-amber-400 transition-all duration-300"
                        style={{ width: `${rightHpPct}%` }}
                      />
                    </div>
                    <div className="mt-0.5 h-1 w-3/4 ml-auto bg-slate-800 rounded-full overflow-hidden">
                      <div
                        className="h-full ml-auto bg-rose-400 transition-all duration-300"
                        style={{ width: `${rightEnergy}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN STONE BALCONY VIEWPORT (ZERO HUMANS!) */}
            <div className="relative w-full aspect-[16/10] overflow-hidden -mt-8">
              {/* Base Stone Sky Balcony (No Humans) */}
              <img
                src="/assets/balcony-arena.jpg"
                alt="Balkon Arenasi"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Animated Pure-Dragon Balcony Fire Sequence Overlay (No Humans!) */}
              <img
                src="/assets/balcony-dragon-battle.webp"
                alt="Ajdarho Balkon Olovi"
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
                  balconyFireMode ? 'opacity-100 scale-[1.03]' : 'opacity-0 pointer-events-none'
                }`}
              />

              {/* Dark Atmospheric Contrast Vignette */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-slate-950/35 pointer-events-none" />

              {/* Left Squad Side Strip (3 Dragons — 1-Tomon) */}
              <div className="absolute left-1.5 top-11 z-20 flex flex-col gap-1">
                {leftSquadIds.map((id, idx) => {
                  const d = MYTHIC_DRAGONS.find((x) => x.id === id)!;
                  const active = idx === leftActiveIdx;
                  return (
                    <button
                      key={`ls-${id}`}
                      onClick={() => setLeftActiveIdx(idx)}
                      className={`flex items-center gap-1 p-0.5 pr-1.5 rounded-lg backdrop-blur-md border transition ${
                        active
                          ? 'bg-sky-500/35 border-sky-300 shadow'
                          : 'bg-black/45 border-white/15 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={d.image} alt={d.name} className="w-5 h-5 rounded-md object-cover" />
                      <span className="text-[8px] font-black text-white hidden sm:inline">{d.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Right Squad Side Strip (3 Dragons — 2-Tomon) */}
              <div className="absolute right-1.5 top-11 z-20 flex flex-col gap-1">
                {rightSquadIds.map((id, idx) => {
                  const d = MYTHIC_DRAGONS.find((x) => x.id === id)!;
                  const active = idx === rightActiveIdx;
                  return (
                    <button
                      key={`rs-${id}`}
                      onClick={() => setRightActiveIdx(idx)}
                      className={`flex items-center gap-1 p-0.5 pl-1.5 rounded-lg backdrop-blur-md border transition flex-row-reverse ${
                        active
                          ? 'bg-emerald-500/35 border-emerald-300 shadow'
                          : 'bg-black/45 border-white/15 opacity-75 hover:opacity-100'
                      }`}
                    >
                      <img src={d.image} alt={d.name} className="w-5 h-5 rounded-md object-cover" />
                      <span className="text-[8px] font-black text-white hidden sm:inline">{d.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* ACTIVE DRAGON COMBATANTS ON BALCONY (ONLY DRAGONS — NO HUMANS!) */}
              {!balconyFireMode && (
                <>
                  {/* Side 1 Dragon on Left Balcony */}
                  <div className="absolute left-7 bottom-9 z-10 flex flex-col items-center transition-transform duration-500">
                    <div className="relative">
                      {leftShield && (
                        <div className="absolute -inset-3 rounded-full border-2 border-amber-300 bg-amber-300/20 shadow-[0_0_24px_rgba(251,191,36,0.9)] animate-pulse" />
                      )}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-sky-400/90 shadow-[0_10px_28px_rgba(56,189,248,0.55)] bg-slate-900 animate-[bounce_3.2s_ease-in-out_infinite]">
                        <img src={leftDragon.image} alt={leftDragon.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-sky-500 text-white text-[8.5px] font-black whitespace-nowrap shadow">
                        1-TOMON • B{leftStage}
                      </span>
                    </div>
                  </div>

                  {/* Side 2 Dragon on Right Balcony */}
                  <div className="absolute right-7 bottom-9 z-10 flex flex-col items-center transition-transform duration-500">
                    <div className="relative">
                      {rightShield && (
                        <div className="absolute -inset-3 rounded-full border-2 border-emerald-300 bg-emerald-300/20 shadow-[0_0_24px_rgba(16,185,129,0.9)] animate-pulse" />
                      )}
                      <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-400/90 shadow-[0_10px_28px_rgba(16,185,129,0.55)] bg-slate-900 animate-[bounce_3.6s_ease-in-out_infinite]">
                        <img
                          src={rightDragon.image}
                          alt={rightDragon.name}
                          className="w-full h-full object-cover -scale-x-100"
                        />
                      </div>
                      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[8.5px] font-black whitespace-nowrap shadow">
                        2-TOMON • B{rightStage}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* Balcony Fire Mode Title Banner */}
              {balconyFireMode && (
                <div className="absolute top-11 left-1/2 -translate-x-1/2 z-30 max-w-[92%] text-center px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 via-red-500 to-amber-500 text-white text-[10px] font-black tracking-wide shadow-lg animate-pulse leading-tight">
                  🔥 {balconyFireMode === 'left' ? leftDragon.name : rightDragon.name} BALKONGA CHIQIB OLOV PURKADI!
                </div>
              )}

              {/* Live Elemental Fire / Lightning Breath Particle Canvas */}
              <canvas
                ref={canvasRef}
                width={420}
                height={262}
                className="absolute inset-0 w-full h-full pointer-events-none z-20"
              />

              {/* Floating Damage Popups */}
              {floaters.map((fl) => (
                <div
                  key={fl.id}
                  className={`absolute z-30 top-1/3 font-black text-sm drop-shadow-[0_2px_6px_rgba(0,0,0,0.95)] animate-bounce pointer-events-none ${
                    fl.side === 'left' ? 'left-10' : fl.side === 'right' ? 'right-10' : 'left-1/2 -translate-x-1/2'
                  } ${fl.color}`}
                >
                  {fl.text}
                </div>
              ))}

              {/* Winner Victory Banner */}
              {winner && (
                <div className="absolute inset-0 z-40 bg-slate-950/70 backdrop-blur-[2px] flex flex-col items-center justify-center p-4 text-center">
                  <Crown className="w-10 h-10 text-amber-400 mb-1 animate-bounce" />
                  <div className="text-lg font-black text-white">
                    {winner === 'left' ? `${leftDragon.name} G‘OLIB BO‘LDI!` : `${rightDragon.name} G‘OLIB BO‘LDI!`}
                  </div>
                  <p className="text-[11px] text-amber-200 font-bold mt-0.5">
                    {winner === 'left'
                      ? '+850 WORLD COIN • +15 WORLD GEM • +220 Harbiy Tajriba'
                      : 'Ajdarhongizni evolyutsiya qiling va qayta jang qiling!'}
                  </p>
                  <button
                    onClick={resetBattle}
                    className="mt-3 px-5 py-2 rounded-full btn-brand text-xs font-black flex items-center gap-1.5 shadow-lg"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Yangi Balkon Jangi</span>
                  </button>
                </div>
              )}
            </div>

            {/* 1:1 VIDEO-STYLE BOTTOM 4 SKILL BUTTONS TRAY */}
            <div className="px-2.5 py-2.5 bg-slate-950 border-t border-white/10 space-y-2">
              <div className="grid grid-cols-4 gap-1.5">
                {[
                  {
                    idx: 0 as const,
                    label: 'Zarb',
                    sub: leftDragon.elementUz.split(' ')[0],
                    icon: Swords,
                    cls: 'from-sky-500 to-blue-600 border-sky-300/60',
                  },
                  {
                    idx: 1 as const,
                    label: 'Balkon Olovi',
                    sub: 'Olov Purkash',
                    icon: Flame,
                    cls: 'from-orange-500 via-red-500 to-amber-500 border-amber-300/80',
                  },
                  {
                    idx: 2 as const,
                    label: 'Qalqon',
                    sub: 'Himoya +HP',
                    icon: Shield,
                    cls: 'from-emerald-500 to-teal-600 border-emerald-300/60',
                  },
                  {
                    idx: 3 as const,
                    label: 'Ultimate',
                    sub: `${leftEnergy}/60⚡`,
                    icon: Zap,
                    cls: 'from-purple-600 via-fuchsia-500 to-amber-400 border-yellow-300/80',
                  },
                ].map((sk) => {
                  const Icon = sk.icon;
                  const cd = cooldowns[sk.idx];
                  const lockedEnergy = sk.idx === 3 && leftEnergy < 60;
                  return (
                    <button
                      key={sk.idx}
                      disabled={Boolean(winner) || cd > 0 || lockedEnergy}
                      onClick={() => useSkill(sk.idx)}
                      className={`relative py-2 px-1 rounded-xl bg-gradient-to-b ${sk.cls} border text-white flex flex-col items-center justify-center gap-0.5 active:scale-95 transition disabled:opacity-45 shadow-md`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-[10px] font-black leading-none">{sk.label}</span>
                      <span className="text-[8.5px] font-bold text-white/85 leading-none">{sk.sub}</span>
                      <span className="absolute -top-1.5 -right-1 w-4 h-4 rounded-full bg-slate-900 border border-white/40 text-[9px] font-black flex items-center justify-center">
                        {cd > 0 ? cd : sk.idx + 1}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Battle Controls: Auto Battle + Audio Preview + Reset */}
              <div className="flex items-center justify-between gap-2 pt-0.5">
                <button
                  onClick={() => setAutoBattle((v) => !v)}
                  className={`flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-black border transition ${
                    autoBattle
                      ? 'bg-amber-400 text-slate-950 border-amber-300'
                      : 'bg-white/10 text-white border-white/15'
                  }`}
                >
                  <Play className="w-3 h-3" />
                  <span>{autoBattle ? 'Avto-Jang ON' : 'Avto-Jang'}</span>
                </button>

                <button
                  onClick={() => {
                    setBalconyFireMode('left');
                    spawnBreathStream('left', leftDragon.elementUz, true);
                    sfx.pkHorn();
                    setTimeout(() => setBalconyFireMode(null), 1900);
                  }}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-rose-500/20 border border-rose-400/40 text-rose-200 text-[10px] font-black"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>Olovni ko‘rish 🔥</span>
                </button>

                <button
                  onClick={resetBattle}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 text-slate-200 text-[10px] font-bold"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Qayta</span>
                </button>
              </div>
            </div>
          </div>

          {/* 1-TOMON & 2-TOMON DRAGON PICKER (CHOOSE ANY OF THE 10 DRAGONS) */}
          <div className="card-white rounded-2xl p-3 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">🐉 1-Tomon va 2-Tomon Ajdarholarini tanlash</span>
              <span className="text-[10px] font-bold text-slate-400">10 ta Ajdarho</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-sky-600">1-Tomon (Sizning Ajdarho)</label>
                <select
                  value={leftDragon.id}
                  onChange={(e) => {
                    const next = [...leftSquadIds];
                    next[leftActiveIdx] = e.target.value;
                    setLeftSquadIds(next);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                >
                  {MYTHIC_DRAGONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.elementUz})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-emerald-600">2-Tomon (Raqib Ajdarho)</label>
                <select
                  value={rightDragon.id}
                  onChange={(e) => {
                    const next = [...rightSquadIds];
                    next[rightActiveIdx] = e.target.value;
                    setRightSquadIds(next);
                  }}
                  className="w-full px-2.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900"
                >
                  {MYTHIC_DRAGONS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.elementUz})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Live Battle Ticker */}
            <div className="bg-slate-50 rounded-xl p-2 space-y-1 border border-slate-100">
              {battleLog.slice(0, 3).map((line, i) => (
                <div key={i} className={`text-[10.5px] font-semibold ${i === 0 ? 'text-slate-900' : 'text-slate-500'}`}>
                  {line}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DRAGON EVOLUTION ("Evolyutsiya qilish") */}
      {mainTab === 'EVOLUTION' && (
        <div className="px-3.5 pt-3 space-y-3">
          <div className="rounded-2xl p-3.5 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
            <div>
              <div className="text-sm font-black flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ajdarholarni Evolyutsiya qilish</span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Bosqich 1 → Bosqich 2 (Ulkan) → Bosqich 3 (Afsonaviy Balkon Olovi)
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {MYTHIC_DRAGONS.map((d) => {
              const stage = state.dragonStages[d.id] || 1;
              const nextCost = stage * 2500;
              return (
                <div key={d.id} className="card-white rounded-2xl overflow-hidden flex flex-col">
                  <div className="relative h-28 bg-slate-950">
                    <img src={d.image} alt={d.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[9px] font-black">
                      Bosqich {stage}/3
                    </span>
                    <div className="absolute bottom-2 left-2.5 text-white">
                      <div className="text-xs font-black leading-tight">{d.name}</div>
                      <div className="text-[9.5px] text-amber-200">{d.titleUz}</div>
                    </div>
                  </div>
                  <div className="p-2.5 space-y-2 flex-1 flex flex-col justify-between">
                    <div className="space-y-0.5">
                      <div className="text-[10px] font-bold text-slate-500">Element: {d.elementUz}</div>
                      <div className="text-[10px] font-semibold text-slate-700 line-clamp-2">{d.powerUz}</div>
                    </div>
                    <button
                      disabled={stage >= 3}
                      onClick={() => evolveDragon(d.id)}
                      className={`w-full py-1.5 rounded-full text-[10.5px] font-black flex items-center justify-center gap-1 transition ${
                        stage >= 3
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'btn-brand'
                      }`}
                    >
                      <ArrowUpCircle className="w-3.5 h-3.5" />
                      <span>{stage >= 3 ? 'Maksimal (Afsonaviy)' : `Evolyutsiya (${nextCost})`}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: CLASSIC MINI-GAMES (Lucky Wheel, Ludo, Chiz va Top) */}
      {mainTab === 'MINIGAMES' && (
        <div className="px-3.5 pt-3 space-y-3">
          <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-full">
            {(
              [
                ['wheel', '🎡 Charx'],
                ['ludo', '🎲 Ludo'],
                ['draw', '🎨 Chiz'],
              ] as const
            ).map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setMiniTab(k)}
                className={`py-1.5 rounded-full text-xs font-extrabold transition ${
                  miniTab === k ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                }`}
              >
                {lbl}
              </button>
            ))}
          </div>

          <div className="card-white rounded-3xl p-3">
            {miniTab === 'wheel' ? (
              <LuckyWheelGame />
            ) : miniTab === 'ludo' ? (
              <LudoGame />
            ) : (
              <DrawGuessGame />
            )}
          </div>
        </div>
      )}
    </div>
  );
};
