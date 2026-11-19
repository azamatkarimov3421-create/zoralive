import React, { useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { sfx } from '../lib/sound';

interface Sector {
  id: string;
  label: string;
  icon: string;
  multiplier: number;
  color: string;
}

interface SpinRecord {
  id: string;
  display_name: string;
  bet_amount: number;
  sector_label: string;
  multiplier: number;
  win_amount: number;
}

const BET_CHIPS = [10, 50, 100, 500, 1000];

export const LuckyWheelGame: React.FC<{ roomId?: string; compact?: boolean }> = ({
  roomId,
  compact = false,
}) => {
  const { updateCoinsLocally, toast } = useAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [recent, setRecent] = useState<SpinRecord[]>([]);
  const [bet, setBet] = useState<number>(50);
  const [rotation, setRotation] = useState<number>(0);
  const [spinning, setSpinning] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<{
    sector: Sector;
    winAmount: number;
    bet: number;
  } | null>(null);

  const loadConfig = async () => {
    try {
      const data = await api<{ sectors: Sector[]; recent: SpinRecord[] }>('/games/wheel/config');
      setSectors(data.sectors);
      setRecent(data.recent);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    loadConfig();
  }, []);

  const handleSpin = async () => {
    if (spinning || sectors.length === 0) return;
    setSpinning(true);
    setLastResult(null);
    sfx.tick();

    try {
      const res = await api<{
        sectorIndex: number;
        sector: Sector;
        bet: number;
        winAmount: number;
        coins: number;
      }>('/games/wheel/spin', {
        method: 'POST',
        body: JSON.stringify({ bet, roomId }),
      });

      const sliceAngle = 360 / sectors.length;
      const targetCenter = res.sectorIndex * sliceAngle + sliceAngle / 2;
      const desiredMod = (360 - targetCenter + 360) % 360;
      const currentMod = ((rotation % 360) + 360) % 360;
      const delta = (desiredMod - currentMod + 360) % 360;
      setRotation(rotation + 360 * 5 + delta);

      let ticks = 0;
      const tickInterval = setInterval(() => {
        ticks++;
        sfx.tick();
        if (ticks >= 12) clearInterval(tickInterval);
      }, 210);

      setTimeout(() => {
        clearInterval(tickInterval);
        updateCoinsLocally(res.coins);
        setLastResult({ sector: res.sector, winAmount: res.winAmount, bet: res.bet });
        setSpinning(false);
        if (res.winAmount > 0) sfx.win();
        loadConfig();
      }, 3200);
    } catch (err: any) {
      setSpinning(false);
      toast(err.message, 'error');
    }
  };

  const count = sectors.length || 8;
  const sliceDeg = 360 / count;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Wheel */}
      <div className="relative flex items-center justify-center my-2">
        <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[11px] border-l-transparent border-r-[11px] border-r-transparent border-t-[18px] border-t-slate-900" />

        <div
          className={`${compact ? 'w-56 h-56' : 'w-64 h-64'} rounded-full p-2 bg-white border-4 border-slate-200 shadow-lg`}
        >
          <div
            className="w-full h-full rounded-full overflow-hidden relative"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 3.2s cubic-bezier(0.16, 1, 0.24, 1)' : 'none',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {sectors.map((s, idx) => {
                const startA = ((idx * sliceDeg - 90) * Math.PI) / 180;
                const endA = (((idx + 1) * sliceDeg - 90) * Math.PI) / 180;
                const x1 = 100 + 100 * Math.cos(startA);
                const y1 = 100 + 100 * Math.sin(startA);
                const x2 = 100 + 100 * Math.cos(endA);
                const y2 = 100 + 100 * Math.sin(endA);
                const midAngle = idx * sliceDeg + sliceDeg / 2;

                return (
                  <g key={s.id}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={s.color}
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                    <g transform={`rotate(${midAngle}, 100, 100)`}>
                      <text x="100" y="34" textAnchor="middle" fontSize="19">
                        {s.icon}
                      </text>
                      <text x="100" y="52" textAnchor="middle" fontSize="11" fontWeight="800" fill="#ffffff">
                        x{s.multiplier}
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        <button
          disabled={spinning}
          onClick={handleSpin}
          className="absolute z-20 w-15 h-15 rounded-full bg-slate-900 text-white font-black text-xs shadow-lg border-4 border-white flex flex-col items-center justify-center active:scale-95 transition"
        >
          <RotateCw className={`w-4 h-4 ${spinning ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {lastResult && (
        <div
          className={`w-full px-4 py-2.5 rounded-2xl text-center text-xs font-extrabold border ${
            lastResult.winAmount > 0
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          {lastResult.winAmount > 0
            ? `${lastResult.sector.icon} +${lastResult.winAmount} tanga`
            : `${lastResult.sector.icon} 0`}
        </div>
      )}

      <div className="w-full grid grid-cols-5 gap-1.5">
        {BET_CHIPS.map((amt) => (
          <button
            key={amt}
            disabled={spinning}
            onClick={() => setBet(amt)}
            className={`py-2 rounded-xl text-xs font-extrabold border transition ${
              bet === amt
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            {amt}
          </button>
        ))}
      </div>

      <button
        disabled={spinning}
        onClick={handleSpin}
        className="w-full py-3 rounded-full btn-brand font-extrabold text-sm active:scale-98 transition disabled:opacity-50"
      >
        {spinning ? '...' : `Aylantirish (${bet} 🪙)`}
      </button>

      {!compact && recent.length > 0 && (
        <div className="w-full card-white rounded-2xl divide-y divide-slate-100 overflow-hidden">
          {recent.slice(0, 6).map((r) => (
            <div key={r.id} className="flex items-center justify-between text-xs px-3.5 py-2">
              <span className="font-bold text-slate-800 truncate max-w-[45%]">{r.display_name}</span>
              <span className="text-slate-500">{r.sector_label}</span>
              <span className={`font-extrabold ${r.win_amount > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                {r.win_amount > 0 ? `+${r.win_amount}` : `-${r.bet_amount}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
