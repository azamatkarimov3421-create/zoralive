import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, MessageCircle, Users, ChevronDown, ChevronUp, Radio, X } from 'lucide-react';
import { useWorld } from '../context/WorldContext';
import { useAuth } from '../context/AuthContext';
import { fetchAllProfilesFromSupabase } from '../lib/supabaseSync';
import { getSocket } from '../lib/socket';
import { User } from '../types';
import { LiveWaveBars } from './LuxuryBadges';
import { Avatar } from './Avatar';

export const FloatingVoiceBar: React.FC = () => {
  const { user } = useAuth();
  const {
    voiceConnected,
    micEnabled,
    activeVoiceRoomId,
    activeVoiceRoomTitle,
    onlineVoiceCount,
    toggleMic,
    leaveVoiceRoomMeta,
  } = useWorld();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);
  const [liveProfiles, setLiveProfiles] = useState<User[]>([]);

  useEffect(() => {
    if (!expanded) return;
    fetchAllProfilesFromSupabase()
      .then((list) => setLiveProfiles(list.filter((p) => p.id !== user?.id).slice(0, 12)))
      .catch(() => {});
  }, [expanded, user?.id]);

  // Don't show if not connected to an active voice room, or inside actual room / login screen
  if (
    !voiceConnected ||
    location.pathname.startsWith('/voice/') ||
    location.pathname.startsWith('/video/') ||
    location.pathname === '/login'
  ) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-white/70 backdrop-blur-2xl border-b border-white/85 shadow-[0_4px_16px_rgba(15,23,42,0.06)]">
      <div className="px-3 py-1.5 flex items-center justify-between gap-2">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 min-w-0 text-left flex-1 cursor-pointer"
        >
          <span className="relative w-7 h-7 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0">
            {voiceConnected ? (
              <LiveWaveBars color="bg-emerald-500" className="h-3" />
            ) : (
              <Radio className="w-3.5 h-3.5 text-slate-400" />
            )}
            {voiceConnected && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            )}
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-black text-slate-900 truncate max-w-[135px]">
                {activeVoiceRoomTitle || 'Ovozli Suhbat'}
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[9px] font-extrabold">
                {onlineVoiceCount} online
              </span>
            </div>
            <div className="text-[9.5px] font-semibold text-slate-500 flex items-center gap-1">
              <span>{voiceConnected ? 'Mikrofon sessiyasi faol' : 'Kuzatuv rejimi'}</span>
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleMic}
            title={micEnabled ? 'Mikrofonni o‘chirish' : 'Mikrofonni yoqish'}
            className={`p-1.5 rounded-full border transition cursor-pointer ${
              micEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => navigate(`/voice/${activeVoiceRoomId}`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold active:scale-95 transition cursor-pointer"
          >
            <MessageCircle className="w-3 h-3 text-amber-300" />
            <span>Chatga qaytish</span>
          </button>

          <button
            onClick={() => {
              if (activeVoiceRoomId) getSocket().emit('room:leave', { roomId: activeVoiceRoomId });
              leaveVoiceRoomMeta();
            }}
            title="Xonadan chiqish"
            className="p-1.5 rounded-full bg-rose-500/15 border border-rose-300/70 text-rose-600 hover:bg-rose-500/25 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-1.5 border-t border-white/70 bg-white/50 backdrop-blur-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800">
              <Users className="w-3.5 h-3.5 text-[#ff3366]" />
              <span>Haqiqiy foydalanuvchilar ({liveProfiles.length})</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">Yagona sessiya ✓</span>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
            {liveProfiles.length === 0 ? (
              <div className="text-center py-3 text-[11px] font-semibold text-slate-400">
                Hozircha boshqa foydalanuvchilar topilmadi
              </div>
            ) : (
              liveProfiles.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center justify-between gap-2 bg-white/70 px-2.5 py-1.5 rounded-xl border border-white/85"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Avatar src={p.avatar} name={p.displayName} size="xs" frame={p.activeFrame} />
                    <div className="min-w-0">
                      <div className="text-[11px] font-extrabold text-slate-900 truncate">{p.displayName}</div>
                      <div className="text-[9.5px] text-slate-500 truncate">ID {p.uid}</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black border bg-emerald-50 text-emerald-700 border-emerald-200 shrink-0">
                    VIP {p.vipLevel || 0}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
