import React, { useState } from 'react';
import { Gamepad2, Power, KeyRound, ShieldCheck, Lock } from 'lucide-react';
import { clearGateSession, isGateSessionValid, verifyGatePin } from '../lib/security';

export const GamesPage: React.FC = () => {
  const [unlocked, setUnlocked] = useState<boolean>(() => isGateSessionValid('games'));
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError('');
    try {
      const res = await verifyGatePin('games', code);
      if (res.ok) {
        setUnlocked(true);
        setShowCodeInput(false);
        setCode('');
      } else {
        setError(res.error || 'Yoqish kodi noto‘g‘ri!');
        setCode('');
      }
    } finally {
      setChecking(false);
    }
  };

  const handleTurnOff = () => {
    clearGateSession('games');
    setUnlocked(false);
    setShowCodeInput(false);
    setCode('');
    setError('');
  };

  return (
    <div className="min-h-screen app-shell pb-24">
      <header className="sticky top-0 z-30 glass-header px-4 pt-3.5 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                unlocked
                  ? 'bg-emerald-500/15 text-emerald-600'
                  : 'bg-rose-500/15 text-rose-600'
              }`}
            >
              <Gamepad2 className="w-4 h-4" />
            </span>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">O‘yinlar</h1>
              <p className={`text-[10.5px] font-bold ${unlocked ? 'text-emerald-600' : 'text-rose-500'}`}>
                {unlocked ? 'O‘yin bazasi yoqilgan' : 'O‘yin bazasi o‘chgan'}
              </p>
            </div>
          </div>

          {unlocked && (
            <button
              type="button"
              onClick={handleTurnOff}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-500/15 border border-rose-300/60 text-rose-700 text-[11px] font-black cursor-pointer active:scale-95 transition"
            >
              <Lock className="w-3 h-3" />
              <span>O‘chirish</span>
            </button>
          )}
        </div>
      </header>

      <main className="px-4 pt-10 max-w-md mx-auto">
        {!unlocked ? (
          <div className="card-white rounded-3xl p-7 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/12 border border-rose-200/70 text-rose-600 flex items-center justify-center shadow-inner">
              <Power className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h2 className="text-base font-black text-slate-900">O‘yin bazasi o‘chgan</h2>
              <p className="text-xs font-semibold text-slate-500">
                O‘yinlar bo‘limi hozircha o‘chirilgan. Faollashtirish uchun yoqish kodini kiriting.
              </p>
            </div>

            {!showCodeInput ? (
              <button
                type="button"
                onClick={() => {
                  setShowCodeInput(true);
                  setError('');
                }}
                className="w-full py-3 rounded-full btn-brand text-xs font-black flex items-center justify-center gap-1.5 shadow-lg active:scale-95 transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Yoqish kodi</span>
              </button>
            ) : (
              <form onSubmit={handleActivate} className="space-y-3 pt-1">
                <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-2xl px-3.5 py-2.5">
                  <KeyRound className="w-4 h-4 text-[#ff3366] shrink-0" />
                  <input
                    type="password"
                    inputMode="numeric"
                    autoFocus
                    value={code}
                    onChange={(e) => {
                      setCode(e.target.value);
                      if (error) setError('');
                    }}
                    placeholder="Yoqish kodini kiriting"
                    className="flex-1 bg-transparent text-sm font-black tracking-widest text-slate-900 focus:outline-none"
                  />
                </div>

                {error && <div className="text-xs font-extrabold text-rose-600">{error}</div>}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCodeInput(false);
                      setCode('');
                      setError('');
                    }}
                    className="px-4 py-2.5 rounded-full bg-slate-100 text-slate-700 text-xs font-black cursor-pointer"
                  >
                    Bekor
                  </button>
                  <button
                    type="submit"
                    disabled={checking}
                    className="flex-1 py-2.5 rounded-full btn-brand text-xs font-black shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-60"
                  >
                    {checking ? 'Tekshirilmoqda...' : 'Bazani yoqish'}
                  </button>
                </div>
              </form>
            )}
          </div>
        ) : (
          <div className="card-white rounded-3xl p-7 text-center space-y-3">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-500/15 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <h2 className="text-base font-black text-slate-900">O‘yin bazasi yoqildi</h2>
            <p className="text-xs font-semibold text-slate-500">
              Baza faol holatda. Yangi o‘yinlar qo‘shilganda shu yerda ko‘rinadi.
            </p>
          </div>
        )}
      </main>
    </div>
  );
};
