import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Mic, MicOff, MessageCircle, Users, ChevronDown, ChevronUp, Radio } from 'lucide-react';
import { useWorld } from '../context/WorldContext';
import { FRIEND_PRESENCE_LIST, FriendPresence } from '../lib/worldEcosystemData';
import { LiveWaveBars } from './LuxuryBadges';

const STATUS_STYLE: Record<FriendPresence['status'], { dot: string; badge: string }> = {
  ONLINE: { dot: 'bg-emerald-500', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OYINDA: { dot: 'bg-sky-500', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  JANGDA: { dot: 'bg-rose-500', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
  MAYNINGDA: { dot: 'bg-amber-500', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  OVOZLI_SUHBATDA: { dot: 'bg-purple-500', badge: 'bg-purple-50 text-purple-700 border-purple-200' },
  BAND: { dot: 'bg-orange-500', badge: 'bg-orange-50 text-orange-700 border-orange-200' },
  OFFLINE: { dot: 'bg-slate-300', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
};

export const FloatingVoiceBar: React.FC = () => {
  const {
    voiceConnected,
    micEnabled,
    activeVoiceRoomId,
    activeVoiceRoomTitle,
    onlineVoiceCount,
    toggleMic,
  } = useWorld();
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState(false);

  // Don't double-show inside the actual Voice/Video room or Login screen
  if (
    location.pathname.startsWith('/voice/') ||
    location.pathname.startsWith('/video/') ||
    location.pathname === '/login'
  ) {
    return null;
  }

  return (
    <div className="sticky top-0 z-40 bg-white/96 backdrop-blur-md border-b border-slate-200/80 shadow-[0_2px_10px_rgba(15,23,42,0.04)]">
      <div className="px-3 py-1.5 flex items-center justify-between gap-2">
        {/* Left: Active Voice Room Pill */}
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-2 min-w-0 text-left flex-1"
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
              <span className="text-[11px] font-black text-slate-900 truncate">
                Ovozli xona — {activeVoiceRoomTitle}
              </span>
              {expanded ? (
                <ChevronUp className="w-3 h-3 text-slate-400 shrink-0" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
              )}
            </div>
            <div className="text-[9.5px] font-bold text-emerald-600 truncate">
              {onlineVoiceCount} kishi online • Ovozli aloqa faol • {micEnabled ? 'Mikrofon yoqilgan' : 'Mikrofon o‘chiq'}
            </div>
          </div>
        </button>

        {/* Right: Quick Mic & Return to Chat Button */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={toggleMic}
            title={micEnabled ? 'Mikrofonni o‘chirish' : 'Mikrofonni yoqish'}
            className={`p-1.5 rounded-full border transition ${
              micEnabled
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-rose-50 border-rose-200 text-rose-600'
            }`}
          >
            {micEnabled ? <Mic className="w-3.5 h-3.5" /> : <MicOff className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => navigate(`/voice/${activeVoiceRoomId}`)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-extrabold active:scale-95 transition"
          >
            <MessageCircle className="w-3 h-3 text-amber-300" />
            <span>Chatga qaytish</span>
          </button>
        </div>
      </div>

      {/* Expandable Friends Real-Time Presence Drawer (All 7 Statuses from Section 8) */}
      {expanded && (
        <div className="px-3 pb-3 pt-1.5 border-t border-slate-100 bg-slate-50/90 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-black text-slate-800">
              <Users className="w-3.5 h-3.5 text-[#ff3366]" />
              <span>Do‘stlaringiz holati (Ovozli sessiya saqlanadi)</span>
            </div>
            <span className="text-[10px] font-bold text-emerald-600">Yagona sessiya ✓</span>
          </div>

          <div className="space-y-1.5 max-h-52 overflow-y-auto no-scrollbar">
            {FRIEND_PRESENCE_LIST.map((fr) => {
              const st = STATUS_STYLE[fr.status];
              return (
                <div
                  key={fr.id}
                  className="flex items-center justify-between gap-2 bg-white px-2.5 py-1.5 rounded-xl border border-slate-200/70"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="relative shrink-0">
                      <img
                        src={fr.avatar}
                        alt={fr.name}
                        className="w-7 h-7 rounded-full object-cover object-top"
                      />
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${st.dot}`}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-[11px] font-extrabold text-slate-900 truncate">{fr.name}</span>
                        <span className="text-[9px] font-bold text-slate-400">• {fr.rankUz}</span>
                      </div>
                      <div className="text-[9.5px] text-slate-500 truncate">{fr.locationUz}</div>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black border shrink-0 ${st.badge}`}>
                    {fr.statusLabelUz}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
