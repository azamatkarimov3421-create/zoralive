import React, { Suspense, lazy, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, Power, KeyRound } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorldProvider } from './context/WorldContext';
import { BottomNav } from './components/BottomNav';
import { FloatingVoiceBar } from './components/FloatingVoiceBar';
import { CreateRoomModal } from './components/CreateRoomModal';
import { isGateSessionValid, verifyGatePin } from './lib/security';

const AuthPage = lazy(() => import('./pages/AuthPage').then((m) => ({ default: m.AuthPage })));
const HomePage = lazy(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const VoiceRoomPage = lazy(() => import('./pages/VoiceRoomPage').then((m) => ({ default: m.VoiceRoomPage })));
const VideoRoomPage = lazy(() => import('./pages/VideoRoomPage').then((m) => ({ default: m.VideoRoomPage })));
const GamesPage = lazy(() => import('./pages/GamesPage').then((m) => ({ default: m.GamesPage })));
const ShopPage = lazy(() => import('./pages/ShopPage').then((m) => ({ default: m.ShopPage })));
const SocialPage = lazy(() => import('./pages/SocialPage').then((m) => ({ default: m.SocialPage })));
const ProfilePage = lazy(() => import('./pages/ProfilePage').then((m) => ({ default: m.ProfilePage })));
const GovernanceSuitePage = lazy(() =>
  import('./pages/GovernanceSuitePage').then((m) => ({ default: m.GovernanceSuitePage }))
);
const StaffRolePanelPage = lazy(() =>
  import('./pages/StaffRolePanelPage').then((m) => ({ default: m.StaffRolePanelPage }))
);

const PageLoader: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center gap-2.5">
    <img src="/icon.svg" alt="ZoraLive" className="w-10 h-10 rounded-2xl animate-pulse" />
    <span className="text-[11px] font-bold text-slate-500">Yuklanmoqda...</span>
  </div>
);

const SitePasswordGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unlocked, setUnlocked] = useState<boolean>(() => isGateSessionValid('site'));
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  if (unlocked) return <>{children}</>;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (checking) return;
    setChecking(true);
    setError('');
    try {
      const res = await verifyGatePin('site', pin);
      if (res.ok) {
        setUnlocked(true);
        setPin('');
      } else {
        setError(res.error || 'Yoqish kodi noto‘g‘ri');
        setPin('');
      }
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden">
      <div className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 left-1/2 -translate-x-[240px] w-80 h-80 rounded-full bg-rose-400/24 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 translate-x-[40px] w-80 h-80 rounded-full bg-sky-400/26 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/2 -translate-x-[160px] w-80 h-80 rounded-full bg-violet-400/22 blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-xs bg-white/80 backdrop-blur-2xl border-2 border-white rounded-3xl p-6 shadow-2xl space-y-4 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-rose-500/12 border border-rose-200/80 flex items-center justify-center shadow-inner">
          <Power className="w-8 h-8 text-rose-600" />
        </div>
        <div className="space-y-1">
          <h1 className="text-lg font-black text-slate-900">Baza o‘chiq</h1>
          <p className="text-xs font-semibold text-slate-500">
            ZoraLive bazasi hozircha o‘chirilgan. Yoqish uchun kodni kiriting.
          </p>
        </div>

        {!showCodeInput ? (
          <button
            type="button"
            onClick={() => {
              setShowCodeInput(true);
              setError('');
            }}
            className="w-full py-3 rounded-full btn-brand text-sm font-black shadow-lg active:scale-95 transition cursor-pointer flex items-center justify-center gap-1.5"
          >
            <KeyRound className="w-4 h-4" />
            <span>Yoqish kodi</span>
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="flex items-center gap-2 bg-white/90 border border-slate-200 rounded-2xl px-3.5 py-2.5">
              <KeyRound className="w-4 h-4 text-[#ff3366] shrink-0" />
              <input
                type="password"
                inputMode="numeric"
                autoFocus
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  if (error) setError('');
                }}
                placeholder="Yoqish kodini kiriting"
                className="flex-1 bg-transparent text-sm font-black tracking-widest text-slate-900 focus:outline-none"
              />
            </div>

            {error && <div className="text-xs font-extrabold text-rose-600">{error}</div>}

            <button
              type="submit"
              disabled={checking}
              className="w-full py-3 rounded-full btn-brand text-sm font-black shadow-lg active:scale-95 transition cursor-pointer disabled:opacity-60"
            >
              {checking ? 'Tekshirilmoqda...' : 'Bazani yoqish'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

const AppShell: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [wideMode, setWideMode] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-3">
        <img src="/icon.svg" alt="ZoraLive" className="w-12 h-12 rounded-2xl animate-pulse" />
      </div>
    );
  }

  const isAdminRoute = location.pathname.startsWith('/admin');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/auth';
  const isRoomRoute = location.pathname.startsWith('/voice/') || location.pathname.startsWith('/video/');

  if (isAdminRoute) {
    return (
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/admin" element={<GovernanceSuitePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    );
  }

  if (!user && !isAuthRoute) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen flex justify-center relative overflow-x-clip">
      {/* Global Aurora Crystal Orbs sitting outside phone shell so sticky & fixed modals never break */}
      <div className="pointer-events-none select-none fixed inset-0 overflow-hidden z-0">
        <div className="absolute -top-24 left-1/2 -translate-x-[240px] w-80 h-80 rounded-full bg-rose-400/24 blur-3xl" />
        <div className="absolute top-1/3 left-1/2 translate-x-[40px] w-80 h-80 rounded-full bg-sky-400/26 blur-3xl" />
        <div className="absolute bottom-[-80px] left-1/2 -translate-x-[160px] w-80 h-80 rounded-full bg-violet-400/22 blur-3xl" />
      </div>

      {/* Desktop Mobile/Wide Switch - Subtle desktop-only helper outside phone frame */}
      {!isAuthRoute && (
        <div className="hidden lg:flex fixed top-3 right-3 z-50 items-center">
          <button
            onClick={() => setWideMode((v) => !v)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/55 backdrop-blur-xl border-2 border-white/90 shadow-md text-[11px] font-black text-slate-900 hover:bg-white/80 active:scale-95 transition cursor-pointer"
          >
            {wideMode ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
            <span>{wideMode ? 'Mobil' : 'Keng'}</span>
          </button>
        </div>
      )}

      <div
        className={`w-full min-h-screen bg-white/15 flex flex-col relative z-10 shadow-[0_0_60px_rgba(15,23,42,0.12)] ${
          wideMode ? 'max-w-3xl' : 'max-w-[430px] md:border-x-2 md:border-white/75'
        }`}
      >
        {/* Persistent Voice Room Bar across World / Jang / Market / Profile (Section 8) */}
        {!isAuthRoute && <FloatingVoiceBar />}

        <main className="flex-1">
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage onGoLive={() => setCreateOpen(true)} />} />
              <Route path="/login" element={<AuthPage />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/voice/:id" element={<VoiceRoomPage />} />
              <Route path="/video/:id" element={<VideoRoomPage />} />
              <Route path="/games" element={<GamesPage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/social" element={<SocialPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/staff-panel" element={<StaffRolePanelPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </main>

        {!isRoomRoute && !isAuthRoute && Boolean(user) && <BottomNav onGoLive={() => setCreateOpen(true)} />}

        <CreateRoomModal
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          onCreated={(room) => {
            if (room.type === 'VIDEO') navigate(`/video/${room.id}`);
            else navigate(`/voice/${room.id}`);
          }}
        />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <SitePasswordGate>
      <BrowserRouter>
        <AuthProvider>
          <WorldProvider>
            <AppShell />
          </WorldProvider>
        </AuthProvider>
      </BrowserRouter>
    </SitePasswordGate>
  );
}
