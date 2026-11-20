import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor, Shield } from 'lucide-react';
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
  const { loading } = useAuth();
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
  const isRoomRoute = location.pathname.startsWith('/voice/') || location.pathname.startsWith('/video/');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<GovernanceSuitePage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f6] flex justify-center relative">
      {/* Desktop Controls: 7-Role Governance Panel + Mobile/Wide Switch */}
      <div className="hidden md:flex fixed top-3 right-3 z-40 items-center gap-2">
        <button
          onClick={() => navigate('/admin')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900 text-amber-300 shadow-sm text-[11px] font-black hover:bg-slate-800"
        >
          <Shield className="w-3.5 h-3.5" />
          <span>Owner & 7 Panel</span>
        </button>

        <button
          onClick={() => setWideMode((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700 hover:bg-slate-50"
        >
          {wideMode ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
          <span>{wideMode ? 'Mobil' : 'Keng'}</span>
        </button>
      </div>

      <div
        className={`w-full min-h-screen bg-white flex flex-col relative shadow-[0_0_50px_rgba(15,23,42,0.08)] ${
          wideMode ? 'max-w-3xl' : 'max-w-[430px] md:border-x md:border-slate-200/80'
        }`}
      >
        {/* Persistent Voice Room Bar across World / Jang / Market / Profile (Section 8) */}
        <FloatingVoiceBar />

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage onGoLive={() => setCreateOpen(true)} />} />
            <Route path="/login" element={<AuthPage />} />
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

        {!isRoomRoute && <BottomNav onGoLive={() => setCreateOpen(true)} />}

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
