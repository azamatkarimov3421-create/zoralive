import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, User as UserIcon, Sparkles, Crown, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Lang } from '../types';

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    user,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    loginWithUsername,
    lang,
    setLang,
    toast,
  } = useAuth();

  const [mode, setMode] = useState<'quick' | 'login' | 'register'>('quick');
  const [quickName, setQuickName] = useState('');
  const [identifier, setIdentifier] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);

  const isEmail = identifier.includes('@');

  // Auto-redirect after OAuth callback completes (implicit hash OR PKCE code)
  useEffect(() => {
    if (
      user &&
      (window.location.hash.includes('access_token') || window.location.search.includes('code='))
    ) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleGoogleLogin = async () => {
    setBusy(true);
    try {
      await loginWithGoogle();
    } catch {
      // toast shown in context
    } finally {
      setBusy(false);
    }
  };

  const handleQuickNameSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = quickName.trim();
    if (clean.length < 2) {
      toast('Ismingizni kamida 2 ta harf bilan yozing', 'error');
      return;
    }
    setBusy(true);
    try {
      const uname =
        clean
          .toLowerCase()
          .replace(/[^a-z0-9_]/g, '')
          .slice(0, 16) || `user_${Date.now().toString().slice(-4)}`;
      await loginWithUsername(uname, clean);
      navigate('/', { replace: true });
    } catch {
      // toast shown in context
    } finally {
      setBusy(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = identifier.trim();
    if (!cleanId) {
      toast('Iltimos, Gmail yoki username kiriting', 'error');
      return;
    }
    setBusy(true);
    try {
      if (mode === 'register') {
        const chosenName = (displayName || (isEmail ? cleanId.split('@')[0] : cleanId)).trim();
        if (isEmail) {
          await registerWithEmail(cleanId, password, chosenName);
        } else {
          await loginWithUsername(cleanId, chosenName);
        }
      } else {
        if (isEmail) {
          await loginWithEmail(cleanId, password);
        } else {
          await loginWithUsername(cleanId);
        }
      }
      navigate('/', { replace: true });
    } catch {
      // toast shown in context
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-5 relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div className="pointer-events-none absolute -top-40 -left-40 w-96 h-96 bg-cyan-500/20 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 w-96 h-96 bg-rose-500/20 rounded-full blur-[120px]" />

      {/* Top Left Controls */}
      <div className="absolute top-4 left-4 flex items-center gap-2 z-20">
        {user && (
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/15 border border-white/15 text-white/90 text-xs font-bold transition active:scale-95 cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Profilga qaytish</span>
          </button>
        )}
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 text-xs font-black shadow-lg transition active:scale-95 cursor-pointer"
        >
          <Crown className="w-3.5 h-3.5 fill-current" />
          <span>Ega Paneli</span>
        </button>
      </div>

      {/* Language Switcher */}
      <div className="absolute top-4 right-4 flex gap-1 bg-white/10 border border-white/10 rounded-full p-1">
        {(['uz', 'ru', 'en'] as Lang[]).map((l) => (
          <button
            key={l}
            onClick={() => setLang(l)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase transition ${
              lang === l ? 'bg-white text-slate-950 shadow-sm' : 'text-white/60 hover:text-white'
            }`}
          >
            {l}
          </button>
        ))}
      </div>

      <div className="w-full max-w-sm space-y-5 relative z-10">
        {/* App Logo & Title */}
        <div className="flex flex-col items-center text-center">
          <div className="relative">
            <img
              src="/icon.svg"
              alt="ZoraLive"
              className="w-16 h-16 rounded-3xl mb-2.5 shadow-2xl shadow-cyan-500/30 border border-white/20"
            />
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-cyan-500" />
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
            ZoraLive <Sparkles className="w-5 h-5 text-amber-400" />
          </h1>
          <p className="text-xs text-white/60 mt-0.5">Jonli Efir, Ajdarholar va VIP Suhbatlar</p>
        </div>

        {/* 1. GOOGLE / GMAIL ONE-TAP SIGN-IN & SIGN-UP */}
        <div className="space-y-1.5">
          <button
            type="button"
            disabled={busy}
            onClick={handleGoogleLogin}
            className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-slate-100 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-3 shadow-xl hover:shadow-cyan-500/20 active:scale-98 transition disabled:opacity-60 cursor-pointer"
          >
            {/* Official Google Multi-color Logo SVG */}
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>
              {mode === 'register'
                ? 'Google / Gmail bilan ro‘yxatdan o‘tish'
                : 'Google bilan kirish / ro‘yxatdan o‘tish'}
            </span>
          </button>
          <p className="text-[11px] text-center text-white/50">
            Yangi foydalanuvchi bo‘lsangiz, Google orqali avtomatik yangi profil ochiladi
          </p>
        </div>

        {/* OR DIVIDER */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/15" />
          <span className="text-[11px] font-bold text-white/40 uppercase tracking-wider">yoki</span>
          <div className="flex-1 h-px bg-white/15" />
        </div>

        {/* MODE SWITCHER TABS: TEZ KIRISH / GMAIL KIRISH / RO'YXATDAN O'TISH */}
        <div className="grid grid-cols-3 gap-1 bg-white/10 p-1 rounded-2xl border border-white/10">
          <button
            type="button"
            onClick={() => setMode('quick')}
            className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer flex items-center justify-center gap-1 ${
              mode === 'quick' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-white/75 hover:text-white'
            }`}
          >
            <Zap className="w-3 h-3 fill-current" />
            <span>Tez kirish</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer ${
              mode === 'login' ? 'bg-white text-slate-950 shadow-md' : 'text-white/75 hover:text-white'
            }`}
          >
            Gmail kirish
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 rounded-xl text-[11px] font-black transition cursor-pointer ${
              mode === 'register' ? 'bg-white text-slate-950 shadow-md' : 'text-white/75 hover:text-white'
            }`}
          >
            Ro‘yxatdan o‘tish
          </button>
        </div>

        {mode === 'quick' ? (
          <form onSubmit={handleQuickNameSubmit} className="space-y-3">
            <div className="relative">
              <UserIcon className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={quickName}
                onChange={(e) => setQuickName(e.target.value)}
                required
                placeholder="Ismingizni yozing (masalan: Azamat)"
                className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-white/10 border border-white/20 text-sm text-white placeholder:text-white/45 focus:outline-none focus:border-amber-400 focus:bg-white/15 transition"
              />
            </div>
            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 active:scale-98 transition disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Kirilmoqda...' : 'Tez kirish (1 soniyada) →'}
            </button>
            <p className="text-[11px] text-center text-white/50">
              Parolsiz va muammosiz — faqat ismingiz bilan o‘z profilingiz ochiladi
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Identifier: Email / Gmail or Username */}
            <div className="relative">
              <Mail className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                placeholder={mode === 'register' ? 'Gmail manzilingiz (masalan: misol@gmail.com)' : 'Gmail yoki Username'}
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition"
              />
            </div>

            {/* Display Name (Only in Register mode) */}
            {mode === 'register' && (
              <div className="relative">
                <UserIcon className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Ismingiz (ko‘rinadigan ism)"
                  className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition"
                />
              </div>
            )}

            {/* Password */}
            <div className="relative">
              <Lock className="w-4 h-4 text-white/40 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Parol"
                className="w-full pl-11 pr-4 py-3 rounded-2xl bg-white/10 border border-white/15 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-cyan-400 focus:bg-white/15 transition"
              />
            </div>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 via-sky-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm shadow-xl shadow-cyan-500/25 active:scale-98 transition disabled:opacity-60 cursor-pointer"
            >
              {busy ? 'Kutilmoqda...' : mode === 'login' ? 'Tizimga kirish' : 'Hisob yaratish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
