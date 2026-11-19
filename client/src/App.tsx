import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Smartphone, Monitor } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AuthPage } from './pages/AuthPage';
import { HomePage } from './pages/HomePage';
import { VoiceRoomPage } from './pages/VoiceRoomPage';
import { VideoRoomPage } from './pages/VideoRoomPage';
import { GamesPage } from './pages/GamesPage';
import { SocialPage } from './pages/SocialPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { BottomNav } from './components/BottomNav';
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
  const isRoomRoute = location.pathname.startsWith('/voice/') || location.pathname.startsWith('/video/');

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<AdminPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-[#eef1f6] flex justify-center relative">
      <button
        onClick={() => setWideMode((v) => !v)}
        className="hidden md:flex fixed top-3 right-3 z-40 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[11px] font-bold text-slate-700 hover:bg-slate-50"
      >
        {wideMode ? <Smartphone className="w-3.5 h-3.5" /> : <Monitor className="w-3.5 h-3.5" />}
        <span>{wideMode ? 'Mobil' : 'Keng'}</span>
      </button>

      <div
        className={`w-full min-h-screen bg-white flex flex-col relative shadow-[0_0_50px_rgba(15,23,42,0.08)] ${
          wideMode ? 'max-w-3xl' : 'max-w-[430px] md:border-x md:border-slate-200/80'
        }`}
      >
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route path="/voice/:id" element={<VoiceRoomPage />} />
            <Route path="/video/:id" element={<VideoRoomPage />} />
            <Route path="/games" element={<GamesPage />} />
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
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  );
}
