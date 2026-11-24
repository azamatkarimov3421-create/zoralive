import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WorldProvider } from './context/WorldContext';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { VoiceRoomPage } from './pages/VoiceRoomPage';
import { VideoRoomPage } from './pages/VideoRoomPage';
import { GamesPage } from './pages/GamesPage';
import { DragonArenaPage } from './pages/DragonArenaPage';
import { WorldMapPage } from './pages/WorldMapPage';
import { MarketPage } from './pages/MarketPage';
import { ShopPage } from './pages/ShopPage';
import { SocialPage } from './pages/SocialPage';
import { ProfilePage } from './pages/ProfilePage';
import { GovernanceSuitePage } from './pages/GovernanceSuitePage';
import { BottomNav } from './components/BottomNav';
import { FloatingVoiceBar } from './components/FloatingVoiceBar';
import { CreateRoomModal } from './components/CreateRoomModal';

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
      <Routes>
        <Route path="/admin" element={<GovernanceSuitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
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
          <Routes>
            <Route path="/" element={<HomePage onGoLive={() => setCreateOpen(true)} />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/voice/:id" element={<VoiceRoomPage />} />
            <Route path="/video/:id" element={<VideoRoomPage />} />
            <Route path="/games" element={<GamesPage />} />
            <Route path="/battle" element={<DragonArenaPage />} />
            <Route path="/world" element={<WorldMapPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/social" element={<SocialPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
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
    <BrowserRouter>
      <AuthProvider>
        <WorldProvider>
          <AppShell />
        </WorldProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
