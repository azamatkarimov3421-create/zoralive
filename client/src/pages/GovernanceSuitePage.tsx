import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Crown,
  Shield,
  Database,
  Users,
  AlertTriangle,
  Lock,
  CheckCircle2,
  Megaphone,
  Link2,
  Server,
  UserCheck,
  Award,
  FileText,
  Ban,
  Calendar,
} from 'lucide-react';
import { useWorld } from '../context/WorldContext';
import { useAuth } from '../context/AuthContext';
import {
  APP_GOVERNANCE_ROLES,
  CONTINENTS_10,
  DATABASE_24_TABLES,
  MILITARY_RANKS_10,
  TECH_STACK_SPECS,
} from '../lib/worldEcosystemData';

type PanelRole = 'OWNER' | 'MANAGER' | 'SUPER_ADMIN' | 'ADMIN' | 'AGENT' | 'HOST' | 'BOSHLOVCHI';

export const GovernanceSuitePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useAuth();
  const {
    state,
    worldCoins,
    promoteRank,
    toggleEmergencyStop,
    toggleManagerPermission,
    addAuditLog,
  } = useWorld();

  const [roleTab, setRoleTab] = useState<PanelRole>('OWNER');
  const [twoFaCode, setTwoFaCode] = useState('');
  const [staffList, setStaffList] = useState([
    { id: 'st-1', name: 'Ulug‘bek M.', role: 'MANAGER', status: 'FAOL' },
    { id: 'st-2', name: 'Azizbek T.', role: 'SUPER_ADMIN', status: 'FAOL' },
    { id: 'st-3', name: 'Sardor K.', role: 'ADMIN', status: 'FAOL' },
    { id: 'st-4', name: 'Abrorbek E.', role: 'AGENT', status: 'FAOL' },
    { id: 'st-5', name: 'Madina R.', role: 'HOST', status: 'FAOL' },
    { id: 'st-6', name: 'Jasur N.', role: 'BOSHLOVCHI', status: 'FAOL' },
  ]);
  const [eventTitle, setEventTitle] = useState('');
  const [events, setEvents] = useState([
    { id: 'ev-1', title: 'Balkon Ajdarho Chempionati (Valtor vs Xaldris)', time: 'Bugun 21:00', players: 64 },
    { id: 'ev-2', title: 'Turon vs Nythera Hudud Urushi', time: 'Ertaga 20:00', players: 120 },
  ]);
  const [complaints, setComplaints] = useState([
    { id: 'cp-1', user: 'user_402', reason: 'Chatda spam xabarlar', status: 'OCHIQ' },
    { id: 'cp-2', user: 'dragon_99', reason: 'Noqonuniy savdo urinishi', status: 'OCHIQ' },
  ]);

  const totalElements = Object.values(state.elements).reduce((a, b) => a + b, 0);
  const currentRankMeta = MILITARY_RANKS_10[state.rankLevel - 1] || MILITARY_RANKS_10[0];

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim()) return;
    setEvents((prev) => [
      { id: `ev-${Date.now()}`, title: eventTitle.trim(), time: 'Hozir e’lon qilindi', players: 12 },
      ...prev,
    ]);
    addAuditLog('Host', 'HOST', `Yangi tadbir/jang jadvali ochildi: ${eventTitle.trim()}`);
    toast('Tadbir va jang jadvali e’lon qilindi! 🎤', 'success');
    setEventTitle('');
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 pb-10">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <div className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              <Crown className="w-4 h-4 text-amber-500" />
              <span>ZoraLive 7-Rolli Boshqaruv Markazi</span>
            </div>
            <div className="text-[10.5px] font-bold text-slate-500">
              Owner • Manager • Super Admin • Admin • Agent • Host • Boshlovchi
            </div>
          </div>
        </div>

        {state.emergencyStopped && (
          <span className="px-2.5 py-1 rounded-full bg-rose-600 text-white text-[10px] font-black animate-pulse">
            TEXNIK TO‘XTATILGAN
          </span>
        )}
      </header>

      <div className="max-w-4xl mx-auto px-3.5 pt-4 space-y-4">
        {/* 7-Role Panel Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
          {APP_GOVERNANCE_ROLES.filter((r) => r.code !== 'ASKAR').map((r) => {
            const active = roleTab === r.code;
            return (
              <button
                key={r.code}
                onClick={() => setRoleTab(r.code as PanelRole)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap border transition flex items-center gap-1.5 ${
                  active
                    ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>{r.badge}</span>
                <span>{r.code === 'OWNER' ? 'Owner (Siz)' : r.titleUz}</span>
              </button>
            );
          })}
        </div>

        {/* 1. OWNER PANEL (SIZNING MAXSUS PANELINGIZ) */}
        {roleTab === 'OWNER' && (
          <div className="space-y-4">
            <div className="rounded-3xl p-4 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white border border-amber-400/40 shadow-lg space-y-3">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                    YAKUNIY VA MUTLAQ EGALIK NAZORATI
                  </span>
                  <h2 className="text-lg font-black mt-1">👑 LOYIHA EGASI — SIZNING PANELINGIZ</h2>
                  <p className="text-xs text-slate-300">
                    Manager sizning ruxsatingizsiz egani o‘zgartira olmaydi. Kritik operatsiyalar 2-bosqichli tasdiqlash (2FA) bilan himoyalangan.
                  </p>
                </div>
              </div>

              {/* Balance Audit Summary */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-amber-200 font-bold">WORLD COIN Audit</div>
                  <div className="text-base font-black">{worldCoins.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-purple-200 font-bold">WORLD GEM Audit</div>
                  <div className="text-base font-black">{state.worldGems.toLocaleString()}</div>
                </div>
                <div className="bg-white/10 rounded-2xl p-2.5 border border-white/10">
                  <div className="text-[10px] text-cyan-200 font-bold">10 Qit’a Elementlari</div>
                  <div className="text-base font-black">{totalElements.toLocaleString()}</div>
                </div>
              </div>
            </div>

            {/* Manager Permissions Control + Emergency Stop with 2FA */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-purple-600" />
                  <span>Manager Vakolatlarini Boshqarish</span>
                </div>
                {(
                  [
                    ['manageAdmins', 'Adminlarni boshqarish'],
                    ['assignAgents', 'Agentlarni tayinlash'],
                    ['controlRooms', 'Chat va xonalarni nazorat qilish'],
                    ['viewReports', 'Hisobot va shikoyatlarni ko‘rish'],
                  ] as const
                ).map(([k, lbl]) => (
                  <div key={k} className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">{lbl}</span>
                    <button
                      onClick={() => toggleManagerPermission(k)}
                      className={`px-3 py-1 rounded-full text-[10px] font-black ${
                        state.managerPermissions[k]
                          ? 'bg-emerald-500 text-white'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {state.managerPermissions[k] ? 'RUXSAT BOR' : 'O‘CHIQ'}
                    </button>
                  </div>
                ))}
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-bold text-rose-600">Loyiha Egasini (Owner) o‘zgartirish</span>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-black">
                    🔒 TAQIQLANGAN
                  </span>
                </div>
              </div>

              {/* 2FA Emergency Technical Stop */}
              <div className="bg-white rounded-3xl p-4 border border-rose-200 space-y-3">
                <div className="text-xs font-black text-rose-600 flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Favqulodda Texnik To‘xtatish (2-Bosqichli Tasdiqlash)</span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium">
                  Kritik moliyaviy yoki tizim to‘xtatish amaliyoti uchun 2FA kodini kiriting (Demo kod: <b>2026</b>).
                </p>
                <div className="flex gap-2">
                  <input
                    value={twoFaCode}
                    onChange={(e) => setTwoFaCode(e.target.value)}
                    placeholder="2FA kod (2026)"
                    className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs font-bold"
                  />
                  <button
                    onClick={() => {
                      if (toggleEmergencyStop(twoFaCode)) setTwoFaCode('');
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-black text-white ${
                      state.emergencyStopped ? 'bg-emerald-600' : 'bg-rose-600'
                    }`}
                  >
                    {state.emergencyStopped ? 'Qayta yoqish' : 'To‘xtatish'}
                  </button>
                </div>

                {/* Staff Appointment / Removal */}
                <div className="pt-2 border-t border-slate-100 space-y-1.5">
                  <div className="text-[11px] font-black text-slate-800">Xodimlarni tayinlash / olish:</div>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {staffList.map((st) => (
                      <div key={st.id} className="flex items-center justify-between text-[11px] bg-slate-50 px-2.5 py-1.5 rounded-xl">
                        <span className="font-bold">
                          {st.name} <b className="text-indigo-600">({st.role})</b>
                        </span>
                        <button
                          onClick={() => {
                            setStaffList((prev) =>
                              prev.map((x) =>
                                x.id === st.id ? { ...x, status: x.status === 'FAOL' ? 'CHETLATILGAN' : 'FAOL' } : x
                              )
                            );
                            addAuditLog('LOYIHA EGASI (SIZ)', 'OWNER', `${st.name} (${st.role}) holati o‘zgartirildi`, true);
                          }}
                          className={`px-2 py-0.5 rounded-full text-[9.5px] font-black ${
                            st.status === 'FAOL' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                          }`}
                        >
                          {st.status}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Full Audit Log */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2">
              <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-slate-600" />
                <span>Barcha Harakatlar Tarixi (Audit Log)</span>
              </div>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {state.auditLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-[11px] border ${
                      log.critical ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <span className="font-black text-slate-900">{log.actor}</span>{' '}
                      <span className="text-[9.5px] font-bold text-indigo-600">[{log.role}]</span> — {log.actionUz}
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 shrink-0">{log.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 2. MANAGER PANEL */}
        {roleTab === 'MANAGER' && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-slate-900">🏛️ Manager Operatsion Paneli</h3>
                  <p className="text-xs text-slate-500">Barcha bo‘limlar, davlatlar holati, adminlar va agentlar boshqaruvi</p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black">
                  Owner tomonidan tayinlangan
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Davlatlar</div>
                  <div className="text-lg font-black text-slate-900">{state.kingdoms.length}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Qit’alar</div>
                  <div className="text-lg font-black text-slate-900">{CONTINENTS_10.length}</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Ovozli Xonalar</div>
                  <div className="text-lg font-black text-emerald-600">185 faol</div>
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div className="text-[10px] font-bold text-slate-400">Shikoyatlar</div>
                  <div className="text-lg font-black text-rose-600">{complaints.filter((c) => c.status === 'OCHIQ').length} ochiq</div>
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="text-xs font-black text-slate-800">Davlatlar Holati Monitoringi:</div>
                {state.kingdoms.map((k) => (
                  <div key={k.id} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                    <span className="font-black">
                      {k.flag} {k.nameUz}
                    </span>
                    <span className="font-bold text-slate-600">
                      {k.soldiersCount} askar • {k.agentsCount} agent • {k.territoriesCount} hudud
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. SUPER ADMIN PANEL (TECHNICAL + 24 DATABASE TABLES) */}
        {roleTab === 'SUPER_ADMIN' && (
          <div className="space-y-3">
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Server className="w-5 h-5 text-blue-600" />
                <div>
                  <h3 className="text-base font-black text-slate-900">🛡️ Super Admin — Texnik Tizim va Server Holati</h3>
                  <p className="text-xs text-slate-500">Yagona akkaunt sessiyasi: Chat + Ovozli xona + World + Jang</p>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {TECH_STACK_SPECS.map((t) => (
                  <div key={t.systemUz} className="p-2.5 rounded-2xl bg-slate-50 border border-slate-200/70">
                    <div className="text-[9.5px] font-bold text-slate-400">{t.systemUz}</div>
                    <div className="text-xs font-black text-slate-900 mt-0.5">{t.tech}</div>
                    <span className="inline-block mt-1 px-1.5 py-[1px] rounded-full bg-emerald-100 text-emerald-700 text-[8.5px] font-black">
                      ● {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 24 Database Tables Schema Inspector (Section 12) */}
            <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Database className="w-4 h-4 text-indigo-600" />
                  <span>PostgreSQL Ma’lumotlar Bazasi — {DATABASE_24_TABLES.length} ta O‘zaro Bog‘langan Jadval</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600">Sinxronlangan ✓</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-80 overflow-y-auto">
                {DATABASE_24_TABLES.map((tbl) => (
                  <div
                    key={tbl.table}
                    className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 text-[11px]"
                  >
                    <div>
                      <span className="font-black text-indigo-700">{tbl.table}</span>
                      <div className="text-[10px] text-slate-500">{tbl.purposeUz}</div>
                    </div>
                    <span className="text-[10px] font-black text-slate-700 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0">
                      {tbl.rows.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 4. ADMIN PANEL */}
        {roleTab === 'ADMIN' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" /> ⚖️ Admin Moderatsiya Paneli
            </h3>
            <div className="space-y-2">
              {complaints.map((cp) => (
                <div key={cp.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
                  <div>
                    <div className="text-xs font-black text-slate-900">Foydalanuvchi: {cp.user}</div>
                    <div className="text-[11px] text-slate-500">Sabab: {cp.reason}</div>
                  </div>
                  {cp.status === 'OCHIQ' ? (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          setComplaints((prev) => prev.map((x) => (x.id === cp.id ? { ...x, status: 'OGOHLANTIRILDI' } : x)));
                          addAuditLog('Admin', 'ADMIN', `${cp.user} ga ogohlantirish berildi`);
                          toast('Ogohlantirish yuborildi', 'info');
                        }}
                        className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-black"
                      >
                        Ogohlantirish
                      </button>
                      <button
                        onClick={() => {
                          setComplaints((prev) => prev.map((x) => (x.id === cp.id ? { ...x, status: 'BLOKLANDI' } : x)));
                          addAuditLog('Admin', 'ADMIN', `${cp.user} chatdan bloklandi`);
                          toast('Foydalanuvchi bloklandi', 'success');
                        }}
                        className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center gap-1"
                      >
                        <Ban className="w-3 h-3" /> Bloklash
                      </button>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black">
                      {cp.status}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. AGENT PANEL (MILITARY RANKS 1-10 & KINGDOM ARMY) */}
        {roleTab === 'AGENT' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-amber-500" /> 🎖️ Agent — Davlat va Harbiy Unvonlar Paneli
                </h3>
                <p className="text-xs text-slate-500">
                  Joriy unvon: <b>{currentRankMeta.badge} {currentRankMeta.level}. {currentRankMeta.titleUz}</b> ({state.serviceXp} XP)
                </p>
              </div>
            </div>

            {/* All 10 Military Ranks Table (Section 7) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MILITARY_RANKS_10.map((r) => {
                const isCur = state.rankLevel === r.level;
                return (
                  <div
                    key={r.level}
                    className={`flex items-center justify-between p-2.5 rounded-2xl border ${
                      isCur ? 'bg-amber-50 border-amber-400' : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-black text-slate-900">
                        {r.level}. {r.badge} {r.titleUz}
                      </div>
                      <div className="text-[10px] text-slate-500">{r.perksUz}</div>
                    </div>
                    <button
                      disabled={isCur}
                      onClick={() => promoteRank(r.level, 'Agent Paneli')}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-black shrink-0 ${
                        isCur ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                      }`}
                    >
                      {isCur ? 'Joriy ✓' : 'Berish'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 6. HOST PANEL (EVENTS & BATTLE SCHEDULE) */}
        {roleTab === 'HOST' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <Calendar className="w-5 h-5 text-rose-500" /> 🎤 Host — Tadbirlar va Jang Jadvali Paneli
            </h3>
            <form onSubmit={handleCreateEvent} className="flex gap-2">
              <input
                value={eventTitle}
                onChange={(e) => setEventTitle(e.target.value)}
                placeholder="Yangi Balkon Jangi yoki Turnir nomi..."
                className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs"
              />
              <button type="submit" className="px-4 py-2 rounded-xl btn-brand text-xs font-black">
                Tadbir ochish
              </button>
            </form>
            <div className="space-y-2">
              {events.map((ev) => (
                <div key={ev.id} className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-100">
                  <div>
                    <div className="text-xs font-black text-slate-900">{ev.title}</div>
                    <div className="text-[10.5px] text-slate-500">🕒 {ev.time} • 👥 {ev.players} ishtirokchi</div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-rose-50 text-[#ff3366] text-[10px] font-black flex items-center gap-1">
                    <Megaphone className="w-3 h-3" /> E’lon qilingan
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. BOSHLOVCHI PANEL (RECRUITING & REFERRAL) */}
        {roleTab === 'BOSHLOVCHI' && (
          <div className="bg-white rounded-3xl p-4 border border-slate-200 space-y-3">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5">
              <UserCheck className="w-5 h-5 text-sky-500" /> 📣 Boshlovchi — Yangi Askarlar Jalb Qilish Paneli
            </h3>
            <div className="p-3 rounded-2xl bg-sky-50 border border-sky-200 flex items-center justify-between gap-2">
              <div className="min-w-0">
                <div className="text-[10px] font-black text-sky-700">SHAXSIY TAKLIF HAVOLASI</div>
                <div className="text-xs font-bold text-slate-900 truncate">
                  https://zoralive.vercel.app/?ref=BOSHLOVCHI_TURON_77
                </div>
              </div>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText('https://zoralive.vercel.app/?ref=BOSHLOVCHI_TURON_77');
                  toast('Taklif havolasi nusxalandi! 📋', 'success');
                }}
                className="px-3 py-1.5 rounded-full bg-sky-600 text-white text-[10.5px] font-black shrink-0 flex items-center gap-1"
              >
                <Link2 className="w-3.5 h-3.5" /> Nusxalash
              </button>
            </div>

            <div className="space-y-1.5">
              {[
                { name: 'Bekzod R.', kingdom: 'Turon Imperiyasi', rank: 'Rekrut', status: 'Tasdiqlangan' },
                { name: 'Shahlo M.', kingdom: 'Sylvanna Zumrad Davlati', rank: 'Oddiy askar', status: 'Tasdiqlangan' },
                { name: 'Timur A.', kingdom: 'Turon Imperiyasi', rank: 'Rekrut', status: 'Ro‘yxatda' },
              ].map((rec, i) => (
                <div key={i} className="flex items-center justify-between p-2.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs">
                  <div>
                    <div className="font-black text-slate-900">{rec.name}</div>
                    <div className="text-[10px] text-slate-500">🏰 {rec.kingdom} • {rec.rank}</div>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-black flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {rec.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
